/**
 * Tests for Compatibility Matrix Generator
 */

import { CompatibilityMatrixGenerator, PackageJson } from '../matrix-generator';
import { VersionManifest } from '../version-manifest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CompatibilityMatrixGenerator', () => {
  let testDir: string;
  let generator: CompatibilityMatrixGenerator;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), `brutal-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'packages', '@brutal'), { recursive: true });
    
    generator = new CompatibilityMatrixGenerator(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  async function createPackage(name: string, pkg: PackageJson): Promise<void> {
    const pkgDir = join(testDir, 'packages', '@brutal', name);
    await mkdir(pkgDir, { recursive: true });
    await writeFile(
      join(pkgDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
  }

  describe('generate', () => {
    it('should discover and analyze packages', async () => {
      // Create test packages
      await createPackage('components', {
        name: '@brutal/components',
        version: '1.0.0',
        dependencies: {
          '@brutal/foundation': 'workspace:*',
          '@brutal/events': 'workspace:*'
        }
      });

      await createPackage('foundation', {
        name: '@brutal/foundation',
        version: '1.0.0',
        dependencies: {}
      });

      await createPackage('events', {
        name: '@brutal/events',
        version: '1.0.0',
        dependencies: {
          '@brutal/shared': 'workspace:*'
        }
      });

      await createPackage('shared', {
        name: '@brutal/shared',
        version: '1.0.0',
        dependencies: {}
      });

      const manifest = await generator.generate();

      expect(manifest).toMatchObject({
        version: '1.0.0',
        generated: expect.any(Date),
        packages: expect.objectContaining({
          '@brutal/components': expect.objectContaining({
            currentVersion: '1.0.0',
            dependencies: expect.objectContaining({
              '@brutal/foundation': expect.any(Object),
              '@brutal/events': expect.any(Object)
            })
          }),
          '@brutal/foundation': expect.objectContaining({
            currentVersion: '1.0.0',
            dependencies: {}
          })
        })
      });
    });

    it('should handle workspace protocol', async () => {
      await createPackage('enhanced-components', {
        name: '@brutal/enhanced-components',
        version: '1.0.0',
        dependencies: {
          '@brutal/components': 'workspace:^'
        }
      });

      await createPackage('components', {
        name: '@brutal/components',
        version: '1.0.0',
        dependencies: {}
      });

      const manifest = await generator.generate();
      const deps = manifest.packages['@brutal/enhanced-components'].dependencies;

      expect(deps['@brutal/components']).toMatchObject({
        min: '0.0.0',
        max: '999.999.999'
      });
    });

    it('should parse version ranges correctly', async () => {
      await createPackage('test-pkg', {
        name: '@brutal/test-pkg',
        version: '1.0.0',
        dependencies: {
          '@brutal/dep1': '^1.2.3',
          '@brutal/dep2': '~1.2.3',
          '@brutal/dep3': '1.2.3'
        }
      });

      const manifest = await generator.generate();
      const deps = manifest.packages['@brutal/test-pkg'].dependencies;

      expect(deps['@brutal/dep1']).toMatchObject({
        min: '1.2.3',
        max: '2.0.0'
      });

      expect(deps['@brutal/dep2']).toMatchObject({
        min: '1.2.3',
        max: '1.3.0'
      });

      expect(deps['@brutal/dep3']).toMatchObject({
        min: '1.2.3',
        max: '1.2.3'
      });
    });

    it('should detect breaking changes from package metadata', async () => {
      await createPackage('with-breaking', {
        name: '@brutal/with-breaking',
        version: '2.0.0',
        brutal: {
          compatibility: {
            breaking: ['1.0.0', '1.5.0']
          }
        }
      });

      const manifest = await generator.generate();

      expect(manifest.breaking).toContainEqual(
        expect.objectContaining({
          package: '@brutal/with-breaking',
          fromVersion: '1.0.0',
          toVersion: '2.0.0'
        })
      );
    });

    it('should add notes about package characteristics', async () => {
      await createPackage('alpha-pkg', {
        name: '@brutal/alpha-pkg',
        version: '1.0.0-alpha.1',
        dependencies: {}
      });

      await createPackage('multi-dep', {
        name: '@brutal/multi-dep',
        version: '1.0.0',
        dependencies: {
          '@brutal/dep1': '1.0.0',
          '@brutal/dep2': '1.0.0',
          '@brutal/dep3': '1.0.0'
        }
      });

      const manifest = await generator.generate();
      const matrix = manifest.compatibility;

      expect(matrix['@brutal/alpha-pkg']['1.0.0-alpha.1'].notes)
        .toContain('Pre-release version');

      expect(matrix['@brutal/multi-dep']['1.0.0'].notes)
        .toContain('Warning: 3 @brutal dependencies');
    });
  });

  describe('save', () => {
    it('should save manifest to JSON file', async () => {
      const manifest: VersionManifest = {
        version: '1.0.0',
        generated: new Date(),
        packages: {},
        compatibility: {},
        breaking: [],
        validation: {
          strict: true,
          allowPrerelease: false,
          enforceAtRuntime: true
        }
      };

      const outputPath = join(testDir, 'test-manifest.json');
      await generator.save(manifest, outputPath);

      const { readFile } = await import('fs/promises');
      const saved = JSON.parse(await readFile(outputPath, 'utf-8'));

      expect(saved).toMatchObject({
        version: '1.0.0',
        packages: {},
        compatibility: {}
      });
    });
  });

  describe('generateHTMLReport', () => {
    it('should generate HTML report', async () => {
      const manifest: VersionManifest = {
        version: '1.0.0',
        generated: new Date(),
        packages: {
          '@brutal/components': {
            currentVersion: '1.0.0',
            supportedVersions: ['1.0.0'],
            dependencies: {
              '@brutal/events': { min: '1.0.0', max: '2.0.0', tested: ['1.0.0'] }
            }
          },
          '@brutal/events': {
            currentVersion: '1.0.0',
            supportedVersions: ['1.0.0'],
            dependencies: {}
          }
        },
        compatibility: {},
        breaking: [{
          package: '@brutal/components',
          fromVersion: '0.9.0',
          toVersion: '1.0.0',
          changes: ['API change'],
          migrationGuide: '/migration.md'
        }],
        validation: {
          strict: true,
          allowPrerelease: false,
          enforceAtRuntime: true
        }
      };

      const outputPath = join(testDir, 'test-report.html');
      await generator.generateHTMLReport(manifest, outputPath);

      const { readFile } = await import('fs/promises');
      const html = await readFile(outputPath, 'utf-8');

      expect(html).toContain('BRUTAL V5 Compatibility Matrix');
      expect(html).toContain('@brutal/components');
      expect(html).toContain('Breaking Changes');
      expect(html).toContain('migration.md');
    });
  });
});