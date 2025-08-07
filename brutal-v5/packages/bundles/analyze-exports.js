#!/usr/bin/env node
/**
 * Analyze what's actually exported in the bundles
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function analyzeBundle(bundleName) {
  console.log(kleur.bold(`\n📦 Analyzing ${bundleName} bundle exports\n`));
  
  const bundlePath = join(__dirname, 'dist', `${bundleName}.js`);
  
  try {
    // Dynamically import the bundle
    const bundle = await import(bundlePath);
    
    console.log('Top-level exports:');
    Object.keys(bundle).forEach(key => {
      console.log(`  - ${key}:`, typeof bundle[key]);
      
      // If it's an object, show its properties
      if (typeof bundle[key] === 'object' && bundle[key] !== null) {
        const props = Object.keys(bundle[key]);
        if (props.length > 0) {
          console.log(`    Properties: ${props.slice(0, 10).join(', ')}${props.length > 10 ? '...' : ''}`);
        }
      }
    });
    
    // Save detailed analysis
    const analysis = {
      bundle: bundleName,
      exports: {}
    };
    
    Object.keys(bundle).forEach(key => {
      if (typeof bundle[key] === 'object' && bundle[key] !== null) {
        analysis.exports[key] = Object.keys(bundle[key]);
      } else {
        analysis.exports[key] = typeof bundle[key];
      }
    });
    
    writeFileSync(
      join(__dirname, 'dist', `${bundleName}-exports.json`),
      JSON.stringify(analysis, null, 2)
    );
    
    console.log(kleur.green(`\n✅ Analysis saved to dist/${bundleName}-exports.json`));
    
  } catch (error) {
    console.error(kleur.red(`Failed to analyze bundle: ${error.message}`));
  }
}

async function main() {
  await analyzeBundle('brutal-lite');
  await analyzeBundle('brutal-core');
}

main().catch(console.error);