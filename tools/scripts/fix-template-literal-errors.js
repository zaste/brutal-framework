#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix Component.js template literal
async function fixComponentJs() {
    const filePath = '/workspaces/web/framework-v3/01-core/Component.js';
    let content = await fs.readFile(filePath, 'utf8');
    
    // Fix the errorTemplate method
    const errorTemplateStart = content.indexOf('errorTemplate(error, errorInfo) {');
    const errorTemplateEnd = content.indexOf('}\n', errorTemplateStart + 400);
    
    if (errorTemplateStart !== -1 && errorTemplateEnd !== -1) {
        const newErrorTemplate = `  errorTemplate(error, errorInfo) {
    return \`
      <div class="brutal-error-boundary" style="
        padding: 20px; background: #ff0000; color: white;
        border-radius: 8px;
        font-family: monospace;
      ">
        <h3>Component Error</h3>
        <p>\${error?.message || 'Unknown error'}</p>
        \${window.__BRUTAL__?.debug ? \`
          <details style="margin-top: 10px;">
            <summary>Stack Trace</summary>
            <pre style="overflow: auto; max-height: 200px;">\${error?.stack || ''}</pre>
          </details>
        \` : ''}
      </div>
    \`;
  }`;
        
        content = content.substring(0, errorTemplateStart) + newErrorTemplate + content.substring(errorTemplateEnd);
    }
    
    // Remove trailing backtick and "No newline at end of file"
    content = content.replace(/`\s*\d+→ No newline at end of file\s*$/, '');
    content = content.replace(/`\s*$/, '');
    
    // Ensure file ends with a newline
    if (!content.endsWith('\n')) {
        content += '\n';
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log('Fixed Component.js');
}

// Fix EnhancedComponent.js
async function fixEnhancedComponentJs() {
    const filePath = '/workspaces/web/framework-v3/01-core/EnhancedComponent.js';
    let content = await fs.readFile(filePath, 'utf8');
    
    // Fix missing closing parenthesis on line 334
    content = content.replace(
        /this\.constructor\.intersection\s*$/m,
        'this.constructor.intersection);'
    );
    
    // Fix missing closing parenthesis on line 342
    content = content.replace(
        /(entries\) => this\.handleResize\(entries\)\s*)$/m,
        '$1);'
    );
    
    // Remove trailing content
    content = content.replace(/\s*\d+→ No newline at end of file\s*$/, '');
    
    // Ensure file ends with a newline
    if (!content.endsWith('\n')) {
        content += '\n';
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log('Fixed EnhancedComponent.js');
}

// Fix Registry.js
async function fixRegistryJs() {
    const filePath = '/workspaces/web/framework-v3/01-core/Registry.js';
    let content = await fs.readFile(filePath, 'utf8');
    
    // Fix line 354 - remove extra parenthesis
    content = content.replace(
        'const originalLazy = this.lazy.bind(this));',
        'const originalLazy = this.lazy.bind(this);'
    );
    
    // Remove trailing content
    content = content.replace(/\s*\d+→ No newline at end of file\s*$/, '');
    
    // Ensure file ends with a newline
    if (!content.endsWith('\n')) {
        content += '\n';
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log('Fixed Registry.js');
}

// Fix GestureSystem.js
async function fixGestureSystemJs() {
    const filePath = '/workspaces/web/framework-v3/02-performance/09-GestureSystem.js';
    let content = await fs.readFile(filePath, 'utf8');
    
    // Fix line 325 - add missing semicolon
    content = content.replace(
        /Math\.pow\(pointer\.endY - pointer\.startY, 2\)\);\s*$/m,
        'Math.pow(pointer.endY - pointer.startY, 2));'
    );
    
    // Fix line 424 - complete the if statement
    content = content.replace(
        'if (distance > this._config.swipeThreshold &&',
        'if (distance > this._config.swipeThreshold &&'
    );
    
    // Remove trailing content
    content = content.replace(/\s*\d+→ No newline at end of file\s*$/, '');
    
    // Ensure file ends with a newline
    if (!content.endsWith('\n')) {
        content += '\n';
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log('Fixed GestureSystem.js');
}

async function main() {
    console.log('=== Fixing Template Literal Errors ===\n');
    
    try {
        await fixComponentJs();
        await fixEnhancedComponentJs();
        await fixRegistryJs();
        await fixGestureSystemJs();
        
        console.log('\nVerifying fixes...\n');
        
        const files = [
            '/workspaces/web/framework-v3/01-core/Component.js',
            '/workspaces/web/framework-v3/01-core/EnhancedComponent.js',
            '/workspaces/web/framework-v3/01-core/Registry.js',
            '/workspaces/web/framework-v3/02-performance/09-GestureSystem.js'
        ];
        
        let allFixed = true;
        
        for (const file of files) {
            try {
                execSync(`node --check "${file}"`, { stdio: 'pipe' });
                console.log(`✓ ${path.basename(file)} - syntax valid`);
            } catch (error) {
                console.log(`✗ ${path.basename(file)} - still has errors`);
                allFixed = false;
            }
        }
        
        if (allFixed) {
            console.log('\nAll template literal errors fixed!');
        } else {
            console.log('\nSome files still have errors. Running detailed check...');
            
            // Check remaining JS files
            const remainingBroken = [];
            const allJsFiles = execSync('find /workspaces/web -name "*.js" -type f | grep -v node_modules', { encoding: 'utf8' }).split('\n').filter(Boolean);
            
            for (const file of allJsFiles) {
                try {
                    execSync(`node --check "${file}"`, { stdio: 'pipe' });
                } catch (error) {
                    remainingBroken.push(file);
                }
            }
            
            console.log(`\n${remainingBroken.length} files still have syntax errors`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main().catch(console.error);