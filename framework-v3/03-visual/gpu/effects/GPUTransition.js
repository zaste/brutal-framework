/**
 * @fileoverview BRUTAL GPU Transition Effect Component
 * @version 1.0.0
 * @license MIT
 */

import { GPUComponent } from '../GPUComponent.js';

/**
 * GPU-accelerated transition effect component
 */
export class GPUTransition extends GPUComponent {
    constructor() {
        super();
        
        // Transition parameters
        this.transitionType = 'fade'; // fade, slide, zoom, rotate, dissolve, glitch, morph
        this.transitionDuration = 1000; // ms
        this.transitionEasing = 'ease-in-out';
        this.transitionDirection = 'left'; // for directional transitions
        
        // Transition state
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.startTime = 0;
        
        // Textures
        this.fromTexture = null;
        this.toTexture = null;
        
        // Transition programs
        this.transitionPrograms = new Map();
        
        // Quad buffer
        this.quadBuffer = null;
        
        // Animation frame
        this.animationFrame = null;
        
        // Callbacks
        this.onComplete = null;
    }
    
    /**
     * Initialize transition effect
     */
    async init() {
        await this.initGPU();
        
        if (this.gpu.type === 'webgpu') {
            await this._initWebGPU();
        } else if (this.gpu.type.includes('webgl')) {
            this._initWebGL();
        }
        
        this.isInitialized = true;
    }
    
    /**
     * Initialize WebGL transitions
     */
    _initWebGL() {
        const gl = this.gpu.context;
        
        // Create quad buffer
        const quadVertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        this.quadBuffer = this.createBuffer(quadVertices);
        
        // Create transition shaders
        this._createTransitionShaders();
    }
    
    /**
     * Create transition shaders
     */
    _createTransitionShaders() {
        const vertexSource = `#version 300 es
            in vec2 a_position;
            out vec2 v_texCoord;
            
            void main() {
                v_texCoord = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Fade transition
        this.transitionPrograms.set('fade', this.createProgram(vertexSource, `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform float u_progress;
            
            void main() {
                vec4 fromColor = texture(u_from, v_texCoord);
                vec4 toColor = texture(u_to, v_texCoord);
                
                fragColor = mix(fromColor, toColor, u_progress);
            }
        `));
        
        // Slide transition
        this.transitionPrograms.set('slide', this.createProgram(vertexSource, `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform float u_progress;
            uniform vec2 u_direction;
            
            void main() {
                vec2 uv = v_texCoord;
                vec2 offset = u_direction * u_progress;
                
                vec2 uvFrom = uv + offset;
                vec2 uvTo = uv + offset - u_direction;
                
                vec4 fromColor = texture(u_from, uvFrom);
                vec4 toColor = texture(u_to, uvTo);
                
                float mask = step(0.0, uvFrom.x) * step(uvFrom.x, 1.0) * 
                            step(0.0, uvFrom.y) * step(uvFrom.y, 1.0);
                
                fragColor = mix(toColor, fromColor, mask);
            }
        `));
        
        // Zoom transition
        this.transitionPrograms.set('zoom', this.createProgram(vertexSource, `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform float u_progress;
            
            void main() {
                vec2 center = vec2(0.5);
                vec2 uv = v_texCoord;
                
                // Zoom out from
                float zoomFrom = 1.0 + u_progress * 2.0;
                vec2 uvFrom = center + (uv - center) / zoomFrom;
                
                // Zoom in to
                float zoomTo = 3.0 - u_progress * 2.0;
                vec2 uvTo = center + (uv - center) / zoomTo;
                
                vec4 fromColor = texture(u_from, uvFrom);
                vec4 toColor = texture(u_to, uvTo);
                
                float alpha = smoothstep(0.3, 0.7, u_progress);
                fragColor = mix(fromColor, toColor, alpha);
            }
        `));
        
        // Rotate transition
        this.transitionPrograms.set('rotate', this.createProgram(vertexSource, `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform float u_progress;
            
            mat2 rotate(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat2(c, -s, s, c);
            }
            
            void main() {
                vec2 center = vec2(0.5);
                vec2 uv = v_texCoord - center;
                
                // Rotate and scale
                float angle = u_progress * 3.14159;
                float scale = 1.0 - u_progress * 0.5;
                
                vec2 uvFrom = rotate(angle) * uv / scale + center;
                vec2 uvTo = uv + center;
                
                vec4 fromColor = texture(u_from, uvFrom);
                vec4 toColor = texture(u_to, uvTo);
                
                float alpha = smoothstep(0.4, 0.6, u_progress);
                fragColor = mix(fromColor, toColor, alpha);
            }
        `));
        
        // Dissolve transition
        this.transitionPrograms.set('dissolve', this.createProgram(vertexSource, `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform float u_progress;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                vec2 uv = v_texCoord;
                
                vec4 fromColor = texture(u_from, uv);
                vec4 toColor = texture(u_to, uv);
                
                // Dissolve based on noise
                float noise = random(uv * 10.0);
                float threshold = u_progress + (noise - 0.5) * 0.3;
                
                float alpha = smoothstep(0.0, 0.1, threshold);
                fragColor = mix(fromColor, toColor, alpha);
            }
        `));
        
        // Glitch transition
        this.transitionPrograms.set('glitch', this.createProgram(vertexSource, `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform float u_progress;
            uniform float u_time;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                vec2 uv = v_texCoord;
                
