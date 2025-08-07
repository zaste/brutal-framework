/**
 * BRUTAL Component Fixer
 * Automatically fixes common component issues
 */

export class ComponentFixer {
    constructor() {
        this.fixes = {
            incompleteConsoleLog: 0,
            unsafeSuper: 0,
            missingMethods: 0,
            syntaxErrors: 0
        };
    }
    
    async fixContent(content, issues) {
        let fixed = content;
        
        issues.forEach(issue => {
            if (issue.includes('Incomplete console.log statement')) {
                fixed = this.fixIncompleteStatements(fixed);
            } else if (issue.includes('Unsafe super property spreading')) {
                fixed = this.fixUnsafeSuper(fixed);
            } else if (issue.includes('Missing method:')) {
                const methodMatch = issue.match(/Missing method: (\w+)/);
                if (methodMatch) {
                    fixed = this.addMissingMethod(fixed, methodMatch[1]);
                }
            }
        });
        
        // Fix common syntax errors
        fixed = this.fixSyntaxErrors(fixed);
        
        return fixed;
    }
    
    fixIncompleteStatements(content) {
        const lines = content.split('\n');
        const fixed = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('// BRUTAL: Fixed incomplete statement')) {
                // Check the line before
                if (i > 0 && fixed[fixed.length - 1]) {
                    const prevLine = fixed[fixed.length - 1];
                    
                    // Count unclosed parentheses
                    const openCount = (prevLine.match(/\(/g) || []).length;
                    const closeCount = (prevLine.match(/\)/g) || []).length;
                    
                    if (openCount > closeCount) {
                        fixed[fixed.length - 1] = prevLine + ')'.repeat(openCount - closeCount) + ';';
                        this.fixes.incompleteConsoleLog++;
                    }
                }
            }
            
            fixed.push(line);
        }
        
        return fixed.join('\n');
    }
    
    fixUnsafeSuper(content) {
        // Fix unsafe super spreading in observedAttributes
        content = content.replace(
            /static\s+get\s+observedAttributes\(\)\s*{\s*return\s*\[\s*\.\.\.super\.observedAttributes/g,
            'static get observedAttributes() {\n        return [\n            ...(super.observedAttributes || [])'
        );
        
        // Fix general unsafe super spreading
        content = content.replace(/\.\.\.super\.(\w+)(?!\s*\|\|)/g, '...(super.$1 || [])');
        
        this.fixes.unsafeSuper++;
        return content;
    }
    
    addMissingMethod(content, methodName) {
        // Add a stub method if it's a common handler
        if (methodName.includes('handle') || methodName.includes('Handle')) {
            const methodStub = `
    /**
     * ${methodName} - Auto-generated stub
     * @private
     */
    ${methodName}(...args) {
        console.warn('BRUTAL: ${methodName} called but not implemented', args);
    }`;
            
            // Add before the last closing brace
            const lastBraceIndex = content.lastIndexOf('\n}');
            if (lastBraceIndex > 0) {
                content = content.slice(0, lastBraceIndex) + methodStub + content.slice(lastBraceIndex);
                this.fixes.missingMethods++;
            }
        }
        
        return content;
    }
    
    fixSyntaxErrors(content) {
        // Fix double closing parentheses
        content = content.replace(/\)\)\s*;/g, ');');
        
        // Fix incomplete method calls
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            // Look for method calls that span multiple lines
            if (lines[i].includes('(') && !lines[i].includes(')')) {
                let j = i + 1;
                let parenCount = 1;
                
                while (j < lines.length && parenCount > 0) {
                    parenCount += (lines[j].match(/\(/g) || []).length;
                    parenCount -= (lines[j].match(/\)/g) || []).length;
                    j++;
                }
                
                // If we reached end without closing, add closing paren
                if (parenCount > 0 && j < lines.length) {
                    lines[j - 1] = lines[j - 1] + ')'.repeat(parenCount) + ';';
                    this.fixes.syntaxErrors++;
                }
            }
        }
        
        return lines.join('\n');
    }
    
    getReport() {
        return this.fixes;
    }
}