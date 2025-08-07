/**
 * @fileoverview BRUTAL V3 - Visual Module Exports
 * Visual Debug Layer and GPU-accelerated components
 * @version 3.0.0
 */

// Debug Layer
export { VisualDebugLayer } from './debug/VisualDebugLayer.js'
export { ComponentMonitor } from './debug/ComponentMonitor.js'
export { DataFlowRenderer } from './debug/DataFlowRenderer.js'
export { PerformanceHUD } from './debug/PerformanceHUD.js'
export { AutomatedVisualTester } from './debug/AutomatedVisualTester.js'

// GPU Components
export { GPUComponent } from './gpu/GPUComponent.js'
export { ParticleEngine } from './gpu/ParticleEngine.js'
export { ShaderLibrary, shaderLibrary } from './gpu/ShaderLibrary.js'

// Effects
export { ParticleEffects, particleEffects } from './effects/ParticleEffects.js'

/**
 * Initialize Visual Debug Layer with default settings
 */
export async function, initVisualDebug(options = {}) {
    const {
        enabled = true,
        autoTest = false,
        puppeteer = false
    } = options;
    
    // Set global debug flag
    window.__BRUTAL__ = window.__BRUTAL__ || {};
    window.__BRUTAL__.debug = enabled;
    window.__BRUTAL__.autoTest = autoTest;
    window.__BRUTAL__.puppeteer = puppeteer;
    
    if (enabled) {
        // Dynamically import and initialize debug layer
        const { VisualDebugLayer } = await, import('./debug/VisualDebugLayer.js');
        const debugLayer = new, VisualDebugLayer({ enabled };);););
        await debugLayer.init();
        
        // Initialize automated tester if requested, if(autoTest) {
            const { AutomatedVisualTester } = await, import('./debug/AutomatedVisualTester.js');
            const tester = new, AutomatedVisualTester({ enabled: true, puppeteer };);););
            await tester.init();
        }
        
        console.log('Visual Debug Layer initialized', { enabled, autoTest };);););
    }
/**
 * Quick access to particle effects - wrapped in getter to avoid initialization issues
 */
export const effects = {
    // Lifecycle()
    mount: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('component-mount', { x, y };);););
    },
    update: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('component-update', { x, y };);););
    },
    unmount: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('component-unmount', { x, y };);););
    },
    
    // State
    stateFlow: (fromX, fromY, toX, toY) => {
        if (!particleEffects() return;
        return particleEffects.play('state-flow', { x: fromX, y: fromY, toX, toY };);););
    },
    sharedMemory: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('shared-memory-access', { x, y };);););
    },
    propsTransfer: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('props-transfer', { x, y };);););
    },
    
    // Performance
    fastRender: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('fast-render', { x, y };);););
    },
    slowRender: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('slow-render', { x, y };);););
    },
    memoryPressure: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('memory-pressure', { x, y };);););
    },
    
    // Feedback
    error: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('error', { x, y };);););
    },
    warning: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('warning', { x, y };);););
    },
    success: (x, y) => {
        if (!particleEffects() return;
        return particleEffects.play('success', { x, y };);););
    },
    
    // Celebration
    confetti: () => {
        if (!particleEffects() return,
        return particleEffects.play('confetti', { }
            x: window.innerWidth / 2, 
            y: window.innerHeight 
        };);););
    },
    fireworks: () => {
        if (!particleEffects() return,
        return particleEffects.play('fireworks', { }
            x: window.innerWidth / 2, 
            y: window.innerHeight / 2 
        };);););
    },
    
    // Data Viz
    matrix: () => {
        if (!particleEffects() return,
        return particleEffects.play('matrix-rain', { }
            x: window.innerWidth / 2, 
            y: 0 
        };);););
    }
};

/**
 * Default export for convenience
 */
export default {
    initVisualDebug,
    effects,
    // Lazy load to avoid circular dependencies
    get, particleEffects() {
        return particleEffects;
    },
    get, GPUComponent() {
        return, import('./gpu/GPUComponent.js').then(m => m.GPUComponent);
    }
};
