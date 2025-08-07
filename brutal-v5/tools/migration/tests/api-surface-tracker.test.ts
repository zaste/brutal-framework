import { describe, it, expect, beforeEach } from '@jest/globals';
import { APISurfaceTracker } from '../api-surface-tracker.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('APISurfaceTracker', () => {
  let tracker: APISurfaceTracker;
  let testDir: string;

  beforeEach(async () => {
    tracker = new APISurfaceTracker();
    testDir = join(tmpdir(), `api-tracker-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createTestPackage(content: string, packageJson: any = {}) {
    const srcDir = join(testDir, 'src');
    await mkdir(srcDir, { recursive: true });
    
    await writeFile(join(srcDir, 'index.ts'), content);
    
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: '@brutal/test',
        version: '1.0.0',
        main: 'src/index.ts',
        ...packageJson
      }, null, 2)
    );
    
    await writeFile(
      join(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'es2020',
          module: 'esnext',
          lib: ['es2020']
        }
      }, null, 2)
    );
  }

  it('should track exported classes', async () => {
    await createTestPackage(`
      export class MyClass {
        public prop: string = '';
        private _hidden: number = 0;
        
        constructor(value: string) {
          this.prop = value;
        }
        
        public method(): void {}
        protected protectedMethod(): void {}
        private privateMethod(): void {}
      }
    `);

    const surface = await tracker.trackPackage(testDir);

    expect(surface.exports).toHaveLength(1);
    expect(surface.exports[0]).toMatchObject({
      name: 'MyClass',
      kind: 'class',
      members: expect.arrayContaining([
        expect.objectContaining({
          name: 'prop',
          kind: 'property',
          visibility: 'public'
        }),
        expect.objectContaining({
          name: 'method',
          kind: 'method',
          visibility: 'public'
        })
      ])
    });

    // Private members should not be tracked
    const privateMember = surface.exports[0].members?.find(
      m => m.name === 'privateMethod'
    );
    expect(privateMember).toBeUndefined();
  });

  it('should track exported interfaces', async () => {
    await createTestPackage(`
      export interface MyInterface {
        required: string;
        optional?: number;
        readonly immutable: boolean;
      }
    `);

    const surface = await tracker.trackPackage(testDir);

    expect(surface.exports).toHaveLength(1);
    expect(surface.exports[0]).toMatchObject({
      name: 'MyInterface',
      kind: 'interface',
      members: expect.arrayContaining([
        expect.objectContaining({
          name: 'required',
          optional: false
        }),
        expect.objectContaining({
          name: 'optional',
          optional: true
        }),
        expect.objectContaining({
          name: 'immutable',
          readonly: true
        })
      ])
    });
  });

  it('should track exported functions', async () => {
    await createTestPackage(`
      /**
       * This is a test function
       * @param name The name parameter
       * @returns A greeting string
       */
      export function greet(name: string): string {
        return 'Hello ' + name;
      }
      
      export async function asyncFunc<T>(value: T): Promise<T> {
        return value;
      }
    `);

    const surface = await tracker.trackPackage(testDir);

    expect(surface.exports).toHaveLength(2);
    
    const greetFunc = surface.exports.find(e => e.name === 'greet');
    expect(greetFunc).toMatchObject({
      kind: 'function',
      documentation: expect.stringContaining('test function')
    });

    const asyncFunc = surface.exports.find(e => e.name === 'asyncFunc');
    expect(asyncFunc?.generics).toContain('T');
  });

  it('should track exported types and enums', async () => {
    await createTestPackage(`
      export type MyType = string | number;
      
      export enum Status {
        Active = 'ACTIVE',
        Inactive = 'INACTIVE'
      }
    `);

    const surface = await tracker.trackPackage(testDir);

    const typeExport = surface.exports.find(e => e.name === 'MyType');
    expect(typeExport?.kind).toBe('type');

    const enumExport = surface.exports.find(e => e.name === 'Status');
    expect(enumExport?.kind).toBe('enum');
    expect(enumExport?.members).toHaveLength(2);
  });

  it('should track JSDoc tags', async () => {
    await createTestPackage(`
      /**
       * @deprecated Use newFunction instead
       * @since 1.0.0
       * @stability experimental
       */
      export function oldFunction(): void {}
    `);

    const surface = await tracker.trackPackage(testDir);

    expect(surface.exports[0]).toMatchObject({
      deprecated: true,
      since: '1.0.0',
      stability: 'experimental'
    });
  });

  it('should generate consistent hash', async () => {
    await createTestPackage(`
      export class A {}
      export class B {}
    `);

    const surface1 = await tracker.trackPackage(testDir);
    const surface2 = await tracker.trackPackage(testDir);

    expect(surface1.hash).toBe(surface2.hash);
  });

  it('should compare API surfaces', async () => {
    const oldSurface = {
      package: '@brutal/test',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      exports: [
        {
          name: 'OldClass',
          kind: 'class' as const,
          signature: 'class OldClass',
          members: []
        },
        {
          name: 'KeepClass',
          kind: 'class' as const,
          signature: 'class KeepClass',
          members: []
        }
      ],
      hash: 'old-hash',
      stats: {
        totalExports: 2,
        classes: 2,
        interfaces: 0,
        functions: 0,
        types: 0,
        enums: 0,
        constants: 0
      }
    };

    const newSurface = {
      package: '@brutal/test',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      exports: [
        {
          name: 'KeepClass',
          kind: 'class' as const,
          signature: 'class KeepClass',
          members: []
        },
        {
          name: 'NewClass',
          kind: 'class' as const,
          signature: 'class NewClass',
          members: []
        }
      ],
      hash: 'new-hash',
      stats: {
        totalExports: 2,
        classes: 2,
        interfaces: 0,
        functions: 0,
        types: 0,
        enums: 0,
        constants: 0
      }
    };

    const comparison = tracker.compareSurfaces(oldSurface, newSurface);

    expect(comparison.compatible).toBe(false); // OldClass was removed
    expect(comparison.changes.removed).toHaveLength(1);
    expect(comparison.changes.added).toHaveLength(1);
    expect(comparison.suggestions).toContain(
      'Major version bump required: 1 exports were removed'
    );
  });

  it('should generate markdown report', async () => {
    await createTestPackage(`
      /**
       * Main application class
       */
      export class App {
        version: string = '1.0.0';
        
        start(): void {}
      }
      
      export interface Config {
        port: number;
        host?: string;
      }
    `);

    const surface = await tracker.trackPackage(testDir);
    const report = tracker.generateMarkdownReport(surface);

    expect(report).toContain('# API Surface Report');
    expect(report).toContain('@brutal/test');
    expect(report).toContain('## Classes');
    expect(report).toContain('### App');
    expect(report).toContain('Main application class');
    expect(report).toContain('## Interfaces');
    expect(report).toContain('### Config');
    expect(report).toContain('**Members**:');
  });

  it('should track inheritance and implementation', async () => {
    await createTestPackage(`
      interface Base {
        id: string;
      }
      
      export interface Extended extends Base {
        name: string;
      }
      
      export class Implementation implements Extended {
        id: string = '';
        name: string = '';
      }
    `);

    const surface = await tracker.trackPackage(testDir);

    const extended = surface.exports.find(e => e.name === 'Extended');
    expect(extended?.extends).toContain('Base');

    const impl = surface.exports.find(e => e.name === 'Implementation');
    expect(impl?.implements).toContain('Extended');
  });
});