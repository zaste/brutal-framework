# Plugin Ecosystem Governance

> Pattern for maintaining a healthy, secure, and compatible plugin ecosystem as the framework scales.

## Problem
Without governance, plugin ecosystems become:
- Fragmented with incompatible plugins
- Security risks from unvetted code
- Breaking with each framework update
- Difficult for users to trust

## Solution
Implement a multi-tier plugin certification system with clear APIs, security sandboxing, and compatibility guarantees.

## Architecture

### 1. Plugin Certification Levels
```typescript
export enum PluginCertification {
  OFFICIAL = 'official',       // Maintained by BRUTAL team
  VERIFIED = 'verified',       // Passed all audits
  COMMUNITY = 'community',     // Basic safety checks
  EXPERIMENTAL = 'experimental' // No guarantees
}

export interface PluginMetadata {
  name: string;
  version: string;
  certification: PluginCertification;
  
  // Certification details
  certified: {
    level: PluginCertification;
    date: Date;
    expires: Date;
    auditor?: string;
  };
  
  // Compatibility
  compatibility: {
    brutal: string;        // Version range
    plugins?: string[];    // Compatible plugins
    conflicts?: string[];  // Conflicting plugins
  };
  
  // Security
  security: {
    permissions: Permission[];
    sandbox: boolean;
    csp?: string;
  };
}
```

### 2. Plugin API Contract
```typescript
export interface BrutalPlugin {
  // Metadata
  readonly metadata: PluginMetadata;
  
  // Lifecycle
  install(brutal: BrutalAPI): Promise<void>;
  activate(context: PluginContext): Promise<void>;
  deactivate(): Promise<void>;
  uninstall(): Promise<void>;
  
  // Capabilities
  readonly capabilities: PluginCapability[];
  
  // Health check
  healthCheck(): Promise<HealthStatus>;
}

export interface BrutalAPI {
  // Version-stable API
  readonly version: string;
  readonly components: ComponentAPI;
  readonly state: StateAPI;
  readonly events: EventAPI;
  
  // Plugin registration
  registerComponent(name: string, component: Component): void;
  registerHook(hook: string, handler: Function): void;
  
  // Sandboxed utilities
  readonly utils: SandboxedUtils;
}
```

### 3. Security Model
```typescript
export class PluginSandbox {
  constructor(
    private plugin: BrutalPlugin,
    private permissions: Permission[]
  ) {}
  
  async execute<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    // Create isolated context
    const context = this.createContext();
    
    // Apply permissions
    this.applyPermissions(context, this.permissions);
    
    // Execute in sandbox
    try {
      return await context.eval(fn);
    } catch (error) {
      this.handleError(error);
      throw new PluginError(this.plugin, error);
    }
  }
  
  private createContext(): SandboxContext {
    return new Proxy(globalThis, {
      get: (target, prop) => {
        // Block dangerous APIs
        if (this.isDangerous(prop)) {
          throw new SecurityError(`Access denied: ${prop}`);
        }
        
        // Wrap allowed APIs
        if (this.needsWrapper(prop)) {
          return this.wrap(target[prop]);
        }
        
        return target[prop];
      }
    });
  }
}
```

### 4. Compatibility System
```typescript
export class PluginCompatibility {
  // Check if plugin works with current version
  async check(
    plugin: PluginMetadata
  ): Promise<CompatibilityResult> {
    const brutalVersion = await this.getBrutalVersion();
    
    // Version compatibility
    if (!semver.satisfies(brutalVersion, plugin.compatibility.brutal)) {
      return {
        compatible: false,
        reason: 'version-mismatch',
        details: `Requires ${plugin.compatibility.brutal}, got ${brutalVersion}`
      };
    }
    
    // Check conflicts
    const installed = await this.getInstalledPlugins();
    const conflicts = this.findConflicts(plugin, installed);
    
    if (conflicts.length > 0) {
      return {
        compatible: false,
        reason: 'plugin-conflict',
        conflicts
      };
    }
    
    // API compatibility test
    const apiTest = await this.testAPI(plugin);
    
    return {
      compatible: apiTest.passed,
      apiVersion: apiTest.version,
      warnings: apiTest.warnings
    };
  }
}
```

