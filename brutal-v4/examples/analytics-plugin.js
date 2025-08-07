/**
 * Example Analytics Plugin for BRUTAL V4
 * Demonstrates plugin system capabilities
 */

export const AnalyticsPlugin = {
    name: 'analytics',
    version: '1.0.0',
    type: 'runtime',
    dependencies: [],

    async init(context) {
        const { eventBus, afterMount, onDefineComponent } = context;

        // Track component mounts
        afterMount((element) => {
            console.log('[Analytics] Component mounted:', element.tagName);
            // Send to analytics service
        });

        // Track route changes
        eventBus.on('route:change', (data) => {
            console.log('[Analytics] Route changed:', data.path);
            // Send page view
        });

        // Track errors
        eventBus.on('error:captured', (error) => {
            console.log('[Analytics] Error tracked:', error);
            // Send error to service
        });

        // Public API
        return {
            track(event, data) {
                console.log('[Analytics] Custom event:', event, data);
                // Send custom event
            },

            identify(userId, traits) {
                console.log('[Analytics] User identified:', userId);
                // Identify user
            },

            destroy() {
                // Cleanup
                console.log('[Analytics] Plugin destroyed');
            }
        };
    }
};