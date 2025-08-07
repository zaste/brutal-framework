/**
 * BRUTAL V4 - Feature Detection Utilities
 * Browser capability detection for progressive enhancement
 */

import { devLog, devWarn } from '../../build/env.js';

/**
 * Feature detection for modern web APIs
 */
export class FeatureDetection {
    static cache = new Map();
    
    /**
     * Check if a feature is supported (with caching)
     */
    static isSupported(feature) {
        if (this.cache.has(feature)) {
            return this.cache.get(feature);
        }
        
        const supported = this.detectFeature(feature);
        this.cache.set(feature, supported);
        
        if (!supported) {
            devWarn(`Feature not supported: ${feature}`);
        }
        
        return supported;
    }
    
    /**
     * Detect specific feature
     */
    static detectFeature(feature) {
        switch (feature) {
            case 'customElements':
                return 'customElements' in window;
                
            case 'shadowDOM':
                return 'attachShadow' in Element.prototype;
                
            case 'template':
                return 'content' in document.createElement('template');
                
            case 'proxy':
                return typeof Proxy !== 'undefined';
                
            case 'constructableStyleSheets':
                return typeof CSSStyleSheet !== 'undefined' && 
                       'replaceSync' in CSSStyleSheet.prototype;
                
            case 'adoptedStyleSheets':
                return 'adoptedStyleSheets' in Document.prototype;
                
            case 'elementInternals':
                return 'attachInternals' in HTMLElement.prototype;
                
            case 'formAssociated':
                return 'ElementInternals' in window;
                
            case 'webWorkers':
                return typeof Worker !== 'undefined';
                
            case 'sharedWorkers':
                return typeof SharedWorker !== 'undefined';
                
            case 'serviceWorker':
                return 'serviceWorker' in navigator;
                
            case 'moduleWorkers':
                try {
                    new Worker('data:,', { type: 'module' });
                    return true;
                } catch {
                    return false;
                }
                
            case 'sharedArrayBuffer':
                return typeof SharedArrayBuffer !== 'undefined';
                
            case 'atomics':
                return typeof Atomics !== 'undefined';
                
            case 'bigInt':
                return typeof BigInt !== 'undefined';
                
            case 'webGL':
                try {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch {
                    return false;
                }
                
            case 'webGL2':
                try {
                    const canvas = document.createElement('canvas');
                    return !!canvas.getContext('webgl2');
                } catch {
                    return false;
                }
                
            case 'webGPU':
                return 'gpu' in navigator;
                
            case 'intersectionObserver':
                return 'IntersectionObserver' in window;
                
            case 'resizeObserver':
                return 'ResizeObserver' in window;
                
            case 'mutationObserver':
                return 'MutationObserver' in window;
                
            case 'performanceObserver':
                return 'PerformanceObserver' in window;
                
            case 'navigation':
                return 'navigation' in window;
                
            case 'importMaps':
                try {
                    const script = document.createElement('script');
                    script.type = 'importmap';
                    return script.type === 'importmap';
                } catch {
                    return false;
                }
                
            case 'topLevelAwait':
                // Can't reliably detect, assume true for modern browsers
                return true;
                
            case 'dynamicImport':
                try {
                    new Function('return import("")');
                    return true;
                } catch {
                    return false;
                }
                
            case 'esModules':
                try {
                    const script = document.createElement('script');
                    return 'noModule' in script;
                } catch {
                    return false;
                }
                
            case 'asyncIterators':
                try {
                    new Function('(async function*(){})');
                    return true;
                } catch {
                    return false;
                }
                
            case 'weakRefs':
                return typeof WeakRef !== 'undefined' && 
                       typeof FinalizationRegistry !== 'undefined';
                
            case 'requestIdleCallback':
                return 'requestIdleCallback' in window;
                
            case 'offscreenCanvas':
                return typeof OffscreenCanvas !== 'undefined';
                
            case 'webAssembly':
                return typeof WebAssembly !== 'undefined';
                
            case 'webAssemblyStreaming':
                return typeof WebAssembly !== 'undefined' && 
                       'instantiateStreaming' in WebAssembly;
                
            default:
                return false;
        }
    }
    
    /**
     * Get all features status
     */
    static getAllFeatures() {
        const features = [
            'customElements', 'shadowDOM', 'template', 'proxy',
            'constructableStyleSheets', 'adoptedStyleSheets',
            'elementInternals', 'formAssociated',
            'webWorkers', 'sharedWorkers', 'serviceWorker', 'moduleWorkers',
            'sharedArrayBuffer', 'atomics', 'bigInt',
            'webGL', 'webGL2', 'webGPU',
            'intersectionObserver', 'resizeObserver', 'mutationObserver', 'performanceObserver',
            'navigation', 'importMaps', 'dynamicImport', 'esModules',
            'asyncIterators', 'weakRefs', 'requestIdleCallback',
            'offscreenCanvas', 'webAssembly', 'webAssemblyStreaming'
        ];
        
        const status = {};
        features.forEach(feature => {
            status[feature] = this.isSupported(feature);
        });
        
        return status;
    }
    
    /**
     * Check if SharedArrayBuffer is available with proper headers
     */
    static checkSharedArrayBuffer() {
        // Basic support check
        if (!this.isSupported('sharedArrayBuffer')) {
            return {
                supported: false,
                reason: 'SharedArrayBuffer not defined'
            };
        }
        
        // Check if we can actually create one
        try {
            const sab = new SharedArrayBuffer(1);
            
            // Check if we can use it with Atomics
            if (this.isSupported('atomics')) {
                const view = new Int32Array(sab);
                Atomics.store(view, 0, 123);
                const value = Atomics.load(view, 0);
                
                if (value === 123) {
                    return {
                        supported: true,
                        crossOriginIsolated: self.crossOriginIsolated || false
                    };
                }
            }
            
            return {
                supported: true,
                atomicsSupported: false
            };
            
        } catch (error) {
            return {
                supported: false,
                reason: error.message,
                crossOriginIsolated: self.crossOriginIsolated || false
            };
        }
    }
    
    /**
     * Get browser info
     */
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        const info = {
            userAgent: ua,
            vendor: navigator.vendor,
            platform: navigator.platform,
            language: navigator.language,
            onLine: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: navigator.deviceMemory || 'unknown',
            connection: this.getConnectionInfo()
        };
        
        return info;
    }
    
