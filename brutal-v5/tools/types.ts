/**
 * Shared types for BRUTAL V5 Tooling Suite
 */

// Compatibility Types
export type { 
  ValidationResult,
  ValidationError 
} from './compatibility/version-validator.js';

export type { 
  VersionRequirement,
  CompatibilityResult 
} from './compatibility/compatibility-matrix.js';

export type { 
  InstallValidation 
} from './compatibility/install-validator.js';

export type { 
  RuntimeRequirements,
  RuntimeValidation 
} from './compatibility/runtime-guard.js';

// Performance Types
export type { 
  BenchmarkResult,
  BenchmarkFunction 
} from './performance/benchmark-suite.js';

export type { 
  PerformanceRegression,
  RegressionSeverity 
} from './performance/regression-detector.js';

export type { 
  BundleMetrics,
  PackageSize 
} from './performance/bundle-tracker.js';

export type { 
  MemoryLeakResult,
  MemorySnapshot 
} from './performance/memory-leak-detector.js';

// Migration Types
export type { 
  BreakingChangeReport,
  APIChange,
  APIDefinition 
} from './migration/breaking-change-analyzer.js';

export type { 
  MigrationScript,
  Transform,
  MigrationConfig 
} from './migration/migration-generator.js';

export type { 
  APISurface,
  APIExport,
  APIComparison 
} from './migration/api-surface-tracker.js';

export type { 
  CrossPackageImpact,
  DependencyGraph,
  ImpactAnalysis 
} from './migration/cross-package-analyzer.js';

// Security Types
export type { 
  SandboxPermissions,
  SandboxResult,
  SecurityViolation 
} from './security/security-sandbox.js';

export type { 
  PermissionDeclaration,
  Permission,
  PermissionGrant 
} from './security/permission-system.js';

export type { 
  CertificationResult,
  Certificate,
  SecurityAnalysis 
} from './security/plugin-certifier.js';

export type { 
  DocumentationValidation,
  FileValidation,
  ValidationIssue 
} from './security/doc-validator.js';