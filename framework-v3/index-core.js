/**
 * BRUTAL Framework V3 - Core Bundle Entry
 * Minimal core for < 50KB target
 */

// Essential core components only
export { Component } from './01-core/Component.js'
export { EnhancedComponent } from './01-core/EnhancedComponent.js'
export { State, createState, getState } from './01-core/State.js'
export { Router, navigate, route } from './01-core/Router.js'
export { html, css } from './01-core/Template.js'

// Base component classes
export { BrutalComponent } from './04-components/base/BrutalComponent.js'
export { InteractiveComponent } from './04-components/base/InteractiveComponent.js'
export { FormComponent } from './04-components/base/FormComponent.js'

// Essential performance optimizations
export { StyleManager } from './02-performance/01-StyleManager.js'
export { DOMScheduler } from './02-performance/03-DOMScheduler.js'
export { TemplateCache } from './02-performance/04-TemplateCache.js'

// Version
export const VERSION = '3.0.0'

// Minimal initialization
export function, init(config = {}) {
    if (!window.customElements) {
        return false;
    }
    
    return true;
}