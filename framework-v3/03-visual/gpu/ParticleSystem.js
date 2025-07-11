/**
 * @fileoverview BRUTAL GPU Particle System - Millions of particles at 60fps
 * @version 1.0.0
 * @license MIT
 */

import { GPUDetector } from './GPUDetector.js';

/**
 * High-performance GPU particle system
 */
export class ParticleSystem {
    constructor(config = {}) {
        this.config = {
            maxParticles: 1000000,
            particleSize: 1.0,
            gravity: 9.81,
            windForce: { x: 0, y: 0, z: 0 },
            attractorPos: { x: 0, y: 0, z: 0 },
            attractorStrength: 0,
            damping: 0.1,
            noiseScale: 0.1,
            noiseStrength: 1.0,
            turbulence: 1.0,
            bounds: { x: 100, y: 100, z: 100 },
            blendMode: 'additive',
            ...config
        };

        this.detector = null;
        this.context = null;
        this.particleCount = 0;
        this.particles = null;
        this.spawners = [];
        
        // GPU resources
        this.device = null;
        this.computePipeline = null;
        this.renderPipeline = null;
        this.particleBuffer = null;
        this.uniformBuffer = null;
        this.bindGroups = null;
        
        // WebGL resources
        this.gl = null;
        this.programs = {};
        this.buffers = {};
        this.textures = {};
        this.vaos = {};
        
        // State
        this.isInitialized = false;
        this.lastTime = 0;
        this.frameCount = 0;
        this.stats = {
            fps: 0,
            particlesRendered: 0,
            gpuTime: 0
        };
    }

    /**
     * Initialize particle system
     */
    async init(canvas) {
        // Detect GPU capabilities
        this.detector = new GPUDetector();
        const capabilities = await this.detector.init();
        
        // Create context
        this.context = this.detector.createContext(canvas);
        
        // Initialize based on backend
        switch (capabilities.backend) {
            case 'webgpu':
                await this.initWebGPU(canvas);
                break;
            case 'webgl2':
                await this.initWebGL2(canvas);
                break;
            case 'webgl':
                await this.initWebGL1(canvas);
                break;
            default:
                throw new Error(`Unsupported backend: ${capabilities.backend}`);
        }
        
        // Get recommended particle count based on performance
        const settings = this.detector.getRecommendedSettings();
        this.particleCount = Math.min(this.config.maxParticles, settings.particleCount);
        
        // Initialize particles
        this.initParticles();
        
        this.isInitialized = true;
    }

