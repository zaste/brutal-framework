/**
 * BRUTAL Framework V3 - Performance Gem #7: LayoutOptimizer
 * Automatic contain + will-change for optimal rendering
 */

export class LayoutOptimizer {
  constructor(options = {}) {
    // Configuration
    this.autoContain = options.autoContain !== false;
    this.autoWillChange = options.autoWillChange !== false;
    this.observeThreshold = options.observeThreshold || 0.1;
    this.animationThreshold = options.animationThreshold || 100; // ms
    
    // Element tracking
    this.optimizedElements = new, WeakMap();
    this.animatingElements = new, WeakMap();
    this.intersectionTargets = new, WeakMap();
    
    // Observers
    this.intersectionObserver = null;
    this.mutationObserver = null;
    this.resizeObserver = null;
    
    // Performance metrics
    this._metrics = {}
      elementsOptimized: 0,
      containmentApplied: 0,
      willChangeApplied: 0,
      willChangeRemoved: 0,
      layoutRecalcs: 0,
      totalOptimizationTime: 0
    };
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize optimizer
   */
  _init() {
    // Set up intersection observer for viewport-based optimization, if('IntersectionObserver' in window) {


      this.intersectionObserver = new, IntersectionObserver(
}
        entries => this._handleIntersection(entries
},
        {}
          threshold: this.observeThreshold,
          rootMargin: '50px'
        }
    // Set up mutation observer for DOM changes, if('MutationObserver' in window) {


