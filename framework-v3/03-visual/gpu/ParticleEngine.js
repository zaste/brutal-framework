/**
 * @fileoverview BRUTAL V3 - Particle Engine
 * High-performance particle system with GPU acceleration
 * @version 3.0.0
 */

/**
 * Particle Engine - Cinematic effects for debugging
 */
export class ParticleEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext('2d');
        
        // Particle pools
        this.particles = [];
        this.particlePool = [];
        this.maxParticles = 5000;
        
        // Emitters
        this.emitters = new Map();
        
        // Physics settings
        this.gravity = { x: 0, y: 0.1 };
        this.wind = { x: 0, y: 0 };
        this.friction = 0.99;
        
        // GPU acceleration
        this.useGPU = false;
        this.gpuProgram = null;
        this.gpuBuffers = null;
        
        // Performance
        this.lastUpdate = performance.now();
        
        // V8 optimization - Fixed property order
        this._particleTemplate = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: null,
            alpha: 1,
            rotation: 0,
            rotationSpeed: 0,
            scale: 1,
            active: false
        };
    }
    
    /**
     * Initialize particle engine
     */
    async init() {
        // Pre-warm particle pool
        this._warmParticlePool();
        
        // Try to initialize GPU acceleration
        await this._initGPU();
        
        `);
    }
    
    /**
     * Pre-warm particle pool
     */
    _warmParticlePool() {
        for (let i = 0; i < 1000; i++) {
            const particle = { ...this._particleTemplate };
            this.particlePool.push(particle);
        }
    }
    
    /**
     * Initialize GPU acceleration
     */
    async _initGPU() {
        // Check for WebGL2 support
        const gl = this.canvas?.getContext('webgl2');
        if (!gl) return;
        
        try {
            // Create shader program for particles
            const vertexShader = `#version 300 es
                in vec2 a_position;
                in vec2 a_velocity;
                in float a_life;
                in float a_size;
                
                uniform mat4 u_projection;
                uniform float u_time;
                
                out float v_life;
                
                void main() {
                    vec2 position = a_position + a_velocity * u_time;
                    gl_Position = u_projection * vec4(position, 0.0, 1.0);
                    gl_PointSize = a_size * (1.0 - a_life);
                    v_life = a_life;
                }
            `;
            
            const fragmentShader = `#version 300 es
                precision mediump float;
                
                in float v_life;
                uniform vec4 u_color;
                out vec4 fragColor;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if (dist > 0.5) discard;
                    
                    float alpha = (1.0 - v_life) * (1.0 - dist * 2.0);
                    fragColor = vec4(u_color.rgb, u_color.a * alpha);
                }
            `;
            
            // Compile shaders
            this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
            
            if (this.gl) {
                this._initWebGLResources();
                this.useGPU = true;
            } else {
                this.useGPU = false;
                }
            
        } catch (error) {
            }
    }
    
    /**
     * Get particle from pool
     */
    _getParticle() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        
        // Create new particle with template structure
        return { ...this._particleTemplate };
    }
    
    /**
     * Release particle to pool
     */
    _releaseParticle(particle) {
        // Reset particle
        particle.active = false;
        particle.life = 0;
        particle.alpha = 1;
        particle.scale = 1;
        particle.rotation = 0;
        
        // Return to pool
        if (this.particlePool.length < 1000) {
            this.particlePool.push(particle);
        }
    }
    
    /**
     * Emit particles
     */
    emit(options = {}) {
        const {
            x = 0,
            y = 0,
            count = 10,
            speed = 1,
            spread = Math.PI * 2,
            life = 1000,
            size = 4,
            color = '#ffffff',
            gravity = true,
            burst = true
        } = options;
        
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            
            const particle = this._getParticle();
            
            // Position
            particle.x = x;
            particle.y = y;
            
            // Velocity
            const angle = burst ? 
                (Math.random() - 0.5) * spread :
                (i / count) * spread;
            
            const velocity = speed + (Math.random() - 0.5) * speed * 0.5;
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity;
            
            // Properties
            particle.life = 0;
            particle.maxLife = life + (Math.random() - 0.5) * life * 0.2;
            particle.size = size + (Math.random() - 0.5) * size * 0.5;
            particle.color = color;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.1;
            particle.useGravity = gravity;
            particle.active = true;
            
            this.particles.push(particle);
        }
    }
    
    /**
     * Create emitter
     */
    createEmitter(id, options = {}) {
        const emitter = {
            x: options.x || 0,
            y: options.y || 0,
            rate: options.rate || 10, // particles per second
            ...options,
            lastEmit: 0,
            active: true
        };
        
        this.emitters.set(id, emitter);
        return emitter;
    }
    
    /**
     * Update particles
     */
    update(deltaTime) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        // Update emitters
        for (const [id, emitter] of this.emitters) {
            if (!emitter.active) continue;
            
            const now = performance.now();
            const timeSinceLastEmit = now - emitter.lastEmit;
            const emitInterval = 1000 / emitter.rate;
            
            if (timeSinceLastEmit >= emitInterval) {
                this.emit({
                    x: emitter.x,
                    y: emitter.y,
                    count: 1,
                    ...emitter
                });
                emitter.lastEmit = now;
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update life
            particle.life += deltaTime;
            
            // Remove dead particles
            if (particle.life >= particle.maxLife) {
                this._releaseParticle(particle);
                this.particles.splice(i, 1);
                continue;
            }
            
            // Update physics
            if (particle.useGravity) {
                particle.vx += this.gravity.x * dt;
                particle.vy += this.gravity.y * dt;
            }
            
            // Wind
            particle.vx += this.wind.x * dt;
            particle.vy += this.wind.y * dt;
            
            // Friction
            particle.vx *= this.friction;
            particle.vy *= this.friction;
            
            // Update position
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Update rotation
            particle.rotation += particle.rotationSpeed * dt;
            
            // Update alpha based on life
            const lifeRatio = particle.life / particle.maxLife;
            particle.alpha = 1 - lifeRatio;
            
            // Update scale
            particle.scale = 1 - lifeRatio * 0.5;
        }
    }
    
    /**
     * Render particles
     */
    render() {
        if (!this.ctx) return;
        
        if (this.useGPU) {
            this._renderGPU();
        } else {
            this._renderCanvas2D();
        }
    }
    
    /**
     * Render using Canvas2D
     */
    _renderCanvas2D() {
        const ctx = this.ctx;
        
        // Save context state
        ctx.save();
        
        // Render each particle
        for (const particle of this.particles) {
            if (!particle.active) continue;
            
            ctx.save();
            
            // Position and rotation
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.scale(particle.scale, particle.scale);
            
            // Alpha
            ctx.globalAlpha = particle.alpha;
            
            // Draw particle
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect for bright particles
            if (particle.size > 5) {
                ctx.shadowBlur = particle.size;
                ctx.shadowColor = particle.color;
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Initialize WebGL resources
     */
    _initWebGLResources() {
        const gl = this.gl;
        
        // Compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vertexShader);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            );
            throw new Error('Shader compilation failed');
        }
        
        // Compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fragmentShader);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            );
            throw new Error('Shader compilation failed');
        }
        
        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            );
            throw new Error('Shader linking failed');
        }
        
        // Get locations
        this.locations = {
            attributes: {
                position: gl.getAttribLocation(this.program, 'a_position'),
                velocity: gl.getAttribLocation(this.program, 'a_velocity'),
                life: gl.getAttribLocation(this.program, 'a_life'),
                lifeTime: gl.getAttribLocation(this.program, 'a_lifeTime'),
                size: gl.getAttribLocation(this.program, 'a_size')
            },
            uniforms: {
                time: gl.getUniformLocation(this.program, 'u_time'),
                resolution: gl.getUniformLocation(this.program, 'u_resolution'),
                gravity: gl.getUniformLocation(this.program, 'u_gravity'),
                color: gl.getUniformLocation(this.program, 'u_color')
            }
        };
        
        // Create buffers
        this.particleBuffer = gl.createBuffer();
        this.particleData = new Float32Array(this.maxParticles * 8); // x,y,vx,vy,life,lifeTime,size,padding
        
        // Create VAO if available
        if (gl.createVertexArray) {
            this.vao = gl.createVertexArray();
            gl.bindVertexArray(this.vao);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW);
            
            // Position
            gl.enableVertexAttribArray(this.locations.attributes.position);
            gl.vertexAttribPointer(this.locations.attributes.position, 2, gl.FLOAT, false, 32, 0);
            
            // Velocity
            gl.enableVertexAttribArray(this.locations.attributes.velocity);
            gl.vertexAttribPointer(this.locations.attributes.velocity, 2, gl.FLOAT, false, 32, 8);
            
            // Life & LifeTime
            gl.enableVertexAttribArray(this.locations.attributes.life);
            gl.vertexAttribPointer(this.locations.attributes.life, 1, gl.FLOAT, false, 32, 16);
            
            gl.enableVertexAttribArray(this.locations.attributes.lifeTime);
            gl.vertexAttribPointer(this.locations.attributes.lifeTime, 1, gl.FLOAT, false, 32, 20);
            
            // Size
            gl.enableVertexAttribArray(this.locations.attributes.size);
            gl.vertexAttribPointer(this.locations.attributes.size, 1, gl.FLOAT, false, 32, 24);
            
            gl.bindVertexArray(null);
        }
    }
    
    /**
     * Render using GPU (WebGL2)
     */
    _renderGPU() {
        const gl = this.gl;
        const now = Date.now();
        
        // Clear
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Use program
        gl.useProgram(this.program);
        
        // Update particle data
        let dataIndex = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (!particle.active) continue;
            
            this.particleData[dataIndex++] = particle.x;
            this.particleData[dataIndex++] = particle.y;
            this.particleData[dataIndex++] = particle.vx;
            this.particleData[dataIndex++] = particle.vy;
            this.particleData[dataIndex++] = particle.life;
            this.particleData[dataIndex++] = particle.maxLife;
            this.particleData[dataIndex++] = particle.size;
            this.particleData[dataIndex++] = 0; // padding
        }
        
        const particleCount = dataIndex / 8;
        
        if (particleCount === 0) return;
        
        // Upload data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleData.subarray(0, dataIndex));
        
        // Set uniforms
        gl.uniform1f(this.locations.uniforms.time, now / 1000);
        gl.uniform2f(this.locations.uniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform3f(this.locations.uniforms.gravity, 0, this.config.gravity ? 300 : 0, 0);
        
        // Set color (use first particle color for now)
        const firstParticle = this.particles.find(p => p.active);
        if (firstParticle) {
            const color = this._hexToRgba(firstParticle.color);
            gl.uniform4f(this.locations.uniforms.color, color.r, color.g, color.b, color.a);
        }
        
        // Bind VAO if available
        if (this.vao) {
            gl.bindVertexArray(this.vao);
        } else {
            // Manual attribute setup
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
            
            gl.enableVertexAttribArray(this.locations.attributes.position);
            gl.vertexAttribPointer(this.locations.attributes.position, 2, gl.FLOAT, false, 32, 0);
            
            gl.enableVertexAttribArray(this.locations.attributes.velocity);
            gl.vertexAttribPointer(this.locations.attributes.velocity, 2, gl.FLOAT, false, 32, 8);
            
            gl.enableVertexAttribArray(this.locations.attributes.life);
            gl.vertexAttribPointer(this.locations.attributes.life, 1, gl.FLOAT, false, 32, 16);
            
            gl.enableVertexAttribArray(this.locations.attributes.lifeTime);
            gl.vertexAttribPointer(this.locations.attributes.lifeTime, 1, gl.FLOAT, false, 32, 20);
            
            gl.enableVertexAttribArray(this.locations.attributes.size);
            gl.vertexAttribPointer(this.locations.attributes.size, 1, gl.FLOAT, false, 32, 24);
        }
        
        // Draw particles as points
        gl.drawArrays(gl.POINTS, 0, particleCount);
        
        // Unbind VAO
        if (this.vao) {
            gl.bindVertexArray(null);
        }
    }
    
    /**
     * Convert hex color to RGBA
     */
    _hexToRgba(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
            a: result[4] ? parseInt(result[4], 16) / 255 : 1.0
        } : { r: 1, g: 1, b: 1, a: 1 };
    }
    
    /**
     * Create preset effects
     */
    effects = {
        // Render success effect
        renderSuccess: (x, y) => {
            this.emit({
                x, y,
                count: 20,
                color: '#00ff00',
                speed: 2,
                spread: Math.PI * 2,
                life: 1000,
                size: 3,
                gravity: false
            });
        },
        
        // Error explosion
        errorExplosion: (x, y) => {
            this.emit({
                x, y,
                count: 50,
                color: '#ff0000',
                speed: 5,
                spread: Math.PI * 2,
                life: 1500,
                size: 5,
                gravity: true
            });
        },
        
        // State change flow
        stateFlow: (fromX, fromY, toX, toY) => {
            const angle = Math.atan2(toY - fromY, toX - fromX);
            const distance = Math.hypot(toX - fromX, toY - fromY);
            const steps = Math.ceil(distance / 20);
            
            for (let i = 0; i < steps; i++) {
                setTimeout(() => {
                    const progress = i / steps;
                    const x = fromX + (toX - fromX) * progress;
                    const y = fromY + (toY - fromY) * progress;
                    
                    this.emit({
                        x, y,
                        count: 3,
                        color: '#00ffff',
                        speed: 0.5,
                        spread: 0.5,
                        life: 500,
                        size: 2,
                        gravity: false
                    });
                }, i * 50);
            }
        },
        
        // Performance warning
        performanceWarning: (x, y) => {
            const emitter = this.createEmitter('perf-warning', {
                x, y,
                rate: 20,
                color: '#ffff00',
                speed: 1,
                spread: 0.5,
                life: 800,
                size: 3,
                gravity: false
            });
            
            // Stop after 2 seconds
            setTimeout(() => {
                emitter.active = false;
                this.emitters.delete('perf-warning');
            }, 2000);
        },
        
        // Memory leak indicator
        memoryLeak: (x, y) => {
            this.emit({
                x, y,
                count: 100,
                color: '#ff00ff',
                speed: 0.5,
                spread: Math.PI * 2,
                life: 3000,
                size: 2,
                gravity: true
            });
        },
        
        // Success celebration
        celebration: () => {
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
            
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const x = Math.random() * this.canvas.width;
                    const y = this.canvas.height;
                    
                    this.emit({
                        x, y,
                        count: 30,
                        color: colors[i % colors.length],
                        speed: 8,
                        spread: Math.PI * 0.6,
                        life: 2000,
                        size: 4,
                        gravity: true
                    });
                }, i * 200);
            }
        }
    };
    
    /**
     * Clear all particles
     */
    clear() {
        // Release all particles
        for (const particle of this.particles) {
            this._releaseParticle(particle);
        }
        
        this.particles = [];
        this.emitters.clear();
    }
    
    /**
     * Get particle count
     */
    getParticleCount() {
        return this.particles.length;
    }
    
    /**
     * Set gravity
     */
    setGravity(x, y) {
        this.gravity.x = x;
        this.gravity.y = y;
    }
    
    /**
     * Set wind
     */
    setWind(x, y) {
        this.wind.x = x;
        this.wind.y = y;
    }
    
    /**
     * Resize canvas
     */
    resize(width, height) {
        // Update projection matrix for GPU rendering
        if (this.useGPU) {
            // Would update GPU projection here
        }
    }
    
    /**
     * Destroy particle engine
     */
    destroy() {
        this.clear();
        this.particlePool = [];
        
        // Clean up GPU resources
        if (this.useGPU && this.gpuProgram) {
            // Would clean up WebGL resources
        }
    }
}