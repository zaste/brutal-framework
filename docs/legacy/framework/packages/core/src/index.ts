/**
 * NATIVE WEB COMPONENTS FRAMEWORK - CORE MODULE
 * 
 * Unified export for the complete core framework functionality.
 * Optimized for modern web standards and enterprise deployment.
 * 
 * Stack Alignment:
 * - Native Web Components API
 * - TypeScript for type safety
 * - ES Modules for modern bundling
 * - Cloudflare/Vercel deployment ready
 */

// Install browser polyfills immediately
import './browser-polyfills';

// Initialize performance tracking system
import './performance-tracking';

// Main framework class
export { 
  NativeWebComponentsFramework as default,
  NativeWebComponentsFramework 
} from './api-gateway';

// Core framework components
export { CoreFramework, NativeComponentBase } from './core-framework';
export { ConfigurationManager } from './configuration-manager';
export { ErrorHandler } from './error-handler';
export { PerformanceValidator } from './performance-validator';
export { FrameworkOrchestrator } from './framework-orchestrator';
export { SecurityManager } from './security-manager';
export { ExtensionManager, extensionManager } from './extension-system';

// Type definitions
export type {
  // API Gateway types
  ComponentDefinition,
  WebComponent,
  EnterpriseConfig,
  FrameworkMetrics,
  AIMLExtension,
  DevExperienceExtension,
  PerformanceExtension,
  SecurityExtension,
  IndustryExtension,
  CrossPlatformExtension,
  EnterpriseManager
} from './api-gateway';

// Import types for local usage
import type { FrameworkConfig } from './configuration-manager';

export type {
  // Configuration types
  FrameworkConfig,
  CloudflareConfig,
  VercelConfig,
  FrameworkInfrastructureConfig,
  PerformanceConfig,
  SecurityConfig,
  ComplianceConfig,
  MonitoringConfig,
  EncryptionConfig,
  RemoteConfigConfig,
  AdvancedMonitoringConfig,
  GovernanceConfig
} from './configuration-manager';

export type {
  // Core framework types
  ComponentMetrics,
  FrameworkCoreMetrics
} from './core-framework';

export type {
  // Error handling types
  ErrorMetrics,
  ErrorContext,
  FrameworkError,
  ErrorRecoveryStrategy
} from './error-handler';

export type {
  // Performance types
  PerformanceMetric,
  PerformanceBenchmark,
  PerformanceValidationResult,
  PerformanceAlert
} from './performance-validator';

export type {
  // Orchestration types
  OrchestrationMetrics
} from './framework-orchestrator';

export type {
  // Security types
  SecurityPolicy,
  SecurityIncident,
  CSPConfig,
  XSSConfig,
  AuthConfig,
  ThreatConfig,
  SanitizationConfig
} from './security-manager';

export type {
  // Extension types
  ExtensionManifest,
  ExtensionPermission,
  ExtensionContext,
  Extension,
  ExtensionSandbox,
  ExtensionAPI,
  ExtensionEvent
} from './extension-system';

// Utility functions for quick setup
export const createFramework = (config?: Partial<FrameworkConfig>) => {
  return new NativeWebComponentsFramework(config);
};

export const createOptimalConfig = (): FrameworkConfig => {
  return {
    environment: 'production',
    performance: {
      targetMultiplier: 50,
      optimization: {
        shadowDOM: true,
        templateCaching: true,
        eventDelegation: true,
        lazyLoading: true
      },
      caching: {
        strategy: 'aggressive',
        ttl: 86400,
        compression: true
      },
      bundling: {
        treeshaking: true,
        minification: true,
        splitting: true
      }
    },
    security: {
      level: 'enterprise',
      csp: {
        enabled: true,
        policy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
        reportOnly: false
      },
      cors: {
        origins: ['https://yourdomain.com'],
        credentials: true
      },
      encryption: {
        quantumSafe: true,
        algorithm: 'ML-KEM-768'
      }
    },
    compliance: {
      standards: ['GDPR', 'SOC2'],
      dataRetention: 365,
      auditLogging: true,
      privacyControls: {
        anonymization: true,
        rightToErasure: true,
        dataPortability: true
      }
    },
    monitoring: {
      performance: {
        realUserMonitoring: true,
        syntheticMonitoring: true,
        coreWebVitals: true
      },
      logging: {
        level: 'warn',
        structured: true,
        retention: 90
      },
      alerts: {
        performance: true,
        errors: true,
        security: true
      }
    },
    infrastructure: {
      cloudflare: {
        workersEnabled: true,
        edgeLocations: ['auto'],
        analytics: {
          webVitals: true,
          customMetrics: true
        },
        security: {
          ddosProtection: true,
          waf: true,
          botManagement: true
        }
      },
      vercel: {
        functions: {
          runtime: 'nodejs20.x',
          regions: ['iad1', 'sfo1']
        },
        edge: {
          enabled: true,
          config: 'edge.config.js'
        },
        analytics: {
          enabled: true,
          customEvents: true
        },
        deployment: {
          builds: [
            { src: 'packages/*/package.json', use: '@vercel/node' }
          ]
        }
      }
    },
    extensions: {
      aiml: false,
      developerExperience: true,
      performanceScale: true,
      advancedSecurity: true,
      industrySpecific: false,
      crossPlatform: false
    },
    enterprise: {
      multiTenant: true,
      sso: true,
      rbac: true,
      auditTrail: true
    }
  };
};

// Version info
export const VERSION = '1.0.0-alpha.1';
export const BUILD_TARGET = '50x React Performance';
export const SUPPORTED_STANDARDS = [
  'Web Components v1',
  'Custom Elements v1',
  'Shadow DOM v1',
  'HTML Templates',
  'ES2022 Modules'
];

/**
 * Quick start function for development
 */
export const quickStart = async (config?: Partial<FrameworkConfig>) => {
  console.log('🚀 Native Web Components Framework - Quick Start');
  console.log(`📦 Version: ${VERSION}`);
  console.log(`⚡ Target: ${BUILD_TARGET}`);
  
  const framework = createFramework(config);
  await framework.initialize();
  
  console.log('✅ Framework ready for component creation');
  return framework;
};

/**
 * Enterprise setup function
 */
export const enterpriseSetup = async () => {
  console.log('🏢 Native Web Components Framework - Enterprise Setup');
  
  const config = createOptimalConfig();
  const framework = createFramework(config);
  
  await framework.initialize();
  await framework.enableEnterprise({
    compliance: ['GDPR', 'SOC2', 'HIPAA'],
    security: config.security,
    monitoring: config.monitoring
  });
  
  console.log('✅ Enterprise framework ready');
  return framework;
};

// Browser polyfills
export { 
  installBrowserPolyfills, 
  browserSupport, 
  IntersectionObserverPolyfill,
  CSSStyleSheetPolyfill
} from './browser-polyfills';

// Performance tracking
export { 
  performanceTracker,
  recordComponentMetrics,
  recordMetric,
  getPerformanceMetrics,
  type PerformanceMetrics,
  type ComponentPerformanceData
} from './performance-tracking';