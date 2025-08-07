/**
 * BRUTAL V4 - Render Scheduling System
 * RAF-based batching to prevent layout thrashing
 * Priority-based scheduling for optimal performance
 */

import { PolyfillStrategy } from '../base/PolyfillStrategy.js';

/**
 * Priority levels for render operations
 */
export const RenderPriority = {
    USER_INPUT: 3,    // Highest - user interactions
    ANIMATION: 2,     // High - animations and transitions
    BACKGROUND: 1,    // Low - background updates
    IDLE: 0          // Lowest - non-critical updates
};

/**
 * BrutalRenderScheduler - Manages component render scheduling
 * Batches DOM updates using requestAnimationFrame
 * Supports priority-based scheduling and microtask fallback
 */
export class BrutalRenderScheduler {
    static instance = null;
    
    constructor() {
        if (BrutalRenderScheduler.instance) {
            return BrutalRenderScheduler.instance;
        }
        
        // Render queue organized by priority
        this.queues = new Map([
            [RenderPriority.USER_INPUT, new Set()],
            [RenderPriority.ANIMATION, new Set()],
            [RenderPriority.BACKGROUND, new Set()],
            [RenderPriority.IDLE, new Set()]
        ]);
        
        // Track scheduling state
        this.scheduled = false;
        this.processing = false;
        this.frameId = null;
        
        // Performance tracking
        this.metrics = {
            totalRenders: 0,
            batchedRenders: 0,
            frameTime: 0,
            queueSize: 0
        };
        
        // Microtask for synchronous needs
        this.microtaskScheduled = false;
        
        BrutalRenderScheduler.instance = this;
        
        // Check for requestIdleCallback support
        this.hasIdleCallback = PolyfillStrategy.detect('requestIdleCallback');
        if (!this.hasIdleCallback) {
            PolyfillStrategy.load('requestIdleCallback');
        }
    }
    
    /**
     * Schedule a component for rendering
     * @param {HTMLElement} component - Component to render
     * @param {number} priority - Render priority level
     */
    schedule(component, priority = RenderPriority.BACKGROUND) {
        if (!component || typeof component.render !== 'function') {
            console.warn('[RenderScheduler] Invalid component passed to schedule');
            return;
        }
        
        // Add to appropriate priority queue
        const queue = this.queues.get(priority);
        if (!queue) {
            console.warn('[RenderScheduler] Invalid priority level:', priority);
            return;
        }
        
        queue.add(component);
        this.metrics.queueSize++;
        
        // Schedule render if not already scheduled
        if (!this.scheduled) {
            this.scheduleFrame();
        }
        
        // For user input priority, also schedule microtask
        if (priority === RenderPriority.USER_INPUT && !this.microtaskScheduled) {
            this.scheduleMicrotask();
        }
    }
    
    /**
     * Schedule next animation frame
     */
    scheduleFrame() {
        if (this.scheduled) return;
        
        this.scheduled = true;
        this.frameId = requestAnimationFrame((timestamp) => {
            this.processQueues(timestamp);
        });
    }
    
    /**
     * Schedule microtask for high-priority updates
     */
    scheduleMicrotask() {
        if (this.microtaskScheduled) return;
        
        this.microtaskScheduled = true;
        queueMicrotask(() => {
            this.microtaskScheduled = false;
            // Process only user input priority
            this.processQueue(RenderPriority.USER_INPUT);
        });
    }
    
    /**
     * Process all render queues
     * @param {number} timestamp - Frame timestamp
     */
    processQueues(timestamp) {
        const startTime = performance.now();
        this.processing = true;
        this.scheduled = false;
        
        // Process queues in priority order
        const priorities = [
            RenderPriority.USER_INPUT,
            RenderPriority.ANIMATION,
            RenderPriority.BACKGROUND,
            RenderPriority.IDLE
        ];
        
        let componentsRendered = 0;
        const frameDeadline = startTime + 16; // Target 60fps
        
        for (const priority of priorities) {
            const queue = this.queues.get(priority);
            if (queue.size === 0) continue;
            
            // Process queue with frame budget awareness
            const processed = this.processQueue(priority, frameDeadline);
            componentsRendered += processed;
            
            // Break if we're running out of frame time
            if (performance.now() >= frameDeadline && priority < RenderPriority.USER_INPUT) {
                break;
            }
        }
        
        // Update metrics
        this.metrics.frameTime = performance.now() - startTime;
        this.metrics.totalRenders += componentsRendered;
        this.metrics.batchedRenders++;
        
        // Emit performance event if enabled
        if (window.BRUTAL_DEBUG) {
            window.dispatchEvent(new CustomEvent('brutal:scheduler:frame', {
                detail: {
                    componentsRendered,
                    frameTime: this.metrics.frameTime,
                    timestamp
                }
            }));
        }
        
        this.processing = false;
        
        // Schedule next frame if queues not empty
        if (this.hasQueuedComponents()) {
            this.scheduleFrame();
        }
    }
    
