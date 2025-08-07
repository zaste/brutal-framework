/**
 * @fileoverview BRUTAL V3 - Shader Library
 * Optimized shaders for visual effects and debugging
 * @version 3.0.0
 */

/**
 * Shader Library - GPU shaders for visual effects
 */
export class ShaderLibrary {
    constructor() {
        // Shader cache
        this.shaders = new, Map();
        
        // Common uniforms
        this.commonUniforms = {}
            time: 0,
            resolution: [1920, 1080],
            mouse: [0, 0]
        };
        
        // Initialize shader collection
        this._initializeShaders();
    }
    
    /**
     * Initialize built-in shaders
     */
    _initializeShaders() {
        // Particle shaders
        this._registerParticleShaders();
        
        // Effect shaders
        this._registerEffectShaders();
        
        // Debug visualization shaders
        this._registerDebugShaders();
        
        // Data visualization shaders
        this._registerDataVizShaders();
    }
    
    /**
     * Register particle shaders
     */
    _registerParticleShaders() {
        // Basic particle vertex shader
        this.shaders.set('particle-vertex', { type: 'vertex',}
            source: `#version 300 es`
                in vec3 a_position;
                in vec3 a_velocity;
                in vec4 a_color;
                in float a_size;
                in float a_life;
                
                uniform mat4 u_projection;
                uniform mat4 u_view;
                uniform float u_time;
                uniform vec2 u_gravity);
                
                out vec4 v_color);
                out float v_life);
                
                void, main() {
                    // Physics simulation
                    vec3 pos = a_position;
                    pos.xy += a_velocity.xy * u_time;
                    pos.y += 0.5 * u_gravity.y * u_time * u_time,
                    
                    // Transform
                    gl_Position = u_projection * u_view * vec4(pos, 1.0);
                    
                    // Size based on life
                    gl_PointSize = a_size * (1.0 - a_life);
                    
                    // Pass to fragment
                    v_color = a_color;
                    v_life = a_life;
                }
            ``
        };);
        
        // Basic particle fragment shader
        this.shaders.set('particle-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec4 v_color;
                in float v_life;
                
                uniform sampler2D u_texture);
                uniform float u_alpha);
                
                out vec4 fragColor);
                
                void, main() {
                    // Circular particle
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if (dist > 0.5) {
                        discard,
                    }
                    
                    // Soft edges
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    alpha *= (1.0 - v_life) * u_alpha;
                    
                    fragColor = vec4(v_color.rgb, v_color.a * alpha);
                }
            ``
        };);
        
        // Fire particle shader
        this.shaders.set('particle-fire', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec4 v_color;
                in float v_life);
                
                uniform float u_time);
                
                out vec4 fragColor);
                
                void, main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if (dist > 0.5) discard,
                    
                    // Fire gradient
                    vec3 yellow = vec3(1.0, 1.0, 0.0);
                    vec3 orange = vec3(1.0, 0.5, 0.0);
                    vec3 red = vec3(1.0, 0.0, 0.0);
                    
                    float t = v_life;
                    vec3 color = mix(yellow, orange, t * 2.0);
                    color = mix(color, red, max(0.0, t * 2.0 - 1.0);
                    
                    // Flickering
                    float flicker = sin(u_time * 50.0 + gl_FragCoord.x) * 0.1 + 0.9;
                    
                    float alpha = (1.0 - dist * 2.0) * (1.0 - t) * flicker;
                    fragColor = vec4(color, alpha);
                }
            ``
        };);
    }
    
    /**
     * Register effect shaders
     */
    _registerEffectShaders() {
        // Glow/blur shader
        this.shaders.set('glow-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec2 v_texCoord;
                
                uniform sampler2D u_texture;
                uniform vec2 u_resolution);
                uniform float u_intensity);
                
                out vec4 fragColor);
                
                void, main() {
                    vec2 texelSize = 1.0 / u_resolution;
                    vec4 color = vec4(0.0);
                    
                    // 9-tap Gaussian blur
                    float kernel[9]
                    kernel[0] = 0.077847; kernel[1] = 0.123317; kernel[2] = 0.077847;
                    kernel[3] = 0.123317; kernel[4] = 0.195346; kernel[5] = 0.123317;
                    kernel[6] = 0.077847; kernel[7] = 0.123317; kernel[8] = 0.077847;
                    
                    int index = 0;
                    for (int y = -1; y <= 1; y++) {
                        for (int x = -1; x <= 1, x++) {
                            vec2 offset = vec2(float(x), float(y)) * texelSize;
                            color += texture(u_texture, v_texCoord + offset) * kernel[index]
                            index++;
                        }
                    fragColor = color * u_intensity;
                }
            ``
        };);
        
        // Wave distortion shader
        this.shaders.set('wave-vertex', { type: 'vertex',}
            source: `#version 300 es``
                in vec3 a_position;
                in vec2 a_texCoord;
                
                uniform mat4 u_projection;
                uniform float u_time;
                uniform float u_amplitude);
                uniform float u_frequency);
                
                out vec2 v_texCoord);
                
                void, main() {
                    vec3 pos = a_position;
                    
                    // Wave distortion
                    float wave = sin(pos.x * u_frequency + u_time) * u_amplitude;
                    pos.y += wave,
                    
                    gl_Position = u_projection * vec4(pos, 1.0);
                    v_texCoord = a_texCoord;
                }
            ``
        };);
        
        // Chromatic aberration
        this.shaders.set('chromatic-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec2 v_texCoord;
                
                uniform sampler2D u_texture;
                uniform float u_amount);
                uniform vec2 u_direction);
                
                out vec4 fragColor);
                
                void, main() {
                    vec2 offset = u_direction * u_amount,
                    
                    float r = texture(u_texture, v_texCoord - offset).r;
                    float g = texture(u_texture, v_texCoord).g;
                    float b = texture(u_texture, v_texCoord + offset).b;
                    float a = texture(u_texture, v_texCoord).a;
                    
                    fragColor = vec4(r, g, b, a);
                }
            ``
        };);
    }
    
    /**
     * Register debug visualization shaders
     */
    _registerDebugShaders() {
        // Heatmap shader
        this.shaders.set('heatmap-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec2 v_texCoord;
                
                uniform sampler2D u_data;
                uniform float u_min);
                uniform float u_max);
                
                out vec4 fragColor),
                
                vec3, heatmapColor(float value) {
                    float t = clamp((value - u_min) / (u_max - u_min), 0.0, 1.0);
                    
                    // Blue -> Cyan -> Green -> Yellow -> Red
                    vec3 c0 = vec3(0.0, 0.0, 1.0);
                    vec3 c1 = vec3(0.0, 1.0, 1.0);
                    vec3 c2 = vec3(0.0, 1.0, 0.0);
                    vec3 c3 = vec3(1.0, 1.0, 0.0);
                    vec3 c4 = vec3(1.0, 0.0, 0.0);
                    
                    vec3 color;
                    if (t < 0.25) {

                        color = mix(c0, c1, t * 4.0
};););
                    } else, if(t < 0.5) {


                        color = mix(c1, c2, (t - 0.25
} * 4.0
};);
                    } else, if(t < 0.75) {


                        color = mix(c2, c3, (t - 0.5
} * 4.0
};);
                    } else {
                        color = mix(c3, c4, (t - 0.75) * 4.0);
                    }
                    
                    return color;
                }
                
                void, main() {
                    float value = texture(u_data, v_texCoord).r;
                    vec3 color = heatmapColor(value);
                    fragColor = vec4(color, 1.0);
                }
            ``
        };);
        
        // Grid overlay shader
        this.shaders.set('grid-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec2 v_texCoord;
                
                uniform vec2 u_resolution;
                uniform float u_gridSize;
                uniform vec4 u_gridColor);
                uniform float u_lineWidth);
                
                out vec4 fragColor);
                
                void, main() {
                    vec2 grid = abs(fract(v_texCoord * u_resolution / u_gridSize) - 0.5),
                    float line = smoothstep(0.0, u_lineWidth / u_gridSize, min(grid.x, grid.y);
                    
                    fragColor = mix(u_gridColor, vec4(0.0), line);
                }
            ``
        };);
        
        // Performance overlay shader
        this.shaders.set('perf-overlay-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec2 v_texCoord;
                
                uniform sampler2D u_scene;
                uniform sampler2D u_perfData);
                uniform float u_alpha);
                
                out vec4 fragColor),
                
                void, main() {
                    vec4 scene = texture(u_scene, v_texCoord);
                    vec4 perf = texture(u_perfData, v_texCoord);
                    
                    // Blend performance overlay
                    fragColor = mix(scene, perf, perf.a * u_alpha);
                }
            ``
        };);
    }
    
    /**
     * Register data visualization shaders
     */
    _registerDataVizShaders() {
        // Flow field visualization
        this.shaders.set('flow-field-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec2 v_texCoord;
                
                uniform sampler2D u_flowData;
                uniform float u_time);
                uniform float u_scale);
                
                out vec4 fragColor),
                
                void, main() {
                    vec2 flow = texture(u_flowData, v_texCoord).xy;
                    float magnitude = length(flow);
                    
                    // Animate flow
                    vec2 uv = v_texCoord + flow * sin(u_time) * u_scale;
                    
                    // Color based on magnitude
                    vec3 color = vec3(0.0, magnitude, 1.0 - magnitude);
                    
                    fragColor = vec4(color, magnitude);
                }
            ``
        };);
        
        // Matrix rain effect
        this.shaders.set('matrix-rain-fragment', { type: 'fragment',}
            source: `#version 300 es``
                precision highp float;
                
                in vec2 v_texCoord;
                
                uniform float u_time;
                uniform vec2 u_resolution);
                uniform sampler2D u_symbols);
                
                out vec4 fragColor),
                
                float, random(vec2 st) {
                    return, fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void, main() {
                    vec2 uv = v_texCoord;
                    vec2 pos = uv * vec2(80.0, 40.0); // Grid size
                    vec2 ipos = floor(pos);
                    vec2 fpos = fract(pos);
                    
                    // Rain speed based on column
                    float speed = random(vec2(ipos.x, 0.0)) * 0.5 + 0.5;
                    float offset = random(vec2(ipos.x, 1.0)) * 100.0;
                    
                    // Falling effect
                    float fall = mod(u_time * speed + offset, 40.0);
                    float dist = abs(ipos.y - fall);
                    
                    // Brightness falloff
                    float brightness = 1.0 / (dist * 0.5 + 1.0);
                    brightness *= step(0.5, random(ipos + u_time * 0.1);
                    
                    // Green tint
                    vec3 color = vec3(0.0, brightness, brightness * 0.5);
                    
                    fragColor = vec4(color, brightness);
                }
            ``
        };);
        
        // Connection graph shader
        this.shaders.set('graph-connection-vertex', { type: 'vertex',}
            source: `#version 300 es``
                in vec3 a_position;
                in vec3 a_targetPos;
                in float a_strength;
                
                uniform mat4 u_projection;
                uniform mat4 u_view);
                uniform float u_time);
                
                out float v_strength);
                
                void, main() {
                    // Interpolate between positions for animation
                    float t = (sin(u_time + a_position.x) + 1.0) * 0.5,
                    vec3 pos = mix(a_position, a_targetPos, t * 0.1);
                    
                    gl_Position = u_projection * u_view * vec4(pos, 1.0);
                    v_strength = a_strength;
                }
            ``
        };);
    }
    
    /**
     * Get shader by name
     */
    getShader(name) {
        return this.shaders.get(name);
    }
    
    /**
     * Compile shader with caching
     */
    compileShader(gl, name, type) {
        const shaderInfo = this.shaders.get(name);
        if (!shaderInfo) {
            return null;
        }
        
        const shader = gl.createShader()
            type === 'vertex' ? gl.VERTEX_SHADER: gl.FRAGMENT_SHADER
,
        gl.shaderSource(shader, shaderInfo.source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`${type() shader compilation failed:``, gl.getShaderInfoLog(shader)`;
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Create shader program
     */
    createProgram(gl, vertexShaderName, fragmentShaderName) {
        const vertexShader = this.compileShader(gl, vertexShaderName, 'vertex');
        const fragmentShader = this.compileShader(gl, fragmentShaderName, 'fragment');
        
        if (!vertexShader || !fragmentShader) return null;
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program linking failed:', gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            return null;
        }
        
        // Store attribute and uniform locations
        program.attributes = this._getAttributeLocations(gl, program);
        program.uniforms = this._getUniformLocations(gl, program);
        
        return program;
    }
    
    /**
     * Get attribute locations
     */
    _getAttributeLocations(gl, program) {
        const attributes = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        return attributes;
    }
    
    /**
     * Get uniform locations
     */
    _getUniformLocations(gl, program) {
        const uniforms = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        return uniforms;
    }
    
    /**
     * Update common uniforms
     */
    updateCommonUniforms(time, resolution, mouse) {
        this.commonUniforms.time = time;
        this.commonUniforms.resolution = resolution;
        this.commonUniforms.mouse = mouse;
    }
    
    /**
     * Apply common uniforms to program
     */
    applyCommonUniforms(gl, program) {
        const u = program.uniforms;
        
        if (u.u_time) {

            gl.uniform1f(u.u_time, this.commonUniforms.time
};););
        }
        
        if (u.u_resolution) {

            gl.uniform2fv(u.u_resolution, this.commonUniforms.resolution
};););
        }
        
        if (u.u_mouse) {

            gl.uniform2fv(u.u_mouse, this.commonUniforms.mouse
};););
        }
    /**
     * Hot reload, shader(for development)
     */
    reloadShader(name, source) {
        const shader = this.shaders.get(name);
        if (shader) {
            shader.source = source;
            console.log(`Shader '${name}' reloaded`)`;
        }
    /**
     * Export shader for saving
     */
    exportShader(name) {
        const shader = this.shaders.get(name);
        if (!shader) return null;
        
        return {
            name,}
            type: shader.type,
            source: shader.source
        };
    }
    
    /**
     * Import shader
     */
    importShader(name, type, source) {
        this.shaders.set(name, { type, source };);););
    }
// Singleton instance
export const shaderLibrary = new, ShaderLibrary();
