/**
 * BRUTAL Particle Compute Shader - WebGPU
 * Handles physics simulation for millions of particles
 */

struct Particle {
    position: vec3<f32>,
    velocity: vec3<f32>,
    color: vec4<f32>,
    life: f32,
    size: f32,
    _padding: vec2<f32>,
}

struct SimParams {
    deltaTime: f32,
    time: f32,
    particleCount: u32,
    gravity: f32,
    windForce: vec3<f32>,
    attractorPos: vec3<f32>,
    attractorStrength: f32,
    damping: f32,
    noiseScale: f32,
    noiseStrength: f32,
    turbulence: f32,
    bounds: vec3<f32>,
    _padding: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimParams;
@group(0) @binding(2) var<storage, read> spawners: array<vec4<f32>>;

// Simplex noise for turbulence
fn random(seed: vec2<f32>) -> f32 {
    return fract(sin(dot(seed, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn noise3D(p: vec3<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    
    let u = f * f * (3.0 - 2.0 * f);
    
    let a = random(i.xy);
    let b = random(i.xy + vec2<f32>(1.0, 0.0));
    let c = random(i.xy + vec2<f32>(0.0, 1.0));
    let d = random(i.xy + vec2<f32>(1.0, 1.0));
    
    let e = random((i + vec3<f32>(0.0, 0.0, 1.0)).xy);
    let f2 = random((i + vec3<f32>(1.0, 0.0, 1.0)).xy);
    let g = random((i + vec3<f32>(0.0, 1.0, 1.0)).xy);
    let h = random((i + vec3<f32>(1.0, 1.0, 1.0)).xy);
    
    let x1 = mix(a, b, u.x);
    let x2 = mix(c, d, u.x);
    let y1 = mix(x1, x2, u.y);
    
    let x3 = mix(e, f2, u.x);
    let x4 = mix(g, h, u.x);
    let y2 = mix(x3, x4, u.y);
    
    return mix(y1, y2, u.z);
}

fn curl_noise(p: vec3<f32>) -> vec3<f32> {
    let epsilon = 0.01;
    
    let dx = vec3<f32>(epsilon, 0.0, 0.0);
    let dy = vec3<f32>(0.0, epsilon, 0.0);
    let dz = vec3<f32>(0.0, 0.0, epsilon);
    
    let p_x0 = noise3D(p - dx);
    let p_x1 = noise3D(p + dx);
    let p_y0 = noise3D(p - dy);
    let p_y1 = noise3D(p + dy);
    let p_z0 = noise3D(p - dz);
    let p_z1 = noise3D(p + dz);
    
    let x = (p_y1 - p_y0 - p_z1 + p_z0) / (2.0 * epsilon);
    let y = (p_z1 - p_z0 - p_x1 + p_x0) / (2.0 * epsilon);
    let z = (p_x1 - p_x0 - p_y1 + p_y0) / (2.0 * epsilon);
    
    return vec3<f32>(x, y, z);
}

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= params.particleCount) {
        return;
    }
    
    var particle = particles[index];
    
    // Skip dead particles
    if (particle.life <= 0.0) {
        // Respawn from random spawner
        let spawnerIndex = u32(random(vec2<f32>(f32(index), params.time)) * f32(arrayLength(&spawners)));
        let spawner = spawners[spawnerIndex];
        
        particle.position = spawner.xyz + (random(vec2<f32>(f32(index) * 2.0, params.time)) - 0.5) * 2.0;
        particle.velocity = vec3<f32>(
            (random(vec2<f32>(f32(index) * 3.0, params.time)) - 0.5) * 2.0,
            random(vec2<f32>(f32(index) * 4.0, params.time)) * 2.0,
            (random(vec2<f32>(f32(index) * 5.0, params.time)) - 0.5) * 2.0
        );
        particle.life = 1.0;
        particle.size = random(vec2<f32>(f32(index) * 6.0, params.time)) * 0.5 + 0.5;
        
        particles[index] = particle;
        return;
    }
    
    // Apply forces
    var acceleration = vec3<f32>(0.0);
    
    // Gravity
    acceleration.y -= params.gravity;
    
    // Wind
    acceleration += params.windForce;
    
    // Attractor
    let toAttractor = params.attractorPos - particle.position;
    let distSq = dot(toAttractor, toAttractor);
    if (distSq > 0.01) {
        let dist = sqrt(distSq);
        acceleration += (toAttractor / dist) * params.attractorStrength / distSq;
    }
    
    // Curl noise turbulence
    let noisePos = particle.position * params.noiseScale + vec3<f32>(0.0, params.time * 0.1, 0.0);
    let turbulence = curl_noise(noisePos) * params.noiseStrength * params.turbulence;
    acceleration += turbulence;
    
    // Update velocity with damping
    particle.velocity += acceleration * params.deltaTime;
    particle.velocity *= (1.0 - params.damping * params.deltaTime);
    
    // Update position
    particle.position += particle.velocity * params.deltaTime;
    
    // Boundary collision with bounce
    let bounds = params.bounds;
    if (abs(particle.position.x) > bounds.x) {
        particle.position.x = sign(particle.position.x) * bounds.x;
        particle.velocity.x *= -0.8;
    }
    if (particle.position.y < -bounds.y) {
        particle.position.y = -bounds.y;
        particle.velocity.y *= -0.8;
    }
    if (particle.position.y > bounds.y) {
        particle.position.y = bounds.y;
        particle.velocity.y *= -0.8;
    }
    if (abs(particle.position.z) > bounds.z) {
        particle.position.z = sign(particle.position.z) * bounds.z;
        particle.velocity.z *= -0.8;
    }
    
    // Update life
    particle.life -= params.deltaTime * 0.2;
    
    // Update color based on velocity
    let speed = length(particle.velocity);
    particle.color = vec4<f32>(
        speed * 0.1,
        0.5 + speed * 0.05,
        1.0 - speed * 0.1,
        particle.life
    );
    
    // Write back
    particles[index] = particle;
}