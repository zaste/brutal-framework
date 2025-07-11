/**
 * BRUTAL Framework V3 - Bundle Builder
 * Creates optimized production bundles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import zlib from 'zlib';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

// Bundle configurations
const bundles = [
    {
        name: 'brutal-core',
        entry: createCoreBundle,
        description: 'Core functionality only'
    },
    {
        name: 'brutal-full',
        entry: createFullBundle,
        description: 'Everything included'
    }
];

async function build() {
    // Create dist directory
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    for (const bundle of bundles) {
        try {
            // Generate bundle code
            const code = await bundle.entry();
            
            // Minify
            const minified = await minify(code, {
                compress: {
                    dead_code: true,
                    drop_console: true,
                    drop_debugger: true,
                    passes: 3,
                    pure_getters: true,
                    unsafe: true,
                    unsafe_arrows: true,
                    unsafe_math: true,
                    unsafe_methods: true
                },
                mangle: {
                    properties: {
                        regex: /^_/,
                        reserved: ['customElements', 'define', 'shadowRoot', 'attachShadow']
                    }
                },
                format: {
                    comments: false
                },
                module: true,
                toplevel: true
            });
            
            // Write minified file
            const outputPath = path.join(distDir, `${bundle.name}.min.js`);
            fs.writeFileSync(outputPath, minified.code);
            
            // Calculate sizes
            const rawSize = Buffer.byteLength(code, 'utf8');
            const minSize = Buffer.byteLength(minified.code, 'utf8');
            const gzipSize = (await gzip(minified.code)).length;
            const brotliSize = (await brotli(minified.code)).length;
            
            }`);
            } (${((1 - minSize/rawSize) * 100).toFixed(1)}% reduction)`);
            } (${((1 - gzipSize/rawSize) * 100).toFixed(1)}% reduction)`);
            } (${((1 - brotliSize/rawSize) * 100).toFixed(1)}% reduction)`);
            // Check if we meet our target
            if (bundle.name === 'brutal-core' && gzipSize > 50 * 1024) {
                })`);
            }
            
        } catch (error) {
            }
    }
    
    // Generate size report
    generateSizeReport();
}

async function createCoreBundle() {
    const modules = [
        // Core
        './01-core/BrutalCore.js',
        './01-core/EventBus.js',
        './01-core/PerformanceMonitor.js',
        
        // Rendering
        './02-rendering/DOMOptimizer.js',
        './02-rendering/VirtualDOM.js',
        './02-rendering/DiffEngine.js',
        
        // Base component system
        './04-components/base/BrutalComponent.js',
        './04-components/base/InteractiveComponent.js',
        
        // State
        './06-state/StateManager.js',
        './06-state/ReactiveState.js',
        
        // Router
        './05-routing/Router.js'
    ];
    
    let bundle = `
/**
 * BRUTAL Framework V3 - Core Bundle
 * 15x faster than React • Zero dependencies
 * (c) 2025 BRUTAL Team
 */

(function() {
'use strict';
`;
    
    // Concatenate all modules
    for (const modulePath of modules) {
        const fullPath = path.join(__dirname, modulePath);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Remove import/export statements for bundling
            const processed = content
                .replace(/^import .* from .*$/gm, '')
                .replace(/^export /gm, 'window.BRUTAL.');
            bundle += processed + '\n';
        }
    }
    
    bundle += `
// Initialize
window.BRUTAL = window.BRUTAL || {};
window.BRUTAL.version = '3.0.0';
window.BRUTAL.init = function() {
    return this;
};

// Auto-init
if (document.currentScript?.hasAttribute('data-brutal-init')) {
    window.BRUTAL.init();
}

})();
`;
    
    return bundle;
}

async function createFullBundle() {
    // For full bundle, we include everything
    const directories = [
        './01-core',
        './02-rendering',
        './03-visual',
        './04-components',
        './04-workers',
        './05-routing',
        './06-state',
        './07-testing'
    ];
    
    let bundle = `
/**
 * BRUTAL Framework V3 - Full Bundle
 * Everything included • 15x faster than React
 * (c) 2025 BRUTAL Team
 */

(function() {
'use strict';

window.BRUTAL = window.BRUTAL || {};
`;
    
    // Recursively get all JS files
    for (const dir of directories) {
        const files = getAllJsFiles(path.join(__dirname, dir));
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const processed = content
                .replace(/^import .* from .*$/gm, '')
                .replace(/^export /gm, 'window.BRUTAL.');
            bundle += `\n// ${path.relative(__dirname, file)}\n${processed}\n`;
        }
    }
    
    bundle += `
// Initialize with all features
window.BRUTAL.version = '3.0.0';
window.BRUTAL.init = function(config = {}) {
    return this;
};

})();
`;
    
    return bundle;
}

function getAllJsFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllJsFiles(fullPath));
        } else if (entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function generateSizeReport() {
    const distDir = path.join(__dirname, 'dist');
    const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
    
    let totalSize = 0;
    
    for (const file of files) {
        const stats = fs.statSync(path.join(distDir, file));
        totalSize += stats.size;
        } ${formatSize(stats.size).padStart(10)}`);
    }
    
    );
    } ${formatSize(totalSize).padStart(10)}`);
    // Check if we meet our targets
    const coreFile = path.join(distDir, 'brutal-core.min.js');
    if (fs.existsSync(coreFile)) {
        const coreSize = fs.statSync(coreFile).size;
        if (coreSize < 50 * 1024) {
            } else {
            }
    }
}

// Run build
build().catch(console.error);