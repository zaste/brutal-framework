import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createRouter } from '../src/index';

describe('Router', () => {
  let router: any;
  
  beforeEach(() => {
    // Reset location
    window.history.pushState({}, '', '/');
  });
  
  afterEach(() => {
    // Cleanup
    if (router) {
      router = null;
    }
  });
  
  describe('basic routing', () => {
    it('should create a router instance', () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/about', c: 'About' }
        ]
      });
      
      expect(router).toBeDefined();
      expect(router.c).toBeDefined();
      expect(router.p).toBeDefined();
      expect(router.r).toBeDefined();
    });
    
    it('should match simple routes', () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/about', c: 'About' },
          { p: '/contact', c: 'Contact' }
        ]
      });
      
      const current = router.c();
      expect(current.p).toBe('/');
      expect(current.r.c).toBe('Home');
    });
    
    it('should navigate between routes', async () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/about', c: 'About' }
        ]
      });
      
      await router.p('/about');
      
      const current = router.c();
      expect(current.p).toBe('/about');
      expect(current.r.c).toBe('About');
    });
    
    it('should handle route parameters', async () => {
      router = createRouter({
        r: [
          { p: '/user/:id', c: 'User' },
          { p: '/post/:id/edit', c: 'EditPost' }
        ]
      });
      
      await router.p('/user/123');
      
      let current = router.c();
      expect(current.p).toBe('/user/123');
      expect(current.r.c).toBe('User');
      
      await router.p('/post/456/edit');
      
      current = router.c();
      expect(current.p).toBe('/post/456/edit');
      expect(current.r.c).toBe('EditPost');
    });
    
    it('should parse query parameters', async () => {
      router = createRouter({
        r: [
          { p: '/search', c: 'Search' }
        ]
      });
      
      await router.p('/search?q=hello&category=books');
      
      const current = router.c();
      expect(current.p).toBe('/search');
      expect(current.q.q).toBe('hello');
      expect(current.q.category).toBe('books');
    });
    
    it('should handle hash', async () => {
      router = createRouter({
        r: [
          { p: '/docs', c: 'Docs' }
        ]
      });
      
      await router.p('/docs#installation');
      
      const current = router.c();
      expect(current.p).toBe('/docs');
      expect(current.h).toBe('#installation');
    });
  });
  
  describe('navigation guards', () => {
    it('should execute before guards', async () => {
      let guardCalled = false;
      
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/protected', c: 'Protected' }
        ]
      });
      
      router.bg((to: any, from: any, next: any) => {
        guardCalled = true;
        next();
      });
      
      await router.p('/protected');
      
      expect(guardCalled).toBe(true);
      expect(router.c().p).toBe('/protected');
    });
    
    it('should allow guard to cancel navigation', async () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/protected', c: 'Protected' }
        ]
      });
      
      router.bg((to: any, from: any, next: any) => {
        if (to.p === '/protected') {
          next(false);
        } else {
          next();
        }
      });
      
      await router.p('/protected');
      
      expect(router.c().p).toBe('/');
    });
    
    it('should execute route-specific guards', async () => {
      let guardCalled = false;
      
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { 
            p: '/admin',
            c: 'Admin',
            g: [(to: any, from: any, next: any) => {
              guardCalled = true;
              next();
            }]
          }
        ]
      });
      
      await router.p('/admin');
      
      expect(guardCalled).toBe(true);
      expect(router.c().p).toBe('/admin');
    });
    
    it('should execute after guards', async () => {
      let afterCalled = false;
      let toRoute: any;
      let fromRoute: any;
      
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/about', c: 'About' }
        ]
      });
      
      router.ag((to: any, from: any) => {
        afterCalled = true;
        toRoute = to;
        fromRoute = from;
      });
      
      await router.p('/about');
      
      expect(afterCalled).toBe(true);
      expect(toRoute.p).toBe('/about');
      expect(fromRoute.p).toBe('/');
    });
  });
  
  describe('history modes', () => {
    it('should support hash mode', async () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/about', c: 'About' }
        ],
        m: 'x'
      });
      
      await router.p('/about');
      
      expect(window.location.hash).toBe('#/about');
      expect(router.c().p).toBe('/about');
    });
    
    it('should support history mode', async () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/about', c: 'About' }
        ],
        m: 'h'
      });
      
      await router.p('/about');
      
      expect(window.location.pathname).toBe('/about');
      expect(router.c().p).toBe('/about');
    });
  });
  
  describe('navigation methods', () => {
    it('should support replace navigation', async () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/about', c: 'About' },
          { p: '/contact', c: 'Contact' }
        ]
      });
      
      // Navigate normally
      await router.p('/about');
      
      // Replace current entry
      await router.r('/contact');
      
      expect(router.c().p).toBe('/contact');
      
      // Going back should go to home, not about
      router.b();
      
      // Note: Can't easily test browser back in Jest
    });
    
    it('should support go, back, and forward', () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' }
        ]
      });
      
      // These methods exist
      expect(typeof router.g).toBe('function');
      expect(typeof router.b).toBe('function');
      expect(typeof router.f).toBe('function');
      
      // They delegate to history API
      router.g(-1);
      router.b();
      router.f();
    });
  });
  
  describe('wildcard routes', () => {
    it('should match wildcard routes', async () => {
      router = createRouter({
        r: [
          { p: '/', c: 'Home' },
          { p: '/files/*', c: 'Files' }
        ]
      });
      
      await router.p('/files/documents/report.pdf');
      
      expect(router.c().p).toBe('/files/documents/report.pdf');
      expect(router.c().r.c).toBe('Files');
    });
  });
});