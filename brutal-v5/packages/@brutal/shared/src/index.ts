/**
 * @brutal/shared - Shared utilities for BRUTAL V5
 * 
 * Core utilities and types used across all BRUTAL packages
 * 
 * @packageDocumentation
 */

// DOM utilities
export * from './dom/index.js';
export { default as dom } from './dom/index.js';

// Shared types
export * from './types/index.js';

// Common utilities
export * from './utils/index.js';
export { default as utils } from './utils/index.js';

// Constants
export { VERSION, DEFAULT_CONFIG } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/shared';