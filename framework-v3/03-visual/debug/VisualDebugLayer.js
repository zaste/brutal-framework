/**
 * @fileoverview BRUTAL V3 - Visual Debug Layer
 * Cinematographic debugging with particle effects and real-time metrics
 * @version 3.0.0
 */

import { ParticleEngine } from '../gpu/ParticleEngine.js';
import { ComponentMonitor } from './ComponentMonitor.js';
import { DataFlowRenderer } from './DataFlowRenderer.js';
import { PerformanceHUD } from './PerformanceHUD.js';

/**
 * Visual Debug Layer - See your app like The Matrix
 */
export class VisualDebugLayer {
    constructor(options = {}) {
        this.enabled = options.enabled ?? true;
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        
        // Sub-systems
        this.particleEngine = null;
        this.componentMonitor = null;
        this.dataFlowRenderer = null;
        this.performanceHUD = null;
        
        // Recording
        this.recording = false;
        this.recordedFrames = [];
        this.recordingStartTime = 0;
        
        // Metrics
        this.metrics = {
            renders: 0,
            errors: 0,
            stateChanges: 0,
            eventCount: 0,
            lastFrame: performance.now()
        };
        
        // V8 optimization
        this._boundHandleRender = this._handleRender.bind(this);
        this._boundHandleError = this._handleError.bind(this);
        this._boundHandleStateChange = this._handleStateChange.bind(this);
        this._boundAnimationLoop = this._animationLoop.bind(this);
    }
    
    /**
     * Initialize the debug layer
     */
    async init() {
        if (!this.enabled) return;
        
        // Create overlay container
        this._createOverlay();
        
        // Initialize sub-systems
        this.particleEngine = new ParticleEngine(this.canvas);
        await this.particleEngine.init();
        
        this.componentMonitor = new ComponentMonitor();
        this.dataFlowRenderer = new DataFlowRenderer(this.ctx);
        this.performanceHUD = new PerformanceHUD(this.ctx);
        
        // Listen to framework events
        this._attachEventListeners();
        
        // Start animation loop
        this._startAnimationLoop();
        
        // Expose to window for debugging
        window.__BRUTAL_DEBUG__ = this;
        
        }
    
    /**
     * Create the overlay canvas
     */
    _createOverlay() {
        // Container
        this.container = document.createElement('div');
        this.container.id = 'brutal-debug-layer';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999999;
        `;
        
        // Canvas for effects
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true
        });
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        this.container.appendChild(this.canvas);
        document.body.appendChild(this.container);
        
        // Handle resize
        window.addEventListener('resize', () => this._handleResize());
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Component events
        window.addEventListener('brutal:render', this._boundHandleRender);
        window.addEventListener('brutal:error', this._boundHandleError);
        window.addEventListener('brutal:state-change', this._boundHandleStateChange);
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch(e.key) {
                    case 'D':
                        this.toggle();
                        break;
                    case 'R':
                        this.toggleRecording();
                        break;
                    case 'C':
                        this.clear();
                        break;
                }
            }
        });
    }
    
    /**
     * Handle component render event
     */
    _handleRender(event) {
        const { component, metrics } = event.detail;
        this.metrics.renders++;
        
        // Get component position
        const rect = component.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // Emit render particles (green)
        this.particleEngine.emit({
            x, y,
            count: 20,
            color: '#00ff00',
            speed: 2,
            life: 1000,
            size: 3
        });
        
        // Update component monitor
        this.componentMonitor.trackRender(component, metrics);
        
        // Record frame if recording
        if (this.recording) {
            this._recordFrame('render', { component: component.tagName, x, y, metrics });
        }
    }
    
    /**
     * Handle component error event
     */
    _handleError(event) {
        const { error, component } = event.detail;
        this.metrics.errors++;
        
        // Get component position
        const rect = component.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // Emit error particles (red)
        this.particleEngine.emit({
            x, y,
            count: 50,
            color: '#ff0000',
            speed: 5,
            life: 2000,
            size: 5,
            gravity: 0.2
        });
        
        // Show error message
        this._showError(error, x, y);
        
        // Record frame
        if (this.recording) {
            this._recordFrame('error', { 
                component: component.tagName, 
                error: error.message,
                x, y 
            });
        }
    }
    
    /**
     * Handle state change event
     */
    _handleStateChange(event) {
        const { component, oldState, newState } = event.detail;
        this.metrics.stateChanges++;
        
        // Visualize data flow
        this.dataFlowRenderer.renderStateChange(component, oldState, newState);
        
        // Record frame
        if (this.recording) {
            this._recordFrame('state-change', { 
                component: component.tagName,
                changes: this._diffStates(oldState, newState)
            });
        }
    }
    
    /**
     * Animation loop
     */
    _animationLoop() {
        const now = performance.now();
        const deltaTime = now - this.metrics.lastFrame;
        this.metrics.lastFrame = now;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update systems
        this.particleEngine.update(deltaTime);
        this.dataFlowRenderer.update(deltaTime);
        
        // Render systems
        this.particleEngine.render();
        this.dataFlowRenderer.render();
        this.performanceHUD.render(this.metrics, deltaTime);
        
        // Continue loop
        if (this.enabled) {
            requestAnimationFrame(this._boundAnimationLoop);
        }
    }
    
    /**
     * Start animation loop
     */
    _startAnimationLoop() {
        this.metrics.lastFrame = performance.now();
        requestAnimationFrame(this._boundAnimationLoop);
    }
    
    /**
     * Toggle debug layer
     */
    toggle() {
        this.enabled = !this.enabled;
        this.container.style.display = this.enabled ? 'block' : 'none';
        
        if (this.enabled) {
            this._startAnimationLoop();
        }
    }
    
    /**
     * Toggle recording
     */
    toggleRecording() {
        if (this.recording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    /**
     * Start recording session
     */
    startRecording() {
        this.recording = true;
        this.recordedFrames = [];
        this.recordingStartTime = performance.now();
        
        // Visual indicator
        this._showRecordingIndicator();
    }
    
    /**
     * Stop recording and save
     */
    async stopRecording() {
        this.recording = false;
        const duration = performance.now() - this.recordingStartTime;
        
        .toFixed(2)}s`);
        
