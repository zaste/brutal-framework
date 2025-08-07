#!/usr/bin/env node

/**
 * BRUTAL V5 - Perfect Package Generator
 * Creates packages with 100% compliant structure
 * 
 * Usage: node scripts/create-package.js [package-name] [--type=core|enhanced|ext]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Package size limits by type
const SIZE_LIMITS = {
  core: { foundation: 6, shared: 4, default: 5 },
  enhanced: 10,
  ext: 15
};

// Dependency graph (from PERFECT-V5-ARCHITECTURE.md)
const DEPENDENCY_GRAPH = {
  foundation: [],
  shared: [],
  events: ['shared'],
  templates: ['shared'],
  components: ['foundation', 'templates', 'events'],
  state: ['shared', 'events'],
  routing: ['events', 'shared'],
  cache: ['shared'],
  scheduling: [],
  a11y: [],
  plugins: ['events', 'shared']
};

// Package-specific subdirectories requirements
const PACKAGE_SUBDIRS = {
  foundation: ['polyfills', 'registry', 'config', 'env'],
  shared: ['sanitizer', 'errors', 'dom', 'utils', 'types'],
  components: ['base', 'lifecycle', 'error-boundary', 'hooks', 'registry'],
  events: ['emitter', 'bus', 'handlers', 'types'],
  state: ['store', 'actions', 'selectors', 'middleware'],
  routing: ['router', 'routes', 'guards', 'history'],
  templates: ['engine', 'compiler', 'ast', 'directives'],
  cache: ['memory', 'persistent', 'strategies', 'invalidation'],
  animation: ['timeline', 'easing', 'spring', 'gesture'],
  performance: ['observer', 'metrics', 'optimizations', 'profiler']
};

function createPackage(name, type = 'core') {
  const packageName = name.startsWith('@brutal/') ? name : `@brutal/${name}`;
  const shortName = packageName.replace('@brutal/', '');
  const packagePath = path.join(ROOT, 'packages', `@brutal`, shortName);

  if (fs.existsSync(packagePath)) {
    console.error(`❌ Package ${packageName} already exists!`);
    process.exit(1);
  }

  console.log(`\n🚀 Creating ${packageName} (${type} package)...`);

  // Create directory structure
  const dirs = [
    'src',
    'src/example-feature',
    'src/example-feature/helpers',
    'tests',
    'tests/fixtures',
    'tests/integration', 
    'tests/performance',
    'types',
    'docs',
    'examples'
  ];

  // Add package-specific subdirectories
  const specificSubdirs = PACKAGE_SUBDIRS[shortName];
  if (specificSubdirs) {
    specificSubdirs.forEach(subdir => {
      dirs.push(`src/${subdir}`);
    });
  }

  dirs.forEach(dir => {
    fs.mkdirSync(path.join(packagePath, dir), { recursive: true });
  });

  // Generate files from templates
  generatePackageJson(packagePath, shortName, type);
  generateSrcIndex(packagePath, shortName);
  generateFeatureExample(packagePath, shortName);
  generateTests(packagePath, shortName);
  generateTypes(packagePath, shortName);
  generateDocs(packagePath, shortName);
  generateConfigs(packagePath, shortName);
  generateExamples(packagePath, shortName);
  
  // Generate package-specific files
  if (shortName === 'foundation') {
    generateFoundationFiles(packagePath);
  } else if (PACKAGE_SUBDIRS[shortName]) {
    generatePackageSpecificFiles(packagePath, shortName);
  }

  console.log(`\n✅ Package ${packageName} created successfully!`);
  console.log('\n📋 Next steps:');
  console.log(`1. cd ${packagePath}`);
  console.log('2. pnpm install');
  console.log('3. pnpm test');
  console.log('4. Update src/example-feature with real implementation');
  console.log('5. Update docs/ with real documentation\n');
}

function generatePackageJson(packagePath, name, type) {
  const sizeLimit = SIZE_LIMITS[type]?.[name] || SIZE_LIMITS[type] || 10;
  const deps = DEPENDENCY_GRAPH[name] || [];
  
  const content = {
    name: `@brutal/${name}`,
    version: '0.0.0',
    type: 'module',
    description: `BRUTAL V5 - ${name} package`,
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js'
      }
    },
    files: ['dist', 'types'],
    scripts: {
      build: 'tsup',
      'build:watch': 'tsup --watch',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      lint: 'eslint src --ext .ts',
      'type-check': 'tsc --noEmit',
      size: 'size-limit',
      'validate:structure': 'node ../../scripts/validate-structure.js .'
    },
    dependencies: deps.reduce((acc, dep) => {
      acc[`@brutal/${dep}`] = 'workspace:*';
      return acc;
    }, {}),
    devDependencies: {},
    'size-limit': [
      {
        path: 'dist/index.js',
        limit: `${sizeLimit}KB`
      }
    ],
    publishConfig: {
      access: 'public'
    },
    license: 'MIT'
  };

  fs.writeFileSync(
    path.join(packagePath, 'package.json'),
    JSON.stringify(content, null, 2)
  );
}

function generateSrcIndex(packagePath, name) {
  // Foundation-specific exports
  const foundationExports = name === 'foundation' ? `
// Foundation-specific exports
export { polyfillStrategy } from './polyfills/strategy.js';
export { registry } from './registry/registry.js';
export { configLoader } from './config/loader.js';
export { envProfiles } from './env/profiles.js';
` : '';

  const content = `/**
 * @brutal/${name} - [Description]
 * 
 * @packageDocumentation
 */

// Public API exports
export { ExampleFeature } from './example-feature/example-feature.js';
export type { ExampleOptions, ExampleResult } from './types.js';

// Constants
export { VERSION, DEFAULT_CONFIG } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/${name}';
${foundationExports}`;

  fs.writeFileSync(path.join(packagePath, 'src/index.ts'), content);

  // index.test.ts
  const testContent = `import { describe, it, expect } from '@jest/globals';
import { ExampleFeature, VERSION, PACKAGE_NAME } from './index.js';

