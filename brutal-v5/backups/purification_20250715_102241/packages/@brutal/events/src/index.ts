/**
 * @brutal/events - Event system for BRUTAL V5
 * 
 * Comprehensive event handling with typed events, delegation, and cross-component communication
 * 
 * @packageDocumentation
 */

// Core event emitter
export { EventEmitter } from './emitter/EventEmitter.js';
export type { EmitterOptions } from './emitter/EventEmitter.js';

// Event bus
export { EventBus, globalBus } from './bus/index.js';
export type { BusOptions } from './bus/index.js';

// DOM event handling
export { DOMEventManager, domEvents, emit, createEvent } from './handlers/index.js';
export type { DelegationHandler } from './handlers/index.js';

// Types
export * from './types/index.js';

// Constants
export { VERSION, DEFAULT_CONFIG, LIMITS, EVENTS } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/events';