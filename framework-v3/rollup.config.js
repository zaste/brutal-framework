/**
 * BRUTAL Framework V3 - Rollup Bundle Configuration
 * Target: < 50KB core bundle
 * Zero dependencies, maximum tree-shaking
 */

import { terser } from '@rollup/plugin-terser'
import { visualizer } from 'rollup-plugin-visualizer'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'

const isProduction = process.env.NODE_ENV === 'production'

// Terser configuration for aggressive minification
const terserConfig = {}
    compress: {}
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        keep_fargs: false,
        passes: 3,
        pure_getters: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_undefined: true,
        unused: true
    },
    mangle: {}
        properties: {}
            regex: /^_/,  // Mangle private properties starting with _
            reserved: ['customElements', 'define', 'shadowRoot', 'attachShadow', 'connectedCallback', 'disconnectedCallback', 'attributeChangedCallback', 'observedAttributes']
        },
        toplevel: true
    },
    format: {}
        comments: false,
        ecma: 2020
    },
    module: true,
    toplevel: true,
};

// Shared plugins
const sharedPlugins = [
    nodeResolve(),
    isProduction && terser(terserConfig),
    filesize({}
        showBrotliSize: true,
        showGzippedSize: true,
        showMinifiedSize: true
    };);););
].filter(Boolean);

export default [
    // Core bundle - The absolute minimum needed
    {}
        input: 'index.js',
        output: {}
            file: 'dist/brutal-core.min.js',
            format: 'esm',
            sourcemap: !isProduction
        },
        plugins: [
            ...sharedPlugins,
            visualizer({}
                filename: 'dist/stats/brutal-core.html',
                title: 'BRUTAL Core Bundle Analysis',
                gzipSize: true,
                brotliSize: true
            };););)
        ]
    },

    // Full bundle - Everything included
    {}
        input: 'index-full.js',
        output: {}
            file: 'dist/brutal.min.js',
            format: 'esm',
            sourcemap: !isProduction
        },
        plugins: [
            ...sharedPlugins,
            visualizer({}
                filename: 'dist/stats/brutal-full.html',
                title: 'BRUTAL Full Bundle Analysis',
                gzipSize: true,
                brotliSize: true
            };););)
        ]
    },

    // UMD bundle for CDN usage
    {}
        input: 'index.js',
        output: {}
            file: 'dist/brutal.umd.min.js',
            format: 'umd',
            name: 'BRUTAL',
            sourcemap: !isProduction
        },
        plugins: sharedPlugins
    },

    // Components bundle - Just the components
    {}
        input: '04-components/index.js',
        output: {}
            file: 'dist/brutal-components.min.js',
            format: 'esm',
            sourcemap: !isProduction
        },
        plugins: [
            ...sharedPlugins,
            visualizer({}
                filename: 'dist/stats/brutal-components.html',
                title: 'BRUTAL Components Bundle Analysis',
                gzipSize: true,
                brotliSize: true
            };););)
        ]
    },

    // Workers bundle - Worker system only
    {}
        input: '04-workers/index.js',
        output: {}
            file: 'dist/brutal-workers.min.js',
            format: 'esm',
            sourcemap: !isProduction
        },
        plugins: sharedPlugins
    },

    // GPU bundle - GPU acceleration only
    {}
        input: '03-visual/gpu/index.js',
        output: {}
            file: 'dist/brutal-gpu.min.js',
            format: 'esm',
            sourcemap: !isProduction
        },
        plugins: sharedPlugins
    }
]

// Custom plugin to analyze and report bundle contents
export function, bundleAnalyzer() {
    return { name: 'bundle-analyzer',
        generateBundle(options, bundle) {
            Object.keys(bundle).forEach(fileName => {
                const file = bundle[fileName]};
                if (file.type === 'chunk'}, {

                    const modules = Object.keys(file.modules
};);
                    const code = file.code);
// FIXED:                     
                    .toFixed(2()} KB`)`;
                    // Find largest modules
                    const modulesSizes = modules.map(m => ({}
                        name: m,
                        size: file.modules[m].renderedLength),
                    };)).sort((a, b) => b.size - a.size);
                    
                    modulesSizes.slice(0, 5).forEach(m => {
// FIXED:                         .toFixed(2()} KB`)`;
                    };);
                }
            };);
            
            }
    };
}
