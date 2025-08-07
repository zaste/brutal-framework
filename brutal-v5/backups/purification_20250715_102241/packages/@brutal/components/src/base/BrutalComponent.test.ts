import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * @jest-environment jsdom
 */

describe('BrutalComponent', () => {
  let BrutalComponent: any;
  let TestComponent: any;
  let component: any;

  beforeEach(async () => {
    // Import dynamically to ensure clean state
    const module = await import('./BrutalComponent.js');
    BrutalComponent = module.BrutalComponent;
    
    // Create test component that properly extends BrutalComponent
    class TestComponentClass extends BrutalComponent {
      initCalled = false;
      renderCalled = false;

      protected init(): void {
        this.initCalled = true;
      }

      protected render(): void {
        this.renderCalled = true;
      }
    }
    
    TestComponent = TestComponentClass;
    
    // Register the custom element if not already registered
    if (typeof customElements !== 'undefined' && !customElements.get('test-brutal-component')) {
      customElements.define('test-brutal-component', TestComponent);
    }
    
    // Create instance using document.createElement to avoid constructor issues
    if (typeof document !== 'undefined') {
      component = document.createElement('test-brutal-component') as any;
    } else {
      // Fallback for non-DOM environments
      component = new TestComponent();
    }
  });

  it('should initialize on first connect', () => {
    expect(component.initCalled).toBe(false);
    
    component.connectedCallback();
    
    expect(component.initCalled).toBe(true);
  });

  it('should not re-initialize on subsequent connects', () => {
    component.connectedCallback();
    component.initCalled = false;
    
    component.connectedCallback();
    
    expect(component.initCalled).toBe(false);
  });
});
