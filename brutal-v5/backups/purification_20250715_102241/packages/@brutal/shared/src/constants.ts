/**
 * Constants for @brutal/shared
 */

/** Package version (injected at build time) */
export const VERSION = '__VERSION__';

/** Default configuration */
export const DEFAULT_CONFIG = Object.freeze({
  debug: false,
  strict: false,
  silent: false
});

/**
 * Event names used across BRUTAL
 */
export const EVENTS = {
  // Component lifecycle
  COMPONENT_MOUNT: 'brutal:component:mount',
  COMPONENT_UNMOUNT: 'brutal:component:unmount',
  COMPONENT_UPDATE: 'brutal:component:update',
  COMPONENT_ERROR: 'brutal:component:error',
  
  // State changes
  STATE_CHANGE: 'brutal:state:change',
  STATE_INIT: 'brutal:state:init',
  STATE_RESET: 'brutal:state:reset',
  
  // Router events
  ROUTE_CHANGE: 'brutal:route:change',
  ROUTE_BEFORE_ENTER: 'brutal:route:before-enter',
  ROUTE_AFTER_ENTER: 'brutal:route:after-enter',
  ROUTE_ERROR: 'brutal:route:error',
  
  // Template events
  TEMPLATE_RENDER: 'brutal:template:render',
  TEMPLATE_ERROR: 'brutal:template:error',
  
  // General
  READY: 'brutal:ready',
  ERROR: 'brutal:error'
} as const;

/**
 * DOM event names
 */
export const DOM_EVENTS = [
  'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove', 'mouseenter', 'mouseleave',
  'keydown', 'keyup', 'keypress',
  'focus', 'blur', 'focusin', 'focusout',
  'change', 'input', 'submit', 'reset',
  'scroll', 'resize',
  'touchstart', 'touchend', 'touchmove', 'touchcancel',
  'dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop',
  'load', 'error', 'abort'
] as const;

/**
 * Attribute names
 */
export const ATTRS = {
  COMPONENT: 'data-brutal-component',
  STATE: 'data-brutal-state',
  REF: 'data-brutal-ref',
  KEY: 'data-brutal-key',
  EVENT: 'data-brutal-event',
  BIND: 'data-brutal-bind',
  MODEL: 'data-brutal-model',
  IF: 'data-brutal-if',
  FOR: 'data-brutal-for',
  SHOW: 'data-brutal-show',
  CLOAK: 'data-brutal-cloak'
} as const;

/**
 * Internal symbols
 */
export const SYMBOLS = {
  COMPONENT: Symbol.for('brutal.component'),
  STATE: Symbol.for('brutal.state'),
  TEMPLATE: Symbol.for('brutal.template'),
  ROUTER: Symbol.for('brutal.router'),
  STORE: Symbol.for('brutal.store'),
  DIRECTIVE: Symbol.for('brutal.directive')
} as const;

/**
 * Reserved props
 */
export const RESERVED_PROPS = new Set([
  'key',
  'ref',
  'slot',
  'is',
  'class',
  'style',
  'id'
]);

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Component errors
  COMPONENT_NOT_FOUND: 'BRUTAL_COMPONENT_NOT_FOUND',
  COMPONENT_INVALID: 'BRUTAL_COMPONENT_INVALID',
  COMPONENT_MOUNT_FAILED: 'BRUTAL_COMPONENT_MOUNT_FAILED',
  
  // Template errors
  TEMPLATE_COMPILE_FAILED: 'BRUTAL_TEMPLATE_COMPILE_FAILED',
  TEMPLATE_RENDER_FAILED: 'BRUTAL_TEMPLATE_RENDER_FAILED',
  
  // State errors
  STATE_INVALID: 'BRUTAL_STATE_INVALID',
  STATE_READONLY: 'BRUTAL_STATE_READONLY',
  
  // Router errors
  ROUTE_NOT_FOUND: 'BRUTAL_ROUTE_NOT_FOUND',
  ROUTE_GUARD_REJECTED: 'BRUTAL_ROUTE_GUARD_REJECTED',
  
  // General errors
  INVALID_ARGUMENT: 'BRUTAL_INVALID_ARGUMENT',
  NOT_IMPLEMENTED: 'BRUTAL_NOT_IMPLEMENTED',
  DEPRECATED: 'BRUTAL_DEPRECATED'
} as const;
