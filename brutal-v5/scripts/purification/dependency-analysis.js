#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const PACKAGES_DIR = '/workspaces/web/brutal-v5/packages/@brutal';

// Read all package.json files
function getPackageJsonFiles() {
    const packages = [];
    const dirs = readdirSync(PACKAGES_DIR);
    
    for (const dir of dirs) {
        const pkgPath = join(PACKAGES_DIR, dir, 'package.json');
        try {
            const content = readFileSync(pkgPath, 'utf-8');
            const pkg = JSON.parse(content);
            packages.push({
                name: pkg.name,
                path: pkgPath,
                dir: join(PACKAGES_DIR, dir),
                package: pkg
            });
        } catch (e) {
            // Skip if no package.json
        }
    }
    
    return packages;
}

// Analyze dependencies
function analyzeDependencies(packages) {
    const analysis = {
        packages: {},
        violations: [],
        bundleSizes: {},
        minimalFiles: {}
    };
    
    for (const pkg of packages) {
        const deps = {
            dependencies: [],
            devDependencies: [],
            peerDependencies: []
        };
        
        // Check dependencies
        if (pkg.package.dependencies) {
            for (const dep of Object.keys(pkg.package.dependencies)) {
                if (dep.startsWith('@brutal/')) {
                    deps.dependencies.push(dep);
                }
            }
        }
        
        // Check devDependencies
        if (pkg.package.devDependencies) {
            for (const dep of Object.keys(pkg.package.devDependencies)) {
                if (dep.startsWith('@brutal/')) {
                    deps.devDependencies.push(dep);
                }
            }
        }
        
        // Check peerDependencies
        if (pkg.package.peerDependencies) {
            for (const dep of Object.keys(pkg.package.peerDependencies)) {
                if (dep.startsWith('@brutal/')) {
                    deps.peerDependencies.push(dep);
                }
            }
        }
        
        analysis.packages[pkg.name] = deps;
        
        // Check for dist directory to estimate bundle size
        try {
            const distPath = join(pkg.dir, 'dist');
            const stats = statSync(distPath);
            if (stats.isDirectory()) {
                const files = readdirSync(distPath);
                let totalSize = 0;
                for (const file of files) {
                    if (file.endsWith('.js') || file.endsWith('.mjs')) {
                        const filePath = join(distPath, file);
                        const fileStats = statSync(filePath);
                        totalSize += fileStats.size;
                    }
                }
                analysis.bundleSizes[pkg.name] = totalSize;
            }
        } catch (e) {
            // No dist directory
        }
        
        // Check for minimal.ts files
        try {
            const srcPath = join(pkg.dir, 'src');
            const minimalPath = join(srcPath, 'minimal.ts');
            try {
                statSync(minimalPath);
                analysis.minimalFiles[pkg.name] = true;
            } catch (e) {
                analysis.minimalFiles[pkg.name] = false;
            }
        } catch (e) {
            analysis.minimalFiles[pkg.name] = false;
        }
    }
    
    return analysis;
}

// Check for circular dependencies
function checkCircularDependencies(analysis) {
    const violations = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    function hasCycle(pkg, path = []) {
        if (recursionStack.has(pkg)) {
            const cycleStart = path.indexOf(pkg);
            const cycle = [...path.slice(cycleStart), pkg];
            violations.push({
                type: 'circular',
                packages: cycle,
                message: `Circular dependency: ${cycle.join(' -> ')}`
            });
            return true;
        }
        
        if (visited.has(pkg)) {
            return false;
        }
        
        visited.add(pkg);
        recursionStack.add(pkg);
        
        const deps = analysis.packages[pkg];
        if (deps) {
            const allDeps = [...deps.dependencies, ...deps.devDependencies];
            for (const dep of allDeps) {
                hasCycle(dep, [...path, pkg]);
            }
        }
        
        recursionStack.delete(pkg);
        return false;
    }
    
    for (const pkg of Object.keys(analysis.packages)) {
        visited.clear();
        recursionStack.clear();
        hasCycle(pkg);
    }
    
    return violations;
}

// Main analysis
const packages = getPackageJsonFiles();
const analysis = analyzeDependencies(packages);
const violations = checkCircularDependencies(analysis);
analysis.violations = violations;

// Generate report
console.log('# Brutal Package Dependency Analysis\n');

console.log('## Package Dependencies\n');
for (const [pkg, deps] of Object.entries(analysis.packages)) {
    console.log(`### ${pkg}`);
    if (deps.dependencies.length > 0) {
        console.log('- **Dependencies:**', deps.dependencies.join(', '));
    }
    if (deps.devDependencies.length > 0) {
        console.log('- **Dev Dependencies:**', deps.devDependencies.join(', '));
    }
    if (deps.peerDependencies.length > 0) {
        console.log('- **Peer Dependencies:**', deps.peerDependencies.join(', '));
    }
    if (deps.dependencies.length === 0 && deps.devDependencies.length === 0 && deps.peerDependencies.length === 0) {
        console.log('- No @brutal dependencies');
    }
    console.log('');
}

console.log('## Dependency Violations\n');
if (violations.length > 0) {
    for (const violation of violations) {
        console.log(`- ${violation.message}`);
    }
} else {
    console.log('No circular dependencies detected.');
}
console.log('');

console.log('## Bundle Sizes\n');
const sortedBundles = Object.entries(analysis.bundleSizes)
    .sort((a, b) => b[1] - a[1]);

if (sortedBundles.length > 0) {
    for (const [pkg, size] of sortedBundles) {
        console.log(`- ${pkg}: ${(size / 1024).toFixed(2)} KB`);
    }
} else {
    console.log('No bundle sizes found (packages may not be built).');
}
console.log('');

console.log('## Minimal.ts Files\n');
for (const [pkg, hasMinimal] of Object.entries(analysis.minimalFiles)) {
    console.log(`- ${pkg}: ${hasMinimal ? '✓ Has minimal.ts' : '✗ No minimal.ts'}`);
}

// Export analysis as JSON
import { writeFileSync } from 'fs';
writeFileSync(
    join(process.cwd(), 'dependency-analysis.json'),
    JSON.stringify(analysis, null, 2)
);

console.log('\n\nFull analysis saved to dependency-analysis.json');