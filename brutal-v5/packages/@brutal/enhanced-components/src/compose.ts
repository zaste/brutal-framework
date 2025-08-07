/**
 * Composition utilities for enhanced components
 * This replaces deep inheritance with functional composition
 */

import type { BrutalComponent } from '@brutal/components';

export type ComponentEnhancer<T = any> = (
  Component: typeof BrutalComponent
) => typeof BrutalComponent;

/**
 * Compose multiple enhancers into a single enhancer
 */
export function compose(...enhancers: ComponentEnhancer[]): ComponentEnhancer {
  return (Component: typeof BrutalComponent) => {
    return enhancers.reduceRight((enhanced, enhancer) => {
      return enhancer(enhanced);
    }, Component);
  };
}

/**
 * Create a component with composed enhancements
 */
export function createEnhancedComponent(
  name: string,
  ...enhancers: ComponentEnhancer[]
): typeof BrutalComponent {
  const EnhancedComponent = compose(...enhancers)(BrutalComponent);
  
  // Preserve component name for debugging
  Object.defineProperty(EnhancedComponent, 'name', {
    value: name,
    configurable: true
  });
  
  return EnhancedComponent;
}

/**
 * Helper to create an enhancer from a mixin
 */
export function withMixin<T extends object>(mixin: T): ComponentEnhancer {
  return (Component: typeof BrutalComponent) => {
    return class extends Component {
      constructor() {
        super();
        Object.assign(this, mixin);
      }
    };
  };
}