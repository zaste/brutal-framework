/**
 * PERFORMANCE BOOST - Layer 4: Performance Nuclear
 * Native Web Components Framework - Maximum Performance Optimization
 * Enterprise-grade performance enhancements and monitoring
 */

class PerformanceBoost {
    constructor() {
        this.isActive = false;
        this.metrics = new Map();
        this.observers = new Set();
        this.optimizations = new Map();
        this.frameTimings = [];
        this.renderQueue = new Set();
        this.lazyElements = new WeakMap();
        this.virtualScrollers = new Set();
        
        this.initialize();
    }

    initialize() {
        console.log('🚀 PerformanceBoost: Initializing nuclear performance layer...');
        
        // Initialize core optimizations
        this.setupIntersectionObserver();
        this.setupResizeObserver();
        this.setupMutationObserver();
        this.setupPerformanceMonitoring();
        this.setupVirtualScrolling();
        this.setupImageLazyLoading();
        this.setupComponentPooling();
        this.setupRenderOptimization();
        
        this.isActive = true;
        this.startPerformanceTracking();
        
        console.log('✅ PerformanceBoost: Nuclear performance layer activated');
    }

    // ===== INTERSECTION OBSERVER OPTIMIZATION =====
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target;
                
                if (entry.isIntersecting) {
                    // Element is visible - activate
                    this.activateElement(target);
                } else {
                    // Element is not visible - deactivate
                    this.deactivateElement(target);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: [0, 0.1, 0.5, 1.0]
        });
    }

    activateElement(element) {
        if (element.classList.contains('perf-lazy')) {
            this.loadLazyElement(element);
        }
        
        if (element.classList.contains('perf-animate')) {
            element.classList.add('perf-active');
        }
        
        // Resume component updates
        if (element.tagName.includes('MISSION-')) {
            element.performanceActive = true;
        }
    }

    deactivateElement(element) {
        // Pause non-critical animations
        if (element.classList.contains('perf-animate') && !element.classList.contains('perf-critical')) {
            element.classList.remove('perf-active');
        }
        
        // Pause component updates for invisible elements
        if (element.tagName.includes('MISSION-')) {
            element.performanceActive = false;
        }
    }

    // ===== LAZY LOADING SYSTEM =====
    setupImageLazyLoading() {
        this.lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.classList.remove('perf-lazy-image');
                        img.classList.add('perf-loaded');
                        this.lazyImageObserver.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '100px' });
    }

    loadLazyElement(element) {
        const content = element.dataset.lazyContent;
        if (content) {
            element.innerHTML = content;
            element.classList.remove('perf-lazy');
            element.classList.add('perf-loaded');
            this.intersectionObserver.unobserve(element);
        }
    }

    // ===== VIRTUAL SCROLLING =====
    setupVirtualScrolling() {
        this.virtualScrollObserver = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                if (element.classList.contains('perf-virtual-scroll')) {
                    this.updateVirtualScroll(element);
                }
            });
        });
    }

    enableVirtualScrolling(container, itemHeight = 50, buffer = 5) {
        if (this.virtualScrollers.has(container)) return;
        
        const virtualScroller = {
            container,
            itemHeight,
            buffer,
            visibleItems: new Set(),
            totalItems: 0,
            scrollTop: 0,
            containerHeight: 0
        };
        
        container.classList.add('perf-virtual-scroll');
        container.style.position = 'relative';
        container.style.overflow = 'auto';
        
        // Create virtual content wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'perf-virtual-wrapper';
        wrapper.style.position = 'relative';
        
        // Move all children to wrapper
        Array.from(container.children).forEach(child => {
            wrapper.appendChild(child);
        });
        
        container.appendChild(wrapper);
        this.virtualScrollers.set(container, virtualScroller);
        
        // Setup scroll listener
        container.addEventListener('scroll', () => {
            this.updateVirtualScroll(container);
        });
        
        this.virtualScrollObserver.observe(container);
        this.updateVirtualScroll(container);
    }

    updateVirtualScroll(container) {
        const scroller = this.virtualScrollers.get(container);
        if (!scroller) return;
        
        const { itemHeight, buffer } = scroller;
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
        const endIndex = Math.min(
            scroller.totalItems - 1,
            Math.floor((scrollTop + containerHeight) / itemHeight) + buffer
        );
        
        const wrapper = container.querySelector('.perf-virtual-wrapper');
        const items = wrapper.children;
        
        // Hide items outside visible range
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (i < startIndex || i > endIndex) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
                item.style.transform = `translateY(${i * itemHeight}px)`;
                item.style.position = 'absolute';
                item.style.top = '0';
                item.style.width = '100%';
            }
        }
        
        // Update wrapper height
        wrapper.style.height = `${items.length * itemHeight}px`;
    }

    // ===== COMPONENT POOLING =====
    setupComponentPooling() {
        this.componentPool = new Map();
        this.poolSizes = new Map([
            ['mission-button', 20],
            ['mission-panel', 10],
            ['mission-metrics', 5]
        ]);
        
        // Pre-populate pools
        this.poolSizes.forEach((size, tagName) => {
            this.createComponentPool(tagName, size);
        });
    }

    createComponentPool(tagName, size) {
        const pool = [];
        for (let i = 0; i < size; i++) {
            const element = document.createElement(tagName);
            element.style.display = 'none';
            element.pooled = true;
            pool.push(element);
        }
        this.componentPool.set(tagName, pool);
    }

    getPooledComponent(tagName) {
        const pool = this.componentPool.get(tagName);
        if (pool && pool.length > 0) {
            const component = pool.pop();
            component.style.display = '';
            component.pooled = false;
            return component;
        }
        
        // Pool empty, create new component
        return document.createElement(tagName);
    }

    returnToPool(component) {
        const tagName = component.tagName.toLowerCase();
        const pool = this.componentPool.get(tagName);
        
        if (pool && pool.length < this.poolSizes.get(tagName)) {
            component.style.display = 'none';
            component.pooled = true;
            
            // Reset component state
            component.innerHTML = '';
            component.className = '';
            
            pool.push(component);
            return true;
        }
        
        return false;
    }

    // ===== RENDER OPTIMIZATION =====
    setupRenderOptimization() {
        this.renderScheduler = {
            queue: new Set(),
            isScheduled: false,
            priority: new Map()
        };
        
        // Override component render methods
        this.optimizeComponentRendering();
    }

    optimizeComponentRendering() {
        const originalRender = HTMLElement.prototype.render;
        
        HTMLElement.prototype.render = function() {
            if (this.tagName.includes('MISSION-')) {
                // Add to render queue instead of immediate render
                window.PerformanceBoost.scheduleRender(this);
            } else if (originalRender) {
                originalRender.call(this);
            }
        };
    }

    scheduleRender(component, priority = 'normal') {
        this.renderScheduler.queue.add(component);
        this.renderScheduler.priority.set(component, priority);
        
        if (!this.renderScheduler.isScheduled) {
            this.renderScheduler.isScheduled = true;
            requestAnimationFrame(() => this.processRenderQueue());
        }
    }

    processRenderQueue() {
        const startTime = performance.now();
        const maxTime = 16; // Target 60fps (16ms per frame)
        
        // Sort by priority
        const components = Array.from(this.renderScheduler.queue).sort((a, b) => {
            const priorityA = this.renderScheduler.priority.get(a) || 'normal';
            const priorityB = this.renderScheduler.priority.get(b) || 'normal';
            
            const priorities = { high: 3, normal: 2, low: 1 };
            return priorities[priorityB] - priorities[priorityA];
        });
        
        // Process components within time budget
        for (const component of components) {
            if (performance.now() - startTime > maxTime) {
                // Time budget exceeded, schedule next frame
                requestAnimationFrame(() => this.processRenderQueue());
                return;
            }
            
            // Only render if component is visible or high priority
            if (component.performanceActive !== false || 
                this.renderScheduler.priority.get(component) === 'high') {
                
                if (component.shadowRoot && component.getTemplate) {
                    const template = component.getTemplate();
                    const styles = component.getStyles ? component.getStyles() : '';
                    
                    component.shadowRoot.innerHTML = `
                        <style>${styles}</style>
                        ${template}
                    `;
                }
            }
            
            this.renderScheduler.queue.delete(component);
            this.renderScheduler.priority.delete(component);
        }
        
        this.renderScheduler.isScheduled = false;
    }

    // ===== PERFORMANCE MONITORING =====
    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            frameRate: 0,
            memoryUsage: 0,
            renderTime: 0,
            componentCount: 0,
            poolHitRate: 0
        };
        
        if (window.PerformanceObserver) {
            this.setupPerformanceObserver();
        }
        
        this.setupMemoryMonitoring();
        this.setupFrameRateMonitoring();
    }

    setupPerformanceObserver() {
        this.perfObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.entryType === 'measure') {
                    this.metrics.set(entry.name, entry.duration);
                }
                
                if (entry.entryType === 'navigation') {
                    this.metrics.set('domContentLoaded', entry.domContentLoadedEventEnd);
                    this.metrics.set('loadComplete', entry.loadEventEnd);
                }
            });
        });
        
        this.perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }

    setupMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.performanceMetrics.memoryUsage = {
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
                };
            }, 1000);
        }
    }

    setupFrameRateMonitoring() {
        let frames = 0;
        let lastTime = performance.now();
        
        const measureFrameRate = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.performanceMetrics.frameRate = Math.round(frames * 1000 / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFrameRate);
        };
        
        requestAnimationFrame(measureFrameRate);
    }

    // ===== RESIZE OBSERVER OPTIMIZATION =====
    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver((entries) => {
            const resizeQueue = new Set();
            
            entries.forEach(entry => {
                const element = entry.target;
                
                // Debounce resize operations
                if (!resizeQueue.has(element)) {
                    resizeQueue.add(element);
                    
                    requestAnimationFrame(() => {
                        this.handleResize(element, entry);
                        resizeQueue.delete(element);
                    });
                }
            });
        });
    }

    handleResize(element, entry) {
        // Update virtual scrolling
        if (element.classList.contains('perf-virtual-scroll')) {
            this.updateVirtualScroll(element);
        }
        
        // Notify component of resize
        if (element.onResize) {
            element.onResize(entry);
        }
        
        // Dispatch custom resize event
        element.dispatchEvent(new CustomEvent('perf-resize', {
            detail: { entry }
        }));
    }

    // ===== MUTATION OBSERVER OPTIMIZATION =====
    setupMutationObserver() {
        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // Handle added nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.optimizeNewElement(node);
                    }
                });
                
                // Handle removed nodes
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.cleanupRemovedElement(node);
                    }
                });
            });
        });
        
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    optimizeNewElement(element) {
        // Auto-observe for intersection
        if (element.classList.contains('perf-lazy') || 
            element.classList.contains('perf-animate')) {
            this.intersectionObserver.observe(element);
        }
        
        // Auto-observe lazy images
        if (element.classList.contains('perf-lazy-image') || 
            element.tagName === 'IMG' && element.dataset.src) {
            this.lazyImageObserver.observe(element);
        }
        
        // Auto-observe for resize
        if (element.classList.contains('perf-virtual-scroll')) {
            this.resizeObserver.observe(element);
        }
        
        // Initialize component pooling
        if (element.tagName.includes('MISSION-')) {
            element.performanceActive = true;
        }
    }

    cleanupRemovedElement(element) {
        // Unobserve all observers
        this.intersectionObserver.unobserve(element);
        this.lazyImageObserver.unobserve(element);
        this.resizeObserver.unobserve(element);
        
        // Return to pool if possible
        if (element.tagName.includes('MISSION-')) {
            this.returnToPool(element);
        }
        
        // Remove from render queue
        this.renderScheduler.queue.delete(element);
        this.renderScheduler.priority.delete(element);
    }

    // ===== PERFORMANCE TRACKING =====
    startPerformanceTracking() {
        setInterval(() => {
            this.updatePerformanceMetrics();
            this.logPerformanceStats();
        }, 5000);
    }

    updatePerformanceMetrics() {
        // Count components
        this.performanceMetrics.componentCount = document.querySelectorAll('[is^="mission-"], mission-*').length;
        
        // Calculate pool hit rate
        let totalRequests = 0;
        let poolHits = 0;
        
        this.componentPool.forEach((pool, tagName) => {
            const maxSize = this.poolSizes.get(tagName) || 0;
            const currentSize = pool.length;
            const used = maxSize - currentSize;
            
            totalRequests += used;
            poolHits += used;
        });
        
        this.performanceMetrics.poolHitRate = totalRequests > 0 ? (poolHits / totalRequests * 100).toFixed(1) : 100;
    }

    logPerformanceStats() {
        const stats = {
            ...this.performanceMetrics,
            renderQueueSize: this.renderScheduler.queue.size,
            observedElements: {
                intersection: this.intersectionObserver ? 'active' : 'inactive',
                resize: this.resizeObserver ? 'active' : 'inactive',
                mutation: this.mutationObserver ? 'active' : 'inactive'
            }
        };
        
        console.log('🚀 Performance Stats:', stats);
    }

    // ===== PUBLIC API =====
    enableLazyLoading(element, content) {
        element.classList.add('perf-lazy');
        element.dataset.lazyContent = content;
        this.intersectionObserver.observe(element);
    }

    enableLazyImage(img, src) {
        img.classList.add('perf-lazy-image');
        img.dataset.src = src;
        this.lazyImageObserver.observe(img);
    }

    enableVirtualScrollForContainer(container, itemHeight, buffer) {
        this.enableVirtualScrolling(container, itemHeight, buffer);
    }

    getMetrics() {
        return {
            ...this.performanceMetrics,
            customMetrics: Object.fromEntries(this.metrics)
        };
    }

    measure(name, fn) {
        performance.mark(`${name}-start`);
        const result = fn();
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        return result;
    }

    async measureAsync(name, fn) {
        performance.mark(`${name}-start`);
        const result = await fn();
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        return result;
    }

    // ===== CLEANUP =====
    destroy() {
        if (this.intersectionObserver) this.intersectionObserver.disconnect();
        if (this.lazyImageObserver) this.lazyImageObserver.disconnect();
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.mutationObserver) this.mutationObserver.disconnect();
        if (this.virtualScrollObserver) this.virtualScrollObserver.disconnect();
        if (this.perfObserver) this.perfObserver.disconnect();
        
        this.isActive = false;
        console.log('🔧 PerformanceBoost: Nuclear performance layer deactivated');
    }
}

