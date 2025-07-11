/**
 * BRUTAL V3 - Charts Component
 * GPU-accelerated charting with WebGL rendering and real-time updates
 * Zero dependencies, 60fps performance, multiple chart types
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';
import { html } from '../../01-core/Template.js';
import { animationSystem } from '../../02-performance/08-AnimationSystem.js';
import { gestureSystem } from '../../02-performance/09-GestureSystem.js';

export class Charts extends InteractiveComponent {
    constructor() {
        super();
        
        // Chart configuration
        this._config = {
            type: 'line', // line, bar, area, scatter, pie, donut, radar, heatmap
            animation: 'smooth', // smooth, spring, bounce, none
            webglEnabled: true,
            antialiasing: true,
            realtime: false,
            interactive: true,
            showGrid: true,
            showAxes: true,
            showLegend: true,
            showTooltip: true,
            theme: 'brutal', // brutal, neon, minimal, holographic
            colors: ['#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff0000'],
            gridOpacity: 0.2,
            animationDuration: 1000,
            padding: { top: 40, right: 40, bottom: 60, left: 60 }
        };
        
        // Chart state
        this._datasets = [];
        this._scales = { x: null, y: null };
        this._dimensions = { width: 0, height: 0 };
        this._hoveredPoint = null;
        this._selectedDataset = null;
        this._animationProgress = 0;
        this._isAnimating = false;
        
        // WebGL resources
        this._canvas = null;
        this._gl = null;
        this._programs = {};
        this._buffers = {};
        this._textures = new Map();
        this._frameBuffer = null;
        
        // Canvas 2D fallback
        this._ctx = null;
        this._offscreenCanvas = null;
        
        // Performance
        this._rafId = null;
        this._lastFrame = 0;
        this._fps = 60;
        this._needsRedraw = true;
        
        // Real-time data
        this._realtimeBuffer = [];
        this._maxRealtimePoints = 100;
        this._realtimeInterval = null;
        
        // Interaction state
        this._isDragging = false;
        this._dragStart = { x: 0, y: 0 };
        this._zoom = { x: 1, y: 1 };
        this._pan = { x: 0, y: 0 };
        
        // Animation state
        this._animations = new Map();
        this._transitions = new Map();
        this._particles = [];
        
        // Bind methods
        this._render = this._render.bind(this);
        this._handleResize = this._handleResize.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleWheel = this._handleWheel.bind(this);
        this._updateRealtime = this._updateRealtime.bind(this);
    }
    
    static get observedAttributes() {
        return [...super.observedAttributes, 'type', 'theme', 'animation',
                'realtime', 'show-grid', 'show-axes', 'show-legend'];
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Initialize chart
        this._initialize();
        
        // Set up event delegation
        requestAnimationFrame(() => {
            this.shadowRoot.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                
                const action = target.dataset.action;
                switch (action) {
                    case 'toggle-type':
                        this._toggleChartType();
                        break;
                    case 'zoom-in':
                        this.zoom(1.2);
                        break;
                    case 'zoom-out':
                        this.zoom(0.8);
                        break;
                    case 'reset':
                        this.reset();
                        break;
                    case 'export':
                        this.export();
                        break;
                }
            });
        });
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clean up WebGL
        if (this._gl) {
            this._cleanupWebGL();
        }
        
        // Stop animations
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        
        // Clear realtime
        if (this._realtimeInterval) {
            clearInterval(this._realtimeInterval);
        }
        
        // Remove observers
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        
        switch (name) {
            case 'type':
                this._config.type = newValue || 'line';
                this._needsRedraw = true;
                break;
            case 'theme':
                this._config.theme = newValue || 'brutal';
                this._applyTheme();
                break;
            case 'animation':
                this._config.animation = newValue || 'smooth';
                break;
            case 'realtime':
                this._config.realtime = newValue === 'true';
                this._toggleRealtime();
                break;
            case 'show-grid':
                this._config.showGrid = newValue !== 'false';
                this._needsRedraw = true;
                break;
            case 'show-axes':
                this._config.showAxes = newValue !== 'false';
                this._needsRedraw = true;
                break;
            case 'show-legend':
                this._config.showLegend = newValue !== 'false';
                this._updateUI();
                break;
        }
    }
    
    template() {
        return html`
            <div class="charts-container ${this._config.theme}">
                <div class="charts-header">
                    <div class="charts-controls">
                        <button class="charts-control" 
                                data-action="toggle-type"
                                aria-label="Change chart type">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M2,16 L6,8 L10,12 L14,4 L18,10" 
                                      stroke="currentColor" 
                                      fill="none" 
                                      stroke-width="2"/>
                            </svg>
                        </button>
                        <button class="charts-control" 
                                data-action="zoom-in"
                                aria-label="Zoom in">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="7" 
                                        stroke="currentColor" 
                                        fill="none" 
                                        stroke-width="2"/>
                                <path d="M10,7 L10,13 M7,10 L13,10" 
                                      stroke="currentColor" 
                                      stroke-width="2"/>
                            </svg>
                        </button>
                        <button class="charts-control" 
                                data-action="zoom-out"
                                aria-label="Zoom out">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="7" 
                                        stroke="currentColor" 
                                        fill="none" 
                                        stroke-width="2"/>
                                <path d="M7,10 L13,10" 
                                      stroke="currentColor" 
                                      stroke-width="2"/>
                            </svg>
                        </button>
                        <button class="charts-control" 
                                data-action="reset"
                                aria-label="Reset view">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M3,10 A7,7 0 1,1 10,3" 
                                      stroke="currentColor" 
                                      fill="none" 
                                      stroke-width="2"/>
                                <path d="M10,3 L10,7 L6,3" 
                                      stroke="currentColor" 
                                      fill="none" 
                                      stroke-width="2"/>
                            </svg>
                        </button>
                        <button class="charts-control" 
                                data-action="export"
                                aria-label="Export chart">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M10,2 L10,12 M6,8 L10,12 L14,8" 
                                      stroke="currentColor" 
                                      stroke-width="2"/>
                                <path d="M4,14 L4,18 L16,18 L16,14" 
                                      stroke="currentColor" 
                                      stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                    ${this._config.showLegend ? this._renderLegend() : ''}
                </div>
                
                <div class="charts-viewport">
                    <canvas class="charts-canvas"></canvas>
                    ${this._config.webglEnabled ? `
                        <canvas class="charts-webgl-canvas"></canvas>
                    ` : ''}
                    <div class="charts-tooltip" style="display: none"></div>
                </div>
                
                ${this._config.realtime ? `
                    <div class="charts-realtime-indicator">
                        <span class="charts-realtime-dot"></span>
                        LIVE
                    </div>
                ` : ''}
            </div>
            
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                }
                
                .charts-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: var(--brutal-black, #000);
                    color: var(--brutal-white, #fff);
                    font-family: system-ui, -apple-system, sans-serif;
                }
                
                .charts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .charts-controls {
                    display: flex;
                    gap: 8px;
                }
                
                .charts-control {
                    width: 40px;
                    height: 40px;
                    border: 2px solid currentColor;
                    background: transparent;
                    color: inherit;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .charts-control:hover {
                    background: currentColor;
                    color: var(--brutal-black, #000);
                    transform: translateY(-2px);
                }
                
                .charts-control:active {
                    transform: translateY(0);
                }
                
                .charts-viewport {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                }
                
                .charts-canvas,
                .charts-webgl-canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                
                .charts-webgl-canvas {
                    pointer-events: none;
                }
                
                .charts-tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid currentColor;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    pointer-events: none;
                    z-index: 1000;
                    white-space: nowrap;
                }
                
                .charts-legend {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                
                .charts-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                
                .charts-legend-item:hover {
                    opacity: 1;
                }
                
                .charts-legend-item.disabled {
                    opacity: 0.3;
                }
                
                .charts-legend-color {
                    width: 16px;
                    height: 16px;
                    border-radius: 2px;
                }
                
                .charts-realtime-indicator {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255, 0, 0, 0.1);
                    border: 1px solid #ff0000;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #ff0000;
                }
                
                .charts-realtime-dot {
                    width: 8px;
                    height: 8px;
                    background: #ff0000;
                    border-radius: 50%;
                    animation: pulse 1s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                
                /* Theme: Brutal */
                .charts-container.brutal {
                    --chart-primary: #00ff00;
                    --chart-secondary: #00ffff;
                    --chart-tertiary: #ff00ff;
                    --chart-quaternary: #ffff00;
                    --chart-quinary: #ff0000;
                }
                
                /* Theme: Neon */
                .charts-container.neon {
                    --chart-primary: #00ffff;
                    --chart-secondary: #ff00ff;
                    --chart-tertiary: #ffff00;
                    --chart-quaternary: #00ff00;
                    --chart-quinary: #ff0080;
                    background: #0a0a0a;
                }
                
                .charts-container.neon .charts-control {
                    box-shadow: 0 0 10px currentColor;
                }
                
                /* Theme: Minimal */
                .charts-container.minimal {
                    --chart-primary: #333;
                    --chart-secondary: #666;
                    --chart-tertiary: #999;
                    --chart-quaternary: #ccc;
                    --chart-quinary: #000;
                    background: #fff;
                    color: #333;
                }
                
                /* Theme: Holographic */
                .charts-container.holographic {
                    --chart-primary: #ff006e;
                    --chart-secondary: #3a86ff;
                    --chart-tertiary: #06d6a0;
                    --chart-quaternary: #fb5607;
                    --chart-quinary: #ffbe0b;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                }
                
                .charts-container.holographic .charts-control {
                    border-image: linear-gradient(45deg, #ff006e, #3a86ff) 1;
                }
            </style>
        `.content;
    }
    
    _renderLegend() {
        if (!this._datasets.length) return '';
        
        return `
            <div class="charts-legend">
                ${this._datasets.map((dataset, index) => `
                    <div class="charts-legend-item ${dataset.hidden ? 'disabled' : ''}"
                         data-dataset="${index}">
                        <span class="charts-legend-color" 
                              style="background: ${dataset.color || this._config.colors[index % this._config.colors.length]}">
                        </span>
                        <span class="charts-legend-label">${dataset.label || `Dataset ${index + 1}`}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    _initialize() {
        // Set up canvases
        requestAnimationFrame(() => {
            this._canvas = this.shadowRoot.querySelector('.charts-canvas');
            this._ctx = this._canvas.getContext('2d');
            
            if (this._config.webglEnabled) {
                const webglCanvas = this.shadowRoot.querySelector('.charts-webgl-canvas');
                if (webglCanvas) {
                    this._initWebGL(webglCanvas);
                }
            }
            
            // Set up resize observer
            this._resizeObserver = new ResizeObserver(this._handleResize);
            this._resizeObserver.observe(this);
            
            // Set up interactions
            this._setupInteractions();
            
            // Initial render
            this._handleResize();
            this._startRenderLoop();
        });
    }
    
    _initWebGL(canvas) {
        this._gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!this._gl) {
            this._config.webglEnabled = false;
            return;
        }
        
        // Initialize shaders
        this._initShaders();
        
        // Set up WebGL state
        const gl = this._gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        if (this._config.antialiasing) {
            gl.enable(gl.MULTISAMPLE);
        }
    }
    
    _initShaders() {
        // Line shader
        this._programs.line = this._createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute float a_progress;
            attribute vec4 a_color;
            
            uniform mat3 u_matrix;
            uniform float u_thickness;
            
            varying vec4 v_color;
            varying float v_progress;
            
            void main() {
                vec3 position = u_matrix * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                gl_PointSize = u_thickness;
                
                v_color = a_color;
                v_progress = a_progress;
            }
            `,
            // Fragment shader
            `
            precision mediump float;
            
            varying vec4 v_color;
            varying float v_progress;
            
            uniform float u_time;
            uniform float u_animationProgress;
            
            void main() {
                float alpha = v_color.a * u_animationProgress;
                
                // Glow effect
                float glow = sin(u_time * 2.0 + v_progress * 10.0) * 0.1 + 0.9;
                
                gl_FragColor = vec4(v_color.rgb * glow, alpha);
            }
            `
        );
        
        // Bar shader
        this._programs.bar = this._createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute vec4 a_color;
            
            uniform mat3 u_matrix;
            
            varying vec4 v_color;
            varying vec2 v_position;
            
            void main() {
                vec3 position = u_matrix * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                
                v_color = a_color;
                v_position = a_position;
            }
            `,
            // Fragment shader
            `
            precision mediump float;
            
            varying vec4 v_color;
            varying vec2 v_position;
            
            uniform float u_time;
            uniform float u_animationProgress;
            
            void main() {
                float alpha = v_color.a * u_animationProgress;
                
                // Gradient effect
                float gradient = 1.0 - (v_position.y + 1.0) * 0.5;
                vec3 color = mix(v_color.rgb, v_color.rgb * 0.7, gradient);
                
                // Shimmer effect
                float shimmer = sin(u_time * 3.0 + v_position.x * 5.0) * 0.05 + 0.95;
                
                gl_FragColor = vec4(color * shimmer, alpha);
            }
            `
        );
        
        // Particle shader for effects
        this._programs.particle = this._createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute vec2 a_velocity;
            attribute float a_size;
            attribute vec4 a_color;
            attribute float a_life;
            
            uniform mat3 u_matrix;
            uniform float u_time;
            
            varying vec4 v_color;
            varying float v_life;
            
            void main() {
                vec2 position = a_position + a_velocity * u_time;
                vec3 transformed = u_matrix * vec3(position, 1.0);
                
                gl_Position = vec4(transformed.xy, 0.0, 1.0);
                gl_PointSize = a_size * (1.0 - a_life);
                
                v_color = a_color;
                v_life = a_life;
            }
            `,
            // Fragment shader
            `
            precision mediump float;
            
            varying vec4 v_color;
            varying float v_life;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float distance = length(coord);
                
                if (distance > 0.5) {
                    discard;
                }
                
                float alpha = (1.0 - distance * 2.0) * (1.0 - v_life) * v_color.a;
                gl_FragColor = vec4(v_color.rgb, alpha);
            }
            `
        );
    }
    
    _createProgram(vertexSource, fragmentSource) {
        const gl = this._gl;
        
        const vertexShader = this._createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this._createShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            );
            return null;
        }
        
        // Cache attribute and uniform locations
        const attributes = {};
        const uniforms = {};
        
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        return { program, attributes, uniforms };
    }
    
    _createShader(type, source) {
        const gl = this._gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            );
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    _setupInteractions() {
        const canvas = this._canvas;
        
        // Mouse events
        canvas.addEventListener('mousemove', this._handleMouseMove);
        canvas.addEventListener('mousedown', this._handleMouseDown.bind(this));
        canvas.addEventListener('mouseup', this._handleMouseUp.bind(this));
        canvas.addEventListener('mouseleave', this._handleMouseLeave.bind(this));
        
        // Wheel events
        canvas.addEventListener('wheel', this._handleWheel, { passive: false });
        
        // Touch events
        if (gestureSystem) {
            gestureSystem.registerGesture(this, 'pan', {
                element: canvas,
                threshold: 5
            });
            
            gestureSystem.registerGesture(this, 'pinch', {
                element: canvas
            });
            
            this.addEventListener('pan', this._handlePan.bind(this));
            this.addEventListener('pinch', this._handlePinch.bind(this));
        }
        
        // Legend interactions
        this.shadowRoot.addEventListener('click', (e) => {
            const legendItem = e.target.closest('.charts-legend-item');
            if (legendItem) {
                const index = parseInt(legendItem.dataset.dataset);
                this._toggleDataset(index);
            }
        });
    }
    
    _handleResize() {
        const rect = this.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this._dimensions.width = rect.width;
        this._dimensions.height = rect.height;
        
        // Update canvas sizes
        this._canvas.width = rect.width * dpr;
        this._canvas.height = rect.height * dpr;
        this._canvas.style.width = rect.width + 'px';
        this._canvas.style.height = rect.height + 'px';
        
        this._ctx.scale(dpr, dpr);
        
        if (this._gl) {
            const webglCanvas = this.shadowRoot.querySelector('.charts-webgl-canvas');
            webglCanvas.width = rect.width * dpr;
            webglCanvas.height = rect.height * dpr;
            webglCanvas.style.width = rect.width + 'px';
            webglCanvas.style.height = rect.height + 'px';
            
            this._gl.viewport(0, 0, rect.width * dpr, rect.height * dpr);
        }
        
        // Update scales
        this._updateScales();
        this._needsRedraw = true;
    }
    
    _handleMouseMove(e) {
        const rect = this._canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this._isDragging) {
            const dx = x - this._dragStart.x;
            const dy = y - this._dragStart.y;
            
            this._pan.x += dx / this._zoom.x;
            this._pan.y += dy / this._zoom.y;
            
            this._dragStart.x = x;
            this._dragStart.y = y;
            
            this._needsRedraw = true;
        } else {
            // Check hover
            const point = this._findNearestPoint(x, y);
            if (point !== this._hoveredPoint) {
                this._hoveredPoint = point;
                this._updateTooltip(point, x, y);
                this._needsRedraw = true;
            }
        }
    }
    
    _handleMouseDown(e) {
        const rect = this._canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this._isDragging = true;
        this._dragStart = { x, y };
        this._canvas.style.cursor = 'grabbing';
    }
    
    _handleMouseUp() {
        this._isDragging = false;
        this._canvas.style.cursor = 'grab';
    }
    
    _handleMouseLeave() {
        this._isDragging = false;
        this._hoveredPoint = null;
        this._hideTooltip();
        this._canvas.style.cursor = 'default';
    }
    
    _handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(delta);
    }
    
    _handlePan(e) {
        this._pan.x += e.detail.deltaX / this._zoom.x;
        this._pan.y += e.detail.deltaY / this._zoom.y;
        this._needsRedraw = true;
    }
    
    _handlePinch(e) {
        this.zoom(e.detail.scale);
    }
    
    _startRenderLoop() {
        const render = (timestamp) => {
            const deltaTime = timestamp - this._lastFrame;
            this._lastFrame = timestamp;
            
            // Calculate FPS
            this._fps = 1000 / deltaTime;
            
            // Update animations
            this._updateAnimations(deltaTime);
            
            // Update particles
            if (this._particles.length > 0) {
                this._updateParticles(deltaTime);
            }
            
            // Render if needed
            if (this._needsRedraw || this._isAnimating || this._particles.length > 0) {
                this._render();
                this._needsRedraw = false;
            }
            
            this._rafId = requestAnimationFrame(render);
        };
        
        this._rafId = requestAnimationFrame(render);
    }
    
    _render() {
        // Clear canvases
        this._ctx.clearRect(0, 0, this._dimensions.width, this._dimensions.height);
        
        if (this._gl) {
            const gl = this._gl;
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        
        // Apply transforms
        this._ctx.save();
        this._ctx.translate(
            this._dimensions.width / 2 + this._pan.x,
            this._dimensions.height / 2 + this._pan.y
        );
        this._ctx.scale(this._zoom.x, this._zoom.y);
        this._ctx.translate(
            -this._dimensions.width / 2,
            -this._dimensions.height / 2
        );
        
        // Render grid
        if (this._config.showGrid) {
            this._renderGrid();
        }
        
        // Render axes
        if (this._config.showAxes) {
            this._renderAxes();
        }
        
        // Render chart
        switch (this._config.type) {
            case 'line':
                this._renderLineChart();
                break;
            case 'bar':
                this._renderBarChart();
                break;
            case 'area':
                this._renderAreaChart();
                break;
            case 'scatter':
                this._renderScatterChart();
                break;
            case 'pie':
                this._renderPieChart();
                break;
            case 'donut':
                this._renderDonutChart();
                break;
            case 'radar':
                this._renderRadarChart();
                break;
            case 'heatmap':
                this._renderHeatmapChart();
                break;
        }
        
        // Render WebGL effects
        if (this._gl && this._config.webglEnabled) {
            this._renderWebGLEffects();
        }
        
        // Render particles
        if (this._particles.length > 0) {
            this._renderParticles();
        }
        
        this._ctx.restore();
    }
    
    _renderGrid() {
        const ctx = this._ctx;
        const padding = this._config.padding;
        const width = this._dimensions.width - padding.left - padding.right;
        const height = this._dimensions.height - padding.top - padding.bottom;
        
        ctx.save();
        ctx.translate(padding.left, padding.top);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this._config.gridOpacity})`;
        ctx.lineWidth = 1;
        
        // Vertical lines
        const xStep = width / 10;
        for (let i = 0; i <= 10; i++) {
            const x = i * xStep;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        const yStep = height / 10;
        for (let i = 0; i <= 10; i++) {
            const y = i * yStep;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    _renderAxes() {
        const ctx = this._ctx;
        const padding = this._config.padding;
        const width = this._dimensions.width - padding.left - padding.right;
        const height = this._dimensions.height - padding.top - padding.bottom;
        
        ctx.save();
        ctx.translate(padding.left, padding.top);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        // X axis
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);
        ctx.stroke();
        
        // Y axis
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        
        // Labels
        if (this._scales.x && this._scales.y) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // X labels
            const xTicks = this._scales.x.ticks();
            xTicks.forEach(tick => {
                const x = this._scales.x(tick);
                ctx.fillText(tick, x, height + 5);
            });
            
            // Y labels
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const yTicks = this._scales.y.ticks();
            yTicks.forEach(tick => {
                const y = this._scales.y(tick);
                ctx.fillText(tick, -5, y);
            });
        }
        
        ctx.restore();
    }
    
    _renderLineChart() {
        const ctx = this._ctx;
        const padding = this._config.padding;
        
        ctx.save();
        ctx.translate(padding.left, padding.top);
        
        this._datasets.forEach((dataset, datasetIndex) => {
            if (dataset.hidden) return;
            
            const color = dataset.color || this._config.colors[datasetIndex % this._config.colors.length];
            
            ctx.strokeStyle = color;
            ctx.lineWidth = dataset.lineWidth || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Draw line
            ctx.beginPath();
            dataset.data.forEach((point, index) => {
                const x = this._scales.x(point.x);
                const y = this._scales.y(point.y);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            // Apply animation
            if (this._isAnimating) {
                ctx.save();
                const dashLength = ctx.measureText('').width * 100;
                ctx.setLineDash([dashLength]);
                ctx.lineDashOffset = dashLength * (1 - this._animationProgress);
            }
            
            ctx.stroke();
            
            if (this._isAnimating) {
                ctx.restore();
            }
            
            // Draw points
            if (dataset.showPoints !== false) {
                ctx.fillStyle = color;
                dataset.data.forEach(point => {
                    const x = this._scales.x(point.x);
                    const y = this._scales.y(point.y);
                    
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Hover effect
                    if (this._hoveredPoint && 
                        this._hoveredPoint.datasetIndex === datasetIndex &&
                        this._hoveredPoint.pointIndex === dataset.data.indexOf(point)) {
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                });
            }
        });
        
        ctx.restore();
    }
    
    _renderBarChart() {
        const ctx = this._ctx;
        const padding = this._config.padding;
        const width = this._dimensions.width - padding.left - padding.right;
        const height = this._dimensions.height - padding.top - padding.bottom;
        
        ctx.save();
        ctx.translate(padding.left, padding.top);
        
        // Calculate bar width
        const dataPoints = this._datasets[0]?.data.length || 0;
        const barGroupWidth = width / dataPoints;
        const barWidth = barGroupWidth / (this._datasets.length + 1);
        
        this._datasets.forEach((dataset, datasetIndex) => {
            if (dataset.hidden) return;
            
            const color = dataset.color || this._config.colors[datasetIndex % this._config.colors.length];
            
            dataset.data.forEach((point, index) => {
                const x = this._scales.x(point.x) - barGroupWidth / 2 + 
                         (datasetIndex + 0.5) * barWidth;
                const y = this._scales.y(point.y);
                const barHeight = height - y;
                
                // Apply animation
                const animatedHeight = barHeight * this._animationProgress;
                const animatedY = height - animatedHeight;
                
                // Draw bar
                ctx.fillStyle = color;
                ctx.fillRect(x - barWidth / 2, animatedY, barWidth, animatedHeight);
                
                // Hover effect
                if (this._hoveredPoint && 
                    this._hoveredPoint.datasetIndex === datasetIndex &&
                    this._hoveredPoint.pointIndex === index) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x - barWidth / 2, animatedY, barWidth, animatedHeight);
                }
            });
        });
        
        ctx.restore();
    }
    
    _renderAreaChart() {
        const ctx = this._ctx;
        const padding = this._config.padding;
        const height = this._dimensions.height - padding.top - padding.bottom;
        
        ctx.save();
        ctx.translate(padding.left, padding.top);
        
        this._datasets.forEach((dataset, datasetIndex) => {
            if (dataset.hidden) return;
            
            const color = dataset.color || this._config.colors[datasetIndex % this._config.colors.length];
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, color + '80');
            gradient.addColorStop(1, color + '00');
            
            // Draw area
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            dataset.data.forEach((point, index) => {
                const x = this._scales.x(point.x);
                const y = this._scales.y(point.y);
                
                if (index === 0) {
                    ctx.moveTo(x, height);
                    ctx.lineTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            // Close path
            const lastPoint = dataset.data[dataset.data.length - 1];
            if (lastPoint) {
                ctx.lineTo(this._scales.x(lastPoint.x), height);
            }
            ctx.closePath();
            
            // Apply animation
            ctx.globalAlpha = this._animationProgress;
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Draw line on top
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            dataset.data.forEach((point, index) => {
                const x = this._scales.x(point.x);
                const y = this._scales.y(point.y);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        });
        
        ctx.restore();
    }
    
    _renderScatterChart() {
        const ctx = this._ctx;
        const padding = this._config.padding;
        
        ctx.save();
        ctx.translate(padding.left, padding.top);
        
        this._datasets.forEach((dataset, datasetIndex) => {
            if (dataset.hidden) return;
            
            const color = dataset.color || this._config.colors[datasetIndex % this._config.colors.length];
            
            dataset.data.forEach((point, index) => {
                const x = this._scales.x(point.x);
                const y = this._scales.y(point.y);
                const size = point.size || 6;
                
                // Apply animation
                const animatedSize = size * this._animationProgress;
                
                // Draw point
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, animatedSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Hover effect
                if (this._hoveredPoint && 
                    this._hoveredPoint.datasetIndex === datasetIndex &&
                    this._hoveredPoint.pointIndex === index) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Ripple effect
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(x, y, animatedSize * 2, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            });
        });
        
        ctx.restore();
    }
    
    _renderPieChart() {
        const ctx = this._ctx;
        const centerX = this._dimensions.width / 2;
        const centerY = this._dimensions.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        ctx.save();
        
        // Calculate total
        const total = this._datasets[0]?.data.reduce((sum, point) => sum + point.value, 0) || 0;
        
        let currentAngle = -Math.PI / 2;
        
        this._datasets[0]?.data.forEach((point, index) => {
            const value = point.value || 0;
            const angle = (value / total) * Math.PI * 2;
            const animatedAngle = angle * this._animationProgress;
            
            const color = point.color || this._config.colors[index % this._config.colors.length];
            
            // Draw slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + animatedAngle);
            ctx.closePath();
            ctx.fill();
            
            // Hover effect
            if (this._hoveredPoint && this._hoveredPoint.pointIndex === index) {
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(currentAngle + animatedAngle / 2);
                ctx.translate(10, 0);
                ctx.rotate(-(currentAngle + animatedAngle / 2));
                ctx.translate(-centerX, -centerY);
                
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + animatedAngle);
                ctx.closePath();
                ctx.stroke();
                
                ctx.restore();
            }
            
            // Label
            const labelAngle = currentAngle + animatedAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.75);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.75);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(point.label || `${Math.round(value / total * 100)}%`, labelX, labelY);
            
            currentAngle += angle;
        });
        
        ctx.restore();
    }
    
    _renderDonutChart() {
        const ctx = this._ctx;
        const centerX = this._dimensions.width / 2;
        const centerY = this._dimensions.height / 2;
        const outerRadius = Math.min(centerX, centerY) - 40;
        const innerRadius = outerRadius * 0.6;
        
        ctx.save();
        
        // Calculate total
        const total = this._datasets[0]?.data.reduce((sum, point) => sum + point.value, 0) || 0;
        
        let currentAngle = -Math.PI / 2;
        
        this._datasets[0]?.data.forEach((point, index) => {
            const value = point.value || 0;
            const angle = (value / total) * Math.PI * 2;
            const animatedAngle = angle * this._animationProgress;
            
            const color = point.color || this._config.colors[index % this._config.colors.length];
            
            // Draw slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + animatedAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + animatedAngle, currentAngle, true);
            ctx.closePath();
            ctx.fill();
            
            // Hover effect
            if (this._hoveredPoint && this._hoveredPoint.pointIndex === index) {
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(currentAngle + animatedAngle / 2);
                ctx.translate(10, 0);
                ctx.rotate(-(currentAngle + animatedAngle / 2));
                ctx.translate(-centerX, -centerY);
                
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + animatedAngle);
                ctx.arc(centerX, centerY, innerRadius, currentAngle + animatedAngle, currentAngle, true);
                ctx.closePath();
                ctx.stroke();
                
                ctx.restore();
            }
            
            currentAngle += angle;
        });
        
        // Center text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(total)}`, centerX, centerY);
        
        ctx.restore();
    }
    
    _renderRadarChart() {
        const ctx = this._ctx;
        const centerX = this._dimensions.width / 2;
        const centerY = this._dimensions.height / 2;
        const radius = Math.min(centerX, centerY) - 60;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Draw grid
        const axes = this._datasets[0]?.data.length || 0;
        const angleStep = (Math.PI * 2) / axes;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${this._config.gridOpacity})`;
        ctx.lineWidth = 1;
        
        // Concentric circles
        for (let i = 1; i <= 5; i++) {
            const r = (radius / 5) * i;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Axes
        for (let i = 0; i < axes; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            // Labels
            const labelX = Math.cos(angle) * (radius + 20);
            const labelY = Math.sin(angle) * (radius + 20);
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this._datasets[0]?.data[i]?.label || `Axis ${i + 1}`, labelX, labelY);
        }
        
        // Draw data
        this._datasets.forEach((dataset, datasetIndex) => {
            if (dataset.hidden) return;
            
            const color = dataset.color || this._config.colors[datasetIndex % this._config.colors.length];
            
            ctx.fillStyle = color + '40';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            dataset.data.forEach((point, index) => {
                const angle = index * angleStep - Math.PI / 2;
                const value = (point.value / 100) * radius * this._animationProgress;
                const x = Math.cos(angle) * value;
                const y = Math.sin(angle) * value;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = color;
            dataset.data.forEach((point, index) => {
                const angle = index * angleStep - Math.PI / 2;
                const value = (point.value / 100) * radius * this._animationProgress;
                const x = Math.cos(angle) * value;
                const y = Math.sin(angle) * value;
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        
        ctx.restore();
    }
    
    _renderHeatmapChart() {
        const ctx = this._ctx;
        const padding = this._config.padding;
        const width = this._dimensions.width - padding.left - padding.right;
        const height = this._dimensions.height - padding.top - padding.bottom;
        
        ctx.save();
        ctx.translate(padding.left, padding.top);
        
        if (this._datasets[0]) {
            const data = this._datasets[0].data;
            const rows = data.length;
            const cols = data[0]?.length || 0;
            
            const cellWidth = width / cols;
            const cellHeight = height / rows;
            
            data.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    const x = colIndex * cellWidth;
                    const y = rowIndex * cellHeight;
                    
                    // Map value to color
                    const intensity = Math.min(Math.max(value / 100, 0), 1) * this._animationProgress;
                    const hue = (1 - intensity) * 240; // Blue to red
                    
                    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                    ctx.fillRect(x, y, cellWidth, cellHeight);
                    
                    // Hover effect
                    if (this._hoveredPoint && 
                        this._hoveredPoint.row === rowIndex &&
                        this._hoveredPoint.col === colIndex) {
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, cellWidth, cellHeight);
                    }
                });
            });
        }
        
        ctx.restore();
    }
    
    _renderWebGLEffects() {
        if (!this._gl || !this._particles.length) return;
        
        const gl = this._gl;
        const program = this._programs.particle;
        
        if (!program) return;
        
        gl.useProgram(program.program);
        
        // Create particle data
        const particleData = [];
        this._particles.forEach(particle => {
            particleData.push(
                particle.x, particle.y,
                particle.vx, particle.vy,
                particle.size,
                particle.r, particle.g, particle.b, particle.a,
                particle.life
            );
        });
        
        // Update buffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleData), gl.DYNAMIC_DRAW);
        
        // Set attributes
        const stride = 10 * 4; // 10 floats per particle
        
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, stride, 0);
        
        gl.enableVertexAttribArray(program.attributes.a_velocity);
        gl.vertexAttribPointer(program.attributes.a_velocity, 2, gl.FLOAT, false, stride, 8);
        
        gl.enableVertexAttribArray(program.attributes.a_size);
        gl.vertexAttribPointer(program.attributes.a_size, 1, gl.FLOAT, false, stride, 16);
        
        gl.enableVertexAttribArray(program.attributes.a_color);
        gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, stride, 20);
        
        gl.enableVertexAttribArray(program.attributes.a_life);
        gl.vertexAttribPointer(program.attributes.a_life, 1, gl.FLOAT, false, stride, 36);
        
        // Set uniforms
        const matrix = this._createProjectionMatrix();
        gl.uniformMatrix3fv(program.uniforms.u_matrix, false, matrix);
        gl.uniform1f(program.uniforms.u_time, performance.now() / 1000);
        
        // Draw
        gl.drawArrays(gl.POINTS, 0, this._particles.length);
    }
    
    _renderParticles() {
        const ctx = this._ctx;
        
        this._particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = (1 - particle.life) * particle.a;
            ctx.fillStyle = `rgb(${particle.r * 255}, ${particle.g * 255}, ${particle.b * 255})`;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (1 - particle.life), 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    _updateAnimations(deltaTime) {
        if (this._isAnimating) {
            this._animationProgress += deltaTime / this._config.animationDuration;
            
            if (this._animationProgress >= 1) {
                this._animationProgress = 1;
                this._isAnimating = false;
            }
        }
        
        // Update custom animations
        this._animations.forEach((animation, key) => {
            animation.progress += deltaTime / animation.duration;
            
            if (animation.progress >= 1) {
                animation.progress = 1;
                animation.onComplete?.();
                this._animations.delete(key);
            } else {
                animation.onUpdate?.(animation.progress);
            }
        });
    }
    
    _updateParticles(deltaTime) {
        const dt = deltaTime / 1000;
        
        for (let i = this._particles.length - 1; i >= 0; i--) {
            const particle = this._particles[i];
            
            // Update physics
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 100 * dt; // Gravity
            
            // Update life
            particle.life += dt;
            
            // Remove dead particles
            if (particle.life > 1) {
                this._particles.splice(i, 1);
            }
        }
    }
    
    _updateScales() {
        if (!this._datasets.length) return;
        
        const padding = this._config.padding;
        const width = this._dimensions.width - padding.left - padding.right;
        const height = this._dimensions.height - padding.top - padding.bottom;
        
        // Find data bounds
        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;
        
        this._datasets.forEach(dataset => {
            dataset.data.forEach(point => {
                if (point.x !== undefined) {
                    xMin = Math.min(xMin, point.x);
                    xMax = Math.max(xMax, point.x);
                }
                if (point.y !== undefined) {
                    yMin = Math.min(yMin, point.y);
                    yMax = Math.max(yMax, point.y);
                }
            });
        });
        
        // Create scales with function call support
        this._scales.x = ((xMin, xMax, width) => {
            const scale = (value) => ((value - xMin) / (xMax - xMin)) * width;
            scale.domain = [xMin, xMax];
            scale.range = [0, width];
            scale.invert = (pixel) => (pixel / width) * (xMax - xMin) + xMin;
            scale.ticks = () => {
                const ticks = [];
                const step = (xMax - xMin) / 10;
                for (let i = 0; i <= 10; i++) {
                    ticks.push(xMin + i * step);
                }
                return ticks;
            };
            return scale;
        })(xMin, xMax, width);
        
        this._scales.y = ((yMin, yMax, height) => {
            const scale = (value) => height - ((value - yMin) / (yMax - yMin)) * height;
            scale.domain = [yMin, yMax];
            scale.range = [height, 0];
            scale.invert = (pixel) => ((height - pixel) / height) * (yMax - yMin) + yMin;
            scale.ticks = () => {
                const ticks = [];
                const step = (yMax - yMin) / 10;
                for (let i = 0; i <= 10; i++) {
                    ticks.push(yMin + i * step);
                }
                return ticks;
            };
            return scale;
        })(yMin, yMax, height);
    }
    
    _findNearestPoint(x, y) {
        if (!this._datasets.length) return null;
        
        const padding = this._config.padding;
        const localX = x - padding.left;
        const localY = y - padding.top;
        
        let nearest = null;
        let minDistance = Infinity;
        
        this._datasets.forEach((dataset, datasetIndex) => {
            if (dataset.hidden) return;
            
            dataset.data.forEach((point, pointIndex) => {
                const px = this._scales.x(point.x);
                const py = this._scales.y(point.y);
                
                const distance = Math.sqrt((px - localX) ** 2 + (py - localY) ** 2);
                
                if (distance < minDistance && distance < 20) {
                    minDistance = distance;
                    nearest = {
                        datasetIndex,
                        pointIndex,
                        point,
                        x: px + padding.left,
                        y: py + padding.top
                    };
                }
            });
        });
        
        return nearest;
    }
    
    _updateTooltip(point, mouseX, mouseY) {
        const tooltip = this.shadowRoot.querySelector('.charts-tooltip');
        
        if (!point) {
            this._hideTooltip();
            return;
        }
        
        const dataset = this._datasets[point.datasetIndex];
        const label = dataset.label || `Dataset ${point.datasetIndex + 1}`;
        const value = point.point.y;
        
        tooltip.innerHTML = `
            <strong>${label}</strong><br>
            X: ${point.point.x}<br>
            Y: ${value}
        `;
        
        tooltip.style.display = 'block';
        tooltip.style.left = mouseX + 10 + 'px';
        tooltip.style.top = mouseY - 30 + 'px';
    }
    
    _hideTooltip() {
        const tooltip = this.shadowRoot.querySelector('.charts-tooltip');
        tooltip.style.display = 'none';
    }
    
    _toggleChartType() {
        const types = ['line', 'bar', 'area', 'scatter', 'pie', 'donut', 'radar', 'heatmap'];
        const currentIndex = types.indexOf(this._config.type);
        const nextIndex = (currentIndex + 1) % types.length;
        
        this._config.type = types[nextIndex];
        this._animationProgress = 0;
        this._isAnimating = true;
        
        // Create particles for transition
        this._createTransitionParticles();
        
        this._needsRedraw = true;
    }
    
    _toggleDataset(index) {
        if (this._datasets[index]) {
            this._datasets[index].hidden = !this._datasets[index].hidden;
            this._updateUI();
            this._needsRedraw = true;
        }
    }
    
    _createTransitionParticles() {
        const count = 50;
        const colors = this._config.colors;
        
        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const rgb = this._hexToRgb(color);
            
            this._particles.push({
                x: Math.random() * this._dimensions.width,
                y: Math.random() * this._dimensions.height,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: Math.random() * 10 + 5,
                r: rgb.r / 255,
                g: rgb.g / 255,
                b: rgb.b / 255,
                a: 1,
                life: 0
            });
        }
    }
    
    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 0 };
    }
    
    _createProjectionMatrix() {
        const width = this._dimensions.width;
        const height = this._dimensions.height;
        
        return new Float32Array([
            2 / width, 0, 0,
            0, -2 / height, 0,
            -1, 1, 1
        ]);
    }
    
    _applyTheme() {
        this._updateUI();
        this._needsRedraw = true;
    }
    
    _toggleRealtime() {
        if (this._config.realtime) {
            this._startRealtime();
        } else {
            this._stopRealtime();
        }
    }
    
    _startRealtime() {
        if (this._realtimeInterval) return;
        
        this._realtimeInterval = setInterval(this._updateRealtime, 100);
    }
    
    _stopRealtime() {
        if (this._realtimeInterval) {
            clearInterval(this._realtimeInterval);
            this._realtimeInterval = null;
        }
    }
    
    _updateRealtime() {
        // Simulate real-time data
        this._datasets.forEach(dataset => {
            // Add new point
            const lastPoint = dataset.data[dataset.data.length - 1];
            const newX = lastPoint ? lastPoint.x + 1 : 0;
            const newY = Math.random() * 100;
            
            dataset.data.push({ x: newX, y: newY });
            
            // Remove old points
            if (dataset.data.length > this._maxRealtimePoints) {
                dataset.data.shift();
            }
        });
        
        this._updateScales();
        this._needsRedraw = true;
    }
    
    _cleanupWebGL() {
        const gl = this._gl;
        
        // Delete programs
        Object.values(this._programs).forEach(program => {
            if (program && program.program) {
                gl.deleteProgram(program.program);
            }
        });
        
        // Delete buffers
        Object.values(this._buffers).forEach(buffer => {
            if (buffer) {
                gl.deleteBuffer(buffer);
            }
        });
        
        // Delete textures
        this._textures.forEach(texture => {
            if (texture) {
                gl.deleteTexture(texture);
            }
        });
        
        // Delete framebuffer
        if (this._frameBuffer) {
            gl.deleteFramebuffer(this._frameBuffer);
        }
    }
    
    // Public API
    setData(datasets) {
        this._datasets = datasets;
        this._updateScales();
        this._animationProgress = 0;
        this._isAnimating = true;
        this._needsRedraw = true;
    }
    
    addDataset(dataset) {
        this._datasets.push(dataset);
        this._updateScales();
        this._updateUI();
        this._needsRedraw = true;
    }
    
    removeDataset(index) {
        this._datasets.splice(index, 1);
        this._updateScales();
        this._updateUI();
        this._needsRedraw = true;
    }
    
    updateDataset(index, data) {
        if (this._datasets[index]) {
            this._datasets[index].data = data;
            this._updateScales();
            this._needsRedraw = true;
        }
    }
    
    zoom(factor) {
        this._zoom.x *= factor;
        this._zoom.y *= factor;
        
        // Limit zoom
        this._zoom.x = Math.max(0.1, Math.min(10, this._zoom.x));
        this._zoom.y = Math.max(0.1, Math.min(10, this._zoom.y));
        
        this._needsRedraw = true;
        
        // Emit event
        this.dispatchEvent(new CustomEvent('zoom', {
            detail: { x: this._zoom.x, y: this._zoom.y }
        }));
    }
    
    reset() {
        this._zoom = { x: 1, y: 1 };
        this._pan = { x: 0, y: 0 };
        this._animationProgress = 0;
        this._isAnimating = true;
        this._needsRedraw = true;
    }
    
    export() {
        // Export as image
        const canvas = document.createElement('canvas');
        canvas.width = this._canvas.width;
        canvas.height = this._canvas.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this._canvas, 0, 0);
        
        // Trigger download
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = canvas.toDataURL();
        link.click();
    }
    
    setType(type) {
        this._config.type = type;
        this._animationProgress = 0;
        this._isAnimating = true;
        this._createTransitionParticles();
        this._needsRedraw = true;
    }
    
    setTheme(theme) {
        this._config.theme = theme;
        this._applyTheme();
    }
    
    get state() {
        return {
            type: this._config.type,
            datasets: this._datasets.length,
            zoom: { ...this._zoom },
            pan: { ...this._pan },
            fps: this._fps,
            particles: this._particles.length
        };
    }
}

// Register element
customElements.define('brutal-charts', Charts);