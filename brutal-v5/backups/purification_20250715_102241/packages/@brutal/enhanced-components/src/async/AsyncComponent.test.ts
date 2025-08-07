import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock HTMLElement and timers
class MockHTMLElement {
  innerHTML = '';
  attributes: any[] = [];
  children: any[] = [];
  parentNode: any = null;
  
  appendChild(child: any): any {
    if (!this.children.includes(child)) {
      this.children.push(child);
      if (child.parentNode && child.parentNode !== this) {
        const oldParent = child.parentNode;
        const index = oldParent.children.indexOf(child);
        if (index > -1) {
          oldParent.children.splice(index, 1);
        }
      }
      child.parentNode = this;
    }
    return child;
  }
  
  get firstChild(): any {
    return this.children[0] || null;
  }
  
  removeChild(child: any): any {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }
  
  getAttribute(name: string): string | null {
    const attr = this.attributes.find((a: any) => a.name === name);
    return attr?.value || null;
  }
  
  setAttribute(name: string, value: string): void {
    this.attributes.push({ name, value });
  }
  
  connectedCallback(): void {}
  disconnectedCallback(): void {}
}

global.HTMLElement = MockHTMLElement as any;

// Mock window timers
const mockSetTimeout = jest.fn((fn, delay) => {
  const id = Math.random();
  if (delay === 0) fn();
  return id;
});
const mockClearTimeout = jest.fn();

global.window = {
  setTimeout: mockSetTimeout as any,
  clearTimeout: mockClearTimeout as any
} as any;

// Mock BrutalComponent
jest.mock('@brutal/components', () => ({
  BrutalComponent: class BrutalComponent extends MockHTMLElement {
    protected init(): void {}
    protected render(): void {}
  }
}));

import { createAsyncComponent, AsyncComponent } from './AsyncComponent.js';
import { BrutalComponent } from '@brutal/components';

class TestComponent extends BrutalComponent {
  protected init(): void {
    this.innerHTML = 'Test Component Loaded';
  }
  protected render(): void {
    this.innerHTML = 'Test Component Rendered';
  }
}

class LoadingComponent extends BrutalComponent {
  protected init(): void {
    this.innerHTML = 'Loading...';
  }
  protected render(): void {}
}

class ErrorComponent extends BrutalComponent {
  error?: unknown;
  protected init(): void {
    this.innerHTML = `Error: ${this.error}`;
  }
  protected render(): void {}
}

describe('createAsyncComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create async component that loads on demand', async () => {
    const loader = jest.fn().mockResolvedValue(TestComponent);
    
    const AsyncComp = createAsyncComponent({
      loader
    });
    
    const instance = new AsyncComp();
    
    // Mock loadComponent to avoid complex rendering
    const loadPromise = (instance as any).loadComponent();
    
    expect(loader).toHaveBeenCalled();
    
    await loadPromise;
  });

  it('should show loading component while loading', async () => {
    const loader = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve(TestComponent), 100))
    );
    
    const AsyncComp = createAsyncComponent({
      loader,
      loading: LoadingComponent
    });
    
    const instance = new AsyncComp();
    const initPromise = (instance as any).init();
    
    // Should show loading immediately
    expect(instance.children).toHaveLength(1);
    expect(instance.children[0].innerHTML).toBe('Loading...');
    
    await initPromise;
  });

  it('should respect delay before showing loading', async () => {
    const loader = jest.fn().mockResolvedValue(TestComponent);
    
    const AsyncComp = createAsyncComponent({
      loader,
      loading: LoadingComponent,
      delay: 200
    });
    
    const instance = new AsyncComp();
    await (instance as any).init();
    
    // Timer should be set but not executed
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 200);
    expect(mockClearTimeout).toHaveBeenCalled();
  });

  it('should show error component on load failure', async () => {
    const error = new Error('Load failed');
    const loader = jest.fn().mockRejectedValue(error);
    
    const AsyncComp = createAsyncComponent({
      loader,
      error: ErrorComponent
    });
    
    const instance = new AsyncComp();
    await (instance as any).init();
    
    expect(instance.children).toHaveLength(1);
    expect(instance.children[0].error).toBe(error);
  });

  it('should handle timeout', async () => {
    const loader = jest.fn(() => new Promise(() => {})); // Never resolves
    
    const AsyncComp = createAsyncComponent({
      loader,
      error: ErrorComponent,
      timeout: 100
    });
    
    const instance = new AsyncComp();
    const initPromise = (instance as any).init();
    
    // Execute timeout
    const timeoutCall = mockSetTimeout.mock.calls.find(call => call[1] === 100);
    if (timeoutCall) timeoutCall[0]();
    
    await initPromise;
    
    expect(instance.children).toHaveLength(1);
    expect(instance.children[0].innerHTML).toContain('timeout');
  });

  it('should transfer attributes to loaded component', async () => {
    const loader = jest.fn().mockResolvedValue(TestComponent);
    
    const AsyncComp = createAsyncComponent({
      loader
    });
    
    const instance = new AsyncComp();
    instance.setAttribute('data-test', 'value');
    
    await (instance as any).init();
    
    const loadedComponent = instance.children[0];
    expect(loadedComponent.attributes).toContainEqual({ name: 'data-test', value: 'value' });
  });

  it('should clean up timers on disconnect', async () => {
    const loader = jest.fn(() => new Promise(() => {}));
    
    const AsyncComp = createAsyncComponent({
      loader,
      loading: LoadingComponent,
      delay: 200,
      timeout: 1000
    });
    
    const instance = new AsyncComp();
    (instance as any).init();
    
    instance.disconnectedCallback();
    
    // Should clear both delay and timeout timers
    expect(mockClearTimeout).toHaveBeenCalledTimes(2);
  });
});

describe('AsyncComponent decorator', () => {
  it('should create async wrapper for component class', () => {
    @AsyncComponent({
      loading: LoadingComponent,
      error: ErrorComponent
    })
    class DecoratedComponent extends BrutalComponent {
      protected init(): void {}
      protected render(): void {}
    }
    
    // The decorator returns a new class
    expect(DecoratedComponent).toBeDefined();
    expect(typeof DecoratedComponent).toBe('function');
  });
});