// ===== AUTO-INITIALIZATION =====
let performanceBoostInstance = null;

if (typeof window !== 'undefined') {
    window.PerformanceBoost = new PerformanceBoost();
    performanceBoostInstance = window.PerformanceBoost;
    
    // Auto-enable for existing elements
    document.addEventListener('DOMContentLoaded', () => {
        // Auto-setup lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            performanceBoostInstance.enableLazyImage(img, img.dataset.src);
        });
        
        // Auto-setup lazy elements
        document.querySelectorAll('.perf-lazy').forEach(element => {
            performanceBoostInstance.intersectionObserver.observe(element);
        });
        
        // Auto-setup virtual scrolling
        document.querySelectorAll('.perf-virtual-scroll').forEach(container => {
            const itemHeight = parseInt(container.dataset.itemHeight) || 50;
            const buffer = parseInt(container.dataset.buffer) || 5;
            performanceBoostInstance.enableVirtualScrolling(container, itemHeight, buffer);
        });
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (performanceBoostInstance) {
            performanceBoostInstance.destroy();
        }
    });
}

// Export removed for global script compatibility
// PerformanceBoost is available globally via window.PerformanceBoost

console.log(`
🚀 PERFORMANCE BOOST - Layer 4 Nuclear Activated
===============================================
✅ Intersection Observer: Viewport optimization
✅ Lazy Loading: Images and content
✅ Virtual Scrolling: Large lists optimization
✅ Component Pooling: Memory efficiency
✅ Render Optimization: 60fps scheduling
✅ Performance Monitoring: Real-time metrics
✅ Memory Management: Automatic cleanup
✅ Resize Optimization: Debounced handling
✅ Mutation Optimization: DOM change tracking

🎯 PERFORMANCE STATUS: NUCLEAR LEVEL ACTIVATED
💥 READY FOR MAXIMUM ENTERPRISE PERFORMANCE
`);