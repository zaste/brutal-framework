#!/usr/bin/env node

/**
 * Fix critical syntax errors in specific files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

const criticalFixes = [
    {
        file: 'framework-v3/01-core/Registry.js',
        fix: async (content) => {
            // Fix the object syntax error
            return content.replace(
                /this\.definitions\.set\(name, \{\)/g,
                'this.definitions.set(name, {'
            );
        }
    },
    {
        file: 'framework-v3/02-performance/09-GestureSystem.js',
        fix: async (content) => {
            // Fix double closing parenthesis
            return content.replace(
                /this\._boundHandlePointerDown = this\._handlePointerDown\.bind\(this\)\)\);/g,
                'this._boundHandlePointerDown = this._handlePointerDown.bind(this));'
            );
        }
    },
    {
        file: 'framework-v3/04-components/navigation/Menu.js',
        fix: async (content) => {
            // Fix missing closing brace before _safeBind
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('_safeBind(methodName) {')) {
                    // Insert closing brace before this line
                    lines.splice(i, 0, '    }');
                    break;
                }
            }
            return lines.join('\n');
        }
    },
    {
        file: 'framework-v3/04-workers/core/SharedMemory.js',
        fix: async (content) => {
            // Fix the space in method name
            return content.replace(/this\.coalesceFreeBl ocks\(\);/g, 'this.coalesceFreeBlocks();');
        }
    },
    {
        file: 'framework-v3/brutal-repository-analysis-safe.js',
        fix: async (content) => {
            // Fix missing closing parenthesis in writeFile
            return content.replace(
                /await fs\.writeFile\(\s*join\(ROOT_DIR, 'brutal-analysis-report\.json'\),\s*JSON\.stringify\(report, null, 2\)\s*$/gm,
                `await fs.writeFile(
    join(ROOT_DIR, 'brutal-analysis-report.json'),
    JSON.stringify(report, null, 2)
);`
            );
        }
    },
    {
        file: 'framework-v3/test/archived/test-suite.js',
        fix: async (content) => {
            // Fix the incomplete console.log statement
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('// Summary') && i + 1 < lines.length) {
                    const nextLine = lines[i + 1];
                    if (!nextLine.includes('const passRate')) {
                        // Insert the missing calculation
                        lines.splice(i + 1, 0, '        const passRate = (this.results.passed / this.results.total * 100).toFixed(1);');
                    }
                }
            }
            return lines.join('\n');
        }
    },
    {
        file: 'framework-v3/04-components/ui/LoadingSpinner.js',
        fix: async (content) => {
            // Fix missing closing parenthesis
            return content.replace(
                /const positions = new Float32Array\(this\._particles\.flatMap\(p => \[p\.x, p\.y\]\);/g,
                'const positions = new Float32Array(this._particles.flatMap(p => [p.x, p.y]));'
            );
        }
    },
    {
        file: 'framework-v3/04-components/ui/Notifications.js',
        fix: async (content) => {
            // Fix missing closing parenthesis
            return content.replace(
                /window\.addEventListener\('resize', \(\) => this\._resizeCanvas\(\);/g,
                "window.addEventListener('resize', () => this._resizeCanvas());"
            );
        }
    },
    {
        file: 'framework-v3/tests/02-test-state.js', 
        fix: async (content) => {
            // Fix the double closing parenthesis
            content = content.replace(
                /state\.state\.counter = state\.state\.counter \+ 1\)\);/g,
                'state.state.counter = state.state.counter + 1;'
            );
            // Fix missing closing parenthesis in assertLessThan
            content = content.replace(
                /'Average write time should be < 0\.1ms'\s*$/gm,
                "'Average write time should be < 0.1ms');"
            );
            content = content.replace(
                /'Average read time should be < 0\.01ms'\s*$/gm,
                "'Average read time should be < 0.01ms');"
            );
            // Fix the reads variable declaration
            content = content.replace(
                /let reads = 0\);/g,
                'let reads = 0;'
            );
            return content;
        }
    },
    {
        file: 'framework-v3/04-components/advanced/CodeEditor.js',
        fix: async (content) => {
            // Fix missing closing parenthesis in forEach
            return content.replace(
                /lines\.forEach\(line => observer\.observe\(line\);/g,
                'lines.forEach(line => observer.observe(line));'
            );
        }
    },
    {
        file: 'framework-v3/04-components/media/VideoPlayer.js',
        fix: async (content) => {
            // Fix missing closing parenthesis
            return content.replace(
                /this\.dispatchEvent\(new CustomEvent\('error', \{ detail: e \s*\}\);/g,
                "this.dispatchEvent(new CustomEvent('error', { detail: e }));"
            );
        }
    },
    {
        file: 'framework-v3/04-components/ui/ProgressBar.js',
        fix: async (content) => {
            // Fix missing closing parenthesis
            return content.replace(
                /const value = Math\.max\(this\._config\.min, Math\.min\(this\._config\.max, this\._displayValue\);/g,
                'const value = Math.max(this._config.min, Math.min(this._config.max, this._displayValue));'
            );
        }
    }
];

async function main() {
    console.log('🔧 Fixing critical syntax errors...\n');
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const { file, fix } of criticalFixes) {
        const filePath = path.join(rootDir, file);
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const fixed = await fix(content);
            
            if (content !== fixed) {
                await fs.writeFile(filePath, fixed);
                console.log(`✅ Fixed: ${file}`);
                fixedCount++;
            } else {
                console.log(`⏭️  No changes needed: ${file}`);
            }
        } catch (error) {
            console.error(`❌ Error fixing ${file}:`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} files`);
    if (errorCount > 0) {
        console.log(`❌ ${errorCount} errors encountered`);
    }
}

main().catch(console.error);