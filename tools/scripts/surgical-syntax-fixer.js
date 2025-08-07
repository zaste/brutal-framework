#!/usr/bin/env node
/**
 * BRUTAL V3 - Surgical Syntax Fixer
 * Fixes specific syntax corruption patterns with surgical precision
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frameworkDir = path.join(__dirname, '../../framework-v3');

class SurgicalSyntaxFixer {
    constructor() {
        this.fixCount = 0;
        this.fileCount = 0;
        this.patterns = this.getFixPatterns();
    }
    
    getFixPatterns() {
        return [
            // Constructor parameter corruption
            {
                pattern: /constructor\(([^)]*options\s*=\s*\{\})[;)]+\)\s*\{/g,
                replacement: 'constructor($1) {'
            },
            
            // Function parameter corruption  
            {
                pattern: /function\s+(\w+)\(([^)]*=\s*\{\})[;)]+\)\s*\{/g,
                replacement: 'function $1($2) {'
            },
            
            // Export function corruption
            {
                pattern: /export\s+function\s+(\w+)\(([^)]*=\s*\{\})[;)]+\)\s*\{/g,
                replacement: 'export function $1($2) {'
            },
            
            // Object literal property corruption (: becomes ^)
            {
                pattern: /(\w+)\s*:\s*([^,\}]+),\s*\^/g,
                replacement: '$1: $2,'
            },
            
            // Missing closing parentheses in function calls
            {
                pattern: /\.(\w+)\(\s*([^)]*)\s*\^\s*\)/g,
                replacement: '.$1($2)'
            },
            
            // Template literal corruption
            {
                pattern: /\$\{([^}]+)\(\)\s*[;)]+\s*\)/g,
                replacement: '${$1}'
            },
            
            // Arrow function corruption
            {
                pattern: /\(\s*([^)]*)\(\)\s*=>\s*\{/g,
                replacement: '($1) => {'
            },
            
            // String literal corruption
            {
                pattern: /(['"]).+?\1\s*[;)]+\)/g,
                replacement: (match) => {
                    const quote = match[0];
                    const content = match.match(new RegExp(`${quote}(.+?)${quote}`))[1];
                    return `${quote}${content}${quote}`;
                }
            },
            
            // Object method corruption
            {
                pattern: /(\w+)\(\s*([^)]*)\s*\}\s*\{/g,
                replacement: '$1($2) {'
            },
            
            // Missing argument separators
            {
                pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
                replacement: '$1, $2('
            }
        ];
    }
    
    fixFile(filePath) {
        if (!filePath.endsWith('.js')) return false;
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;
            let localFixCount = 0;
            
            // Apply each pattern
            for (const { pattern, replacement } of this.patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    content = content.replace(pattern, replacement);
                    localFixCount += matches.length;
                }
            }
            
            // Additional specific fixes
            localFixCount += this.applySpecificFixes(content, filePath);
            
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content);
                this.fixCount += localFixCount;
                console.log(`Fixed ${localFixCount} issues in ${path.relative(frameworkDir, filePath)}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Error fixing ${filePath}: ${error.message}`);
            return false;
        }
    }
    
    applySpecificFixes(content, filePath) {
        let fixCount = 0;
        let result = content;
        
        // Fix object literals that became function calls
        const objectLiteralFixes = result.match(/(\w+):\s*([^,\}]+)\s*\^/g);
        if (objectLiteralFixes) {
            result = result.replace(/(\w+):\s*([^,\}]+)\s*\^/g, '$1: $2,');
            fixCount += objectLiteralFixes.length;
        }
        
        // Fix missing semicolons before closing braces
        const missingSemicolons = result.match(/[^;]\s*\n\s*\}/g);
        if (missingSemicolons) {
            result = result.replace(/([^;])\s*\n(\s*\})/g, '$1;\n$2');
            fixCount += missingSemicolons.length;
        }
        
        // Fix broken template literals
        const templateFixes = result.match(/\$\{[^}]+\(\)[;)]*\)/g);
        if (templateFixes) {
            result = result.replace(/\$\{([^}]+)\(\)[;)]*\)/g, '${$1}');
            fixCount += templateFixes.length;
        }
        
        if (result !== content) {
            fs.writeFileSync(filePath, result);
        }
        
        return fixCount;
    }
    
    processDirectory(dirPath) {
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    this.processDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    this.fileCount++;
                    this.fixFile(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error processing directory ${dirPath}: ${error.message}`);
        }
    }
    
    run() {
        console.log('🔧 BRUTAL V3 Surgical Syntax Fixer');
        console.log('Targeting specific corruption patterns...\n');
        
        this.processDirectory(frameworkDir);
        
        console.log(`\n✅ Processing complete!`);
        console.log(`📊 Files processed: ${this.fileCount}`);
        console.log(`🔧 Total fixes applied: ${this.fixCount}`);
        
        return { files: this.fileCount, fixes: this.fixCount };
    }
}

// Run the fixer
const fixer = new SurgicalSyntaxFixer();
const results = fixer.run();

process.exit(0);