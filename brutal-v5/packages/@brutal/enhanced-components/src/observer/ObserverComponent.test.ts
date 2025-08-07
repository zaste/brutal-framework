import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock observers
const mockIntersectionObserver = jest.fn();
const mockResizeObserver = jest.fn();
const mockMutationObserver = jest.fn();
const mockPerformanceObserver = jest.fn();

class MockIntersectionObserver {
  callback: any;
  options: any;
  observed = new Set();
  
  constructor(callback: any, options?: any) {
    this.callback = callback;
    this.options = options;
    mockIntersectionObserver(callback, options);
  }
  
  observe = jest.fn((target) => { this.observed.add(target); });
  unobserve = jest.fn((target) => { this.observed.delete(target); });
  disconnect = jest.fn(() => { this.observed.clear(); });
  takeRecords = jest.fn(() => []);
}

class MockResizeObserver {
  callback: any;
  observed = new Set();
  
  constructor(callback: any) {
    this.callback = callback;
    mockResizeObserver(callback);
  }
  
  observe = jest.fn((target, options) => { this.observed.add(target); });
  unobserve = jest.fn((target) => { this.observed.delete(target); });
  disconnect = jest.fn(() => { this.observed.clear(); });
  takeRecords = jest.fn(() => []);
}

class MockMutationObserver {
  callback: any;
  observed = new Set();
  
  constructor(callback: any) {
    this.callback = callback;
    mockMutationObserver(callback);
  }
  
  observe = jest.fn((target, options) => { this.observed.add(target); });
  disconnect = jest.fn(() => { this.observed.clear(); });
  takeRecords = jest.fn(() => []);
}

class MockPerformanceObserver {
  callback: any;
  
  constructor(callback: any) {
    this.callback = callback;
    mockPerformanceObserver(callback);
  }
  
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
}

global.IntersectionObserver = MockIntersectionObserver as any;
global.ResizeObserver = MockResizeObserver as any;
global.MutationObserver = MockMutationObserver as any;
global.PerformanceObserver = MockPerformanceObserver as any;

// Mock window
global.window = {
  setInterval: jest.fn((fn, delay) => {
    const id = Math.random();
    return id;
  }),
  clearInterval: jest.fn()
} as any;

// Mock Date
const mockNow = jest.fn(() => 1000);
global.Date = { now: mockNow } as any;

// Mock HTMLElement
class MockHTMLElement {
  innerHTML = '';
  attributes: any[] = [];
  
  getAttribute(name: string): string | null {
    const attr = this.attributes.find(a => a.name === name);
    return attr?.value || null;
  }
  
  setAttribute(name: string, value: string): void {
    this.attributes.push({ name, value });
  }
  
  connectedCallback(): void {}
  disconnectedCallback(): void {}
}

global.HTMLElement = MockHTMLElement as any;

// Mock BrutalComponent
jest.mock('@brutal/components', () => ({
  BrutalComponent: MockHTMLElement
}));

import { ObserverComponent, LazyComponent, VisibilityTracker } from './ObserverComponent.js';

