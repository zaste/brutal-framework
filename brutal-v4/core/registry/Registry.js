/**
 * BRUTAL V4 - Component Registry
 * Native web component registration and management
 * Zero dependencies, pure web standards
 */

/**
 * BrutalRegistry - Component registration and lifecycle management
 * Manages custom element definitions, lazy loading, and component metadata
 * 
 * Features:
 * - Component registration with validation
 * - Lazy loading support
 * - Component metadata tracking
 * - Performance monitoring
 * - Dependency management
 * - Version control
 */
export class BrutalRegistry {
    static components = new Map();
    static loadingComponents = new Map();
    static dependencyGraph = new Map();
    static stats = {
        registrations: 0,
        successful: 0,
        failed: 0,
        lazyLoaded: 0
    };
    
    /**
     * Register a component
     */
    static define(name, ComponentClass, options = {}) {
        const startTime = performance.now();
        
        try {
            // Validate component name
            this.validateComponentName(name);
            
            // Validate component class
            this.validateComponentClass(name, ComponentClass);
            
            // Check if already defined
            if (customElements.get(name)) {
                console.warn(`[BrutalRegistry] Component '${name}' is already defined`);
                return false;
            }
            
            // Register with browser
            customElements.define(name, ComponentClass);
            
            // Store component metadata
            const metadata = {
                name,
                class: ComponentClass,
                options: { ...options },
                registered: new Date(),
                registrationTime: performance.now() - startTime,
                version: options.version || '1.0.0',
                dependencies: options.dependencies || [],
                lazy: options.lazy || false,
                instances: 0,
                errors: 0
            };
            
            this.components.set(name, metadata);
            
            // Track dependencies
            if (metadata.dependencies.length > 0) {
                this.dependencyGraph.set(name, metadata.dependencies);
            }
            
            // Update stats
            this.stats.registrations++;
            this.stats.successful++;
            
            // Emit registration event
            this.emitEvent('component-registered', {
                name,
                metadata
            });
            
            console.log(`[BrutalRegistry] Component '${name}' registered successfully`);
            return true;
            
        } catch (error) {
            this.stats.failed++;
            
            console.error(`[BrutalRegistry] Failed to register component '${name}':`, error);
            
            this.emitEvent('component-registration-failed', {
                name,
                error: error.message
            });
            
            throw error;
        }
    }
    
    /**
     * Register component with lazy loading
     */
    static defineLazy(name, loader, options = {}) {
        // Validate inputs
        this.validateComponentName(name);
        
        if (typeof loader !== 'function') {
            throw new Error(`[BrutalRegistry] Loader for '${name}' must be a function`);
        }
        
        // Create placeholder class
        class LazyComponent extends HTMLElement {
            constructor() {
                super();
                this.setAttribute('data-brutal-lazy', name);
                BrutalRegistry.loadComponent(name);
            }
        }
        
        // Register placeholder
        try {
            customElements.define(name, LazyComponent);
            
            // Store lazy loading info
            this.loadingComponents.set(name, {
                loader,
                options: { ...options, lazy: true },
                requested: false,
                loading: false,
                loaded: false
            });
            
            this.stats.registrations++;
            
            console.log(`[BrutalRegistry] Lazy component '${name}' registered`);
            return true;
            
        } catch (error) {
            this.stats.failed++;
            throw error;
        }
    }
    
