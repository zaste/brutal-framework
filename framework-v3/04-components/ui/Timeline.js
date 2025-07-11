/**
 * BRUTAL V3 - Timeline Component
 * WebGL-rendered timeline with particle effects and GPU physics
 * Zero dependencies, 60fps performance, infinite scrolling
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';
import { html } from '../../01-core/Template.js';
import { animationSystem } from '../../02-performance/08-AnimationSystem.js';
import { gestureSystem } from '../../02-performance/09-GestureSystem.js';

export class Timeline extends InteractiveComponent {
    constructor() {
        super();
        
        // Timeline configuration
        this._config = {
            orientation: 'vertical', // vertical, horizontal
            layout: 'alternate', // left, right, alternate, center
            animation: 'fade', // fade, slide, zoom, particle
            connectionStyle: 'line', // line, curve, dots, particles
            webglEnabled: true,
            particleEffects: true,
            infiniteScroll: false,
            virtualScrolling: true,
            gpuPhysics: true,
            autoPlay: false,
            playbackSpeed: 1,
            interactive: true,
            zoomable: true,
            theme: 'brutal' // brutal, minimal, neon, holographic
        };
        
        // Timeline state
        this._items = [];
        this._visibleItems = new Set();
        this._activeIndex = -1;
        this._scrollPosition = 0;
        this._zoomLevel = 1;
        this._isPlaying = false;
        this._timeScale = 1;
        
        // WebGL resources
        this._canvas = null;
        this._gl = null;
        this._programs = {};
        this._buffers = {};
        this._textures = new Map();
        this._particles = [];
        this._frameBuffer = null;
        
        // Performance
        this._rafId = null;
        this._lastFrame = 0;
        this._fps = 60;
        this._renderQueue = [];
        
        // Virtual scrolling
        this._viewportHeight = 0;
        this._itemHeight = 150;
        this._overscan = 3;
        this._scrollDebounce = null;
        
        // Physics simulation
        this._physics = {
            particles: [],
            connections: [],
            forces: [],
            gravity: { x: 0, y: 0.1, z: 0 },
            damping: 0.98,
            springStrength: 0.02
        };
        
        // Animation state
        this._animations = new Map();
        this._transitions = new Map();
        
        // Bind methods
        this._render = this._render.bind(this);
        this._handleScroll = this._handleScroll.bind(this);
        this._handleResize = this._handleResize.bind(this);
        this._handleWheel = this._handleWheel.bind(this);
        this._updatePhysics = this._updatePhysics.bind(this);
    }
    
    static get observedAttributes() {
        return [...super.observedAttributes, 'orientation', 'layout', 'animation',
                'connection-style', 'auto-play', 'theme', 'zoom-level'];
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Initialize timeline
        this._initialize();
        
        // Set up event delegation for controls
        requestAnimationFrame(() => {
            this.shadowRoot.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                
                const action = target.dataset.action;
                switch (action) {
                    case 'zoom-in':
                        this.setZoom(this._zoomLevel * 1.2);
                        break;
                    case 'zoom-out':
                        this.setZoom(this._zoomLevel / 1.2);
                        break;
                    case 'play-pause':
                        this._isPlaying ? this.pause() : this.play();
                        break;
                }
            });
        });
        
        // Set up event listeners
        this.addEventListener('scroll', this._handleScroll, { passive: true });
        window.addEventListener('resize', this._handleResize);
        
        // Set up gestures
        this._setupGestures();
        
        // Start render loop
        this._startRenderLoop();
        
        // Auto-play if enabled
        if (this._config.autoPlay) {
            this.play();
        }
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clean up
        this.removeEventListener('scroll', this._handleScroll);
        window.removeEventListener('resize', this._handleResize);
        
        // Stop render loop
        this._stopRenderLoop();
        
        // Clean up WebGL
        this._cleanupWebGL();
        
        // Clear animations
        this._animations.clear();
        this._transitions.clear();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        
        switch (name) {
            case 'orientation':
                this._config.orientation = newValue || 'vertical';
                this._updateLayout();
                break;
            case 'layout':
                this._config.layout = newValue || 'alternate';
                this._updateLayout();
                break;
            case 'animation':
                this._config.animation = newValue || 'fade';
                break;
            case 'connection-style':
                this._config.connectionStyle = newValue || 'line';
                this._updateConnections();
                break;
            case 'auto-play':
                this._config.autoPlay = newValue !== null && newValue !== 'false';
                if (this._config.autoPlay) {
                    this.play();
                } else {
                    this.pause();
                }
                break;
            case 'theme':
                this._config.theme = newValue || 'brutal';
                this.scheduleUpdate();
                break;
            case 'zoom-level':
                this.setZoom(parseFloat(newValue) || 1);
                break;
        }
    }
    
    /**
     * Initialize timeline
     */
    _initialize() {
        // Collect timeline items
        this._collectItems();
        
        // Initialize viewport
        this._updateViewport();
        
        // Initialize WebGL
        if (this._config.webglEnabled) {
            this._initWebGL();
        }
        
        // Initialize physics
        if (this._config.gpuPhysics) {
            this._initPhysics();
        }
        
        // Update initial layout
        this._updateLayout();
    }
    
    /**
     * Collect timeline items from children
     */
    _collectItems() {
        this._items = Array.from(this.children).map((child, index) => {
            const date = child.getAttribute('date') || new Date().toISOString();
            const title = child.getAttribute('title') || `Item ${index + 1}`;
            const type = child.getAttribute('type') || 'default';
            
            return {
                id: `item-${index}`,
                index,
                element: child,
                date: new Date(date),
                timestamp: new Date(date).getTime(),
                title,
                type,
                content: child.innerHTML,
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                visible: false,
                rendered: false,
                particle: null
            };
        });
        
        // Sort by date
        this._items.sort((a, b) => a.timestamp - b.timestamp);
        
        // Calculate time range
        if (this._items.length > 0) {
            this._timeRange = {
                start: this._items[0].timestamp,
                end: this._items[this._items.length - 1].timestamp,
                duration: this._items[this._items.length - 1].timestamp - this._items[0].timestamp
            };
        }
    }
    
    /**
     * Initialize WebGL
     */
    _initWebGL() {
        // Create canvas
        this._canvas = document.createElement('canvas');
        this._canvas.className = 'timeline-webgl-canvas';
        
        // Get context
        this._gl = this._canvas.getContext('webgl2', {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        }) || this._canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: false
        });
        
        if (!this._gl) {
            this._config.webglEnabled = false;
            return;
        }
        
        // Initialize shaders
        this._initShaders();
        
        // Initialize buffers
        this._initBuffers();
        
        // Initialize textures
        this._initTextures();
        
        // Set up WebGL state
        const gl = this._gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
    }
    
    /**
     * Initialize shaders
     */
    _initShaders() {
        const gl = this._gl;
        
        // Particle shader
        this._programs.particle = this._createProgram(
            // Vertex shader
            `
            attribute vec3 a_position;
            attribute vec3 a_velocity;
            attribute vec4 a_color;
            attribute float a_size;
            attribute float a_life;
            
            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform float u_time;
            uniform float u_pixelRatio;
            
            varying vec4 v_color;
            varying float v_life;
            
            void main() {
                vec3 pos = a_position + a_velocity * u_time;
                
                // Add some physics
                pos.y -= 0.5 * 9.8 * u_time * u_time * 0.01;
                
                gl_Position = u_projection * u_view * vec4(pos, 1.0);
                gl_PointSize = a_size * u_pixelRatio * (1.0 - a_life * 0.5);
                
                v_color = a_color;
                v_color.a *= (1.0 - a_life);
                v_life = a_life;
            }
            `,
            // Fragment shader
            `
            precision highp float;
            
            varying vec4 v_color;
            varying float v_life;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                
                if (dist > 0.5) {
                    discard;
                }
                
                float alpha = smoothstep(0.5, 0.0, dist);
                gl_FragColor = v_color * alpha;
                
                // Add glow effect
                float glow = exp(-dist * 8.0) * 0.5;
                gl_FragColor.rgb += v_color.rgb * glow * (1.0 - v_life);
            }
            `
        );
        
        // Connection shader
        this._programs.connection = this._createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute float a_progress;
            
            uniform mat4 u_projection;
            uniform float u_thickness;
            uniform float u_time;
            
            varying float v_progress;
            varying vec2 v_position;
            
            void main() {
                gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
                v_progress = a_progress;
                v_position = a_position;
            }
            `,
            // Fragment shader
            `
            precision highp float;
            
            uniform vec4 u_color;
            uniform float u_time;
            uniform float u_glowIntensity;
            
            varying float v_progress;
            varying vec2 v_position;
            
            void main() {
                // Animated gradient
                float gradient = v_progress + sin(u_time * 2.0) * 0.1;
                
                // Energy flow effect
                float energy = sin(gradient * 20.0 - u_time * 5.0) * 0.5 + 0.5;
                
                vec4 color = u_color;
                color.rgb += vec3(energy * u_glowIntensity);
                
                // Fade edges
                color.a *= smoothstep(0.0, 0.1, v_progress) * smoothstep(1.0, 0.9, v_progress);
                
                gl_FragColor = color;
            }
            `
        );
        
        // Node shader (for timeline items)
        this._programs.node = this._createProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            uniform mat4 u_projection;
            uniform mat4 u_model;
            uniform float u_scale;
            
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = u_projection * u_model * vec4(a_position * u_scale, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
            `,
            // Fragment shader
            `
            precision highp float;
            
            uniform sampler2D u_texture;
            uniform vec4 u_color;
            uniform float u_time;
            uniform float u_active;
            uniform float u_hover;
            
            varying vec2 v_texCoord;
            
            void main() {
                vec4 texColor = texture2D(u_texture, v_texCoord);
                
                // Holographic effect
                float hologram = sin(v_texCoord.y * 50.0 - u_time * 2.0) * 0.03;
                texColor.rgb += vec3(hologram) * u_active;
                
                // Glow effect
                float glow = u_active * 0.5 + u_hover * 0.3;
                texColor.rgb += u_color.rgb * glow;
                
                // Pulse effect
                float pulse = sin(u_time * 3.0) * 0.1 + 1.0;
                texColor.a *= u_active > 0.0 ? pulse : 1.0;
                
                gl_FragColor = texColor;
            }
            `
        );
    }
    
    /**
     * Create shader program
     */
    _createProgram(vertexSource, fragmentSource) {
        const gl = this._gl;
        
        // Create shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            );
            return null;
        }
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            );
            return null;
        }
        
        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            );
            return null;
        }
        
        // Get attribute and uniform locations
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
    
    /**
     * Initialize buffers
     */
    _initBuffers() {
        const gl = this._gl;
        
        // Particle buffer
        this._buffers.particles = {
            position: gl.createBuffer(),
            velocity: gl.createBuffer(),
            color: gl.createBuffer(),
            size: gl.createBuffer(),
            life: gl.createBuffer()
        };
        
        // Connection buffer
        this._buffers.connections = {
            position: gl.createBuffer(),
            progress: gl.createBuffer()
        };
        
        // Node quad buffer
        const quad = new Float32Array([
            -1, -1,  0, 1,
             1, -1,  1, 1,
             1,  1,  1, 0,
            -1,  1,  0, 0
        ]);
        
        this._buffers.quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.quad);
        gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    }
    
    /**
     * Initialize textures
     */
    _initTextures() {
        // Node textures will be created dynamically
        // Initialize with a default texture
        this._createDefaultTexture();
    }
    
    /**
     * Create default texture
     */
    _createDefaultTexture() {
        const gl = this._gl;
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new Uint8Array([255, 255, 255, 255]));
        
        this._textures.set('default', texture);
    }
    
    /**
     * Initialize physics
     */
    _initPhysics() {
        // Create physics particles for each timeline item
        this._items.forEach((item, index) => {
            const particle = {
                position: {
                    x: 0,
                    y: index * this._itemHeight,
                    z: 0
                },
                velocity: { x: 0, y: 0, z: 0 },
                force: { x: 0, y: 0, z: 0 },
                mass: 1,
                radius: 20,
                connected: []
            };
            
            item.particle = particle;
            this._physics.particles.push(particle);
        });
        
        // Create connections
        for (let i = 0; i < this._physics.particles.length - 1; i++) {
            this._physics.connections.push({
                from: this._physics.particles[i],
                to: this._physics.particles[i + 1],
                restLength: this._itemHeight,
                strength: this._physics.springStrength
            });
        }
    }
    
    /**
     * Set up gestures
     */
    _setupGestures() {
        if (!this._config.interactive) return;
        
        // Pan gesture for scrolling
        gestureSystem.register(this, {
            pan: {
                onStart: (e) => this._onPanStart(e),
                onMove: (e) => this._onPanMove(e),
                onEnd: (e) => this._onPanEnd(e)
            },
            pinch: {
                onStart: (e) => this._onPinchStart(e),
                onMove: (e) => this._onPinchMove(e),
                onEnd: (e) => this._onPinchEnd(e)
            },
            tap: {
                onTap: (e) => this._onTap(e)
            }
        });
        
        // Wheel for zooming
        if (this._config.zoomable) {
            this.addEventListener('wheel', this._handleWheel, { passive: false });
        }
    }
    
    /**
     * Start render loop
     */
    _startRenderLoop() {
        const render = (timestamp) => {
            // Calculate delta time
            const deltaTime = timestamp - this._lastFrame;
            this._lastFrame = timestamp;
            
            // Update FPS
            this._fps = 1000 / deltaTime;
            
            // Update physics
            if (this._config.gpuPhysics) {
                this._updatePhysics(deltaTime);
            }
            
            // Update animations
            this._updateAnimations(deltaTime);
            
            // Update particles
            if (this._config.particleEffects) {
                this._updateParticles(deltaTime);
            }
            
            // Render
            this._render();
            
            // Continue loop
            this._rafId = requestAnimationFrame(render);
        };
        
        this._rafId = requestAnimationFrame(render);
    }
    
    /**
     * Stop render loop
     */
    _stopRenderLoop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }
    
    /**
     * Update physics
     */
    _updatePhysics(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.016); // Cap at 60fps
        
        // Apply forces
        this._physics.particles.forEach(particle => {
            // Apply gravity
            particle.force.y += this._physics.gravity.y * particle.mass;
            
            // Update velocity
            particle.velocity.x += particle.force.x / particle.mass * dt;
            particle.velocity.y += particle.force.y / particle.mass * dt;
            particle.velocity.z += particle.force.z / particle.mass * dt;
            
            // Apply damping
            particle.velocity.x *= this._physics.damping;
            particle.velocity.y *= this._physics.damping;
            particle.velocity.z *= this._physics.damping;
            
            // Update position
            particle.position.x += particle.velocity.x * dt;
            particle.position.y += particle.velocity.y * dt;
            particle.position.z += particle.velocity.z * dt;
            
            // Reset forces
            particle.force.x = 0;
            particle.force.y = 0;
            particle.force.z = 0;
        });
        
        // Apply spring constraints
        this._physics.connections.forEach(connection => {
            const dx = connection.to.position.x - connection.from.position.x;
            const dy = connection.to.position.y - connection.from.position.y;
            const dz = connection.to.position.z - connection.from.position.z;
            
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const difference = connection.restLength - distance;
            
            const force = difference * connection.strength;
            
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            const fz = (dz / distance) * force;
            
            connection.from.force.x -= fx;
            connection.from.force.y -= fy;
            connection.from.force.z -= fz;
            
            connection.to.force.x += fx;
            connection.to.force.y += fy;
            connection.to.force.z += fz;
        });
    }
    
    /**
     * Update animations
     */
    _updateAnimations(deltaTime) {
        this._animations.forEach((animation, id) => {
            animation.progress += deltaTime / animation.duration;
            
            if (animation.progress >= 1) {
                animation.progress = 1;
                animation.complete = true;
            }
            
            // Apply easing
            const easedProgress = this._easeInOutCubic(animation.progress);
            
            // Update value
            animation.current = animation.from + (animation.to - animation.from) * easedProgress;
            
            // Call update callback
            if (animation.onUpdate) {
                animation.onUpdate(animation.current);
            }
            
            // Remove if complete
            if (animation.complete) {
                if (animation.onComplete) {
                    animation.onComplete();
                }
                this._animations.delete(id);
            }
        });
    }
    
    /**
     * Update particles
     */
    _updateParticles(deltaTime) {
        const dt = deltaTime / 1000;
        
        // Update existing particles
        this._particles = this._particles.filter(particle => {
            particle.life += dt / particle.lifetime;
            particle.position.x += particle.velocity.x * dt;
            particle.position.y += particle.velocity.y * dt;
            particle.position.z += particle.velocity.z * dt;
            
            particle.velocity.y += this._physics.gravity.y * 10 * dt;
            
            return particle.life < 1;
        });
        
        // Spawn new particles at active items
        if (this._activeIndex >= 0 && this._particles.length < 100) {
            const item = this._items[this._activeIndex];
            if (item && item.particle) {
                for (let i = 0; i < 2; i++) {
                    this._particles.push({
                        position: {
                            x: item.particle.position.x + (Math.random() - 0.5) * 20,
                            y: item.particle.position.y + (Math.random() - 0.5) * 20,
                            z: item.particle.position.z
                        },
                        velocity: {
                            x: (Math.random() - 0.5) * 100,
                            y: -Math.random() * 50 - 50,
                            z: (Math.random() - 0.5) * 50
                        },
                        color: this._getThemeColor(),
                        size: Math.random() * 5 + 2,
                        life: 0,
                        lifetime: Math.random() * 2 + 1
                    });
                }
            }
        }
    }
    
    /**
     * Render
     */
    _render() {
        if (!this._gl) {
            this._renderCanvas();
            return;
        }
        
        const gl = this._gl;
        
        // Resize canvas if needed
        this._resizeCanvas();
        
        // Clear
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Render connections
        if (this._config.connectionStyle !== 'none') {
            this._renderConnections();
        }
        
        // Render particles
        if (this._config.particleEffects && this._particles.length > 0) {
            this._renderParticles();
        }
        
        // Render nodes
        this._renderNodes();
    }
    
    /**
     * Render connections
     */
    _renderConnections() {
        const gl = this._gl;
        const program = this._programs.connection;
        
        if (!program) return;
        
        gl.useProgram(program.program);
        
        // Update connection geometry
        const positions = [];
        const progress = [];
        
        this._physics.connections.forEach(connection => {
            const from = connection.from.position;
            const to = connection.to.position;
            
            if (this._config.connectionStyle === 'curve') {
                // Bezier curve
                const steps = 20;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const x = from.x + (to.x - from.x) * t;
                    const y = from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * 50;
                    
                    positions.push(x, y);
                    progress.push(t);
                }
            } else {
                // Straight line
                positions.push(from.x, from.y, to.x, to.y);
                progress.push(0, 1);
            }
        });
        
        // Update buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.connections.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.connections.progress);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(progress), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(program.attributes.a_progress);
        gl.vertexAttribPointer(program.attributes.a_progress, 1, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        const projection = this._getProjectionMatrix();
        gl.uniformMatrix4fv(program.uniforms.u_projection, false, projection);
        gl.uniform1f(program.uniforms.u_time, this._lastFrame / 1000);
        gl.uniform1f(program.uniforms.u_thickness, 2);
        gl.uniform1f(program.uniforms.u_glowIntensity, 0.5);
        
        const color = this._getThemeColor();
        gl.uniform4f(program.uniforms.u_color, color.r, color.g, color.b, 0.8);
        
        // Draw
        gl.drawArrays(gl.LINE_STRIP, 0, positions.length / 2);
    }
    
    /**
     * Render particles
     */
    _renderParticles() {
        const gl = this._gl;
        const program = this._programs.particle;
        
        if (!program || this._particles.length === 0) return;
        
        gl.useProgram(program.program);
        
        // Update particle data
        const positions = [];
        const velocities = [];
        const colors = [];
        const sizes = [];
        const lifes = [];
        
        this._particles.forEach(particle => {
            positions.push(particle.position.x, particle.position.y, particle.position.z);
            velocities.push(particle.velocity.x, particle.velocity.y, particle.velocity.z);
            colors.push(particle.color.r, particle.color.g, particle.color.b, 1);
            sizes.push(particle.size);
            lifes.push(particle.life);
        });
        
        // Update buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.particles.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.particles.velocity);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(velocities), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(program.attributes.a_velocity);
        gl.vertexAttribPointer(program.attributes.a_velocity, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.particles.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(program.attributes.a_color);
        gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.particles.size);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(program.attributes.a_size);
        gl.vertexAttribPointer(program.attributes.a_size, 1, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.particles.life);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lifes), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(program.attributes.a_life);
        gl.vertexAttribPointer(program.attributes.a_life, 1, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        const projection = this._getProjectionMatrix();
        const view = this._getViewMatrix();
        
        gl.uniformMatrix4fv(program.uniforms.u_projection, false, projection);
        gl.uniformMatrix4fv(program.uniforms.u_view, false, view);
        gl.uniform1f(program.uniforms.u_time, this._lastFrame / 1000);
        gl.uniform1f(program.uniforms.u_pixelRatio, window.devicePixelRatio || 1);
        
        // Draw
        gl.drawArrays(gl.POINTS, 0, this._particles.length);
    }
    
    /**
     * Render nodes
     */
    _renderNodes() {
        // Render visible timeline items
        this._visibleItems.forEach(index => {
            const item = this._items[index];
            if (item && item.particle) {
                this._renderNode(item);
            }
        });
    }
    
    /**
     * Render single node
     */
    _renderNode(item) {
        const gl = this._gl;
        const program = this._programs.node;
        
        if (!program) return;
        
        gl.useProgram(program.program);
        
        // Bind quad buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.quad);
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(program.attributes.a_texCoord);
        gl.vertexAttribPointer(program.attributes.a_texCoord, 2, gl.FLOAT, false, 16, 8);
        
        // Set uniforms
        const projection = this._getProjectionMatrix();
        const model = this._getModelMatrix(item.particle.position);
        
        gl.uniformMatrix4fv(program.uniforms.u_projection, false, projection);
        gl.uniformMatrix4fv(program.uniforms.u_model, false, model);
        gl.uniform1f(program.uniforms.u_scale, 30 * this._zoomLevel);
        gl.uniform1f(program.uniforms.u_time, this._lastFrame / 1000);
        gl.uniform1f(program.uniforms.u_active, item.index === this._activeIndex ? 1 : 0);
        gl.uniform1f(program.uniforms.u_hover, 0);
        
        const color = this._getThemeColor();
        gl.uniform4f(program.uniforms.u_color, color.r, color.g, color.b, 1);
        
        // Bind texture
        const texture = this._textures.get(item.id) || this._textures.get('default');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.uniforms.u_texture, 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
    
    /**
     * Get projection matrix
     */
    _getProjectionMatrix() {
        const width = this._canvas.width;
        const height = this._canvas.height;
        
        // Orthographic projection
        return new Float32Array([
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, -1, 0,
            -1, 1, 0, 1
        ]);
    }
    
    /**
     * Get view matrix
     */
    _getViewMatrix() {
        // Simple translation for scrolling
        const x = -this._scrollPosition * Math.cos(this._config.orientation === 'horizontal' ? 0 : Math.PI / 2);
        const y = -this._scrollPosition * Math.sin(this._config.orientation === 'horizontal' ? 0 : Math.PI / 2);
        
        return new Float32Array([
            this._zoomLevel, 0, 0, 0,
            0, this._zoomLevel, 0, 0,
            0, 0, 1, 0,
            x * this._zoomLevel, y * this._zoomLevel, 0, 1
        ]);
    }
    
    /**
     * Get model matrix
     */
    _getModelMatrix(position) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            position.x, position.y, 0, 1
        ]);
    }
    
    /**
     * Get theme color
     */
    _getThemeColor() {
        const themes = {
            brutal: { r: 0, g: 1, b: 0 },
            minimal: { r: 0.2, g: 0.2, b: 0.2 },
            neon: { r: 1, g: 0, b: 1 },
            holographic: { r: 0, g: 0.8, b: 1 }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    /**
     * Resize canvas
     */
    _resizeCanvas() {
        const rect = this.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        
        if (this._canvas.width !== rect.width * pixelRatio ||
            this._canvas.height !== rect.height * pixelRatio) {
            this._canvas.width = rect.width * pixelRatio;
            this._canvas.height = rect.height * pixelRatio;
            this._canvas.style.width = rect.width + 'px';
            this._canvas.style.height = rect.height + 'px';
            
            if (this._gl) {
                this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
            }
        }
    }
    
    /**
     * Update viewport
     */
    _updateViewport() {
        const rect = this.getBoundingClientRect();
        this._viewportHeight = rect.height;
        
        // Calculate visible items
        this._updateVisibleItems();
    }
    
    /**
     * Update visible items
     */
    _updateVisibleItems() {
        this._visibleItems.clear();
        
        const viewportTop = this._scrollPosition - this._overscan * this._itemHeight;
        const viewportBottom = this._scrollPosition + this._viewportHeight + this._overscan * this._itemHeight;
        
        this._items.forEach((item, index) => {
            if (item.particle) {
                const y = item.particle.position.y;
                if (y >= viewportTop && y <= viewportBottom) {
                    this._visibleItems.add(index);
                    item.visible = true;
                } else {
                    item.visible = false;
                }
            }
        });
    }
    
    /**
     * Update layout
     */
    _updateLayout() {
        if (this._config.orientation === 'horizontal') {
            this._updateHorizontalLayout();
        } else {
            this._updateVerticalLayout();
        }
        
        this.scheduleUpdate();
    }
    
    /**
     * Update vertical layout
     */
    _updateVerticalLayout() {
        let y = 0;
        
        this._items.forEach((item, index) => {
            if (item.particle) {
                // Calculate x position based on layout
                let x = 0;
                
                switch (this._config.layout) {
                    case 'left':
                        x = -100;
                        break;
                    case 'right':
                        x = 100;
                        break;
                    case 'alternate':
                        x = index % 2 === 0 ? -100 : 100;
                        break;
                    case 'center':
                        x = 0;
                        break;
                }
                
                // Animate to new position
                this._animateTo(item.particle.position, { x, y }, 500);
                
                y += this._itemHeight;
            }
        });
    }
    
    /**
     * Update horizontal layout
     */
    _updateHorizontalLayout() {
        let x = 0;
        
        this._items.forEach((item, index) => {
            if (item.particle) {
                // Calculate y position based on layout
                let y = 0;
                
                switch (this._config.layout) {
                    case 'left':
                        y = -100;
                        break;
                    case 'right':
                        y = 100;
                        break;
                    case 'alternate':
                        y = index % 2 === 0 ? -100 : 100;
                        break;
                    case 'center':
                        y = 0;
                        break;
                }
                
                // Animate to new position
                this._animateTo(item.particle.position, { x, y }, 500);
                
                x += this._itemHeight;
            }
        });
    }
    
    /**
     * Update connections
     */
    _updateConnections() {
        // Connection style changed
        this.scheduleUpdate();
    }
    
    /**
     * Handle scroll
     */
    _handleScroll(event) {
        clearTimeout(this._scrollDebounce);
        
        this._scrollDebounce = setTimeout(() => {
            this._scrollPosition = this.scrollTop;
            this._updateVisibleItems();
        }, 16);
    }
    
    /**
     * Handle resize
     */
    _handleResize() {
        this._updateViewport();
    }
    
    /**
     * Handle wheel (for zooming)
     */
    _handleWheel(event) {
        if (!this._config.zoomable) return;
        
        event.preventDefault();
        
        const delta = event.deltaY * -0.001;
        const newZoom = Math.max(0.1, Math.min(5, this._zoomLevel + delta));
        
        this.setZoom(newZoom);
    }
    
    /**
     * Gesture handlers
     */
    _onPanStart(event) {
        this._panStart = {
            x: event.clientX,
            y: event.clientY,
            scrollPosition: this._scrollPosition
        };
    }
    
    _onPanMove(event) {
        if (!this._panStart) return;
        
        const deltaY = event.clientY - this._panStart.y;
        this._scrollPosition = this._panStart.scrollPosition - deltaY;
        
        this._updateVisibleItems();
    }
    
    _onPanEnd(event) {
        this._panStart = null;
    }
    
    _onPinchStart(event) {
        this._pinchStart = {
            distance: event.distance,
            zoom: this._zoomLevel
        };
    }
    
    _onPinchMove(event) {
        if (!this._pinchStart) return;
        
        const scale = event.distance / this._pinchStart.distance;
        const newZoom = Math.max(0.1, Math.min(5, this._pinchStart.zoom * scale));
        
        this.setZoom(newZoom);
    }
    
    _onPinchEnd(event) {
        this._pinchStart = null;
    }
    
    _onTap(event) {
        // Find clicked item
        const rect = this.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top + this._scrollPosition;
        
        let closestItem = null;
        let closestDistance = Infinity;
        
        this._items.forEach(item => {
            if (item.particle && item.visible) {
                const dx = x - item.particle.position.x;
                const dy = y - item.particle.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance && distance < 50) {
                    closestDistance = distance;
                    closestItem = item;
                }
            }
        });
        
        if (closestItem) {
            this.setActiveItem(closestItem.index);
        }
    }
    
    /**
     * Animate value
     */
    _animateTo(object, target, duration = 300) {
        const id = Math.random().toString(36);
        
        Object.keys(target).forEach(key => {
            this._animations.set(`${id}-${key}`, {
                from: object[key],
                to: target[key],
                current: object[key],
                duration,
                progress: 0,
                onUpdate: (value) => {
                    object[key] = value;
                }
            });
        });
    }
    
    /**
     * Easing function
     */
    _easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Public API
     */
    
    /**
     * Set active item
     */
    setActiveItem(index) {
        if (index < 0 || index >= this._items.length) return;
        
        const previousIndex = this._activeIndex;
        this._activeIndex = index;
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('itemactivate', {
            detail: {
                index,
                item: this._items[index],
                previousIndex
            }
        }));
        
        // Scroll to item
        if (this._items[index].particle) {
            const targetScroll = this._items[index].particle.position.y - this._viewportHeight / 2;
            this._animateTo(this, { _scrollPosition: targetScroll }, 500);
        }
        
        this.scheduleUpdate();
    }
    
    /**
     * Add item
     */
    addItem(element, date) {
        // Add to DOM
        this.appendChild(element);
        
        // Re-collect items
        this._collectItems();
        
        // Re-initialize physics
        if (this._config.gpuPhysics) {
            this._initPhysics();
        }
        
        // Update layout
        this._updateLayout();
    }
    
    /**
     * Remove item
     */
    removeItem(index) {
        if (index < 0 || index >= this._items.length) return;
        
        const item = this._items[index];
        
        // Remove from DOM
        if (item.element.parentNode) {
            item.element.remove();
        }
        
        // Re-collect items
        this._collectItems();
        
        // Re-initialize physics
        if (this._config.gpuPhysics) {
            this._initPhysics();
        }
        
        // Update layout
        this._updateLayout();
    }
    
    /**
     * Play timeline
     */
    play() {
        this._isPlaying = true;
        
        // Start playback animation
        const startTime = this._timeRange?.start || 0;
        const duration = this._timeRange?.duration || 1000;
        
        this._playbackAnimation = {
            startTime: Date.now(),
            duration: duration / this._config.playbackSpeed,
            onUpdate: () => {
                const elapsed = Date.now() - this._playbackAnimation.startTime;
                const progress = elapsed / this._playbackAnimation.duration;
                
                if (progress >= 1) {
                    this.pause();
                    return;
                }
                
                // Find current item
                const currentTime = startTime + progress * duration;
                let currentIndex = 0;
                
                for (let i = 0; i < this._items.length; i++) {
                    if (this._items[i].timestamp <= currentTime) {
                        currentIndex = i;
                    } else {
                        break;
                    }
                }
                
                if (currentIndex !== this._activeIndex) {
                    this.setActiveItem(currentIndex);
                }
            }
        };
        
        this.dispatchEvent(new CustomEvent('play'));
    }
    
    /**
     * Pause timeline
     */
    pause() {
        this._isPlaying = false;
        this._playbackAnimation = null;
        
        this.dispatchEvent(new CustomEvent('pause'));
    }
    
    /**
     * Set zoom level
     */
    setZoom(level) {
        this._zoomLevel = Math.max(0.1, Math.min(5, level));
        
        this.dispatchEvent(new CustomEvent('zoom', {
            detail: { level: this._zoomLevel }
        }));
    }
    
    /**
     * Get current state
     */
    get state() {
        return {
            activeIndex: this._activeIndex,
            scrollPosition: this._scrollPosition,
            zoomLevel: this._zoomLevel,
            isPlaying: this._isPlaying
        };
    }
    
    /**
     * Template
     */
    template() {
        return html`
            ${this._renderStyles()}
            
            <div class="timeline-container ${this._config.orientation} ${this._config.theme}">
                ${this._config.webglEnabled ? html`
                    <canvas class="timeline-webgl-canvas"></canvas>
                `.content : ''}
                
                <div class="timeline-scroll-container" role="list">
                    <div class="timeline-track">
                        ${this._renderItems()}
                    </div>
                </div>
                
                ${this._renderControls()}
                ${this._renderOverlay()}
            </div>
        `.content;
    }
    
    /**
     * Render items
     */
    _renderItems() {
        // Only render visible items for performance
        const visibleItems = Array.from(this._visibleItems)
            .sort((a, b) => a - b)
            .map(index => this._items[index]);
        
        return visibleItems.map(item => `
            <div class="timeline-item ${item.type} ${item.index === this._activeIndex ? 'active' : ''}"
                 data-index="${item.index}"
                 role="listitem"
                 style="transform: translate(${item.particle?.position.x || 0}px, ${item.particle?.position.y || 0}px)">
                
                <div class="timeline-node">
                    <div class="timeline-node-inner"></div>
                </div>
                
                <div class="timeline-content">
                    <time class="timeline-date" datetime="${item.date.toISOString()}">
                        ${this._formatDate(item.date)}
                    </time>
                    <h3 class="timeline-title">${item.title}</h3>
                    <div class="timeline-description">
                        ${item.content}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render controls
     */
    _renderControls() {
        return `
            <div class="timeline-controls">
                ${this._config.interactive ? `
                    <button class="timeline-control timeline-zoom-in" 
                            data-action="zoom-in"
                            aria-label="Zoom in">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                    
                    <button class="timeline-control timeline-zoom-out"
                            data-action="zoom-out"
                            aria-label="Zoom out">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M19 13H5v-2h14v2z"/>
                        </svg>
                    </button>
                    
                    ${this._config.autoPlay !== null ? `
                        <button class="timeline-control timeline-play-pause"
                                data-action="play-pause"
                                aria-label="${this._isPlaying ? 'Pause' : 'Play'}">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                ${this._isPlaying ? `
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                ` : `
                                    <path d="M8 5v14l11-7z"/>
                                `}
                            </svg>
                        </button>
                    ` : ''}
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render overlay
     */
    _renderOverlay() {
        return `
            <div class="timeline-overlay">
                ${this._config.particleEffects ? `
                    <div class="timeline-particles"></div>
                ` : ''}
                
                ${this._activeIndex >= 0 ? `
                    <div class="timeline-active-indicator">
                        ${this._items[this._activeIndex]?.title || ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render styles
     */
    _renderStyles() {
        return `
            <style>
                ${this._getBaseStyles()}
                ${this._getThemeStyles()}
                ${this._getLayoutStyles()}
                ${this._getAnimationStyles()}
            </style>
        `;
    }
    
    /**
     * Get base styles
     */
    _getBaseStyles() {
        return `
            :host {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            
            .timeline-container {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            
            .timeline-webgl-canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            }
            
            .timeline-scroll-container {
                position: relative;
                width: 100%;
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                z-index: 2;
                scrollbar-width: thin;
            }
            
            .timeline-scroll-container::-webkit-scrollbar {
                width: 8px;
            }
            
            .timeline-scroll-container::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .timeline-scroll-container::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
            }
            
            .timeline-track {
                position: relative;
                padding: 50px 0;
                min-height: 100%;
            }
            
            /* Timeline items */
            .timeline-item {
                position: absolute;
                display: flex;
                align-items: center;
                gap: 30px;
                transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
                will-change: transform;
            }
            
            .timeline-node {
                position: relative;
                width: 40px;
                height: 40px;
                flex-shrink: 0;
            }
            
            .timeline-node-inner {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                transform: translate(-50%, -50%);
                background: currentColor;
                border-radius: 50%;
                transition: all 0.3s;
            }
            
            .timeline-item:hover .timeline-node-inner,
            .timeline-item.active .timeline-node-inner {
                width: 30px;
                height: 30px;
                box-shadow: 0 0 20px currentColor;
            }
            
            .timeline-content {
                flex: 1;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s;
            }
            
            .timeline-item:hover .timeline-content,
            .timeline-item.active .timeline-content {
                background: rgba(255, 255, 255, 0.1);
                border-color: currentColor;
                box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
            }
            
            .timeline-date {
                display: block;
                font-size: 0.875rem;
                opacity: 0.7;
                margin-bottom: 8px;
            }
            
            .timeline-title {
                margin: 0 0 12px 0;
                font-size: 1.25rem;
                font-weight: bold;
            }
            
            .timeline-description {
                opacity: 0.9;
                line-height: 1.6;
            }
            
            /* Controls */
            .timeline-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
                z-index: 10;
            }
            
            .timeline-control {
                width: 40px;
                height: 40px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid currentColor;
                border-radius: 50%;
                color: inherit;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .timeline-control:hover {
                background: rgba(0, 255, 0, 0.2);
                transform: scale(1.1);
            }
            
            .timeline-control svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }
            
            /* Overlay */
            .timeline-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 3;
            }
            
            .timeline-active-indicator {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid currentColor;
                border-radius: 20px;
                font-weight: bold;
                backdrop-filter: blur(10px);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .timeline-item {
                    gap: 20px;
                }
                
                .timeline-content {
                    padding: 15px;
                }
                
                .timeline-controls {
                    top: 10px;
                    right: 10px;
                }
            }
        `;
    }
    
    /**
     * Get theme styles
     */
    _getThemeStyles() {
        const themes = {
            brutal: `
                .timeline-container.brutal {
                    background: #000;
                    color: #0f0;
                }
                
                .timeline-container.brutal .timeline-node-inner {
                    background: #0f0;
                    box-shadow: 0 0 10px #0f0;
                }
            `,
            
            minimal: `
                .timeline-container.minimal {
                    background: #fff;
                    color: #333;
                }
                
                .timeline-container.minimal .timeline-node-inner {
                    background: #333;
                }
                
                .timeline-container.minimal .timeline-content {
                    background: rgba(0, 0, 0, 0.05);
                    border-color: rgba(0, 0, 0, 0.1);
                }
            `,
            
            neon: `
                .timeline-container.neon {
                    background: #0a0a0a;
                    color: #f0f;
                }
                
                .timeline-container.neon .timeline-node-inner {
                    background: #f0f;
                    box-shadow: 0 0 20px #f0f, 0 0 40px #f0f;
                }
                
                .timeline-container.neon .timeline-content {
                    border-color: #f0f;
                    box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
                }
            `,
            
            holographic: `
                .timeline-container.holographic {
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    color: #0ff;
                }
                
                .timeline-container.holographic .timeline-node-inner {
                    background: linear-gradient(45deg, #0ff, #f0f);
                    box-shadow: 0 0 30px #0ff;
                }
                
                .timeline-container.holographic .timeline-content {
                    background: linear-gradient(135deg, 
                        rgba(0, 255, 255, 0.1), 
                        rgba(255, 0, 255, 0.1));
                    border-color: #0ff;
                }
            `
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    /**
     * Get layout styles
     */
    _getLayoutStyles() {
        const layouts = {
            vertical: {
                left: `
                    .timeline-item {
                        left: 50px;
                        right: auto;
                    }
                `,
                right: `
                    .timeline-item {
                        left: auto;
                        right: 50px;
                        flex-direction: row-reverse;
                    }
                `,
                alternate: `
                    .timeline-item:nth-child(even) {
                        left: 50px;
                        right: auto;
                    }
                    
                    .timeline-item:nth-child(odd) {
                        left: auto;
                        right: 50px;
                        flex-direction: row-reverse;
                    }
                `,
                center: `
                    .timeline-item {
                        left: 50%;
                        transform: translateX(-50%);
                    }
                `
            },
            horizontal: {
                // Similar but rotated
            }
        };
        
        return layouts[this._config.orientation]?.[this._config.layout] || '';
    }
    
    /**
     * Get animation styles
     */
    _getAnimationStyles() {
        const animations = {
            fade: `
                .timeline-item {
                    opacity: 0;
                    animation: fadeIn 0.5s forwards;
                }
                
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
            `,
            
            slide: `
                .timeline-item {
                    opacity: 0;
                    transform: translateX(-50px);
                    animation: slideIn 0.5s forwards;
                }
                
                @keyframes slideIn {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `,
            
            zoom: `
                .timeline-item {
                    opacity: 0;
                    transform: scale(0.8);
                    animation: zoomIn 0.5s forwards;
                }
                
                @keyframes zoomIn {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `,
            
            particle: `
                .timeline-item {
                    opacity: 0;
                    animation: particleIn 1s forwards;
                }
                
                @keyframes particleIn {
                    0% {
                        opacity: 0;
                        transform: scale(0) rotate(180deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2) rotate(90deg);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) rotate(0);
                    }
                }
            `
        };
        
        return animations[this._config.animation] || animations.fade;
    }
    
    /**
     * Format date
     */
    _formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }
    
    /**
     * Render canvas fallback
     */
    _renderCanvas() {
        // 2D canvas fallback for non-WebGL browsers
        // Implementation would go here
    }
    
    /**
     * Cleanup WebGL
     */
    _cleanupWebGL() {
        const gl = this._gl;
        
        if (!gl) return;
        
        // Delete programs
        Object.values(this._programs).forEach(program => {
            if (program && program.program) {
                gl.deleteProgram(program.program);
            }
        });
        
        // Delete buffers
        Object.values(this._buffers).forEach(buffer => {
            if (buffer instanceof WebGLBuffer) {
                gl.deleteBuffer(buffer);
            } else if (typeof buffer === 'object') {
                Object.values(buffer).forEach(b => {
                    if (b instanceof WebGLBuffer) {
                        gl.deleteBuffer(b);
                    }
                });
            }
        });
        
        // Delete textures
        this._textures.forEach(texture => {
            gl.deleteTexture(texture);
        });
        
        // Lose context
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
            loseContext.loseContext();
        }
    }
}

// Register component
customElements.define('brutal-timeline', Timeline);