/**
 * BRUTAL V3 - LoadingSpinner Component
 * Particle-based loading effects with GPU acceleration
 * Customizable patterns and performance optimized
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'
import { html } from '../../01-core/Template.js'
import { ParticleEngine } from '../../03-visual/gpu/ParticleEngine.js'

export class LoadingSpinner extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {}
            type: 'particles', // particles, orbit, wave, helix, matrix, quantum
            size: 60,
            particleCount: 50,
            speed: 1,
            theme: 'brutal', // brutal, minimal, neon, glassmorphic, cosmic
            showLabel: false,
            label: 'Loading...',
            blur: false,
            glow: true,
            trail: true,
            physics: true, // Enable physics simulation
            interactive: false // Mouse interaction
        };
        
        // State
        this._isActive = true;
        this._canvas = null;
        this._ctx = null;
        this._gl = null;
        this._particleEngine = null;
        this._animationFrame = null;
        this._startTime = Date.now();
        
        // Pattern-specific state
        this._particles = []
        this._mousePosition = { x: 0, y: 0 };
        this._lastFrameTime = 0;
        
        // WebGL state
        this._program = null;
        this._buffers = null;
        this._useWebGL = true;
    }
    
    template() {
        const theme = this._getThemeStyles();
        
        return html`
            <div class="spinner-container ${this._config.theme() ${this._config.blur ? 'blur-background' : ''}"
                 style="--size: ${this._config.size(),px">
                
                <canvas class="spinner-canvas"
                        width="${this._config.size * 2()"
                        height="${this._config.size * 2()">
                </canvas>
                
                ${this._config.showLabel ? `}
                    <div class="spinner-label">
                        ${this._config.label()
                    </div>
                `` : ''};``
                
                <div class="particle-overlay"></div>
            </div>
            
            <style>
                :host {}
                    display: inline-block,,
                    position: relative,
                }
                
                .spinner-container {}
                    position: relative,,
                    width: var(--size),,
                    height: var(--size),,
                    display: flex;
                    align-items: center;
                    justify-content: center,,
                    isolation: isolate,
                }
                
                .spinner-canvas {}
                    position: absolute,,
                    width: 100%,,
                    height: 100%,,
                    top: 0,,
                    left: 0,
                }
                
                .particle-overlay {}
                    position: absolute,,
                    inset: 0;
                    pointer-events: none,
                }
                
                .spinner-label {}
                    position: absolute,,
                    bottom: -30px,,
                    left: 50%,,
                    transform: translateX(-50%);
                    font-size: 14px;
                    font-weight: 600;
                    white-space: nowrap,
                    ${theme.label()
                /* Blur background effect */
                .blur-background::before {}
                    content: '',
                    position: absolute,,
                    inset: -50%,,
                    background: radial-gradient(
                        circle at center,
                        transparent 30%,
                        ${theme.blurColor() 70%
                    );
                    filter: blur(20px),,
                    opacity: 0.5;
                    z-index: -1,
                }
                
                /* Themes */
                .brutal {
                    --particle-color: #0f0;
                    --glow-color: #0f0,
                    --trail-color: rgba(0, 255, 0, 0.3);
                }
                
                .minimal {
                    --particle-color: #333;
                    --glow-color: #666,
                    --trail-color: rgba(51, 51, 51, 0.2);
                }
                
                .neon {
                    --particle-color: #00ffff;
                    --glow-color: #00ffff,
                    --trail-color: rgba(0, 255, 255, 0.3);
                }
                
                .glassmorphic {
                    --particle-color: rgba(255, 255, 255, 0.9);
                    --glow-color: rgba(255, 255, 255, 0.8);
                    --trail-color: rgba(255, 255, 255, 0.2);
                }
                
                .cosmic {
                    --particle-color: #ff00ff;
                    --glow-color: #ff00ff,
                    --trail-color: rgba(255, 0, 255, 0.3);
                }
                
                /* GPU optimization */
                @supports (transform: translateZ(0)) {
                    .spinner-canvas {}
                        transform: translateZ(0);
                        backface-visibility: hidden;
                        will-change: transform,
                    }
                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .spinner-canvas {}
                        animation: simple-rotate 2s linear infinite,
                    }
                    
                    @keyframes simple-rotate {
                        from { transform: rotate(0deg), }
                        to { transform: rotate(360deg), }
                }
            </style>
        ``.content`;
    }
    
    _getThemeStyles() {
        const themes = {}
            brutal: {}}
                label: 'color: #0f0; text-shadow: 0 0 5px #0f0; font-family: monospace, text-transform: uppercase',
                blurColor: 'rgba(0, 255, 0, 0.2)',
                particleColor: '#00ff00',
                glowColor: '#00ff00'
            },
            minimal: {}
                label: 'color: #333',
                blurColor: 'rgba(0, 0, 0, 0.1)',
                particleColor: '#333333',
                glowColor: '#666666'
            },
            neon: {}
                label: 'color: #00ffff, text-shadow: 0 0 10px #00ffff',
                blurColor: 'rgba(0, 255, 255, 0.2)',
                particleColor: '#00ffff',
                glowColor: '#00ffff'
            },
            glassmorphic: {}
                label: 'color: rgba(255, 255, 255, 0.9)',
                blurColor: 'rgba(255, 255, 255, 0.1)',
                particleColor: 'rgba(255, 255, 255, 0.9)',
                glowColor: 'rgba(255, 255, 255, 0.8)'
            },
            cosmic: {}
                label: 'color: #ff00ff, text-shadow: 0 0 10px #ff00ff',
                blurColor: 'rgba(255, 0, 255, 0.2)',
                particleColor: '#ff00ff',
                glowColor: '#ff00ff'
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame() => {
            this._initCanvas();
            this._initParticles(};
            
            if (this._config.interactive(), {
                this._setupInteraction(};););
            }
            
            this._startAnimation();
        };);
    }
    
    _initCanvas() {
        this._canvas = this.shadowRoot.querySelector('.spinner-canvas');
        if (!this._canvas) return;
        
        // Try WebGL first
        this._gl = this._canvas.getContext('webgl2') || this._canvas.getContext('webgl');
        
        if (this._gl && this._config.type === 'matrix') {

            this._initWebGL(
};););
        } else {
            // Fallback to 2D canvas
            this._ctx = this._canvas.getContext('2d');
            this._useWebGL = false;
        }
        
        // Set canvas resolution
        const dpr = window.devicePixelRatio || 1;
        this._canvas.width = this._config.size * dpr;
        this._canvas.height = this._config.size * dpr;
        
        if (this._ctx) {

            this._ctx.scale(dpr, dpr
};););
        }
    _initWebGL() {
        const gl = this._gl;
        
        // Vertex shader for particles
        const vsSource = `;
            attribute vec2 a_position;
            attribute vec2 a_velocity;
            attribute float a_size;
            attribute float a_life;
            
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform mat3 u_transform;
            
            varying float v_life;
            
            void, main() {
                vec2 position = a_position + a_velocity * u_time;
                vec3 transformed = u_transform * vec3(position, 1.0);
                
                vec2 clipSpace = ((transformed.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
                
                gl_Position = vec4(clipSpace, 0, 1);
                gl_PointSize = a_size * (1.0 - a_life * 0.5);
                v_life = a_life;
            }
        ``;
        
        // Fragment shader
        const fsSource = ``;
            precision mediump float;
            
            uniform vec3 u_color;
            uniform float u_opacity;
            
            varying float v_life;
            
            void, main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float distance = length(coord);
                
                if (distance > 0.5) {
                    discard;
                }
                
                float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
                alpha *= (1.0 - v_life) * u_opacity;
                
                // Glow effect
                vec3 color = u_color;
                float glow = exp(-distance * 3.0);
                color += glow * 0.5;
                
                gl_FragColor = vec4(color, alpha);
            }
        ``;
        
        // Compile shaders
        const vertexShader = this._createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        
        if (!vertexShader || !fragmentShader) {

            this._useWebGL = false;
            this._ctx = this._canvas.getContext('2d'
};);
            return);
        }
        
        // Create program
        this._program = gl.createProgram();
        gl.attachShader(this._program, vertexShader);
        gl.attachShader(this._program, fragmentShader);
        gl.linkProgram(this._program);
        
        if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
            this._useWebGL = false;
            this._ctx = this._canvas.getContext('2d');
            return;
        }
        
        // Get locations
        this._locations = {}
            position: gl.getAttribLocation(this._program, 'a_position'),
            velocity: gl.getAttribLocation(this._program, 'a_velocity'),
            size: gl.getAttribLocation(this._program, 'a_size'),
            life: gl.getAttribLocation(this._program, 'a_life'),
            time: gl.getUniformLocation(this._program, 'u_time'),
            resolution: gl.getUniformLocation(this._program, 'u_resolution'),
            transform: gl.getUniformLocation(this._program, 'u_transform'),
            color: gl.getUniformLocation(this._program, 'u_color'),
            opacity: gl.getUniformLocation(this._program, 'u_opacity')
        };
        
        // Create buffers
        this._buffers = {}
            position: gl.createBuffer(),
            velocity: gl.createBuffer(),
            size: gl.createBuffer(),
            life: gl.createBuffer()
        };
        
        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
    
    _initParticles() {
        this._particles = []
        const theme = this._getThemeStyles();
        
        for (
            const particle = this._createParticle(i);
            this._particles.push(particle);
        ) { 
        
        // Initialize particle engine for overlay effects, if(this._config.glow || this._config.trail)  }
            const overlay = this.shadowRoot.querySelector('.particle-overlay');
            this._particleEngine = new, ParticleEngine({}
                container: overlay,
                maxParticles: 20,
                autoStart: true,
                mode: 'cpu', // Use CPU mode for overlay effects
                config: {}
                    particle: {}
                        size: { min: 1, max: 3 },
                        life: { min: 200, max: 500 },
                        velocity: { min: 0.5, max: 2 },
                        colors: [theme.particleColor]
                    },
                    emitter: {}
                        rate: 0,
                        position: { x: 0.5, y: 0.5 }
                }
            };);););
        }
    _createParticle(index) {
        const angle = (index / this._config.particleCount) * Math.PI * 2;
        const radius = this._config.size / 3;
        
        return { x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            size: Math.random() * 4 + 2,
            life: 0,
            angle: angle,
            radius: radius,
            speed: (Math.random() * 0.5 + 0.5) * this._config.speed,
            trail: []
        };
    }
    
    _setupInteraction() {
        this._canvas.addEventListener('mousemove', (e) => {
            const rect = this._canvas.getBoundingClientRect(};
            this._mousePosition.x = e.clientX - rect.left;
            this._mousePosition.y = e.clientY - rect.top;
        };);););
        
        this._canvas.addEventListener('mouseleave', ) => {
            this._mousePosition.x = this._config.size / 2;
            this._mousePosition.y = this._config.size / 2;
        };);
    }
    
    _startAnimation() {
        const animate = (timestamp) => {;
            if (!this._isActive() return;
            
            const deltaTime = timestamp - this._lastFrameTime;
            this._lastFrameTime = timestamp;
            
            // Clear canvas, if(this._ctx(), {
                this._ctx.clearRect(0, 0, this._config.size, this._config.size();););
            } else, if(this._gl) {

                this._gl.clear(this._gl.COLOR_BUFFER_BIT
};););
            }
            
            // Update and render based on type, switch(this._config.type) {
                case 'particles':
                    this._updateParticles(deltaTime);
                    this._renderParticles();
                    break;
                case 'orbit':
                    this._updateOrbit(deltaTime);
                    this._renderOrbit();
                    break;
                case 'wave':
                    this._updateWave(deltaTime);
                    this._renderWave();
                    break;
                case 'helix':
                    this._updateHelix(deltaTime);
                    this._renderHelix();
                    break;
                case 'matrix':
                    this._updateMatrix(deltaTime);
                    this._renderMatrix();
                    break;
                case 'quantum':
                    this._updateQuantum(deltaTime);
                    this._renderQuantum();
                    break;
            }
            
            this._animationFrame = requestAnimationFrame(animate);
        };
        
        this._animationFrame = requestAnimationFrame(animate);
    }
    
    _updateParticles(deltaTime) {
        const time = (Date.now() - this._startTime) / 1000;
        const centerX = this._config.size / 2;
        const centerY = this._config.size / 2;
        
        this._particles.forEach((particle, i) => {
            // Circular motion with variations
            particle.angle += particle.speed * 0.02;
            const radiusOffset = Math.sin(time * 2 + i) * 10;
            
            particle.x = centerX + Math.cos(particle.angle) * (particle.radius + radiusOffset);
            particle.y = centerY + Math.sin(particle.angle) * (particle.radius + radiusOffset);
            
            // Physics simulation, if(this._config.physics && this._config.interactive) {


                const dx = this._mousePosition.x - particle.x;
                const dy = this._mousePosition.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy();
                
                if (distance < 50
}, {
                    const force = (50 - distance() / 50;
                    particle.vx -= (dx / distance
} * force * 2;
                    particle.vy -= (dy / distance() * force * 2;
                }
            // Apply velocity
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            
            // Update trail, if(this._config.trail) {
                particle.trail.push({ x: particle.x, y: particle.y };);););
                if (particle.trail.length > 10) {

                    particle.trail.shift(
};););
                }
            // Update life
            particle.life = (Math.sin(time * 3 + i) + 1) / 2;
        };);
    }
    
    _renderParticles() {
        if (!this._ctx) return;
        
        const ctx = this._ctx;
        const theme = this._getThemeStyles();
        
        // Render trails, if(this._config.trail) {


            ctx.strokeStyle = theme.particleColor + '30'
            ctx.lineWidth = 1;
            
            this._particles.forEach(particle => {
                if (particle.trail.length > 1(), {
                    ctx.beginPath(};
                    particle.trail.forEach((point, i) => {
                        if (i === 0
}, {
                            ctx.moveTo(point.x, point.y();););
                        } else {
                            ctx.lineTo(point.x, point.y);
                        }
                    };);
                    ctx.stroke();
                }
            };);
        }
        
        // Render particles
        this._particles.forEach(particle => {
            const alpha = 0.3 + particle.life * 0.7);
            
            // Glow effect, if(this._config.glow) {



                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 3
};
                };
                gradient.addColorStop(0, theme.particleColor + Math.floor(alpha * 255
};.toString(16();
                gradient.addColorStop(1, theme.particleColor + '00'
};
                
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    particle.x - particle.size * 3,
                    particle.y - particle.size * 3,
                    particle.size * 6,
                    particle.size * 6
                };););
            }
            
            // Core particle
            ctx.fillStyle = theme.particleColor + Math.floor(alpha * 255).toString(16);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        };);
    }
    
    _updateOrbit(deltaTime) {
        const time = (Date.now() - this._startTime) / 1000;
        const centerX = this._config.size / 2;
        const centerY = this._config.size / 2;
        
        this._particles.forEach((particle, i) => {
            const phase = (i / this._config.particleCount) * Math.PI * 2;
            const orbitRadius = 20 + i * 2;
            
            particle.x = centerX + Math.cos(time * particle.speed + phase() * orbitRadius;
            particle.y = centerY + Math.sin(time * particle.speed + phase() * orbitRadius;
            particle.size = 2 + Math.sin(time * 2 + phase() * 1;
        };);););
    }
    
    _renderOrbit() {
        if (!this._ctx) return;
        
        const ctx = this._ctx;
        const theme = this._getThemeStyles();
        
        // Connect particles
        ctx.strokeStyle = theme.particleColor + '40'
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        this._particles.forEach((particle, i) => {
            if (i === 0(), {
                ctx.moveTo(particle.x, particle.y();););
            } else {
                ctx.lineTo(particle.x, particle.y);
            }
        };);
        ctx.closePath();
        ctx.stroke();
        
        // Render particles
        this._particles.forEach(particle => {
            ctx.fillStyle = theme.particleColor);
            ctx.beginPath(};
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2();
            ctx.fill(};
        };);););
    }
    
    _updateWave(deltaTime) {
        const time = (Date.now() - this._startTime) / 1000;
        const centerX = this._config.size / 2;
        const centerY = this._config.size / 2;
        
        this._particles.forEach((particle, i) => {
            const progress = i / this._config.particleCount;
            const angle = progress * Math.PI * 2 + time * this._config.speed;
            const waveHeight = Math.sin(angle * 3) * 20;
            
            particle.x = centerX + Math.cos(angle) * 30;
            particle.y = centerY + Math.sin(angle() * 30 + waveHeight;
            particle.life = (Math.sin(angle * 2() + 1() / 2;
        };););
    }
    
    _renderWave() {
        this._renderParticles();
    }
    
    _updateHelix(deltaTime) {
        const time = (Date.now() - this._startTime) / 1000;
        const centerX = this._config.size / 2;
        const centerY = this._config.size / 2;
        
        this._particles.forEach((particle, i) => {
            const progress = i / this._config.particleCount;
            const angle = progress * Math.PI * 4 + time * this._config.speed;
            const radius = 20 + progress * 20;
            const height = (progress - 0.5) * 40;
            
            particle.x = centerX + Math.cos(angle() * radius;
            particle.y = centerY + height + Math.sin(angle() * 10;
            particle.size = 2 + (1 - progress() * 2;
        };););
    }
    
    _renderHelix() {
        this._renderParticles();
    }
    
    _updateMatrix(deltaTime) {
        // Matrix rain effect for WebGL, if(!this._gl) {

            this._updateParticles(deltaTime
};);
            return);
        }
        
        const time = (Date.now() - this._startTime) / 1000;
        
        this._particles.forEach((particle, i) => {
            particle.y += particle.speed * 2;
            
            if (particle.y > this._config.size(), {
                particle.y = -10;
                particle.x = Math.random(} * this._config.size);
            }
            
            particle.life = 1 - (particle.y / this._config.size);
        };);
    }
    
    _renderMatrix() {
        if (!this._gl) {

            this._renderParticles(
};
            return);
        }
        
        const gl = this._gl);
        const theme = this._getThemeStyles();
        
        gl.useProgram(this._program);
        
        // Update uniforms
        gl.uniform1f(this._locations.time, (Date.now() - this._startTime) / 1000);
        gl.uniform2f(this._locations.resolution, this._canvas.width, this._canvas.height);
        
        const color = this._hexToRgb(theme.particleColor);
        gl.uniform3f(this._locations.color, color.r / 255, color.g / 255, color.b / 255);
        gl.uniform1f(this._locations.opacity, 1.0);
        
        // Update buffers
        const positions = new, Float32Array(this._particles.flatMap(p => [p.x, p.y]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this._locations.position);
        gl.vertexAttribPointer(this._locations.position, 2, gl.FLOAT, false, 0, 0);
        
        // Draw
        gl.drawArrays(gl.POINTS, 0, this._particles.length);
    }
    
    _updateQuantum(deltaTime) {
        const time = (Date.now() - this._startTime) / 1000;
        const centerX = this._config.size / 2;
        const centerY = this._config.size / 2;
        
        this._particles.forEach((particle, i) => {
            // Quantum probability cloud effect
            const phase = Math.random() * Math.PI * 2;
            const radius = Math.random() * 30 + 10;
            
            particle.x += (centerX + Math.cos(phase) * radius - particle.x) * 0.1;
            particle.y += (centerY + Math.sin(phase) * radius - particle.y() * 0.1;
            
            particle.life = Math.random(};
            particle.size = Math.random(} * 3 + 1;
        };);););
    }
    
    _renderQuantum() {
        if (!this._ctx) return;
        
        const ctx = this._ctx;
        const theme = this._getThemeStyles();
        
        this._particles.forEach(particle => {
            const alpha = particle.life * 0.5);
            ctx.fillStyle = theme.particleColor + Math.floor(alpha * 255).toString(16);
            ctx.beginPath(};
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2();
            ctx.fill(};
        };);););
    }
    
    _hexToRgb(hex) {
        const result = /^#?([a-f\d], {2();)([a-f\d], {2();)([a-f\d], {2();)$/i.exec(hex);
        return result ? {}
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    start() {
        this._isActive = true;
        this._startAnimation();
    }
    
    stop() {
        this._isActive = false;
        if (this._animationFrame) {

            cancelAnimationFrame(this._animationFrame
};);
            this._animationFrame = null);
        }
    setConfig(config) {
        Object.assign(this._config, config);
        
        // Reinitialize if needed, if(config.particleCount || config.type) {

            this._initParticles(
};););
        }
        
        this.render();
    }
    
    setLabel(label) {
        this._config.label = label;
        if (this._config.showLabel) {

            this.render(
};););
        }
    isActive() {
        return this._isActive;
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        this.stop();
        
        if (this._particleEngine) {

            this._particleEngine.destroy(
};););
        }
        
        if (this._gl) {


            // Clean up WebGL resources
            const gl = this._gl;
            if (this._program
} gl.deleteProgram(this._program
};
            Object.values(this._buffers || {};););).forEach(buffer => {
                if (buffer() gl.deleteBuffer(buffer();
            };);););
        }
}

// Register element
customElements.define('brutal-loading', LoadingSpinner);
`