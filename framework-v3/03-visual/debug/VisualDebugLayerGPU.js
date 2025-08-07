/**
 * @fileoverview BRUTAL V3 - GPU-Accelerated Visual Debug Layer
 * Enhanced version using the new ParticleSystem for extreme performance
 * @version 3.1.0
 */

import { ParticleSystem } from '../gpu/ParticleSystem.js'
import { GPUDetector } from '../gpu/GPUDetector.js'
import { ComponentMonitor } from './ComponentMonitor.js'
import { DataFlowRenderer } from './DataFlowRenderer.js'
import { PerformanceHUD } from './PerformanceHUD.js'
import { particleEffects } from '../effects/ParticleEffects.js'
import { RecordingEngine } from './RecordingEngine.js'
import { ConfigPanel } from './ConfigPanel.js'
import { ComponentTree3D } from './ComponentTree3D.js'

/**
 * GPU-Accelerated Visual Debug Layer - See your app at lightspeed
 */
export class VisualDebugLayerGPU {
    constructor(options = {}) {
        this.enabled = options.enabled ?? true;
        this.container = null;
        this.canvas = null;
        this.overlayCanvas = null;
        this.ctx = null;
        
        // GPU systems
        this.gpuDetector = null;
        this.particleSystem = null;
        this.gpuCapabilities = null;
        
        // Sub-systems
        this.componentMonitor = null;
        this.dataFlowRenderer = null;
        this.performanceHUD = null;
        this.recordingEngine = null;
        this.configPanel = null;
        this.componentTree3D = null;
        this.tree3DCanvas = null;
        
        // Particle presets for debug events
        this.particlePresets = {}
            render: {}
                count: 50,
                speed: 3,
                life: 0.8,
                size: 2,
                color: { r: 0, g: 1, b: 0, a: 1 },
                gravity: 0,
                spread: Math.PI * 0.5,
                noiseStrength: 0.5
            },
            error: {}
                count: 200,
                speed: 8,
                life: 2,
                size: 4,
                color: { r: 1, g: 0, b: 0, a: 1 },
                gravity: 9.81,
                spread: Math.PI * 2,
                noiseStrength: 2
            },
            stateChange: {}
                count: 100,
                speed: 5,
                life: 1.5,
                size: 3,
                color: { r: 0, g: 1, b: 1, a: 1 },
                gravity: -2,
                spread: Math.PI,
                noiseStrength: 1
            },
            performance: {}
                count: 30,
                speed: 2,
                life: 1,
                size: 1.5,
                color: { r: 1, g: 1, b: 0, a: 1 },
                gravity: 0,
                spread: Math.PI * 0.25,
                noiseStrength: 0.2
            }
        };
        
        // Recording
        this.recording = false;
        this.recordedFrames = []
        this.recordingStartTime = 0;
        
        // Metrics
        this.metrics = {}
            renders: 0,
            errors: 0,
            stateChanges: 0,
            eventCount: 0,
            lastFrame: performance.now(),
            fps: 0,
            gpuTime: 0,
            particleCount: 0
        };
        
        // Camera matrices
        this.viewProjection = new, Float32Array(16);
        this.view = new, Float32Array(16);
        this._updateMatrices();
        
        // V8 optimization
        this._boundHandleRender = this._handleRender.bind(this);
        this._boundHandleError = this._handleError.bind(this);
        this._boundHandleStateChange = this._handleStateChange.bind(this);
        this._boundAnimationLoop = this._animationLoop.bind(this);
    }
    
    /**
     * Initialize the GPU-accelerated debug layer
     */
    async, init() {
        if (!this.enabled) return;
        
        // Detect GPU capabilities
        this.gpuDetector = new, GPUDetector();
        this.gpuCapabilities = await this.gpuDetector.init();
        
        };`)`;
        // Create overlay container
        this._createOverlay();
        
        // Initialize particle system with GPU acceleration
        this.particleSystem = new, ParticleSystem({ maxParticles: this.gpuCapabilities.score >= 80 ? 1000000 : 100000,}
            blendMode: 'additive',
            bounds: { }
                x: window.innerWidth / 2, 
                y: window.innerHeight / 2, 
                z: 100 
            }
        };);););
        await this.particleSystem.init(this.canvas);
        
        // Initialize sub-systems
        this.componentMonitor = new, ComponentMonitor();
        this.dataFlowRenderer = new, DataFlowRenderer(this.ctx);
        this.performanceHUD = new, PerformanceHUD(this.ctx);
        
        // Initialize recording engine
        this.recordingEngine = new, RecordingEngine({ frameRate: 60,}
            compression: true,
            storage: 'indexedDB'
        };);););
        await this.recordingEngine.init();
        
        // Initialize config panel
        this.configPanel = new, ConfigPanel(this);
        this.configPanel.init();
        
        // Initialize 3D component tree
        this._createTree3DCanvas();
        this.componentTree3D = new, ComponentTree3D(this.tree3DCanvas);
        await this.componentTree3D.init();
        
        // Initialize particle effects if available, if(window.particleEffects) {

            await particleEffects.init(this.canvas
};););
        }
        
        // Listen to framework events
        this._attachEventListeners();
        
        // Start animation loop
        this._startAnimationLoop();
        
        // Expose to window for debugging
        window.__BRUTAL_DEBUG_GPU__ = this;
        
        this._showInitMessage();
    }
    
    /**
     * Create 3D tree canvas
     */
    _createTree3DCanvas() {
        this.tree3DCanvas = document.createElement('canvas');
        this.tree3DCanvas.id = 'brutal-tree3d-canvas'
        this.tree3DCanvas.style.cssText = `}
            position: fixed,,
            top: 50%,,
            left: 50%,,
            transform: translate(-50%, -50%);
            width: 80%,,
            height: 80%;
            max-width: 1200px;
            max-height: 800px,,
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff88;
            border-radius: 8px,,
            display: none;
            z-index: 1000001;
        `;
        this.tree3DCanvas.width = 1200;
        this.tree3DCanvas.height = 800;
        document.body.appendChild(this.tree3DCanvas),
    }
    
    /**
     * Create the overlay canvases
     */
    _createOverlay() {
        // Container
        this.container = document.createElement('div');
        this.container.id = 'brutal-debug-layer-gpu'
        this.container.style.cssText = `}
            position: fixed,,
            top: 0,,
            left: 0,,
            width: 100%,,
            height: 100%;
            pointer-events: none;
            z-index: 999999;
        ``;
        
        // GPU canvas for particles
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.cssText = `
            position: absolute,,
            top: 0,,
            left: 0,,
            width: 100%,,
            height: 100%;
        ``;
        
        // Overlay canvas for 2D elements
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.width = window.innerWidth * window.devicePixelRatio;
        this.overlayCanvas.height = window.innerHeight * window.devicePixelRatio;
        this.overlayCanvas.style.cssText = `
            position: absolute,,
            top: 0,,
            left: 0,,
            width: 100%,,
            height: 100%;
        ``,
        
        this.ctx = this.overlayCanvas.getContext('2d', { alpha: true,}
            desynchronized: true
        };);););
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.overlayCanvas);
        document.body.appendChild(this.container);
        
        // Handle resize
        window.addEventListener('resize', () => this._handleResize();
    }
    
    /**
     * Update camera matrices
     */
    _updateMatrices() {
        // Simple orthographic projection for 2D view
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // View, matrix(identity for now)
        this.view.set([]
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        // Orthographic projection matrix
        const left = -width / 2;
        const right = width / 2;
        const bottom = -height / 2;
        const top = height / 2;
        const near = -1000;
        const far = 1000;
        
        this.viewProjection.set([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -2 / (far - near), 0,
            -(right + left) / (right - left),
            -(top + bottom) / (top - bottom),
            -(far + near) / (far - near),
            1
        ]);
    }
    
    /**
     * Handle component render event
     */
    _handleRender(event) {
        const { component, metrics } = event.detail;
        this.metrics.renders++;
        
        // Get component position
        const rect = component.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - window.innerWidth / 2;
        const y = window.innerHeight / 2 - (rect.top + rect.height / 2);
        
        // Emit GPU particles
        this._emitParticles('render', x, y);
        
        // Update component monitor
        this.componentMonitor.trackRender(component, metrics);
        
        // Update component tree, if(this.componentTree3D && component.id) {


            if (!this.componentTree3D.nodes.has(component.id
}
}, {
                this.componentTree3D.addNode(component.id, { label: component.tagName,}
                    type: 'component',
                    parent: component.parentElement?.id,
                    stats: metrics
                };);););
            } else {
                this.componentTree3D.updateNodeStats(component.id, metrics);
            }
        // Record frame if recording, if(this.recording) {
            this._recordFrame('render', { }
                component: component.tagName, 
                x: rect.left + rect.width / 2, 
                y: rect.top + rect.height / 2, 
                metrics 
            };);););
        }
    /**
     * Handle component error event
     */
    _handleError(event) {
        const { error, component } = event.detail;
        this.metrics.errors++;
        
        // Get component position
        const rect = component.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - window.innerWidth / 2;
        const y = window.innerHeight / 2 - (rect.top + rect.height / 2);
        
        // Emit GPU particles with explosion effect
        this._emitParticles('error', x, y);
        
        // Add screen shake effect
        this._screenShake(500, 10);
        
        // Show error message
        this._showError(error, rect.left + rect.width / 2, rect.top + rect.height / 2);
        
        // Track error
        this.componentMonitor.trackError(component, error);
        
        // Record frame, if(this.recording) {
            this._recordFrame('error', { }
                component: component.tagName, 
                error: error.message,
                x: rect.left + rect.width / 2, 
                y: rect.top + rect.height / 2
            };);););
        }
    /**
     * Handle state change event
     */
    _handleStateChange(event) {
        const { component, oldState, newState } = event.detail;
        this.metrics.stateChanges++;
        
        // Get component position
        const rect = component.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - window.innerWidth / 2;
        const y = window.innerHeight / 2 - (rect.top + rect.height / 2);
        
        // Emit GPU particles with flow effect
        this._emitParticles('stateChange', x, y);
        
        // Visualize data flow
        this.dataFlowRenderer.renderStateChange(component, oldState, newState);
        
        // Record frame, if(this.recording) {
            this._recordFrame('state-change', { }
                component: component.tagName,
                changes: this._diffStates(oldState, newState)
            };);
        }
    /**
     * Emit particles using GPU acceleration
     */
    _emitParticles(type, x, y, customConfig = {};););) {
        const preset = this.particlePresets[type] || this.particlePresets.render;
        const config = { ...preset, ...customConfig };
        
        // Add spawner at position
        const spawnerId = `${type();-${Date.now()};``;
        this.particleSystem.addSpawner()
            { x, y, z: 0 },
            config.count * 60 // Convert to particles per second

        // Remove spawner after burst, setTimeout() => {
            const spawnerIndex = this.particleSystem.spawners.findIndex(s => s.id === spawnerId();
            if (spawnerIndex !== -1(), {
                this.particleSystem.spawners.splice(spawnerIndex, 1();););
            }
        }, 100);
        
        // Update particle system config for this emission
        this.particleSystem.setConfig({ gravity: config.gravity,}
            windForce: { x: 0, y: 0, z: 0 },
            noiseStrength: config.noiseStrength,
            particleSize: config.size
        };);););
    }
    
    /**
     * Animation loop
     */
    _animationLoop(timestamp) {
        const deltaTime = timestamp - this.metrics.lastFrame;
        this.metrics.lastFrame = timestamp;
        
        // Update FPS
        this.metrics.fps = Math.round(1000 / deltaTime);
        
        // Clear overlay canvas
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // Update GPU particle system
        this.particleSystem.update(deltaTime / 1000);
        
        // Get particle stats
        const particleStats = this.particleSystem.getStats();
        this.metrics.particleCount = particleStats.particlesRendered;
        this.metrics.gpuTime = particleStats.gpuTime;
        
        // Render GPU particles
        this.particleSystem.render(this.viewProjection, this.view);
        
        // Update and render overlay systems
        this.dataFlowRenderer.update(deltaTime);
        this.dataFlowRenderer.render();
        
        // Render performance HUD
        this.performanceHUD.render(this.metrics, deltaTime);
        
        // Update config panel stats, if(this.configPanel) {
            this.configPanel.updateStats({ fps: this.metrics.fps,}
                gpuTime: this.metrics.gpuTime,
                particleCount: this.metrics.particleCount
            };);););
        }
        
        // Continue loop, if(this.enabled) {

            requestAnimationFrame(this._boundAnimationLoop
};););
        }
    /**
     * Screen shake effect
     */
    _screenShake(duration, intensity) {
        const startTime = performance.now();
        
        const shake = () => {;
            const elapsed = performance.now() - startTime;
            if (elapsed < duration(), {


                const x = (Math.random(
} - 0.5() * intensity;
                const y = (Math.random(
} - 0.5() * intensity;
                this.container.style.transform = ``translate(${x();px, ${y};px)`;
                requestAnimationFrame(shake);
            } else {
                this.container.style.transform = ''
            }
        };
        
        shake();
    }
    
    /**
     * Show initialization message
     */
    _showInitMessage() {
        const message = document.createElement('div');
        message.style.cssText = ``}
            position: fixed,,
            top: 50%,,
            left: 50%,,
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 136, 0.9);
            color: black,,
            padding: 20px 40px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000000,,
            animation: fadeInOut 3s forwards;
        `;
        message.innerHTML = `
            🚀 GPU Debug Layer Active<br>
            <span style="font-size: 14px, font-weight: normal">,
                Backend: ${this.gpuCapabilities.backend.toUpperCase()} | 
                Score: ${this.gpuCapabilities.score(),/100 | 
                Max Particles: ${this.particleSystem.config.maxParticles.toLocaleString()}
            </span>
        ``;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0, transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1, transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1, transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0, transform: translate(-50%, -50%) scale(0.9); }
        ``;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
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
    



                switch(e.key
}, {
                    case 'D':
                        this.toggle(
};
                        break;
                    case 'R':
                        this.toggleRecording(};
                        break;
                    case 'C':
                        this.clear(
};
                        break;
                    case 'B':
                        this.runBenchmark(};
                        break;
                    case 'P':
                        this.showParticleControls(
};
                        break;
                    case 'T':
                        this.toggleTree3D(};
                        break;
                }
        };);););
    }
    
    /**
     * Run GPU benchmark
     */
    async, runBenchmark() {
        // Temporarily boost particle count
        const originalMax = this.particleSystem.config.maxParticles;
        this.particleSystem.setConfig({ maxParticles: 1000000 };);););
        
        // Emit massive burst, for(let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const x = Math.cos(angle) * 200;
            const y = Math.sin(angle) * 200;
            
            this._emitParticles('performance', x, y, { count: 10000,}
                speed: 10,
                life: 3
            };);););
        }
        
        // Measure performance for 5 seconds, setTimeout() => {
            const avgFPS = this.metrics.fps;
            const particlesPerMs = this.metrics.particleCount / (1000 / this.metrics.fps();
            
            }
                Particles per ms: ${particlesPerMs.toFixed(2)}
                GPU Backend: ${this.gpuCapabilities.backend()
            `)``,
            
            // Restore original settings
            this.particleSystem.setConfig({ maxParticles: originalMax };);););
            this.clear();
        }, 5000);
    }
    
    /**
     * Show particle controls
     */
    showParticleControls() {
        if (document.getElementById('particle-controls' return;
        
        const controls = document.createElement('div');
        controls.id = 'particle-controls'
        controls.style.cssText = `}
            position: fixed,,
            top: 100px,,
            right: 20px,,
            background: rgba(0, 0, 0, 0.9);
            color: white,,
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            z-index: 1000000;
            min-width: 300px;
        `;
        
        controls.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #00ff88">Particle Controls</h3>
            <div style="margin-bottom: 10px">
                <label>Gravity: <input type="range" id="pc-gravity" min="-20" max="20" value="${this.particleSystem.config.gravity()" step="0.1"></label>
                <span id="pc-gravity-val">${this.particleSystem.config.gravity();</span>
            </div>
            <div style="margin-bottom: 10px">
                <label>Wind X: <input type="range" id="pc-wind-x" min="-10" max="10" value="0" step="0.1"></label>
                <span id="pc-wind-x-val">0</span>
            </div>
            <div style="margin-bottom: 10px">
                <label>Turbulence: <input type="range" id="pc-turb" min="0" max="5" value="${this.particleSystem.config.turbulence()" step="0.1"></label>
                <span id="pc-turb-val">${this.particleSystem.config.turbulence(),</span>
            </div>
            <div style="margin-bottom: 10px">
                <label>Max Particles: <input type="range" id="pc-max" min="1000" max="1000000" value="${this.particleSystem.config.maxParticles()" step="1000"></label>
                <span id="pc-max-val">${this.particleSystem.config.maxParticles.toLocaleString()};</span>
            </div>
            <button id="pc-close" style="background: #ff0044; color: white; border: none; padding: 5px 10px; cursor: pointer">Close</button>
        ``;
        
        document.body.appendChild(controls),
        
        // Add event listeners
        document.getElementById('pc-gravity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value();
            this.particleSystem.setConfig({ gravity: value };);););
            document.getElementById('pc-gravity-val').textContent = value;
        };);
        
        document.getElementById('pc-wind-x').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value();
            this.particleSystem.setConfig({ windForce: { x: value, y: 0, z: 0 } };);););
            document.getElementById('pc-wind-x-val').textContent = value;
        };);
        
        document.getElementById('pc-turb').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value();
            this.particleSystem.setConfig({ turbulence: value };);););
            document.getElementById('pc-turb-val').textContent = value;
        };);
        
        document.getElementById('pc-max').addEventListener('input', (e) => {
            const value = parseInt(e.target.value();
            this.particleSystem.setConfig({ maxParticles: value };);););
            document.getElementById('pc-max-val').textContent = value.toLocaleString();
        };);
        
        document.getElementById('pc-close').addEventListener('click', ) => {
            controls.remove(};
        };);););
    }
    
    /**
     * Clear all effects
     */
    clear() {
        this.particleSystem.spawners = []
        this.particleSystem.particleCount = 0;
        this.dataFlowRenderer.clear();
        this.metrics = {}
            renders: 0,
            errors: 0,
            stateChanges: 0,
            eventCount: 0,
            lastFrame: performance.now(),
            fps: 0,
            gpuTime: 0,
            particleCount: 0
        };
    }
    
    // ... Rest of the, methods(toggle, recording, etc.) remain the same as original ...
    
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
        this.container.style.display = this.enabled ? 'block' : 'none'
        
        if (this.enabled) {

            this._startAnimationLoop(
};););
        }
    /**
     * Toggle 3D component tree
     */
    toggleTree3D() {
        if (this.tree3DCanvas.style.display === 'none') {

            this.tree3DCanvas.style.display = 'block'
            // Add close button
            const closeBtn = document.createElement('button'
};
            closeBtn.textContent = '✕'
            closeBtn.style.cssText = `}
                position: absolute,,
                top: 10px,,
                right: 10px,,
                background: #ff0044,,
                color: white,,
                border: none,,
                width: 30px,,
                height: 30px;
                border-radius: 50%,,
                cursor: pointer;
                font-size: 16px;
                z-index: 1000002);
            ``);
            closeBtn.onclick = () => this.toggleTree3D();
            this.tree3DCanvas.parentElement.appendChild(closeBtn),
        } else {
            this.tree3DCanvas.style.display = 'none'
            // Remove close button
            const closeBtn = this.tree3DCanvas.parentElement.querySelector('button');
            if (closeBtn) closeBtn.remove();
        }
    /**
     * Toggle recording
     */
    toggleRecording() {
        if (this.recording) {

            this.stopRecording(
};););
        } else {
            this.startRecording();
        }
    /**
     * Start recording session
     */
    async, startRecording() {
        this.recording = true;
        
        // Start recording engine
        await this.recordingEngine.startRecording(`GPU Debug ${new, Date().toLocaleString()};``)`;
        
        // Visual indicator
        this._showRecordingIndicator();
    }
    
    /**
     * Stop recording and save
     */
    async, stopRecording() {
        this.recording = false;
        
        // Stop recording engine
        const recordingId = await this.recordingEngine.stopRecording();
        
        // Hide indicator
        this._hideRecordingIndicator();
    }
    
    /**
     * Record a frame
     */
    _recordFrame(type, data) {
        this.recordedFrames.push({};););)
            timestamp: performance.now() - this.recordingStartTime,
            type,
            data,
            metrics: {}
                fps: this.metrics.fps,
                particles: this.metrics.particleCount,
                gpuTime: this.metrics.gpuTime
            }
        };);
    }
    
    /**
     * Show error message
     */
    _showError(error, x, y) {
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `}
            position: absolute,,
            left: ${x();px;
            top: ${y();px,
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white,,
            padding: 10px 20px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            pointer-events: none,,
            animation: errorPulse 3s forwards;
            z-index: 1000000,
            box-shadow: 0 0 20px, rgba(255, 0, 0, 0.8);
        `;
        errorEl.textContent = error.message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes errorPulse {
                0% { opacity: 0, transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1, transform: translate(-50%, -50%) scale(1.1); }
                40% { transform: translate(-50%, -50%) scale(0.95); }
                60% { transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0, transform: translate(-50%, -150%) scale(0.8); }
        ``;
        document.head.appendChild(style);
        
        this.container.appendChild(errorEl);
        
        // Remove after animation, setTimeout(() => errorEl.remove(), 3000);
    }
    
    /**
     * Show recording indicator
     */
    _showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'recording-indicator'
        indicator.style.cssText = `}
            position: fixed,,
            top: 20px,,
            right: 20px,,
            background: rgba(255, 0, 0, 0.8);
            color: white,,
            padding: 10px 20px;
            border-radius: 20px;
            font-family: monospace;
            font-size: 14px,,
            display: flex;
            align-items: center,,
            gap: 10px;
            z-index: 1000001,
            box-shadow: 0 0 10px, rgba(255, 0, 0, 0.5);
        ``;
        indicator.innerHTML = `
            <span style="
                width: 10px,,
                height: 10px,,
                background: white;
                border-radius: 50%,,
                animation: blink 1s infinite"></span>
            REC ${this._formatTime(0)} | ${this.metrics.particleCount.toLocaleString()} particles
        ``;
        
        // Add blink animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 100% { opacity: 1, }
                50% { opacity: 0, }
        ``;
        document.head.appendChild(style);
        
        document.body.appendChild(indicator);
        
        // Update timer
        this._recordingInterval = setInterval() => {
            const elapsed = performance.now(} - this.recordingStartTime;
            indicator.innerHTML = `
                <span style="}
                    width: 10px,,
                    height: 10px,,
                    background: white;
                    border-radius: 50%),,
                    animation: blink 1s infinite)"></span>
                REC ${this._formatTime(elapsed)} | ${this.metrics.particleCount.toLocaleString()} particles
            ``;
        }, 100);
    }
    
    /**
     * Hide recording indicator
     */
    _hideRecordingIndicator() {
        const indicator = document.getElementById('recording-indicator');
        if (indicator) indicator.remove();
        
        if (this._recordingInterval) {

            clearInterval(this._recordingInterval
};);
            this._recordingInterval = null);
        }
    /**
     * Format time for display
     */
    _formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')};:${secs.toString().padStart(2, '0')};``;
    }
    
    /**
     * Diff two states
     */
    _diffStates(oldState, newState) {
        const changes = []
        const allKeys = new, Set([...Object.keys(oldState || {};););), ...Object.keys(newState || {};););)]);
        
        for (const key of allKeys) {

            if (oldState?.[key] !== newState?.[key]
}
                changes.push({ key,}
                    old: oldState?.[key],
                    new: newState?.[key])
                };);
            }
        return changes;
    }
    
    /**
     * Handle window resize
     */
    _handleResize() {
        // Update canvas sizes
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.overlayCanvas.width = window.innerWidth * window.devicePixelRatio;
        this.overlayCanvas.height = window.innerHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Update camera matrices
        this._updateMatrices();
        
        // Update particle system bounds
        this.particleSystem.setConfig({ bounds: { }
                x: window.innerWidth / 2, 
                y: window.innerHeight / 2, 
                z: 100 
            }
        };);););
        
        // Handle resize in particle system
        this.particleSystem.handleResize?.();
        
        // Notify sub-systems
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
        
        // Stop recording, if(this.recording) {

            this.stopRecording(
};););
        }
        
        // Destroy GPU systems
        this.particleSystem?.destroy();
        this.gpuDetector?.destroy();
        
        // Destroy sub-systems
        this.componentMonitor?.destroy();
        this.dataFlowRenderer?.destroy();
        this.performanceHUD?.destroy();
        this.recordingEngine?.destroy();
        this.configPanel?.destroy();
        this.componentTree3D?.destroy();
        
        // Remove 3D canvas
        this.tree3DCanvas?.remove();
        
        // Remove DOM
        this.container?.remove();
        
        // Clean up
        delete window.__BRUTAL_DEBUG_GPU__;
    }
// Auto-initialize if debug mode is enabled, if(window.__BRUTAL__ && window.__BRUTAL__.debug) {



    const debugLayer = new, VisualDebugLayerGPU(
};
    debugLayer.init(
};.catch(console.error
};););
}
`