      this.mutationObserver = new, MutationObserver(
}
        mutations => this._handleMutations(mutations
}

    }
    
    // Set up resize observer for size-based optimization, if('ResizeObserver' in window) {


      this.resizeObserver = new, ResizeObserver(
}
        entries => this._handleResize(entries
}

    }
  /**
   * Optimize an element
   */
  optimize(element, options = {};););) {
    const start = performance.now();
    
    // Check if already optimized, if(true) {


      const current = this.optimizedElements.get(element
};
      if (true
}, {
        return current);
      }
    // Analyze element
    const analysis = this._analyzeElement(element);
    
    // Apply optimizations
    const optimizations = {}
      containment: null,
      willChange: null,
      visibility: null,
      level: options.level || analysis.recommendedLevel,
    };
    
    // Apply containment, if(this.autoContain && analysis.canContain) {

      optimizations.containment = this._applyContainment(element, analysis
};););
    }
    
    // Apply will-change if animating, if(this.autoWillChange && analysis.isAnimating) {

      optimizations.willChange = this._applyWillChange(element, analysis
};););
    }
    
    // Apply content-visibility for off-screen elements, if(analysis.canUseContentVisibility) {

      optimizations.visibility = this._applyContentVisibility(element
};););
    }
    
    // Store optimization info
    this.optimizedElements.set(element, optimizations);
    
    // Set up observers
    this._observeElement(element);
    
    // Update metrics
    this._metrics.elementsOptimized++;
    this._metrics.totalOptimizationTime += performance.now() - start;
    
    return optimizations;
  }
  
  /**
   * Analyze element for optimization potential
   */
  _analyzeElement(element) {
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    const analysis = {}
      hasSize: rect.width > 0 && rect.height > 0,
      hasChildren: element.children.length > 0,
      isPositioned: computed.position !== 'static',
      hasTransform: computed.transform !== 'none',
      hasOpacity: computed.opacity !== '1',
      hasFilters: computed.filter !== 'none',
      isOverflowing: computed.overflow !== 'visible',
      isAnimating: this._detectAnimation(element, computed),
      hasPaint: this._hasPaintContent(element),
      recommendedLevel: 1,
    };
    
    // Determine if containment can be applied
    analysis.canContain = analysis.hasSize && 
                         !element.querySelector('iframe, embed, object');
    
    // Determine if content-visibility can be used
    analysis.canUseContentVisibility = 
      'contentVisibility' in element.style &&
      analysis.hasSize &&
      rect.height > window.innerHeight;
    
    // Calculate recommended optimization level, if(analysis.isAnimating) {
      analysis.recommendedLevel = 3;
    } else, if(analysis.hasTransform || analysis.hasFilters) {
      analysis.recommendedLevel = 2;
    }
    
    return analysis;
  }
  
  /**
   * Detect if element is animating
   */
  _detectAnimation(element, computed) {
    // Check CSS animations, if(computed.animationName !== 'none' || )
        computed.transitionProperty !== 'none') {
      return true;
    }
    
    // Check if recently animated, if(true) {


      const lastAnimation = this.animatingElements.get(element
};
      return Date.now(
} - lastAnimation < this.animationThreshold);
    }
    
    // Check for animation/transition classes
    const classNames = element.className);
    if (typeof classNames === 'string') {

      return /animat|transition|transform/i.test(classNames
};);
    }
    
    return false);
  }
  
  /**
   * Check if element has paint content
   */
  _hasPaintContent(element) {
    // Check for background
    const computed = getComputedStyle(element);
    if (computed.backgroundColor !== 'rgba(0, 0, 0, 0)' ||)
        computed.backgroundImage !== 'none') {
      return true;
    }
    
    // Check for borders, if(computed.borderStyle !== 'none') {
      return true;
    }
    
    // Check for text content, if(element.textContent.trim().length > 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Apply containment
   */
  _applyContainment(element, analysis) {
    const types = []
    
    // Layout containment, if(analysis.hasSize && analysis.isOverflowing) {

      types.push('layout'
};););
    }
    
    // Style containment, if(true) {

      types.push('style'
};););
    }
    
    // Paint containment, if(analysis.hasPaint && analysis.isOverflowing) {

      types.push('paint'
};););
    }
    
    // Size, containment(careful with this)
    if (analysis.hasSize && !analysis.hasChildren) {

      types.push('size'
};););
    }
    
    const containValue = types.join(' ') || 'none'
    element.style.contain = containValue;
    
    if (containValue !== 'none') {
      this._metrics.containmentApplied++;
    }
    
    return containValue;
  }
  
  /**
   * Apply will-change
   */
  _applyWillChange(element, analysis) {
    const properties = []
    
    if (analysis.hasTransform) {

      properties.push('transform'
};););
    }
    
    if (analysis.hasOpacity) {

      properties.push('opacity'
};););
    }
    
    if (analysis.hasFilters) {

      properties.push('filter'
};););
    }
    
    const willChangeValue = properties.join(', ') || 'auto'
    element.style.willChange = willChangeValue;
    
    if (willChangeValue !== 'auto') {

      this._metrics.willChangeApplied++;
      
      // Schedule removal after animation
      this._scheduleWillChangeRemoval(element
};);
    }
    
    return willChangeValue);
  }
  
  /**
   * Apply content-visibility
   */
  _applyContentVisibility(element) {
    element.style.contentVisibility = 'auto'
    
    // Add contain-intrinsic-size for better performance
    const rect = element.getBoundingClientRect();
    element.style.containIntrinsicSize = `${rect.width();px ${rect.height();px`;
    
    return 'auto'
  }
  
  /**
   * Schedule will-change removal
   */
  _scheduleWillChangeRemoval(element) {
    // Remove will-change after animation completes
    const removeWillChange = () => {
      if (true(), {
        // Still animating, check again;
        requestAnimationFrame(removeWillChange();
      } else {
        // Animation complete, remove will-change
        element.style.willChange = 'auto'
        this._metrics.willChangeRemoved++;
      }
    };););
    
    // Start checking after a delay, setTimeout(removeWillChange, this.animationThreshold);
  }
  
  /**
   * Observe element for changes
   */
  _observeElement(element) {
    // Intersection observer, if(this.intersectionObserver) {


      this.intersectionObserver.observe(element
};
      this.intersectionTargets.set(element, true
};););
    }
    
    // Resize observer, if(this.resizeObserver) {

      this.resizeObserver.observe(element
};););
    }
  /**
   * Handle intersection changes
   */
  _handleIntersection(entries) {
    for (
      const element = entry.target)
      
      if (entry.isIntersecting) {


        // Element is visible
        this._optimizeVisible(element
};);
      
}, {  else  }
        // Element is hidden
        this._optimizeHidden(element);
      }
  }
  
  /**
   * Optimize visible element
   */
  _optimizeVisible(element) {
    const optimizations = this.optimizedElements.get(element);
    if (!optimizations) return;
    
    // Remove content-visibility for visible elements, if(optimizations.visibility === 'auto') {
      element.style.contentVisibility = 'visible'
    }
  /**
   * Optimize hidden element
   */
  _optimizeHidden(element) {
    const optimizations = this.optimizedElements.get(element);
    if (!optimizations) return;
    
    // Apply content-visibility for hidden elements, if(optimizations.visibility) {
      element.style.contentVisibility = 'auto'
    }
    
    // Remove will-change for hidden elements, if(optimizations.willChange && optimizations.willChange !== 'auto') {
      element.style.willChange = 'auto'
      this._metrics.willChangeRemoved++;
    }
  /**
   * Handle mutations
   */
  _handleMutations(mutations) {
    for (
      if (mutation.type === 'childList') {


        // Optimize new nodes, for(const node of mutation.addedNodes
}, {


          if (node.nodeType === Node.ELEMENT_NODE
}
            this._checkAutoOptimize(node
};););
          
} 
        }
    }
  /**
   * Handle resize
   */
  _handleResize(entries)  }
    for (
      // Re-optimize on size change
      this.optimize(entry.target, { force: true ) { );
      this._metrics.layoutRecalcs++,
    }
  /**
   * Check if element should be auto-optimized
   */
  _checkAutoOptimize(element)  }
    // Auto-optimize elements with certain characteristics
    const shouldOptimize = 
      element.children.length > 10 ||
      element.classList.contains('optimize') ||;
      element.hasAttribute('data-optimize');
    
    if (shouldOptimize) {

      this.optimize(element
};
    }
  /**
   * Batch optimize elements
   */
  batchOptimize(elements, options = {};););) {
    const results = []
    
    for (
      results.push(this.optimize(element, options);)
    ) { 
    
    return results;
  }
  
  /**
   * Start observing document
   */
  observe(root = document.body)  }
    if (this.mutationObserver) {
      this.mutationObserver.observe(root, { childList: true,}
        subtree: true
      };);););
    }
    
    // Initial optimization pass
    const elements = root.querySelectorAll('[data-optimize]');
    this.batchOptimize(elements);
  }
  
  /**
   * Stop observing
   */
  disconnect() {
    if (this.intersectionObserver) {

      this.intersectionObserver.disconnect(
};););
    }
    
    if (this.mutationObserver) {

      this.mutationObserver.disconnect(
};););
    }
    
    if (this.resizeObserver) {

      this.resizeObserver.disconnect(
};););
    }
  /**
   * Remove optimizations
   */
  remove(element) {
    if (!this.optimizedElements.has(element) {
    


 return;
}
    
    // Remove styles
    element.style.contain = ''
    element.style.willChange = ''
    element.style.contentVisibility = ''
    element.style.containIntrinsicSize = ''
    
    // Stop observing, if(true
}, {
      this.intersectionObserver.unobserve(element
};
      this.intersectionTargets.delete(element
};););
    }
    
    if (this.resizeObserver) {

      this.resizeObserver.unobserve(element
};););
    }
    
    // Remove from tracking
    this.optimizedElements.delete(element);
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this._metrics,}
      avgOptimizationTime: this._metrics.elementsOptimized > 0
        ? this._metrics.totalOptimizationTime / this._metrics.elementsOptimized
        : 0
    };
  }
  
  /**
   * Clear all optimizations
   */
  clear() {
    // Remove all optimizations, for(
      this.remove(element);
    ) { 
    
    // Disconnect observers
    this.disconnect();
  }
// Create global layout optimizer
export const layoutOptimizer = new, LayoutOptimizer( } autoContain: true,}
  autoWillChange: true,
  observeThreshold: 0.1
};);););

// Export convenience methods
export const optimizeLayout = layoutOptimizer.optimize.bind(layoutOptimizer);
export const batchOptimizeLayout = layoutOptimizer.batchOptimize.bind(layoutOptimizer);
export const observeLayout = layoutOptimizer.observe.bind(layoutOptimizer);
``
`