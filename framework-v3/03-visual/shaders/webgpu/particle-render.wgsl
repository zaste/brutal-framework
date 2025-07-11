/**
 * BRUTAL Particle Render Shader - WebGPU
 * Renders millions of particles with advanced visual effects
 */

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

// Vertex shader for instanced quad rendering
@vertex
fn vs_main(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    var output: VertexOutput;
    
    let particle = particles[instanceIndex];
    
    // Skip dead particles
    if (particle.life <= 0.0) {
        output.position = vec4<f32>(0.0, 0.0, -100.0, 1.0);
        return output;
    }
    
    // Quad vertices
    let vertex = vec2<f32>(
        f32((vertexIndex & 1u) * 2u) - 1.0,
        f32((vertexIndex >> 1u) * 2u) - 1.0
    );
    
    // Billboard calculation
    let worldPos = particle.position;
    let viewPos = (uniforms.view * vec4<f32>(worldPos, 1.0)).xyz;
    
    // Size based on life and base size
    let size = particle.size * uniforms.particleScale * particle.life;
    
    // Apply size and billboard offset
    viewPos.x += vertex.x * size;
    viewPos.y += vertex.y * size;
    
    // Project to screen
    output.position = uniforms.viewProjection * vec4<f32>(worldPos, 1.0);
    output.position.x += vertex.x * size * output.position.w / uniforms.resolution.x * 2.0;
    output.position.y += vertex.y * size * output.position.w / uniforms.resolution.y * 2.0;
    
    // Pass attributes
    output.color = particle.color;
    output.uv = vertex * 0.5 + 0.5;
    output.size = size;
    output.life = particle.life;
    
    return output;
}

// Fragment shader with advanced effects
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    // Distance from center for soft particles
    let dist = length(input.uv - vec2<f32>(0.5));
    
    // Soft circular falloff
    var alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Glow effect
    let glow = pow(alpha, 2.0) * 2.0;
    
    // Color with glow
    var color = input.color;
    color.r = min(1.0, color.r + glow * 0.5);
    color.g = min(1.0, color.g + glow * 0.3);
    color.b = min(1.0, color.b + glow * 0.8);
    
    // Apply life fade
    alpha *= input.life;
    
    // Size-based alpha adjustment
    alpha *= clamp(input.size * 2.0, 0.0, 1.0);
    
    // Premultiplied alpha
    return vec4<f32>(color.rgb * alpha, alpha);
}

// Alternative fragment shader for additive blending
@fragment
fn fs_main_additive(input: VertexOutput) -> @location(0) vec4<f32> {
    let dist = length(input.uv - vec2<f32>(0.5));
    
    // Sharp falloff for additive
    var intensity = pow(1.0 - dist * 2.0, 3.0);
    intensity *= input.life;
    
    // HDR colors for bloom
    var color = input.color.rgb;
    color *= intensity * 2.0;
    
    // Energy conservation
    let maxComponent = max(max(color.r, color.g), color.b);
    if (maxComponent > 1.0) {
        color /= maxComponent;
    }
    
    return vec4<f32>(color, 1.0);
}