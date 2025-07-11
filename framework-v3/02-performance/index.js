/**
 * BRUTAL Framework V3 - Performance Gems
 * 7 optimizations for 10-100x performance improvements
 */

// Performance Gem #1: Zero-parse styling with Constructable Stylesheets
export { 
  StyleManager, 
  styleManager,
  createStyles,
  applyStyles,
  createSharedStyles,
  createGlobalStyles
} from './01-StyleManager.js';

// Performance Gem #2: Pre-warmed DOM fragments
export {
  FragmentPool,
  fragmentPool,
  checkoutFragment,
  checkinFragment,
  withFragment
} from './02-FragmentPool.js';

// Performance Gem #3: Batched DOM operations
export {
  DOMScheduler,
  domScheduler,
  schedule,
  read,
  write,
  measure,
  batch,
  defer,
  immediate
} from './03-DOMScheduler.js';

// Performance Gem #4: Content-addressable template caching
export {
  TemplateCache,
  templateCache,
  getTemplate,
  precompileTemplate,
  createTemplateFactory
} from './04-TemplateCache.js';

// Performance Gem #5: Single listener event delegation
export {
  EventManager,
  eventManager,
  on,
  off,
  once,
  emit
} from './05-EventManager.js';

// Performance Gem #6: Reactive CSS Variables
export {
  ThemeEngine,
  themeEngine,
  registerTheme,
  applyTheme,
  toggleTheme,
  observeTheme
} from './06-ThemeEngine.js';

// Performance Gem #7: Automatic layout optimization
export {
  LayoutOptimizer,
  layoutOptimizer,
  optimizeLayout,
  batchOptimizeLayout,
  observeLayout
} from './07-LayoutOptimizer.js';

// Import singleton instances for init function and performance object
import { styleManager } from './01-StyleManager.js';
import { fragmentPool } from './02-FragmentPool.js';
import { domScheduler } from './03-DOMScheduler.js';
import { templateCache } from './04-TemplateCache.js';
import { eventManager } from './05-EventManager.js';
import { themeEngine } from './06-ThemeEngine.js';
import { layoutOptimizer } from './07-LayoutOptimizer.js';

// Initialize all performance gems
export function initPerformanceGems(options = {}) {
  // Warm up fragment pool
  if (options.fragmentPool !== false) {
    fragmentPool.warmup();
  }
  
  // Start layout observation
  if (options.layoutOptimizer !== false) {
    layoutOptimizer.observe();
  }
  
  // Set up global event delegation
  if (options.eventManager !== false) {
    // Event manager is already initialized
  }
  
  // Log initialization
  if (window.__BRUTAL__?.debug) {
    }
}

// Performance utilities
export const performance = {
  // Get all metrics
  getMetrics() {
    return {
      styleManager: styleManager.getMetrics(),
      fragmentPool: fragmentPool.getMetrics(),
      domScheduler: domScheduler.getMetrics(),
      templateCache: templateCache.getMetrics(),
      eventManager: eventManager.getMetrics(),
      themeEngine: themeEngine.getMetrics(),
      layoutOptimizer: layoutOptimizer.getMetrics()
    };
  },
  
  // Reset all metrics
  resetMetrics() {
    // Most gems don't have reset methods, but we can clear caches
    if (templateCache) templateCache.clear();
    if (fragmentPool) fragmentPool.clear();
    if (domScheduler) domScheduler.clear();
    if (styleManager) styleManager.clearCache();
  },
  
  // Enable performance monitoring
  monitor() {
    const metrics = this.getMetrics();
    console.table(metrics);
    return metrics;
  }
};