    /**
     * Get connection info
     */
    static getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData || false
            };
        }
        return null;
    }
    
    /**
     * Create feature-based polyfill recommendations
     */
    static getPolyfillRecommendations() {
        const recommendations = [];
        
        if (!this.isSupported('customElements')) {
            recommendations.push({
                feature: 'Custom Elements',
                polyfill: '@webcomponents/custom-elements'
            });
        }
        
        if (!this.isSupported('shadowDOM')) {
            recommendations.push({
                feature: 'Shadow DOM',
                polyfill: '@webcomponents/shadydom'
            });
        }
        
        if (!this.isSupported('template')) {
            recommendations.push({
                feature: 'Template Element',
                polyfill: '@webcomponents/template'
            });
        }
        
        if (!this.isSupported('intersectionObserver')) {
            recommendations.push({
                feature: 'Intersection Observer',
                polyfill: 'intersection-observer'
            });
        }
        
        if (!this.isSupported('resizeObserver')) {
            recommendations.push({
                feature: 'Resize Observer',
                polyfill: '@juggle/resize-observer'
            });
        }
        
        return recommendations;
    }
}

// Export convenience functions
export const isSupported = (feature) => FeatureDetection.isSupported(feature);
export const checkSharedArrayBuffer = () => FeatureDetection.checkSharedArrayBuffer();
export const getAllFeatures = () => FeatureDetection.getAllFeatures();
export const getBrowserInfo = () => FeatureDetection.getBrowserInfo();