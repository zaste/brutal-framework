#version 300 es
/**
 * BRUTAL Particle Fragment Shader - WebGL2
 * Advanced particle rendering with soft edges and glow
 */

precision highp float;

// Inputs from vertex shader
in vec4 v_color;
in vec2 v_uv;
in float v_life;
in float v_size;

// Output
out vec4 fragColor;

// Uniforms
uniform float u_time;
uniform int u_blendMode; // 0: normal, 1: additive, 2: multiplicative

void main() {
    // Distance from center for soft particles
    float dist = length(v_uv - vec2(0.5));
    
    // Discard pixels outside circle
    if (dist > 0.5) {
        discard;
    }
    
    // Soft circular falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Glow effect
    float glow = pow(alpha, 2.0) * 2.0;
    
    // Apply color with glow
    vec3 color = v_color.rgb;
    color.r = min(1.0, color.r + glow * 0.5);
    color.g = min(1.0, color.g + glow * 0.3);
    color.b = min(1.0, color.b + glow * 0.8);
    
    // Apply life fade
    alpha *= v_life;
    
    // Size-based alpha adjustment
    alpha *= clamp(v_size * 2.0, 0.0, 1.0);
    
    // Apply blend mode
    if (u_blendMode == 1) {
        // Additive blending
        float intensity = pow(1.0 - dist * 2.0, 3.0) * v_life;
        color *= intensity * 2.0;
        
        // Energy conservation
        float maxComponent = max(max(color.r, color.g), color.b);
        if (maxComponent > 1.0) {
            color /= maxComponent;
        }
        
        fragColor = vec4(color, 1.0);
    } else {
        // Normal blending with premultiplied alpha
        fragColor = vec4(color * alpha, alpha);
    }
}

// Alternative fragment shader for point sprites
#ifdef POINT_SPRITES
void main_points() {
    vec2 coord = gl_PointCoord;
    float dist = length(coord - vec2(0.5));
    
    if (dist > 0.5) {
        discard;
    }
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= v_life;
    
    vec3 color = v_color.rgb;
    
    if (u_blendMode == 1) {
        float intensity = pow(1.0 - dist * 2.0, 3.0) * v_life;
        color *= intensity * 2.0;
        fragColor = vec4(color, 1.0);
    } else {
        fragColor = vec4(color * alpha, alpha);
    }
}
#endif