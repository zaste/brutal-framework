# Breaking Change Protocol

> Pattern for managing breaking changes across a 42-package ecosystem without fragmenting the community.

## Problem
One breaking change in a core package can cascade through the entire ecosystem, breaking hundreds of community projects.

## Solution
Implement a structured breaking change protocol with impact analysis, migration tooling, and community assessment.

## Implementation

### 1. Impact Analysis Tool
```typescript
export class BreakingChangeAnalyzer {
  async analyze(change: ProposedChange): Promise<ImpactReport> {
    const directImpact = await this.analyzeDirectPackages(change);
    const ecosystemImpact = await this.analyzeEcosystem(change);
    const migrationComplexity = this.assessMigration(change);
    
    return {
      severity: this.calculateSeverity(directImpact, ecosystemImpact),
      affected: {
        internalPackages: directImpact.packages,
        communityProjects: ecosystemImpact.projects,
        weeklyDownloads: ecosystemImpact.downloads
      },
      migration: {
        canAutomate: migrationComplexity.automatic,
        effort: migrationComplexity.estimatedHours,
        strategy: migrationComplexity.strategy
      },
      recommendation: this.recommend(severity, migration)
    };
  }
  
  private async analyzeEcosystem(change: ProposedChange) {
    // Scan npm for dependents
    const dependents = await this.npmApi.getDependents(change.package);
    
    // Analyze GitHub usage
    const githubUsage = await this.githubApi.searchCode(
      `from "${change.package}"`,
      change.affectedExports
    );
    
    return {
      projects: dependents.length + githubUsage.count,
      downloads: dependents.reduce((sum, dep) => sum + dep.weeklyDownloads, 0),
      severity: this.categorize(dependents.length)
    };
  }
}
```

### 2. Migration Stages
```typescript
export enum MigrationStage {
  PROPOSED = 'proposed',           // RFC stage
  DEPRECATED = 'deprecated',       // Old API marked deprecated  
  DUAL_SUPPORT = 'dual-support',   // Both APIs work
  MIGRATION_ONLY = 'migration',    // Old API warns heavily
  REMOVED = 'removed'              // Old API gone
}

export interface MigrationPlan {
  stage: MigrationStage;
  timeline: {
    [MigrationStage.PROPOSED]: Date;
    [MigrationStage.DEPRECATED]: Date;
    [MigrationStage.DUAL_SUPPORT]: Date;  // Min 2 minor versions
    [MigrationStage.MIGRATION_ONLY]: Date; // Min 1 major version
    [MigrationStage.REMOVED]: Date;
  };
  tooling: {
    codemod?: string;              // Automated migration
    eslintRule?: string;           // Detect old usage
    migrationGuide: string;        // Manual steps
    telemetry?: boolean;           // Track migration progress
  };
}
```

### 3. Breaking Change Budget
```typescript
export interface BreakingChangeBudget {
  // Per major version
  maxBreakingChanges: 5;
  
  // Severity weights
  weights: {
    core: 3,      // Core package changes count 3x
    enhanced: 2,  // Enhanced package changes count 2x
    extension: 1  // Extension package changes count 1x
  };
  
  // Current usage
  used: BreakingChange[];
  remaining: number;
  
  // Approval required if over budget
  approvers: string[];
}
```

### 4. Community Communication
```typescript
export class BreakingChangeComms {
  async announce(change: BreakingChange): Promise<void> {
    // Generate impact report
    const impact = await this.analyzer.analyze(change);
    
    // Create tracking issue
    const issue = await this.github.createIssue({
      title: `[Breaking Change] ${change.title}`,
      body: this.generateIssueBody(change, impact),
      labels: ['breaking-change', `severity-${impact.severity}`]
    });
    
    // Notify channels
    await Promise.all([
      this.notifyDiscord(change, impact),
      this.notifyTwitter(change, impact),
      this.updateWebsite(change, impact),
      this.emailMajorUsers(change, impact)
    ]);
    
    // Start telemetry
    await this.telemetry.trackMigration(change);
  }
}
```

### 5. Automated Migration
```typescript
export abstract class MigrationCodemod {
  abstract readonly from: string;
  abstract readonly to: string;
  
  async run(directory: string): Promise<MigrationResult> {
    const files = await this.findAffectedFiles(directory);
    const results = await Promise.all(
      files.map(file => this.migrateFile(file))
    );
    
    return {
      migrated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success),
      warnings: results.flatMap(r => r.warnings)
    };
  }
  
  protected abstract migrateFile(file: string): Promise<FileResult>;
}

// Example codemod
export class ComponentApiCodemod extends MigrationCodemod {
  readonly from = '@brutal/components@1.x';
  readonly to = '@brutal/components@2.x';
  
  protected async migrateFile(file: string): Promise<FileResult> {
    const ast = await this.parse(file);
    
    // Transform AST
    this.transformImports(ast);
    this.transformApiCalls(ast);
    this.addTypeAnnotations(ast);
    
    return {
      success: true,
      code: this.generate(ast),
      warnings: this.warnings
    };
  }
}
```

## Usage Example

```typescript
// 1. Propose breaking change
const proposal = {
  package: '@brutal/components',
  type: 'api-change',
  description: 'Change Component.init() to async',
  affectedExports: ['Component', 'BrutalComponent']
};

// 2. Analyze impact
const impact = await analyzer.analyze(proposal);
console.log(`Affects ${impact.affected.communityProjects} projects`);
console.log(`Severity: ${impact.severity}`);

// 3. Create migration plan
const plan: MigrationPlan = {
  stage: MigrationStage.PROPOSED,
  timeline: {
    proposed: new Date('2024-01-01'),
    deprecated: new Date('2024-02-01'),
    'dual-support': new Date('2024-03-01'),
    migration: new Date('2024-06-01'),
    removed: new Date('2024-09-01')
  },
  tooling: {
    codemod: '@brutal/codemods/component-async',
    eslintRule: '@brutal/eslint-plugin/no-sync-init',
    migrationGuide: '/docs/migration/component-async'
  }
};

// 4. Execute migration
await changeManager.execute(proposal, plan);
```

## Validation

- [ ] All breaking changes go through analyzer
- [ ] Migration timeline >= 6 months
- [ ] Codemod covers 80%+ of use cases
- [ ] Community notification sent
- [ ] Telemetry tracking enabled
- [ ] Budget not exceeded

## Anti-Patterns

1. **Surprise Breaking Changes** - No analysis or warning
2. **No Migration Path** - Remove API without alternative
3. **Too Fast Timeline** - Less than 2 versions warning
4. **Poor Communication** - Hidden in release notes
5. **No Tooling** - Manual migration only

## References

- [Semantic Versioning](https://semver.org/)
- [Node.js Deprecation Policy](https://nodejs.org/en/about/releases/)
- [React RFC Process](https://github.com/reactjs/rfcs)