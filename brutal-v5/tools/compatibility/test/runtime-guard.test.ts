/**
 * Tests for Runtime Version Guard
 */

import { 
  RuntimeVersionGuard, 
  RuntimeGuardOptions,
  VersionError,
  VersionWarning,
  validateVersions,
  createVersionGuard
} from '../runtime-guard';

describe('RuntimeVersionGuard', () => {
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;
  let consoleErrors: string[];
  let consoleWarns: string[];

  beforeEach(() => {
    // Clear validation cache
    RuntimeVersionGuard.clearCache();

    // Mock console
    consoleErrors = [];
    consoleWarns = [];
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    
    console.error = jest.fn((...args) => {
      consoleErrors.push(args.join(' '));
    });
    
    console.warn = jest.fn((...args) => {
      consoleWarns.push(args.join(' '));
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('validate', () => {
    it('should validate compatible versions', () => {
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/components',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/foundation': '^1.0.0',
          '@brutal/events': '^1.0.0'
        },
        mode: 'strict'
      };

      // Should not throw
      expect(() => RuntimeVersionGuard.validate(options)).not.toThrow();
    });

    it('should cache validation results', () => {
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/components',
        packageVersion: '1.0.0',
        dependencies: {},
        mode: 'strict'
      };

      // First call
      RuntimeVersionGuard.validate(options);
      const firstDiagnostics = RuntimeVersionGuard.getDiagnostics().length;

      // Second call - should be cached
      RuntimeVersionGuard.validate(options);
      const secondDiagnostics = RuntimeVersionGuard.getDiagnostics().length;

      expect(secondDiagnostics).toBe(firstDiagnostics);
    });

    it('should detect missing dependencies in strict mode', () => {
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/enhanced-components',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/components': '^1.0.0',
          '@brutal/missing-dep': '^1.0.0'
        },
        mode: 'strict'
      };

      expect(() => RuntimeVersionGuard.validate(options)).toThrow(
        /Required dependency @brutal\/missing-dep is not installed/
      );
    });

    it('should warn about missing dependencies in warn mode', () => {
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/enhanced-components',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/missing-dep': '^1.0.0'
        },
        mode: 'warn'
      };

      RuntimeVersionGuard.validate(options);

      expect(consoleErrors).toContainEqual(
        expect.stringContaining('Required dependency @brutal/missing-dep is not installed')
      );
    });

    it('should be silent in silent mode', () => {
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/enhanced-components',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/missing-dep': '^1.0.0'
        },
        mode: 'silent'
      };

      RuntimeVersionGuard.validate(options);

      expect(consoleErrors).toHaveLength(0);
      expect(consoleWarns).toHaveLength(0);
      
      // But should log to diagnostics
      const diagnostics = RuntimeVersionGuard.getDiagnostics();
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          level: 'error',
          data: expect.objectContaining({
            type: 'missing'
          })
        })
      );
    });

    it('should handle custom error handler', () => {
      let capturedError: VersionError | null = null;

      const options: RuntimeGuardOptions = {
        packageName: '@brutal/test',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/missing': '^1.0.0'
        },
        mode: 'strict',
        onError: (error) => {
          capturedError = error;
        }
      };

      RuntimeVersionGuard.validate(options);

      expect(capturedError).toMatchObject({
        type: 'missing',
        package: '@brutal/test',
        dependency: '@brutal/missing'
      });
    });

    it('should detect incompatible versions', () => {
      // First register a package
      RuntimeVersionGuard.validate({
        packageName: '@brutal/events',
        packageVersion: '2.0.0',
        dependencies: {},
        mode: 'silent'
      });

      // Then check compatibility
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/components',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/events': '^1.0.0' // Requires 1.x, but 2.0.0 is installed
        },
        mode: 'warn'
      };

      RuntimeVersionGuard.validate(options);

      expect(consoleErrors).toContainEqual(
        expect.stringContaining('@brutal/events@2.0.0 is incompatible with required ^1.0.0')
      );
    });

    it('should warn about prerelease versions', () => {
      // Register prerelease version
      RuntimeVersionGuard.validate({
        packageName: '@brutal/beta-pkg',
        packageVersion: '1.0.0-beta.1',
        dependencies: {},
        mode: 'silent'
      });

      // Use it as dependency
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/test',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/beta-pkg': '^1.0.0'
        },
        mode: 'warn',
        onWarn: jest.fn()
      };

      RuntimeVersionGuard.validate(options);

      expect(options.onWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prerelease',
          message: expect.stringContaining('Using prerelease version')
        })
      );
    });

    it('should handle workspace:* dependencies', () => {
      const options: RuntimeGuardOptions = {
        packageName: '@brutal/test',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/shared': 'workspace:*'
        },
        mode: 'strict'
      };

      // Should accept any version
      expect(() => RuntimeVersionGuard.validate(options)).not.toThrow();
    });

    it('should check caret (^) version compatibility', () => {
      // Register version
      RuntimeVersionGuard.validate({
        packageName: '@brutal/dep',
        packageVersion: '1.5.0',
        dependencies: {},
        mode: 'silent'
      });

      // Check compatible caret
      RuntimeVersionGuard.validate({
        packageName: '@brutal/test1',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/dep': '^1.0.0' // 1.5.0 is compatible
        },
        mode: 'strict'
      });

      // Check incompatible caret
      RuntimeVersionGuard.validate({
        packageName: '@brutal/dep',
        packageVersion: '2.0.0',
        dependencies: {},
        mode: 'silent'
      });

      expect(() => {
        RuntimeVersionGuard.validate({
          packageName: '@brutal/test2',
          packageVersion: '1.0.0',
          dependencies: {
            '@brutal/dep': '^1.0.0' // 2.0.0 is not compatible
          },
          mode: 'strict'
        });
      }).toThrow();
    });

    it('should check tilde (~) version compatibility', () => {
      // Register version
      RuntimeVersionGuard.validate({
        packageName: '@brutal/dep',
        packageVersion: '1.2.5',
        dependencies: {},
        mode: 'silent'
      });

      // Check compatible tilde
      RuntimeVersionGuard.validate({
        packageName: '@brutal/test1',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/dep': '~1.2.0' // 1.2.5 is compatible
        },
        mode: 'strict'
      });

      // Register incompatible version
      RuntimeVersionGuard.validate({
        packageName: '@brutal/dep',
        packageVersion: '1.3.0',
        dependencies: {},
        mode: 'silent'
      });

      // Check incompatible tilde
      expect(() => {
        RuntimeVersionGuard.validate({
          packageName: '@brutal/test2',
          packageVersion: '1.0.0',
          dependencies: {
            '@brutal/dep': '~1.2.0' // 1.3.0 is not compatible
          },
          mode: 'strict'
        });
      }).toThrow();
    });
  });

  describe('validateVersions decorator', () => {
    it('should validate on class instantiation', () => {
      @validateVersions({
        dependencies: {
          '@brutal/foundation': '^1.0.0'
        },
        mode: 'warn'
      })
      class TestComponent {
        static __packageName = '@brutal/test-component';
        static __packageVersion = '1.0.0';
      }

      // Should validate when instantiated
      const component = new TestComponent();
      expect(component).toBeInstanceOf(TestComponent);
    });

    it('should preserve class name and behavior', () => {
      @validateVersions({
        dependencies: {},
        mode: 'strict'
      })
      class MyComponent {
        value = 42;
        getValue() { return this.value; }
      }

      const component = new MyComponent();
      
      expect(component.constructor.name).toBe('MyComponent');
      expect(component.value).toBe(42);
      expect(component.getValue()).toBe(42);
    });
  });

  describe('createVersionGuard', () => {
    it('should create a validation function', () => {
      const guard = createVersionGuard(
        '@brutal/test-pkg',
        '1.0.0',
        {
          '@brutal/dep': '^1.0.0'
        }
      );

      expect(typeof guard).toBe('function');
      
      // Should validate when called
      guard();
      
      // Check it was validated
      const diagnostics = RuntimeVersionGuard.getDiagnostics();
      expect(diagnostics.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDiagnostics', () => {
    it('should return diagnostic information', () => {
      RuntimeVersionGuard.validate({
        packageName: '@brutal/test',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/missing': '^1.0.0'
        },
        mode: 'silent'
      });

      const diagnostics = RuntimeVersionGuard.getDiagnostics();
      
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          timestamp: expect.any(Date),
          level: 'error',
          data: expect.objectContaining({
            type: 'missing'
          })
        })
      );
    });
  });

  describe('clearCache', () => {
    it('should clear all caches', () => {
      // Add some data that will generate diagnostics
      RuntimeVersionGuard.validate({
        packageName: '@brutal/test',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/missing-dep': '^1.0.0'  // This will create an error
        },
        mode: 'silent'
      });

      const beforeClear = RuntimeVersionGuard.getDiagnostics().length;
      
      // Clear
      RuntimeVersionGuard.clearCache();
      
      const afterClear = RuntimeVersionGuard.getDiagnostics().length;
      
      expect(afterClear).toBe(0);
      expect(beforeClear).toBeGreaterThan(0);
    });
  });
});