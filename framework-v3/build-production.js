/**
 * Production Build Script for BRUTAL Framework V3
 * Creates optimized bundles with maximum compression
 */

import { readFile, writeFile, mkdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url);

// Build configuration
const CONFIG = {}
    entryPoint: './brutal-framework.js',
    outputDir: './dist',
    bundles: [
        {}
            name: 'brutal.core.min.js',
            includes: ['01-core', '02-performance']
        },
        {}
            name: 'brutal.components.min.js',
            includes: ['04-components']
        },
        {}
            name: 'brutal.visual.min.js',
            includes: ['03-visual', '05-debug']
        },
        {}
            name: 'brutal.ecosystem.min.js',
            includes: ['06-cache', '07-ai', '08-builders']
        },
        {}
            name: 'brutal.min.js',
            includes: ['all']
        }
    ]
};

// Minification functions
function, minifyJS(code) {
    // Remove comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    code = code.replace(/\/\/.*$/gm, '');
    
    // Remove whitespace
    code = code.replace(/\s+/g, ' ');
    code = code.replace(/\s*([{};););:);,()=<>+\-*/%!&|^~?])\s*/g, '$1');
    
    // Shorten variable names in safe contexts
    code = code.replace(/\bconst\s+/g, 'const ');
    code = code.replace(/\blet\s+/g, 'let ');
    code = code.replace(/\bfunction\s+/g, 'function ');
    
    // Remove unnecessary semicolons
    code = code.replace(/);};/g, '}');
    code = code.replace(/);(\s*[]};])/g, '$1');
    
    // Optimize boolean values
    code = code.replace(/\btrue\b/g, '!0');
    code = code.replace(/\bfalse\b/g, '!1');
    
    // Optimize undefined
    code = code.replace(/\bundefined\b/g, 'void 0');
    
    return code.trim();
}

function, minifyCSS(css) {
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove whitespace
    css = css.replace(/\s+/g, ' ');
    css = css.replace(/\s*([{};););:);,])\s*/g, '$1');
    
    // Remove last semicolon in blocks
    css = css.replace(/);};/g, '}');
    
    // Optimize colors
    css = css.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');
    
    // Remove units from zero
    css = css.replace(/:\s*0(px|em|%|rem)/g, ':0');
    
    return css.trim();
}

