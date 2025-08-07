#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive pattern fixes for all remaining syntax errors
const syntaxPatterns = [
    // Fix malformed object literals
    {
        name: 'object-literal-parenthesis',
        pattern: /\{\)/gm,
        replacement: '{',
        description: 'Fix {) to {'
    },
    {
        name: 'object-literal-semicolon',
        pattern: /\{;/gm,
        replacement: '{',
        description: 'Fix {; to {'
    },
    
    // Fix missing closing parentheses in various contexts
    {
        name: 'missing-paren-after-arrow',
        pattern: /=>\s*{\s*$/gm,
        replacement: '=> {',
        description: 'Fix arrow function missing closing'
    },
    {
        name: 'missing-paren-math-operations',
        pattern: /Math\.(max|min|floor|ceil|round|abs|sqrt|pow)\([^)]+$/gm,
        replacement: (match) => match + ')',
        description: 'Fix Math operations missing closing parenthesis'
    },
    {
        name: 'missing-paren-array-methods',
        pattern: /\.(map|filter|reduce|forEach|find|some|every)\([^)]+$/gm,
        replacement: (match) => match + ')',
        description: 'Fix array methods missing closing parenthesis'
    },
    
    // Fix double closing parentheses
    {
        name: 'double-paren-bind',
        pattern: /\.bind\(this\)\)\);/g,
        replacement: '.bind(this));',
        description: 'Fix double closing after bind'
    },
    {
        name: 'double-paren-general',
        pattern: /\)\)\s*;/g,
        replacement: ');',
        description: 'Fix general double closing parentheses'
    },
    
    // Fix constructor/class syntax
    {
        name: 'constructor-brace',
        pattern: /constructor\s*\([^)]*\)\s*\)/g,
        replacement: (match) => match.replace(/\)$/, '{'),
        description: 'Fix constructor ending with ) instead of {'
    },
    {
        name: 'class-method-brace',
        pattern: /^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*\)/gm,
        replacement: (match) => match.replace(/\)$/, '{'),
        description: 'Fix method ending with ) instead of {'
    },
    
    // Fix template literal issues
    {
        name: 'unclosed-template-literal',
        pattern: /`[^`]*$/gm,
        replacement: (match) => match + '`',
        description: 'Close unclosed template literals'
    },
    
    // Fix object property syntax
    {
        name: 'object-property-colon',
        pattern: /(\w+)\s*;\s*(\w+|"[^"]+"|'[^']+')\s*:/gm,
        replacement: '$1: $2:',
        description: 'Fix object property semicolon to colon'
    },
    
    // Fix arrow function syntax
    {
        name: 'arrow-function-brace',
        pattern: /=>\s*\)/g,
        replacement: '=> {',
        description: 'Fix arrow function with ) instead of {'
    },
    
    // Fix array/object destructuring
    {
        name: 'destructuring-brace',
        pattern: /const\s*{\s*\)/gm,
        replacement: 'const {',
        description: 'Fix destructuring with {)'
    },
    {
        name: 'destructuring-bracket',
        pattern: /const\s*\[\s*\)/gm,
        replacement: 'const [',
        description: 'Fix array destructuring with [)'
    }
];

// Context-aware fixes for complex patterns
async function applyContextAwareFixes(content, filePath) {
    let fixed = content;
    
    // Fix incomplete function calls by counting parentheses
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let openCount = (line.match(/\(/g) || []).length;
        let closeCount = (line.match(/\)/g) || []).length;
        
        if (openCount > closeCount && !line.trim().endsWith(',') && !line.trim().endsWith('{')) {
            // Check if it's not a multi-line statement
            if (i + 1 < lines.length && !lines[i + 1].trim().startsWith('.')) {
                lines[i] = line + ')'.repeat(openCount - closeCount);
            }
        }
    }
    fixed = lines.join('\n');
    
    // Fix object literal issues in specific contexts
    fixed = fixed.replace(/this\._\w+\.set\([^,]+,\s*{\)/gm, (match) => {
        return match.replace('{)', '{');
    });
    
    // Fix constructor parameter lists
    fixed = fixed.replace(/super\(\s*\)/g, 'super()');
    
    // Fix method definitions in classes
    fixed = fixed.replace(/^(\s*)(async\s+)?(\w+)\s*\([^)]*\)\s*{\s*\)/gm, (match, indent, async, methodName) => {
        return `${indent}${async || ''}${methodName}(${match.match(/\(([^)]*)\)/)[1]}) {`;
    });
    
    return fixed;
}

async function fixFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        let fixed = content;
        let changesMade = false;
        
        // Apply all pattern-based fixes
        for (const pattern of syntaxPatterns) {
            const before = fixed;
            fixed = fixed.replace(pattern.pattern, pattern.replacement);
            if (before !== fixed) {
                changesMade = true;
                console.log(`  Applied ${pattern.name} fix`);
            }
        }
        
        // Apply context-aware fixes
        const beforeContext = fixed;
        fixed = await applyContextAwareFixes(fixed, filePath);
        if (beforeContext !== fixed) {
            changesMade = true;
            console.log(`  Applied context-aware fixes`);
        }
        
        if (changesMade) {
            await fs.writeFile(filePath, fixed, 'utf8');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

async function findBrokenFiles() {
    console.log('Finding all JavaScript files with syntax errors...');
    
    const allFiles = [];
    
    async function scanDir(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await scanDir(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                allFiles.push(fullPath);
            }
        }
    }
    
    await scanDir('/workspaces/web');
    
    const brokenFiles = [];
    for (const file of allFiles) {
        try {
            execSync(`node --check "${file}"`, { stdio: 'pipe' });
        } catch (error) {
            brokenFiles.push(file);
        }
    }
    
    return brokenFiles;
}

async function main() {
    console.log('=== Advanced Syntax Error Fixer ===\n');
    
    // Find all broken files
    const brokenFiles = await findBrokenFiles();
    console.log(`Found ${brokenFiles.length} files with syntax errors\n`);
    
    // Fix each file
    let fixedCount = 0;
    for (const file of brokenFiles) {
        console.log(`Processing: ${file}`);
        const fixed = await fixFile(file);
        if (fixed) {
            fixedCount++;
            
            // Verify the fix
            try {
                execSync(`node --check "${file}"`, { stdio: 'pipe' });
                console.log(`  ✓ Fixed successfully!\n`);
            } catch (error) {
                console.log(`  ✗ Still has errors after fix\n`);
            }
        } else {
            console.log(`  - No patterns matched\n`);
        }
    }
    
    console.log(`\nFixed ${fixedCount} files`);
    
    // Final check
    console.log('\nRunning final syntax check...');
    const stillBroken = await findBrokenFiles();
    console.log(`${stillBroken.length} files still have syntax errors`);
    
    if (stillBroken.length > 0) {
        console.log('\nFiles that still need manual fixing:');
        stillBroken.forEach(file => console.log(`  - ${file}`));
    }
}

main().catch(console.error);