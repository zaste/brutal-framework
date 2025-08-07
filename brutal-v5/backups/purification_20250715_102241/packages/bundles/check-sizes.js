#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSizeSync } from 'gzip-size';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Size budgets from BRUTAL V5 spec
const SIZE_BUDGETS = {
  'brutal-lite': { max: 15 * 1024, initTime: 50 },
  'brutal-core': { max: 35 * 1024, initTime: 300 },
  'brutal-enhanced': { max: 55 * 1024, initTime: 500 },
  'brutal-ui': { max: 85 * 1024, initTime: 700 },
  'brutal-full': { max: 155 * 1024, initTime: 1000 }
};

function checkBundleSize(bundleName) {
  const filePath = join(__dirname, 'dist', `${bundleName}.js`);
  
  if (!existsSync(filePath)) {
    console.log(kleur.gray(`⏭️  ${bundleName}: Not built yet`));
    return true;
  }
  
  const content = readFileSync(filePath, 'utf8');
  const rawSize = Buffer.byteLength(content);
  const gzipSize = gzipSizeSync(content);
  const budget = SIZE_BUDGETS[bundleName];
  
  const rawKB = (rawSize / 1024).toFixed(2);
  const gzipKB = (gzipSize / 1024).toFixed(2);
  const maxKB = (budget.max / 1024).toFixed(0);
  
  const isUnderBudget = gzipSize <= budget.max;
  const percentage = ((gzipSize / budget.max) * 100).toFixed(1);
  
  if (isUnderBudget) {
    console.log(
      kleur.green(`✅ ${bundleName}:`),
      kleur.cyan(`${gzipKB}KB`),
      kleur.gray(`(${percentage}% of ${maxKB}KB limit)`),
      kleur.gray(`| raw: ${rawKB}KB`)
    );
  } else {
    console.log(
      kleur.red(`❌ ${bundleName}:`),
      kleur.red(`${gzipKB}KB`),
      kleur.red(`(${percentage}% of ${maxKB}KB limit)`),
      kleur.gray(`| raw: ${rawKB}KB`)
    );
  }
  
  return isUnderBudget;
}

function main() {
  console.log(kleur.bold('\n📊 BRUTAL V5 Bundle Size Report\n'));
  
  let allPassed = true;
  
  for (const bundleName of Object.keys(SIZE_BUDGETS)) {
    const passed = checkBundleSize(bundleName);
    allPassed = allPassed && passed;
  }
  
  console.log();
  
  if (!allPassed) {
    console.log(kleur.red('❌ Some bundles exceed their size budgets!'));
    process.exit(1);
  } else {
    console.log(kleur.green('✅ All bundles are within size budgets!'));
  }
}

main();