    /**
     * Load lazy component
     */
    static async loadComponent(name) {
        const lazyInfo = this.loadingComponents.get(name);
        
        if (!lazyInfo) {
            throw new Error(`[BrutalRegistry] No lazy component found for '${name}'`);
        }
        
        if (lazyInfo.loaded) {
            return; // Already loaded
        }
        
        if (lazyInfo.loading) {
            // Wait for current loading to complete
            return new Promise((resolve) => {
                const checkLoaded = () => {
                    if (lazyInfo.loaded) {
                        resolve();
                    } else {
                        setTimeout(checkLoaded, 10);
                    }
                };
                checkLoaded();
            });
        }
        
        lazyInfo.loading = true;
        const startTime = performance.now();
        
        try {
            // Load component
            const ComponentClass = await lazyInfo.loader();
            
            // Validate loaded component
            this.validateComponentClass(name, ComponentClass);
            
            // Update registry with actual component
            const metadata = {
                name,
                class: ComponentClass,
                options: lazyInfo.options,
                registered: new Date(),
                registrationTime: performance.now() - startTime,
                version: lazyInfo.options.version || '1.0.0',
                dependencies: lazyInfo.options.dependencies || [],
                lazy: true,
                loadTime: performance.now() - startTime,
                instances: 0,
                errors: 0
            };
            
            this.components.set(name, metadata);
            lazyInfo.loaded = true;
            
            // Update stats
            this.stats.lazyLoaded++;
            
            // Emit event
            this.emitEvent('component-lazy-loaded', {
                name,
                metadata,
                loadTime: metadata.loadTime
            });
            
            console.log(`[BrutalRegistry] Lazy component '${name}' loaded in ${metadata.loadTime.toFixed(2)}ms`);
            
        } catch (error) {
            lazyInfo.loading = false;
            this.stats.failed++;
            
            console.error(`[BrutalRegistry] Failed to load lazy component '${name}':`, error);
            
            this.emitEvent('component-lazy-load-failed', {
                name,
                error: error.message
            });
            
            throw error;
        }
    }
    
    /**
     * Get component metadata
     */
    static get(name) {
        return this.components.get(name);
    }
    
    /**
     * Check if component is registered
     */
    static has(name) {
        return this.components.has(name) || customElements.get(name) !== undefined;
    }
    
    /**
     * Check if component is ready (not lazy loading)
     */
    static isReady(name) {
        const metadata = this.components.get(name);
        return metadata && !metadata.lazy || customElements.get(name) !== undefined;
    }
    
    /**
     * Wait for component to be ready
     */
    static async whenReady(name) {
        // Check if it's a lazy component
        const lazyInfo = this.loadingComponents.get(name);
        if (lazyInfo && !lazyInfo.loaded) {
            await this.loadComponent(name);
        }
        
        // Wait for custom element definition
        return customElements.whenDefined(name);
    }
    
    /**
     * List all registered components
     */
    static list() {
        return Array.from(this.components.keys());
    }
    
    /**
     * Get all component metadata
     */
    static getAll() {
        return Array.from(this.components.values());
    }
    
