import { compile, render, PACKAGE_NAME, VERSION } from './index';

describe('@brutal/templates', () => {
  it('should export all public APIs', () => {
    expect(compile).toBeDefined();
    expect(render).toBeDefined();
    expect(PACKAGE_NAME).toBe('@brutal/templates');
    expect(VERSION).toBeDefined();
  });
  
  it('should integrate compile and render', () => {
    const result = render('Hello {{name}}!', { name: 'Test' });
    expect(result).toBe('Hello Test!');
  });
});