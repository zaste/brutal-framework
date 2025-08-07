import { jest } from '@jest/globals';
import { Router } from './router';

describe('@brutal/routing - Router Comprehensive', () => {
  let router: Router;
  let container: HTMLElement;
  
  beforeEach(() => {
    router = new Router();
    container = document.createElement('div');
    document.body.appendChild(container);
    router.setContainer(container);
    
    // Reset URL
    window.history.pushState(null, '', '/');
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  describe('currentRoute getter', () => {
    it('should return current route after navigation', () => {
      router.addRoute({
        path: '/test',
        component: () => 'Test'
      });
      
      expect(router.currentRoute).toBeNull();
      router.navigate('/test');
      expect(router.currentRoute).not.toBeNull();
      expect(router.currentRoute?.config.path).toBe('/test');
    });
  });
  
  describe('constructor event listeners', () => {
    it('should handle popstate events', () => {
      let rendered = false;
      router.addRoute({
        path: '/back',
        component: () => {
          rendered = true;
          return 'Back';
        }
      });
      
      // Navigate to route
      window.history.pushState(null, '', '/back');
      
      // Trigger popstate
      const event = new PopStateEvent('popstate');
      window.dispatchEvent(event);
      
      expect(rendered).toBe(true);
    });
    
    it('should intercept link clicks', () => {
      const link = document.createElement('a');
      link.href = window.location.origin + '/internal';
      document.body.appendChild(link);
      
      const spy = jest.spyOn(router, 'navigate');
      
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      
      expect(spy).toHaveBeenCalledWith('/internal');
      
      document.body.removeChild(link);
    });
    
    it('should not intercept external links', () => {
      const link = document.createElement('a');
      link.href = 'https://external.com';
      document.body.appendChild(link);
      
      const spy = jest.spyOn(router, 'navigate');
      
      const event = new MouseEvent('click', { bubbles: true });
      link.dispatchEvent(event);
      
      expect(spy).not.toHaveBeenCalled();
      
      document.body.removeChild(link);
    });
    
    it('should handle clicks on nested elements within links', () => {
      const link = document.createElement('a');
      link.href = window.location.origin + '/nested';
      const span = document.createElement('span');
      link.appendChild(span);
      document.body.appendChild(link);
      
      const spy = jest.spyOn(router, 'navigate');
      
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      span.dispatchEvent(event);
      
      expect(spy).toHaveBeenCalledWith('/nested');
      
      document.body.removeChild(link);
    });
  });
  
  describe('addRoutes', () => {
    it('should add multiple routes', () => {
      let route1Called = false;
      let route2Called = false;
      
      router.addRoutes([
        {
          path: '/route1',
          component: () => {
            route1Called = true;
            return 'Route 1';
          }
        },
        {
          path: '/route2',
          component: () => {
            route2Called = true;
            return 'Route 2';
          }
        }
      ]);
      
      router.navigate('/route1');
      expect(route1Called).toBe(true);
      expect(route2Called).toBe(false);
      
      router.navigate('/route2');
      expect(route2Called).toBe(true);
    });
  });
  
  describe('start', () => {
    it('should handle initial navigation', () => {
      window.history.pushState(null, '', '/initial');
      
      let rendered = false;
      router.addRoute({
        path: '/initial',
        component: () => {
          rendered = true;
          return 'Initial';
        }
      });
      
      router.start();
      expect(rendered).toBe(true);
    });
  });
  
  describe('navigate edge cases', () => {
    it('should not push state when navigating to current URL', () => {
      const pushStateSpy = jest.spyOn(window.history, 'pushState');
      
      router.addRoute({
        path: '/current',
        component: () => 'Current'
      });
      
      router.navigate('/current');
      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      
      // Navigate to same URL again
      router.navigate('/current');
      expect(pushStateSpy).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
  
  describe('beforeEnter guard', () => {
    it('should handle async beforeEnter guards', async () => {
      let rendered = false;
      
      router.addRoute({
        path: '/async',
        component: () => {
          rendered = true;
          return 'Async';
        },
        beforeEnter: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return true;
        }
      });
      
      router.navigate('/async');
      
      // Wait for async guard
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(rendered).toBe(true);
    });
  });
  
  describe('title handling', () => {
    it('should update document title when route has title', () => {
      router.addRoute({
        path: '/titled',
        title: 'Custom Title',
        component: () => 'Titled'
      });
      
      router.navigate('/titled');
      expect(document.title).toBe('Custom Title');
    });
  });
  
  describe('render variations', () => {
    it('should handle routes without components', () => {
      router.addRoute({
        path: '/empty'
      });
      
      container.innerHTML = 'Previous content';
      router.navigate('/empty');
      expect(container.innerHTML).toBe('');
    });
    
    it('should handle HTMLElement components', () => {
      const div = document.createElement('div');
      div.textContent = 'Element component';
      
      router.addRoute({
        path: '/element',
        component: () => div
      });
      
      router.navigate('/element');
      expect(container.contains(div)).toBe(true);
      expect(container.textContent).toBe('Element component');
    });
    
    it('should handle missing container', () => {
      const routerNoContainer = new Router();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      routerNoContainer.addRoute({
        path: '/test',
        component: () => 'Test'
      });
      
      routerNoContainer.navigate('/test');
      expect(consoleSpy).toHaveBeenCalledWith('[Router] No container element set');
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('URL parsing', () => {
    it('should handle URLs with hash', () => {
      let capturedParams: any = null;
      
      router.addRoute({
        path: '/page',
        component: () => 'Page',
        beforeEnter: (params) => {
          capturedParams = params;
          return true;
        }
      });
      
      router.navigate('/page#section');
      expect(capturedParams).toEqual({
        params: {},
        query: {},
        hash: 'section'
      });
    });
    
    it('should handle URLs with query and hash', () => {
      let capturedParams: any = null;
      
      router.addRoute({
        path: '/complex',
        component: () => 'Complex',
        beforeEnter: (params) => {
          capturedParams = params;
          return true;
        }
      });
      
      router.navigate('/complex?foo=bar&baz=qux#anchor');
      expect(capturedParams).toEqual({
        params: {},
        query: { foo: 'bar', baz: 'qux' },
        hash: 'anchor'
      });
    });
    
    it('should handle URLs with hash before query (unusual case)', () => {
      let capturedParams: any = null;
      
      router.addRoute({
        path: '/unusual',
        component: () => 'Unusual',
        beforeEnter: (params) => {
          capturedParams = params;
          return true;
        }
      });
      
      router.navigate('/unusual#section?ignored=true');
      expect(capturedParams).toEqual({
        params: {},
        query: {},
        hash: 'section?ignored=true'
      });
    });
    
    it('should handle routes with empty pathname', () => {
      // Mock extractParams to verify it's called correctly
      const mockRoute = {
        config: { 
          path: '/',
          component: () => 'Root'
        },
        matches: jest.fn().mockReturnValue(true),
        extractParams: jest.fn().mockReturnValue({ test: 'value' })
      };
      
      // Directly test extractParams with empty pathname
      const result = router['extractParams']('', mockRoute as any);
      expect(result.params).toEqual({});
      expect(mockRoute.extractParams).not.toHaveBeenCalled();
    });
    
    it('should handle malformed URLs gracefully', () => {
      router.addRoute({
        path: '/test',
        component: () => 'Test'
      });
      
      // Should not throw
      expect(() => router.navigate('/test?')).not.toThrow();
      expect(() => router.navigate('/test#')).not.toThrow();
    });
  });
  
  describe('render404', () => {
    it('should render 404 without container', () => {
      const routerNoContainer = new Router();
      
      // Should not throw
      expect(() => routerNoContainer.navigate('/404')).not.toThrow();
      expect(document.title).toBe('404 - Not Found');
    });
  });
});