describe('@brutal/${name} exports', () => {
  it('should export ExampleFeature', () => {
    expect(ExampleFeature).toBeDefined();
  });

  it('should export VERSION', () => {
    expect(VERSION).toBe('__VERSION__');
  });

  it('should export correct package name', () => {
    expect(PACKAGE_NAME).toBe('@brutal/${name}');
  });
});
`;

  fs.writeFileSync(path.join(packagePath, 'src/index.test.ts'), testContent);

  // types.ts
  fs.writeFileSync(
    path.join(packagePath, 'src/types.ts'),
    `/**
 * Public types for @brutal/${name}
 */

export interface ExampleOptions {
  /** Enable debug mode */
  debug?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}

export interface ExampleResult {
  /** Operation success */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error if failed */
  error?: Error;
}

export type ExampleCallback = (result: ExampleResult) => void;
`
  );

  // types.test.ts
  fs.writeFileSync(
    path.join(packagePath, 'src/types.test.ts'),
    `import { describe, it, expect } from '@jest/globals';
import type { ExampleOptions, ExampleResult, ExampleCallback } from './types.js';

describe('types', () => {
  describe('ExampleOptions', () => {
    it('should accept valid options', () => {
      const options: ExampleOptions = {
        debug: true,
        maxRetries: 5
      };
      expect(options.debug).toBe(true);
      expect(options.maxRetries).toBe(5);
    });

    it('should accept partial options', () => {
      const options: ExampleOptions = {
        debug: true
      };
      expect(options.debug).toBe(true);
      expect(options.maxRetries).toBeUndefined();
    });
  });

  describe('ExampleResult', () => {
    it('should represent success', () => {
      const result: ExampleResult = {
        success: true,
        data: 'test data'
      };
      expect(result.success).toBe(true);
      expect(result.data).toBe('test data');
      expect(result.error).toBeUndefined();
    });

    it('should represent failure', () => {
      const result: ExampleResult = {
        success: false,
        error: new Error('Test error')
      };
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Test error');
      expect(result.data).toBeUndefined();
    });
  });

  describe('ExampleCallback', () => {
    it('should be callable with result', () => {
      const callback: ExampleCallback = (result) => {
        expect(result.success).toBeDefined();
      };
      
      callback({ success: true, data: 'test' });
    });
  });
});
`
  );

  // constants.ts
  fs.writeFileSync(
    path.join(packagePath, 'src/constants.ts'),
    `/**
 * Constants for @brutal/${name}
 */

/** Package version (injected at build time) */
export const VERSION = '__VERSION__';

/** Default configuration */
export const DEFAULT_CONFIG = {
  debug: false,
  maxRetries: 3
} as const;

/** Internal constants */
export const INTERNAL = {
  MAX_LISTENERS: 100,
  TIMEOUT_MS: 5000
} as const;
`
  );

  // constants.test.ts
  fs.writeFileSync(
    path.join(packagePath, 'src/constants.test.ts'),
    `import { describe, it, expect } from '@jest/globals';
import { VERSION, DEFAULT_CONFIG, INTERNAL } from './constants.js';

describe('constants', () => {
  describe('VERSION', () => {
    it('should be defined', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have expected properties', () => {
      expect(DEFAULT_CONFIG).toEqual({
        debug: false,
        maxRetries: 3
      });
    });

    it('should be immutable', () => {
      expect(() => {
        // @ts-expect-error - testing immutability
        DEFAULT_CONFIG.debug = true;
      }).toThrow();
    });
  });

  describe('INTERNAL', () => {
    it('should have expected properties', () => {
      expect(INTERNAL.MAX_LISTENERS).toBe(100);
      expect(INTERNAL.TIMEOUT_MS).toBe(5000);
    });
  });
});
`
  );
}

function generateFeatureExample(packagePath, name) {
  // Feature implementation
  const content = `import type { ExampleOptions, ExampleResult } from '../types.js';
import { DEFAULT_CONFIG } from '../constants.js';
import { validateOptions } from './helpers/validate.js';

/**
 * Example feature implementation
 * 
 * @example
 * \`\`\`typescript
 * const feature = new ExampleFeature({ debug: true });
 * const result = await feature.execute('test');
 * \`\`\`
 */
export class ExampleFeature {
  private options: Required<ExampleOptions>;

  constructor(options: ExampleOptions = {}) {
    this.options = { ...DEFAULT_CONFIG, ...options };
    validateOptions(this.options);
  }

  /**
   * Execute the feature
   */
  async execute(input: string): Promise<ExampleResult> {
    if (this.options.debug) {
      console.log('[${name}] Executing with:', input);
    }

    try {
      // TODO: Implement actual feature logic
      const data = await this.process(input);
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  private async process(input: string): Promise<string> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    return \`Processed: \${input}\`;
  }
}
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/example-feature/example-feature.ts'),
    content
  );

  // Feature test
  const testContent = `import { describe, it, expect, beforeEach } from '@jest/globals';
import { ExampleFeature } from './example-feature.js';

describe('ExampleFeature', () => {
  let feature: ExampleFeature;

  beforeEach(() => {
    feature = new ExampleFeature();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(feature).toBeInstanceOf(ExampleFeature);
    });

    it('should accept custom options', () => {
      const customFeature = new ExampleFeature({ debug: true });
      expect(customFeature).toBeInstanceOf(ExampleFeature);
    });
  });

  describe('execute', () => {
    it('should process input successfully', async () => {
      const result = await feature.execute('test');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('Processed: test');
      expect(result.error).toBeUndefined();
    });

    it('should handle empty input', async () => {
      const result = await feature.execute('');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('Processed: ');
    });
  });
});
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/example-feature/example-feature.test.ts'),
    testContent
  );

  // Helper implementation
  const helperContent = `import type { ExampleOptions } from '../../types.js';

/**
 * Validates feature options
 */
export function validateOptions(options: Required<ExampleOptions>): void {
  if (options.maxRetries < 0) {
    throw new Error('maxRetries must be non-negative');
  }

  if (options.maxRetries > 10) {
    throw new Error('maxRetries cannot exceed 10');
  }
}

/**
 * Format error messages
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/example-feature/helpers/validate.ts'),
    helperContent
  );

  // Helper test
  const helperTestContent = `import { describe, it, expect } from '@jest/globals';
