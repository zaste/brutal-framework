/**
 * BRUTAL V4 - Main Entry Point
 * 
 * Clean, organized exports for the entire framework
 */

// Core Foundation
export { BrutalComponent } from './core/foundation/Component.js';

// State Management
export { BrutalState } from './core/state/State.js';

// Event System
export { BrutalEvents } from './core/events/Events.js';

// Template System
export { html, css, render } from './core/templates/index.js';

// Scheduling
export { renderScheduler, RenderPriority } from './core/scheduling/RenderScheduler.js';

// Memory Safety
export { BrutalWeakCache } from './core/memory/WeakCache.js';

// Workers (if needed)
export { BrutalWorkerPool } from './core/workers/WorkerPool.js';

// Testing System
export * from './testing/index.js';

// Version info
export const VERSION = '4.0.0';
export const BUILD = 'development';

// Feature detection
export const features = {
    shadowDOM: 'attachShadow' in Element.prototype,
    customElements: 'customElements' in window,
    modules: 'noModule' in HTMLScriptElement.prototype,
    constructableStyleSheets: 'adoptedStyleSheets' in Document.prototype,
    elementInternals: 'attachInternals' in HTMLElement.prototype,
    weakRefs: typeof WeakRef !== 'undefined'
};