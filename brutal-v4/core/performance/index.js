/**
 * BRUTAL V4 - Performance Module Exports
 * Modularized performance monitoring system
 */

export { BrutalPerformance } from './Monitor.js';
export { ComponentCollector } from './collectors/ComponentCollector.js';
export { MemoryCollector } from './collectors/MemoryCollector.js';
export { DOMCollector } from './collectors/DOMCollector.js';
export { NetworkCollector } from './collectors/NetworkCollector.js';
export { BrutalPerformanceObserver } from './observers/PerformanceObserver.js';
export { PerformanceUtils, measure } from './utils/PerformanceUtils.js';