import { validateOptions, formatError } from './validate.js';

describe('validateOptions', () => {
  it('should accept valid options', () => {
    expect(() => {
      validateOptions({ debug: false, maxRetries: 3 });
    }).not.toThrow();
  });

  it('should reject negative maxRetries', () => {
    expect(() => {
      validateOptions({ debug: false, maxRetries: -1 });
    }).toThrow('maxRetries must be non-negative');
  });

  it('should reject excessive maxRetries', () => {
    expect(() => {
      validateOptions({ debug: false, maxRetries: 11 });
    }).toThrow('maxRetries cannot exceed 10');
  });
});

describe('formatError', () => {
  it('should format Error instances', () => {
    const error = new Error('Test error');
    expect(formatError(error)).toBe('Test error');
  });

  it('should format non-Error values', () => {
    expect(formatError('string error')).toBe('string error');
    expect(formatError(123)).toBe('123');
    expect(formatError(null)).toBe('null');
  });
});
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/example-feature/helpers/validate.test.ts'),
    helperTestContent
  );

  // Feature types
  fs.writeFileSync(
    path.join(packagePath, 'src/example-feature/example-feature.types.ts'),
    `/**
 * Internal types for example feature
 */

export interface FeatureState {
  initialized: boolean;
  processing: boolean;
  errorCount: number;
}

export interface ProcessOptions {
  timeout?: number;
  signal?: AbortSignal;
}
`
  );

  // Feature types test
  fs.writeFileSync(
    path.join(packagePath, 'src/example-feature/example-feature.types.test.ts'),
    `import { describe, it, expect } from '@jest/globals';
import type { FeatureState, ProcessOptions } from './example-feature.types.js';

describe('example-feature types', () => {
  describe('FeatureState', () => {
    it('should represent valid state', () => {
      const state: FeatureState = {
        initialized: true,
        processing: false,
        errorCount: 0
      };
      
      expect(state.initialized).toBe(true);
      expect(state.processing).toBe(false);
      expect(state.errorCount).toBe(0);
    });
  });

  describe('ProcessOptions', () => {
    it('should accept timeout', () => {
      const options: ProcessOptions = {
        timeout: 5000
      };
      
      expect(options.timeout).toBe(5000);
      expect(options.signal).toBeUndefined();
    });

    it('should accept AbortSignal', () => {
      const controller = new AbortController();
      const options: ProcessOptions = {
        signal: controller.signal
      };
      
      expect(options.signal).toBe(controller.signal);
      expect(options.timeout).toBeUndefined();
    });
  });
});
`
  );
}

function generateTests(packagePath, name) {
  // Test fixtures
  fs.writeFileSync(
    path.join(packagePath, 'tests/fixtures/example.fixture.ts'),
    `export const validInputs = [
  'test',
  'example',
  'brutal-v5'
];

export const invalidInputs = [
  null,
  undefined,
  123,
  {}
];

export const expectedResults = {
  test: 'Processed: test',
  example: 'Processed: example'
};
`
  );

  // Integration test
  fs.writeFileSync(
    path.join(packagePath, 'tests/integration/flow.test.ts'),
    `import { describe, it, expect } from '@jest/globals';
import { ExampleFeature } from '../../src/example-feature/example-feature.js';
import { validInputs } from '../fixtures/example.fixture.js';

describe('Integration: ExampleFeature flow', () => {
  it('should handle multiple operations', async () => {
    const feature = new ExampleFeature();
    
    const results = await Promise.all(
      validInputs.map(input => feature.execute(input))
    );

    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toMatch(/^Processed: /);
    });
  });
});
`
  );

  // Performance benchmark
  fs.writeFileSync(
    path.join(packagePath, 'tests/performance/benchmark.ts'),
    `import { ExampleFeature } from '../../dist/index.js';

const feature = new ExampleFeature();
const iterations = 10000;

console.log(\`Running \${iterations} iterations...\`);

const start = performance.now();

for (let i = 0; i < iterations; i++) {
  await feature.execute(\`test-\${i}\`);
}

const end = performance.now();
const duration = end - start;
const opsPerSecond = (iterations / duration) * 1000;

console.log(\`Duration: \${duration.toFixed(2)}ms\`);
console.log(\`Ops/sec: \${opsPerSecond.toFixed(2)}\`);
`
  );

  // Test setup
  fs.writeFileSync(
    path.join(packagePath, 'tests/setup.ts'),
    `// Test environment setup
beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});
`
  );
}

function generateTypes(packagePath, name) {
  // Public types
  const indexDts = `/**
 * Type definitions for @brutal/${name}
 */

export * from '../src/types.js';
export { ExampleFeature } from '../src/example-feature/example-feature.js';
export { VERSION, PACKAGE_NAME, DEFAULT_CONFIG } from '../src/constants.js';
`;

  fs.writeFileSync(path.join(packagePath, 'types/index.d.ts'), indexDts);

  // Global augmentations
  const globalDts = `/**
 * Global type augmentations for @brutal/${name}
 */

declare global {
  interface Window {
    __BRUTAL_${name.toUpperCase()}_VERSION__?: string;
  }
}

export {};
`;

  fs.writeFileSync(path.join(packagePath, 'types/global.d.ts'), globalDts);

  // Internal types
  const internalDts = `/**
 * Internal type definitions (not exported)
 */

export interface InternalConfig {
  _initialized: boolean;
  _debug: boolean;
}

export type InternalState = 
  | 'idle'
  | 'processing'
  | 'complete'
  | 'error';
`;

  fs.writeFileSync(path.join(packagePath, 'types/internal.d.ts'), internalDts);
}