### 5. Certification Process
```typescript
export class PluginCertifier {
  async certify(
    plugin: BrutalPlugin,
    level: PluginCertification
  ): Promise<CertificationResult> {
    const tests = this.getTestsForLevel(level);
    const results = await this.runTests(plugin, tests);
    
    if (results.passed) {
      return {
        certified: true,
        level,
        certificate: await this.generateCertificate(plugin, level),
        report: results.report
      };
    }
    
    return {
      certified: false,
      failures: results.failures,
      recommendations: this.getRecommendations(results)
    };
  }
  
  private getTestsForLevel(level: PluginCertification): Test[] {
    switch (level) {
      case PluginCertification.OFFICIAL:
        return [
          ...this.securityTests,
          ...this.performanceTests,
          ...this.compatibilityTests,
          ...this.qualityTests,
          ...this.documentationTests
        ];
        
      case PluginCertification.VERIFIED:
        return [
          ...this.securityTests,
          ...this.compatibilityTests,
          ...this.qualityTests
        ];
        
      case PluginCertification.COMMUNITY:
        return [
          ...this.securityTests,
          ...this.basicCompatibilityTests
        ];
        
      default:
        return [];
    }
  }
}
```

### 6. Plugin Registry
```typescript
export class PluginRegistry {
  // Publish plugin
  async publish(
    plugin: BrutalPlugin,
    certification: CertificationResult
  ): Promise<void> {
    // Validate certification
    if (!await this.validateCertificate(certification)) {
      throw new Error('Invalid certification');
    }
    
    // Security scan
    const scan = await this.securityScan(plugin);
    if (!scan.safe) {
      throw new SecurityError(scan.issues);
    }
    
    // Publish to registry
    await this.storage.save({
      plugin,
      certification,
      published: new Date(),
      downloads: 0,
      rating: 0
    });
    
    // Update search index
    await this.updateSearchIndex(plugin);
  }
  
  // Install plugin with verification
  async install(
    name: string,
    options?: InstallOptions
  ): Promise<void> {
    const plugin = await this.fetch(name);
    
    // Verify signature
    if (!await this.verifySignature(plugin)) {
      throw new Error('Invalid plugin signature');
    }
    
    // Check compatibility
    const compat = await this.compatibility.check(plugin.metadata);
    if (!compat.compatible && !options?.force) {
      throw new Error(`Incompatible: ${compat.reason}`);
    }
    
    // Install with sandbox
    const sandbox = new PluginSandbox(
      plugin,
      plugin.metadata.security.permissions
    );
    
    await sandbox.execute(() => plugin.install(this.api));
  }
}
```

## Usage Example

### Creating a Plugin
```typescript
export class MyPlugin implements BrutalPlugin {
  readonly metadata: PluginMetadata = {
    name: '@awesome/brutal-charts',
    version: '1.0.0',
    certification: PluginCertification.COMMUNITY,
    
    compatibility: {
      brutal: '^1.0.0',
      plugins: ['@brutal/ui-primitives'],
      conflicts: ['@other/charts']
    },
    
    security: {
      permissions: [
        Permission.DOM_WRITE,
        Permission.STATE_READ
      ],
      sandbox: true
    }
  };
  
  async install(brutal: BrutalAPI): Promise<void> {
    brutal.registerComponent('brutal-chart', ChartComponent);
  }
  
  async activate(context: PluginContext): Promise<void> {
    // Initialize plugin
  }
  
  readonly capabilities = [
    'component:chart',
    'component:graph',
    'data:visualization'
  ];
}
```

### Publishing a Plugin
```bash
# 1. Test plugin
brutal plugin test ./my-plugin

# 2. Run certification
brutal plugin certify ./my-plugin --level community

# 3. Publish
brutal plugin publish ./my-plugin

# Output:
✅ Security scan passed
✅ Compatibility verified
✅ Certification valid
📦 Published @awesome/brutal-charts@1.0.0
🏆 Certification: COMMUNITY
🔒 Permissions: DOM_WRITE, STATE_READ
```

### Installing Plugins
```typescript
// User installs plugin
await brutal.plugins.install('@awesome/brutal-charts');

// Framework verifies everything
// - Signature valid ✅
// - Compatible version ✅  
// - No conflicts ✅
// - Permissions acceptable ✅
// - Sandboxed execution ✅
```

## Validation

- [ ] All plugins have metadata
- [ ] Certification levels enforced
- [ ] Security permissions declared
- [ ] Compatibility ranges specified
- [ ] Sandbox execution working
- [ ] Registry signature verification
- [ ] Automated compatibility testing

## Anti-Patterns

1. **No Certification** - Anyone can publish anything
2. **No Sandboxing** - Plugins have full access
3. **No Version Compatibility** - Breaks with updates
4. **No Security Model** - Malicious code risks
5. **No Conflict Detection** - Plugins break each other

## References

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [npm Registry Security](https://docs.npmjs.com/about-registry-signatures)