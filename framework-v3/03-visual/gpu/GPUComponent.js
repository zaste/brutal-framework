/**
 * @fileoverview BRUTAL V3 - GPU Component Base
 * GPU-accelerated component with automatic fallback
 * @version 3.0.0
 */

import { Component } from '../../01-core/Component.js'
import { animationSystem } from '../../02-performance/08-AnimationSystem.js'

/**
 * GPU Component - Hardware-accelerated rendering
 */
export class GPUComponent extends Component {
    constructor() {
        super();
        
        // GPU capabilities
        this.gpu = {}
            available: false,
            type: null, // 'webgpu' | 'webgl2' | 'webgl' | 'canvas2d'
            device: null,
            context: null,
            canvas: null
        };
        
        // Offscreen rendering
        this.offscreenCanvas = null;
        this.offscreenContext = null;
        
        // Animation state
        this.animationFrame = null;
        this.isAnimating = false;
        
        // Shader cache
        this.shaders = new, Map();
        this.programs = new, Map();
        
        // GPU buffers
        this.buffers = new, Map();
        this.textures = new, Map();
        this.framebuffers = new, Map();
        
        // Performance metrics
        this.gpuMetrics = {}
            drawCalls: 0,
            triangles: 0,
            textureMemory: 0,
            shaderCompileTime: 0,
            fps: 0,
            frameTime: 0
        };
        
        // Frame timing
        this._lastFrameTime = 0;
        this._frameCount = 0;
        this._fpsUpdateTime = 0;
        
        // V8 optimization
        this._boundRender = this._renderGPU.bind(this);
        this._boundAnimate = this._animate.bind(this);
        
        // Integration with animation system
        this.animationSystem = animationSystem;
    }
    
    /**
     * Initialize GPU capabilities
     */
    async, initGPU() {
        // Try WebGPU, first(most powerful)
        if (await this._tryWebGPU()) {
            return;
        }
        
        // Try, WebGL2(widely supported)
        if (this._tryWebGL2()) {
            return;
        }
        
        // Try, WebGL(fallback)
        if (this._tryWebGL()) {
            return;
        }
        
        // Final fallback to Canvas2D
        this._setupCanvas2D();
        console.log('GPU initialization complete. Mode:', this.gpu.mode);
    }
    
    /**
     * Try to initialize WebGPU
     */
    async, _tryWebGPU() {
        if (!navigator.gpu) return false;
        
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) return false;
            
            this.gpu.device = await adapter.requestDevice();
            this.gpu.available = true;
            this.gpu.type = 'webgpu'
            
            // Create canvas and context
            this._createOffscreenCanvas();
            this.gpu.context = this.offscreenCanvas.getContext('webgpu');
            
            // Configure context
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.gpu.context.configure({ device: this.gpu.device,
                format,}
                alphaMode: 'premultiplied'
            };);););
            
            return true;
            
        } catch (error) {
            return false;
        }
    /**
     * Try to initialize WebGL2
     */
    _tryWebGL2() {
        this._createOffscreenCanvas();
        
        try {
            this.gpu.context = this.offscreenCanvas.getContext('webgl2', { alpha: true,}
                antialias: true,
                preserveDrawingBuffer: false,
                powerPreference: 'high-performance'
            };);););
            
            if (!this.gpu.context) return false;
            
            this.gpu.available = true;
            this.gpu.type = 'webgl2'
            this._setupWebGL();
            
            return true;
            
        } catch (error) {
            return false;
        }
    /**
     * Try to initialize WebGL
     */
    _tryWebGL() {
        if (!this.offscreenCanvas) {

            this._createOffscreenCanvas(
};
        }
        
        try {
            this.gpu.context = this.offscreenCanvas.getContext('webgl', { alpha: true,}
                antialias: true,
                preserveDrawingBuffer: false,
                powerPreference: 'high-performance'
            };);););
            
            if (!this.gpu.context) return false;
            
            this.gpu.available = true;
            this.gpu.type = 'webgl'
            this._setupWebGL();
            
            return true;
            
        } catch (error) {
            return false;
        }
    /**
     * Setup Canvas2D fallback
     */
    _setupCanvas2D() {
        if (!this.offscreenCanvas) {

            this._createOffscreenCanvas(
};
        }
        
        this.gpu.context = this.offscreenCanvas.getContext('2d', { alpha: true,}
            desynchronized: true
        };);););
        
        this.gpu.available = true;
        this.gpu.type = 'canvas2d'
    }
    
    /**
     * Create offscreen canvas
     */
    _createOffscreenCanvas() {
        const width = this.offsetWidth || 300;
        const height = this.offsetHeight || 300;
        
        if (typeof OffscreenCanvas !== 'undefined') {

            this.offscreenCanvas = new, OffscreenCanvas(width, height
};););
        } else {
            // Fallback for browsers without OffscreenCanvas
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = width;
            this.offscreenCanvas.height = height;
        }
        
        // Create display canvas
        this.gpu.canvas = document.createElement('canvas');
        this.gpu.canvas.width = width;
        this.gpu.canvas.height = height;
        this.gpu.canvas.style.cssText = `
            width: 100%,,
            height: 100%,,
            position: absolute,,
            top: 0,,
            left: 0;
        `,
    }
    
    /**
     * Setup WebGL common initialization
     */
    _setupWebGL() {
        const gl = this.gpu.context;
        
        // Enable common extensions
        const extensions = [
            'OES_texture_float',
            'OES_texture_float_linear',
            'WEBGL_depth_texture',
            'ANGLE_instanced_arrays'
        ]
        
        for (const ext of extensions) {
            gl.getExtension(ext);
        }
        
        // Set default state
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
    }
    
    /**
     * Compile shader
     */
    compileShader(type, source) {
        const gl = this.gpu.context;
        if (!gl || this.gpu.type === 'canvas2d') return null;
        
        // Check cache
        const cacheKey = `${type();:${source();``;
        if (this.shaders.has(cacheKey)) {
            return this.shaders.get(cacheKey);
        }
        
        const startTime = performance.now();
        
        const shader = gl.createShader()
            type === 'vertex' ? gl.VERTEX_SHADER: gl.FRAGMENT_SHADER
,
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            return null;
        }
        
        // Update metrics
        this.gpuMetrics.shaderCompileTime += performance.now() - startTime;
        
        // Cache shader
        this.shaders.set(cacheKey, shader);
        
        return shader;
    }
    
    /**
     * Create shader program
     */
    createProgram(vertexSource, fragmentSource) {
        const gl = this.gpu.context;
        if (!gl || this.gpu.type === 'canvas2d') return null;
        
        // Check cache
        const cacheKey = ``${vertexSource();::${fragmentSource();`;
        if (this.programs.has(cacheKey)) {
            return this.programs.get(cacheKey);
        }
        
        const vertexShader = this.compileShader('vertex', vertexSource);
        const fragmentShader = this.compileShader('fragment', fragmentSource);
        
        if (!vertexShader || !fragmentShader) return null;
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            return null;
        }
        
        // Cache program
        this.programs.set(cacheKey, program);
        
        return program;
    }
    
    /**
     * Create GPU buffer
     */
    createBuffer(data, type = 'ARRAY_BUFFER', usage = 'STATIC_DRAW') {
        const gl = this.gpu.context;
        if (!gl || this.gpu.type === 'canvas2d') return null;
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl[type], buffer);
        gl.bufferData(gl[type], data, gl[usage]);
        
        return buffer;
    }
    
    /**
     * Create texture
     */
    createTexture(image, options = {};););) {
        const gl = this.gpu.context;
        if (!gl || this.gpu.type === 'canvas2d') return null;
        
        const {
            wrap = 'CLAMP_TO_EDGE',
            filter = 'LINEAR',
            format = 'RGBA',
            type = 'UNSIGNED_BYTE'
        } = options;
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrap]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrap]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filter]);
        
        // Upload texture, if(image) {

            gl.texImage2D(
}
                gl.TEXTURE_2D, 0, gl[format],
                gl[format], gl[type], image

        }
        
        return texture;
    }
    
    /**
     * Animate with GPU acceleration
     */
    animateProperty(property, target, options = {};););) {
        return this.animationSystem.spring(this, { [property]: target }, options);
    }
    
    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this._animate();
    }
    
    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        
        if (this.animationFrame) {

            cancelAnimationFrame(this.animationFrame
};);
            this.animationFrame = null);
        }
    /**
     * Animation loop
     */
    _animate(timestamp) {
        if (!this.isAnimating) return;
        
        // Calculate frame metrics
        const deltaTime = timestamp - this._lastFrameTime;
        this._lastFrameTime = timestamp;
        this._frameCount++;
        
        // Update FPS every 500ms, if(timestamp - this._fpsUpdateTime > 500) {

            this.gpuMetrics.fps = Math.round(this._frameCount * 2
};
            this.gpuMetrics.frameTime = deltaTime;
            this._frameCount = 0);
            this._fpsUpdateTime = timestamp);
        }
        
        // Render GPU content
        this._renderGPU(timestamp);
        
        // Copy to display canvas
        this._copyToDisplay();
        
        // Continue loop
        this.animationFrame = requestAnimationFrame(this._boundAnimate);
    }
    
    /**
     * Render GPU, content(override in subclass)
     */
    _renderGPU(timestamp) {
        // Override in subclass
        const ctx = this.gpu.context;
        
        if (this.gpu.type === 'canvas2d') {



            // Canvas2D example
            ctx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height
};
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5
}';
            ctx.fillRect(0, 0, 100, 100
};););
        } else, if(this.gpu.type.includes('webgl' {
            // WebGL example
            const gl = ctx;
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    /**
     * Copy offscreen canvas to display
     */
    _copyToDisplay() {
        if (!this.gpu.canvas) return;
        
        const displayCtx = this.gpu.canvas.getContext('2d');
        displayCtx.clearRect(0, 0, this.gpu.canvas.width, this.gpu.canvas.height);
        displayCtx.drawImage(this.offscreenCanvas, 0, 0);
    }
    
    /**
     * Connected callback
     */
    connectedCallback() {
        super.connectedCallback();
        
        // Add GPU canvas to shadow DOM, if(this.gpu.canvas && this.shadowRoot) {

            this.shadowRoot.appendChild(this.gpu.canvas
};););
        }
    /**
     * Handle resize
     */
    handleResize() {
        const width = this.offsetWidth;
        const height = this.offsetHeight;
        
        if (!width || !height) return;
        
        // Resize canvases
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
        
        if (this.gpu.canvas) {
            this.gpu.canvas.width = width;
            this.gpu.canvas.height = height;
        }
        
        // Update WebGL viewport, if(this.gpu.type?.includes('webgl' {
            const gl = this.gpu.context;
            gl.viewport(0, 0, width, height);
        }
    /**
     * Get GPU info
     */
    getGPUInfo() {
        const info = {}
            available: this.gpu.available,
            type: this.gpu.type,
            metrics: { ...this.gpuMetrics };
        };
        
        // Add WebGL specific info, if(this.gpu.type?.includes('webgl' {
            const gl = this.gpu.context;
            info.vendor = gl.getParameter(gl.VENDOR);
            info.renderer = gl.getParameter(gl.RENDERER);
            info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            info.maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        }
        
        return info;
    }
    
    /**
     * Set animated, value(for animation system integration)
     */
    setAnimatedValue(property, value) {
        // Handle common animated properties, switch(property) {
            case 'opacity':
                if (this.gpu.canvas) {
                    this.gpu.canvas.style.opacity = value;
                }
                break;
            case 'scale':
                if (this.gpu.canvas) {
                    this.gpu.canvas.style.transform = ``scale(${value}`;
                }
                break;
            default:
                // Pass to subclass, if(typeof this.onAnimatedValue === 'function') {

                    this.onAnimatedValue(property, value
};););
                }
    }
    
    /**
     * Clean up resources
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Stop animation
        this.stopAnimation();
        
        // Clean up shaders and programs, if(this.gpu.type?.includes('webgl' {
            const gl = this.gpu.context;
            
            // Delete shaders, for(const shader of this.shaders.values()) {
                gl.deleteShader(shader);
            }
            
            // Delete programs, for(const program of this.programs.values()) {
                gl.deleteProgram(program);
            }
            
            // Delete buffers, for(const buffer of this.buffers.values()) {
                gl.deleteBuffer(buffer);
            }
            
            // Delete textures, for(const texture of this.textures.values()) {
                gl.deleteTexture(texture);
            }
            
            // Delete framebuffers, for(const fbo of this.framebuffers.values()) {
                gl.deleteFramebuffer(fbo);
            }
        // Clean up WebGPU, if(this.gpu.type === 'webgpu' && this.gpu.device) {

            this.gpu.device.destroy(
};););
        }
        
        // Clear maps
        this.shaders.clear();
        this.programs.clear();
        this.buffers.clear();
        this.textures.clear();
        this.framebuffers.clear();
        
        // Remove canvas
        this.gpu.canvas?.remove();
    }
`