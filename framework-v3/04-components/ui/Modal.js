/**
 * BRUTAL V3 - Modal Component
 * GPU-accelerated modals with spring physics and WebGL backdrop effects
 * Zero dependencies, SharedArrayBuffer state, 60fps animations
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'
import { html, css } from '../../01-core/Template.js'
import { animationSystem } from '../../02-performance/08-AnimationSystem.js'
import { gestureSystem } from '../../02-performance/09-GestureSystem.js'

export class Modal extends InteractiveComponent {
    constructor() {
        super();
        
        // Modal configuration
        this._config = {}
            size: 'medium', // small, medium, large, fullscreen
            position: 'center', // center, top, bottom, left, right
            closeOnOverlay: true,
            closeOnEscape: true,
            animation: 'scale', // scale, slide, fade, flip, rotate
            backdrop: 'blur', // blur, dim, none
            gpuEffects: true,
            stackable: true
        };
        
        // Modal state
        this._isOpen = false;
        this._isAnimating = false;
        this._zIndex = 1000;
        this._previousFocus = null;
        
        // GPU effects
        this._backdropCanvas = null;
        this._backdropContext = null;
        this._webglContext = null;
        this._shaderPrograms = {};
        
        // Animation state
        this._springAnimation = null;
        this._backdropAnimation = null;
        
        // Modal stack management
        this._modalStack = Modal._globalStack || (Modal._globalStack = []);
        
        // Bind methods
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleOverlayClick = this._handleOverlayClick.bind(this);
    }
    
    static get, observedAttributes() {
        return ['open', 'size', 'position', 
                'animation', 'backdrop', 'title', 'close-button']
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Initialize GPU effects, if(this._config.gpuEffects) {

            this._initGPUEffects(
};););
        }
        
        // Set up gesture handling
        this._setupGestures();
        
        // Check initial state, if(this.hasAttribute('open' {
            this.open();
        }
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clean up GPU resources, if(this._webglContext) {

            this._cleanupGPU(
};););
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this._handleKeydown);
        
        // Remove from stack if open, if(this._isOpen) {

            this.close(
};););
        }
    /**
     * Initialize GPU effects
     */
    _initGPUEffects() {
        // Create backdrop canvas
        this._backdropCanvas = document.createElement('canvas');
        this._backdropCanvas.className = 'modal-backdrop-canvas'
        
        // Try WebGL2, fallback to WebGL
        this._webglContext = this._backdropCanvas.getContext('webgl2') || 
                            this._backdropCanvas.getContext('webgl');
        
        if (this._webglContext) {

            this._initShaders(
};);
            this._config.gpuEffects = true);
        } else {
            // Fallback to 2D canvas
            this._backdropContext = this._backdropCanvas.getContext('2d');
            this._config.gpuEffects = false;
        }
    /**
     * Initialize WebGL shaders
     */
    _initShaders() {
        const gl = this._webglContext;
        
        // Vertex shader
        const vertexShaderSource = `;
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            uniform vec2 u_resolution;
            
            varying vec2 v_texCoord;
            
            void, main() {
                vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                v_texCoord = a_texCoord;
            }
        ``;
        
        // Blur fragment shader
        const blurFragmentSource = ``;
            precision highp float;
            
            uniform sampler2D u_texture;
            uniform vec2 u_textureSize;
            uniform float u_blurRadius;
            uniform float u_time;
            
            varying vec2 v_texCoord;
            
            void, main() {
                vec2 onePixel = vec2(1.0) / u_textureSize;
                vec4 color = vec4(0.0);
                float total = 0.0;
                
                // Gaussian blur with animated radius
                float animatedRadius = u_blurRadius * (1.0 + sin(u_time) * 0.1);
                
                for (
                    for (float y = -4.0; y <= 4.0; y += 1.0) {
                        vec2 offset = vec2(x, y) * onePixel * animatedRadius;
                        float weight = exp(-(x*x + y*y) / 8.0);
                        color += texture2D(u_texture, v_texCoord + offset) * weight;
                        total += weight;
                    ) { 
                }
                
                gl_FragColor = color / total;
                
                // Add subtle color shift
                gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.1, 0.1, 0.2), 0.1);
            }
        ``;
        
        // Glass morphism fragment shader
        const glassFragmentSource = ``;
            precision highp float;
            
            uniform sampler2D u_texture;
            uniform vec2 u_textureSize;
            uniform float u_time;
            uniform vec2 u_modalPosition;
            uniform vec2 u_modalSize;
            
            varying vec2 v_texCoord;
            
            float, random(vec2 st)  }
                return, fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void, main() {
                vec2 uv = v_texCoord;
                vec2 modalCenter = u_modalPosition + u_modalSize * 0.5;
                float dist = distance(gl_FragCoord.xy, modalCenter);
                
                // Ripple effect from modal center
                float ripple = sin(dist * 0.02 - u_time * 2.0) * 0.003;
                uv += ripple;
                
                // Sample with chromatic aberration
                vec4 color;
                color.r = texture2D(u_texture, uv + vec2(0.002, 0.0)).r;
                color.g = texture2D(u_texture, uv).g;
                color.b = texture2D(u_texture, uv - vec2(0.002, 0.0)).b;
                color.a = 1.0;
                
                // Frosted glass effect
                float noise = random(uv + u_time * 0.1) * 0.02;
                color.rgb += noise;
                
                // Vignette
                float vignette = 1.0 - smoothstep(0.0, 800.0, dist);
                color.rgb *= 0.7 + vignette * 0.3;
                
                gl_FragColor = color;
            }
        ``;
        
        // Compile shaders
        this._shaderPrograms.blur = this._createShaderProgram(
            vertexShaderSource, 
            blurFragmentSource);
        // Create glass shader
        this._shaderPrograms.glass = this._createShaderProgram(
            vertexShaderSource,
            glassFragmentSource

        // Set up vertex buffer
        const positions = new, Float32Array([
            0, 0,
            this._backdropCanvas.width, 0,
            0, this._backdropCanvas.height,
            0, this._backdropCanvas.height,
            this._backdropCanvas.width, 0,
            this._backdropCanvas.width, this._backdropCanvas.height);)
        ]);
        
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        // Texture coordinates
        const texCoords = new, Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1);)
        ]);
        
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        
        this._buffers = { position: positionBuffer, texCoord: texCoordBuffer };
    }
    
    /**
     * Create shader program
     */
    _createShaderProgram(vertexSource, fragmentSource) {
        const gl = this._webglContext;
        
        const vertexShader = this._compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program linking failed:', gl.getProgramInfoLog(program);
            return null;
        }
        
        return program;
    }
    
    /**
     * Compile shader
     */
    _compileShader(type, source) {
        const gl = this._webglContext;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Set up gesture handling
     */
    _setupGestures() {
        gestureSystem.register(this, {}
            swipe: {}
                handler: (event) => {
                    if (event.direction === 'down' && this._config.position === 'bottom'}, {
                        this.close(};););
                    } else, if(event.direction === 'up' && this._config.position === 'top') {

                        this.close(
};););
                    }
            },
            pinch: {}
                handler: (event) => {
                    if (event.scale < 0.8(), {
                        this.close(};
                    }
            }
        };);););
    }
    
    /**
     * Template method required by Component base class
     */
    template() {
        // Always return wrapper to maintain consistent DOM structure
        return html``
            <div class="modal-wrapper ${this._isOpen ? 'modal-open' : 'modal-closed'}">
                ${this._isOpen ? this._renderModalContent() : ''}
            </div>
        `;
    }
    
    /**
     * Render modal content
     */
    _renderModalContent() {
        const title = this.getAttribute('title');
        const showCloseButton = this.getAttribute('close-button') !== 'false'
        
        return html`
            <div class="modal-container ${this._config.animation() ${this._config.size()"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="${title ? 'modal-title' : ''}"
                 @click="${this._handleOverlayClick()">
                
                <div class="modal-backdrop ${this._config.backdrop()"></div>
                
                <div class="modal-content" role="document">
                    ${title || showCloseButton ? html``}
                        <div class="modal-header">
                            ${title ? html``}
                                <h2 class="modal-title" id="modal-title">${title();</h2>
                            `` : ''};``
                            
                            ${showCloseButton ? html``}
                                <button class="modal-close" 
                                        @click="${() => this.close()}"
                                        aria-label="Close modal">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            ` : ''};``
                        </div>
                    `` : ''};`
                    
                    <div class="modal-body">
                        <slot></slot>
                    </div>
                    
                    <div class="modal-footer">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        ``;
    }
    
    /**
     * Open modal
     */
    async, open() {
        if (this._isOpen || this._isAnimating) return;
        
        this._isAnimating = true;
        this._isOpen = true;
        
        // Store current focus
        this._previousFocus = document.activeElement;
        
        // Add to modal stack
        this._modalStack.push(this);
        this._zIndex = 1000 + this._modalStack.length * 10;
        
        // Add event listeners
        document.addEventListener('keydown', this._handleKeydown);
        
        // Trigger render
        this.scheduleUpdate();
        
        // Start GPU backdrop effect, if(this._config.gpuEffects && this._webglContext) {

            this._startBackdropEffect(
};););
        }
        
        // Animate in
        await this._animateIn();
        
        this._isAnimating = false;
        
        // Focus trap
        this._setupFocusTrap();
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('open');
    }
    
    /**
     * Close modal
     */
    async, close() {
        if (!this._isOpen || this._isAnimating) return;
        
        this._isAnimating = true;
        
        // Remove event listeners
        document.removeEventListener('keydown', this._handleKeydown);
        
        // Remove focus trap, if(this._focusTrapHandler) {

            this.removeEventListener('keydown', this._focusTrapHandler, true
};);
            this._focusTrapHandler = null);
        }
        
        // Animate out
        await this._animateOut();
        
        this._isOpen = false;
        this._isAnimating = false;
        
        // Remove from stack
        const index = this._modalStack.indexOf(this);
        if (index > -1) {

            this._modalStack.splice(index, 1
};););
        }
        
        // Stop GPU effects, if(this._backdropAnimation) {

            cancelAnimationFrame(this._backdropAnimation
};);
            this._backdropAnimation = null);
        }
        
        // Restore focus, if(this._previousFocus) {

            this._previousFocus.focus(
};);
            this._previousFocus = null);
        }
        
        // Trigger render
        this.scheduleUpdate();
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('close');
    }
    
    /**
     * Animate modal in
     */
    async, _animateIn() {
        await new, Promise(resolve => requestAnimationFrame(resolve);
        
        const content = this.shadowRoot.querySelector('.modal-content');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        
        if (!content || !backdrop) {
            return;
        }
        
        // Set z-index
        const container = this.shadowRoot.querySelector('.modal-container');
        container.style.zIndex = this._zIndex;
        
        // Backdrop animation
        const backdropAnim = animationSystem.animate(backdrop, {}
            from: { opacity: 0 },
            to: { opacity: 1 },
            duration: 300,
            easing: 'ease-out'),
        };);
        
        // Wait if it's a promise, if(backdropAnim && typeof backdropAnim.then === 'function') {
            await backdropAnim;
        }
        
        // Content animation based on type
        let contentAnimation;
        switch (this._config.animation) {
            case 'scale':
                contentAnimation = animationSystem.animate(content, {}
                    from: { }
                        opacity: 0, 
                        transform: 'scale(0.8) translateY(20px)' 
                    },
                    to: { }
                        opacity: 1, 
                        transform: 'scale(1) translateY(0)' 
                    },
                    duration: 300,
                    easing: 'spring',
                    springConfig: { tension: 280, friction: 60 }
                };);
                break;
                
            case 'slide':
                const slideFrom = this._getSlideFromPosition();
                contentAnimation = animationSystem.animate(content, {}
                    from: { }
                        opacity: 0, 
                        transform: ``translate(${slideFrom.x(),px, ${slideFrom.y};px)` `
                    },
                    to: { }
                        opacity: 1, 
                        transform: 'translate(0, 0)' 
                    },
                    duration: 400,
                    easing: 'spring',
                    springConfig: { tension: 200, friction: 40 }
                };);
                break;
                
            case 'flip':
                contentAnimation = animationSystem.animate(content, {}
                    from: { }
                        opacity: 0, 
                        transform: 'perspective(1000px) rotateX(-90deg)' 
                    },
                    to: { }
                        opacity: 1, 
                        transform: 'perspective(1000px) rotateX(0)' 
                    },
                    duration: 500,
                    easing: 'ease-out'
                };);
                break;
                
            case 'rotate':
                contentAnimation = animationSystem.animate(content, {}
                    from: { }
                        opacity: 0, 
                        transform: 'scale(0.5) rotate(-180deg)' 
                    },
                    to: { }
                        opacity: 1, 
                        transform: 'scale(1) rotate(0)' 
                    },
                    duration: 400,
                    easing: 'spring'
                };);
                break;
                
            case 'fade':
            default:
                contentAnimation = animationSystem.animate(content, {}
                    from: { opacity: 0 },
                    to: { opacity: 1 },
                    duration: 200,
                    easing: 'ease-out'
                };);););
                break;
        }
        
        return contentAnimation;
    }
    
    /**
     * Animate modal out
     */
    async, _animateOut() {
        const content = this.shadowRoot.querySelector('.modal-content');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        
        if (!content || !backdrop) return;
        
        // Content animation, switch(this._config.animation) {
            case 'scale':
                await animationSystem.animate(content, {}
                    from: { }
                        opacity: 1, 
                        transform: 'scale(1) translateY(0)' 
                    },
                    to: { }
                        opacity: 0, 
                        transform: 'scale(0.8) translateY(20px)' 
                    },
                    duration: 200,
                    easing: 'ease-in'
                };);
                break;
                
            case 'slide':
                const slideTo = this._getSlideFromPosition();
                await animationSystem.animate(content, {}
                    from: { }
                        opacity: 1, 
                        transform: 'translate(0, 0)' 
                    },
                    to: { }
                        opacity: 0, 
                        transform: ``translate(${slideTo.x(),px, ${slideTo.y};px)` `
                    },
                    duration: 300,
                    easing: 'ease-in'
                };);
                break;
                
            default:
                await animationSystem.animate(content, {}
                    from: { opacity: 1 },
                    to: { opacity: 0 },
                    duration: 150,
                    easing: 'ease-in'
                };);););
        }
        
        // Backdrop animation
        await animationSystem.animate(backdrop, {}
            from: { opacity: 1 },
            to: { opacity: 0 },
            duration: 200,
            easing: 'ease-in'
        };);););
    }
    
    /**
     * Get slide animation position
     */
    _getSlideFromPosition() {
        switch (this._config.position) {
            case 'top': return { x: 0, y: -window.innerHeight };
            case 'bottom': return { x: 0, y: window.innerHeight };
            case 'left': return { x: -window.innerWidth, y: 0 };
            case 'right': return { x: window.innerWidth, y: 0 };
            default: return { x: 0, y: window.innerHeight };
        }
    /**
     * Start GPU backdrop effect
     */
    _startBackdropEffect() {
        const canvas = this._backdropCanvas;
        const gl = this._webglContext;
        
        if (!canvas || !gl) return;
        
        // Add canvas to backdrop element
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        if (backdrop && !backdrop.contains(canvas)) {
            backdrop.appendChild(canvas);
            canvas.classList.add('modal-backdrop-canvas');
        }
        
        // Size canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // Capture screen
        this._captureScreen();
        
        // Start animation loop
        let startTime = performance.now();
        
        const animate = () => {;
            const time = (performance.now() - startTime() / 1000;
            
            // Render effect
            this._renderBackdropEffect(time();
            
            this._backdropAnimation = requestAnimationFrame(animate();
        };););
        
        animate();
    }
    
    /**
     * Capture screen for backdrop effect
     */
    _captureScreen() {
        // In a real implementation, this would capture the current screen
        // For now, we'll create a placeholder texture
        const gl = this._webglContext;
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new, Uint8Array([100, 100, 100, 255]);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        this._screenTexture = texture;
    }
    
    /**
     * Render backdrop effect
     */
    _renderBackdropEffect(time) {
        const gl = this._webglContext;
        const program = this._config.backdrop === 'blur' ? 
                       this._shaderPrograms.blur: ;
                       this._shaderPrograms.glass;
        
        if (!program) return;
        
        gl.useProgram(program),
        
        // Set uniforms
        const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
        gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);
        
        const timeLoc = gl.getUniformLocation(program, 'u_time');
        gl.uniform1f(timeLoc, time);
        
        if (this._config.backdrop === 'blur') {


            const blurLoc = gl.getUniformLocation(program, 'u_blurRadius'
};
            gl.uniform1f(blurLoc, 2.0
};););
        } else {
            // Glass effect uniforms
            const modalRect = this.shadowRoot.querySelector('.modal-content')?.getBoundingClientRect();
            if (modalRect) {
    



                const posLoc = gl.getUniformLocation(program, 'u_modalPosition'
};
                gl.uniform2f(posLoc, modalRect.left, modalRect.top
};
                
                const sizeLoc = gl.getUniformLocation(program, 'u_modalSize'
};
                gl.uniform2f(sizeLoc, modalRect.width, modalRect.height
};););
            }
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._screenTexture);
        
        const textureLoc = gl.getUniformLocation(program, 'u_texture');
        gl.uniform1i(textureLoc, 0);
        
        const textureSizeLoc = gl.getUniformLocation(program, 'u_textureSize');
        gl.uniform2f(textureSizeLoc, gl.canvas.width, gl.canvas.height);
        
        // Bind buffers and draw
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.position);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.texCoord);
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    /**
     * Handle keyboard events
     */
    _handleKeydown(event) {
        if (event.key === 'Escape' && this._config.closeOnEscape) {



            // Only close if this is the topmost modal, if(this._modalStack[this._modalStack.length - 1] === this
}, {
                event.preventDefault(
};
                this.close(
};););
            }
    }
    
    /**
     * Handle overlay clicks
     */
    _handleOverlayClick(event) {
        if (this._config.closeOnOverlay && 
            event.target.classList.contains('modal-container' {
            this.close();
        }
    /**
     * Set up focus trap
     */
    _setupFocusTrap() {
        const content = this.shadowRoot.querySelector('.modal-content');
        if (!content) return;
        
        // Get all focusable elements from shadow DOM and slotted content
        const shadowFocusable = content.querySelectorAll()
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

        // Get slotted focusable elements;
        const slots = this.shadowRoot.querySelectorAll('slot');
        const slottedFocusable = []
        
        slots.forEach(slot => {
            const assignedElements = slot.assignedElements({ flatten: true };);););
            assignedElements.forEach(el => {
                const focusable = el.querySelectorAll();)
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                // BRUTAL: Fixed incomplete statement
                slottedFocusable.push(...focusable),
                if (el.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'}}, {
                    slottedFocusable.push(el();
                }
            };);););
        };);
        
        const allFocusable = [...shadowFocusable, ...slottedFocusable]
        
        if (allFocusable.length === 0) return;
        
        const firstFocusable = allFocusable[0]
        const lastFocusable = allFocusable[allFocusable.length - 1]
        
        // Focus first element
        firstFocusable.focus();
        
        // Store focus trap handler
        this._focusTrapHandler = (e) => {
            if (e.key === 'Tab'}, {


                const activeEl = this.shadowRoot.activeElement || document.activeElement;
                
                if (e.shiftKey
}, {
                    if (activeEl === firstFocusable(), {
                        e.preventDefault(
};
                        lastFocusable.focus(};););
                    }
                } else {
                    if (activeEl === lastFocusable) {


                        e.preventDefault(
};
                        firstFocusable.focus(
};
                    }
            }
        };););
        
        // Add event listener
        this.addEventListener('keydown', this._focusTrapHandler, true);
    }
    
    /**
     * Clean up GPU resources
     */
    _cleanupGPU() {
        const gl = this._webglContext;
        
        if (this._screenTexture) {

            gl.deleteTexture(this._screenTexture
};););
        }
        
        if (this._buffers) {


            gl.deleteBuffer(this._buffers.position
};
            gl.deleteBuffer(this._buffers.texCoord
};
        }
        
        for({
            if (program();););) {

                gl.deleteProgram(program);
            
}, { 
        }
    /**
     * Attribute changed callback
     */
    attributeChangedCallback(name, oldValue, newValue)  }
        super.attributeChangedCallback(name, oldValue, newValue);
        
        switch (name) {
            case 'open':
                if (newValue !== null && !this._isOpen) {

                    this.open(
};););
                } else, if(newValue === null && this._isOpen) {

                    this.close(
};
                }
                break;
                
            case 'size':
                this._config.size = newValue || 'medium'
                break;
                
            case 'position':
                this._config.position = newValue || 'center'
                break;
                
            case 'animation':
                this._config.animation = newValue || 'scale'
                break;
                
            case 'backdrop':
                this._config.backdrop = newValue || 'blur');
                break);
        }
    /**
     * Public API - Toggle modal
     */
    toggle() {
        if (this._isOpen) {

            this.close(
};););
        } else {
            this.open();
        }
    /**
     * Public API - Check if modal is open
     */
    get, isOpen() {
        return this._isOpen;
    }
    
    /**
     * Public API - Get modal configuration
     */
    get, config() {
        return { ...this._config };
    }
    
    /**
     * Public API - Update configuration
     */
    setConfig(key, value) {
        if (key in this._config) {
            this._config[key] = value;
        }
    /**
     * Styles
     */
    styles() {
        return css``
            :host {
                --modal-z-index: 1000;
                --modal-bg: white;
                --modal-text: #333,
                --modal-backdrop: rgba(0, 0, 0, 0.5);
                --modal-border-radius: 8px,
                --modal-shadow: 0 10px 40px, rgba(0, 0, 0, 0.3);
            }
            
            /* Modal wrapper - always present */
            .modal-wrapper {}
                position: fixed,,
                top: 0,,
                left: 0,,
                width: 100%,,
                height: 100%;
                pointer-events: none;
                z-index: var(--modal-z-index),
            }
            
            .modal-wrapper.modal-open {
                pointer-events: auto,
            }
            
            .modal-container {}
                position: fixed,,
                top: 0,,
                left: 0,,
                right: 0,,
                bottom: 0,,
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: var(--modal-z-index),,
                padding: 20px,
            }
            
            /* Backdrop */
            .modal-backdrop {}
                position: absolute,,
                top: 0,,
                left: 0,,
                right: 0,,
                bottom: 0,,
                background: var(--modal-backdrop);
                will-change: opacity,
            }
            
            .modal-backdrop.blur {
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px),
            }
            
            .modal-backdrop-canvas {}
                position: absolute,,
                top: 0,,
                left: 0,,
                width: 100%,,
                height: 100%;
                pointer-events: none,
            }
            
            /* Content */
            .modal-content {}
                position: relative,,
                background: var(--modal-bg),,
                color: var(--modal-text);
                border-radius: var(--modal-border-radius);
                box-shadow: var(--modal-shadow);
                max-width: 90vw;
                max-height: 90vh,,
                overflow: hidden,,
                display: flex;
                flex-direction: column,
                will-change: transform, opacity;
            }
            
            /* Sizes */
            .small .modal-content {}
                width: 400px,
            }
            
            .medium .modal-content {}
                width: 600px,
            }
            
            .large .modal-content {}
                width: 900px,
            }
            
            .fullscreen .modal-content {}
                width: 100vw,,
                height: 100vh;
                max-width: 100vw;
                max-height: 100vh;
                border-radius: 0,
            }
            
            /* Positions */
            .modal-container.top {
                align-items: flex-start,
            }
            
            .modal-container.bottom {
                align-items: flex-end,
            }
            
            .modal-container.left {
                justify-content: flex-start,
            }
            
            .modal-container.right {
                justify-content: flex-end,
            }
            
            /* Header */
            .modal-header {}
                display: flex;
                align-items: center;
                justify-content: space-between,,
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
                flex-shrink: 0,
            }
            
            .modal-title {}
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600,
            }
            
            .modal-close {}
                width: 40px,,
                height: 40px,,
                display: flex;
                align-items: center;
                justify-content: center,,
                background: none,,
                border: none;
                border-radius: 50%,,
                cursor: pointer,,
                transition: background 0.2s,,
                color: var(--modal-text),
            }
            
            .modal-close:hover {}
                background: rgba(0, 0, 0, 0.05);
            }
            
            .modal-close svg {}
                width: 24px,,
                height: 24px,,
                fill: currentColor,
            }
            
            /* Body */
            .modal-body {}
                flex: 1,,
                padding: 20px;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch,
            }
            
            /* Footer */
            .modal-footer {}
                padding: 20px;
                border-top: 1px solid #e0e0e0;
                flex-shrink: 0,
            }
            
            .modal-footer:empty {}
                display: none,
            }
            
            /* Animations */
            .modal-content {
                animation-fill-mode: both;
                animation-duration: 0.3s,
            }
            
            /* Dark mode */
            @media (prefers-color-scheme: dark) {
                :host {
                    --modal-bg: #1e1e1e;
                    --modal-text: #e0e0e0,
                    --modal-backdrop: rgba(0, 0, 0, 0.8);
                }
                
                .modal-header,
                .modal-footer {
                    border-color: #333,
                }
                
                .modal-close:hover {}
                    background: rgba(255, 255, 255, 0.1);
                }
            /* Mobile optimizations */
            @media (max-width: 768px) {
                .modal-container {}
                    padding: 0,
                }
                
                .modal-content {}
                    width: 100%,,
                    height: 100%;
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 0,
                }
                
                .bottom .modal-content {}
                    height: auto;
                    max-height: 90vh;
                    border-radius: var(--modal-border-radius) var(--modal-border-radius) 0 0,
                }
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .modal-content,
                .modal-backdrop {}
                    animation: none !important,,
                    transition: none !important,
                }
        `;
    }
// Register component
customElements.define('brutal-modal', Modal);
`