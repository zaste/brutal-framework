#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive pattern fixes
const patterns = [
    // Fix {) pattern
    { regex: /\{\)/gm, replacement: '{' },
    
    // Fix missing closing parentheses in common contexts
    { regex: /Math\.(sqrt|pow|max|min|floor|ceil|round|abs)\([^)]*$/gm, replacement: match => match + ')' },
    { regex: /\.addEventListener\([^)]*$/gm, replacement: match => match + ')' },
    { regex: /\.removeEventListener\([^)]*$/gm, replacement: match => match + ')' },
    { regex: /new (Float32Array|Uint8Array|Array|Map|Set)\([^)]*$/gm, replacement: match => match + ')' },
    { regex: /Array\.from\([^)]*$/gm, replacement: match => match + ')' },
    
    // Fix double closing parentheses
    { regex: /\)\)\s*;/g, replacement: ');' },
    { regex: /\.bind\(this\)\)\);/g, replacement: '.bind(this));' },
    
    // Fix constructor syntax
    { regex: /constructor\s*\([^)]*\)\s*\)/gm, replacement: match => match.replace(/\)$/, '{') },
    
    // Fix method definitions
    { regex: /^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*\)/gm, replacement: match => match.replace(/\)$/, '{') },
    
    // Fix arrow functions
    { regex: /=>\s*\)/g, replacement: '=> {' },
    
    // Fix template literal backticks after code
    { regex: /}\s*`\s*$/gm, replacement: '}' },
    { regex: /;\s*`\s*$/gm, replacement: ';' },
    
    // Fix for loops
    { regex: /for\s*\([^)]*\)\s*{([^}]*)}([^{]*){/gm, replacement: 'for ($1) { $2 }' },
    
    // Fix object entries
    { regex: /Object\.entries\([^)]+\)\s*{\s*{/gm, replacement: match => match.replace('{ {', ') {') },
    
    // Fix if statements
    { regex: /if\s*\([^)]+\)\s*{\s*{/gm, replacement: match => match.replace('{ {', ') {') },
    
    // Fix trailing "No newline at end of file"
    { regex: /\d+→ No newline at end of file\s*$/m, replacement: '' }
];

async function fixFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let changesMade = false;
        
        for (const pattern of patterns) {
            const before = content;
            content = content.replace(pattern.regex, pattern.replacement);
            if (before !== content) {
                changesMade = true;
            }
        }
        
        // Ensure file ends with newline
        if (!content.endsWith('\n')) {
            content += '\n';
            changesMade = true;
        }
        
        if (changesMade) {
            await fs.writeFile(filePath, content, 'utf8');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

async function findBrokenFiles() {
    const files = execSync('find /workspaces/web -name "*.js" -type f | grep -v node_modules', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
    
    const broken = [];
    
    for (const file of files) {
        try {
            execSync(`node --check "${file}"`, { stdio: 'pipe' });
        } catch (error) {
            broken.push(file);
        }
    }
    
    return broken;
}

async function main() {
    console.log('=== Fixing All Remaining Syntax Errors ===\n');
    
    const brokenFiles = await findBrokenFiles();
    console.log(`Found ${brokenFiles.length} files with syntax errors\n`);
    
    let fixedCount = 0;
    let stillBrokenCount = 0;
    
    for (const file of brokenFiles) {
        process.stdout.write(`Fixing ${path.basename(file)}... `);
        
        const fixed = await fixFile(file);
        
        if (fixed) {
            // Verify the fix
            try {
                execSync(`node --check "${file}"`, { stdio: 'pipe' });
                console.log('✓');
                fixedCount++;
            } catch (error) {
                console.log('✗ (still broken)');
                stillBrokenCount++;
            }
        } else {
            console.log('- (no changes)');
        }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Fixed: ${fixedCount} files`);
    console.log(`Still broken: ${stillBrokenCount} files`);
    
    // Final count
    const finalBroken = await findBrokenFiles();
    console.log(`\nTotal files with errors: ${finalBroken.length}`);
    
    if (finalBroken.length > 0 && finalBroken.length < 20) {
        console.log('\nRemaining broken files:');
        finalBroken.forEach(file => console.log(`  - ${file}`));
    }
}

main().catch(console.error);