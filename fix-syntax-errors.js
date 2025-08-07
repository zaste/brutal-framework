#!/usr/bin/env node

/**
 * Script to automatically fix common syntax errors in JavaScript files
 * Targets the most common patterns identified:
 * 1. Missing closing parentheses: Math.sqrt(, addEventListener(, etc.
 * 2. Malformed object literals: {) instead of {
 * 3. Double closing parentheses: )); where it should be );
 * 4. Missing closing braces in class methods
 * 5. Unclosed template literals
 */

import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';

const FRAMEWORK_DIR = '/workspaces/web/framework-v3';

// Common patterns to fix
const FIXES = [
    // Fix incomplete parentheses with common patterns
    {
        pattern: /Math\.sqrt\($/gm,
        replacement: 'Math.sqrt()'
    },
    {
        pattern: /addEventListener\($/gm,
        replacement: 'addEventListener()'
    },
    {
        pattern: /\.replace\(\)$/gm,
        replacement: '.replace()'
    },
    {
        pattern: /window\.matchMedia\($/gm,
        replacement: 'window.matchMedia()'
    },
    
    // Fix malformed object literals
    {
        pattern: /\{\)/g,
        replacement: '{'
    },
    {
        pattern: /\(\{/g,
        replacement: '({'
    },
    
    // Fix double closing parentheses where not needed
    {
        pattern: /\)\);(\s*$)/gm,
        replacement: ');$1'
    },
    
    // Fix common missing parentheses in conditionals
    {
        pattern: /if\s*\([^)]+\)\s*\{(\s*\{)/g,
        replacement: 'if ($1) {$2'
    },
    
    // Fix unclosed template literals by looking for backticks without pairs
    {
        pattern: /`([^`]*?)$/gm,
        replacement: '`$1`'
    },
    
    // Fix missing semicolons after variable declarations
    {
        pattern: /^(\s*(?:const|let|var)\s+\w+\s*=\s*[^;]+)$/gm,
        replacement: '$1;'
    }
];

// More complex fixes that need context
function applyContextualFixes(content, filePath) {
    let fixed = content;
    
    // Fix missing closing parentheses in function calls
    fixed = fixed.replace(/(\w+)\(([^)]*?)$/gm, (match, func, args) => {
        // Check if it's a common function that needs closing
        const commonFunctions = ['Math.sqrt', 'Math.floor', 'Math.ceil', 'Math.round', 
                                'addEventListener', 'removeEventListener', 'querySelector',
                                'getElementById', 'getElementsByClassName'];
        
        if (commonFunctions.some(f => match.includes(f))) {
            return `${func}(${args})`;
        }
        return match;
    });
    
    // Fix template literal issues - match backtick at end of line without closing
    fixed = fixed.replace(/`([^`\n]*?)(\n|$)/g, (match, content, ending) => {
        // Count backticks in the line
        const backtickCount = (match.match(/`/g) || []).length;
        if (backtickCount % 2 !== 0) {
            return '`' + content + '`' + ending;
        }
        return match;
    });
    
    // Fix object/array literal issues
    fixed = fixed.replace(/\{(\s*)\)/g, '{$1}');
    fixed = fixed.replace(/\[(\s*)\)/g, '[$1]');
    
    // Fix missing closing braces in objects
    fixed = fixed.replace(/(\{[^}]*?)(\n\s*\w+\s*:)/g, (match, obj, nextProp) => {
        const openBraces = (obj.match(/\{/g) || []).length;
        const closeBraces = (obj.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
            return obj + '}' + nextProp;
        }
        return match;
    });
    
    // Fix specific patterns found in the examples
    // Fix: theme.blurColor} without closing parenthesis
    fixed = fixed.replace(/([a-zA-Z.]+)\}(\s*);/g, '$1});');
    
    // Fix: .replace() with missing arguments
    fixed = fixed.replace(/\.replace\(\)\s*$/gm, '.replace(/pattern/, \'replacement\')');
    
    // Fix: missing closing parenthesis in conditionals
    fixed = fixed.replace(/if\s*\([^)]+\{\s*\{/g, (match) => {
        const openParens = (match.match(/\(/g) || []).length;
        const closeParens = (match.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            return match.replace(/\{\s*\{/, ') { {');
        }
        return match;
    });
    
    // Fix: missing closing for Object.entries
    fixed = fixed.replace(/Object\.entries\([^)]+\)\s*\{\s*\{/g, (match) => {
        return match.replace(/\)\s*\{\s*\{/, ') { {');
    });
    
    // Fix incomplete expressions in template literals
    fixed = fixed.replace(/\$\{([^}]*?)(\n|$)/g, (match, expr, ending) => {
        if (!match.includes('}')) {
            return '${' + expr + '}' + ending;
        }
        return match;
    });
    
    // Fix: missing break statement issues
    fixed = fixed.replace(/break:\s*default:/g, 'break;\n        default:');
    
    // Fix gradient expressions without closing parenthesis
    fixed = fixed.replace(/(gradient\([^)]*?);/g, (match, gradient) => {
        const openParens = (gradient.match(/\(/g) || []).length;
        const closeParens = (gradient.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            return gradient + ');';
        }
        return match;
    });
    
    // Fix Array.from missing closing
    fixed = fixed.replace(/Array\.from\([^)]*?;/g, (match) => {
        const openParens = (match.match(/\(/g) || []).length;
        const closeParens = (match.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            return match.replace(/;/, ');');
        }
        return match;
    });
    
    // Fix JSON.parse missing closing
    fixed = fixed.replace(/JSON\.parse\([^)]*?;/g, (match) => {
        const openParens = (match.match(/\(/g) || []).length;
        const closeParens = (match.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            return match.replace(/;/, ');');
        }
        return match;
    });
    
    // Fix _deepMerge missing opening parenthesis
    fixed = fixed.replace(/this\._deepMerge\(\)\s*\n/g, 'this._deepMerge(\n');
    
    // Fix hex color arithmetic expressions
    fixed = fixed.replace(/\+ \(([^)]+?)\) \* 0x[0-9A-Fa-f]+ \+\)/g, (match, expr) => {
        return match.replace(/\+\)/, '+');
    });
    
    return fixed;
}

// Process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let fixed = content;
        
        // Apply simple pattern fixes
        for (const fix of FIXES) {
            fixed = fixed.replace(fix.pattern, fix.replacement);
        }
        
        // Apply contextual fixes
        fixed = applyContextualFixes(fixed, filePath);
        
        // Only write if changes were made
        if (fixed !== content) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`✅ Fixed: ${path.relative(FRAMEWORK_DIR, filePath)}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Find all JavaScript files recursively
async function findJsFiles(dir) {
    const files = [];
    
    async function walk(currentDir) {
        const entries = await readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
                // Skip certain directories
                if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
                    await walk(fullPath);
                }
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    }
    
    await walk(dir);
    return files;
}

// Main execution
async function main() {
    console.log('🔧 Starting syntax error fixes for framework-v3...\n');
    
    // Find all JavaScript files
    const files = await findJsFiles(FRAMEWORK_DIR);
    
    console.log(`Found ${files.length} JavaScript files to check.\n`);
    
    let fixedCount = 0;
    
    // Process specific files first
    const priorityFiles = [
        '/workspaces/web/framework-v3/02-performance/06-ThemeEngine.js',
        '/workspaces/web/framework-v3/02-performance/10-ThemeSystem.js',
        '/workspaces/web/framework-v3/04-components/ui/LoadingSpinner.js',
        '/workspaces/web/framework-v3/04-components/ui/Notifications.js'
    ];
    
    console.log('Processing priority files first...\n');
    for (const file of priorityFiles) {
        if (fs.existsSync(file)) {
            if (processFile(file)) {
                fixedCount++;
            }
        }
    }
    
    console.log('\nProcessing remaining files...\n');
    
    // Process all other files
    for (const file of files) {
        if (!priorityFiles.includes(file)) {
            if (processFile(file)) {
                fixedCount++;
            }
        }
    }
    
    console.log(`\n✨ Completed! Fixed ${fixedCount} files out of ${files.length} total files.`);
}

// Run the script
main().catch(console.error);