/**
 * @brutal/components - Component system for BRUTAL V5
 * 
 * Web Components-based UI library with reactive state management
 * 
 * @packageDocumentation
 */

// Use minimal implementation for size
export { C as Component, comp as component, Btn as Button, Inp as Input, Mod as Modal } from './minimal.js';

// Re-export old base for backward compatibility
export { BrutalComponent } from './base/BrutalComponent.js';

// Constants
export const VERSION = '__VERSION__';
export const PACKAGE_NAME = '@brutal/components';