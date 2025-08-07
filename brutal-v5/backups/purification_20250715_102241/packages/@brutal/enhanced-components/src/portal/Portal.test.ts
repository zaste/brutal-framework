import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock DOM
// Store for different targets
const mockTargets: Record<string, any> = {};

const mockDocument = {
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    innerHTML: ''
  },
  createElement: jest.fn((tag: string) => ({
    tagName: tag,
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    cloneNode: jest.fn((deep: boolean) => ({ cloned: true, deep })),
    _parentNode: null,
    get parentNode() { return this._parentNode; },
    set parentNode(value) { this._parentNode = value; },
    innerHTML: '',
    childNodes: [],
    attributes: []
  })),
  querySelector: jest.fn((selector: string) => {
    if (selector === 'body') {
      return mockDocument.body;
    }
    if (mockTargets[selector]) {
      return mockTargets[selector];
    }
    if (selector === '.portal-target') {
      return mockDocument.body;
    }
    return null;
  })
};

global.document = mockDocument as any;

// Mock MutationObserver
class MockMutationObserver {
  callback: any;
  constructor(callback: any) {
    this.callback = callback;
  }
  observe = jest.fn();
  disconnect = jest.fn();
}

global.MutationObserver = MockMutationObserver as any;

// Mock HTMLElement
class MockHTMLElement {
  id = '';
  innerHTML = '';
  attributes: any[] = [];
  childNodes: any[] = [];
  parentNode: any = null;
  
  appendChild(child: any): void {
    this.childNodes.push(child);
    child.parentNode = this;
  }
  
  removeChild(child: any): void {
    const index = this.childNodes.indexOf(child);
    if (index > -1) {
      this.childNodes.splice(index, 1);
      child.parentNode = null;
    }
  }
  
  getAttribute(name: string): string | null {
    const attr = this.attributes.find(a => a.name === name);
    return attr?.value || null;
  }
  
  setAttribute(name: string, value: string): void {
    const existing = this.attributes.find(a => a.name === name);
    if (existing) {
      existing.value = value;
    } else {
      this.attributes.push({ name, value });
    }
  }
  
  cloneNode(deep: boolean): any {
    return { cloned: true, deep };
  }
  
  connectedCallback(): void {}
  disconnectedCallback(): void {}
}

global.HTMLElement = MockHTMLElement as any;

// Mock BrutalComponent
jest.mock('@brutal/components', () => ({
  BrutalComponent: MockHTMLElement
}));

import { Portal, createPortal, usePortal } from './Portal.js';
import { BrutalComponent } from '@brutal/components';

