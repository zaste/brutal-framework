/**
 * BRUTAL V5 Tooling Suite
 * 
 * Zero-dependency development tools for the BRUTAL ecosystem
 */

// Week 1: Version Compatibility
export { VersionValidator } from './compatibility/version-validator.js';
export { CompatibilityMatrix } from './compatibility/compatibility-matrix.js';
export { InstallValidator } from './compatibility/install-validator.js';
export { RuntimeGuard } from './compatibility/runtime-guard.js';

// Week 2: Performance Monitoring
export { BenchmarkSuite } from './performance/benchmark-suite.js';
export { RegressionDetector } from './performance/regression-detector.js';
export { BundleTracker } from './performance/bundle-tracker.js';
export { MemoryLeakDetector } from './performance/memory-leak-detector.js';

// Week 3: Migration Tools
export { BreakingChangeAnalyzer } from './migration/breaking-change-analyzer.js';
export { MigrationGenerator } from './migration/migration-generator.js';
export { APISurfaceTracker } from './migration/api-surface-tracker.js';
export { CrossPackageAnalyzer } from './migration/cross-package-analyzer.js';

// Week 4: Security & Certification
export { SecuritySandbox } from './security/security-sandbox.js';
export { PermissionSystem } from './security/permission-system.js';
export { PluginCertifier } from './security/plugin-certifier.js';
export { DocumentationValidator } from './security/doc-validator.js';

// Types
export type {
  // Compatibility types
  ValidationResult,
  VersionRequirement,
  CompatibilityResult,
  RuntimeRequirements,
  
  // Performance types
  BenchmarkResult,
  PerformanceRegression,
  BundleMetrics,
  MemoryLeakResult,
  
  // Migration types
  BreakingChangeReport,
  APIChange,
  MigrationScript,
  APISurface,
  CrossPackageImpact,
  
  // Security types
  SandboxPermissions,
  SandboxResult,
  PermissionDeclaration,
  CertificationResult,
  DocumentationValidation
} from './types.js';