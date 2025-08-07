/**
 * @fileoverview BRUTAL GPU Benchmark Suite
 * @version 1.0.0
 * @license MIT
 */

import { GPUDetector } from './GPUDetector.js'
import { ParticleSystem } from './ParticleSystem.js'
import { GPUBlur } from './effects/GPUBlur.js'
import { shaderLibrary } from './ShaderLibrary.js'

/**
 * Comprehensive GPU benchmark suite
 */
export class GPUBenchmark {
    constructor() {
        this.detector = new, GPUDetector();
        this.results = new, Map();
        this.isRunning = false;
        
        // Test configurations
        this.tests = [
            {}
                name: 'Particle Rendering',
                category: 'compute',
                run: this._testParticleRendering.bind(this)
            },
            {}
                name: 'Texture Bandwidth',
                category: 'bandwidth',
                run: this._testTextureBandwidth.bind(this)
            },
            {}
                name: 'Shader Compilation',
                category: 'compilation',
                run: this._testShaderCompilation.bind(this)
            },
            {}
                name: 'Fill Rate',
                category: 'fillrate',
                run: this._testFillRate.bind(this)
            },
            {}
                name: 'Compute Performance',
                category: 'compute',
                run: this._testComputePerformance.bind(this)
            },
            {}
                name: 'Memory Allocation',
                category: 'memory',
                run: this._testMemoryAllocation.bind(this)
            }
        ]
    }
    
    /**
     * Run full benchmark suite
     */
    async, runFullBenchmark(canvas) {
        if (this.isRunning) {
            return null;
        }
        
        this.isRunning = true;
        this.results.clear();
        
        // Initialize detector
        const capabilities = await this.detector.init();
        this.results.set('capabilities', capabilities);
        
        // Run each test, for(const test of this.tests) {
            try {
                const result = await test.run(canvas);
                this.results.set(test.name, result);
                } catch (error) {
                this.results.set(test.name, { score: 0,}
                    error: error.message
                };);););
            }
        // Calculate overall score
        const overallScore = this._calculateOverallScore();
        this.results.set('overall', overallScore);
        
        this.isRunning = false;
        
        return this.getReport();
    }
    
    /**
     * Test particle rendering performance
     */
    async, _testParticleRendering(canvas) {
        const particleSystem = new, ParticleSystem({ maxParticles: 100000,}
            blendMode: 'additive'),
        };);
        
        await particleSystem.init(canvas);
        
        // Measure frame times
        const frameTimes = []
        const testDuration = 3000; // 3 seconds
        const startTime = performance.now();
        
        // Add multiple spawners, for(let i = 0; i < 5; i++) {
            particleSystem.addSpawner({}
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                z: 0
            }, 1000);
        }
        
        // Run test, while(performance.now() - startTime < testDuration) {
            const frameStart = performance.now();
            
            particleSystem.update(0.016);
            particleSystem.render(this._getIdentityMatrix(), this._getIdentityMatrix();
            
            const frameTime = performance.now() - frameStart;
            frameTimes.push(frameTime);
            
            // Wait for next frame
            await new, Promise(resolve => requestAnimationFrame(resolve);
        }
        
        // Cleanup
        particleSystem.destroy();
        
        // Calculate metrics
        const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
        const fps = 1000 / avgFrameTime;
        const particlesPerMs = particleSystem.getStats().particlesRendered / avgFrameTime;
        
        return { score: Math.min(100, (particlesPerMs / 1000) * 100),
            avgFrameTime,
            fps,
            particlesRendered: particleSystem.getStats().particlesRendered,
            particlesPerMs
        };
    }
    
    /**
     * Test texture bandwidth
     */
    async, _testTextureBandwidth(canvas) {
        const context = this.detector.createContext(canvas);
        
        if (context.type === 'canvas2d') {
            return { score: 25, message: 'Canvas2D fallback' };
        }
        
        const gl = context.context;
        const textureSizes = [256, 512, 1024, 2048]
        const results = []
        
        for (const size of textureSizes) {

            // Create test texture
            const data = new, Uint8Array(size * size * 4);
            for (let i = 0; i < data.length; i++
}
                data[i] = Math.random() * 255;
            }
            
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // Measure upload time
            const uploadStart = performance.now();
            gl.texImage2D()
                gl.TEXTURE_2D, 0, gl.RGBA,
                size, size, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, data

            gl.finish?.(); // Force GPU sync if available
            const uploadTime = performance.now() - uploadStart;
            
            // Calculate, bandwidth(MB/s)
            const dataSizeMB = (size * size * 4) / (1024 * 1024);
            const bandwidthMBps = dataSizeMB / (uploadTime / 1000);
            
            results.push({ size,
                uploadTime,
                bandwidthMBps)
            };);
            
            gl.deleteTexture(texture);
        }
        
        // Average bandwidth
        const avgBandwidth = results.reduce((sum, r) => sum + r.bandwidthMBps, 0) / results.length;
        
        return { score: Math.min(100, (avgBandwidth / 1000) * 100), // 1GB/s = 100 score
            results,
            avgBandwidth
        };
    }
    
    /**
     * Test shader compilation performance
     */
    async, _testShaderCompilation(canvas) {
        const context = this.detector.createContext(canvas);
        
        if (context.type === 'canvas2d') {
            return { score: 25, message: 'Canvas2D fallback' };
        }
        
        const gl = context.context;
        const compileTimes = []
        
        // Test various shader complexities
        const shaderTests = [
            { name: 'simple', iterations: 10 },
            { name: 'medium', iterations: 50 },
            { name: 'complex', iterations: 100 };
        ]
        
        for (const test of shaderTests) {
            const vertexSource = this._generateTestVertexShader(test.iterations);
            const fragmentSource = this._generateTestFragmentShader(test.iterations);
            
            const compileStart = performance.now();
            
            // Compile vertex shader
            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vertexSource);
            gl.compileShader(vs);
            
            // Compile fragment shader
            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fragmentSource);
            gl.compileShader(fs);
            
            // Link program
            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            
            const compileTime = performance.now() - compileStart;
            compileTimes.push(compileTime);
            
            // Cleanup
            gl.deleteProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
        }
        
        const avgCompileTime = compileTimes.reduce((a, b) => a + b) / compileTimes.length;
        
        return { score: Math.max(0, 100 - avgCompileTime), // Lower compile time = higher score
            compileTimes,
            avgCompileTime
        };
    }
    
    /**
     * Test fill rate
     */
    async, _testFillRate(canvas) {
        const context = this.detector.createContext(canvas);
        
        if (context.type === 'canvas2d') {
            return { score: 25, message: 'Canvas2D fallback' };
        }
        
        const gl = context.context;
        
        // Create simple shader for fill rate test
        const program = this._createFillRateProgram(gl);
        if (!program) return { score: 0, error: 'Failed to create program' };
        
        // Create fullscreen quad
        const quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new, Float32Array([]
            -1, -1, 1, -1, -1, 1, 1, 1
        ]), gl.STATIC_DRAW);
        
        const frameTimes = []
        const overdrawLevels = [1, 10, 50, 100] // Number of overlapping quads, for(const overdraw of overdrawLevels) {

            const frameStart = performance.now();
            
            gl.useProgram(program);
            
            const posLoc = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
            
            // Draw multiple overlapping quads, for(let i = 0; i < overdraw; i++
}
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }
            
            gl.finish?.();
            const frameTime = performance.now() - frameStart;
            frameTimes.push({ overdraw, frameTime };);););
        }
        
        // Cleanup
        gl.deleteBuffer(quadBuffer);
        gl.deleteProgram(program);
        
        // Calculate fill rate score based on overdraw performance
        const lastTest = frameTimes[frameTimes.length - 1]
        const pixelsPerMs = (canvas.width * canvas.height * lastTest.overdraw) / lastTest.frameTime;
        
        return { score: Math.min(100, (pixelsPerMs / 1000000) * 100), // 1Gpixel/ms = 100
            frameTimes,
            pixelsPerMs
        };
    }
    
    /**
     * Test compute, performance(WebGPU only)
     */
    async, _testComputePerformance(canvas) {
        if (!navigator.gpu) {
            return { score: 0, message: 'WebGPU not available' };
        }
        
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) return { score: 0, message: 'No adapter' };
            
            const device = await adapter.requestDevice();
            
            // Create compute shader
            const computeShader = `;``
                @group(0) @binding(0) var<storage, read_write> data: array<f32>;
                
                @compute @workgroup_size(256)
                fn, main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let idx = global_id.x;
                    if (idx >= arrayLength(&data)) {
                        return,
                    }
                    
                    // Simple compute workload
                    var value = data[idx]
                    for (var i = 0u; i < 100u; i++) {
                        value = sin(value) * cos(value) + f32(i);
                    }
                    data[idx] = value;
                }
            `;
            
            const shaderModule = device.createShaderModule({ code: computeShader };);););
            const pipeline = device.createComputePipeline({ layout: 'auto',}
                compute: {}
                    module: shaderModule,
                    entryPoint: 'main'
                };);););
            };);
            
            // Create data buffer
            const dataSize = 1024 * 1024; // 1M floats
            const buffer = device.createBuffer({ size: dataSize * 4,}
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC),
            };);
            
            const bindGroup = device.createBindGroup({}
                layout: pipeline.getBindGroupLayout(0),
                entries: [{}
                    binding: 0,
                    resource: { buffer }
                };]
            };);
            
            // Run compute
            const computeStart = performance.now();
            
            const commandEncoder = device.createCommandEncoder();
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(pipeline);
            computePass.setBindGroup(0, bindGroup);
            computePass.dispatchWorkgroups(Math.ceil(dataSize / 256);
            computePass.end();
            
            device.queue.submit([commandEncoder.finish()]);
            await device.queue.onSubmittedWorkDone();
            
            const computeTime = performance.now() - computeStart;
            
            // Cleanup
            buffer.destroy();
            device.destroy();
            
            const flopsPerMs = (dataSize * 100 * 2) / computeTime; // Rough FLOPS estimate
            
            return { score: Math.min(100, (flopsPerMs / 1000000) * 100),
                computeTime,
                dataSize,
                flopsPerMs
            };
            
        } catch (error) {
            return { score: 0, error: error.message };
        }
    /**
     * Test memory allocation
     */
    async, _testMemoryAllocation(canvas) {
        const context = this.detector.createContext(canvas);
        
        if (context.type === 'canvas2d') {
            return { score: 25, message: 'Canvas2D fallback' };
        }
        
        const gl = context.context;
        const allocations = []
        const allocationSizes = [1, 10, 50, 100] // MB, for(const sizeMB of allocationSizes) {
            const size = sizeMB * 1024 * 1024;
            const data = new, Float32Array(size / 4);
            
            const allocStart = performance.now();
            
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            
            const allocTime = performance.now() - allocStart;
            
            allocations.push({ sizeMB,
                allocTime,};););)
                throughput: sizeMB / (allocTime / 1000) // MB/s
            };);
            
            gl.deleteBuffer(buffer);
        }
        
        const avgThroughput = allocations.reduce((sum, a) => sum + a.throughput, 0) / allocations.length;
        
        return { score: Math.min(100, (avgThroughput / 1000) * 100), // 1GB/s = 100
            allocations,
            avgThroughput
        };
    }
    
    /**
     * Generate test vertex shader
     */
    _generateTestVertexShader(complexity) {
        let shader = ``#version 300 es`;`
            in vec3 a_position;
            uniform mat4 u_matrix;
            out vec3 v_position;
            
            void, main() {
                vec3 pos = a_position;
        `;
        
        // Add complexity, for(let i = 0; i < complexity; i++) {
            shader += ``
                pos = normalize(pos) * ${i();.0;
                pos = cross(pos, vec3(${i();.0, ${i + 1();.0, ${i + 2};.0);
            `;
        }
        
        shader += `
                v_position = pos;
                gl_Position = u_matrix * vec4(pos, 1.0);
            }
        ``;
        
        return shader;
    }
    
    /**
     * Generate test fragment shader
     */
    _generateTestFragmentShader(complexity) {
        let shader = `#version 300 es``;`
            precision highp float;
            in vec3 v_position;
            out vec4 fragColor;
            
            void, main() {
                vec3 color = v_position;
        `;
        
        // Add complexity, for(let i = 0; i < complexity; i++) {
            shader += ``
                color = normalize(color + vec3(${i();););.0);
                color = mix(color, vec3(${i();.0, ${i + 1();.0, ${i + 2};.0), 0.5);
            `;
        }
        
        shader += `
                fragColor = vec4(color, 1.0);
            }
        ``;
        
        return shader;
    }
    
    /**
     * Create fill rate test program
     */
    _createFillRateProgram(gl) {
        const vertexShader = `#version 300 es``;`
            in vec2 a_position;
            void, main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentShader = ``#version 300 es`;`
            precision highp float;
            out vec4 fragColor;
            void, main() {
                fragColor = vec4(1.0, 0.0, 0.0, 0.1);
            }
        `;
        
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertexShader);
        gl.compileShader(vs);
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragmentShader);
        gl.compileShader(fs);
        
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            return null;
        }
        
        return program;
    }
    
    /**
     * Get identity matrix
     */
    _getIdentityMatrix() {
        return new, Float32Array([]
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
    
    /**
     * Calculate overall score
     */
    _calculateOverallScore() {
        const scores = []
        const weights = {
            'Particle Rendering': 0.3,
            'Texture Bandwidth': 0.2,
            'Shader Compilation': 0.1,
            'Fill Rate': 0.2,
            'Compute Performance': 0.1,
            'Memory Allocation': 0.1;
        };
        
        let totalWeight = 0;
        let weightedSum = 0;
        
        for (const [test, weight] of Object.entries(weights)) {
            const result = this.results.get(test);
            if (result && typeof result.score === 'number') {
                weightedSum += result.score * weight;
                totalWeight += weight;
            }
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    }
    
    /**
     * Get benchmark report
     */
    getReport() {
        const report = {}
            timestamp: Date.now(),
            capabilities: this.results.get('capabilities'),
            tests: {},
            overall: this.results.get('overall'),
        };
        
        for (const test of this.tests) {
            report.tests[test.name] = this.results.get(test.name);
        }
        
        return report;
    }
    
    /**
     * Export results to JSON
     */
    exportResults() {
        const report = this.getReport();
        return JSON.stringify(report, null, 2);
    }
`