describe('Portal', () => {
  let portal: Portal;
  let targetElement: any;

  beforeEach(() => {
    jest.clearAllMocks();
    targetElement = {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      innerHTML: ''
    };
    mockDocument.querySelector.mockReturnValue(targetElement);
  });

  afterEach(() => {
    if (portal) {
      portal.disconnectedCallback();
    }
  });

  describe('initialization', () => {
    it('should create portal with default options', () => {
      portal = new Portal();
      (portal as any).init();
      
      expect(portal.options.target).toBe(mockDocument.body);
      expect(portal.options.append).toBe(true);
      expect(portal.options.cleanup).toBe(true);
    });

    it('should read options from attributes', () => {
      portal = new Portal();
      portal.setAttribute('target', '#modal-root');
      portal.setAttribute('append', 'false');
      portal.setAttribute('cleanup', 'false');
      
      (portal as any).init();
      
      expect(portal.options.target).toBe('#modal-root');
      expect(portal.options.append).toBe(false);
      expect(portal.options.cleanup).toBe(false);
    });

    it('should find target element by selector', () => {
      portal = new Portal();
      portal.setAttribute('target', '.modal-container');
      
      (portal as any).init();
      
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.modal-container');
    });

    it('should create target element if ID selector not found', () => {
      mockDocument.querySelector.mockReturnValue(null);
      
      portal = new Portal();
      portal.setAttribute('target', '#new-container');
      
      (portal as any).init();
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });

    it('should set up mutation observer', () => {
      portal = new Portal();
      (portal as any).init();
      
      const observer = (portal as any).observer;
      expect(observer).toBeInstanceOf(MockMutationObserver);
      expect(observer.observe).toHaveBeenCalledWith(portal, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    });
  });

  describe('content syncing', () => {
    it('should sync child nodes to portal content', () => {
      portal = new Portal();
      const child1 = { nodeType: 1, cloneNode: jest.fn(() => ({ cloned: true })) };
      const child2 = { nodeType: 1, cloneNode: jest.fn(() => ({ cloned: true })) };
      portal.childNodes = [child1, child2] as any;
      
      (portal as any).init();
      
      expect(child1.cloneNode).toHaveBeenCalledWith(true);
      expect(child2.cloneNode).toHaveBeenCalledWith(true);
    });

    it('should copy non-portal attributes', () => {
      portal = new Portal();
      portal.setAttribute('class', 'modal');
      portal.setAttribute('data-test', 'value');
      portal.setAttribute('target', '#modal'); // Should be excluded
      
      (portal as any).init();
      
      const portalContent = (portal as any).portalContent;
      expect(portalContent.setAttribute).toHaveBeenCalledWith('class', 'modal');
      expect(portalContent.setAttribute).toHaveBeenCalledWith('data-test', 'value');
      expect(portalContent.setAttribute).not.toHaveBeenCalledWith('target', '#modal');
    });

    it('should trigger sync on mutations', () => {
      portal = new Portal();
      (portal as any).init();
      
      const observer = (portal as any).observer;
      const syncSpy = jest.spyOn(portal as any, 'syncContent');
      
      // Trigger mutation observer callback
      observer.callback();
      
      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('should append portal content to target', () => {
      portal = new Portal();
      portal.innerHTML = '<div>Portal Content</div>';
      
      (portal as any).init();
      
      expect(targetElement.appendChild).toHaveBeenCalled();
    });

    it('should replace target content when append is false', () => {
      portal = new Portal();
      portal.setAttribute('append', 'false');
      portal.innerHTML = '<div>Portal Content</div>';
      
      (portal as any).init();
      
      expect(targetElement.innerHTML).toBe('');
      expect(targetElement.appendChild).toHaveBeenCalled();
    });
  });

  describe('dynamic updates', () => {
    it('should update target dynamically', () => {
      portal = new Portal();
      (portal as any).init();
      
      const newTarget = { appendChild: jest.fn(), innerHTML: '' };
      mockTargets['.new-target'] = newTarget;
      
      portal.setTarget('.new-target');
      
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.new-target');
      expect(newTarget.appendChild).toHaveBeenCalled();
    });

    it('should remove from old target before updating', () => {
      portal = new Portal();
      (portal as any).init();
      
      const portalContent = (portal as any).portalContent;
      portalContent.parentNode = targetElement;
      
      portal.setTarget('.new-target');
      
      expect(targetElement.removeChild).toHaveBeenCalledWith(portalContent);
    });
  });

  describe('cleanup', () => {
    it('should disconnect observer on unmount', () => {
      portal = new Portal();
      (portal as any).init();
      
      const observer = (portal as any).observer;
      
      portal.disconnectedCallback();
      
      expect(observer.disconnect).toHaveBeenCalled();
    });

    it('should remove portal content on cleanup', () => {
      portal = new Portal();
      (portal as any).init();
      
      const portalContent = (portal as any).portalContent;
      portalContent.parentNode = targetElement;
      
      portal.disconnectedCallback();
      
      expect(targetElement.removeChild).toHaveBeenCalledWith(portalContent);
    });

    it('should not remove content if cleanup is false', () => {
      portal = new Portal();
      portal.setAttribute('cleanup', 'false');
      (portal as any).init();
      
      const portalContent = (portal as any).portalContent;
      portalContent.parentNode = targetElement;
      
      portal.disconnectedCallback();
      
      expect(targetElement.removeChild).not.toHaveBeenCalled();
    });
  });

  describe('getPortalElement', () => {
    it('should return portal content element', () => {
      portal = new Portal();
      (portal as any).init();
      
      const portalContent = portal.getPortalElement();
      
      expect(portalContent).toBe((portal as any).portalContent);
    });
  });
});

describe('createPortal', () => {
  it('should create portal with string content', () => {
    const portal = createPortal('<div>Test</div>', { target: '#modal' });
    
    expect(portal.innerHTML).toBe('<div>Test</div>');
    expect(portal.options.target).toBe('#modal');
  });

  it('should create portal with node content', () => {
    const node = { nodeType: 1 };
    const portal = createPortal(node as any);
    
    expect(portal.childNodes).toContain(node);
  });
});

describe('usePortal', () => {
  it('should create portal hook for component', () => {
    const component = new BrutalComponent();
    const { portal, render, destroy } = usePortal(component);
    
    expect(portal).toBeInstanceOf(Portal);
    expect(typeof render).toBe('function');
    expect(typeof destroy).toBe('function');
  });

  it('should render content through hook', () => {
    const component = new BrutalComponent();
    const { portal, render } = usePortal(component);
    
    render('<div>Hook Content</div>');
    
    expect(portal.innerHTML).toBe('<div>Hook Content</div>');
  });

  it('should auto-cleanup on component disconnect', () => {
    const component = new BrutalComponent();
    const originalDisconnect = jest.fn();
    component.disconnectedCallback = originalDisconnect;
    
    const { portal } = usePortal(component);
    const portalDisconnect = jest.spyOn(portal, 'disconnectedCallback');
    
    component.disconnectedCallback();
    
    expect(portalDisconnect).toHaveBeenCalled();
    expect(originalDisconnect).toHaveBeenCalled();
  });

  it('should manually destroy portal', () => {
    const component = new BrutalComponent();
    const { portal, destroy } = usePortal(component);
    const portalDisconnect = jest.spyOn(portal, 'disconnectedCallback');
    
    destroy();
    
    expect(portalDisconnect).toHaveBeenCalled();
  });
});