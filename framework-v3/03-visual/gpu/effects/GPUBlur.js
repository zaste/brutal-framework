/**
 * @fileoverview BRUTAL GPU Blur Effect Component
 * @version 1.0.0
 * @license MIT
 */

import { GPUComponent } from '../GPUComponent.js';
import { shaderLibrary } from '../ShaderLibrary.js';

/**
 * GPU-accelerated blur effect component
 */
export class GPUBlur extends GPUComponent {
    constructor() {
        super();
        
        this.blurRadius = 10;
        this.blurPasses = 2;
        this.blurIntensity = 1.0;
        
        // Framebuffers for ping-pong rendering
        this.pingPongBuffers = null;
        this.currentBuffer = 0;
        
        // Blur programs
        this.blurProgramH = null;
        this.blurProgramV = null;
        
        // Quad geometry
        this.quadBuffer = null;
        
        // Effect state
        this.isProcessing = false;
    }
    
    /**
     * Initialize blur effect
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
     * Initialize WebGPU blur
     */
    async _initWebGPU() {
        const device = this.gpu.device;
        
        // Create blur pipeline
        const blurShader = shaderLibrary.generateShaderCode('blur', {
            radius: this.blurRadius
        });
        
        const shaderModule = device.createShaderModule({
            code: blurShader.source
        });
        
        this.blurPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main'
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat()
                }]
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32'
            }
        });
        
        // Create ping-pong textures
        const textureSize = {
            width: this.offscreenCanvas.width,
            height: this.offscreenCanvas.height
        };
        
        this.pingPongBuffers = [
            this._createWebGPUTexture(device, textureSize),
            this._createWebGPUTexture(device, textureSize)
        ];
    }
    
    /**
     * Initialize WebGL blur
     */
    _initWebGL() {
        const gl = this.gpu.context;
        
        // Create blur programs
        const vertexSource = `#version 300 es
            in vec2 a_position;
            out vec2 v_texCoord;
            
            void main() {
                v_texCoord = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentSource = `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_texture;
            uniform vec2 u_direction;
            uniform float u_radius;
            uniform vec2 u_resolution;
            
            void main() {
                vec4 color = vec4(0.0);
                vec2 texelSize = 1.0 / u_resolution;
                
                // 13-tap Gaussian blur
                float weights[13];
                weights[0] = 0.002216;
                weights[1] = 0.008764;
                weights[2] = 0.026995;
                weights[3] = 0.064759;
                weights[4] = 0.120985;
                weights[5] = 0.176033;
                weights[6] = 0.199471;
                weights[7] = 0.176033;
                weights[8] = 0.120985;
                weights[9] = 0.064759;
                weights[10] = 0.026995;
                weights[11] = 0.008764;
                weights[12] = 0.002216;
                
                for (int i = 0; i < 13; i++) {
                    vec2 offset = float(i - 6) * texelSize * u_direction * u_radius;
                    color += texture(u_texture, v_texCoord + offset) * weights[i];
                }
                
                fragColor = color;
            }
        `;
        
        this.blurProgram = this.createProgram(vertexSource, fragmentSource);
        
        // Create quad buffer
        const quadVertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        this.quadBuffer = this.createBuffer(quadVertices);
        
        // Create ping-pong framebuffers
        this._createPingPongBuffers();
    }
    
    /**
     * Create ping-pong framebuffers
     */
    _createPingPongBuffers() {
        const gl = this.gpu.context;
        
        this.pingPongBuffers = [];
        
        for (let i = 0; i < 2; i++) {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA,
                this.offscreenCanvas.width,
                this.offscreenCanvas.height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            const framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, texture, 0
            );
            
            this.pingPongBuffers.push({ texture, framebuffer });
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    /**
     * Apply blur effect
     */
    applyBlur(inputTexture, outputFramebuffer = null) {
        if (!this.isInitialized) return;
        
        if (this.gpu.type === 'webgpu') {
            return this._applyBlurWebGPU(inputTexture, outputFramebuffer);
        } else if (this.gpu.type.includes('webgl')) {
            return this._applyBlurWebGL(inputTexture, outputFramebuffer);
        }
    }
    
    /**
     * Apply blur with WebGL
     */
    _applyBlurWebGL(inputTexture, outputFramebuffer) {
        const gl = this.gpu.context;
        
        gl.useProgram(this.blurProgram);
        
        // Set quad vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const posLoc = gl.getAttribLocation(this.blurProgram, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform2f(
            gl.getUniformLocation(this.blurProgram, 'u_resolution'),
            this.offscreenCanvas.width,
            this.offscreenCanvas.height
        );
        gl.uniform1f(
            gl.getUniformLocation(this.blurProgram, 'u_radius'),
            this.blurRadius
        );
        
        // Multi-pass blur
        let sourceTexture = inputTexture;
        
        for (let pass = 0; pass < this.blurPasses; pass++) {
            // Horizontal pass
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingPongBuffers[0].framebuffer);
            gl.viewport(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
            gl.uniform1i(gl.getUniformLocation(this.blurProgram, 'u_texture'), 0);
            gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_direction'), 1, 0);
            
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            
            // Vertical pass
            const targetBuffer = pass === this.blurPasses - 1 ? 
                outputFramebuffer : this.pingPongBuffers[1].framebuffer;
            
            gl.bindFramebuffer(gl.FRAMEBUFFER, targetBuffer);
            
            gl.bindTexture(gl.TEXTURE_2D, this.pingPongBuffers[0].texture);
            gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_direction'), 0, 1);
            
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            
            sourceTexture = this.pingPongBuffers[1].texture;
        }
        
        return sourceTexture;
    }
    
    /**
     * Apply blur with WebGPU
     */
    _applyBlurWebGPU(inputTexture, outputTexture) {
        const device = this.gpu.device;
        const commandEncoder = device.createCommandEncoder();
        
        // TODO: Implement WebGPU blur passes
        
        device.queue.submit([commandEncoder.finish()]);
        
        return outputTexture;
    }
    
    /**
     * Create WebGPU texture
     */
    _createWebGPUTexture(device, size) {
        return device.createTexture({
            size,
            format: navigator.gpu.getPreferredCanvasFormat(),
            usage: GPUTextureUsage.RENDER_ATTACHMENT | 
                   GPUTextureUsage.TEXTURE_BINDING
        });
    }
    
    /**
     * Set blur parameters
     */
    setBlurParams(radius, passes = 2, intensity = 1.0) {
        this.blurRadius = Math.max(1, radius);
        this.blurPasses = Math.max(1, passes);
        this.blurIntensity = Math.max(0, intensity);
    }
    
    /**
     * Process canvas with blur
     */
    async processCanvas(canvas) {
        if (!this.isInitialized) await this.init();
        
        // Create texture from canvas
        const texture = this.createTexture(canvas);
        
        // Apply blur
        const blurredTexture = this.applyBlur(texture);
        
        // Render to display
        this._renderToCanvas(blurredTexture);
        
        return this.gpu.canvas;
    }
    
    /**
     * Render texture to canvas
     */
    _renderToCanvas(texture) {
        const gl = this.gpu.context;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.gpu.canvas.width, this.gpu.canvas.height);
        
        // Simple copy shader
        const copyProgram = this.createProgram(
            `#version 300 es
            in vec2 a_position;
            out vec2 v_texCoord;
            void main() {
                v_texCoord = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }`,
            `#version 300 es
            precision highp float;
            in vec2 v_texCoord;
            out vec4 fragColor;
            uniform sampler2D u_texture;
            void main() {
                fragColor = texture(u_texture, v_texCoord);
            }`
        );
        
        gl.useProgram(copyProgram);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const posLoc = gl.getAttribLocation(copyProgram, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(copyProgram, 'u_texture'), 0);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    /**
     * Handle resize
     */
    handleResize() {
        super.handleResize();
        
        // Recreate ping-pong buffers
        if (this.gpu.type.includes('webgl') && this.pingPongBuffers) {
            this._createPingPongBuffers();
        }
    }
    
    /**
     * Clean up
     */
    disconnectedCallback() {
        // Clean up ping-pong buffers
        if (this.gpu.type.includes('webgl') && this.pingPongBuffers) {
            const gl = this.gpu.context;
            
            for (const buffer of this.pingPongBuffers) {
                gl.deleteTexture(buffer.texture);
                gl.deleteFramebuffer(buffer.framebuffer);
            }
        }
        
        super.disconnectedCallback();
    }
}