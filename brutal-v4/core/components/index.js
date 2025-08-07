/**
 * BRUTAL V4 - Components Module Index
 * Core component system exports
 */

// Lifecycle hooks system
export { LifecycleHooks, HookPhase, registerGlobalHook } from './LifecycleHooks.js';

// Enhanced component base
export { EnhancedBrutalComponent } from './EnhancedComponent.js';

// Re-export base component for compatibility
export { BrutalComponent } from '../foundation/Component.js';

// ErrorBoundary component
export { BrutalErrorBoundary } from './ErrorBoundary.js';