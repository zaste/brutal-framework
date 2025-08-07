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
import './browser-polyfills';
import './performance-tracking';
export { NativeWebComponentsFramework as default, NativeWebComponentsFramework } from './api-gateway';
export { CoreFramework, NativeComponentBase } from './core-framework';
export { ConfigurationManager } from './configuration-manager';
export { ErrorHandler } from './error-handler';
export { PerformanceValidator } from './performance-validator';
export { FrameworkOrchestrator } from './framework-orchestrator';
export { SecurityManager } from './security-manager';
export { ExtensionManager, extensionManager } from './extension-system';
export type { ComponentDefinition, WebComponent, EnterpriseConfig, FrameworkMetrics, AIMLExtension, DevExperienceExtension, PerformanceExtension, SecurityExtension, IndustryExtension, CrossPlatformExtension, EnterpriseManager } from './api-gateway';
import type { FrameworkConfig } from './configuration-manager';
export type { FrameworkConfig, CloudflareConfig, VercelConfig, FrameworkInfrastructureConfig, PerformanceConfig, SecurityConfig, ComplianceConfig, MonitoringConfig, EncryptionConfig, RemoteConfigConfig, AdvancedMonitoringConfig, GovernanceConfig } from './configuration-manager';
export type { ComponentMetrics, FrameworkCoreMetrics } from './core-framework';
export type { ErrorMetrics, ErrorContext, FrameworkError, ErrorRecoveryStrategy } from './error-handler';
export type { PerformanceMetric, PerformanceBenchmark, PerformanceValidationResult, PerformanceAlert } from './performance-validator';
export type { OrchestrationMetrics } from './framework-orchestrator';
export type { SecurityPolicy, SecurityIncident, CSPConfig, XSSConfig, AuthConfig, ThreatConfig, SanitizationConfig } from './security-manager';
export type { ExtensionManifest, ExtensionPermission, ExtensionContext, Extension, ExtensionSandbox, ExtensionAPI, ExtensionEvent } from './extension-system';
export declare const createFramework: (config?: Partial<FrameworkConfig>) => any;
export declare const createOptimalConfig: () => FrameworkConfig;
export declare const VERSION = "1.0.0-alpha.1";
export declare const BUILD_TARGET = "50x React Performance";
export declare const SUPPORTED_STANDARDS: string[];
/**
 * Quick start function for development
 */
export declare const quickStart: (config?: Partial<FrameworkConfig>) => Promise<any>;
/**
 * Enterprise setup function
 */
export declare const enterpriseSetup: () => Promise<any>;
export { installBrowserPolyfills, browserSupport, IntersectionObserverPolyfill, CSSStyleSheetPolyfill } from './browser-polyfills';
export { performanceTracker, recordComponentMetrics, recordMetric, getPerformanceMetrics, type PerformanceMetrics, type ComponentPerformanceData } from './performance-tracking';
//# sourceMappingURL=index.d.ts.map