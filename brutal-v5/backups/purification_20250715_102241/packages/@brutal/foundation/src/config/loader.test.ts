import { describe, it, expect, beforeEach } from '@jest/globals';
import { configLoader } from './loader.js';

describe('configLoader', () => {
  beforeEach(() => {
    configLoader.reset();
  });

  it('should load config', () => {
    configLoader.load({
      debug: true,
      env: 'test'
    });
    
    expect(configLoader.get('debug')).toBe(true);
    expect(configLoader.get('env')).toBe('test');
  });

  it('should set individual values', () => {
    configLoader.set('debug', false);
    expect(configLoader.get('debug')).toBe(false);
  });

  it('should merge configs', () => {
    configLoader.load({ debug: true });
    configLoader.load({ env: 'production' });
    
    expect(configLoader.get('debug')).toBe(true);
    expect(configLoader.get('env')).toBe('production');
  });
});