function generateDocs(packagePath, name) {
  // README.md
  const readme = `# @brutal/${name}

> [One-line description of the package]

## Installation

\`\`\`bash
npm install @brutal/${name}
\`\`\`

## Quick Start

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';

const feature = new ExampleFeature({ debug: true });
const result = await feature.execute('input');

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
\`\`\`

## Features

- 🚀 High performance
- 🔒 Type-safe
- 🧪 100% tested
- 📦 Tree-shakeable
- 🔧 Zero configuration

## API Overview

### \`ExampleFeature\`

Main feature class.

\`\`\`typescript
const feature = new ExampleFeature(options?: ExampleOptions);
\`\`\`

### Methods

- \`execute(input: string): Promise<ExampleResult>\` - Execute the feature

See [API.md](./API.md) for complete reference.

## Examples

See [EXAMPLES.md](./EXAMPLES.md) for more examples.

## Size

- **Minified**: ~2KB
- **Gzipped**: ~1KB
- **Brotli**: ~0.8KB

## Dependencies

${DEPENDENCY_GRAPH[name]?.length > 0 
  ? DEPENDENCY_GRAPH[name].map(dep => `- @brutal/${dep}`).join('\n')
  : '- None (zero dependencies)'
}

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Node.js 18+

## License

MIT © 2024 BRUTAL Team
`;

  fs.writeFileSync(path.join(packagePath, 'docs/README.md'), readme);

  // API.md
  const api = `# @brutal/${name} API Reference

## Table of Contents

- [Classes](#classes)
- [Interfaces](#interfaces)
- [Functions](#functions)
- [Constants](#constants)

## Classes

### \`ExampleFeature\`

Main feature implementation.

#### Constructor

\`\`\`typescript
new ExampleFeature(options?: ExampleOptions)
\`\`\`

##### Parameters

- \`options\` (optional): Configuration options
  - \`debug\`: Enable debug logging (default: \`false\`)
  - \`maxRetries\`: Maximum retry attempts (default: \`3\`)

#### Methods

##### \`execute()\`

Execute the feature with given input.

\`\`\`typescript
execute(input: string): Promise<ExampleResult>
\`\`\`

###### Parameters

- \`input\`: The input string to process

###### Returns

Promise resolving to:
- \`success\`: Whether operation succeeded
- \`data\`: Result data (if successful)
- \`error\`: Error instance (if failed)

###### Example

\`\`\`typescript
const result = await feature.execute('test');
if (result.success) {
  console.log(result.data); // "Processed: test"
}
\`\`\`

## Interfaces

### \`ExampleOptions\`

Configuration options for ExampleFeature.

\`\`\`typescript
interface ExampleOptions {
  debug?: boolean;
  maxRetries?: number;
}
\`\`\`

### \`ExampleResult\`

Result of feature execution.

\`\`\`typescript
interface ExampleResult {
  success: boolean;
  data?: unknown;
  error?: Error;
}
\`\`\`

## Functions

### \`validateOptions()\`

Validates feature options.

\`\`\`typescript
function validateOptions(options: Required<ExampleOptions>): void
\`\`\`

Throws if options are invalid.

## Constants

### \`VERSION\`

Package version string.

\`\`\`typescript
const VERSION: string = '__VERSION__';
\`\`\`

### \`DEFAULT_CONFIG\`

Default configuration values.

\`\`\`typescript
const DEFAULT_CONFIG = {
  debug: false,
  maxRetries: 3
} as const;
\`\`\`

### \`PACKAGE_NAME\`

Package name constant.

\`\`\`typescript
const PACKAGE_NAME = '@brutal/${name}';
\`\`\`
`;

  fs.writeFileSync(path.join(packagePath, 'docs/API.md'), api);

  // EXAMPLES.md
  const examples = `# @brutal/${name} Examples

## Basic Usage

### Simple Example

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';

const feature = new ExampleFeature();
const result = await feature.execute('Hello World');

console.log(result); 
// { success: true, data: "Processed: Hello World" }
\`\`\`

### With Options

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';

const feature = new ExampleFeature({
  debug: true,
  maxRetries: 5
});

const result = await feature.execute('test');
// Console: [${name}] Executing with: test
\`\`\`

## Advanced Usage

### Error Handling

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';

const feature = new ExampleFeature();

try {
  const result = await feature.execute('input');
  
  if (!result.success) {
    console.error('Operation failed:', result.error?.message);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
\`\`\`

### Batch Processing

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';

const feature = new ExampleFeature();
const inputs = ['one', 'two', 'three'];

const results = await Promise.all(
  inputs.map(input => feature.execute(input))
);

const successful = results.filter(r => r.success);
console.log(\`Processed \${successful.length} items successfully\`);
\`\`\`

## Integration Examples

### With Other BRUTAL Packages

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';
import { EventEmitter } from '@brutal/events';

class ProcessingService extends EventEmitter {
  private feature = new ExampleFeature();

  async process(input: string): Promise<void> {
    this.emit('processing:start', { input });
    
    const result = await this.feature.execute(input);
    
    if (result.success) {
      this.emit('processing:success', result.data);
    } else {
      this.emit('processing:error', result.error);
    }
  }
}
\`\`\`

### In a Web Component

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';
import { BrutalComponent } from '@brutal/components';

class MyComponent extends BrutalComponent {
  private feature = new ExampleFeature();

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    
    const result = await this.feature.execute(this.getAttribute('data') || '');
    
    if (result.success) {
      this.render(result.data);
    }
  }
}
\`\`\`

## Common Patterns

### Singleton Instance

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';

let instance: ExampleFeature;

export function getFeature(): ExampleFeature {
  if (!instance) {
    instance = new ExampleFeature();
  }
  return instance;
}
\`\`\`

### With Retry Logic

\`\`\`typescript
import { ExampleFeature } from '@brutal/${name}';

async function executeWithRetry(
  input: string,
  maxAttempts = 3
): Promise<ExampleResult> {
  const feature = new ExampleFeature();
  
  for (let i = 0; i < maxAttempts; i++) {
    const result = await feature.execute(input);
    
    if (result.success || i === maxAttempts - 1) {
      return result;
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
  }
  
  return { success: false, error: new Error('Max retries exceeded') };
}
\`\`\`

## Performance Tips

1. **Reuse instances** - Create once, use many times
2. **Batch operations** - Use Promise.all for parallel processing
3. **Handle errors** - Always check result.success
4. **Enable debug** - Only in development mode

## Troubleshooting

### Common Issues

**Issue**: "maxRetries must be non-negative"
\`\`\`typescript
// ❌ Wrong
new ExampleFeature({ maxRetries: -1 });

// ✅ Correct
new ExampleFeature({ maxRetries: 3 });
\`\`\`

**Issue**: Operations timing out
\`\`\`typescript
// Add timeout handling
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

// Future API will support:
// feature.execute(input, { signal: controller.signal });
\`\`\`
`;

  fs.writeFileSync(path.join(packagePath, 'docs/EXAMPLES.md'), examples);

  // MIGRATION.md (if needed)
  const migration = `# Migration Guide

## From v0.x to v1.0

No breaking changes yet - this is the first version!

## Future Migrations

This document will contain migration guides for future versions.
`;

  fs.writeFileSync(path.join(packagePath, 'docs/MIGRATION.md'), migration);
}

