#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { gzipSizeSync } from 'gzip-size';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Bundle configurations aligned with BRUTAL V5 specs
const BUNDLE_CONFIGS = {
  lite: {
    name: 'brutal-lite',
    maxSize: 15 * 1024, // 15KB
    entryPoints: [
      // For lite bundle, we'll use a subset of packages
      join(__dirname, '../@brutal/foundation/src/index.ts'),
      join(__dirname, '../@brutal/shared/src/index.ts'),
      join(__dirname, '../@brutal/templates/src/index.ts'),
      join(__dirname, '../@brutal/components/src/index.ts')
    ]
  },
  
  core: {
    name: 'brutal-core',
    maxSize: 35 * 1024, // 35KB
    entryPoints: [
      join(__dirname, '../@brutal/foundation/src/index.ts'),
      join(__dirname, '../@brutal/shared/src/index.ts'),
      join(__dirname, '../@brutal/events/src/index.ts'),
      join(__dirname, '../@brutal/templates/src/index.ts'),
      join(__dirname, '../@brutal/cache/src/index.ts'),
      join(__dirname, '../@brutal/components/src/index.ts'),
      join(__dirname, '../@brutal/state/src/index.ts'),
      join(__dirname, '../@brutal/routing/src/index.ts'),
      join(__dirname, '../@brutal/scheduling/src/index.ts'),
      join(__dirname, '../@brutal/a11y/src/index.ts'),
      join(__dirname, '../@brutal/plugins/src/index.ts')
    ]
  }
};

async function buildBundle(bundleName) {
  const config = BUNDLE_CONFIGS[bundleName];
  if (!config) {
    console.error(kleur.red(`Unknown bundle: ${bundleName}`));
    process.exit(1);
  }

  console.log(kleur.cyan(`\n📦 Building ${config.name} bundle...`));
  
  try {
    // Create virtual entry that imports all modules
    const entryContent = config.entryPoints
      .map((path, i) => {
        const packageName = path.match(/@brutal\/([^/]+)/)?.[1] || `module${i}`;
        return `export * as ${packageName} from '${path}';`;
      })
      .join('\n');
    
    const tempEntry = join(__dirname, '.temp', `${bundleName}-entry.ts`);
    mkdirSync(dirname(tempEntry), { recursive: true });
    writeFileSync(tempEntry, entryContent);

    // Build with esbuild
    const result = await esbuild.build({
      entryPoints: [tempEntry],
      bundle: true,
      outfile: join(__dirname, 'dist', `${config.name}.js`),
      format: 'esm',
      target: 'es2020',
      platform: 'neutral', // Don't assume browser or node
      minify: true,
      treeShaking: true,
      pure: ['console.log'],
      drop: ['debugger'],
      legalComments: 'none',
      metafile: true,
      logLevel: 'error',
      // Define HTMLElement for environments that don't have it
      banner: {
        js: 'const HTMLElement = globalThis.HTMLElement || class HTMLElement {};'
      }
    });

    // Read output and check size
    const outputPath = join(__dirname, 'dist', `${config.name}.js`);
    const outputCode = readFileSync(outputPath, 'utf8');
    const rawSize = Buffer.byteLength(outputCode);
    const gzipSize = gzipSizeSync(outputCode);
    
    const rawKB = (rawSize / 1024).toFixed(2);
    const gzipKB = (gzipSize / 1024).toFixed(2);
    const maxKB = (config.maxSize / 1024).toFixed(0);
    const percentage = ((gzipSize / config.maxSize) * 100).toFixed(1);
    
    // Save metafile for analysis
    writeFileSync(
      join(__dirname, 'dist', `${config.name}.meta.json`),
      JSON.stringify(result.metafile, null, 2)
    );
    
    if (gzipSize <= config.maxSize) {
      console.log(
        kleur.green(`✅ ${config.name}:`),
        kleur.cyan(`${gzipKB}KB`),
        kleur.gray(`(${percentage}% of ${maxKB}KB limit)`),
        kleur.gray(`| raw: ${rawKB}KB`)
      );
    } else {
      console.error(
        kleur.red(`❌ ${config.name}:`),
        kleur.red(`${gzipKB}KB`),
        kleur.red(`(${percentage}% of ${maxKB}KB limit)`),
        kleur.gray(`| raw: ${rawKB}KB`)
      );
      
      // Analyze what's taking space
      console.log(kleur.yellow('\n📊 Bundle analysis:'));
      const analysis = await esbuild.analyzeMetafile(result.metafile);
      console.log(analysis);
      
      process.exit(1);
    }

  } catch (error) {
    console.error(kleur.red(`❌ Failed to build ${bundleName}:`), error);
    process.exit(1);
  }
}

async function main() {
  const bundleName = process.argv[2];
  
  if (bundleName) {
    await buildBundle(bundleName);
  } else {
    // Build all bundles
    for (const name of Object.keys(BUNDLE_CONFIGS)) {
      await buildBundle(name);
    }
  }
  
  console.log(kleur.green('\n✅ Build complete!'));
}

main().catch(console.error);