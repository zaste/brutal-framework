import { Router } from './router';
import { navigate } from '../navigation/navigation';

describe('@brutal/routing - Router', () => {
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
  
  describe('routing', () => {
    it('should match exact routes', () => {
      let rendered = false;
      
      router.addRoute({
        path: '/about',
        component: () => {
          rendered = true;
          return '<h1>About</h1>';
        }
      });
      
      router.navigate('/about');
      expect(rendered).toBe(true);
      expect(container.innerHTML).toBe('<h1>About</h1>');
    });
    
    it('should extract path params', () => {
      let capturedParams: any = null;
      
      router.addRoute({
        path: '/users/:id',
        component: () => '<h1>User</h1>',
        beforeEnter: (params) => {
          capturedParams = params;
          return true;
        }
      });
      
      router.navigate('/users/123');
      expect(capturedParams).toEqual({
        params: { id: '123' },
        query: {},
        hash: ''
      });
    });
    
    it('should handle query params', () => {
      let capturedParams: any = null;
      
      router.addRoute({
        path: '/search',
        component: () => '<h1>Search</h1>',
        beforeEnter: (params) => {
          capturedParams = params;
          return true;
        }
      });
      
      router.navigate('/search?q=test&page=2');
      expect(capturedParams).toEqual({
        params: {},
        query: { q: 'test', page: '2' },
        hash: ''
      });
    });
    
    it('should render 404 for unknown routes', () => {
      router.navigate('/unknown');
      expect(container.innerHTML).toBe('<h1>404 - Page not found</h1>');
      expect(document.title).toBe('404 - Not Found');
    });
    
    it('should respect beforeEnter guards', () => {
      let rendered = false;
      
      router.addRoute({
        path: '/protected',
        component: () => {
          rendered = true;
          return '<h1>Protected</h1>';
        },
        beforeEnter: () => false
      });
      
      router.navigate('/protected');
      expect(rendered).toBe(false);
      expect(container.innerHTML).toBe('');
    });
  });
});