function generateConfigs(packagePath, name) {
  // tsconfig.json
  const tsconfig = {
    extends: '../../tsconfig.json',
    compilerOptions: {
      rootDir: './src',
      outDir: './dist',
      declarationDir: './dist'
    },
    include: ['src/**/*'],
    exclude: ['**/*.test.ts', '**/*.bench.ts', 'dist', 'node_modules']
  };

  fs.writeFileSync(
    path.join(packagePath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // jest.config.js
  const jestConfig = `module.exports = {
  preset: '../../jest.preset.js',
  displayName: '@brutal/${name}',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/tests/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
`;

  fs.writeFileSync(path.join(packagePath, 'jest.config.js'), jestConfig);

  // .eslintrc.js
  const eslintConfig = `module.exports = {
  extends: ['../../.eslintrc.json'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  rules: {
    // Package-specific overrides if needed
  }
};
`;

  fs.writeFileSync(path.join(packagePath, '.eslintrc.js'), eslintConfig);

  // .npmignore
  const npmignore = `# Source
src/
tests/
types/internal.d.ts

# Config
tsconfig.json
jest.config.js
.eslintrc.js
rollup.config.js

# Development
*.test.ts
*.bench.ts
examples/
docs/MIGRATION.md

# Build artifacts
*.tsbuildinfo
coverage/
.turbo/

# Misc
.DS_Store
*.log
`;

  fs.writeFileSync(path.join(packagePath, '.npmignore'), npmignore);

  // CHANGELOG.md
  const changelog = `# Changelog

All notable changes to @brutal/${name} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial implementation of ExampleFeature
- Basic documentation
- Test coverage

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet
`;

  fs.writeFileSync(path.join(packagePath, 'CHANGELOG.md'), changelog);

  // LICENSE
  const license = `MIT License

Copyright (c) 2024 BRUTAL Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

  fs.writeFileSync(path.join(packagePath, 'LICENSE'), license);
}

function generateExamples(packagePath, name) {
  // Basic example
  const basicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@brutal/${name} - Basic Example</title>
</head>
<body>
  <h1>@brutal/${name} Basic Example</h1>
  
  <form id="example-form">
    <input type="text" id="input" placeholder="Enter text" />
    <button type="submit">Process</button>
  </form>
  
  <div id="result"></div>

  <script type="module">
    import { ExampleFeature } from '../dist/index.js';
    
    const feature = new ExampleFeature({ debug: true });
    const form = document.getElementById('example-form');
    const input = document.getElementById('input');
    const result = document.getElementById('result');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const value = input.value;
      const res = await feature.execute(value);
      
      if (res.success) {
        result.textContent = \`Success: \${res.data}\`;
        result.style.color = 'green';
      } else {
        result.textContent = \`Error: \${res.error?.message}\`;
        result.style.color = 'red';
      }
    });
  </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(packagePath, 'examples/basic.html'), basicHtml);

  // Advanced example
  const advancedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@brutal/${name} - Advanced Example</title>
  <style>
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .options { margin: 20px 0; }
    .results { margin-top: 20px; }
    .result-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <h1>@brutal/${name} Advanced Example</h1>
    
    <div class="options">
      <label>
        <input type="checkbox" id="debug" checked />
        Enable Debug Mode
      </label>
      <label>
        Max Retries:
        <input type="number" id="retries" value="3" min="0" max="10" />
      </label>
    </div>
    
    <div>
      <textarea id="batch-input" rows="5" placeholder="Enter multiple lines"></textarea>
      <button id="process-batch">Process Batch</button>
    </div>
    
    <div class="results" id="results"></div>
  </div>

  <script type="module">
    import { ExampleFeature } from '../dist/index.js';
    
    let feature;
    
    function updateFeature() {
      const debug = document.getElementById('debug').checked;
      const maxRetries = parseInt(document.getElementById('retries').value);
      
      feature = new ExampleFeature({ debug, maxRetries });
    }
    
    updateFeature();
    
    document.getElementById('debug').addEventListener('change', updateFeature);
    document.getElementById('retries').addEventListener('change', updateFeature);
    
    document.getElementById('process-batch').addEventListener('click', async () => {
      const textarea = document.getElementById('batch-input');
      const results = document.getElementById('results');
      const lines = textarea.value.split('\\n').filter(line => line.trim());
      
      results.innerHTML = '<h3>Processing...</h3>';
      
      const processResults = await Promise.all(
        lines.map(async (line) => {
          const result = await feature.execute(line);
          return { input: line, ...result };
        })
      );
      
      results.innerHTML = '<h3>Results:</h3>';
      
      processResults.forEach(({ input, success, data, error }) => {
        const div = document.createElement('div');
        div.className = \`result-item \${success ? 'success' : 'error'}\`;
        div.textContent = success 
          ? \`✓ \${input} → \${data}\`
          : \`✗ \${input} → \${error?.message}\`;
        results.appendChild(div);
      });
    });
  </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(packagePath, 'examples/advanced.html'), advancedHtml);

  // Integration example
  const integrationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@brutal/${name} - Integration Example</title>
</head>
<body>
  <h1>@brutal/${name} Integration Example</h1>
  
  <p>This example shows integration with other BRUTAL packages.</p>
  <p>Check the console for event logs.</p>
  
  <button id="start">Start Processing</button>
  <div id="status"></div>

  <script type="module">
    // This example assumes other packages are available
    // In real use, you would import them
    
    import { ExampleFeature } from '../dist/index.js';
    
    // Simulated EventEmitter for demo
    class EventEmitter {
      constructor() {
        this.listeners = new Map();
      }
      
      on(event, callback) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
      }
      
      emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(cb => cb(data));
      }
    }
    
    class ProcessingService extends EventEmitter {
      constructor() {
        super();
        this.feature = new ExampleFeature({ debug: true });
      }
      
      async process(input) {
        this.emit('start', { input });
        
        const result = await this.feature.execute(input);
        
        if (result.success) {
          this.emit('success', result.data);
        } else {
          this.emit('error', result.error);
        }
        
        return result;
      }
    }
    
    const service = new ProcessingService();
    const status = document.getElementById('status');
    
    service.on('start', ({ input }) => {
      console.log('[Event] Processing started:', input);
      status.textContent = \`Processing: \${input}...\`;
    });
    
    service.on('success', (data) => {
      console.log('[Event] Success:', data);
      status.textContent = \`Success: \${data}\`;
      status.style.color = 'green';
    });
    
    service.on('error', (error) => {
      console.log('[Event] Error:', error);
      status.textContent = \`Error: \${error.message}\`;
      status.style.color = 'red';
    });
    
    document.getElementById('start').addEventListener('click', async () => {
      const testInputs = ['First', 'Second', 'Third'];
      
      for (const input of testInputs) {
        await service.process(input);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      status.textContent = 'All processing complete!';
    });
  </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(packagePath, 'examples/integration.html'), integrationHtml);
}

function generateFoundationFiles(packagePath) {
  // Create foundation-specific directories
  const dirs = [
    'src/polyfills',
    'src/registry',
    'src/config',
    'src/env'
  ];
  
  dirs.forEach(dir => {
    fs.mkdirSync(path.join(packagePath, dir), { recursive: true });
  });

  // Polyfill strategy
  fs.writeFileSync(
    path.join(packagePath, 'src/polyfills/strategy.ts'),
    `/**
 * Polyfill loading strategy for BRUTAL
 */

export interface PolyfillConfig {
  /** Feature to polyfill */
  feature: string;
  /** Test function to check if polyfill is needed */
  test: () => boolean;
  /** Polyfill loader function */
  load: () => Promise<void>;
}

export const polyfillStrategy = {
  configs: [] as PolyfillConfig[],
  
  register(config: PolyfillConfig): void {
    this.configs.push(config);
  },
  
  async loadRequired(): Promise<void> {
    const needed = this.configs.filter(config => !config.test());
    
    await Promise.all(
      needed.map(config => config.load())
    );
  }
};
`
  );

  // Registry
  fs.writeFileSync(
    path.join(packagePath, 'src/registry/registry.ts'),
    `/**
 * Global package registry for BRUTAL
 */

interface PackageInfo {
  name: string;
  version: string;
  loaded: boolean;
}

export const registry = {
  packages: new Map<string, PackageInfo>(),
  
  register(name: string, version: string): void {
    this.packages.set(name, {
      name,
      version,
      loaded: true
    });
  },
  
  get(name: string): PackageInfo | undefined {
    return this.packages.get(name);
  },
  
  isLoaded(name: string): boolean {
    return this.packages.get(name)?.loaded ?? false;
  },
  
  list(): PackageInfo[] {
    return Array.from(this.packages.values());
  }
};
`
  );

  // Config loader
  fs.writeFileSync(
    path.join(packagePath, 'src/config/loader.ts'),
    `/**
 * Configuration loader for BRUTAL
 */

export interface BrutalConfig {
  debug?: boolean;
  env?: string;
  features?: Record<string, boolean>;
}

export const configLoader = {
  config: {} as BrutalConfig,
  
  load(config: BrutalConfig): void {
    this.config = { ...this.config, ...config };
  },
  
  get<K extends keyof BrutalConfig>(key: K): BrutalConfig[K] {
    return this.config[key];
  },
  
  set<K extends keyof BrutalConfig>(key: K, value: BrutalConfig[K]): void {
    this.config[key] = value;
  },
  
  reset(): void {
    this.config = {};
  }
};
`
  );

  // Env profiles
  fs.writeFileSync(
    path.join(packagePath, 'src/env/profiles.ts'),
    `/**
 * Environment profiles for BRUTAL
 */

export interface EnvProfile {
  name: string;
  debug: boolean;
  features: Record<string, boolean>;
}

export const envProfiles = {
  profiles: new Map<string, EnvProfile>([
    ['development', {
      name: 'development',
      debug: true,
      features: {
        devtools: true,
        sourcemaps: true,
        hotReload: true
      }
    }],
    ['production', {
      name: 'production',
      debug: false,
      features: {
        devtools: false,
        sourcemaps: false,
        hotReload: false
      }
    }],
    ['test', {
      name: 'test',
      debug: false,
      features: {
        devtools: false,
        sourcemaps: true,
        hotReload: false
      }
    }]
  ]),
  
  get(name: string): EnvProfile | undefined {
    return this.profiles.get(name);
  },
  
  current(): EnvProfile {
    const env = process.env.NODE_ENV || 'development';
    return this.profiles.get(env) || this.profiles.get('development')!;
  }
};
`
  );

  // Add tests for foundation files
  fs.writeFileSync(
    path.join(packagePath, 'src/polyfills/strategy.test.ts'),
    `import { describe, it, expect, beforeEach } from '@jest/globals';
import { polyfillStrategy } from './strategy.js';

describe('polyfillStrategy', () => {
  beforeEach(() => {
    polyfillStrategy.configs = [];
  });

  it('should register polyfill configs', () => {
    polyfillStrategy.register({
      feature: 'test',
      test: () => true,
      load: async () => {}
    });
    
    expect(polyfillStrategy.configs).toHaveLength(1);
  });

  it('should load required polyfills', async () => {
    let loaded = false;
    
    polyfillStrategy.register({
      feature: 'needed',
      test: () => false, // Needs polyfill
      load: async () => { loaded = true; }
    });
    
    polyfillStrategy.register({
      feature: 'not-needed',
      test: () => true, // Doesn't need polyfill
      load: async () => { throw new Error('Should not load'); }
    });
    
    await polyfillStrategy.loadRequired();
    expect(loaded).toBe(true);
  });
});
`
  );

  fs.writeFileSync(
    path.join(packagePath, 'src/registry/registry.test.ts'),
    `import { describe, it, expect, beforeEach } from '@jest/globals';
import { registry } from './registry.js';

describe('registry', () => {
  beforeEach(() => {
    registry.packages.clear();
  });

  it('should register packages', () => {
    registry.register('@brutal/test', '1.0.0');
    
    expect(registry.isLoaded('@brutal/test')).toBe(true);
    expect(registry.get('@brutal/test')).toEqual({
      name: '@brutal/test',
      version: '1.0.0',
      loaded: true
    });
  });

  it('should list all packages', () => {
    registry.register('@brutal/a', '1.0.0');
    registry.register('@brutal/b', '2.0.0');
    
    const list = registry.list();
    expect(list).toHaveLength(2);
    expect(list.map(p => p.name)).toContain('@brutal/a');
    expect(list.map(p => p.name)).toContain('@brutal/b');
  });
});
`
  );

  fs.writeFileSync(
    path.join(packagePath, 'src/config/loader.test.ts'),
    `import { describe, it, expect, beforeEach } from '@jest/globals';
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
`
  );

  fs.writeFileSync(
    path.join(packagePath, 'src/env/profiles.test.ts'),
    `import { describe, it, expect } from '@jest/globals';
import { envProfiles } from './profiles.js';

describe('envProfiles', () => {
  it('should have default profiles', () => {
    expect(envProfiles.get('development')).toBeDefined();
    expect(envProfiles.get('production')).toBeDefined();
    expect(envProfiles.get('test')).toBeDefined();
  });

  it('should return development profile by default', () => {
    const current = envProfiles.current();
    expect(current.name).toBe('development');
    expect(current.debug).toBe(true);
  });

  it('should return correct profile settings', () => {
    const prod = envProfiles.get('production');
    expect(prod?.debug).toBe(false);
    expect(prod?.features.devtools).toBe(false);
    
    const dev = envProfiles.get('development');
    expect(dev?.debug).toBe(true);
    expect(dev?.features.devtools).toBe(true);
  });
});
`
  );
}

function generatePackageSpecificFiles(packagePath, packageName) {
  const subdirs = PACKAGE_SUBDIRS[packageName];
  
  if (!subdirs) return;

  // Generate index.ts and index.test.ts for each subdirectory
  subdirs.forEach(subdir => {
    const subdirPath = path.join(packagePath, 'src', subdir);
    
    // Create index.ts
    const indexContent = `/**
 * ${subdir} module for @brutal/${packageName}
 */

// TODO: Implement ${subdir} functionality
export const ${subdir} = {
  name: '${subdir}',
  // Add implementation here
};

export default ${subdir};
`;
    
    fs.writeFileSync(path.join(subdirPath, 'index.ts'), indexContent);
    
    // Create index.test.ts
    const testContent = `import { describe, it, expect } from '@jest/globals';
import { ${subdir} } from './index.js';

describe('${subdir}', () => {
  it('should be defined', () => {
    expect(${subdir}).toBeDefined();
    expect(${subdir}.name).toBe('${subdir}');
  });

  // TODO: Add more tests
});
`;
    
    fs.writeFileSync(path.join(subdirPath, 'index.test.ts'), testContent);
  });

  // Generate package-specific templates based on package name
  switch(packageName) {
    case 'shared':
      generateSharedSpecifics(packagePath);
      break;
    case 'components':
      generateComponentsSpecifics(packagePath);
      break;
    case 'events':
      generateEventsSpecifics(packagePath);
      break;
    case 'state':
      generateStateSpecifics(packagePath);
      break;
    // Add more cases as needed
  }
}

function generateSharedSpecifics(packagePath) {
  // Generate error classes
  const errorContent = `/**
 * Custom error classes for BRUTAL
 */

export class BrutalError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BrutalError';
  }
}

export class ValidationError extends BrutalError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NetworkError extends BrutalError {
  constructor(message: string, public status?: number) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
`;
  
  fs.writeFileSync(
    path.join(packagePath, 'src/errors/errors.ts'),
    errorContent
  );

  // Generate error tests
  const errorTestContent = `import { describe, it, expect } from '@jest/globals';
import { BrutalError, ValidationError, NetworkError } from './errors.js';

describe('BrutalError', () => {
  it('should create error with message', () => {
    const error = new BrutalError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('BrutalError');
    expect(error.code).toBeUndefined();
  });

  it('should create error with code', () => {
    const error = new BrutalError('Test error', 'TEST_CODE');
    expect(error.code).toBe('TEST_CODE');
  });
});

describe('ValidationError', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Invalid input');
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should include field name', () => {
    const error = new ValidationError('Invalid email', 'email');
    expect(error.field).toBe('email');
  });
});

