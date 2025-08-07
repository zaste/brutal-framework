/**
 * Constants for @brutal/plugins
 */

/** Package version (injected at build time) */
export const VERSION = '__VERSION__';

/** Default configuration */
export const DEFAULT_CONFIG = Object.freeze({
  debug: false,
  maxRetries: 3
} as const);

/** Internal constants */
export const INTERNAL = Object.freeze({
  MAX_LISTENERS: 100,
  TIMEOUT_MS: 5000
} as const);
