#!/usr/bin/env node

/**
 * BRUTAL V3 - Precise Syntax Fixer
 * Careful, targeted fixes for specific syntax errors
 */

import { promises as fs } from 'fs';
import path from 'path';

const frameworkDir = '/workspaces/web/framework-v3';

// Precise patterns for specific syntax issues
const PRECISE_FIXES = [
    // Fix misplaced semicolons
    {
        name: 'Fix array/string semicolons',
        pattern: /('([^']*)';|"([^"]*)";|\];\s*)/g,
        replacement: (match, singleQuote, doubleQuote, array) => {
            if (array) return array.replace(';', '');
            if (singleQuote) return singleQuote.replace(';', '');
            if (doubleQuote) return doubleQuote.replace(';', '');
            return match.replace(';', '');
        }
    },
    
    // Fix object literal opening braces
    {
        name: 'Fix object literal braces',
        pattern: /(\w+\s*:\s*){/g,
        replacement: '$1{'
    },
    
    // Fix function parameter objects  
    {
        name: 'Fix function parameter objects',
        pattern: /(\(\s*){/g,
        replacement: '$1{'
    },
    
    // Fix incomplete if conditions
    {
        name: 'Fix incomplete if statements',
        pattern: /if\s*\(\s*([^)]*)\s*\)\s*{([^}]*)\s*\)/g,
        replacement: 'if ($1) {\n$2\n}'
    },
    
    // Fix extra parentheses
    {
        name: 'Fix extra closing parentheses',
        pattern: /(\w+\([^)]*\))\);/g,
        replacement: '$1;'
    },
    
    // Fix template literals
    {
        name: 'Fix broken template literals',
        pattern: /``([^`]*)/g,
        replacement: '`$1`'
    }
];

async function getAllJSFiles(dir) {
    const files = [];
    
    async function traverse(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
                await traverse(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    }
    
    await traverse(dir);
    return files;
}

async function fixFilePrecisely(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let fixes = 0;
        const originalContent = content;
        
        // Apply each precise fix
        for (const fix of PRECISE_FIXES) {
            const before = content;
            if (typeof fix.replacement === 'function') {
                content = content.replace(fix.pattern, fix.replacement);
            } else {
                content = content.replace(fix.pattern, fix.replacement);
            }
            if (content !== before) {
                fixes++;
            }
        }
        
        // Additional manual fixes for common patterns
        
        // Fix object syntax: } { -> },
        content = content.replace(/}\s*{/g, '}, {');
        
        // Fix array syntax: ] { -> ], {
        content = content.replace(/]\s*{/g, '], {');
        
        // Fix function calls: func} -> func()
        content = content.replace(/(\w+)}/g, '$1()');
        
        // Fix semicolon after quotes
        content = content.replace(/'([^']*)\s*;\s*'/g, "'$1'");
        content = content.replace(/"([^"]*)\s*;\s*"/g, '"$1"');
        
        // Fix object property syntax
        content = content.replace(/(\w+)\s*:\s*([^,}]*)\s*;/g, '$1: $2,');
        
        // Only save if we made changes and they look reasonable
        if (content !== originalContent && content.length > originalContent.length * 0.8) {
            await fs.writeFile(filePath, content, 'utf8');
            return fixes;
        }
        
        return 0;
    } catch (error) {
        console.error(`Error fixing ${filePath}:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('🎯 BRUTAL V3 Precise Syntax Fixer Starting...');
    
    const files = await getAllJSFiles(frameworkDir);
    console.log(`Found ${files.length} JavaScript files`);
    
    let totalFixes = 0;
    let filesFixed = 0;
    
    for (const file of files) {
        const fixes = await fixFilePrecisely(file);
        if (fixes > 0) {
            filesFixed++;
            totalFixes += fixes;
            console.log(`✅ Fixed ${fixes} issues in ${path.relative(frameworkDir, file)}`);
        }
    }
    
    console.log(`\n🎯 Precise Fix Complete:`);
    console.log(`   Files processed: ${files.length}`);
    console.log(`   Files modified: ${filesFixed}`);
    console.log(`   Total fixes applied: ${totalFixes}`);
    
    // Run targeted syntax check
    console.log('\n🔍 Running targeted syntax validation...');
    let validFiles = 0;
    
    for (const file of files.slice(0, 20)) {
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            await execAsync(`node --check "${file}"`);
            validFiles++;
        } catch (error) {
            console.log(`❌ ${path.relative(frameworkDir, file)}: ${error.message.split('\n')[0]}`);
        }
    }
    
    console.log(`Syntax check (20 files): ${validFiles}/20 passed`);
}

main().catch(console.error);