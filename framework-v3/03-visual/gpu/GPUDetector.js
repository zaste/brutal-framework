/**
 * @fileoverview BRUTAL GPU Detector - Cascade detection WebGPU → WebGL2 → WebGL → Canvas2D
 * @version 1.0.0
 * @license MIT
 */

/**
 * GPUDetector provides cascading GPU detection and capability assessment
 */
export class GPUDetector {
    constructor() {
        this.capabilities = null;
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.backend = null;
        this.isInitialized = false;
    }

    /**
     * Initialize GPU detection
     */
    async init() {
        if (this.isInitialized) return this.capabilities;

        // Try WebGPU first
        if (await this.tryWebGPU()) {
            this.backend = 'webgpu';
        }
        // Fallback to WebGL2
        else if (this.tryWebGL2()) {
            this.backend = 'webgl2';
        }
        // Fallback to WebGL1
        else if (this.tryWebGL1()) {
            this.backend = 'webgl';
        }
        // Final fallback to Canvas2D
        else {
            this.backend = 'canvas2d';
            this.capabilities = this.getCanvas2DCapabilities();
        }

        this.isInitialized = true;
        return this.capabilities;
    }

    /**
     * Try to initialize WebGPU
     */
    async tryWebGPU() {
        if (!('gpu' in navigator)) {
            return false;
        }

        try {
            // Request adapter
            this.adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance'
            });

            if (!this.adapter) {
                return false;
            }

            // Request device
            this.device = await this.adapter.requestDevice({
                requiredFeatures: [],
                requiredLimits: {}
            });

            if (!this.device) {
                return false;
            }

            // Get capabilities
            this.capabilities = await this.getWebGPUCapabilities();
            
