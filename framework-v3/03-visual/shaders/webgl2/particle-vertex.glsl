#version 300 es
/**
 * BRUTAL Particle Vertex Shader - WebGL2
 * Optimized for maximum performance with instancing
 */

// Per-vertex attributes
in vec2 a_position; // Quad vertex position

// Per-instance attributes
in vec3 a_particlePosition;
in vec3 a_particleVelocity;
in vec4 a_particleColor;
in vec2 a_particleData; // x: life, y: size

// Uniforms
uniform mat4 u_viewProjection;
uniform mat4 u_view;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_particleScale;

// Outputs to fragment shader
out vec4 v_color;
out vec2 v_uv;
out float v_life;
out float v_size;

void main() {
    // Skip dead particles
    float life = a_particleData.x;
    if (life <= 0.0) {
        gl_Position = vec4(0.0, 0.0, -100.0, 1.0);
        return;
    }
    
    // Billboard calculation
    vec3 worldPos = a_particlePosition;
    vec4 viewPos = u_view * vec4(worldPos, 1.0);
    
    // Size calculation
    float size = a_particleData.y * u_particleScale * life;
    
    // Apply billboard offset
    viewPos.xy += a_position * size;
    
    // Project to screen
    gl_Position = u_viewProjection * vec4(worldPos, 1.0);
    
    // Adjust for screen space size
    vec2 screenOffset = a_position * size;
    gl_Position.xy += screenOffset * gl_Position.w / u_resolution * 2.0;
    
    // Pass to fragment shader
    v_color = a_particleColor;
    v_uv = a_position * 0.5 + 0.5;
    v_life = life;
    v_size = size;
}

// Alternative vertex shader for point sprites (if supported)
#ifdef POINT_SPRITES
void main_points() {
    vec3 worldPos = a_particlePosition;
    float life = a_particleData.x;
    
    if (life <= 0.0) {
        gl_Position = vec4(0.0, 0.0, -100.0, 1.0);
        gl_PointSize = 0.0;
        return;
    }
    
    gl_Position = u_viewProjection * vec4(worldPos, 1.0);
    
    // Calculate point size based on distance
    float dist = length((u_view * vec4(worldPos, 1.0)).xyz);
    float size = a_particleData.y * u_particleScale * life;
    gl_PointSize = size * u_resolution.y / dist;
    
    v_color = a_particleColor;
    v_life = life;
    v_size = size;
}
#endif