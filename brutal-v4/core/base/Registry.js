/**
 * BRUTAL V4 - Component Registry
 * Centralized component registration and management
 * Supports lazy loading and duplicate detection
 */

const componentRegistry = new Map();
const pendingDefinitions = new Map();
const registrationCallbacks = new Map();

export class Registry {
    static register(tagName, ComponentClass, options = {}) {
        if (!tagName || typeof tagName !== 'string') {
            throw new Error('Tag name must be a non-empty string');
        }

        if (!ComponentClass || typeof ComponentClass !== 'function') {
            throw new Error('Component class must be a constructor function');
        }

        const normalizedTag = tagName.toLowerCase();

        // Check for duplicates
        if (componentRegistry.has(normalizedTag)) {
            if (!options.override) {
                console.warn(`Component ${normalizedTag} already registered`);
                return false;
            }
        }

        // Store in registry
        componentRegistry.set(normalizedTag, {
            tagName: normalizedTag,
            class: ComponentClass,
            options,
            registered: false
        });

        // Define custom element if not lazy
        if (!options.lazy) {
            this.define(normalizedTag);
        }

        // Trigger callbacks
        this._triggerCallbacks(normalizedTag, ComponentClass);

        return true;
    }

    static define(tagName) {
        const entry = componentRegistry.get(tagName);
        if (!entry) {
            throw new Error(`Component ${tagName} not found in registry`);
        }

        if (entry.registered) {
            return true;
        }

        try {
            customElements.define(tagName, entry.class);
            entry.registered = true;
            return true;
        } catch (error) {
            console.error(`Failed to define ${tagName}:`, error);
            return false;
        }
    }

    static get(tagName) {
        const entry = componentRegistry.get(tagName.toLowerCase());
        return entry ? entry.class : null;
    }

    static has(tagName) {
        return componentRegistry.has(tagName.toLowerCase());
    }

    static isDefined(tagName) {
        const entry = componentRegistry.get(tagName.toLowerCase());
        return entry ? entry.registered : false;
    }

    static async whenDefined(tagName) {
        const normalized = tagName.toLowerCase();
        
        if (this.isDefined(normalized)) {
            return this.get(normalized);
        }

        return new Promise(resolve => {
            const callbacks = registrationCallbacks.get(normalized) || [];
            callbacks.push(resolve);
            registrationCallbacks.set(normalized, callbacks);
        });
    }

    static getAll() {
        return Array.from(componentRegistry.entries()).map(([tag, entry]) => ({
            tagName: tag,
            class: entry.class,
            registered: entry.registered,
            options: entry.options
        }));
    }

    static _triggerCallbacks(tagName, ComponentClass) {
        const callbacks = registrationCallbacks.get(tagName);
        if (callbacks) {
            callbacks.forEach(cb => cb(ComponentClass));
            registrationCallbacks.delete(tagName);
        }
    }
}