describe('NetworkError', () => {
  it('should create network error', () => {
    const error = new NetworkError('Request failed');
    expect(error.name).toBe('NetworkError');
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('should include status code', () => {
    const error = new NetworkError('Not found', 404);
    expect(error.status).toBe(404);
  });
});
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/errors/errors.test.ts'),
    errorTestContent
  );

  // Generate sanitizer
  const sanitizerContent = `/**
 * HTML and input sanitization utilities
 */

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'];
const ALLOWED_ATTRS = ['href', 'title'];

export function sanitizeHTML(input: string): string {
  // Basic implementation - replace with DOMPurify in production
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.trim();
}
`;
  
  fs.writeFileSync(
    path.join(packagePath, 'src/sanitizer/sanitizer.ts'),
    sanitizerContent
  );

  // Generate sanitizer tests
  const sanitizerTestContent = `import { describe, it, expect } from '@jest/globals';
import { sanitizeHTML, sanitizeInput } from './sanitizer.js';

describe('sanitizeHTML', () => {
  it('should escape HTML tags', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeHTML(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should escape quotes', () => {
    const input = 'Hello "World" and \\'Universe\\'';
    const result = sanitizeHTML(input);
    expect(result).toBe('Hello &quot;World&quot; and &#39;Universe&#39;');
  });

  it('should handle empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });
});

describe('sanitizeInput', () => {
  it('should trim string input', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('');
    expect(sanitizeInput({})).toBe('');
  });

  it('should handle normal strings', () => {
    expect(sanitizeInput('test')).toBe('test');
  });
});
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/sanitizer/sanitizer.test.ts'),
    sanitizerTestContent
  );
}

function generateComponentsSpecifics(packagePath) {
  // Generate base component
  const baseContent = `/**
 * Base component class for BRUTAL
 */

export abstract class BrutalComponent extends HTMLElement {
  protected _initialized = false;
  
  connectedCallback(): void {
    if (!this._initialized) {
      this.init();
      this._initialized = true;
    }
  }
  
  protected abstract init(): void;
  
  protected abstract render(): void;
}
`;
  
  fs.writeFileSync(
    path.join(packagePath, 'src/base/BrutalComponent.ts'),
    baseContent
  );

  // Generate base component test
  const baseTestContent = `import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock HTMLElement for testing
class MockHTMLElement {
  connectedCallback(): void {}
}

global.HTMLElement = MockHTMLElement as any;

// Import after mocking
import { BrutalComponent } from './BrutalComponent.js';

class TestComponent extends BrutalComponent {
  initCalled = false;
  renderCalled = false;

  protected init(): void {
    this.initCalled = true;
  }

  protected render(): void {
    this.renderCalled = true;
  }
}

describe('BrutalComponent', () => {
  let component: TestComponent;

  beforeEach(() => {
    component = new TestComponent();
  });

  it('should initialize on first connect', () => {
    expect(component.initCalled).toBe(false);
    
    component.connectedCallback();
    
    expect(component.initCalled).toBe(true);
  });

  it('should not re-initialize on subsequent connects', () => {
    component.connectedCallback();
    component.initCalled = false;
    
    component.connectedCallback();
    
    expect(component.initCalled).toBe(false);
  });
});
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/base/BrutalComponent.test.ts'),
    baseTestContent
  );
}

