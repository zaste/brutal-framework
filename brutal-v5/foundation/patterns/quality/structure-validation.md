# Structure Validation Pattern

## Problem
In monorepos with 30+ packages, maintaining consistent structure, dependencies, and configurations across all packages is challenging and error-prone.

## Solution
Automated structure validation that enforces exact package structure, dependency graph, and configuration consistency across the entire workspace.

### Required Package Structure
```javascript
const REQUIRED_STRUCTURE = {
  directories: [
    'src',
    'tests',
    'tests/unit',
    'tests/integration',
    'tests/performance',
    'types',
    'docs'
  ],
  files: [
    'src/index.ts',
    'types/index.d.ts',
    'docs/README.md',
    'docs/API.md',
    'docs/EXAMPLES.md',
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    '.eslintrc.js',
    'CHANGELOG.md'
  ]
};
```

### Dependency Graph Validation
```javascript
// Explicit dependency graph
const DEPENDENCY_GRAPH = {
  '@brutal/foundation': [],
  '@brutal/shared': [],
  '@brutal/events': ['@brutal/shared'],
  '@brutal/templates': ['@brutal/shared'],
  '@brutal/components': ['@brutal/foundation', '@brutal/templates', '@brutal/events']
};

// Validate dependencies match graph
function validateDependencies(pkg, packageName) {
  const expected = DEPENDENCY_GRAPH[packageName] || [];
  const actual = Object.keys(pkg.dependencies || {});
  
  // Check for missing or unexpected dependencies
  for (const dep of expected) {
    if (!actual.includes(dep)) {
      errors.push(`Missing dependency ${dep}`);
    }
  }
}
```

### Circular Dependency Detection
```javascript
function findCircularDependencies() {
  const visited = new Set();
  const stack = new Set();
  
  function visit(pkg, path = []) {
    if (stack.has(pkg)) {
      errors.push(`Circular: ${[...path, pkg].join(' → ')}`);
      return;
    }
    
    if (visited.has(pkg)) return;
    visited.add(pkg);
    stack.add(pkg);
    
    const deps = DEPENDENCY_GRAPH[pkg] || [];
    for (const dep of deps) {
      visit(dep, [...path, pkg]);
    }
    
    stack.delete(pkg);
  }
  
  for (const pkg of Object.keys(DEPENDENCY_GRAPH)) {
    visit(pkg);
  }
}
```

### Workspace Validation
```javascript
// Required workspace files
const workspaceFiles = [
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'jest.config.base.js',
  '.eslintrc.base.js'
];
```

## Evolution
- V3: Manual structure checks, inconsistent
- V4: Some validation, incomplete
- V5: Full automated validation with dependency graph

## Trade-offs
- ✅ Consistent structure guaranteed
- ✅ Circular dependencies impossible
- ✅ Early error detection
- ✅ Self-documenting structure
- ❌ Rigid structure requirements
- ❌ Initial setup complexity

## Related
- [Modular Monorepo](../architecture/modular-monorepo.md)
- [Workspace Management](../build/workspace-management.md)
- [Quality Gates](./quality-gates.md)