        // Save recording
        const recording = {
            version: '3.0.0',
            duration,
            frames: this.recordedFrames,
            metrics: { ...this.metrics }
        };
        
        // Download as JSON
        const blob = new Blob([JSON.stringify(recording, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brutal-debug-${Date.now()}.json`;
        a.click();
        
        // Hide indicator
        this._hideRecordingIndicator();
    }
    
    /**
     * Record a frame
     */
    _recordFrame(type, data) {
        this.recordedFrames.push({
            timestamp: performance.now() - this.recordingStartTime,
            type,
            data
        });
    }
    
    /**
     * Clear all effects
     */
    clear() {
        this.particleEngine.clear();
        this.dataFlowRenderer.clear();
        this.metrics = {
            renders: 0,
            errors: 0,
            stateChanges: 0,
            eventCount: 0,
            lastFrame: performance.now()
        };
    }
    
    /**
     * Show error message
     */
    _showError(error, x, y) {
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            pointer-events: none;
            animation: fadeOut 3s forwards;
            z-index: 1000000;
        `;
        errorEl.textContent = error.message;
        
        // Add fade out animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -150%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        this.container.appendChild(errorEl);
        
        // Remove after animation
        setTimeout(() => errorEl.remove(), 3000);
    }
    
    /**
     * Show recording indicator
     */
    _showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'recording-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-family: monospace;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000001;
        `;
        indicator.innerHTML = `
            <span style="
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                animation: blink 1s infinite;
            "></span>
            REC ${this._formatTime(0)}
        `;
        
        // Add blink animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(indicator);
        
        // Update timer
        this._recordingInterval = setInterval(() => {
            const elapsed = performance.now() - this.recordingStartTime;
            indicator.innerHTML = `
                <span style="
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                    animation: blink 1s infinite;
                "></span>
                REC ${this._formatTime(elapsed)}
            `;
        }, 100);
    }
    
    /**
     * Hide recording indicator
     */
    _hideRecordingIndicator() {
        const indicator = document.getElementById('recording-indicator');
        if (indicator) indicator.remove();
        
        if (this._recordingInterval) {
            clearInterval(this._recordingInterval);
            this._recordingInterval = null;
        }
    }
    
    /**
     * Format time for display
     */
    _formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Diff two states
     */
    _diffStates(oldState, newState) {
        const changes = [];
        const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
        
        for (const key of allKeys) {
            if (oldState[key] !== newState[key]) {
                changes.push({
                    key,
                    old: oldState[key],
                    new: newState[key]
                });
            }
        }
        
        return changes;
    }
    
    /**
     * Handle window resize
     */
    _handleResize() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Notify sub-systems
        this.particleEngine?.resize(this.canvas.width, this.canvas.height);
        this.performanceHUD?.resize(this.canvas.width, this.canvas.height);
    }
    
    /**
     * Destroy the debug layer
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('brutal:render', this._boundHandleRender);
        window.removeEventListener('brutal:error', this._boundHandleError);
        window.removeEventListener('brutal:state-change', this._boundHandleStateChange);
        
        // Stop recording
        if (this.recording) {
            this.stopRecording();
        }
        
        // Destroy sub-systems
        this.particleEngine?.destroy();
        this.componentMonitor?.destroy();
        this.dataFlowRenderer?.destroy();
        this.performanceHUD?.destroy();
        
        // Remove DOM
        this.container?.remove();
        
        // Clean up
        delete window.__BRUTAL_DEBUG__;
    }
}

// Auto-initialize if debug mode is enabled
if (window.__BRUTAL__ && window.__BRUTAL__.debug) {
    const debugLayer = new VisualDebugLayer();
    debugLayer.init().catch(console.error);
}