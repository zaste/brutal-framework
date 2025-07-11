/**
 * BRUTAL V3 - Animation System
 * GPU-accelerated animations with spring physics
 */

export class AnimationSystem {
    constructor() {
        // Animation registry
        this._animations = new Map();
        this._activeAnimations = new Set();
        
        // Spring physics defaults
        this._springDefaults = {
            stiffness: 170,
            damping: 20,
            mass: 1,
            velocity: 0
        };
        
        // Performance
        this._rafId = null;
        this._lastFrame = 0;
        this._fps = 0;
        
        // GPU acceleration
        this._useGPU = this._detectGPUSupport();
        this._transforms = new Map();
    }
    
    /**
     * Detect GPU transform support
     */
    _detectGPUSupport() {
        if (typeof window === 'undefined') return false;
        
        const el = document.createElement('div');
        const transforms = [
            'transform',
            'WebkitTransform',
            'MozTransform',
            'msTransform'
        ];
        
        for (const t of transforms) {
            if (el.style[t] !== undefined) {
                // Check for GPU acceleration hints
                return 'will-change' in el.style;
            }
        }
        
        return false;
    }
    
    /**
     * Spring animation
     */
    spring(element, properties, options = {}) {
        const config = { ...this._springDefaults, ...options };
        const animId = Symbol('spring');
        
        const animation = {
            element,
            type: 'spring',
            properties,
            config,
            startTime: performance.now(),
            currentValues: {},
            targetValues: {},
            velocity: {}
        };
        
        // Initialize values
        for (const [prop, target] of Object.entries(properties)) {
            const current = this._getCurrentValue(element, prop);
            animation.currentValues[prop] = current;
            animation.targetValues[prop] = target;
            animation.velocity[prop] = 0;
        }
        
        this._animations.set(animId, animation);
        this._activeAnimations.add(animId);
        
        // Enable GPU acceleration
        if (this._useGPU && element instanceof HTMLElement) {
            element.style.willChange = Object.keys(properties).join(', ');
        }
        
        this._startAnimationLoop();
        
        return {
            stop: () => this._stopAnimation(animId),
            finished: new Promise(resolve => {
                animation.onComplete = resolve;
            })
        };
    }
    
    /**
     * Tween animation
     */
    tween(element, properties, duration = 300, easing = 'easeOut') {
        const animId = Symbol('tween');
        
        const animation = {
            element,
            type: 'tween',
            properties,
            duration,
            easing: this._getEasingFunction(easing),
            startTime: performance.now(),
            startValues: {},
            endValues: properties
        };
        
        // Capture start values
        for (const prop of Object.keys(properties)) {
            animation.startValues[prop] = this._getCurrentValue(element, prop);
        }
        
        this._animations.set(animId, animation);
        this._activeAnimations.add(animId);
        
        // GPU acceleration
        if (this._useGPU && element instanceof HTMLElement) {
            element.style.willChange = Object.keys(properties).join(', ');
        }
        
        this._startAnimationLoop();
        
        return {
            stop: () => this._stopAnimation(animId),
            finished: new Promise(resolve => {
                animation.onComplete = resolve;
            })
        };
    }
    
    /**
     * Sequence animations
     */
    async sequence(animations) {
        const results = [];
        
        for (const anim of animations) {
            const { element, properties, duration, type = 'tween' } = anim;
            
            if (type === 'spring') {
                const result = this.spring(element, properties, anim.options);
                await result.finished;
                results.push(result);
            } else {
                const result = this.tween(element, properties, duration, anim.easing);
                await result.finished;
                results.push(result);
            }
        }
        
        return results;
    }
    
    /**
     * Parallel animations
     */
    parallel(animations) {
        const results = animations.map(anim => {
            const { element, properties, duration, type = 'tween' } = anim;
            
            if (type === 'spring') {
                return this.spring(element, properties, anim.options);
            } else {
                return this.tween(element, properties, duration, anim.easing);
            }
        });
        
        return {
            stop: () => results.forEach(r => r.stop()),
            finished: Promise.all(results.map(r => r.finished))
        };
    }
    
    /**
     * Animation loop
     */
    _startAnimationLoop() {
        if (this._rafId) return;
        
        const animate = (timestamp) => {
            const deltaTime = timestamp - this._lastFrame;
            this._fps = 1000 / deltaTime;
            this._lastFrame = timestamp;
            
            // Update all animations
            for (const animId of this._activeAnimations) {
                const animation = this._animations.get(animId);
                if (!animation) continue;
                
                if (animation.type === 'spring') {
                    this._updateSpring(animation, deltaTime);
                } else if (animation.type === 'tween') {
                    this._updateTween(animation, timestamp);
                }
                
                // Check completion
                if (this._isComplete(animation)) {
                    this._completeAnimation(animId);
                }
            }
            
            if (this._activeAnimations.size > 0) {
                this._rafId = requestAnimationFrame(animate);
            } else {
                this._rafId = null;
            }
        };
        
        this._rafId = requestAnimationFrame(animate);
    }
    