function generateEventsSpecifics(packagePath) {
  // Generate event emitter
  const emitterContent = `/**
 * Event emitter for BRUTAL
 */

type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events = new Map<string, Set<EventHandler>>();
  
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }
  
  off(event: string, handler: EventHandler): void {
    this.events.get(event)?.delete(handler);
  }
  
  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(handler => handler(...args));
  }
}
`;
  
  fs.writeFileSync(
    path.join(packagePath, 'src/emitter/EventEmitter.ts'),
    emitterContent
  );

  // Generate EventEmitter test
  const emitterTestContent = `import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventEmitter } from './EventEmitter.js';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  it('should emit events to handlers', () => {
    const handler = jest.fn();
    
    emitter.on('test', handler);
    emitter.emit('test', 'arg1', 'arg2');
    
    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should support multiple handlers', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    emitter.on('test', handler1);
    emitter.on('test', handler2);
    emitter.emit('test', 'data');
    
    expect(handler1).toHaveBeenCalledWith('data');
    expect(handler2).toHaveBeenCalledWith('data');
  });

  it('should remove handlers with off', () => {
    const handler = jest.fn();
    
    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test');
    
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle emit with no handlers', () => {
    expect(() => {
      emitter.emit('nonexistent');
    }).not.toThrow();
  });
});
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/emitter/EventEmitter.test.ts'),
    emitterTestContent
  );
}

function generateStateSpecifics(packagePath) {
  // Generate store
  const storeContent = `/**
 * State store for BRUTAL
 */

export interface Store<T> {
  getState(): T;
  setState(state: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();
  
  return {
    getState: () => state,
    setState: (newState) => {
      state = { ...state, ...newState };
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
`;
  
  fs.writeFileSync(
    path.join(packagePath, 'src/store/store.ts'),
    storeContent
  );

  // Generate store test
  const storeTestContent = `import { describe, it, expect, jest } from '@jest/globals';
import { createStore } from './store.js';

describe('createStore', () => {
  it('should create store with initial state', () => {
    const store = createStore({ count: 0 });
    
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('should update state with setState', () => {
    const store = createStore({ count: 0, name: 'test' });
    
    store.setState({ count: 1 });
    
    expect(store.getState()).toEqual({ count: 1, name: 'test' });
  });

  it('should notify subscribers on state change', () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();
    
    store.subscribe(listener);
    store.setState({ count: 1 });
    
    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  it('should handle unsubscribe', () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();
    
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    
    store.setState({ count: 1 });
    
    expect(listener).not.toHaveBeenCalled();
  });

  it('should merge partial state updates', () => {
    const store = createStore({ a: 1, b: 2, c: 3 });
    
    store.setState({ b: 20 });
    
    expect(store.getState()).toEqual({ a: 1, b: 20, c: 3 });
  });
});
`;

  fs.writeFileSync(
    path.join(packagePath, 'src/store/store.test.ts'),
    storeTestContent
  );
}

// Parse arguments
const args = process.argv.slice(2);
const packageName = args[0];
const typeFlag = args.find(arg => arg.startsWith('--type='));
const type = typeFlag ? typeFlag.split('=')[1] : 'core';

if (!packageName) {
  console.error('❌ Please provide a package name');
  console.log('Usage: node scripts/create-package.js [package-name] [--type=core|enhanced|ext]');
  process.exit(1);
}

// Create the package
createPackage(packageName, type);