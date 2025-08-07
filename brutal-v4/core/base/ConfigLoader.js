/**
 * BRUTAL V4 - Configuration Loader
 * Loads and manages global configuration
 * Environment detection and feature flags
 */

import { EventBus } from '../events/EventBus.js';

let globalConfig = {
    debug: false,
    environment: 'production',
    features: {},
    plugins: [],
    performance: {
        renderBatching: true,
        lazyComponents: true,
        workerOffload: true
    }
};

export class ConfigLoader {
    static eventBus = new EventBus();

    static async load(configPath = './brutal.config.js') {
        try {
            // Try to load config file
            const module = await import(configPath);
            const config = module.default || module.config;
            
            if (config) {
                this.merge(config);
            }
        } catch (error) {
            // Config file optional, use defaults
            console.info('No config file found, using defaults');
        }

        // Detect environment
        this._detectEnvironment();

        // Emit config loaded event
        this.eventBus.emit('config:loaded', globalConfig);

        return globalConfig;
    }

    static merge(config) {
        globalConfig = this._deepMerge(globalConfig, config);
        this.eventBus.emit('config:updated', globalConfig);
    }

    static get(path) {
        if (!path) return globalConfig;

        return path.split('.').reduce((obj, key) => 
            obj && obj[key] !== undefined ? obj[key] : undefined, 
            globalConfig
        );
    }

    static set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, globalConfig);

        target[lastKey] = value;
        this.eventBus.emit('config:changed', { path, value });
    }

    static isEnabled(feature) {
        return !!this.get(`features.${feature}`);
    }

    static _detectEnvironment() {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            globalConfig.environment = 
                hostname === 'localhost' || hostname === '127.0.0.1' 
                    ? 'development' 
                    : 'production';
            
            globalConfig.debug = globalConfig.environment === 'development';
        }
    }

    static _deepMerge(target, source) {
        const output = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this._deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }
}