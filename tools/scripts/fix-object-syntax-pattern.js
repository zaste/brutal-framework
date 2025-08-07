#!/usr/bin/env node

/**
 * Fix the {) object syntax pattern error across all files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const frameworkPath = path.join(rootDir, 'framework-v3');

async function checkSyntax(filePath) {
    try {
        await execAsync(`node --check "${filePath}"`);
        return { valid: true };
    } catch (error) {
        return { valid: false, error: error.stderr || error.message };
    }
}

async function fixObjectSyntaxPattern(content) {
    let fixed = content;
    
    // Pattern 1: Fix {) pattern - the main issue
    // This regex looks for {) followed by properties
    fixed = fixed.replace(/\{\)\s*(\w+[,:])/gm, '{ $1');
    
    // Pattern 2: Fix cases where {) appears at end of line
    fixed = fixed.replace(/\{\)\s*$/gm, '{');
    
    // Pattern 3: Fix specific patterns with newlines
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if line ends with {)
        if (line.trim().endsWith('{)')) {
            lines[i] = line.replace(/\{\)$/, '{');
            continue;
        }
        
        // Check for patterns like .set(name, {)
        if (line.includes(', {)')) {
            lines[i] = line.replace(/, \{\)/, ', {');
        }
        
        // Check for patterns like new Event(type, {)
        if (line.includes('(') && line.includes('{)')) {
            lines[i] = line.replace(/\{\)/g, '{');
        }
    }
    fixed = lines.join('\n');
    
    // Pattern 4: Fix specific event patterns
    fixed = fixed.replace(/emitBrutalEvent\([^,]+,\s*[^,]+,\s*\{\)/gm, (match) => {
        return match.replace('{)', '{');
    });
    
    // Pattern 5: Fix this.instances.set pattern
    fixed = fixed.replace(/this\.instances\.set\([^,]+,\s*\{\)/gm, (match) => {
        return match.replace('{)', '{');
    });
    
    // Pattern 6: Fix observer.observe pattern  
    fixed = fixed.replace(/observer\.observe\([^,]+,\s*\{\)/gm, (match) => {
        return match.replace('{)', '{');
    });
    
    // Pattern 7: Fix Promise patterns
    fixed = fixed.replace(/\.catch\(\s*error\s*=>\s*\{\)/gm, '.catch(error => {');
    
    // Pattern 8: Fix complex multi-line object patterns
    // Look for {) followed by property definitions on next lines
    const multiLinePattern = /\{\)\s*\n\s*(\w+:|\w+,)/gm;
    fixed = fixed.replace(multiLinePattern, '{\n  $1');
    
    return fixed;
}

async function fixFile(filePath) {
    const relativePath = path.relative(rootDir, filePath);
    
    try {
        // Check current syntax
        const beforeCheck = await checkSyntax(filePath);
        if (beforeCheck.valid) {
            return { skipped: true, path: relativePath, reason: 'Already valid' };
        }
        
        // Read file
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        
        // Apply fixes
        content = await fixObjectSyntaxPattern(content);
        
        // Write back if changed
        if (content !== originalContent) {
            await fs.writeFile(filePath, content);
            
            // Verify the fix
            const afterCheck = await checkSyntax(filePath);
            
            return { 
                fixed: true, 
                path: relativePath,
                stillHasErrors: !afterCheck.valid,
                remainingError: afterCheck.error
            };
        }
        
        return { fixed: false, path: relativePath };
    } catch (error) {
        return { fixed: false, error: error.message, path: relativePath };
    }
}

async function findJSFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            entry.name !== 'node_modules' && entry.name !== 'dist') {
            files.push(...await findJSFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

async function main() {
    console.log('🔧 Fixing {) object syntax pattern errors...\n');
    
    try {
        // Find all JS files
        const files = await findJSFiles(frameworkPath);
        console.log(`Found ${files.length} JavaScript files\n`);
        
        const results = {
            fixed: [],
            skipped: [],
            unchanged: [],
            errors: [],
            stillBroken: []
        };
        
        // Process all files
        let processed = 0;
        for (const file of files) {
            const result = await fixFile(file);
            processed++;
            
            if (processed % 10 === 0) {
                process.stdout.write(`\rProcessed ${processed}/${files.length} files...`);
            }
            
            if (result.skipped) {
                results.skipped.push(result);
            } else if (result.error) {
                results.errors.push(result);
            } else if (result.fixed) {
                results.fixed.push(result);
                
                if (result.stillHasErrors) {
                    results.stillBroken.push(result);
                }
            } else {
                results.unchanged.push(result);
            }
        }
        
        console.log('\n');
        
        // Summary
        console.log('='.repeat(60));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(60));
        console.log(`✅ Fixed: ${results.fixed.length} files`);
        console.log(`⏭️  Skipped (already valid): ${results.skipped.length} files`);
        console.log(`🔄 Unchanged: ${results.unchanged.length} files`);
        console.log(`❌ Errors: ${results.errors.length} files`);
        console.log(`⚠️  Still broken: ${results.stillBroken.length} files`);
        
        if (results.fixed.length > 0) {
            console.log('\n✅ Fixed files:');
            results.fixed.slice(0, 10).forEach(file => {
                console.log(`  ${file.path}`);
            });
            if (results.fixed.length > 10) {
                console.log(`  ... and ${results.fixed.length - 10} more`);
            }
        }
        
        if (results.stillBroken.length > 0) {
            console.log('\n⚠️  Files that still need manual fixes:');
            results.stillBroken.slice(0, 10).forEach(file => {
                console.log(`  ${file.path}`);
            });
            if (results.stillBroken.length > 10) {
                console.log(`  ... and ${results.stillBroken.length - 10} more`);
            }
        }
        
        console.log('\n✨ Object syntax pattern fixes complete!');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the fixer
main().catch(console.error);