/**
 * BRUTAL Component Validator
 * Validates all components for common issues
 */

import { readFile } from 'fs/promises';

export class ComponentValidator {
    constructor() {
        this.issues = [];
    }

    async validateFile(filePath, content = null) {
        if (!content) {
            content = await readFile(filePath, 'utf8');
        }
        
        const fileName = filePath.split('/').pop();
        const fileIssues = [];
        
        // Check for broken console.log statements
        if (content.match(/^\s*\)[;,]\s*$/m)) {
            fileIssues.push('Incomplete console.log statement');
        }
        
        // Check for missing method bindings
        const bindMatches = [...content.matchAll(/this\._bound(\w+)\s*=\s*this\.(\w+)\.bind\(this\)/g)];
        for (const [full, boundName, methodName] of bindMatches) {
            const methodRegex = new RegExp(`\\b${methodName}\\s*\\(`);
            if (!methodRegex.test(content)) {
                fileIssues.push(`Missing method: ${methodName} (bound as _bound${boundName})`);
            }
        }
        
        // Check for unsafe super access
        if (content.includes('...super.') && !content.includes('|| []')) {
            fileIssues.push('Unsafe super property spreading');
        }
        
        // Check for observedAttributes issues
        const obsAttrMatch = content.match(/static\s+get\s+observedAttributes.*?\[([^\]]+)\]/s);
        if (obsAttrMatch && obsAttrMatch[1].includes('...super.observedAttributes')) {
            const hasParentCheck = content.includes('|| []') || content.includes('super.observedAttributes || []');
            if (!hasParentCheck) {
                fileIssues.push('Unsafe observedAttributes spreading from parent');
            }
        }
        
        // Check for syntax errors
        const syntaxPatterns = [
            {
                name: 'Unclosed parentheses',
                pattern: /\([^)]*$/m,
                validate: (line) => !line.trim().endsWith('(') // Allow multi-line
            },
            {
                name: 'Double closing parentheses',
                pattern: /\)\)/,
                validate: (line) => !line.includes('}))')  // Allow valid cases
            }
        ];
        
        syntaxPatterns.forEach(({ name, pattern, validate }) => {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (pattern.test(line) && (!validate || !validate(line))) {
                    fileIssues.push(`${name} at line ${index + 1}`);
                }
            });
        });
        
        if (fileIssues.length > 0) {
            this.issues.push({ file: fileName, path: filePath, issues: fileIssues });
        }
        
        return fileIssues;
    }
    
    getResults() {
        return {
            total: this.issues.length,
            issues: this.issues
        };
    }
    
    reset() {
        this.issues = [];
    }
}