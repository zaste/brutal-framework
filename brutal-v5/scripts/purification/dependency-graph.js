#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

// Read the dependency analysis
const analysis = JSON.parse(readFileSync(join(process.cwd(), 'dependency-analysis.json'), 'utf-8'));

// Create a dependency graph visualization
console.log('# Brutal Package Dependency Graph\n');
console.log('```mermaid');
console.log('graph TD');

// Style definitions
console.log('  classDef base fill:#e1f5e1,stroke:#4caf50,stroke-width:2px');
console.log('  classDef minimal fill:#fff3e0,stroke:#ff9800,stroke-width:2px');
console.log('  classDef enhanced fill:#e3f2fd,stroke:#2196f3,stroke-width:2px');
console.log('  classDef large fill:#ffebee,stroke:#f44336,stroke-width:2px');

// Draw nodes and edges
const drawn = new Set();
for (const [pkg, deps] of Object.entries(analysis.packages)) {
  const shortName = pkg.replace('@brutal/', '');
  
  // Determine node class
  let nodeClass = 'base';
  if (shortName.includes('enhanced')) nodeClass = 'enhanced';
  else if (analysis.minimalFiles[pkg]) nodeClass = 'minimal';
  else if (analysis.bundleSizes[pkg] > 20000) nodeClass = 'large';
  
  // Add size info
  const size = analysis.bundleSizes[pkg] ? `${(analysis.bundleSizes[pkg] / 1024).toFixed(1)}KB` : '?';
  const nodeName = `${shortName}[${shortName}<br/>${size}]`;
  
  // Draw dependencies
  if (deps.dependencies.length > 0) {
    for (const dep of deps.dependencies) {
      const depShortName = dep.replace('@brutal/', '');
      const depSize = analysis.bundleSizes[dep] ? `${(analysis.bundleSizes[dep] / 1024).toFixed(1)}KB` : '?';
      const depNodeName = `${depShortName}[${depShortName}<br/>${depSize}]`;
      console.log(`  ${depNodeName} --> ${nodeName}`);
      drawn.add(pkg);
      drawn.add(dep);
    }
  } else if (!drawn.has(pkg)) {
    // Standalone packages
    console.log(`  ${nodeName}`);
  }
  
  // Apply class
  console.log(`  class ${shortName} ${nodeClass}`);
}

console.log('```\n');

// Print dependency layers
console.log('## Dependency Layers\n');

// Layer 0: No dependencies
const layer0 = [];
for (const [pkg, deps] of Object.entries(analysis.packages)) {
  if (deps.dependencies.length === 0) {
    layer0.push(pkg);
  }
}

console.log('### Layer 0 (Base packages - no dependencies)');
for (const pkg of layer0.sort()) {
  const size = analysis.bundleSizes[pkg] ? `${(analysis.bundleSizes[pkg] / 1024).toFixed(1)}KB` : '?';
  const hasMinimal = analysis.minimalFiles[pkg] ? '✓' : '✗';
  console.log(`- ${pkg} (${size}) [minimal: ${hasMinimal}]`);
}

// Layer 1: Only depend on layer 0
const layer1 = [];
for (const [pkg, deps] of Object.entries(analysis.packages)) {
  if (deps.dependencies.length > 0 && 
      deps.dependencies.every(dep => layer0.includes(dep))) {
    layer1.push(pkg);
  }
}

console.log('\n### Layer 1 (Depend only on base packages)');
for (const pkg of layer1.sort()) {
  const size = analysis.bundleSizes[pkg] ? `${(analysis.bundleSizes[pkg] / 1024).toFixed(1)}KB` : '?';
  const hasMinimal = analysis.minimalFiles[pkg] ? '✓' : '✗';
  const deps = analysis.packages[pkg].dependencies.join(', ');
  console.log(`- ${pkg} (${size}) [minimal: ${hasMinimal}] → ${deps}`);
}

// Layer 2: Higher level
const layer2 = [];
for (const [pkg, deps] of Object.entries(analysis.packages)) {
  if (!layer0.includes(pkg) && !layer1.includes(pkg) && deps.dependencies.length > 0) {
    layer2.push(pkg);
  }
}

console.log('\n### Layer 2 (Higher-level packages)');
for (const pkg of layer2.sort()) {
  const size = analysis.bundleSizes[pkg] ? `${(analysis.bundleSizes[pkg] / 1024).toFixed(1)}KB` : '?';
  const hasMinimal = analysis.minimalFiles[pkg] ? '✓' : '✗';
  const deps = analysis.packages[pkg].dependencies.join(', ');
  console.log(`- ${pkg} (${size}) [minimal: ${hasMinimal}] → ${deps}`);
}

// Identify problematic patterns
console.log('\n## Analysis Summary\n');

// Count total size
let totalSize = 0;
let minimalSize = 0;
for (const [pkg, size] of Object.entries(analysis.bundleSizes)) {
  totalSize += size;
  if (analysis.minimalFiles[pkg]) {
    minimalSize += size;
  }
}

console.log(`- Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`- Packages with minimal.ts: ${Object.values(analysis.minimalFiles).filter(v => v).length}/${Object.keys(analysis.packages).length}`);
console.log(`- Size of packages with minimal.ts: ${(minimalSize / 1024).toFixed(2)} KB`);
console.log(`- Average package size: ${(totalSize / Object.keys(analysis.bundleSizes).length / 1024).toFixed(2)} KB`);

// Largest packages
console.log('\n### Largest packages (candidates for splitting)');
const sorted = Object.entries(analysis.bundleSizes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
for (const [pkg, size] of sorted) {
  const hasMinimal = analysis.minimalFiles[pkg] ? '✓' : '✗';
  console.log(`- ${pkg}: ${(size / 1024).toFixed(2)} KB [minimal: ${hasMinimal}]`);
}