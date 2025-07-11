#version 300 es
/**
 * BRUTAL Particle Update Shader - WebGL2
 * Uses Transform Feedback for GPU-based particle physics
 */

// Particle attributes
in vec3 a_position;
in vec3 a_velocity;
in vec4 a_color;
in vec2 a_data; // x: life, y: size

// Transform feedback outputs
out vec3 v_position;
out vec3 v_velocity;
out vec4 v_color;
out vec2 v_data;

// Simulation parameters
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

// Spawner data
uniform sampler2D u_spawnerTexture;
uniform int u_spawnerCount;

// Random number generation
float random(vec2 seed) {
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

// 3D noise function
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

// Curl noise for turbulence
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
    
    // Check if particle needs respawning
    if (life <= 0.0) {
        // Get random spawner
        float randomVal = random(vec2(gl_VertexID, u_time));
        int spawnerIndex = int(randomVal * float(u_spawnerCount));
        vec2 texCoord = vec2((float(spawnerIndex) + 0.5) / float(u_spawnerCount), 0.5);
        vec4 spawnerData = texture(u_spawnerTexture, texCoord);
        
        // Reset particle
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
        // Apply forces
        vec3 acceleration = vec3(0.0);
        
        // Gravity
        acceleration.y -= u_gravity;
        
        // Wind
        acceleration += u_windForce;
        
        // Attractor
        vec3 toAttractor = u_attractorPos - position;
        float distSq = dot(toAttractor, toAttractor);
        if (distSq > 0.01) {
            float dist = sqrt(distSq);
            acceleration += (toAttractor / dist) * u_attractorStrength / distSq;
        }
        
        // Curl noise turbulence
        vec3 noisePos = position * u_noiseScale + vec3(0.0, u_time * 0.1, 0.0);
        vec3 turbulence = curlNoise(noisePos) * u_noiseStrength * u_turbulence;
        acceleration += turbulence;
        
        // Update velocity with damping
        velocity += acceleration * u_deltaTime;
        velocity *= (1.0 - u_damping * u_deltaTime);
        
        // Update position
        position += velocity * u_deltaTime;
        
        // Boundary collision
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
        
        // Update life
        life -= u_deltaTime * 0.2;
        
        // Update color based on velocity
        float speed = length(velocity);
        color = vec4(
            speed * 0.1,
            0.5 + speed * 0.05,
            1.0 - speed * 0.1,
            life
        );
    }
    
    // Output updated values
    v_position = position;
    v_velocity = velocity;
    v_color = color;
    v_data = vec2(life, size);
}