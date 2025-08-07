import { describe, it, expect } from '@jest/globals';
import { ExampleFeature, VERSION, PACKAGE_NAME } from './index.js';

describe('@brutal/components exports', () => {
  it('should export ExampleFeature', () => {
    expect(ExampleFeature).toBeDefined();
  });

  it('should export VERSION', () => {
    expect(VERSION).toBe('__VERSION__');
  });

  it('should export correct package name', () => {
    expect(PACKAGE_NAME).toBe('@brutal/components');
  });
});
