#!/usr/bin/env node

/**
 * BRUTAL V3 - Ultimate Syntax Fixer
 * Aggressive fix for all remaining syntax patterns
 */

import { promises as fs } from 'fs';
import path from 'path';

const frameworkDir = '/workspaces/web/framework-v3';

// Comprehensive pattern fixes
const ULTIMATE_PATTERNS = [
    // Object literal fixes - most critical
    {
        name: 'Object literal syntax fix',
        pattern: /(\w+\s*:\s*){([^}]*)/g,
        replacement: '$1{$2'
    },
    {
        name: 'Object literal opening brace fix',
        pattern: /(\w+\s*=\s*){([^}]*)/g,
        replacement: '$1{$2'
    },
    {
        name: 'Function parameter object fix',
        pattern: /(\(\s*){([^}]*)/g,
        replacement: '$1{$2'
    },
    {
        name: 'Configuration object fix',
        pattern: /(config\s*=\s*){([^}]*)/g,
        replacement: '$1{$2'
    },
    
    // Template literal fixes
    {
        name: 'Template literal fix',
        pattern: /```([^`]*)/g,
        replacement: '`$1`'
    },
    {
        name: 'Broken template literal',
        pattern: /```\s*\n/g,
        replacement: '`\n'
    },
    
    // Parentheses fixes
    {
        name: 'Missing closing parenthesis',
        pattern: /(\w+\([^)]*);/g,
        replacement: '$1);'
    },
    {
        name: 'Extra closing parenthesis',
        pattern: /(\w+\([^)]*\))\);/g,
        replacement: '$1;'
    },
    
    // Arrow function fixes
    {
        name: 'Arrow function parameter fix',
        pattern: /=>\s*{([^}]*\s*)\)/g,
        replacement: '=> {$1}'
    },
    
    // For loop fixes
    {
        name: 'For loop iterator fix',
        pattern: /for\s*\(\s*(\w+)\s*{([^}]*)/g,
        replacement: 'for ($1 of $2'
    },
    {
        name: 'For of loop fix',
        pattern: /for\s*\(\s*const\s+(\w+)\s+of\s+([^)]*\s*)\)\s*{([^}]*)\s*\)\s*{/g,
        replacement: 'for (const $1 of $2) {\n$3\n}'
    },
    
    // Conditional fixes
    {
        name: 'If statement condition fix',
        pattern: /if\s*\(\s*([^)]*)\s*\)\s*{([^}]*)\s*\)/g,
        replacement: 'if ($1) {\n$2\n}'
    },
    
    // Method call fixes
    {
        name: 'Method call syntax fix',
        pattern: /(\w+)\.(\w+)\(\s*{([^}]*)/g,
        replacement: '$1.$2({$3'
    },
    
    // Array destructuring fixes
    {
        name: 'Array destructuring fix',
        pattern: /const\s*\[\s*([^\]]*)\s*\]\s*=\s*([^;]*);([^}]*)/g,
        replacement: 'const [$1] = $2;'
    },
    
    // Import/export fixes
    {
        name: 'Import statement fix',
        pattern: /import\s*{([^}]*);/g,
        replacement: 'import {$1};'
    },
    
    // Function declaration fixes
    {
        name: 'Function parameter destructuring fix',
        pattern: /function\s+(\w+)\s*\(\s*{([^}]*)\s*\)\s*{/g,
        replacement: 'function $1({$2}) {'
    },
    
    // Class method fixes
    {
        name: 'Class method parameter fix',
        pattern: /(\w+)\s*\(\s*{([^}]*)\s*\)\s*{/g,
        replacement: '$1({$2}) {'
    },
    
    // Semicolon fixes
    {
        name: 'Missing semicolon after brace',
        pattern: /}([^;,}\s])/g,
        replacement: '};$1'
    },
    
    // Comma fixes
    {
        name: 'Missing comma in object literal',
        pattern: /(\w+:\s*[^,}\n]*)\n(\s*\w+:)/g,
        replacement: '$1,\n$2'
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

async function fixFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let fixes = 0;
        
        // Apply all patterns multiple times for overlapping issues
        for (let iteration = 0; iteration < 3; iteration++) {
            for (const pattern of ULTIMATE_PATTERNS) {
                const before = content;
                content = content.replace(pattern.pattern, pattern.replacement);
                if (content !== before) {
                    fixes++;
                }
            }
        }
        
        // Additional specific fixes based on common error patterns
        
        // Fix common object literal patterns
        content = content.replace(/(\w+)\s*:\s*{([^}]*)\s*\)\s*{/g, '$1: {$2},');
        content = content.replace(/(\w+)\s*:\s*{([^}]*)\s*;/g, '$1: {$2}');
        
        // Fix method calls with object parameters
        content = content.replace(/(\w+)\(\s*{([^}]*)\s*;/g, '$1({$2});');
        
        // Fix array/object destructuring
        content = content.replace(/const\s*{([^}]*)\s*\)\s*=/g, 'const {$1} =');
        content = content.replace(/const\s*\[([^\]]*)\s*\)\s*=/g, 'const [$1] =');
        
        // Fix for loops specifically
        content = content.replace(/for\s*\(\s*const\s+(\w+)\s+{([^}]*)/g, 'for (const $1 of $2');
        content = content.replace(/for\s*\(\s*(\w+)\s+{([^}]*)/g, 'for ($1 of $2');
        
        // Fix if conditions
        content = content.replace(/if\s*\(\s*([^)]*)\s*\)\s*{([^}]*)\s*\)/g, 'if ($1) {\n    $2\n}');
        
        // Fix function parameters
        content = content.replace(/function\s+(\w+)\s*\(\s*{([^}]*)\s*\)/g, 'function $1({$2})');
        
        // Save if changes were made
        if (fixes > 0) {
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
    console.log('🚀 BRUTAL V3 Ultimate Syntax Fixer Starting...');
    
    const files = await getAllJSFiles(frameworkDir);
    console.log(`Found ${files.length} JavaScript files`);
    
    let totalFixes = 0;
    let filesFixed = 0;
    
    for (const file of files) {
        const fixes = await fixFile(file);
        if (fixes > 0) {
            filesFixed++;
            totalFixes += fixes;
            console.log(`✅ Fixed ${fixes} issues in ${path.relative(frameworkDir, file)}`);
        }
    }
    
    console.log(`\n🎯 Ultimate Fix Complete:`);
    console.log(`   Files processed: ${files.length}`);
    console.log(`   Files modified: ${filesFixed}`);
    console.log(`   Total fixes applied: ${totalFixes}`);
    
    // Run syntax check
    console.log('\n🔍 Running syntax validation...');
    let syntaxErrors = 0;
    
    for (const file of files.slice(0, 10)) {
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            await execAsync(`node --check "${file}"`);
        } catch (error) {
            syntaxErrors++;
        }
    }
    
    console.log(`Syntax check sample (10 files): ${10 - syntaxErrors}/10 passed`);
}

main().catch(console.error);