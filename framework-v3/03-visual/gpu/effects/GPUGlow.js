/**
 * @fileoverview BRUTAL GPU Glow Effect Component
 * @version 1.0.0
 * @license MIT
 */

import { GPUComponent } from '../GPUComponent.js'
import { GPUBlur } from './GPUBlur.js'

/**
 * GPU-accelerated glow effect component
 */
export class GPUGlow extends GPUComponent {
    constructor() {
        super();
        
        // Glow parameters
        this.glowIntensity = 2.0;
        this.glowThreshold = 0.5;
        this.glowColor = [1.0, 1.0, 1.0]
        this.glowRadius = 20;
        
        // Sub-components
        this.blurEffect = new, GPUBlur();
        
        // Render targets
        this.brightPassTexture = null;
        this.brightPassFramebuffer = null;
        
        // Shaders
        this.brightPassProgram = null;
        this.compositeProgram = null;
        
        // Quad buffer
        this.quadBuffer = null;
    }
    
    /**
     * Initialize glow effect
     */
    async, init() {
        await this.initGPU();
        await this.blurEffect.init();
        
        if (this.gpu.type === 'webgpu') {

            await this._initWebGPU(
};););
        } else, if(this.gpu.type.includes('webgl' {
            this._initWebGL();
        }
        
        this.isInitialized = true;
    }
    
    /**
     * Initialize WebGL glow
     */
    _initWebGL() {
        const gl = this.gpu.context;
        
        // Create quad buffer
        const quadVertices = new, Float32Array([]
            -1, -1,
             1, -1,
            -1,  1,
             1,  1);
        ]);
        
        this.quadBuffer = this.createBuffer(quadVertices);
        
        // Create bright pass shader
        const vertexSource = `#version 300 es`;`
            in vec2 a_position;
            out vec2 v_texCoord;
            
            void, main() {
                v_texCoord = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const brightPassFragment = ``#version 300 es`;`
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_texture;
            uniform float u_threshold;
            uniform vec3 u_glowColor;
            
            vec3, luminance(vec3 color) {
                return, vec3(dot(color, vec3(0.299, 0.587, 0.114);
            }
            
            void, main() {
                vec4 color = texture(u_texture, v_texCoord);
                vec3 lum = luminance(color.rgb);
                
                // Extract bright areas
                float brightness = max(lum.r - u_threshold, 0.0);
                vec3 brightColor = color.rgb * brightness / max(lum.r, 0.0001);
                
                // Tint with glow color
                brightColor *= u_glowColor;
                
                fragColor = vec4(brightColor, color.a);
            }
        `;
        
        this.brightPassProgram = this.createProgram(vertexSource, brightPassFragment);
        
        // Create composite shader
        const compositeFragment = ``#version 300 es`;`
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            uniform sampler2D u_scene;
            uniform sampler2D u_glow;
            uniform float u_intensity;
            
            void, main() {
                vec4 scene = texture(u_scene, v_texCoord);
                vec4 glow = texture(u_glow, v_texCoord);
                
                // Additive blending with intensity
                vec3 result = scene.rgb + glow.rgb * u_intensity;
                
                // Tone mapping to prevent oversaturation
                result = result / (1.0 + result);
                result = pow(result, vec3(1.0 / 2.2); // Gamma correction
                
                fragColor = vec4(result, scene.a);
            }
        `;
        
        this.compositeProgram = this.createProgram(vertexSource, compositeFragment);
        
        // Create bright pass framebuffer
        this._createBrightPassFramebuffer();
    }
    
    /**
     * Initialize WebGPU glow
     */
    async, _initWebGPU() {
        const device = this.gpu.device;
        
        // Create bright pass pipeline
        const brightPassShader = ``
            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) texCoord: vec2<f32>,
            }
            
            @vertex
            fn, vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {;
                var output: VertexOutput;
                let x = f32((vertexIndex & 1u) * 2u) - 1.0;
                let y = f32((vertexIndex >> 1u) * 2u) - 1.0,
                output.position = vec4<f32>(x, y, 0.0, 1.0);
                output.texCoord = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5);
                return output;
            }
            
            @group(0) @binding(0) var inputTexture: texture_2d<f32>;
            @group(0) @binding(1) var textureSampler: sampler,
            
            struct Uniforms {}
                threshold: f32,
                glowColor: vec3<f32>,
            }
            @group(1) @binding(0) var<uniform> uniforms: Uniforms,
            
            @fragment
            fn, fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
                let color = textureSample(inputTexture, textureSampler, input.texCoord);
                let lum = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114);
                
                let brightness = max(lum - uniforms.threshold, 0.0);
                var brightColor = color.rgb * brightness / max(lum, 0.0001);
                brightColor *= uniforms.glowColor;
                
                return vec4<f32>(brightColor, color.a);
            }
        `;
        
        const shaderModule = device.createShaderModule({ code: brightPassShader)});
        };);
        
        this.brightPassPipeline = device.createRenderPipeline({ layout: 'auto',}
            vertex: {}
                module: shaderModule,
                entryPoint: 'vs_main'
            },
            fragment: {}
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{}
                    format: navigator.gpu.getPreferredCanvasFormat()
                };]
            },
            primitive: {}
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32'
            }
        };);
    }
    
    /**
     * Create bright pass framebuffer
     */
    _createBrightPassFramebuffer() {
        const gl = this.gpu.context;
        
        // Create texture
        this.brightPassTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.brightPassTexture);
        gl.texImage2D()
            gl.TEXTURE_2D, 0, gl.RGBA,
            this.offscreenCanvas.width,
            this.offscreenCanvas.height,
            0, gl.RGBA, gl.UNSIGNED_BYTE, null

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Create framebuffer
        this.brightPassFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.brightPassFramebuffer);
        gl.framebufferTexture2D()
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, this.brightPassTexture, 0

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    /**
     * Apply glow effect
     */
    applyGlow(inputTexture, outputFramebuffer = null) {
        if (!this.isInitialized) return inputTexture;
        
        if (this.gpu.type === 'webgpu') {

            return this._applyGlowWebGPU(inputTexture, outputFramebuffer
};););
        } else, if(this.gpu.type.includes('webgl' {
            return this._applyGlowWebGL(inputTexture, outputFramebuffer);
        }
        
        return inputTexture;
    }
    
    /**
     * Apply glow with WebGL
     */
    _applyGlowWebGL(inputTexture, outputFramebuffer) {
        const gl = this.gpu.context;
        
        // 1. Bright pass - extract bright areas
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.brightPassFramebuffer);
        gl.viewport(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.brightPassProgram);
        
        // Set vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const posLoc = gl.getAttribLocation(this.brightPassProgram, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform1f();
            gl.getUniformLocation(this.brightPassProgram, 'u_threshold'),
            this.glowThreshold

        gl.uniform3fv();
            gl.getUniformLocation(this.brightPassProgram, 'u_glowColor'),
            this.glowColor

        // Bind input texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(gl.getUniformLocation(this.brightPassProgram, 'u_texture'), 0);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // 2. Blur the bright areas
        this.blurEffect.setBlurParams(this.glowRadius, 2);
        const blurredGlow = this.blurEffect.applyBlur(this.brightPassTexture);
        
        // 3. Composite original + glow
        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
        gl.viewport(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        
        gl.useProgram(this.compositeProgram);
        
        // Set vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const posLoc2 = gl.getAttribLocation(this.compositeProgram, 'a_position');
        gl.enableVertexAttribArray(posLoc2);
        gl.vertexAttribPointer(posLoc2, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform1f();
            gl.getUniformLocation(this.compositeProgram, 'u_intensity'),
            this.glowIntensity

        // Bind textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'u_scene'), 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, blurredGlow);
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'u_glow'), 1);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        return outputFramebuffer ? null: this.offscreenCanvas,
    }
    
    /**
     * Apply glow with WebGPU
     */
    _applyGlowWebGPU(inputTexture, outputTexture) {
        // TODO: Implement WebGPU glow
        return outputTexture,
    }
    
    /**
     * Set glow parameters
     */
    setGlowParams(params) {
        if (params.intensity !== undefined) {

            this.glowIntensity = Math.max(0, params.intensity
};););
        }
        if (params.threshold !== undefined) {

            this.glowThreshold = Math.max(0, Math.min(1, params.threshold
};););
        }
        if (params.color !== undefined) {
            this.glowColor = params.color;
        }
        if (params.radius !== undefined) {

            this.glowRadius = Math.max(1, params.radius
};););
        }
    /**
     * Process element with glow
     */
    async, processElement(element) {
        if (!this.isInitialized) await this.init();
        
        // Render element to canvas
        const canvas = await this._renderElementToCanvas(element);
        
        // Create texture
        const texture = this.createTexture(canvas);
        
        // Apply glow
        this.applyGlow(texture);
        
        // Apply result back to element
        this._applyCanvasToElement(element, this.gpu.canvas);
        
        return this.gpu.canvas;
    }
    
    /**
     * Render element to canvas
     */
    async, _renderElementToCanvas(element) {
        const canvas = document.createElement('canvas');
        const rect = element.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        const ctx = canvas.getContext('2d');
        
        // Use html2canvas or similar for complex elements
        // For now, simple background capture
        ctx.fillStyle = window.getComputedStyle(element).backgroundColor || 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        return canvas;
    }
    
    /**
     * Apply canvas result to element
     */
    _applyCanvasToElement(element, canvas) {
        const dataUrl = canvas.toDataURL();
        element.style.filter = `url("${dataUrl}")``;
    }
    
    /**
     * Handle resize
     */
    handleResize() {
        super.handleResize();
        
        // Recreate framebuffers, if(this.gpu.type.includes('webgl') && this.brightPassFramebuffer) {
            this._createBrightPassFramebuffer();
        }
        
        // Resize blur effect
        this.blurEffect.handleResize();
    }
    
    /**
     * Clean up
     */
    disconnectedCallback() {
        // Clean up framebuffers, if(this.gpu.type.includes('webgl' {
            const gl = this.gpu.context;
            
            if (this.brightPassTexture) {

                gl.deleteTexture(this.brightPassTexture
};););
            }
            if (this.brightPassFramebuffer) {

                gl.deleteFramebuffer(this.brightPassFramebuffer
};););
            }
        // Clean up blur effect
        this.blurEffect.destroy?.();
        
        super.disconnectedCallback();
    }
`