    /**
     * Process a single priority queue
     * @param {number} priority - Priority level
     * @param {number} deadline - Frame deadline timestamp
     * @returns {number} Number of components processed
     */
    processQueue(priority, deadline = Infinity) {
        const queue = this.queues.get(priority);
        if (!queue || queue.size === 0) return 0;
        
        const components = Array.from(queue);
        queue.clear();
        
        let processed = 0;
        
        for (const component of components) {
            // Check frame budget for non-critical updates
            if (priority < RenderPriority.USER_INPUT && performance.now() >= deadline) {
                // Re-queue remaining components
                components.slice(processed).forEach(c => queue.add(c));
                break;
            }
            
            try {
                // Render component
                if (component._isConnected !== false) {
                    component.render();
                    processed++;
                }
            } catch (error) {
                console.error('[RenderScheduler] Component render failed:', error);
                
                // Emit error event
                window.dispatchEvent(new CustomEvent('brutal:scheduler:error', {
                    detail: { component, error, priority }
                }));
            }
        }
        
        this.metrics.queueSize -= processed;
        return processed;
    }
    
    /**
     * Check if any queues have components
     * @returns {boolean}
     */
    hasQueuedComponents() {
        for (const queue of this.queues.values()) {
            if (queue.size > 0) return true;
        }
        return false;
    }
    
    /**
     * Cancel a scheduled component render
     * @param {HTMLElement} component - Component to cancel
     */
    cancel(component) {
        for (const queue of this.queues.values()) {
            if (queue.has(component)) {
                queue.delete(component);
                this.metrics.queueSize--;
                break;
            }
        }
    }
    
    /**
     * Cancel all scheduled renders
     */
    cancelAll() {
        for (const queue of this.queues.values()) {
            queue.clear();
        }
        
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        this.scheduled = false;
        this.metrics.queueSize = 0;
    }
    
    /**
     * Get scheduler metrics
     * @returns {Object} Current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            queues: {
                userInput: this.queues.get(RenderPriority.USER_INPUT).size,
                animation: this.queues.get(RenderPriority.ANIMATION).size,
                background: this.queues.get(RenderPriority.BACKGROUND).size,
                idle: this.queues.get(RenderPriority.IDLE).size
            }
        };
    }
    
    /**
     * Force immediate render (use sparingly)
     * @param {HTMLElement} component - Component to render
     */
    forceRender(component) {
        if (!component || typeof component.render !== 'function') return;
        
        try {
            component.render();
            this.metrics.totalRenders++;
        } catch (error) {
            console.error('[RenderScheduler] Force render failed:', error);
        }
    }
    
    /**
     * Schedule render with specific delay
     * @param {HTMLElement} component - Component to render
     * @param {number} delay - Delay in milliseconds
     * @param {number} priority - Priority level
     */
    scheduleDelayed(component, delay, priority = RenderPriority.BACKGROUND) {
        setTimeout(() => {
            this.schedule(component, priority);
        }, delay);
    }
    
    /**
     * Schedule idle callback render
     * @param {HTMLElement} component - Component to render
     * @param {Object} options - Idle callback options
     */
    scheduleIdle(component, options = {}) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.schedule(component, RenderPriority.IDLE);
            }, options);
        } else {
            // Fallback to setTimeout
            setTimeout(() => {
                this.schedule(component, RenderPriority.IDLE);
            }, 0);
        }
    }
}

/**
 * Singleton instance getter
 */
export const renderScheduler = new BrutalRenderScheduler();

/**
 * RenderScheduler utilities
 */
export const SchedulerUtils = {
    /**
     * Schedule multiple components
     * @param {Array<HTMLElement>} components - Components to schedule
     * @param {number} priority - Priority level
     */
    scheduleMultiple(components, priority = RenderPriority.BACKGROUND) {
        for (const component of components) {
            renderScheduler.schedule(component, priority);
        }
    },
    
    /**
     * Create priority-aware render function
     * @param {HTMLElement} component - Component context
     * @param {number} defaultPriority - Default priority
     * @returns {Function} Bound render function
     */
    createScheduledRender(component, defaultPriority = RenderPriority.BACKGROUND) {
        return (priority = defaultPriority) => {
            renderScheduler.schedule(component, priority);
        };
    },
    
    /**
     * Measure render performance
     * @param {Function} renderFn - Render function to measure
     * @returns {Promise<number>} Render time in ms
     */
    async measureRender(renderFn) {
        const start = performance.now();
        await renderFn();
        return performance.now() - start;
    },
    
    /**
     * Check if running in frame budget
     * @param {number} startTime - Frame start time
     * @param {number} budget - Frame budget in ms (default 16)
     * @returns {boolean}
     */
    hasFrameBudget(startTime, budget = 16) {
        return performance.now() - startTime < budget;
    }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.BrutalRenderScheduler = BrutalRenderScheduler;
    window.renderScheduler = renderScheduler;
}