# Migration Strategy Pattern

## Problem
Framework migrations are painful, often requiring complete rewrites. Without automated tooling, migrations become blockers to adoption.

## Solution
Automated migration tooling using codemods that transform code from previous versions to the latest API, making upgrades seamless.

### Codemod Architecture
```javascript
// scripts/codemods/v3-to-v5.js
module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // Transform imports
  root.find(j.ImportDeclaration, {
    source: { value: 'brutal' }
  }).forEach(path => {
    // brutal → @brutal/core
    path.node.source.value = '@brutal/core';
  });
  
  // Transform component definitions
  root.find(j.ClassDeclaration, {
    superClass: { name: 'BrutalComponent' }
  }).forEach(path => {
    // Update to new base class
    path.node.superClass.name = 'Component';
    
    // Transform lifecycle methods
    transformLifecycle(j, path);
  });
  
  // Transform state management
  root.find(j.CallExpression, {
    callee: { name: 'createStore' }
  }).forEach(path => {
    // V3 store → V5 state
    path.node.callee.name = 'createState';
    
    // Update API calls
    transformStateAPI(j, path);
  });
  
  return root.toSource();
};
```

### Migration CLI
```typescript
// @brutal/cli/src/commands/migrate.ts
export class MigrateCommand {
  async execute(options: MigrateOptions) {
    const { from, to, path } = options;
    
    // Detect current version
    const currentVersion = await this.detectVersion(path);
    
    // Get migration path
    const migrations = this.getMigrationPath(currentVersion, to);
    
    // Apply migrations in sequence
    for (const migration of migrations) {
      console.log(`Applying ${migration.name}...`);
      await this.runCodemod(migration.codemod, path);
      await this.updateImports(migration.imports, path);
      await this.updateConfig(migration.config, path);
    }
    
    // Validate result
    await this.validateMigration(path);
  }
  
  getMigrationPath(from: string, to: string): Migration[] {
    const migrations = {
      'v3-to-v4': v3ToV4Migration,
      'v4-to-v5': v4ToV5Migration,
      'v3-to-v5': [v3ToV4Migration, v4ToV5Migration].flat()
    };
    
    return migrations[`${from}-to-${to}`] || [];
  }
}
```

### Import Mapping
```javascript
// Migration maps
const importMaps = {
  v3ToV5: {
    'brutal': '@brutal/core',
    'brutal/components': '@brutal/components',
    'brutal/state': '@brutal/state',
    'brutal/router': '@brutal/routing',
    'brutal/utils': '@brutal/shared'
  }
};

// API transformations
const apiTransforms = {
  components: {
    'connectedCallback': 'onMount',
    'disconnectedCallback': 'onDestroy',
    'attributeChangedCallback': 'onAttributeChange'
  },
  state: {
    'store.dispatch': 'state.update',
    'store.getState': 'state.value',
    'store.subscribe': 'state.subscribe'
  }
};
```

### Migration Validation
```javascript
// Ensure migration success
class MigrationValidator {
  async validate(projectPath: string) {
    const checks = [
      this.checkImports,
      this.checkAPIs,
      this.checkBundleSize,
      this.checkTests
    ];
    
    const results = await Promise.all(
      checks.map(check => check(projectPath))
    );
    
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      throw new Error(`Migration validation failed: ${failures}`);
    }
  }
}
```

## Evolution
- V3→V4: Manual migration guide only
- V4→V5: Partial automation
- V5: Full codemod support

## Trade-offs
- ✅ Automated migrations
- ✅ Reduced upgrade friction
- ✅ Preserves functionality
- ✅ Validates success
- ❌ Complex edge cases
- ❌ May need manual review

## Related
- [Version Evolution](../learning/version-evolution.md)
- [API Patterns](../api/)
- [Living Documentation](./living-documentation.md)