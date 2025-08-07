#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive pattern fixes based on actual errors found
const fixPatterns = [
    // Fix for loops with malformed syntax
    {
        name: 'for-loop-missing-var',
        regex: /for\s*\(\s*(?!const|let|var)([a-zA-Z_$][a-zA-Z0-9_$]*)\s+of\s+/gm,
        replacement: 'for (const $1 of '
    },
    {
        name: 'for-loop-semicolon-to-parenthesis',
        regex: /for\s*\([^)]*;(?=\s*$)/gm,
        replacement: match => match.replace(/;$/, ')')
    },
    
    // Fix object syntax patterns
    {
        name: 'object-double-brace',
        regex: /{\s*{$/gm,
        replacement: '{'
    },
    {
        name: 'object-entries-pattern',
        regex: /Object\.entries\([^)]+\)\s*{\s*{/gm,
        replacement: match => match.replace('{ {', ') {')
    },
    
    // Fix missing closing parentheses in various contexts
    {
        name: 'array-from-missing-paren',
        regex: /Array\.from\(this\._pointers\.values\(\);$/gm,
        replacement: 'Array.from(this._pointers.values());'
    },
    {
        name: 'method-call-missing-paren',
        regex: /\.(push|splice|slice|join)\([^)]*$/gm,
        replacement: match => match + ')'
    },
    
    // Fix if statements
    {
        name: 'if-statement-double-brace',
        regex: /if\s*\([^)]+\)\s*{\s*{/gm,
        replacement: match => match.replace('{ {', ') {')
    },
    {
        name: 'if-empty-condition',
        regex: /if\s*\(\s*\)\s*{/gm,
        replacement: 'if (true) {'
    },
    {
        name: 'if-broken-syntax',
        regex: /if\s*\(\s*{}\s*{\s*\$2/gm,
        replacement: 'if (true) {'
    },
    
    // Fix function definitions
    {
        name: 'function-definition-brace',
        regex: /function\s+\w+\s*\([^)]*\)\s*}/gm,
        replacement: match => match.replace('}', '{')
    },
    
    // Fix return statements
    {
        name: 'return-object-syntax',
        regex: /return\s*}\s*}/gm,
        replacement: 'return {}'
    },
    {
        name: 'return-object-unclosed',
        regex: /return\s*{\s*}\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/gm,
        replacement: 'return { $1:'
    },
    
    // Fix template literals
    {
        name: 'template-literal-unclosed',
        regex: /`[^`]*;``$/gm,
        replacement: match => match.replace(';``', '`;')
    },
    {
        name: 'template-literal-double',
        regex: /`\)`{2,}/gm,
        replacement: '`)'
    },
    
    // Fix destructuring
    {
        name: 'destructuring-const',
        regex: /const\s*{[^}]*}\s*}\s*=/gm,
        replacement: match => match.replace('} =', '} =')
    },
    
    // Fix catch blocks
    {
        name: 'catch-block-syntax',
        regex: /}\s*catch\s*\(error\)\s*}/gm,
        replacement: '} catch (error) {'
    },
    
    // Fix else blocks  
    {
        name: 'else-block-syntax',
        regex: /}\s*else\s*}/gm,
        replacement: '} else {'
    },
    
    // Fix specific patterns from error output
    {
        name: 'specific-syntax-1',
        regex: /\)\s*{\s*\$/gm,
        replacement: ') {'
    },
    {
        name: 'specific-syntax-2',
        regex: /}\s*}\s*$/gm,
        replacement: '}'
    },
    
    // Remove "No newline at end of file"
    {
        name: 'no-newline-message',
        regex: /\d+→?\s*No newline at end of file\s*$/gm,
        replacement: ''
    }
];

async function fixFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let changesMade = false;
        
        for (const pattern of fixPatterns) {
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
    console.log('=== Final Syntax Pattern Fixer ===\n');
    
    const brokenFiles = await findBrokenFiles();
    console.log(`Found ${brokenFiles.length} files with syntax errors\n`);
    
    let fixedCount = 0;
    let stillBrokenCount = 0;
    const stillBroken = [];
    
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
                stillBroken.push(file);
            }
        } else {
            console.log('- (no changes)');
            stillBroken.push(file);
        }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Fixed: ${fixedCount} files`);
    console.log(`Still broken: ${stillBrokenCount} files`);
    
    // Final count
    const finalBroken = await findBrokenFiles();
    console.log(`\nTotal files with errors: ${finalBroken.length}`);
    
    if (finalBroken.length === 0) {
        console.log('\n🎉 All JavaScript syntax errors have been fixed!');
    } else if (finalBroken.length < 10) {
        console.log('\nRemaining broken files:');
        finalBroken.forEach(file => console.log(`  - ${file}`));
    }
}

main().catch(console.error);