describe('ObserverComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should set up intersection observer when configured', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = {
          intersection: { threshold: 0.5 }
        };
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.5 }
      );
      expect((component as any).intersectionObserver.observe).toHaveBeenCalledWith(component);
    });

    it('should set up resize observer when configured', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = {
          resize: { box: 'border-box' }
        };
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      expect(mockResizeObserver).toHaveBeenCalled();
      expect((component as any).resizeObserver.observe).toHaveBeenCalledWith(
        component,
        { box: 'border-box' }
      );
    });

    it('should set up mutation observer when configured', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = {
          mutation: { childList: true }
        };
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      expect(mockMutationObserver).toHaveBeenCalled();
      expect((component as any).mutationObserver.observe).toHaveBeenCalledWith(
        component,
        { childList: true }
      );
    });

    it('should set up performance observer when configured', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = {
          performance: { entryTypes: ['measure'] }
        };
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect((component as any).performanceObserver.observe).toHaveBeenCalledWith(
        { entryTypes: ['measure'] }
      );
    });

    it('should not set up observers when not configured', () => {
      const component = new ObserverComponent();
      (component as any).init();
      
      expect(mockIntersectionObserver).not.toHaveBeenCalled();
      expect(mockResizeObserver).not.toHaveBeenCalled();
      expect(mockMutationObserver).not.toHaveBeenCalled();
      expect(mockPerformanceObserver).not.toHaveBeenCalled();
    });
  });

  describe('observer callbacks', () => {
    it('should call onIntersection when intersection changes', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = { intersection: {} };
        onIntersection = jest.fn();
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      const entries = [{ isIntersecting: true, target: component }];
      (component as any).intersectionObserver.callback(entries);
      
      expect(component.onIntersection).toHaveBeenCalledWith(entries);
    });

    it('should call onResize when size changes', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = { resize: {} };
        onResize = jest.fn();
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      const entries = [{ contentRect: { width: 100, height: 100 } }];
      (component as any).resizeObserver.callback(entries);
      
      expect(component.onResize).toHaveBeenCalledWith(entries);
    });

    it('should call onMutation when mutations occur', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = { mutation: {} };
        onMutation = jest.fn();
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      const mutations = [{ type: 'childList', target: component }];
      (component as any).mutationObserver.callback(mutations);
      
      expect(component.onMutation).toHaveBeenCalledWith(mutations);
    });

    it('should call onPerformance when performance entries recorded', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = { performance: {} };
        onPerformance = jest.fn();
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      const list = { getEntries: () => [] };
      (component as any).performanceObserver.callback(list);
      
      expect(component.onPerformance).toHaveBeenCalledWith(list);
    });
  });

  describe('utility methods', () => {
    it('should check intersection status', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = { intersection: {} };
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      (component as any).intersectionObserver.takeRecords.mockReturnValue([
        { target: component, isIntersecting: true }
      ]);
      
      expect(component.isIntersecting()).toBe(true);
    });

    it('should get observed size', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = { resize: {} };
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      (component as any).resizeObserver.takeRecords.mockReturnValue([
        { target: component, contentRect: { width: 200, height: 150 } }
      ]);
      
      expect(component.getObservedSize()).toEqual({ width: 200, height: 150 });
    });

    it('should return null when no size observer', () => {
      const component = new ObserverComponent();
      (component as any).init();
      
      expect(component.getObservedSize()).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should disconnect all observers', () => {
      class TestComponent extends ObserverComponent {
        observerOptions = {
          intersection: {},
          resize: {},
          mutation: {},
          performance: {}
        };
      }
      
      const component = new TestComponent();
      (component as any).init();
      
      component.disconnectedCallback();
      
      expect((component as any).intersectionObserver.disconnect).toHaveBeenCalled();
      expect((component as any).resizeObserver.disconnect).toHaveBeenCalled();
      expect((component as any).mutationObserver.disconnect).toHaveBeenCalled();
      expect((component as any).performanceObserver.disconnect).toHaveBeenCalled();
    });
  });
});

