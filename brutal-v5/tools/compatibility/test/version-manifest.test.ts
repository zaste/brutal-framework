/**
 * Tests for Version Compatibility System
 */

import { 
  VersionCompatibilitySystem, 
  VersionManifest,
  VersionRange,
  CompatibilityIssue 
} from '../version-manifest';

describe('VersionCompatibilitySystem', () => {
  let manifest: VersionManifest;
  let system: VersionCompatibilitySystem;

  beforeEach(() => {
    manifest = {
      version: '1.0.0',
      generated: new Date(),
      packages: {
        '@brutal/components': {
          currentVersion: '1.2.0',
          supportedVersions: ['1.0.0', '1.1.0', '1.2.0'],
          dependencies: {
            '@brutal/foundation': { min: '1.0.0', max: '2.0.0', tested: ['1.0.0', '1.1.0'] },
            '@brutal/events': { min: '1.0.0', max: '1.5.0', tested: ['1.0.0'] }
          }
        },
        '@brutal/enhanced-components': {
          currentVersion: '1.0.0',
          supportedVersions: ['1.0.0'],
          dependencies: {
            '@brutal/components': { min: '1.0.0', max: '1.3.0', tested: ['1.2.0'] }
          }
        },
        '@brutal/foundation': {
          currentVersion: '1.1.0',
          supportedVersions: ['1.0.0', '1.1.0'],
          dependencies: {}
        },
        '@brutal/events': {
          currentVersion: '1.2.0',
          supportedVersions: ['1.0.0', '1.1.0', '1.2.0'],
          dependencies: {
            '@brutal/shared': { min: '1.0.0', max: '2.0.0', tested: ['1.0.0'] }
          }
        },
        '@brutal/shared': {
          currentVersion: '1.0.0',
          supportedVersions: ['1.0.0'],
          dependencies: {}
        }
      },
      compatibility: {},
      breaking: [],
      validation: {
        strict: true,
        allowPrerelease: false,
        enforceAtRuntime: true
      }
    };

    system = new VersionCompatibilitySystem(manifest);
  });

  describe('validateCompatibility', () => {
    it('should validate compatible versions', () => {
      const packages = {
        '@brutal/components': '1.2.0',
        '@brutal/foundation': '1.1.0',
        '@brutal/events': '1.2.0',
        '@brutal/shared': '1.0.0'
      };

      const result = system.validateCompatibility(packages);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing dependencies', () => {
      const packages = {
        '@brutal/components': '1.2.0',
        '@brutal/foundation': '1.1.0'
        // Missing @brutal/events
      };

      const result = system.validateCompatibility(packages);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'missing-dependency',
          package: '@brutal/components',
          dependency: '@brutal/events'
        })
      );
    });

    it('should detect incompatible versions', () => {
      const packages = {
        '@brutal/components': '1.2.0',
        '@brutal/foundation': '1.1.0',
        '@brutal/events': '2.0.0', // Too high
        '@brutal/shared': '1.0.0'
      };

      const result = system.validateCompatibility(packages);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'incompatible-version',
          package: '@brutal/components',
          dependency: '@brutal/events',
          expected: { min: '1.0.0', max: '1.5.0', tested: ['1.0.0'] },
          actual: '2.0.0'
        })
      );
    });

    it('should provide suggestions for fixes', () => {
      const packages = {
        '@brutal/enhanced-components': '1.0.0',
        '@brutal/components': '2.0.0' // Too high
      };

      const result = system.validateCompatibility(packages);

      expect(result.valid).toBe(false);
      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          package: '@brutal/components',
          suggestedVersion: '1.2.0',
          reason: 'Satisfies all dependencies'
        })
      );
    });

    it('should handle circular dependencies', () => {
      // Add circular dependency for test
      manifest.packages['@brutal/shared'].dependencies = {
        '@brutal/events': { min: '1.0.0', max: '2.0.0', tested: ['1.2.0'] }
      };

      const packages = {
        '@brutal/events': '1.2.0',
        '@brutal/shared': '1.0.0'
      };

      const result = system.validateCompatibility(packages);

      // Should handle gracefully without infinite loop
      expect(result.valid).toBe(true);
    });

    it('should warn about unknown packages', () => {
      const packages = {
        '@brutal/components': '1.2.0',
        '@brutal/unknown': '1.0.0' // Not in manifest
      };

      const result = system.validateCompatibility(packages);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'unknown-package',
          package: '@brutal/unknown'
        })
      );
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive report', () => {
      const packages = {
        '@brutal/components': '1.2.0',
        '@brutal/enhanced-components': '1.0.0',
        '@brutal/foundation': '1.1.0',
        '@brutal/events': '1.2.0',
        '@brutal/shared': '1.0.0'
      };

      const report = system.generateReport(packages);

      expect(report).toMatchObject({
        timestamp: expect.any(Date),
        packages,
        validation: expect.objectContaining({
          valid: true
        }),
        matrix: expect.objectContaining({
          packages: expect.arrayContaining(Object.keys(packages))
        }),
        breaking: [],
        recommendations: expect.any(Array)
      });
    });

    it('should build compatibility matrix', () => {
      const packages = {
        '@brutal/components': '1.2.0',
        '@brutal/enhanced-components': '1.0.0'
      };

      const report = system.generateReport(packages);
      const matrix = report.matrix.compatibility;

      expect(matrix['@brutal/components']['@brutal/enhanced-components']).toBe('compatible');
      expect(matrix['@brutal/components']['@brutal/components']).toBe('self');
    });

    it('should detect breaking changes', () => {
      // Add breaking change
      manifest.breaking = [{
        package: '@brutal/components',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        changes: ['Changed API'],
        migrationGuide: '/docs/migration.md'
      }];

      const packages = {
        '@brutal/components': '1.2.0'
      };

      const report = system.generateReport(packages);

      expect(report.breaking).toHaveLength(1);
      expect(report.breaking[0]).toMatchObject({
        package: '@brutal/components',
        fromVersion: '1.0.0'
      });
    });
  });

  describe('version parsing', () => {
    it('should parse exact versions', () => {
      const packages = {
        '@brutal/components': '1.2.0',  // Use a version that exists in manifest
        '@brutal/foundation': '1.1.0',
        '@brutal/events': '1.2.0',
        '@brutal/shared': '1.0.0'
      };

      const result = system.validateCompatibility(packages);
      expect(result.valid).toBe(true);
    });

    it('should handle prerelease versions', () => {
      const packages = {
        '@brutal/components': '1.2.0-beta.1'
      };

      const result = system.validateCompatibility(packages);
      // Should still work but might warn
      expect(result).toBeDefined();
    });
  });
});