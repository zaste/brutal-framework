# Code Splitting Pattern

## Problem
Loading all application code upfront hurts initial performance. Large bundles with features users may never use waste bandwidth and parsing time.

## Solution
Intelligent code splitting that loads code on-demand, with specific strategies for locales, routes, and features.

### Locale-Based Splitting
```javascript
// @brutal/i18n/plugins/locale-splitter/
export function localeSplitter() {
  return {
    name: 'locale-splitter',
    resolveId(id) {
      if (id.startsWith('locale:')) {
        const locale = id.slice(7);
        return `\0locale-${locale}`;
      }
    },
    load(id) {
      if (id.startsWith('\0locale-')) {
        const locale = id.slice(8);
        return `
          export default () => import('./locales/${locale}.json')
            .then(m => m.default);
        `;
      }
    },
    generateBundle(options, bundle) {
      // Create separate chunks for each locale
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.includes('locale-')) {
          chunk.isDynamicEntry = true;
          chunk.facadeModuleId = fileName;
        }
      }
    }
  };
}
```

### Route-Based Splitting
```javascript
// Automatic route code splitting
export class RouteCodeSplitter {
  transformRoutes(routes: Route[]): Route[] {
    return routes.map(route => ({
      ...route,
      // Convert component to lazy import
      component: () => import(
        /* webpackChunkName: "[request]" */
        `./routes/${route.name}`
      ),
      // Prefetch on hover/focus
      prefetch: route.prefetch ?? true
    }));
  }
  
  setupPrefetching() {
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        const route = link.dataset.route;
        this.prefetchRoute(route);
      }
    });
  }
  
  prefetchRoute(routeName: string) {
    const route = this.routes.find(r => r.name === routeName);
    if (route && !route.loaded) {
      // Use low priority prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/chunks/route-${routeName}.js`;
      document.head.appendChild(link);
    }
  }
}
```

### Feature-Based Splitting
```javascript
// Split by feature usage
export class FeatureSplitter {
  // Heavy features loaded on-demand
  private features = {
    charts: () => import('@brutal/charts'),
    editor: () => import('@brutal/editor'),
    animations: () => import('@brutal/animation'),
    gpu: () => import('@brutal/gpu')
  };
  
  async loadFeature(name: string) {
    if (!this.features[name]) {
      throw new Error(`Unknown feature: ${name}`);
    }
    
    // Show loading state
    this.showLoading(name);
    
    try {
      const module = await this.features[name]();
      this.featureCache.set(name, module);
      return module;
    } finally {
      this.hideLoading(name);
    }
  }
  
  // Intersection Observer for viewport-based loading
  setupViewportLoading() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const feature = entry.target.dataset.feature;
          this.loadFeature(feature);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '50px' });
    
    document.querySelectorAll('[data-feature]').forEach(el => {
      observer.observe(el);
    });
  }
}
```

### Bundle Analysis
```javascript
// Webpack bundle analyzer config
module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      generateStatsFile: true,
      statsOptions: {
        chunks: true,
        modules: true,
        chunkModules: true,
        chunkOrigins: true
      }
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

## Evolution
- V3: Single monolithic bundle
- V4: Basic route splitting
- V5: Intelligent multi-strategy splitting

## Trade-offs
- ✅ Faster initial load
- ✅ Load only what's needed
- ✅ Better caching
- ✅ Reduced memory usage
- ❌ Network waterfall risk
- ❌ Complexity increase

## Related
- [Bundle Optimization](../build/bundle-optimization.md)
- [Performance Budgets](./performance-budgets.md)
- [Asset Fingerprinting](../build/asset-fingerprinting.md)