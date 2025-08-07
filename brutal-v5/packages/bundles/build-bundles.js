#!/usr/bin/env node
import { build } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { gzipSizeSync } from 'gzip-size';
import { brutalLiteConfig } from './src/configs/brutal-lite.config.js';
import { brutalCoreConfig } from './src/configs/brutal-core.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Bundle configurations
const bundles = {
  lite: brutalLiteConfig,
  core: brutalCoreConfig
};

// Build a specific bundle
async function buildBundle(bundleName) {
  const config = bundles[bundleName];
  if (!config) {
    console.error(`Unknown bundle: ${bundleName}`);
    process.exit(1);
  }

  console.log(`\n📦 Building ${config.name} bundle...`);
  
  try {
    // Create entry file that imports all modules
    const entryContent = createEntryFile(config.entry);
    const tempEntry = join(__dirname, '.temp', `${bundleName}-entry.js`);
    mkdirSync(dirname(tempEntry), { recursive: true });
    writeFileSync(tempEntry, entryContent);

    // Build configuration
    const inputOptions = {
      input: tempEntry,
      external: config.external,
      treeshake: config.treeshake,
      plugins: [
        nodeResolve({
          extensions: ['.js', '.ts'],
          preferBuiltins: false
        }),
        typescript({
          tsconfig: '../../tsconfig.json',
          sourceMap: false
        }),
        terser(config.minify)
      ]
    };

    const outputOptions = {
      ...config.output,
      file: join(__dirname, config.output.file)
    };

    // Build the bundle
    const bundle = await build(inputOptions);
    const { output } = await bundle.generate(outputOptions);
    
    // Write the output
    mkdirSync(dirname(outputOptions.file), { recursive: true });
    writeFileSync(outputOptions.file, output[0].code);
    
    // Check size
    const size = gzipSizeSync(output[0].code);
    const sizeKB = (size / 1024).toFixed(2);
    const maxKB = (config.maxSize / 1024).toFixed(0);
    
    console.log(`✅ Built ${config.name}: ${sizeKB}KB (max: ${maxKB}KB)`);
    
    if (size > config.maxSize) {
      console.error(`❌ Bundle size exceeds limit! ${sizeKB}KB > ${maxKB}KB`);
      process.exit(1);
    }

    await bundle.close();
  } catch (error) {
    console.error(`❌ Failed to build ${bundleName}:`, error);
    process.exit(1);
  }
}

// Create entry file content
function createEntryFile(entry) {
  const imports = [];
  const exports = [];
  
  if (typeof entry === 'string') {
    // Single entry
    imports.push(`export * from '${entry}';`);
  } else if (Array.isArray(entry)) {
    // Array of entries
    entry.forEach((path, i) => {
      imports.push(`import * as module${i} from '${path}';`);
      exports.push(`module${i}`);
    });
  } else {
    // Object of entries
    Object.entries(entry).forEach(([name, path]) => {
      if (Array.isArray(path)) {
        path.forEach((p, i) => {
          const varName = `${name}${i}`;
          imports.push(`import * as ${varName} from '${p}';`);
          exports.push(`${varName}`);
        });
      } else {
        imports.push(`import * as ${name} from '${path}';`);
        exports.push(name);
      }
    });
  }
  
  return `
${imports.join('\n')}

// Re-export everything
${exports.length > 0 ? `export { ${exports.join(', ')} };` : ''}
`;
}

// Main execution
async function main() {
  const bundleName = process.argv[2];
  
  if (bundleName) {
    // Build specific bundle
    await buildBundle(bundleName);
  } else {
    // Build all bundles
    for (const name of Object.keys(bundles)) {
      await buildBundle(name);
    }
  }
}

main().catch(console.error);