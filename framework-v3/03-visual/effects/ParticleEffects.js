/**
 * @fileoverview BRUTAL V3 - Particle Effects
 * Predefined visual effects for debugging and user feedback
 * @version 3.0.0
 */

import { ParticleEngine } from '../gpu/ParticleEngine.js';
import { shaderLibrary } from '../gpu/ShaderLibrary.js';

/**
 * Particle Effects - Cinematic visual feedback system
 */
export class ParticleEffects {
    constructor() {
        this.engine = null;
        this.canvas = null;
        this.ctx = null;
        
        // Effect configurations
        this.effects = new Map();
        
        // Active effects
        this.activeEffects = new Map();
        
        // Global settings
        this.settings = {
            enabled: true,
            quality: 'high', // 'low' | 'medium' | 'high'
            maxParticles: 5000,
            autoCleanup: true
        };
        
        // Initialize predefined effects
        this._initializeEffects();
    }
    
    /**
     * Initialize with canvas
     */
    async init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Create particle engine
        this.engine = new ParticleEngine(canvas);
        await this.engine.init();
        
        // Adjust settings based on device capabilities
        this._detectQualityLevel();
        
        }
    
    /**
     * Initialize predefined effects
     */
    _initializeEffects() {
        // Component lifecycle effects
        this._registerLifecycleEffects();
        
        // State change effects
        this._registerStateEffects();
        
        // Performance feedback effects
        this._registerPerformanceEffects();
        
        // Error and warning effects
        this._registerFeedbackEffects();
        
        // Celebration effects
        this._registerCelebrationEffects();
        
        // Data visualization effects
        this._registerDataVizEffects();
    }
    
    /**
     * Register lifecycle effects
     */
    _registerLifecycleEffects() {
        // Component mount
        this.effects.set('component-mount', {
            name: 'Component Mount',
            description: 'Gentle fade-in particles when component mounts',
            config: {
                count: 30,
                speed: 0.5,
                spread: Math.PI * 2,
                life: 1500,
                size: 3,
                color: '#00ff88',
                gravity: false,
                pattern: 'radial'
            }
        });
        
        // Component update
        this.effects.set('component-update', {
            name: 'Component Update',
            description: 'Ripple effect for component updates',
            config: {
                count: 20,
                speed: 2,
                spread: Math.PI * 0.5,
                life: 800,
                size: 2,
                color: '#00aaff',
                gravity: false,
                pattern: 'wave'
            }
        });
        
        // Component unmount
        this.effects.set('component-unmount', {
            name: 'Component Unmount',
            description: 'Dissolve effect when component unmounts',
            config: {
                count: 40,
                speed: 1,
                spread: Math.PI * 2,
                life: 1000,
                size: 2,
                color: '#ff8800',
                gravity: true,
                pattern: 'dissolve'
            }
        });
    }
    
    /**
     * Register state effects
     */
    _registerStateEffects() {
        // State change flow
        this.effects.set('state-flow', {
            name: 'State Flow',
            description: 'Flowing particles between state changes',
            config: {
                count: 5,
                speed: 3,
                spread: 0.2,
                life: 1000,
                size: 3,
                color: '#00ffff',
                gravity: false,
                pattern: 'stream',
                continuous: true
            }
        });
        
        // SharedArrayBuffer activity
        this.effects.set('shared-memory-access', {
            name: 'Shared Memory Access',
            description: 'Quick flash for SharedArrayBuffer operations',
            config: {
                count: 10,
                speed: 5,
                spread: Math.PI * 2,
                life: 300,
                size: 2,
                color: '#00ff00',
                gravity: false,
                pattern: 'flash'
            }
        });
        
        // Props transfer
        this.effects.set('props-transfer', {
            name: 'Props Transfer',
            description: 'Beam effect for props passing',
            config: {
                count: 15,
                speed: 4,
                spread: 0.1,
                life: 600,
                size: 2.5,
                color: '#ffff00',
                gravity: false,
                pattern: 'beam'
            }
        });
    }
    
    /**
     * Register performance effects
     */
    _registerPerformanceEffects() {
        // Fast render
        this.effects.set('fast-render', {
            name: 'Fast Render',
            description: 'Quick sparkle for sub-frame renders',
            config: {
                count: 5,
                speed: 3,
                spread: Math.PI,
                life: 400,
                size: 2,
                color: '#00ff00',
                gravity: false,
                pattern: 'sparkle'
            }
        });
        
        // Slow render warning
        this.effects.set('slow-render', {
            name: 'Slow Render',
            description: 'Warning particles for slow renders',
            config: {
                count: 30,
                speed: 0.5,
                spread: Math.PI * 2,
                life: 2000,
                size: 4,
                color: '#ffaa00',
                gravity: false,
                pattern: 'pulse',
                pulseCount: 3
            }
        });
        
        // Memory pressure
        this.effects.set('memory-pressure', {
            name: 'Memory Pressure',
            description: 'Heavy particles indicating memory issues',
            config: {
                count: 50,
                speed: 0.3,
                spread: Math.PI * 2,
                life: 3000,
                size: 5,
                color: '#ff00ff',
                gravity: true,
                pattern: 'rain'
            }
        });
    }
    
    /**
     * Register feedback effects
     */
    _registerFeedbackEffects() {
        // Error explosion
        this.effects.set('error', {
            name: 'Error',
            description: 'Explosive red particles for errors',
            config: {
                count: 60,
                speed: 5,
                spread: Math.PI * 2,
                life: 1500,
                size: 4,
                color: '#ff0000',
                gravity: true,
                pattern: 'explosion'
            }
        });
        
        // Warning
        this.effects.set('warning', {
            name: 'Warning',
            description: 'Pulsing yellow particles for warnings',
            config: {
                count: 25,
                speed: 2,
                spread: Math.PI,
                life: 1200,
                size: 3,
                color: '#ffff00',
                gravity: false,
                pattern: 'pulse',
                pulseCount: 2
            }
        });
        
        // Success
        this.effects.set('success', {
            name: 'Success',
            description: 'Upward green particles for success',
            config: {
                count: 40,
                speed: 3,
                spread: Math.PI * 0.6,
                life: 1000,
                size: 3,
                color: '#00ff00',
                gravity: false,
                pattern: 'fountain'
            }
        });
    }
    
    /**
     * Register celebration effects
     */
    _registerCelebrationEffects() {
        // Confetti
        this.effects.set('confetti', {
            name: 'Confetti',
            description: 'Colorful confetti celebration',
            config: {
                count: 100,
                speed: 5,
                spread: Math.PI * 0.8,
                life: 3000,
                size: 4,
                colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
                gravity: true,
                pattern: 'confetti',
                rotation: true
            }
        });
        
        // Fireworks
        this.effects.set('fireworks', {
            name: 'Fireworks',
            description: 'Fireworks explosion effect',
            config: {
                count: 80,
                speed: 8,
                spread: Math.PI * 2,
                life: 1500,
                size: 3,
                colors: ['#ff0066', '#66ff00', '#0066ff', '#ffff66'],
                gravity: true,
                pattern: 'fireworks',
                trails: true
            }
        });
        
        // Stars
        this.effects.set('stars', {
            name: 'Stars',
            description: 'Twinkling star effect',
            config: {
                count: 50,
                speed: 0,
                spread: Math.PI * 2,
                life: 2000,
                size: 3,
                color: '#ffffff',
                gravity: false,
                pattern: 'twinkle'
            }
        });
    }
    
    /**
     * Register data visualization effects
     */
    _registerDataVizEffects() {
        // Matrix rain
        this.effects.set('matrix-rain', {
            name: 'Matrix Rain',
            description: 'Digital rain effect',
            config: {
                count: 100,
                speed: 2,
                spread: 0,
                life: 5000,
                size: 2,
                color: '#00ff00',
                gravity: false,
                pattern: 'matrix',
                continuous: true
            }
        });
        
        // Data points
        this.effects.set('data-points', {
            name: 'Data Points',
            description: 'Floating data visualization particles',
            config: {
                count: 30,
                speed: 0.5,
                spread: Math.PI * 2,
                life: 4000,
                size: 3,
                color: '#00ffff',
                gravity: false,
                pattern: 'orbit'
            }
        });
        
        // Network connections
        this.effects.set('network', {
            name: 'Network',
            description: 'Connection line particles',
            config: {
                count: 20,
                speed: 2,
                spread: 0.1,
                life: 1000,
                size: 2,
                color: '#aaaaff',
                gravity: false,
                pattern: 'connect'
            }
        });
    }
    
    /**
     * Play effect
     */
    play(effectName, options = {}) {
        if (!this.settings.enabled || !this.engine) return null;
        
        const effect = this.effects.get(effectName);
        if (!effect) {
            return null;
        }
        
        // Merge options with effect config
        const config = { ...effect.config, ...options };
        
        // Adjust for quality level
        this._adjustForQuality(config);
        
        // Handle special patterns
        return this._playPattern(effectName, config);
    }
    
    /**
     * Play pattern-based effect
     */
    _playPattern(effectName, config) {
        const { pattern, x = 0, y = 0 } = config;
        
        switch (pattern) {
            case 'radial':
                return this._playRadial(config);
                
            case 'wave':
                return this._playWave(config);
                
            case 'dissolve':
                return this._playDissolve(config);
                
            case 'stream':
                return this._playStream(effectName, config);
                
            case 'flash':
                return this._playFlash(config);
                
            case 'beam':
                return this._playBeam(config);
                
            case 'sparkle':
                return this._playSparkle(config);
                
            case 'pulse':
                return this._playPulse(config);
                
            case 'explosion':
                return this._playExplosion(config);
                
            case 'fountain':
                return this._playFountain(config);
                
            case 'confetti':
                return this._playConfetti(config);
                
            case 'fireworks':
                return this._playFireworks(config);
                
            case 'twinkle':
                return this._playTwinkle(config);
                
            case 'matrix':
                return this._playMatrix(effectName, config);
                
            case 'orbit':
                return this._playOrbit(effectName, config);
                
            case 'connect':
                return this._playConnect(config);
                
            default:
                // Default emission
                this.engine.emit(config);
                return effectName;
        }
    }
    
    /**
     * Play radial effect
     */
    _playRadial(config) {
        const { x, y, count } = config;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = 20;
            
            setTimeout(() => {
                this.engine.emit({
                    ...config,
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    count: 1,
                    vx: Math.cos(angle) * config.speed,
                    vy: Math.sin(angle) * config.speed
                });
            }, i * 10);
        }
    }
    
    /**
     * Play wave effect
     */
    _playWave(config) {
        const { x, y, count } = config;
        const waveCount = 3;
        
        for (let wave = 0; wave < waveCount; wave++) {
            setTimeout(() => {
                this.engine.emit({
                    ...config,
                    x, y,
                    count: count / waveCount,
                    size: config.size * (1 + wave * 0.5)
                });
            }, wave * 200);
        }
    }
    
    /**
     * Play stream effect
     */
    _playStream(effectName, config) {
        const { x, y, toX = x + 100, toY = y } = config;
        
        // Create emitter
        const emitterId = `${effectName}-${Date.now()}`;
        const emitter = this.engine.createEmitter(emitterId, {
            ...config,
            x, y,
            rate: 30
        });
        
        // Animate emitter position
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            emitter.x = x + (toX - x) * progress;
            emitter.y = y + (toY - y) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                emitter.active = false;
                this.engine.emitters.delete(emitterId);
            }
        };
        
        animate();
        return emitterId;
    }
    
    /**
     * Play explosion effect
     */
    _playExplosion(config) {
        const { x, y } = config;
        
        // Initial burst
        this.engine.emit(config);
        
        // Secondary explosions
        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const dist = 30;
                
                this.engine.emit({
                    ...config,
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist,
                    count: config.count / 4,
                    size: config.size * 0.7
                });
            }
        }, 100);
    }
    
    /**
     * Play confetti effect
     */
    _playConfetti(config) {
        const { x, y, colors, count } = config;
        
        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.engine.emit({
                ...config,
                x: x + (Math.random() - 0.5) * 100,
                y,
                count: 1,
                color,
                vx: (Math.random() - 0.5) * config.speed,
                vy: -Math.random() * config.speed - 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }
    
    /**
     * Adjust config for quality level
     */
    _adjustForQuality(config) {
        switch (this.settings.quality) {
            case 'low':
                config.count = Math.ceil(config.count * 0.3);
                config.life = config.life * 0.7;
                break;
            case 'medium':
                config.count = Math.ceil(config.count * 0.6);
                break;
            // 'high' uses full config
        }
        
        // Ensure we don't exceed max particles
        config.count = Math.min(config.count, this.settings.maxParticles - this.engine.particles.length);
    }
    
    /**
     * Detect optimal quality level
     */
    _detectQualityLevel() {
        // Check device capabilities
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        if (isMobile) {
            this.settings.quality = 'low';
            this.settings.maxParticles = 1000;
        } else if (devicePixelRatio > 2) {
            this.settings.quality = 'medium';
            this.settings.maxParticles = 3000;
        } else {
            this.settings.quality = 'high';
            this.settings.maxParticles = 5000;
        }
    }
    
    /**
     * Stop effect
     */
    stop(effectId) {
        const emitter = this.engine.emitters.get(effectId);
        if (emitter) {
            emitter.active = false;
            this.engine.emitters.delete(effectId);
        }
    }
    
    /**
     * Stop all effects
     */
    stopAll() {
        this.engine.emitters.clear();
        this.engine.clear();
    }
    
    /**
     * Update effects
     */
    update(deltaTime) {
        if (!this.engine) return;
        
        this.engine.update(deltaTime);
    }
    
    /**
     * Render effects
     */
    render() {
        if (!this.engine) return;
        
        this.engine.render();
    }
    
    /**
     * Set quality level
     */
    setQuality(level) {
        this.settings.quality = level;
        
        switch (level) {
            case 'low':
                this.settings.maxParticles = 1000;
                break;
            case 'medium':
                this.settings.maxParticles = 3000;
                break;
            case 'high':
                this.settings.maxParticles = 5000;
                break;
        }
        
        this.engine.maxParticles = this.settings.maxParticles;
    }
    
    /**
     * Enable/disable effects
     */
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        
        if (!enabled) {
            this.stopAll();
        }
    }
    
    /**
     * Get effect list
     */
    getEffectList() {
        const list = [];
        
        for (const [key, effect] of this.effects) {
            list.push({
                id: key,
                name: effect.name,
                description: effect.description
            });
        }
        
        return list;
    }
    
    /**
     * Destroy effects system
     */
    destroy() {
        this.stopAll();
        this.engine?.destroy();
        this.effects.clear();
        this.activeEffects.clear();
    }
}

// Singleton instance
export const particleEffects = new ParticleEffects();