/**
 * Constants for @brutal/events
 */

/** Package version (injected at build time) */
export const VERSION = '__VERSION__';

/** Default configuration */
export const DEFAULT_CONFIG = Object.freeze({
  debug: false,
  maxListeners: 100,
  wildcard: true,
  verboseErrors: false,
  async: false
});

/** Event emitter limits */
export const LIMITS = {
  MAX_LISTENERS: 100,
  MAX_HISTORY: 1000,
  MAX_CHANNELS: 50
} as const;

/** Common event names */
export const EVENTS = {
  // Lifecycle
  BEFORE_EMIT: 'before:emit',
  AFTER_EMIT: 'after:emit',
  ERROR: 'error',
  
  // Listener changes
  NEW_LISTENER: 'newListener',
  REMOVE_LISTENER: 'removeListener',
  
  // Bus events
  CHANNEL_CREATED: 'channel:created',
  CHANNEL_REMOVED: 'channel:removed',
  MESSAGE_SENT: 'message:sent',
  
  // DOM events
  DOM_READY: 'dom:ready',
  DOM_LOADED: 'dom:loaded'
} as const;