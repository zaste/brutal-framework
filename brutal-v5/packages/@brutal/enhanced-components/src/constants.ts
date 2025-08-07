/**
 * Constants for @brutal/enhanced-components
 */

/** Package version (injected at build time) */
export const VERSION = '__VERSION__';

/** Default configuration */
export const DEFAULT_CONFIG = {
  /** Default async component timeout */
  asyncTimeout: 30000,
  /** Default lazy load threshold */
  lazyThreshold: 0.1,
  /** Default lazy load margin */
  lazyMargin: '50px',
  /** Default portal target */
  portalTarget: 'body',
  /** Enable lifecycle events by default */
  lifecycleEvents: true,
  /** Enable error boundaries by default */
  errorBoundary: true
} as const;

/** Internal constants */
export const INTERNAL = {
  /** Maximum event listeners per component */
  MAX_LISTENERS: 100,
  /** Default async delay before showing loading */
  ASYNC_DELAY: 200,
  /** Visibility tracking interval */
  VISIBILITY_INTERVAL: 100,
  /** Performance mark prefix */
  PERF_PREFIX: 'brutal-enhanced'
} as const;