    /**
     * Update spring animation
     */
    _updateSpring(animation, deltaTime) {
        const { element, properties, config, currentValues, targetValues, velocity } = animation;
        const dt = Math.min(deltaTime / 1000, 0.064); // Cap at ~15fps
        
        let allSettled = true;
        
        for (const prop of Object.keys(properties)) {
            const current = currentValues[prop];
            const target = targetValues[prop];
            const v = velocity[prop];
            
            // Spring physics
            const displacement = target - current;
            const springForce = displacement * config.stiffness;
            const dampingForce = -v * config.damping;
            const acceleration = (springForce + dampingForce) / config.mass;
            
            // Update velocity and position
            velocity[prop] = v + acceleration * dt;
            currentValues[prop] = current + velocity[prop] * dt;
            
            // Check if settled
            if (Math.abs(velocity[prop]) > 0.01 || Math.abs(displacement) > 0.01) {
                allSettled = false;
            }
            
            // Apply value
            this._applyValue(element, prop, currentValues[prop]);
        }
        
        animation.settled = allSettled;
    }
    
    /**
     * Update tween animation
     */
    _updateTween(animation, timestamp) {
        const { element, properties, duration, easing, startTime, startValues, endValues } = animation;
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        
        for (const [prop, endValue] of Object.entries(endValues)) {
            const startValue = startValues[prop];
            const currentValue = startValue + (endValue - startValue) * easedProgress;
            this._applyValue(element, prop, currentValue);
        }
        
        animation.progress = progress;
    }
    
    /**
     * Apply animated value
     */
    _applyValue(element, property, value) {
        if (element instanceof HTMLElement) {
            // Transform properties
            if (['x', 'y', 'scale', 'rotate', 'skew'].includes(property)) {
                this._applyTransform(element, property, value);
            }
            // Opacity
            else if (property === 'opacity') {
                element.style.opacity = value;
            }
            // Colors
            else if (property.includes('olor')) {
                element.style[property] = value;
            }
            // Dimensions
            else if (['width', 'height', 'top', 'left', 'right', 'bottom'].includes(property)) {
                element.style[property] = value + 'px';
            }
            // Custom properties
            else if (property.startsWith('--')) {
                element.style.setProperty(property, value);
            }
            // Generic
            else {
                element.style[property] = value;
            }
        } else if (element && typeof element.setAnimatedValue === 'function') {
            // Custom component API
            element.setAnimatedValue(property, value);
        }
    }
    
    /**
     * Apply transform with GPU acceleration
     */
    _applyTransform(element, property, value) {
        if (!this._transforms.has(element)) {
            this._transforms.set(element, {
                x: 0, y: 0, scale: 1, rotate: 0, skew: 0
            });
        }
        
        const transforms = this._transforms.get(element);
        transforms[property] = value;
        
        // Build transform string
        const transformStr = [
            transforms.x !== 0 || transforms.y !== 0 ? 
                `translate3d(${transforms.x}px, ${transforms.y}px, 0)` : '',
            transforms.scale !== 1 ? `scale(${transforms.scale})` : '',
            transforms.rotate !== 0 ? `rotate(${transforms.rotate}deg)` : '',
            transforms.skew !== 0 ? `skew(${transforms.skew}deg)` : ''
        ].filter(Boolean).join(' ');
        
        element.style.transform = transformStr;
    }
    
    /**
     * Get current value
     */
    _getCurrentValue(element, property) {
        if (element instanceof HTMLElement) {
            const computed = getComputedStyle(element);
            
            // Transform properties
            if (['x', 'y', 'scale', 'rotate', 'skew'].includes(property)) {
                const transforms = this._transforms.get(element) || {};
                return transforms[property] || 0;
            }
            
            // Parse numeric values
            const value = computed[property];
            if (typeof value === 'string') {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
            }
            
            return value || 0;
        }
        
        return 0;
    }
    
    /**
     * Check if animation is complete
     */
    _isComplete(animation) {
        if (animation.type === 'spring') {
            return animation.settled;
        } else {
            return animation.progress >= 1;
        }
    }
    
    /**
     * Complete animation
     */
    _completeAnimation(animId) {
        const animation = this._animations.get(animId);
        if (!animation) return;
        
        // Clean up GPU hints
        if (this._useGPU && animation.element instanceof HTMLElement) {
            animation.element.style.willChange = 'auto';
        }
        
        // Callback
        if (animation.onComplete) {
            animation.onComplete();
        }
        
        // Clean up
        this._activeAnimations.delete(animId);
        this._animations.delete(animId);
    }
    
    /**
     * Stop animation
     */
    _stopAnimation(animId) {
        this._completeAnimation(animId);
    }
    
    /**
     * Get easing function
     */
    _getEasingFunction(easing) {
        const easings = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            bounce: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) return n1 * t * t;
                if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        };
        
        return easings[easing] || easings.easeOut;
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            activeAnimations: this._activeAnimations.size,
            fps: Math.round(this._fps),
            gpuEnabled: this._useGPU
        };
    }
    
    /**
     * Destroy system
     */
    destroy() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        
        // Clean up all animations
        for (const animId of this._activeAnimations) {
            this._stopAnimation(animId);
        }
        
        this._animations.clear();
        this._activeAnimations.clear();
        this._transforms.clear();
    }
}

// Export singleton
export const animationSystem = new AnimationSystem();