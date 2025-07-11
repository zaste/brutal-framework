/**
 * @fileoverview BRUTAL V3 - Standardized Event Names
 * Consistent event naming across the framework
 * @version 3.0.0
 */

/**
 * Standard BRUTAL event names
 */
export const BRUTAL_EVENTS = {
  // Component lifecycle
  MOUNT: 'brutal:mount',
  UNMOUNT: 'brutal:unmount',
  RENDER: 'brutal:render',
  UPDATE: 'brutal:update',
  
  // State management
  STATE_CHANGE: 'brutal:state-change',
  STATE_SYNC: 'brutal:state-sync',
  
  // Router events
  NAVIGATE: 'brutal:navigate',
  ROUTE_CHANGE: 'brutal:route-change',
  ROUTE_ERROR: 'brutal:route-error',
  
  // Error handling
  ERROR: 'brutal:error',
  WARNING: 'brutal:warning',
  
  // Performance events
  SLOW_RENDER: 'brutal:slow-render',
  MEMORY_PRESSURE: 'brutal:memory-pressure',
  
  // Debug events
  DEBUG_START: 'brutal:debug-start',
  DEBUG_STOP: 'brutal:debug-stop',
  DEBUG_LOG: 'brutal:debug-log',
  
  // Component registry
  COMPONENT_REGISTERED: 'brutal:component-registered',
  
  // Testing
  VISUAL_TEST_COMPLETE: 'brutal:visual-test-complete'
};

/**
 * Create a BRUTAL event
 */
export function createBrutalEvent(name, detail = {}) {
  return new CustomEvent(name, {
    detail,
    bubbles: true,
    composed: true
  });
}

/**
 * Emit a BRUTAL event
 */
export function emitBrutalEvent(element, name, detail = {}) {
  const event = createBrutalEvent(name, detail);
  element.dispatchEvent(event);
  return event;
}