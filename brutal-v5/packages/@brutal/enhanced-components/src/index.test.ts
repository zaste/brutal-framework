import { describe, it, expect } from '@jest/globals';

// Mock the dependencies
jest.mock('@brutal/components', () => ({
  BrutalComponent: class BrutalComponent {}
}));

jest.mock('./async/AsyncComponent.js', () => ({
  createAsyncComponent: jest.fn(),
  AsyncComponent: jest.fn()
}));

jest.mock('./portal/Portal.js', () => ({
  Portal: class Portal {},
  createPortal: jest.fn(),
  usePortal: jest.fn()
}));

jest.mock('./observer/ObserverComponent.js', () => ({
  ObserverComponent: class ObserverComponent {},
  LazyComponent: class LazyComponent {},
  VisibilityTracker: class VisibilityTracker {}
}));

jest.mock('./lifecycle/AdvancedLifecycle.js', () => ({
  LifecycleComponent: class LifecycleComponent {},
  WithLifecycle: jest.fn(),
  useLifecycle: jest.fn()
}));

import * as exports from './index.js';

describe('@brutal/enhanced-components exports', () => {
  it('should export async components', () => {
    expect(exports.createAsyncComponent).toBeDefined();
    expect(exports.AsyncComponent).toBeDefined();
  });

  it('should export portal components', () => {
    expect(exports.Portal).toBeDefined();
    expect(exports.createPortal).toBeDefined();
    expect(exports.usePortal).toBeDefined();
  });

  it('should export observer components', () => {
    expect(exports.ObserverComponent).toBeDefined();
    expect(exports.LazyComponent).toBeDefined();
    expect(exports.VisibilityTracker).toBeDefined();
  });

  it('should export lifecycle components', () => {
    expect(exports.LifecycleComponent).toBeDefined();
    expect(exports.WithLifecycle).toBeDefined();
    expect(exports.useLifecycle).toBeDefined();
  });

  it('should re-export BrutalComponent', () => {
    expect(exports.BrutalComponent).toBeDefined();
  });

  it('should export VERSION', () => {
    expect(exports.VERSION).toBe('__VERSION__');
  });

  it('should export correct package name', () => {
    expect(exports.PACKAGE_NAME).toBe('@brutal/enhanced-components');
  });

  it('should export DEFAULT_CONFIG', () => {
    expect(exports.DEFAULT_CONFIG).toBeDefined();
  });
});