    /**
     * Get components by criteria
     */
    static find(criteria) {
        const components = Array.from(this.components.values());
        
        return components.filter(component => {
            for (const [key, value] of Object.entries(criteria)) {
                if (component[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
    
    /**
     * Get component dependencies
     */
    static getDependencies(name) {
        return this.dependencyGraph.get(name) || [];
    }
    
    /**
     * Get components that depend on given component
     */
    static getDependents(name) {
        const dependents = [];
        
        for (const [component, deps] of this.dependencyGraph) {
            if (deps.includes(name)) {
                dependents.push(component);
            }
        }
        
        return dependents;
    }
    
    /**
     * Validate component dependencies
     */
    static async validateDependencies(name) {
        const dependencies = this.getDependencies(name);
        const missing = [];
        
        for (const dep of dependencies) {
            if (!this.has(dep)) {
                missing.push(dep);
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`[BrutalRegistry] Component '${name}' has missing dependencies: ${missing.join(', ')}`);
        }
        
        // Wait for all dependencies to be ready
        await Promise.all(dependencies.map(dep => this.whenReady(dep)));
    }
    
    /**
     * Get registry statistics
     */
    static getStats() {
        return {
            ...this.stats,
            totalComponents: this.components.size,
            lazyComponents: this.loadingComponents.size,
            dependencies: this.dependencyGraph.size,
            successRate: this.stats.registrations > 0 
                ? (this.stats.successful / this.stats.registrations * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    
    /**
     * Track component instance creation
     */
    static trackInstance(name) {
        const metadata = this.components.get(name);
        if (metadata) {
            metadata.instances++;
        }
    }
    
    /**
     * Track component error
     */
    static trackError(name, error) {
        const metadata = this.components.get(name);
        if (metadata) {
            metadata.errors++;
        }
        
        this.emitEvent('component-error', {
            name,
            error: error.message,
            timestamp: new Date()
        });
    }
    
    /**
     * Validate component name
     */
    static validateComponentName(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('[BrutalRegistry] Component name must be a non-empty string');
        }
        
        if (!name.includes('-')) {
            throw new Error(`[BrutalRegistry] Component name '${name}' must contain a hyphen`);
        }
        
        if (!/^[a-z]([a-z0-9]*-)*[a-z0-9]+$/.test(name)) {
            throw new Error(`[BrutalRegistry] Component name '${name}' contains invalid characters`);
        }
    }
    
    /**
     * Validate component class
     */
    static validateComponentClass(name, ComponentClass) {
        if (!ComponentClass || typeof ComponentClass !== 'function') {
            throw new Error(`[BrutalRegistry] Component '${name}' must be a constructor function`);
        }
        
        if (!(ComponentClass.prototype instanceof HTMLElement)) {
            throw new Error(`[BrutalRegistry] Component '${name}' must extend HTMLElement`);
        }
    }
    
    /**
     * Emit registry event
     */
    static emitEvent(type, detail) {
        const event = new CustomEvent(`brutal:registry:${type}`, {
            detail,
            bubbles: true,
            composed: true
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Clear registry (for testing)
     */
    static clear() {
        this.components.clear();
        this.loadingComponents.clear();
        this.dependencyGraph.clear();
        this.stats = {
            registrations: 0,
            successful: 0,
            failed: 0,
            lazyLoaded: 0
        };
    }
    
    /**
     * Export registry data
     */
    static export() {
        return {
            components: Array.from(this.components.entries()),
            lazyComponents: Array.from(this.loadingComponents.entries()),
            dependencies: Array.from(this.dependencyGraph.entries()),
            stats: this.stats,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Generate registry report
     */
    static generateReport() {
        const stats = this.getStats();
        const components = this.getAll();
        
        return {
            summary: stats,
            components: components.map(comp => ({
                name: comp.name,
                version: comp.version,
                lazy: comp.lazy,
                instances: comp.instances,
                errors: comp.errors,
                dependencies: this.getDependencies(comp.name),
                dependents: this.getDependents(comp.name)
            })),
            performance: {
                averageRegistrationTime: components.reduce((acc, comp) => 
                    acc + comp.registrationTime, 0) / components.length || 0,
                slowestRegistration: Math.max(...components.map(comp => comp.registrationTime), 0),
                fastestRegistration: Math.min(...components.map(comp => comp.registrationTime), Infinity)
            }
        };
    }
}

/**
 * Registry utilities
 */
export const RegistryUtils = {
    /**
     * Bulk register components
     */
    async bulkDefine(components) {
        const results = [];
        
        for (const [name, ComponentClass, options] of components) {
            try {
                BrutalRegistry.define(name, ComponentClass, options);
                results.push({ name, success: true });
            } catch (error) {
                results.push({ name, success: false, error: error.message });
            }
        }
        
        return results;
    },
    
    /**
     * Wait for multiple components
     */
    async waitForComponents(names) {
        return Promise.all(names.map(name => BrutalRegistry.whenReady(name)));
    },
    
    /**
     * Check component compatibility
     */
    checkCompatibility(name, version) {
        const metadata = BrutalRegistry.get(name);
        
        if (!metadata) {
            return { compatible: false, reason: 'Component not found' };
        }
        
        if (metadata.version !== version) {
            return { 
                compatible: false, 
                reason: `Version mismatch: expected ${version}, found ${metadata.version}` 
            };
        }
        
        return { compatible: true };
    }
};