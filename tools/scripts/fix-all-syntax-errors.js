#!/usr/bin/env node

/**
 * BRUTAL Syntax Error Fixer
 * Fixes ALL syntax errors found in the framework
 * NO MERCY - Fixes EVERYTHING
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Patterns to fix based on the analysis
const FIXES = [
    // Missing closing parenthesis in method bindings
    {
        pattern: /\.bind\(this\);/g,
        replacement: '.bind(this));',
        description: 'Missing closing parenthesis in .bind(this)'
    },
    // Missing closing parenthesis in addEventListener
    {
        pattern: /addEventListener\(['"](\w+)['"],\s*this\._(\w+)\.bind\(this\)\s*;/g,
        replacement: 'addEventListener(\'$1\', this._$2.bind(this));',
        description: 'Missing closing parenthesis in addEventListener'
    },
    // Missing closing parenthesis in localeCompare
    {
        pattern: /\.localeCompare\(([^)]+);/g,
        replacement: '.localeCompare($1);',
        description: 'Missing closing parenthesis in localeCompare'
    },
    // Missing closing parenthesis in push
    {
        pattern: /\.push\(([^)]+);$/gm,
        replacement: '.push($1);',
        description: 'Missing closing parenthesis in push'
    },
    // Missing closing parenthesis in get
    {
        pattern: /\.get\(([^)]+);$/gm,
        replacement: '.get($1);',
        description: 'Missing closing parenthesis in get'
    },
    // Missing closing parenthesis in clearTimeout
    {
        pattern: /clearTimeout\(([^)]+);$/gm,
        replacement: 'clearTimeout($1);',
        description: 'Missing closing parenthesis in clearTimeout'
    },
    // Fix broken includes check
    {
        pattern: /text\.includes\('function'\);/g,
        replacement: 'text.includes(\'function\'));',
        description: 'Missing closing parenthesis in includes'
    },
    // Fix gradient.addColorStop
    {
        pattern: /gradient\.addColorStop\(([^,]+),\s*([^;]+);$/gm,
        replacement: 'gradient.addColorStop($1, $2);',
        description: 'Missing closing parenthesis in addColorStop'
    },
    // Fix lines.push with missing parenthesis
    {
        pattern: /lines\.push\(values\.join\(','\);$/gm,
        replacement: 'lines.push(values.join(\',\'));',
        description: 'Missing closing parenthesis in lines.push'
    },
    // Fix window.removeEventListener
    {
        pattern: /window\.removeEventListener\('resize',\s*\(\)\s*=>\s*this\._resizeCanvas\(\);$/gm,
        replacement: 'window.removeEventListener(\'resize\', () => this._resizeCanvas());',
        description: 'Missing closing parenthesis in removeEventListener'
    }
];

// Specific file fixes
const SPECIFIC_FIXES = {
    '01-core/index.js': async (content) => {
        // Fix the import issue - remove the problematic import
        return content.replace(
            /import { BrutalFrameworkEnhancer } from '\.\.\/brutal-framework-alignment\.js';/g,
            '// import { BrutalFrameworkEnhancer } from \'../brutal-framework-alignment.js\'; // REMOVED: File does not exist'
        );
    },
    '03-visual/debug/ComponentTree3D.js': async (content) => {
        // Fix line 297 - extra closing parenthesis
        const lines = content.split('\n');
        if (lines[296] && lines[296].trim() === ');') {
            lines[296] = ''; // Remove the extra line
        }
        return lines.join('\n');
    },
    '03-visual/debug/VisualDebugLayerGPU.js': async (content) => {
        // Fix template string issue
        return content.replace(/}\`\);$/gm, '}`);');
    },
    '04-components/ui/LoadingSpinner.js': async (content) => {
        // Fix broken gradient.addColorStop
        return content.replace(
            /gradient\.addColorStop\(0, theme\.particleColor \+ Math\.floor\(alpha \* 255\)\.toString\(16\);/g,
            'gradient.addColorStop(0, theme.particleColor + Math.floor(alpha * 255).toString(16));'
        );
    },
    '04-components/ui/DataGrid.js': async (content) => {
        // Fix lines.push
        return content.replace(
            /lines\.push\(values\.join\(','\);$/gm,
            'lines.push(values.join(\',\'));'
        );
    },
    '04-components/ui/Notifications.js': async (content) => {
        // Fix window.removeEventListener
        return content.replace(
            /window\.removeEventListener\('resize', \(\) => this\._resizeCanvas\(\);$/gm,
            'window.removeEventListener(\'resize\', () => this._resizeCanvas());'
        );
    }
};

async function findJSFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...await findJSFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

async function fixFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        const relativePath = path.relative(rootDir, filePath);
        
        // Apply specific fixes if available
        const specificFix = SPECIFIC_FIXES[relativePath.replace(/\\/g, '/')];
        if (specificFix) {
            content = await specificFix(content);
        }
        
        // Apply general pattern fixes
        let fixCount = 0;
        for (const fix of FIXES) {
            const before = content;
            content = content.replace(fix.pattern, fix.replacement);
            if (before !== content) {
                fixCount++;
            }
        }
        
        // Special handling for common patterns
        // Fix all .bind(this); that should be .bind(this));
        content = content.replace(/(\w+)\.bind\(this\);(\s*\n\s*})/g, '$1.bind(this));$2');
        
        // Fix addEventListener missing parenthesis
        content = content.replace(
            /addEventListener\((['"])(\w+)\1,\s*this\.(\w+)\.bind\(this\)\s*;/g,
            'addEventListener($1$2$1, this.$3.bind(this));'
        );
        
        // Write back if changed
        if (content !== originalContent) {
            await fs.writeFile(filePath, content);
            return { fixed: true, fixCount, path: relativePath };
        }
        
        return { fixed: false, path: relativePath };
    } catch (error) {
        return { fixed: false, error: error.message, path: filePath };
    }
}

async function main() {
    console.log('🔧 BRUTAL Syntax Error Fixer');
    console.log('============================\n');
    
    try {
        // Find all JS files in framework-v3
        const frameworkPath = path.join(rootDir, 'framework-v3');
        const files = await findJSFiles(frameworkPath);
        
        console.log(`Found ${files.length} JavaScript files to check\n`);
        
        const results = {
            fixed: [],
            unchanged: [],
            errors: []
        };
        
        // Process all files
        for (const file of files) {
            const result = await fixFile(file);
            
            if (result.error) {
                results.errors.push(result);
            } else if (result.fixed) {
                results.fixed.push(result);
                console.log(`✅ Fixed: ${result.path}`);
            } else {
                results.unchanged.push(result);
            }
        }
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`Fixed: ${results.fixed.length} files`);
        console.log(`Unchanged: ${results.unchanged.length} files`);
        console.log(`Errors: ${results.errors.length} files`);
        
        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(err => {
                console.log(`  ${err.path}: ${err.error}`);
            });
        }
        
        // Now fix import paths
        console.log('\n🔗 Fixing import paths...');
        await fixImportPaths();
        
        console.log('\n✅ BRUTAL fixes complete!');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

async function fixImportPaths() {
    const importFixes = {
        '../brutal-framework-alignment.js': null, // Remove this import
        '../../02-performance/04-LayoutThrottle.js': null, // Does not exist
        './core/Notifications.js': './ui/Notifications.js',
        './data/SearchBox.js': './ui/SearchBox.js',
        './data/Charts.js': './ui/Charts.js',
        './media/Carousel.js': './ui/Carousel.js',
        './media/Timeline.js': './ui/Timeline.js',
        '../../01-core/BrutalComponent.js': '../base/BrutalComponent.js',
        '../../02-performance/01-Monitor.js': null, // Does not exist
    };
    
    const frameworkPath = path.join(rootDir, 'framework-v3');
    const files = await findJSFiles(frameworkPath);
    
    for (const file of files) {
        let content = await fs.readFile(file, 'utf8');
        let changed = false;
        
        for (const [wrong, correct] of Object.entries(importFixes)) {
            if (content.includes(wrong)) {
                if (correct === null) {
                    // Comment out the import
                    content = content.replace(
                        new RegExp(`import.*from ['"]${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`, 'g'),
                        `// REMOVED: Import from non-existent file ${wrong}`
                    );
                } else {
                    // Fix the path
                    content = content.replace(
                        new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                        correct
                    );
                }
                changed = true;
            }
        }
        
        if (changed) {
            await fs.writeFile(file, content);
            console.log(`✅ Fixed imports in: ${path.relative(rootDir, file)}`);
        }
    }
}

// Run the fixer
main().catch(console.error);