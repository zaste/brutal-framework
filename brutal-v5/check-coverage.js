#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packages = [
  'a11y',
  'cache',
  'components',
  'events',
  'foundation',
  'plugins',
  'routing',
  'scheduling',
  'shared',
  'state',
  'templates'
];

console.log('BRUTAL V5 Test Coverage Report');
console.log('==============================\n');

const results = [];
let allPass = true;

for (const pkg of packages) {
  const pkgPath = path.join(__dirname, 'packages', '@brutal', pkg);
  
  console.log(`Running coverage for @brutal/${pkg}...`);
  
  try {
    // Run test coverage and capture output
    const output = execSync('npm run test:coverage', { 
      cwd: pkgPath,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Extract coverage percentages from output
    const lines = output.split('\n');
    const allFilesLine = lines.find(line => line.includes('All files'));
    
    if (allFilesLine) {
      const match = allFilesLine.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      
      if (match) {
        const [, statements, branches, functions, lines] = match;
        const coverage = {
          package: `@brutal/${pkg}`,
          statements: parseFloat(statements),
          branches: parseFloat(branches),
          functions: parseFloat(functions),
          lines: parseFloat(lines)
        };
        
        results.push(coverage);
        
        // Check if any metric is below 95%
        if (coverage.statements < 95 || coverage.branches < 95 || 
            coverage.functions < 95 || coverage.lines < 95) {
          allPass = false;
        }
      }
    }
  } catch (error) {
    console.error(`Error running coverage for @brutal/${pkg}:`, error.message);
    allPass = false;
  }
}

console.log('\n\nCoverage Summary');
console.log('================\n');
console.log('Package                  | Statements | Branches | Functions | Lines   | Status');
console.log('-------------------------|------------|----------|-----------|---------|--------');

results.forEach(result => {
  const status = (result.statements >= 95 && result.branches >= 95 && 
                  result.functions >= 95 && result.lines >= 95) ? '✅ PASS' : '❌ FAIL';
  
  console.log(
    `${result.package.padEnd(24)} | ${result.statements.toFixed(1).padStart(9)}% | ${result.branches.toFixed(1).padStart(7)}% | ${result.functions.toFixed(1).padStart(8)}% | ${result.lines.toFixed(1).padStart(6)}% | ${status}`
  );
});

console.log('\n' + '='.repeat(85));
console.log(`\nOverall Status: ${allPass ? '✅ All packages meet 95% coverage requirement!' : '❌ Some packages do not meet 95% coverage requirement'}`);
console.log(`Total Packages: ${results.length}/${packages.length}`);
console.log(`Packages Meeting 95% Requirement: ${results.filter(r => r.statements >= 95 && r.branches >= 95 && r.functions >= 95 && r.lines >= 95).length}/${results.length}`);