                // Glitch displacement
                float glitchIntensity = sin(u_progress * 3.14159) * 0.1;
                float blockSize = 0.05 + random(vec2(u_time)) * 0.05;
                vec2 block = floor(uv / blockSize) * blockSize;
                
                vec2 displacement = vec2(0.0);
                if (random(block + u_time) > 0.8) {
                    displacement = vec2(
                        (random(block + vec2(u_time, 0.0)) - 0.5) * glitchIntensity,
                        (random(block + vec2(0.0, u_time)) - 0.5) * glitchIntensity
                    );
                }
                
                // RGB shift
                vec2 uvR = uv + displacement * vec2(1.0, 0.0);
                vec2 uvG = uv + displacement * vec2(0.0, 1.0);
                vec2 uvB = uv + displacement * vec2(-1.0, -1.0);
                
                vec3 fromColorR = texture(u_from, uvR).rgb;
                vec3 fromColorG = texture(u_from, uvG).rgb;
                vec3 fromColorB = texture(u_from, uvB).rgb;
                
                vec3 toColorR = texture(u_to, uvR).rgb;
                vec3 toColorG = texture(u_to, uvG).rgb;
                vec3 toColorB = texture(u_to, uvB).rgb;
                
                vec3 fromColor = vec3(fromColorR.r, fromColorG.g, fromColorB.b);
                vec3 toColor = vec3(toColorR.r, toColorG.g, toColorB.b);
                