describe('LazyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render placeholder initially', () => {
    const component = new LazyComponent();
    (component as any).init();
    
    expect(component.innerHTML).toContain('lazy-placeholder');
  });

  it('should read load threshold from attribute', () => {
    const component = new LazyComponent();
    component.setAttribute('load-threshold', '0.25');
    component.setAttribute('load-margin', '100px');
    
    (component as any).init();
    
    expect((component as any).loadThreshold).toBe(0.25);
    expect((component as any).loadRootMargin).toBe('100px');
  });

  it('should load content when intersecting', async () => {
    class TestLazyComponent extends LazyComponent {
      loadContent = jest.fn().mockResolvedValue(undefined);
      render = jest.fn();
    }
    
    const component = new TestLazyComponent();
    (component as any).init();
    
    const entries = [{ isIntersecting: true }];
    await (component as any).onIntersection(entries);
    
    expect(component.loadContent).toHaveBeenCalled();
    expect(component.render).toHaveBeenCalled();
  });

  it('should only load once', async () => {
    class TestLazyComponent extends LazyComponent {
      loadContent = jest.fn().mockResolvedValue(undefined);
    }
    
    const component = new TestLazyComponent();
    (component as any).init();
    
    const entries = [{ isIntersecting: true }];
    await (component as any).onIntersection(entries);
    await (component as any).onIntersection(entries);
    
    expect(component.loadContent).toHaveBeenCalledTimes(1);
  });

  it('should render error on load failure', async () => {
    class TestLazyComponent extends LazyComponent {
      loadContent = jest.fn().mockRejectedValue(new Error('Load failed'));
    }
    
    const component = new TestLazyComponent();
    (component as any).init();
    
    const entries = [{ isIntersecting: true }];
    await (component as any).onIntersection(entries);
    
    expect(component.innerHTML).toContain('lazy-error');
    expect(component.innerHTML).toContain('Load failed');
  });

  it('should unobserve after loading', async () => {
    const component = new LazyComponent();
    (component as any).init();
    
    const unobserve = (component as any).intersectionObserver.unobserve;
    
    const entries = [{ isIntersecting: true }];
    await (component as any).onIntersection(entries);
    
    expect(unobserve).toHaveBeenCalledWith(component);
  });
});

describe('VisibilityTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow.mockReturnValue(1000);
  });

  it('should start tracking when visible', () => {
    const component = new VisibilityTracker();
    (component as any).init();
    
    const entries = [{ isIntersecting: true, intersectionRatio: 0.6 }];
    (component as any).onIntersection(entries);
    
    expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 100);
    expect((component as any).lastVisibleTimestamp).toBe(1000);
  });

  it('should stop tracking when not visible', () => {
    const component = new VisibilityTracker();
    (component as any).init();
    
    // Start tracking
    const startEntries = [{ isIntersecting: true, intersectionRatio: 0.6 }];
    (component as any).onIntersection(startEntries);
    
    // Move time forward
    mockNow.mockReturnValue(2000);
    
    // Stop tracking
    const stopEntries = [{ isIntersecting: false, intersectionRatio: 0 }];
    (component as any).onIntersection(stopEntries);
    
    expect(window.clearInterval).toHaveBeenCalled();
    expect((component as any).visibleTime).toBe(1000);
  });

  it('should call visibility callbacks', () => {
    class TestTracker extends VisibilityTracker {
      onVisibilityUpdate = jest.fn();
      onVisibilityEnd = jest.fn();
    }
    
    const component = new TestTracker();
    (component as any).init();
    
    // Start tracking
    const startEntries = [{ isIntersecting: true, intersectionRatio: 0.6 }];
    (component as any).onIntersection(startEntries);
    
    // Simulate interval callback
    const intervalCallback = (window.setInterval as jest.Mock).mock.calls[0][0];
    mockNow.mockReturnValue(1100);
    intervalCallback();
    
    expect(component.onVisibilityUpdate).toHaveBeenCalledWith(100);
    
    // Stop tracking
    mockNow.mockReturnValue(2000);
    const stopEntries = [{ isIntersecting: false, intersectionRatio: 0 }];
    (component as any).onIntersection(stopEntries);
    
    expect(component.onVisibilityEnd).toHaveBeenCalledWith(1100);
  });

  it('should get total visible time', () => {
    const component = new VisibilityTracker();
    (component as any).init();
    
    // Not tracking yet
    expect(component.getVisibleTime()).toBe(0);
    
    // Start tracking
    const entries = [{ isIntersecting: true, intersectionRatio: 0.6 }];
    (component as any).onIntersection(entries);
    
    // Check time while tracking
    mockNow.mockReturnValue(1500);
    expect(component.getVisibleTime()).toBe(500);
  });

  it('should cleanup on disconnect', () => {
    const component = new VisibilityTracker();
    (component as any).init();
    
    // Start tracking
    const entries = [{ isIntersecting: true, intersectionRatio: 0.6 }];
    (component as any).onIntersection(entries);
    
    component.disconnectedCallback();
    
    expect(window.clearInterval).toHaveBeenCalled();
  });
});