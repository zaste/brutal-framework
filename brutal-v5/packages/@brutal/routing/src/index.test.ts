import { Router, Route, navigate, back, forward, PACKAGE_NAME, VERSION } from './index';

describe('@brutal/routing', () => {
  it('should export all public APIs', () => {
    expect(Router).toBeDefined();
    expect(Route).toBeDefined();
    expect(navigate).toBeDefined();
    expect(back).toBeDefined();
    expect(forward).toBeDefined();
    expect(PACKAGE_NAME).toBe('@brutal/routing');
    expect(VERSION).toBeDefined();
  });
  
  it('should create router instance', () => {
    const router = new Router();
    expect(router).toBeInstanceOf(Router);
  });
  
  it('should create route instance', () => {
    const route = new Route({ path: '/test' });
    expect(route).toBeInstanceOf(Route);
  });
});
