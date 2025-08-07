/**
 * @brutal/foundation - Core primitives and utilities for BRUTAL framework
 * 
 * Zero-dependency foundation layer providing:
 * - Package registry
 * - Configuration management
 * - Polyfill strategy
 * - Core utilities
 * 
 * @packageDocumentation
 */

// Constants
export { VERSION, DEFAULT_CONFIG, INTERNAL } from './constants.js';

// Core types
export type { 
  FoundationConfig,
  PackageInfo,
  PolyfillConfig,
  EnvironmentProfile,
  ConfigOptions,
  ErrorInfo,
  DebugInfo
} from './types.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/foundation';

// Export minimal implementation
export * from './minimal.js';
