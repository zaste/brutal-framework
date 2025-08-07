import { Route } from './route';

describe('@brutal/routing - Route', () => {
  describe('matching', () => {
    it('should match exact paths', () => {
      const route = new Route({ path: '/about' });
      expect(route.matches('/about')).toBe(true);
      expect(route.matches('/home')).toBe(false);
      expect(route.matches('/about/team')).toBe(false);
    });
    
    it('should match paths with params', () => {
      const route = new Route({ path: '/users/:id' });
      expect(route.matches('/users/123')).toBe(true);
      expect(route.matches('/users/abc')).toBe(true);
      expect(route.matches('/users')).toBe(false);
    });
    
    it('should match multiple params', () => {
      const route = new Route({ path: '/posts/:year/:month/:slug' });
      expect(route.matches('/posts/2024/01/hello')).toBe(true);
      expect(route.matches('/posts/2024/01')).toBe(false);
    });
    
    it('should match wildcard paths', () => {
      const route = new Route({ path: '/docs/*' });
      expect(route.matches('/docs/api')).toBe(true);
      expect(route.matches('/docs/api/users')).toBe(true);
      expect(route.matches('/docs')).toBe(false);
    });
  });
  
  describe('param extraction', () => {
    it('should extract single param', () => {
      const route = new Route({ path: '/users/:id' });
      const params = route.extractParams('/users/123');
      expect(params).toEqual({ id: '123' });
    });
    
    it('should extract multiple params', () => {
      const route = new Route({ path: '/posts/:year/:month/:slug' });
      const params = route.extractParams('/posts/2024/01/hello');
      expect(params).toEqual({ 
        year: '2024', 
        month: '01', 
        slug: 'hello' 
      });
    });
    
    it('should return empty object for no params', () => {
      const route = new Route({ path: '/about' });
      const params = route.extractParams('/about');
      expect(params).toEqual({});
    });
    
    it('should handle missing param values', () => {
      const route = new Route({ path: '/users/:id/:action?' });
      const params = route.extractParams('/users/123');
      expect(params).toEqual({ id: '123', action: '' });
    });
    
    it('should handle non-matching paths', () => {
      const route = new Route({ path: '/users/:id' });
      const params = route.extractParams('/posts/123');
      expect(params).toEqual({});
    });
  });
});