/**
 * BRUTAL V4 - Routing System
 * Native routing with enhanced features
 */

// Original router
export { BrutalRouter, RouterUtils, RouterOutlet, router as baseRouter } from './Router.js';

// Enhanced router with Registry integration
export { EnhancedBrutalRouter, router, route, navigate, back, forward } from './EnhancedRouter.js';