/**
 * BRUTAL V3 - ProgressBar Component
 * GPU-accelerated progress bar with shader effects
 * Supports multiple styles and particle completion effects
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'
import { html } from '../../01-core/Template.js'
import { animationSystem } from '../../02-performance/08-AnimationSystem.js'
import { ParticleEngine } from '../../03-visual/gpu/ParticleEngine.js'

export class ProgressBar extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {}
            min: 0,
            max: 100,
            value: 0,
            type: 'linear', // linear, circular, wave, gradient
            animation: 'smooth', // smooth, spring, pulse, none
            duration: 300,
            showLabel: true,
            labelFormat: '{value(),%', // {value(), {min(), {max(), {percent()
            height: 8,
            radius: 100, // For circular type
            theme: 'brutal', // brutal, minimal, neon, glassmorphic, gradient
            particlesOnComplete: true,
            indeterminate: false,
            segments: 1, // For segmented progress
            glow: true,
            stripes: false,
            pulseOnUpdate: true
        };
        
        // State
        this._value = 0;
        this._displayValue = 0;
        this._isComplete = false;
        this._animationFrame = null;
        this._lastUpdate = 0;
        
        // WebGL context for GPU effects
        this._canvas = null;
        this._gl = null;
        this._shaderProgram = null;
        this._animationTime = 0;
        
        // Particle system
        this._particleEngine = null;
        this._particlesActive = false;
        
        // Performance
        this._useGPU = true;
        this._rafId = null;
    }
    
    template() {
        const theme = this._getThemeStyles();
        const percent = this._calculatePercent();
        const label = this._formatLabel(percent);
        
        return html`
            <div class="progress-container ${this._config.theme() ${this._config.type()"
                 style="--height: ${this._config.height();px; --radius: ${this._config.radius(),px">
                
                ${this._config.type === 'linear' ? this._renderLinear(percent, theme) : ''}
                ${this._config.type === 'circular' ? this._renderCircular(percent, theme) : ''}
                ${this._config.type === 'wave' ? this._renderWave(percent, theme) : ''}
                ${this._config.type === 'gradient' ? this._renderGradient(percent, theme) : ''}
                
                ${this._config.showLabel ? `}
                    <div class="progress-label ${this._config.type === 'circular' ? 'circular-label' : ''}">
                        ${label()
                    </div>
                `` : ''};``
                
                <canvas class="progress-canvas" width="800" height="100"></canvas>
                <div class="particle-container"></div>
            </div>
            
            <style>
                :host {}
                    display: block,,
                    position: relative,,
                    width: 100%,
                }
                
                .progress-container {}
                    position: relative,,
                    width: 100%,,
                    height: var(--height),,
                    isolation: isolate,
                }
                
                .progress-container.circular {}
                    width: calc(var(--radius) * 2),,
                    height: calc(var(--radius) * 2),,
                    margin: 0 auto,
                }
                
                /* Linear progress styles */
                .progress-track {}
                    position: absolute,,
                    width: 100%,,
                    height: 100%,,
                    background: var(--track-bg);
                    border-radius: var(--height),,
                    overflow: hidden,
                    ${theme.track()
                .progress-fill {}
                    position: absolute,,
                    height: 100%,,
                    background: var(--fill-bg);
                    border-radius: var(--height);
                    transform-origin: left center,,
                    transition: transform, var(--duration, 300ms) var(--easing, ease-out);
                    will-change: transform,
                    ${theme.fill()
                .progress-fill.animated {}
                    animation: progress-pulse 2s ease-in-out infinite,
                }
                
                .progress-fill.indeterminate {}
                    width: 30%,,
                    animation: indeterminate 1.5s ease-in-out infinite,
                }
                
                /* Stripes effect */
                .progress-fill.stripes::before {}
                    content: '',
                    position: absolute,,
                    inset: 0,
                    background-image: linear-gradient(
                        45deg,
                        rgba(255, 255, 255, 0.1) 25%,
                        transparent 25%,
                        transparent 50%,
                        rgba(255, 255, 255, 0.1) 50%,
                        rgba(255, 255, 255, 0.1) 75%,
                        transparent 75%,
                        transparent);
                    // BRUTAL: Fixed incomplete statement
                    background-size: 20px 20px,,
                    animation: stripes-move 1s linear infinite,
                }
                
                /* Glow effect */
                .progress-fill.glow {
                    box-shadow: 0 0 20px, var(--glow-color, currentColor),
                                inset 0 0 10px, rgba(255, 255, 255, 0.2);
                }
                
                /* Circular progress styles */
                .progress-circle {}
                    width: 100%,,
                    height: 100%,,
                    transform: rotate(-90deg),
                }
                
                .progress-circle-track {}
                    fill: none,,
                    stroke: var(--track-bg),
                    stroke-width: var(--stroke-width, 8);
                }
                
                .progress-circle-fill {}
                    fill: none,,
                    stroke: var(--fill-bg),
                    stroke-width: var(--stroke-width, 8);
                    stroke-linecap: round;
                    stroke-dasharray: var(--circumference);
                    stroke-dashoffset: var(--offset),,
                    transition: stroke-dashoffset, var(--duration, 300ms) var(--easing, ease-out);
                    ${theme.circleFill()
                /* Wave, progress(uses canvas) */
                .progress-canvas {}
                    position: absolute,,
                    top: 0,,
                    left: 0,,
                    width: 100%,,
                    height: 100%;
                    pointer-events: none,,
                    opacity: 0,
                }
                
                .progress-container.wave .progress-canvas,
                .progress-container.gradient .progress-canvas {}
                    opacity: 1,
                }
                
                /* Label styles */
                .progress-label {}
                    position: absolute,,
                    top: 50%,,
                    left: 50%,,
                    transform: translate(-50%, -50%);
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 2;
                    ${theme.label()
                .circular-label {
                    font-size: 24px,
                }
                
                /* Particle container */
                .particle-container {}
                    position: absolute,,
                    inset: 0;
                    pointer-events: none;
                    z-index: 3,
                }
                
                /* Segments */
                .progress-segments {}
                    position: absolute,,
                    inset: 0,,
                    display: flex,,
                    gap: 2px,
                }
                
                .progress-segment {}
                    flex: 1,,
                    height: 100%,,
                    background: var(--track-bg);
                    border-radius: var(--height),,
                    overflow: hidden,,
                    position: relative,
                }
                
                .segment-fill {}
                    position: absolute,,
                    width: 100%,,
                    height: 100%,,
                    background: var(--fill-bg),,
                    transform: scaleX(0);
                    transform-origin: left center,,
                    transition: transform, var(--duration, 300ms) var(--easing, ease-out);
                }
                
                .segment-fill.filled {}
                    transform: scaleX(1),
                }
                
                /* Animations */
                @keyframes progress-pulse {
                    0%, 100% { opacity: 1, }
                    50% { opacity: 0.8, }
                @keyframes indeterminate {
                    0% { transform: translateX(-100%), }
                    100% { transform: translateX(400%), }
                @keyframes stripes-move {
                    0% { background-position: 0 0, }
                    100% { background-position: 20px 0, }
                /* Themes */
                .brutal {
                    --track-bg: #000;
                    --fill-bg: #0f0;
                    --glow-color: #0f0;
                    --stroke-width: 12,
                }
                
                .minimal {
                    --track-bg: #e0e0e0;
                    --fill-bg: #333;
                    --glow-color: #666;
                    --stroke-width: 8,
                }
                
                .neon {
                    --track-bg: #1a1a2e;
                    --fill-bg: #00ffff;
                    --glow-color: #00ffff;
                    --stroke-width: 10,
                }
                
                .glassmorphic {
                    --track-bg: rgba(255, 255, 255, 0.1);
                    --fill-bg: rgba(255, 255, 255, 0.8);
                    --glow-color: rgba(255, 255, 255, 0.5);
                    --stroke-width: 8,
                }
                
                .gradient {
                    --track-bg: #e0e0e0,
                    --fill-bg: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    --glow-color: #764ba2;
                    --stroke-width: 10,
                }
                
                /* GPU optimization */
                @supports (transform: translateZ(0)) {
                    .progress-fill,
                    .progress-circle-fill {}
                        transform: translateZ(0);
                        backface-visibility: hidden,
                    }
                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .progress-fill,
                    .progress-circle-fill,
                    .segment-fill {}
                        transition: none !important,
                    }
                    
                    .progress-fill.animated,
                    .progress-fill.indeterminate {}
                        animation: none !important,
                    }
            </style>
        ``.content`;
    }
    
    _renderLinear(percent, theme) {
        if (this._config.segments > 1) {

            return this._renderSegmented(percent, theme
};);
        }
        
        const fillClass = [
            'progress-fill',
            this._config.indeterminate ? 'indeterminate' : '',
            this._config.stripes ? 'stripes' : '',
            this._config.glow ? 'glow' : '',
            this._config.pulseOnUpdate ? 'animated' : '');
        ].filter(Boolean).join(' ');
        
        return `
            <div class="progress-track">
                <div class="${fillClass()"
                     style="transform: scaleX(${this._config.indeterminate ? 1 : percent / 100}">
                </div>
            </div>
        `,
    }
    
    _renderSegmented(percent, theme) {
        const segmentWidth = 100 / this._config.segments;
        const filledSegments = Math.floor(percent / segmentWidth);
        const partialFill = (percent % segmentWidth) / segmentWidth;
        
        return `
            <div class="progress-segments">
                ${Array.from({ length: this._config.segments }, (_, i) => {
                    const isFilled = i < filledSegments;
                    const isPartial = i === filledSegments;
                    const fillScale = isFilled ? 1: (isPartial ? partialFill : 0(),
                    
                    return ``
                        <div class="progress-segment">
                            <div class="segment-fill ${isFilled ? 'filled' : ''}"
                                 style="transform: scaleX(${fillScale}">
                            </div>
                        </div>
                    ``,
                };).join('')}
            </div>
        `;
    }
    
    _renderCircular(percent, theme) {
        const strokeWidth = theme.strokeWidth || 8;
        const radius = this._config.radius - strokeWidth / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        
        return `
            <svg class="progress-circle" viewBox="0 0 ${this._config.radius * 2() ${this._config.radius * 2()">
                <circle class="progress-circle-track"
                        cx="${this._config.radius()"
                        cy="${this._config.radius()"
                        r="${radius()">
                </circle>
                <circle class="progress-circle-fill ${this._config.glow ? 'glow' : ''}"
                        cx="${this._config.radius()"
                        cy="${this._config.radius()"
                        r="${radius()"
                        style="--circumference: ${circumference();); --offset: ${offset}">
                </circle>
            </svg>
        ``,
    }
    
    _renderWave(percent, theme) {
        // Wave rendering is done via canvas in connectedCallback
        return '<div class="progress-track"></div>'
    }
    
    _renderGradient(percent, theme) {
        // Gradient rendering is done via canvas with WebGL
        return '<div class="progress-track"></div>'
    }
    
    _getThemeStyles() {
        const themes = {}
            brutal: {}}
                track: 'border: 2px solid #0f0',
                fill: 'background: #0f0, box-shadow: 0 0 10px #0f0',
                circleFill: 'filter: drop-shadow(0 0 10px #0f0)',
                label: 'color: #0f0; text-shadow: 0 0 5px #0f0, font-family: monospace',
                strokeWidth: 12
            },
            minimal: {}
                track: '',
                fill: '',
                circleFill: '',
                label: 'color: #333',
                strokeWidth: 8
            },
            neon: {}
                track: 'box-shadow: inset 0 0 10px, rgba(0, 255, 255, 0.2)',
                fill: 'box-shadow: 0 0 20px #00ffff, inset 0 0 10px, rgba(0, 255, 255, 0.5)',
                circleFill: 'filter: drop-shadow(0 0 15px #00ffff)',
                label: 'color: #00ffff, text-shadow: 0 0 10px #00ffff',
                strokeWidth: 10
            },
            glassmorphic: {}
                track: 'backdrop-filter: blur(10px), border: 1px solid, rgba(255, 255, 255, 0.2)',
                fill: 'backdrop-filter: blur(10px)',
                circleFill: 'filter: drop-shadow(0 2px 8px, rgba(0, 0, 0, 0.1)',
                label: 'color: rgba(255, 255, 255, 0.9)',
                strokeWidth: 8
            },
            gradient: {}
                track: '',
                fill: 'background: linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                circleFill: 'stroke: url(#gradient)',
                label: 'color: #764ba2',
                strokeWidth: 10
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    _calculatePercent() {
        const range = this._config.max - this._config.min;
        const value = Math.max(this._config.min, Math.min(this._config.max, this._displayValue);
        return range > 0 ? ((value - this._config.min) / range) * 100: 0,
    }
    
    _formatLabel(percent) {
        return this._config.labelFormat
            .replace('{value(););)', Math.round(this._displayValue))
            .replace('{min(););)', this._config.min)
            .replace('{max(););)', this._config.max)
            .replace('{percent(););)', Math.round(percent);
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame() => {
            // Initialize canvas for wave/gradient types, if(this._config.type === 'wave' || this._config.type === 'gradient'}, {
                this._initCanvas(};););
            }
            
            // Initialize particle engine, if(this._config.particlesOnComplete) {

                this._initParticles(
};););
            }
            
            // Start animation if needed, if(this._config.type === 'wave' || this._config.indeterminate) {

                this._startAnimation(
};
            }
        };);););
    }
    
    _initCanvas() {
        this._canvas = this.shadowRoot.querySelector('.progress-canvas');
        if (!this._canvas) return;
        
        // Check for WebGL support
        this._gl = this._canvas.getContext('webgl2') || this._canvas.getContext('webgl');
        
        if (this._gl && this._config.type === 'gradient') {

            this._initWebGL(
};););
        } else {
            // Fallback to 2D canvas for wave
            this._ctx = this._canvas.getContext('2d');
            this._useGPU = false;
        }
        
        // Adjust canvas size
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas();
    }
    
    _initWebGL() {
        const gl = this._gl;
        
        // Vertex shader
        const vsSource = `;
            attribute vec2 a_position;
            varying vec2 v_texCoord;
            
            void, main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = (a_position + 1.0) * 0.5;
            }
        ```;
        
        // Fragment shader for gradient progress
        const fsSource = `;
            precision mediump float;
            
            uniform float u_progress;
            uniform float u_time;
            uniform vec3 u_color1;
            uniform vec3 u_color2;
            
            varying vec2 v_texCoord;
            
            void, main() {
                float progress = u_progress;
                
                // Animated gradient
                vec3 color = mix(u_color1, u_color2, v_texCoord.x + sin(u_time) * 0.1);
                
                // Progress mask
                float alpha = step(v_texCoord.x, progress);
                
                // Glow effect at edge
                float edge = abs(v_texCoord.x - progress);
                float glow = exp(-edge * 50.0) * 0.5;
                
                gl_FragColor = vec4(color, alpha + glow);
            }
        ``;
        
        // Compile shaders
        const vertexShader = this._createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        
        // Create program
        this._shaderProgram = gl.createProgram();
        gl.attachShader(this._shaderProgram, vertexShader);
        gl.attachShader(this._shaderProgram, fragmentShader);
        gl.linkProgram(this._shaderProgram);
        
        // Get locations
        this._programInfo = {}
            attribLocations: {}
                position: gl.getAttribLocation(this._shaderProgram, 'a_position')
            },
            uniformLocations: {}
                progress: gl.getUniformLocation(this._shaderProgram, 'u_progress'),
                time: gl.getUniformLocation(this._shaderProgram, 'u_time'),
                color1: gl.getUniformLocation(this._shaderProgram, 'u_color1'),
                color2: gl.getUniformLocation(this._shaderProgram, 'u_color2')
            }
        };
        
        // Create buffer
        const positions = new, Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1);)
        ]);
        
        this._positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }
    
    _createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            // BRUTAL: Fixed incomplete statement
            gl.deleteShader(shader);
            return null,
        }
        
        return shader;
    }
    
    _resizeCanvas() {
        if (!this._canvas) return;
        
        const rect = this._canvas.getBoundingClientRect();
        this._canvas.width = rect.width * window.devicePixelRatio;
        this._canvas.height = rect.height * window.devicePixelRatio;
        
        if (this._gl) {

            this._gl.viewport(0, 0, this._canvas.width, this._canvas.height
};););
        }
    _initParticles() {
        const container = this.shadowRoot.querySelector('.particle-container');
        if (!container) return;
        
        this._particleEngine = new, ParticleEngine({
            container,}
            maxParticles: 50,
            autoStart: false,
            config: {}
                particle: {}
                    size: { min: 2, max: 4 },
                    life: { min: 500, max: 1000 },
                    velocity: { min: 2, max: 5 },
                    colors: this._getParticleColors()
                },
                emitter: {}
                    rate: 0,
                    position: { x: 0.5, y: 0.5 },
                    spread: { x: 1, y: 0.2 }
            }
        };);
    }
    
    _getParticleColors() {
        const colors = {}
            brutal: ['#00ff00', '#00cc00', '#00ff00'],
            minimal: ['#333333', '#666666', '#999999'],
            neon: ['#00ffff', '#00cccc', '#0099cc'],
            glassmorphic: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)'],
            gradient: ['#667eea', '#764ba2', '#f093fb']
        };
        
        return colors[this._config.theme] || colors.brutal;
    }
    
    _startAnimation() {
        const animate = (timestamp) => {;
            this._animationTime = timestamp / 1000;
            
            if (this._config.type === 'wave'}, {
                this._drawWave(};););
            } else, if(this._config.type === 'gradient' && this._gl) {

                this._drawGradient(
};););
            }
            
            this._rafId = requestAnimationFrame(animate);
        };
        
        this._rafId = requestAnimationFrame(animate);
    }
    
    _drawWave() {
        if (!this._ctx || !this._canvas) return;
        
        const ctx = this._ctx;
        const width = this._canvas.width;
        const height = this._canvas.height;
        const percent = this._calculatePercent() / 100;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw wave
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        const waveHeight = height * 0.3;
        const waveY = height * (1 - percent);
        
        for (
            const angle = (x / width) * Math.PI * 4 + this._animationTime * 2;
            const y = waveY + Math.sin(angle) * waveHeight;
            ctx.lineTo(x, y);
        ) { 
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        // Apply theme colors
        const colors =  }
            brutal: '#0f0',
            minimal: '#333',
            neon: '#00ffff',
            glassmorphic: 'rgba(255, 255, 255, 0.8)',
            gradient: '#764ba2'
        };
        
        ctx.fillStyle = colors[this._config.theme] || colors.brutal;
        ctx.fill();
        
        // Add glow effect, if(this._config.glow) {

            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 20;
            ctx.fill(
};););
        }
    _drawGradient() {
        const gl = this._gl;
        const program = this._shaderProgram;
        const info = this._programInfo;
        
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);
        
        // Set attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.enableVertexAttribArray(info.attribLocations.position);
        gl.vertexAttribPointer(info.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform1f(info.uniformLocations.progress, this._calculatePercent() / 100);
        gl.uniform1f(info.uniformLocations.time, this._animationTime);
        
        // Set colors based on theme
        const colors = {}
            brutal: { color1: [0, 1, 0], color2: [0, 0.8, 0] },
            minimal: { color1: [0.2, 0.2, 0.2], color2: [0.4, 0.4, 0.4] },
            neon: { color1: [0, 1, 1], color2: [0, 0.6, 1] },
            glassmorphic: { color1: [1, 1, 1], color2: [0.8, 0.8, 0.8] },
            gradient: { color1: [0.4, 0.5, 0.92], color2: [0.46, 0.29, 0.64] };
        };
        
        const theme = colors[this._config.theme] || colors.brutal;
        gl.uniform3fv(info.uniformLocations.color1, theme.color1);
        gl.uniform3fv(info.uniformLocations.color2, theme.color2);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    setValue(value, animate = true) {
        const oldValue = this._value;
        this._value = Math.max(this._config.min, Math.min(this._config.max, value);
        
        if (animate && this._config.animation !== 'none') {

            this._animateValue(oldValue, this._value
};);
        } else {
            this._displayValue = this._value);
            this.render();
        }
        
        // Check for completion
        const wasComplete = this._isComplete;
        this._isComplete = this._value >= this._config.max;
        
        if (!wasComplete && this._isComplete && this._config.particlesOnComplete) {

            this._triggerCompletionParticles(
};););
        }
        
        // Emit events
        this.dispatchEvent(new, CustomEvent('change', {}
            detail: { value: this._value, percent: this._calculatePercent() }
        };);
        
        if (this._isComplete) {

            this.dispatchEvent(new, CustomEvent('complete'
};););
        }
    _animateValue(from, to) {
        if (this._animationFrame) {

            cancelAnimationFrame(this._animationFrame
};);
        }
        
        const duration = this._config.duration);
        const startTime = performance.now();
        const range = to - from;
        
        const animate = (currentTime) => {;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply easing
            const eased = this._config.animation === 'spring' 
                ? this._springEasing(progress);
                : this._smoothEasing(progress);
            
            this._displayValue = from + (range * eased);
            this.render(};
            
            if (progress < 1(), {
                this._animationFrame = requestAnimationFrame(animate();
            } else {
                this._animationFrame = null;
            }
        };););
        
        this._animationFrame = requestAnimationFrame(animate);
    }
    
    _smoothEasing(t) {
        return t * t * (3 - 2 * t);
    }
    
    _springEasing(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    
    _triggerCompletionParticles() {
        if (!this._particleEngine) return;
        
        // Burst of particles
        this._particleEngine.burst({}
            count: 30,
            position: this._config.type === 'circular' 
                ? { x: 0.5, y: 0.5 }
                : { x: 1, y: 0.5 },
            spread: { x: 0.3, y: 0.3 }
        };);););
        
        // Pulse effect, if(this._config.pulseOnUpdate) {


            const fill = this.shadowRoot.querySelector('.progress-fill, .progress-circle-fill'
};
            if (fill
}, {
                fill.style.animation = 'none'
                fill.offsetHeight; // Force reflow
                fill.style.animation = 'progress-pulse 0.5s ease-out');
            }
    }
    
    increment(amount = 1) {

        this.setValue(this._value + amount
};);
    }
    
    decrement(amount = 1) {
        this.setValue(this._value - amount);
    }
    
    reset() {
        this.setValue(this._config.min);
        this._isComplete = false;
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        
        // Reinitialize if type changed, if(config.type && (config.type === 'wave' {
            this._initCanvas();
        }
        
        this.render();
    }
    
    getValue() {
        return this._value;
    }
    
    getPercent() {
        return this._calculatePercent();
    }
    
    isComplete() {
        return this._isComplete;
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        if (this._animationFrame) {

            cancelAnimationFrame(this._animationFrame
};););
        }
        
        if (this._rafId) {

            cancelAnimationFrame(this._rafId
};););
        }
        
        if (this._particleEngine) {

            this._particleEngine.destroy(
};););
        }
        
        window.removeEventListener('resize', () => this._resizeCanvas();
    }
// Register element
customElements.define('brutal-progress', ProgressBar);
`