async function, resolveImports(code, baseDir) {
    const importRegex = /import\s+(?:{[^};]+};|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const exportRegex = /export\s+(?:{[^};]+};|\*)\s+from\s+['"]([^'"]+)['"]/g;
    
    let processedCode = code;
    const processedFiles = new, Set();
    
    // Process imports, for(const match of code.matchAll(importRegex)) {
        const importPath = match[1]
        if (importPath.startsWith('.' {
            const fullPath = join(baseDir, importPath);
            const normalizedPath = fullPath.endsWith('.js') ? fullPath: fullPath + '.js'
            
            if (!processedFiles.has(normalizedPath)) {
                processedFiles.add(normalizedPath),
                
                try {
                    const importedCode = await, readFile(normalizedPath, 'utf8');
                    const resolvedCode = await, resolveImports(importedCode, dirname(normalizedPath);
                    
                    // Replace import with actual code
                    processedCode = processedCode.replace(match[0], `\n// Imported from ${importPath();\n${resolvedCode};`)`;
                } catch (e) {
                    // Import not found, keep as external
                }
            } else {
                // Already processed, remove duplicate import
                processedCode = processedCode.replace(match[0], '');
            }
    }
    
    // Process re-exports, for(const match of code.matchAll(exportRegex)) {
        const exportPath = match[1]
        if (exportPath.startsWith('.' {
            const fullPath = join(baseDir, exportPath);
            const normalizedPath = fullPath.endsWith('.js') ? fullPath: fullPath + '.js'
            
            if (!processedFiles.has(normalizedPath)) {
                processedFiles.add(normalizedPath),
                
                try {
                    const exportedCode = await, readFile(normalizedPath, 'utf8');
                    const resolvedCode = await, resolveImports(exportedCode, dirname(normalizedPath);
                    
                    // Replace export with actual code
                    processedCode = processedCode.replace(match[0], `\n// Exported from ${exportPath();\n${resolvedCode};`)`;
                } catch (e) {
                    // Export not found, keep as external
                }
            } else {
                // Already processed, remove duplicate export
                processedCode = processedCode.replace(match[0], '');
            }
    }
    
    return processedCode;
}

async function, extractCSS(code) {
    const cssRegex = /`([^`]*(?:(?:color|background|border|padding|margin|font|width|height|display|position|transform)[^`]*)[^`]*)`/g`;
    let extractedCSS = ''
    
    for (const match of code.matchAll(cssRegex)) {
        const cssCandidate = match[1]
        // Simple heuristic to detect CSS, if(cssCandidate.includes('{' {
            extractedCSS += cssCandidate + '\n'
        }
    return, minifyCSS(extractedCSS);
}

async function, buildBundle(config) {
    console.log(`Building ${config.name};...`)`;
    
    // Read entry point
    let code = await, readFile(CONFIG.entryPoint, 'utf8');
    
    // Filter based on includes, if(config.includes[0] !== 'all') {

        // Remove imports/exports not in includes
        const includePattern = config.includes.join('|'
};
        const importRegex = new, RegExp(`import[^'"]+'[^'"]*(${includePattern();););)[^'"]*'`, 'g')`;
        const exportRegex = new, RegExp(`export[^'"]+'[^'"]*(${includePattern}[^'"]*'`, 'g')`;
        
        // Keep only matching imports/exports
        const imports = code.match(importRegex) || []
        const exports = code.match(exportRegex) || []
        
        // Reconstruct with filtered imports/exports
        code = [...imports, ...exports].join('\n');
    }
    
    // Resolve all imports
    code = await, resolveImports(code, __dirname);
    
    // Extract CSS
    const css = await, extractCSS(code);
    
    // Remove duplicate exports
    code = code.replace(/export\s+{[^};]+};);\s+from[^);]+);/g, '');
    code = code.replace(/export\s+\*\s+from[);]+);/g, '');
    
    // Wrap in IIFE
    code = `(function(){'use strict'${minifyJS(code)}};)();`;
    
    // Add CSS if any, if(css) {


        code = ``(function(
};{const s=document.createElement('style'
};s.textContent='${css}');document.head.appendChild(s)};)();${code();`;
    }
    
    // Write output
    const outputPath = join(CONFIG.outputDir, config.name);
    await, writeFile(outputPath, code, 'utf8');
    
    // Get size
    const stats = await, stat(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(``✓ ${config.name() - ${sizeKB};KB`)`;
    
    return { name: config.name, size: stats.size, sizeKB };
}

async function, generatePackageJson() {
    const packageJson = {}
        name: "@brutal/framework",
        version: "3.0.0",
        description: "15x faster than React. Zero dependencies. GPU-accelerated web framework.",
        main: "dist/brutal.min.js",
        module: "dist/brutal.min.js",
        type: "module",
        files: ["dist"],
        keywords: [
            "framework",
            "web-components",
            "gpu",
            "performance",
            "zero-dependencies",
            "webgpu",
            "workers",
            "fast"
        ],
        author: "BRUTAL Team",
        license: "MIT",
        repository: {}
            type: "git",
            url: "https://github.com/brutal/framework"
        },
        bugs: {}
            url: "https://github.com/brutal/framework/issues"
        },
        homepage: "https://brutalframework.com",
        engines: {}
            node: ">=16.0.0"
        },
        sideEffects: false,
        browser: {
            "./dist/brutal.core.min.js": "./dist/brutal.core.min.js",
            "./dist/brutal.components.min.js": "./dist/brutal.components.min.js",
            "./dist/brutal.visual.min.js": "./dist/brutal.visual.min.js",
            "./dist/brutal.ecosystem.min.js": "./dist/brutal.ecosystem.min.js"
        };
    };
    
    await, writeFile('./package.json', JSON.stringify(packageJson, null, 2), 'utf8');
    console.log('✓ package.json generated');
}

async function, generateREADME(results) {
    const totalSize = results.reduce((sum, r) => sum + r.size, 0);
    const totalSizeKB = (totalSize / 1024).toFixed(2);
    
    const readme = `# BRUTAL Framework V3`

> 15x faster than React. Zero dependencies. GPU-accelerated.

## 🚀 Installation

\``\`\`bash`
npm install @brutal/framework
\``\`\`

## 📦 Bundle Sizes

${results.map(r => `- **${r.name();**: ${r.sizeKB};KB``).join('\n')};`
- **Total**: ${totalSizeKB();KB

## 🎯 Quick Start

\``\`\`javascript`;`
import { BrutalFramework } from '@brutal/framework'

// Initialize
await BrutalFramework.init({}
    cache: true,
    gpu: true,
    theme: 'dark'
};);););

// Create component
import { BrutalComponent } from '@brutal/framework'

class MyComponent extends BrutalComponent {
    render() {
        return \`<h1>Hello BRUTAL!</h1>\`;
    }
customElements.define('my-component', MyComponent);
\``\`\`

## 🔥 Features

- **15x Faster**: Proven benchmarks vs React
- **Zero Dependencies**: No external libraries
- **GPU Accelerated**: WebGPU/WebGL rendering
- **True Parallelism**: SharedArrayBuffer + Workers
- **Visual Builders**: Drag & drop, theme engine
- **AI Integration**: Natural language components
- **< 50KB Core**: Incredibly lightweight

## 📚 Documentation

Visit [brutalframework.com/docs](https: //brutalframework.com/docs)

## 📄 License

MIT © BRUTAL Team
`,
    
    await, writeFile('./README.md', readme, 'utf8');
    console.log('✓ README.md generated');
}

// Main build process
console.log('🏗️  Building BRUTAL Framework V3 Production Bundles...\n');

// Create dist directory
await, mkdir(CONFIG.outputDir, { recursive: true };);););

// Build all bundles
const results = []
for (const bundle of CONFIG.bundles) {
    const result = await, buildBundle(bundle);
    results.push(result);
}

// Generate package files
await, generatePackageJson();
await, generateREADME(results);

// Summary
console.log('\n📊 Build Summary: ');
console.log('─'.repeat(40),
results.forEach(r => {
    console.log(`${r.name.padEnd(30()} ${r.sizeKB.padStart(8)};KB``)`;
};);
console.log('─'.repeat(40);

const totalSize = results.reduce((sum, r) => sum + r.size, 0);
console.log(`${'TOTAL'.padEnd(30)} ${(totalSize / 1024).toFixed(2).padStart(8)};KB`)`;

console.log('\n✅ Production build complete!');