                float alpha = step(random(uv + u_time), u_progress);
                fragColor = vec4(mix(fromColor, toColor, alpha), 1.0);
            }
        `));
        
        // Morph transition
        this.transitionPrograms.set('morph', this.createProgram(vertexSource, `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_from;
            uniform sampler2D u_to;
            uniform float u_progress;
            
            vec2 distort(vec2 uv, float amount) {
                vec2 center = vec2(0.5);
                vec2 delta = uv - center;
                float dist = length(delta);
                
                // Barrel distortion
                float factor = 1.0 + amount * dist * dist;
                return center + delta * factor;
            }
            
            void main() {
                vec2 uv = v_texCoord;
                
                // Morph distortion
                float distortAmount = sin(u_progress * 3.14159) * 0.5;
                vec2 uvFrom = distort(uv, -distortAmount);
                vec2 uvTo = distort(uv, distortAmount);
                
                vec4 fromColor = texture(u_from, uvFrom);
                vec4 toColor = texture(u_to, uvTo);
                
                fragColor = mix(fromColor, toColor, u_progress);
            }
        `));
    }
    
    /**
     * Initialize WebGPU transitions
     */
    async _initWebGPU() {
        // TODO: Implement WebGPU transition pipelines
    }
    
    /**
     * Start transition
     */
    async transition(fromElement, toElement, options = {}) {
        if (!this.isInitialized) await this.init();
        
        if (this.isTransitioning) {
            this._cancelTransition();
        }
        
        // Set options
        this.transitionType = options.type || this.transitionType;
        this.transitionDuration = options.duration || this.transitionDuration;
        this.transitionEasing = options.easing || this.transitionEasing;
        this.transitionDirection = options.direction || this.transitionDirection;
        this.onComplete = options.onComplete;
        
        // Create textures from elements
        this.fromTexture = await this._createTextureFromElement(fromElement);
        this.toTexture = await this._createTextureFromElement(toElement);
        
        // Start transition
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.startTime = performance.now();
        
        // Hide original elements during transition
        fromElement.style.visibility = 'hidden';
        toElement.style.visibility = 'hidden';
        
        // Position transition canvas
        const rect = fromElement.getBoundingClientRect();
        this.gpu.canvas.style.position = 'absolute';
        this.gpu.canvas.style.left = `${rect.left}px`;
        this.gpu.canvas.style.top = `${rect.top}px`;
        this.gpu.canvas.style.width = `${rect.width}px`;
        this.gpu.canvas.style.height = `${rect.height}px`;
        this.gpu.canvas.style.zIndex = '9999';
        document.body.appendChild(this.gpu.canvas);
        
        // Start animation
        this._animateTransition();
    }
    
    /**
     * Create texture from element
     */
    async _createTextureFromElement(element) {
        const canvas = document.createElement('canvas');
        const rect = element.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        const ctx = canvas.getContext('2d');
        
        // For now, capture visible content
        // In production, use html2canvas or similar
        if (element instanceof HTMLCanvasElement) {
            ctx.drawImage(element, 0, 0);
        } else if (element instanceof HTMLImageElement) {
            ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
        } else if (element instanceof HTMLVideoElement) {
            ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback: fill with background color
            const style = window.getComputedStyle(element);
            ctx.fillStyle = style.backgroundColor || 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw text content if available
            if (element.textContent) {
                ctx.fillStyle = style.color || 'black';
                ctx.font = style.font || '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(element.textContent, canvas.width / 2, canvas.height / 2);
            }
        }
        
        return this.createTexture(canvas);
    }
    
    /**
     * Animate transition
     */
    _animateTransition() {
        if (!this.isTransitioning) return;
        
        const now = performance.now();
        const elapsed = now - this.startTime;
        const rawProgress = Math.min(elapsed / this.transitionDuration, 1);
        
        // Apply easing
        this.transitionProgress = this._applyEasing(rawProgress);
        
        // Render transition frame
        this._renderTransition();
        
        if (rawProgress < 1) {
            this.animationFrame = requestAnimationFrame(() => this._animateTransition());
        } else {
            this._completeTransition();
        }
    }
    
    /**
     * Apply easing function
     */
    _applyEasing(t) {
        switch (this.transitionEasing) {
            case 'linear':
                return t;
            case 'ease-in':
                return t * t;
            case 'ease-out':
                return t * (2 - t);
            case 'ease-in-out':
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'cubic-in':
                return t * t * t;
            case 'cubic-out':
                return (--t) * t * t + 1;
            case 'elastic':
                return t === 0 || t === 1 ? t :
                    -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
            default:
                return t;
        }
    }
    
    /**
     * Render transition frame
     */
    _renderTransition() {
        if (this.gpu.type === 'webgpu') {
            this._renderTransitionWebGPU();
        } else if (this.gpu.type.includes('webgl')) {
            this._renderTransitionWebGL();
        }
        
        // Copy to display
        this._copyToDisplay();
    }
    
    /**
     * Render transition with WebGL
     */
    _renderTransitionWebGL() {
        const gl = this.gpu.context;
        
        // Get transition program
        const program = this.transitionPrograms.get(this.transitionType);
        if (!program) return;
        
        // Clear and setup
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Use program
        gl.useProgram(program);
        
        // Set vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform1f(gl.getUniformLocation(program, 'u_progress'), this.transitionProgress);
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() / 1000);
        
        // Direction for slide transition
        if (this.transitionType === 'slide') {
            const direction = this._getDirectionVector();
            gl.uniform2fv(gl.getUniformLocation(program, 'u_direction'), direction);
        }
        
        // Bind textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fromTexture);
        gl.uniform1i(gl.getUniformLocation(program, 'u_from'), 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.toTexture);
        gl.uniform1i(gl.getUniformLocation(program, 'u_to'), 1);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    /**
     * Get direction vector
     */
    _getDirectionVector() {
        switch (this.transitionDirection) {
            case 'left': return [1, 0];
            case 'right': return [-1, 0];
            case 'up': return [0, 1];
            case 'down': return [0, -1];
            default: return [1, 0];
        }
    }
    
    /**
     * Complete transition
     */
    _completeTransition() {
        this.isTransitioning = false;
        
        // Remove transition canvas
        this.gpu.canvas.remove();
        
        // Show target element
        const toElement = document.querySelector('[data-transition-to]');
        if (toElement) {
            toElement.style.visibility = 'visible';
        }
        
        // Cleanup
        this._cleanupTransition();
        
        // Call completion callback
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    /**
     * Cancel transition
     */
    _cancelTransition() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.isTransitioning = false;
        this._cleanupTransition();
    }
    
    /**
     * Cleanup transition
     */
    _cleanupTransition() {
        const gl = this.gpu.context;
        
        if (this.fromTexture) {
            gl.deleteTexture(this.fromTexture);
            this.fromTexture = null;
        }
        
        if (this.toTexture) {
            gl.deleteTexture(this.toTexture);
            this.toTexture = null;
        }
    }
    
    /**
     * Create preset transition
     */
    static createPreset(name) {
        const presets = {
            'page-turn': {
                type: 'rotate',
                duration: 800,
                easing: 'ease-in-out'
            },
            'hero': {
                type: 'zoom',
                duration: 600,
                easing: 'cubic-out'
            },
            'glitch': {
                type: 'glitch',
                duration: 400,
                easing: 'linear'
            },
            'smooth': {
                type: 'morph',
                duration: 1000,
                easing: 'ease-in-out'
            },
            'slide-left': {
                type: 'slide',
                direction: 'left',
                duration: 500,
                easing: 'ease-out'
            }
        };
        
        return presets[name] || presets['smooth'];
    }
}