    /**
     * Initialize WebGPU
     */
    async initWebGPU(canvas) {
        this.device = this.detector.device;
        const format = this.context.format;
        
        // Load shaders
        const computeShaderModule = this.device.createShaderModule({
            code: await this.loadShader('webgpu/particle-compute.wgsl')
        });
        
        const renderShaderModule = this.device.createShaderModule({
            code: await this.loadShader('webgpu/particle-render.wgsl')
        });
        
        // Create compute pipeline
        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeShaderModule,
                entryPoint: 'main'
            }
        });
        
        // Create render pipeline
        this.renderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: renderShaderModule,
                entryPoint: 'vs_main'
            },
            fragment: {
                module: renderShaderModule,
                entryPoint: this.config.blendMode === 'additive' ? 'fs_main_additive' : 'fs_main',
                targets: [{
                    format,
                    blend: this.getBlendState()
                }]
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32'
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: false,
                depthCompare: 'less'
            }
        });
        
        // Create buffers
        const particleSize = 64; // bytes per particle
        this.particleBuffer = this.device.createBuffer({
            size: this.particleCount * particleSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        
        this.uniformBuffer = this.device.createBuffer({
            size: 256, // Aligned to 256 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Create depth texture
        this.depthTexture = this.device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
    }

    /**
     * Initialize WebGL2
     */
    async initWebGL2(canvas) {
        this.gl = this.context.context;
        const gl = this.gl;
        
        // Enable required extensions
        const ext = {
            vao: true, // Native in WebGL2
            instancing: true, // Native in WebGL2
            transformFeedback: true // Native in WebGL2
        };
        
        // Load shaders
        const updateVS = await this.loadShader('webgl2/particle-update.glsl');
        const renderVS = await this.loadShader('webgl2/particle-vertex.glsl');
        const renderFS = await this.loadShader('webgl2/particle-fragment.glsl');
        
        // Create update program with transform feedback
        this.programs.update = this.createProgram(gl, updateVS, null, [
            'v_position', 'v_velocity', 'v_color', 'v_data'
        ]);
        
        // Create render program
        this.programs.render = this.createProgram(gl, renderVS, renderFS);
        
        // Create particle buffers (double buffered for transform feedback)
        const particleSize = 48; // 3 + 3 + 4 + 2 floats
        const particleData = new Float32Array(this.particleCount * particleSize / 4);
        
        this.buffers.particles = [
            this.createBuffer(gl, particleData, gl.DYNAMIC_DRAW),
            this.createBuffer(gl, particleData, gl.DYNAMIC_DRAW)
        ];
        
        // Create quad buffer for instanced rendering
        const quadVertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        this.buffers.quad = this.createBuffer(gl, quadVertices, gl.STATIC_DRAW);
        
        // Create VAOs
        this.createParticleVAOs();
        
        // Create spawner texture
        this.textures.spawners = gl.createTexture();
        
        // Setup blend mode
        this.setupBlendMode();
    }

    /**
     * Create particle VAOs for WebGL2
     */
    createParticleVAOs() {
        const gl = this.gl;
        
        // Update VAOs
        this.vaos.update = [];
        for (let i = 0; i < 2; i++) {
            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            
            // Bind particle buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particles[i]);
            
            // Position
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 48, 0);
            
            // Velocity
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 48, 12);
            
            // Color
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 48, 24);
            
            // Data (life, size)
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 48, 40);
            
            this.vaos.update.push(vao);
        }
        
        // Render VAO
        this.vaos.render = gl.createVertexArray();
        gl.bindVertexArray(this.vaos.render);
        
        // Quad vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        
        // Instance attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particles[0]);
        
        // Position (instanced)
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 48, 0);
        gl.vertexAttribDivisor(1, 1);
        
        // Velocity (instanced)
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 48, 12);
        gl.vertexAttribDivisor(2, 1);
        
        // Color (instanced)
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 48, 24);
        gl.vertexAttribDivisor(3, 1);
        
        // Data (instanced)
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 48, 40);
        gl.vertexAttribDivisor(4, 1);
        
        gl.bindVertexArray(null);
    }

    /**
     * Initialize particles
     */
    initParticles() {
        const particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            particles.push({
                position: {
                    x: (Math.random() - 0.5) * this.config.bounds.x * 2,
                    y: (Math.random() - 0.5) * this.config.bounds.y * 2,
                    z: (Math.random() - 0.5) * this.config.bounds.z * 2
                },
                velocity: {
                    x: (Math.random() - 0.5) * 10,
                    y: Math.random() * 10,
                    z: (Math.random() - 0.5) * 10
                },
                color: {
                    r: Math.random(),
                    g: Math.random(),
                    b: Math.random(),
                    a: 1.0
                },
                life: Math.random(),
                size: Math.random() * 0.5 + 0.5
            });
        }
        
        this.particles = particles;
        this.uploadParticles();
    }

    /**
     * Upload particles to GPU
     */
    uploadParticles() {
        if (this.detector.backend === 'webgpu') {
            this.uploadParticlesWebGPU();
        } else {
            this.uploadParticlesWebGL();
        }
    }

    /**
     * Upload particles for WebGPU
     */
    uploadParticlesWebGPU() {
        const data = new Float32Array(this.particleCount * 16);
        
        for (let i = 0; i < this.particleCount; i++) {
            const p = this.particles[i];
            const offset = i * 16;
            
            // Position
            data[offset + 0] = p.position.x;
            data[offset + 1] = p.position.y;
            data[offset + 2] = p.position.z;
            data[offset + 3] = 0; // padding
            
            // Velocity
            data[offset + 4] = p.velocity.x;
            data[offset + 5] = p.velocity.y;
            data[offset + 6] = p.velocity.z;
            data[offset + 7] = 0; // padding
            
            // Color
            data[offset + 8] = p.color.r;
            data[offset + 9] = p.color.g;
            data[offset + 10] = p.color.b;
            data[offset + 11] = p.color.a;
            
            // Life and size
            data[offset + 12] = p.life;
            data[offset + 13] = p.size;
            data[offset + 14] = 0; // padding
            data[offset + 15] = 0; // padding
        }
        
        this.device.queue.writeBuffer(this.particleBuffer, 0, data);
    }

    /**
     * Upload particles for WebGL
     */
    uploadParticlesWebGL() {
        const gl = this.gl;
        const data = new Float32Array(this.particleCount * 12);
        
        for (let i = 0; i < this.particleCount; i++) {
            const p = this.particles[i];
            const offset = i * 12;
            
            // Position
            data[offset + 0] = p.position.x;
            data[offset + 1] = p.position.y;
            data[offset + 2] = p.position.z;
            
            // Velocity
            data[offset + 3] = p.velocity.x;
            data[offset + 4] = p.velocity.y;
            data[offset + 5] = p.velocity.z;
            
            // Color
            data[offset + 6] = p.color.r;
            data[offset + 7] = p.color.g;
            data[offset + 8] = p.color.b;
            data[offset + 9] = p.color.a;
            
            // Data
            data[offset + 10] = p.life;
            data[offset + 11] = p.size;
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particles[0]);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    }

    /**
     * Add spawner
     */
    addSpawner(position, rate = 100) {
        this.spawners.push({
            position,
            rate,
            accumulated: 0
        });
        
        this.updateSpawners();
    }

    /**
     * Update spawners
     */
    updateSpawners() {
        if (this.detector.backend === 'webgpu') {
            // TODO: Update spawner buffer for WebGPU
        } else {
            // Update spawner texture for WebGL
            const gl = this.gl;
            const data = new Float32Array(this.spawners.length * 4);
            
            for (let i = 0; i < this.spawners.length; i++) {
                const s = this.spawners[i];
                data[i * 4 + 0] = s.position.x;
                data[i * 4 + 1] = s.position.y;
                data[i * 4 + 2] = s.position.z;
                data[i * 4 + 3] = s.rate;
            }
            
            gl.bindTexture(gl.TEXTURE_2D, this.textures.spawners);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.spawners.length, 1, 0, 
                         gl.RGBA, gl.FLOAT, data);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
    }

    /**
     * Update particles
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        this.frameCount++;
        const currentTime = performance.now();
        
        if (this.detector.backend === 'webgpu') {
            this.updateWebGPU(deltaTime);
        } else {
            this.updateWebGL(deltaTime);
        }
        
        // Update stats
        if (currentTime - this.lastTime > 1000) {
            this.stats.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    /**
     * Update WebGPU
     */
    updateWebGPU(deltaTime) {
        // Update uniforms
        const uniformData = new Float32Array([
            deltaTime,
            performance.now() / 1000,
            this.particleCount,
            this.config.gravity,
            this.config.windForce.x,
            this.config.windForce.y,
            this.config.windForce.z,
            0, // padding
            this.config.attractorPos.x,
            this.config.attractorPos.y,
            this.config.attractorPos.z,
            this.config.attractorStrength,
            this.config.damping,
            this.config.noiseScale,
            this.config.noiseStrength,
            this.config.turbulence,
            this.config.bounds.x,
            this.config.bounds.y,
            this.config.bounds.z,
            0 // padding
        ]);
        
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
        
        // Create bind groups if needed
        if (!this.bindGroups) {
            this.bindGroups = {
                compute: this.device.createBindGroup({
                    layout: this.computePipeline.getBindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: { buffer: this.particleBuffer } },
                        { binding: 1, resource: { buffer: this.uniformBuffer } }
                    ]
                })
            };
        }
        
        // Run compute pass
        const commandEncoder = this.device.createCommandEncoder();
        const computePass = commandEncoder.beginComputePass();
        
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.bindGroups.compute);
        computePass.dispatchWorkgroups(Math.ceil(this.particleCount / 256));
        computePass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
    }

    /**
     * Update WebGL
     */
    updateWebGL(deltaTime) {
        const gl = this.gl;
        const program = this.programs.update;
        
        gl.useProgram(program);
        
        // Set uniforms
        gl.uniform1f(gl.getUniformLocation(program, 'u_deltaTime'), deltaTime);
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() / 1000);
        gl.uniform1f(gl.getUniformLocation(program, 'u_gravity'), this.config.gravity);
        gl.uniform3f(gl.getUniformLocation(program, 'u_windForce'), 
                     this.config.windForce.x, this.config.windForce.y, this.config.windForce.z);
        gl.uniform3f(gl.getUniformLocation(program, 'u_attractorPos'),
                     this.config.attractorPos.x, this.config.attractorPos.y, this.config.attractorPos.z);
        gl.uniform1f(gl.getUniformLocation(program, 'u_attractorStrength'), this.config.attractorStrength);
        gl.uniform1f(gl.getUniformLocation(program, 'u_damping'), this.config.damping);
        gl.uniform1f(gl.getUniformLocation(program, 'u_noiseScale'), this.config.noiseScale);
        gl.uniform1f(gl.getUniformLocation(program, 'u_noiseStrength'), this.config.noiseStrength);
        gl.uniform1f(gl.getUniformLocation(program, 'u_turbulence'), this.config.turbulence);
        gl.uniform3f(gl.getUniformLocation(program, 'u_bounds'),
                     this.config.bounds.x, this.config.bounds.y, this.config.bounds.z);
        
        // Bind spawner texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.spawners);
        gl.uniform1i(gl.getUniformLocation(program, 'u_spawnerTexture'), 0);
        gl.uniform1i(gl.getUniformLocation(program, 'u_spawnerCount'), this.spawners.length);
        
        // Setup transform feedback
        const sourceIndex = this.frameCount % 2;
        const targetIndex = 1 - sourceIndex;
        
        gl.bindVertexArray(this.vaos.update[sourceIndex]);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.buffers.particles[targetIndex]);
        
        // Disable rasterization
        gl.enable(gl.RASTERIZER_DISCARD);
        
        // Run update
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.particleCount);
        gl.endTransformFeedback();
        
        // Re-enable rasterization
        gl.disable(gl.RASTERIZER_DISCARD);
        
        // Unbind
        gl.bindVertexArray(null);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    }

    /**
     * Render particles
     */
    render(viewProjection, view) {
        if (!this.isInitialized) return;
        
        if (this.detector.backend === 'webgpu') {
            this.renderWebGPU(viewProjection, view);
        } else {
            this.renderWebGL(viewProjection, view);
        }
        
        this.stats.particlesRendered = this.particleCount;
    }

    /**
     * Render WebGPU
     */
    renderWebGPU(viewProjection, view) {
        // Update view/projection uniforms
        const uniformData = new Float32Array([
            ...viewProjection,
            ...view,
            this.context.context.canvas.width,
            this.context.context.canvas.height,
            performance.now() / 1000,
            this.config.particleSize
        ]);
        
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
        
        // Create render bind group if needed
        if (!this.bindGroups.render) {
            this.bindGroups.render = this.device.createBindGroup({
                layout: this.renderPipeline.getBindGroupLayout(1),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } }
                ]
            });
        }
        
        // Get current texture
        const textureView = this.context.context.getCurrentTexture().createView();
        
        // Create render pass descriptor
        const renderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'load',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        };
        
        // Render particles
        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
        
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroups.compute); // Particle data
        renderPass.setBindGroup(1, this.bindGroups.render); // Uniforms
        renderPass.draw(4, this.particleCount, 0, 0);
        renderPass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
    }

    /**
     * Render WebGL
     */
    renderWebGL(viewProjection, view) {
        const gl = this.gl;
        const program = this.programs.render;
        
        gl.useProgram(program);
        
        // Set uniforms
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_viewProjection'), false, viewProjection);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_view'), false, view);
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), gl.canvas.width, gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() / 1000);
        gl.uniform1f(gl.getUniformLocation(program, 'u_particleScale'), this.config.particleSize);
        gl.uniform1i(gl.getUniformLocation(program, 'u_blendMode'), 
                     this.config.blendMode === 'additive' ? 1 : 0);
        
        // Update render VAO to use current particle buffer
        const bufferIndex = this.frameCount % 2;
        gl.bindVertexArray(this.vaos.render);
        
        // Update instance buffer binding
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particles[bufferIndex]);
        
        // Re-setup instance attributes
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 48, 0);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 48, 12);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 48, 24);
        gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 48, 40);
        
        // Render
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.particleCount);
        
        gl.bindVertexArray(null);
    }

    /**
     * Create shader program
     */
    createProgram(gl, vsSource, fsSource, transformFeedbackVaryings) {
        const vs = this.compileShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = fsSource ? this.compileShader(gl, gl.FRAGMENT_SHADER, fsSource) : null;
        
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        if (fs) gl.attachShader(program, fs);
        
        // Setup transform feedback if specified
        if (transformFeedbackVaryings) {
            gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
        }
        
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            );
            return null;
        }
        
        return program;
    }

    /**
     * Compile shader
     */
    compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            );
            return null;
        }
        
        return shader;
    }

    /**
     * Create buffer
     */
    createBuffer(gl, data, usage) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        return buffer;
    }

    /**
     * Load shader source
     */
    async loadShader(path) {
        try {
            const response = await fetch(`/framework-v3/03-visual/shaders/${path}`);
            if (!response.ok) {
                // Fall back to inline shaders if file not found
                return this.getInlineShader(path);
            }
            return await response.text();
        } catch (error) {
            return this.getInlineShader(path);
        }
    }

    /**
     * Get inline shader source
     */
    getInlineShader(path) {
        const shaders = {
            'webgpu/particle-compute.wgsl': `
                struct Particle {
                    position: vec3<f32>,
                    velocity: vec3<f32>,
                    color: vec4<f32>,
                    life: f32,
                    size: f32,
                    _padding: vec2<f32>,
                }
                
                struct Uniforms {
                    deltaTime: f32,
                    time: f32,
                    particleCount: f32,
                    gravity: f32,
                    windForce: vec3<f32>,
                    attractorPos: vec3<f32>,
                    attractorStrength: f32,
                    damping: f32,
                    noiseScale: f32,
                    noiseStrength: f32,
                    turbulence: f32,
                    bounds: vec3<f32>,
                }
                
                @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
                @group(0) @binding(1) var<uniform> uniforms: Uniforms;
                
                fn noise(p: vec3<f32>) -> f32 {
                    let i = floor(p);
                    let f = fract(p);
                    let u = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(mix(hash(i), hash(i + vec3<f32>(1.0, 0.0, 0.0)), u.x),
                            mix(hash(i + vec3<f32>(0.0, 1.0, 0.0)), hash(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y),
                        mix(mix(hash(i + vec3<f32>(0.0, 0.0, 1.0)), hash(i + vec3<f32>(1.0, 0.0, 1.0)), u.x),
                            mix(hash(i + vec3<f32>(0.0, 1.0, 1.0)), hash(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y),
                        u.z
                    );
                }
                
                fn hash(p: vec3<f32>) -> f32 {
                    let n = dot(p, vec3<f32>(1.0, 57.0, 113.0));
                    return fract(sin(n) * 43758.5453);
                }
                
                fn curlNoise(p: vec3<f32>) -> vec3<f32> {
                    let e = 0.01;
                    let dx = vec3<f32>(e, 0.0, 0.0);
                    let dy = vec3<f32>(0.0, e, 0.0);
                    let dz = vec3<f32>(0.0, 0.0, e);
                    
                    let x = noise(p + dy) - noise(p - dy) - noise(p + dz) + noise(p - dz);
                    let y = noise(p + dz) - noise(p - dz) - noise(p + dx) + noise(p - dx);
                    let z = noise(p + dx) - noise(p - dx) - noise(p + dy) + noise(p - dy);
                    
                    return vec3<f32>(x, y, z) / (2.0 * e);
                }
                
                @compute @workgroup_size(256, 1, 1)
                fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let idx = global_id.x;
                    if (idx >= u32(uniforms.particleCount)) {
                        return;
                    }
                    
                    var particle = particles[idx];
                    
                    if (particle.life <= 0.0) {
                        // Respawn particle
                        particle.position = vec3<f32>(
                            (hash(vec3<f32>(f32(idx), uniforms.time, 0.0)) - 0.5) * uniforms.bounds.x * 2.0,
                            (hash(vec3<f32>(f32(idx), uniforms.time, 1.0)) - 0.5) * uniforms.bounds.y * 2.0,
                            (hash(vec3<f32>(f32(idx), uniforms.time, 2.0)) - 0.5) * uniforms.bounds.z * 2.0
                        );
                        particle.velocity = vec3<f32>(
                            (hash(vec3<f32>(f32(idx), uniforms.time, 3.0)) - 0.5) * 10.0,
                            hash(vec3<f32>(f32(idx), uniforms.time, 4.0)) * 10.0,
                            (hash(vec3<f32>(f32(idx), uniforms.time, 5.0)) - 0.5) * 10.0
                        );
                        particle.life = 1.0;
                        particle.size = hash(vec3<f32>(f32(idx), uniforms.time, 6.0)) * 0.5 + 0.5;
                    } else {
                        // Apply forces
                        var acceleration = vec3<f32>(0.0, -uniforms.gravity, 0.0);
                        acceleration += uniforms.windForce;
                        
                        // Attractor
                        let toAttractor = uniforms.attractorPos - particle.position;
                        let distSq = dot(toAttractor, toAttractor);
                        if (distSq > 0.01) {
                            let dist = sqrt(distSq);
                            acceleration += (toAttractor / dist) * uniforms.attractorStrength / distSq;
                        }
                        
                        // Turbulence
                        let noisePos = particle.position * uniforms.noiseScale + vec3<f32>(0.0, uniforms.time * 0.1, 0.0);
                        let turbulence = curlNoise(noisePos) * uniforms.noiseStrength * uniforms.turbulence;
                        acceleration += turbulence;
                        
                        // Update physics
                        particle.velocity += acceleration * uniforms.deltaTime;
                        particle.velocity *= (1.0 - uniforms.damping * uniforms.deltaTime);
                        particle.position += particle.velocity * uniforms.deltaTime;
                        
                        // Boundaries
                        if (abs(particle.position.x) > uniforms.bounds.x) {
                            particle.position.x = sign(particle.position.x) * uniforms.bounds.x;
                            particle.velocity.x *= -0.8;
                        }
                        if (particle.position.y < -uniforms.bounds.y) {
                            particle.position.y = -uniforms.bounds.y;
                            particle.velocity.y *= -0.8;
                        }
                        if (particle.position.y > uniforms.bounds.y) {
                            particle.position.y = uniforms.bounds.y;
                            particle.velocity.y *= -0.8;
                        }
                        if (abs(particle.position.z) > uniforms.bounds.z) {
                            particle.position.z = sign(particle.position.z) * uniforms.bounds.z;
                            particle.velocity.z *= -0.8;
                        }
                        
                        // Update life
                        particle.life -= uniforms.deltaTime * 0.2;
                        
                        // Update color
                        let speed = length(particle.velocity);
                        particle.color = vec4<f32>(
                            speed * 0.1,
                            0.5 + speed * 0.05,
                            1.0 - speed * 0.1,
                            particle.life
                        );
                    }
                    
                    particles[idx] = particle;
                }
            `,
            'webgpu/particle-render.wgsl': `
                struct Particle {
                    position: vec3<f32>,
                    velocity: vec3<f32>,
                    color: vec4<f32>,
                    life: f32,
                    size: f32,
                    _padding: vec2<f32>,
                }
                
                struct Uniforms {
                    viewProjection: mat4x4<f32>,
                    view: mat4x4<f32>,
                    resolution: vec2<f32>,
                    time: f32,
                    particleScale: f32,
                }
                
                struct VertexOutput {
                    @builtin(position) position: vec4<f32>,
                    @location(0) color: vec4<f32>,
                    @location(1) uv: vec2<f32>,
                    @location(2) size: f32,
                    @location(3) life: f32,
                }
                
                @group(0) @binding(0) var<storage, read> particles: array<Particle>;
                @group(1) @binding(0) var<uniform> uniforms: Uniforms;
                
                @vertex
                fn vs_main(
                    @builtin(vertex_index) vertexIndex: u32,
                    @builtin(instance_index) instanceIndex: u32
                ) -> VertexOutput {
                    var output: VertexOutput;
                    
                    let particle = particles[instanceIndex];
                    
                    if (particle.life <= 0.0) {
                        output.position = vec4<f32>(0.0, 0.0, -100.0, 1.0);
                        return output;
                    }
                    
                    let vertex = vec2<f32>(
                        f32((vertexIndex & 1u) * 2u) - 1.0,
                        f32((vertexIndex >> 1u) * 2u) - 1.0
                    );
                    
                    let worldPos = particle.position;
                    let viewPos = (uniforms.view * vec4<f32>(worldPos, 1.0)).xyz;
                    
                    let size = particle.size * uniforms.particleScale * particle.life;
                    
                    viewPos.x += vertex.x * size;
                    viewPos.y += vertex.y * size;
                    
                    output.position = uniforms.viewProjection * vec4<f32>(worldPos, 1.0);
                    output.position.x += vertex.x * size * output.position.w / uniforms.resolution.x * 2.0;
                    output.position.y += vertex.y * size * output.position.w / uniforms.resolution.y * 2.0;
                    
                    output.color = particle.color;
                    output.uv = vertex * 0.5 + 0.5;
                    output.size = size;
                    output.life = particle.life;
                    
                    return output;
                }
                
                @fragment
                fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
                    let dist = length(input.uv - vec2<f32>(0.5));
                    
                    var alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    let glow = pow(alpha, 2.0) * 2.0;
                    
                    var color = input.color;
                    color.r = min(1.0, color.r + glow * 0.5);
                    color.g = min(1.0, color.g + glow * 0.3);
                    color.b = min(1.0, color.b + glow * 0.8);
                    
                    alpha *= input.life;
                    alpha *= clamp(input.size * 2.0, 0.0, 1.0);
                    
                    return vec4<f32>(color.rgb * alpha, alpha);
                }
                
                @fragment
                fn fs_main_additive(input: VertexOutput) -> @location(0) vec4<f32> {
                    let dist = length(input.uv - vec2<f32>(0.5));
                    
                    var intensity = pow(1.0 - dist * 2.0, 3.0);
                    intensity *= input.life;
                    
                    var color = input.color.rgb;
                    color *= intensity * 2.0;
                    
                    let maxComponent = max(max(color.r, color.g), color.b);
                    if (maxComponent > 1.0) {
                        color /= maxComponent;
                    }
                    
                    return vec4<f32>(color, 1.0);
                }
            `,
            'webgl2/particle-update.glsl': `#version 300 es
                // Inline version of particle update shader
                in vec3 a_position;
                in vec3 a_velocity;
                in vec4 a_color;
                in vec2 a_data;
                
                out vec3 v_position;
                out vec3 v_velocity;
                out vec4 v_color;
                out vec2 v_data;
                
                uniform float u_deltaTime;
                uniform float u_time;
                uniform float u_gravity;
                uniform vec3 u_windForce;
                uniform vec3 u_attractorPos;
                uniform float u_attractorStrength;
                uniform float u_damping;
                uniform float u_noiseScale;
                uniform float u_noiseStrength;
                uniform float u_turbulence;
                uniform vec3 u_bounds;
                uniform sampler2D u_spawnerTexture;
                uniform int u_spawnerCount;
                
                float random(vec2 seed) {
                    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                float noise(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    float n = i.x + i.y * 57.0 + 125.0 * i.z;
                    return mix(
                        mix(
                            mix(random(vec2(n, n)), random(vec2(n + 1.0, n)), f.x),
                            mix(random(vec2(n + 57.0, n)), random(vec2(n + 58.0, n)), f.x),
                            f.y
                        ),
                        mix(
                            mix(random(vec2(n + 125.0, n)), random(vec2(n + 126.0, n)), f.x),
                            mix(random(vec2(n + 182.0, n)), random(vec2(n + 183.0, n)), f.x),
                            f.y
                        ),
                        f.z
                    );
                }
                
                vec3 curlNoise(vec3 p) {
                    float epsilon = 0.01;
                    vec3 dx = vec3(epsilon, 0.0, 0.0);
                    vec3 dy = vec3(0.0, epsilon, 0.0);
                    vec3 dz = vec3(0.0, 0.0, epsilon);
                    float x = noise(p + dy) - noise(p - dy) - noise(p + dz) + noise(p - dz);
                    float y = noise(p + dz) - noise(p - dz) - noise(p + dx) + noise(p - dx);
                    float z = noise(p + dx) - noise(p - dx) - noise(p + dy) + noise(p - dy);
                    return vec3(x, y, z) / (2.0 * epsilon);
                }
                
                void main() {
                    vec3 position = a_position;
                    vec3 velocity = a_velocity;
                    vec4 color = a_color;
                    float life = a_data.x;
                    float size = a_data.y;
                    
                    if (life <= 0.0) {
                        float randomVal = random(vec2(gl_VertexID, u_time));
                        int spawnerIndex = int(randomVal * float(u_spawnerCount));
                        vec2 texCoord = vec2((float(spawnerIndex) + 0.5) / float(u_spawnerCount), 0.5);
                        vec4 spawnerData = texture(u_spawnerTexture, texCoord);
                        
                        position = spawnerData.xyz + (vec3(
                            random(vec2(gl_VertexID * 2, u_time)),
                            random(vec2(gl_VertexID * 3, u_time)),
                            random(vec2(gl_VertexID * 4, u_time))
                        ) - 0.5) * 2.0;
                        
                        velocity = vec3(
                            (random(vec2(gl_VertexID * 5, u_time)) - 0.5) * 2.0,
                            random(vec2(gl_VertexID * 6, u_time)) * 2.0,
                            (random(vec2(gl_VertexID * 7, u_time)) - 0.5) * 2.0
                        );
                        
                        life = 1.0;
                        size = random(vec2(gl_VertexID * 8, u_time)) * 0.5 + 0.5;
                    } else {
                        vec3 acceleration = vec3(0.0);
                        acceleration.y -= u_gravity;
                        acceleration += u_windForce;
                        
                        vec3 toAttractor = u_attractorPos - position;
                        float distSq = dot(toAttractor, toAttractor);
                        if (distSq > 0.01) {
                            float dist = sqrt(distSq);
                            acceleration += (toAttractor / dist) * u_attractorStrength / distSq;
                        }
                        
                        vec3 noisePos = position * u_noiseScale + vec3(0.0, u_time * 0.1, 0.0);
                        vec3 turbulence = curlNoise(noisePos) * u_noiseStrength * u_turbulence;
                        acceleration += turbulence;
                        
                        velocity += acceleration * u_deltaTime;
                        velocity *= (1.0 - u_damping * u_deltaTime);
                        position += velocity * u_deltaTime;
                        
                        if (abs(position.x) > u_bounds.x) {
                            position.x = sign(position.x) * u_bounds.x;
                            velocity.x *= -0.8;
                        }
                        if (position.y < -u_bounds.y) {
                            position.y = -u_bounds.y;
                            velocity.y *= -0.8;
                        }
                        if (position.y > u_bounds.y) {
                            position.y = u_bounds.y;
                            velocity.y *= -0.8;
                        }
                        if (abs(position.z) > u_bounds.z) {
                            position.z = sign(position.z) * u_bounds.z;
                            velocity.z *= -0.8;
                        }
                        
                        life -= u_deltaTime * 0.2;
                        
                        float speed = length(velocity);
                        color = vec4(
                            speed * 0.1,
                            0.5 + speed * 0.05,
                            1.0 - speed * 0.1,
                            life
                        );
                    }
                    
                    v_position = position;
                    v_velocity = velocity;
                    v_color = color;
                    v_data = vec2(life, size);
                }
            `,
            'webgl2/particle-vertex.glsl': `#version 300 es
                // Inline version of particle vertex shader
                in vec2 a_position;
                in vec3 a_particlePosition;
                in vec3 a_particleVelocity;
                in vec4 a_particleColor;
                in vec2 a_particleData;
                
                uniform mat4 u_viewProjection;
                uniform mat4 u_view;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform float u_particleScale;
                
                out vec4 v_color;
                out vec2 v_uv;
                out float v_life;
                out float v_size;
                
                void main() {
                    float life = a_particleData.x;
                    if (life <= 0.0) {
                        gl_Position = vec4(0.0, 0.0, -100.0, 1.0);
                        return;
                    }
                    
                    vec3 worldPos = a_particlePosition;
                    vec4 viewPos = u_view * vec4(worldPos, 1.0);
                    
                    float size = a_particleData.y * u_particleScale * life;
                    
                    viewPos.xy += a_position * size;
                    
                    gl_Position = u_viewProjection * vec4(worldPos, 1.0);
                    
                    vec2 screenOffset = a_position * size;
                    gl_Position.xy += screenOffset * gl_Position.w / u_resolution * 2.0;
                    
                    v_color = a_particleColor;
                    v_uv = a_position * 0.5 + 0.5;
                    v_life = life;
                    v_size = size;
                }
            `,
            'webgl2/particle-fragment.glsl': `#version 300 es
                // Inline version of particle fragment shader
                precision highp float;
                
                in vec4 v_color;
                in vec2 v_uv;
                in float v_life;
                in float v_size;
                
                out vec4 fragColor;
                
                uniform float u_time;
                uniform int u_blendMode;
                
                void main() {
                    float dist = length(v_uv - vec2(0.5));
                    
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    float glow = pow(alpha, 2.0) * 2.0;
                    
                    vec3 color = v_color.rgb;
                    color.r = min(1.0, color.r + glow * 0.5);
                    color.g = min(1.0, color.g + glow * 0.3);
                    color.b = min(1.0, color.b + glow * 0.8);
                    
                    alpha *= v_life;
                    alpha *= clamp(v_size * 2.0, 0.0, 1.0);
                    
                    if (u_blendMode == 1) {
                        float intensity = pow(1.0 - dist * 2.0, 3.0) * v_life;
                        color *= intensity * 2.0;
                        
                        float maxComponent = max(max(color.r, color.g), color.b);
                        if (maxComponent > 1.0) {
                            color /= maxComponent;
                        }
                        
                        fragColor = vec4(color, 1.0);
                    } else {
                        fragColor = vec4(color * alpha, alpha);
                    }
                }
            `
        };
        
        const shader = shaders[path];
        if (!shader) {
            return '';
        }
        
        return shader;
    }

    /**
     * Get blend state
     */
    getBlendState() {
        switch (this.config.blendMode) {
            case 'additive':
                return {
                    color: {
                        srcFactor: 'src-alpha',
                        dstFactor: 'one',
                        operation: 'add'
                    },
                    alpha: {
                        srcFactor: 'zero',
                        dstFactor: 'one',
                        operation: 'add'
                    }
                };
            case 'alpha':
                return {
                    color: {
                        srcFactor: 'src-alpha',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add'
                    },
                    alpha: {
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add'
                    }
                };
            default:
                return undefined;
        }
    }

    /**
     * Setup blend mode for WebGL
     */
    setupBlendMode() {
        const gl = this.gl;
        
        gl.enable(gl.BLEND);
        
        switch (this.config.blendMode) {
            case 'additive':
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            case 'alpha':
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                break;
        }
        
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            backend: this.detector.backend,
            particleCount: this.particleCount,
            spawnerCount: this.spawners.length
        };
    }

    /**
     * Set configuration
     */
    setConfig(config) {
        Object.assign(this.config, config);
    }

    /**
     * Destroy particle system
     */
    destroy() {
        if (this.detector) {
            this.detector.destroy();
        }
        
        // Cleanup WebGPU resources
        if (this.device) {
            // Buffers and textures are automatically destroyed with device
        }
        
        // Cleanup WebGL resources
        if (this.gl) {
            const gl = this.gl;
            
            // Delete programs
            Object.values(this.programs).forEach(program => {
                gl.deleteProgram(program);
            });
            
            // Delete buffers
            Object.values(this.buffers).forEach(buffer => {
                if (Array.isArray(buffer)) {
                    buffer.forEach(b => gl.deleteBuffer(b));
                } else {
                    gl.deleteBuffer(buffer);
                }
            });
            
            // Delete textures
            Object.values(this.textures).forEach(texture => {
                gl.deleteTexture(texture);
            });
            
            // Delete VAOs
            Object.values(this.vaos).forEach(vao => {
                if (Array.isArray(vao)) {
                    vao.forEach(v => gl.deleteVertexArray(v));
                } else {
                    gl.deleteVertexArray(vao);
                }
            });
        }
        
        this.isInitialized = false;
        }
}