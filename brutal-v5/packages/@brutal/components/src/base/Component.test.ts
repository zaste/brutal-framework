import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Component, component, defineComponent } from './Component';

// Mock @brutal packages
jest.mock('@brutal/events', () => ({
  EventEmitter: class {
    private handlers = new Map();
    on(event: string, handler: Function) {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(handler);
    }
    off(event: string, handler?: Function) {
      if (handler) {
        this.handlers.get(event)?.delete(handler);
      } else {
        this.handlers.delete(event);
      }
    }
    emit(event: string, data?: any) {
      this.handlers.get(event)?.forEach((handler: any) => handler(data));
    }
    once(event: string, handler: Function) {
      const wrapped = (data: any) => {
        handler(data);
        this.off(event, wrapped);
      };
      this.on(event, wrapped);
    }
    removeAllListeners() {
      this.handlers.clear();
    }
  }
}));

jest.mock('@brutal/templates', () => ({
  compile: (template: string) => (context: any) => {
    // Simple template replacement for tests
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || '');
  }
}));

describe('Component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    // Clean up custom elements
    const elements = document.querySelectorAll('[data-test]');
    elements.forEach(el => el.remove());
  });

  describe('Basic functionality', () => {
    it('should create a component', () => {
      @component('test-basic')
      class TestComponent extends Component {
        template = '<div>Hello</div>';
      }

      const el = document.createElement('test-basic');
      container.appendChild(el);

      expect(el).toBeInstanceOf(TestComponent);
      expect(el.innerHTML).toBe('<div>Hello</div>');
    });

    it('should support shadow DOM', () => {
      @component('test-shadow')
      class TestComponent extends Component {
        template = '<div>Shadow Content</div>';
        
        constructor() {
          super();
          this.attachShadow();
        }
      }

      const el = document.createElement('test-shadow');
      container.appendChild(el);

      expect(el.shadowRoot).toBeTruthy();
      expect(el.shadowRoot!.innerHTML).toBe('<div>Shadow Content</div>');
    });
  });

  describe('Props system', () => {
    it('should handle props with defaults', () => {
      @component('test-props', {
        props: {
          message: { type: 'string', default: 'Default' },
          count: { type: 'number', default: 0 }
        },
        template: '<div>{{message}} - {{count}}</div>'
      })
      class TestComponent extends Component {}

      const el = document.createElement('test-props') as any;
      container.appendChild(el);

      expect(el.message).toBe('Default');
      expect(el.count).toBe(0);
      expect(el.innerHTML).toBe('<div>Default - 0</div>');
    });

    it('should observe attribute changes', () => {
      @component('test-attrs', {
        props: {
          value: { type: 'string', default: '' }
        },
        template: '<div>{{value}}</div>'
      })
      class TestComponent extends Component {}

      const el = document.createElement('test-attrs');
      container.appendChild(el);

      el.setAttribute('value', 'Updated');
      expect(el.innerHTML).toBe('<div>Updated</div>');
    });

    it('should coerce prop types', () => {
      @component('test-coerce', {
        props: {
          str: { type: 'string' },
          num: { type: 'number' },
          bool: { type: 'boolean' },
          obj: { type: 'object' }
        }
      })
      class TestComponent extends Component {}

      const el = document.createElement('test-coerce') as any;
      container.appendChild(el);

      el.setAttribute('str', '123');
      el.setAttribute('num', '456');
      el.setAttribute('bool', 'true');
      el.setAttribute('obj', '{"key":"value"}');

      expect(el.str).toBe('123');
      expect(el.num).toBe(456);
      expect(el.bool).toBe(true);
      expect(el.obj).toEqual({ key: 'value' });
    });

    it('should validate props', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      @component('test-validate', {
        props: {
          age: {
            type: 'number',
            validator: (v: number) => v >= 0 && v <= 120
          }
        }
      })
      class TestComponent extends Component {}

      const el = document.createElement('test-validate') as any;
      container.appendChild(el);

      el.age = 150;
      expect(consoleSpy).toHaveBeenCalledWith('Invalid prop value for "age":', 150);

      consoleSpy.mockRestore();
    });
  });

  describe('State management', () => {
    it('should handle state updates', () => {
      @component('test-state', {
        template: '<div>{{count}}</div>'
      })
      class TestComponent extends Component {
        mounted() {
          this.setState({ count: 0 });
        }
        
        increment() {
          this.setState({ count: this.state.count + 1 });
        }
      }

      const el = document.createElement('test-state') as any;
      container.appendChild(el);

      expect(el.innerHTML).toBe('<div>0</div>');

      el.increment();
      expect(el.innerHTML).toBe('<div>1</div>');
    });

    it('should support functional setState', () => {
      @component('test-state-fn')
      class TestComponent extends Component {
        template = '<div>{{value}}</div>';
        
        mounted() {
          this.setState({ value: 1 });
        }
        
        double() {
          this.setState(prev => ({ value: prev.value * 2 }));
        }
      }

      const el = document.createElement('test-state-fn') as any;
      container.appendChild(el);

      el.double();
      expect(el.innerHTML).toBe('<div>2</div>');
    });
  });

  describe('Lifecycle hooks', () => {
    it('should call lifecycle hooks in order', async () => {
      const calls: string[] = [];

      @component('test-lifecycle')
      class TestComponent extends Component {
        template = '<div>Test</div>';
        
        async beforeMount() {
          calls.push('beforeMount');
        }
        
        async mounted() {
          calls.push('mounted');
        }
        
        async beforeUpdate() {
          calls.push('beforeUpdate');
        }
        
        async updated() {
          calls.push('updated');
        }
        
        async beforeUnmount() {
          calls.push('beforeUnmount');
        }
        
        async unmounted() {
          calls.push('unmounted');
        }
      }

      const el = document.createElement('test-lifecycle') as any;
      container.appendChild(el);

      await Promise.resolve(); // Wait for async hooks

      expect(calls).toEqual(['beforeMount', 'mounted']);

      el.render();
      await Promise.resolve();

      expect(calls).toEqual(['beforeMount', 'mounted', 'beforeUpdate', 'updated']);

      el.remove();
      await Promise.resolve();

      expect(calls).toEqual([
        'beforeMount', 'mounted', 
        'beforeUpdate', 'updated',
        'beforeUnmount', 'unmounted'
      ]);
    });
  });

  describe('Event handling', () => {
    it('should emit and listen to events', () => {
      @component('test-events')
      class TestComponent extends Component {}

      const el = document.createElement('test-events') as any;
      container.appendChild(el);

      const handler = jest.fn();
      el.on('custom', handler);

      el.emit('custom', { data: 'test' });
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should dispatch DOM events', () => {
      @component('test-dom-events')
      class TestComponent extends Component {}

      const el = document.createElement('test-dom-events');
      container.appendChild(el);

      const handler = jest.fn();
      el.addEventListener('custom', handler);

      el.emit('custom', { data: 'test' });
      
      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.detail).toEqual({ data: 'test' });
    });
  });

  describe('DOM utilities', () => {
    it('should provide query selectors', () => {
      @component('test-dom', {
        template: `
          <div class="container">
            <span class="item">1</span>
            <span class="item">2</span>
          </div>
        `
      })
      class TestComponent extends Component {}

      const el = document.createElement('test-dom') as any;
      container.appendChild(el);

      expect(el.$('.container')).toBeTruthy();
      expect(el.$$('.item')).toHaveLength(2);
    });

    it('should handle CSS classes', () => {
      @component('test-css')
      class TestComponent extends Component {}

      const el = document.createElement('test-css') as any;
      container.appendChild(el);

      el.addClass('active');
      expect(el.hasClass('active')).toBe(true);

      el.removeClass('active');
      expect(el.hasClass('active')).toBe(false);

      el.toggleClass('active');
      expect(el.hasClass('active')).toBe(true);
    });
  });

  describe('Functional components', () => {
    it('should create functional components', () => {
      const TestComp = defineComponent('test-functional', (props) => ({
        template: '<div>{{message}}</div>',
        props: {
          message: { type: 'string', default: 'Hello' }
        }
      }));

      const el = document.createElement('test-functional');
      container.appendChild(el);

      expect(el.innerHTML).toBe('<div>Hello</div>');
    });
  });

  describe('Watchers', () => {
    it('should watch for changes', () => {
      @component('test-watch')
      class TestComponent extends Component {
        mounted() {
          this.setState({ value: 0 });
        }
      }

      const el = document.createElement('test-watch') as any;
      container.appendChild(el);

      const handler = jest.fn();
      el.watch('state.value', handler);

      el.setState({ value: 1 });
      expect(handler).toHaveBeenCalled();
    });
  });
});