            return true;

        } catch (error) {
            return false;
        }
    }

    /**
     * Get WebGPU capabilities
     */
    async getWebGPUCapabilities() {
        const features = [];
        const limits = this.device.limits;
        const adapterInfo = await this.adapter.requestAdapterInfo();

        // Collect supported features
        for (const feature of this.device.features) {
            features.push(feature);
        }

        return {
            backend: 'webgpu',
            vendor: adapterInfo.vendor || 'Unknown',
            architecture: adapterInfo.architecture || 'Unknown',
            device: adapterInfo.device || 'Unknown',
            description: adapterInfo.description || 'Unknown',
            features: features,
            limits: {
                maxTextureDimension1D: limits.maxTextureDimension1D,
                maxTextureDimension2D: limits.maxTextureDimension2D,
                maxTextureDimension3D: limits.maxTextureDimension3D,
                maxTextureArrayLayers: limits.maxTextureArrayLayers,
                maxBindGroups: limits.maxBindGroups,
                maxDynamicUniformBuffersPerPipelineLayout: limits.maxDynamicUniformBuffersPerPipelineLayout,
                maxDynamicStorageBuffersPerPipelineLayout: limits.maxDynamicStorageBuffersPerPipelineLayout,
                maxSampledTexturesPerShaderStage: limits.maxSampledTexturesPerShaderStage,
                maxSamplersPerShaderStage: limits.maxSamplersPerShaderStage,
                maxStorageBuffersPerShaderStage: limits.maxStorageBuffersPerShaderStage,
                maxStorageTexturesPerShaderStage: limits.maxStorageTexturesPerShaderStage,
                maxUniformBuffersPerShaderStage: limits.maxUniformBuffersPerShaderStage,
                maxUniformBufferBindingSize: limits.maxUniformBufferBindingSize,
                maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
                maxVertexBuffers: limits.maxVertexBuffers,
                maxVertexAttributes: limits.maxVertexAttributes,
                maxVertexBufferArrayStride: limits.maxVertexBufferArrayStride,
                maxComputeWorkgroupStorageSize: limits.maxComputeWorkgroupStorageSize,
                maxComputeInvocationsPerWorkgroup: limits.maxComputeInvocationsPerWorkgroup,
                maxComputeWorkgroupSizeX: limits.maxComputeWorkgroupSizeX,
                maxComputeWorkgroupSizeY: limits.maxComputeWorkgroupSizeY,
                maxComputeWorkgroupSizeZ: limits.maxComputeWorkgroupSizeZ,
                maxComputeWorkgroupsPerDimension: limits.maxComputeWorkgroupsPerDimension,
                maxBufferSize: limits.maxBufferSize
            },
            performance: {
                computeShaders: true,
                timestamp: 'timestamp-query' in features,
                indirectDraw: true,
                multiDrawIndirect: 'multi-draw-indirect' in features,
                pushConstants: 'push-constants' in features,
                shaderFloat16: 'shader-float16' in features
            }
        };
    }

    /**
     * Try to initialize WebGL2
     */
    tryWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            this.context = canvas.getContext('webgl2', {
                alpha: false,
                antialias: false,
                depth: true,
                stencil: false,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: false,
                premultipliedAlpha: true,
                failIfMajorPerformanceCaveat: false
            });

            if (!this.context) {
                return false;
            }

            this.capabilities = this.getWebGL2Capabilities();
            return true;

        } catch (error) {
            return false;
        }
    }

    /**
     * Get WebGL2 capabilities
     */
    getWebGL2Capabilities() {
        const gl = this.context;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        
        // Get all extensions
        const availableExtensions = gl.getSupportedExtensions() || [];
        const extensions = {};
        availableExtensions.forEach(ext => {
            extensions[ext] = true;
        });

        // Important extensions for performance
        const importantExtensions = [
            'EXT_color_buffer_float',
            'EXT_color_buffer_half_float',
            'EXT_disjoint_timer_query_webgl2',
            'EXT_texture_filter_anisotropic',
            'OES_texture_float_linear',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_compressed_texture_etc',
            'WEBGL_compressed_texture_astc',
            'WEBGL_lose_context',
            'WEBGL_debug_renderer_info',
            'WEBGL_multi_draw'
        ];

        const supportedImportantExtensions = {};
        importantExtensions.forEach(ext => {
            supportedImportantExtensions[ext] = extensions[ext] || false;
        });

        return {
            backend: 'webgl2',
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            extensions: supportedImportantExtensions,
            limits: {
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
                maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
                maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
                maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
                maxVertexUniformComponents: gl.getParameter(gl.MAX_VERTEX_UNIFORM_COMPONENTS),
                maxFragmentUniformComponents: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS),
                maxUniformBufferBindings: gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS),
                maxUniformBlockSize: gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE),
                maxTransformFeedbackSeparateComponents: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS),
                maxTransformFeedbackInterleavedComponents: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS),
                max3DTextureSize: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE),
                maxArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
                maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
                maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
                maxElementsIndices: gl.getParameter(gl.MAX_ELEMENTS_INDICES),
                maxElementsVertices: gl.getParameter(gl.MAX_ELEMENTS_VERTICES),
                maxSamples: gl.getParameter(gl.MAX_SAMPLES)
            },
            performance: {
                computeShaders: false, // Not available in WebGL2
                vertexArrayObjects: true,
                instancedArrays: true,
                multipleRenderTargets: true,
                floatTextures: extensions['EXT_color_buffer_float'] || false,
                halfFloatTextures: extensions['EXT_color_buffer_half_float'] || false,
                textureFilterAnisotropic: extensions['EXT_texture_filter_anisotropic'] || false,
                timerQueries: extensions['EXT_disjoint_timer_query_webgl2'] || false,
                multiDraw: extensions['WEBGL_multi_draw'] || false
            }
        };
    }

    /**
     * Try to initialize WebGL1
     */
    tryWebGL1() {
        try {
            const canvas = document.createElement('canvas');
            this.context = canvas.getContext('webgl', {
                alpha: false,
                antialias: false,
                depth: true,
                stencil: false,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: false,
                premultipliedAlpha: true,
                failIfMajorPerformanceCaveat: false
            });

            if (!this.context) {
                return false;
            }

            this.capabilities = this.getWebGL1Capabilities();
            return true;

        } catch (error) {
            return false;
        }
    }

    /**
     * Get WebGL1 capabilities
     */
    getWebGL1Capabilities() {
        const gl = this.context;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

        return {
            backend: 'webgl',
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            limits: {
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
                maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
                maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
                maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS)
            },
            performance: {
                computeShaders: false,
                vertexArrayObjects: !!gl.getExtension('OES_vertex_array_object'),
                instancedArrays: !!gl.getExtension('ANGLE_instanced_arrays'),
                multipleRenderTargets: !!gl.getExtension('WEBGL_draw_buffers'),
                floatTextures: !!gl.getExtension('OES_texture_float'),
                halfFloatTextures: !!gl.getExtension('OES_texture_half_float'),
                textureFilterAnisotropic: !!gl.getExtension('EXT_texture_filter_anisotropic')
            }
        };
    }

    /**
     * Get Canvas2D capabilities
     */
    getCanvas2DCapabilities() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        return {
            backend: 'canvas2d',
            vendor: 'Canvas2D',
            renderer: 'Software',
            version: '2D Context',
            limits: {
                maxCanvasSize: 32767, // Browser dependent
                maxImageSize: 32767
            },
            performance: {
                computeShaders: false,
                offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
                imageBitmap: typeof createImageBitmap !== 'undefined',
                path2D: typeof Path2D !== 'undefined',
                filter: 'filter' in ctx
            }
        };
    }

    /**
     * Create appropriate context for canvas
     */
    createContext(canvas, options = {}) {
        switch (this.backend) {
            case 'webgpu':
                return this.createWebGPUContext(canvas, options);
            case 'webgl2':
                return this.createWebGL2Context(canvas, options);
            case 'webgl':
                return this.createWebGL1Context(canvas, options);
            default:
                return this.createCanvas2DContext(canvas, options);
        }
    }

    /**
     * Create WebGPU context
     */
    createWebGPUContext(canvas, options = {}) {
        const context = canvas.getContext('webgpu');
        
        if (!context) {
            throw new Error('WebGPU context creation failed');
        }

        const format = navigator.gpu.getPreferredCanvasFormat();
        
        context.configure({
            device: this.device,
            format: format,
            usage: options.usage || GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: options.alphaMode || 'premultiplied'
        });

        return {
            type: 'webgpu',
            context,
            device: this.device,
            format
        };
    }

    /**
     * Create WebGL2 context
     */
    createWebGL2Context(canvas, options = {}) {
        const contextAttributes = {
            alpha: options.alpha !== undefined ? options.alpha : false,
            antialias: options.antialias !== undefined ? options.antialias : false,
            depth: options.depth !== undefined ? options.depth : true,
            stencil: options.stencil !== undefined ? options.stencil : false,
            powerPreference: options.powerPreference || 'high-performance',
            preserveDrawingBuffer: options.preserveDrawingBuffer || false,
            premultipliedAlpha: options.premultipliedAlpha !== undefined ? options.premultipliedAlpha : true,
            failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat || false
        };

        const gl = canvas.getContext('webgl2', contextAttributes);
        
        if (!gl) {
            throw new Error('WebGL2 context creation failed');
        }

        return {
            type: 'webgl2',
            context: gl,
            extensions: this.loadWebGL2Extensions(gl)
        };
    }

    /**
     * Create WebGL1 context
     */
    createWebGL1Context(canvas, options = {}) {
        const contextAttributes = {
            alpha: options.alpha !== undefined ? options.alpha : false,
            antialias: options.antialias !== undefined ? options.antialias : false,
            depth: options.depth !== undefined ? options.depth : true,
            stencil: options.stencil !== undefined ? options.stencil : false,
            powerPreference: options.powerPreference || 'high-performance',
            preserveDrawingBuffer: options.preserveDrawingBuffer || false,
            premultipliedAlpha: options.premultipliedAlpha !== undefined ? options.premultipliedAlpha : true,
            failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat || false
        };

        const gl = canvas.getContext('webgl', contextAttributes) || 
                   canvas.getContext('experimental-webgl', contextAttributes);
        
        if (!gl) {
            throw new Error('WebGL1 context creation failed');
        }

        return {
            type: 'webgl',
            context: gl,
            extensions: this.loadWebGL1Extensions(gl)
        };
    }

    /**
     * Create Canvas2D context
     */
    createCanvas2DContext(canvas, options = {}) {
        const contextAttributes = {
            alpha: options.alpha !== undefined ? options.alpha : true,
            colorSpace: options.colorSpace || 'srgb',
            desynchronized: options.desynchronized || false,
            willReadFrequently: options.willReadFrequently || false
        };

        const ctx = canvas.getContext('2d', contextAttributes);
        
        if (!ctx) {
            throw new Error('Canvas2D context creation failed');
        }

        return {
            type: 'canvas2d',
            context: ctx
        };
    }

    /**
     * Load WebGL2 extensions
     */
    loadWebGL2Extensions(gl) {
        const extensions = {};
        
        const extensionList = [
            'EXT_color_buffer_float',
            'EXT_disjoint_timer_query_webgl2',
            'EXT_texture_filter_anisotropic',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_compressed_texture_etc',
            'WEBGL_compressed_texture_astc',
            'WEBGL_multi_draw'
        ];

        extensionList.forEach(name => {
            const ext = gl.getExtension(name);
            if (ext) {
                extensions[name] = ext;
            }
        });

        return extensions;
    }

    /**
     * Load WebGL1 extensions
     */
    loadWebGL1Extensions(gl) {
        const extensions = {};
        
        const extensionList = [
            'OES_vertex_array_object',
            'ANGLE_instanced_arrays',
            'WEBGL_draw_buffers',
            'OES_texture_float',
            'OES_texture_half_float',
            'EXT_texture_filter_anisotropic',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_lose_context'
        ];

        extensionList.forEach(name => {
            const ext = gl.getExtension(name);
            if (ext) {
                extensions[name] = ext;
            }
        });

        return extensions;
    }

    /**
     * Get performance score (0-100)
     */
    getPerformanceScore() {
        if (!this.capabilities) return 0;

        let score = 0;
        
        // Backend scoring
        switch (this.backend) {
            case 'webgpu':
                score += 40;
                break;
            case 'webgl2':
                score += 30;
                break;
            case 'webgl':
                score += 20;
                break;
            case 'canvas2d':
                score += 10;
                break;
        }

        // Feature scoring for WebGPU
        if (this.backend === 'webgpu') {
            if (this.capabilities.performance.computeShaders) score += 10;
            if (this.capabilities.performance.timestamp) score += 5;
            if (this.capabilities.performance.multiDrawIndirect) score += 5;
            if (this.capabilities.limits.maxBufferSize > 1024 * 1024 * 1024) score += 10; // 1GB+
            if (this.capabilities.limits.maxComputeWorkgroupsPerDimension > 65535) score += 5;
        }

        // Feature scoring for WebGL2
        if (this.backend === 'webgl2') {
            if (this.capabilities.performance.floatTextures) score += 10;
            if (this.capabilities.performance.multipleRenderTargets) score += 10;
            if (this.capabilities.performance.textureFilterAnisotropic) score += 5;
            if (this.capabilities.performance.timerQueries) score += 5;
            if (this.capabilities.limits.maxTextureSize >= 16384) score += 10;
        }

        // Feature scoring for WebGL1
        if (this.backend === 'webgl') {
            if (this.capabilities.performance.vertexArrayObjects) score += 10;
            if (this.capabilities.performance.instancedArrays) score += 10;
            if (this.capabilities.performance.floatTextures) score += 10;
        }

        return Math.min(100, score);
    }

    /**
     * Check if a specific feature is supported
     */
    isFeatureSupported(feature) {
        if (!this.capabilities) return false;

        switch (feature) {
            case 'compute':
                return this.backend === 'webgpu';
            
            case 'instancing':
                return this.backend === 'webgpu' || 
                       (this.backend === 'webgl2') ||
                       (this.backend === 'webgl' && this.capabilities.performance.instancedArrays);
            
            case 'mrt': // Multiple Render Targets
                return this.backend === 'webgpu' || 
                       (this.backend === 'webgl2') ||
                       (this.backend === 'webgl' && this.capabilities.performance.multipleRenderTargets);
            
            case 'float-textures':
                return this.backend === 'webgpu' || 
                       (this.capabilities.performance.floatTextures);
            
            case 'anisotropic-filtering':
                return this.backend === 'webgpu' || 
                       (this.capabilities.performance.textureFilterAnisotropic);
            
            case 'offscreen-canvas':
                return typeof OffscreenCanvas !== 'undefined';
            
            default:
                return false;
        }
    }

    /**
     * Get recommended settings based on capabilities
     */
    getRecommendedSettings() {
        const score = this.getPerformanceScore();
        
        if (score >= 80) {
            // High-end
            return {
                quality: 'ultra',
                particleCount: 1000000,
                textureResolution: 2048,
                shadowMapSize: 2048,
                postProcessing: true,
                antialiasing: true,
                bloom: true,
                motionBlur: true,
                reflections: true
            };
        } else if (score >= 60) {
            // Mid-range
            return {
                quality: 'high',
                particleCount: 100000,
                textureResolution: 1024,
                shadowMapSize: 1024,
                postProcessing: true,
                antialiasing: false,
                bloom: true,
                motionBlur: false,
                reflections: false
            };
        } else if (score >= 40) {
            // Low-mid
            return {
                quality: 'medium',
                particleCount: 10000,
                textureResolution: 512,
                shadowMapSize: 512,
                postProcessing: false,
                antialiasing: false,
                bloom: false,
                motionBlur: false,
                reflections: false
            };
        } else {
            // Low-end
            return {
                quality: 'low',
                particleCount: 1000,
                textureResolution: 256,
                shadowMapSize: 0,
                postProcessing: false,
                antialiasing: false,
                bloom: false,
                motionBlur: false,
                reflections: false
            };
        }
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.device) {
            this.device.destroy();
            this.device = null;
        }

        if (this.context && this.context.canvas) {
            // Clean up WebGL context
            if (this.backend === 'webgl2' || this.backend === 'webgl') {
                const loseContext = this.context.getExtension('WEBGL_lose_context');
                if (loseContext) {
                    loseContext.loseContext();
                }
            }
        }

        this.adapter = null;
        this.context = null;
        this.capabilities = null;
        this.backend = null;
        this.isInitialized = false;

        }
}