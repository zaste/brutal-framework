/**
 * BRUTAL V4 - Polyfill Strategy
 * Detects and loads polyfills for missing browser features
 * Zero dependencies, progressive enhancement
 */

const polyfillCache = new Map();
const featureDetectors = new Map();

export class PolyfillStrategy {
    static {
        // Register core feature detectors
        this.registerDetector('constructableStyleSheets', () => {
            return 'adoptedStyleSheets' in Document.prototype && 
                   'CSSStyleSheet' in window && 
                   'replaceSync' in CSSStyleSheet.prototype;
        });

        this.registerDetector('requestIdleCallback', () => {
            return 'requestIdleCallback' in window;
        });

        this.registerDetector('sharedArrayBuffer', () => {
            return typeof SharedArrayBuffer !== 'undefined';
        });

        this.registerDetector('elementInternals', () => {
            return 'attachInternals' in HTMLElement.prototype;
        });

        this.registerDetector('importMaps', () => {
            const script = document.createElement('script');
            return 'importmap' in script;
        });

        this.registerDetector('containerQueries', () => {
            return CSS && CSS.supports && CSS.supports('container-type: inline-size');
        });
    }

    static registerDetector(feature, detector) {
        featureDetectors.set(feature, detector);
    }

    static detect(feature) {
        if (polyfillCache.has(feature)) {
            return polyfillCache.get(feature);
        }

        const detector = featureDetectors.get(feature);
        const result = detector ? detector() : false;
        polyfillCache.set(feature, result);
        return result;
    }

    static async load(feature) {
        if (this.detect(feature)) return true;

        // Define polyfill URLs/implementations
        const polyfills = {
            'requestIdleCallback': () => {
                window.requestIdleCallback = window.requestIdleCallback || function(cb) {
                    return setTimeout(() => cb({ timeRemaining: () => 50 }), 0);
                };
                window.cancelIdleCallback = window.cancelIdleCallback || clearTimeout;
            }
        };

        const polyfill = polyfills[feature];
        if (polyfill) {
            await polyfill();
            polyfillCache.set(feature, true);
            return true;
        }

        return false;
    }

    static requires(features) {
        return features.filter(f => !this.detect(f));
    }
}