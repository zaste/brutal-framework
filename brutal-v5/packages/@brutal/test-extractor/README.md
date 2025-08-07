# @brutal/test-extractor

Zero-dependency test extraction and running for co-located test files in the BRUTAL framework.

## Features

- **Co-located Tests**: Write `*.test.ts` files alongside your source code
- **Zero Dependencies**: Pure implementation, no external test runners needed
- **Multiple Formats**: Support for default, JSON, TAP, and JUnit output
- **Parallel Execution**: Run tests in worker threads for speed
- **Simple API**: Familiar `test()`, `describe()`, `assert()` syntax

## Installation

```bash
pnpm add -D @brutal/test-extractor
```

## Usage

### Writing Tests

Create test files alongside your source code:

```typescript
// src/math.test.ts
import { test, assert, expect } from '@brutal/test-extractor';
import { add, multiply } from './math.js';

test('add should sum two numbers', () => {
  assert(add(2, 3) === 5);
  expect(add(1, 1)).toBe(2);
});

test('multiply should multiply two numbers', async () => {
  const result = await multiply(3, 4);
  expect(result).toBe(12);
});
```

### Running Tests

```typescript
import { TestExtractor, TestRunner, TestReporter } from '@brutal/test-extractor';

async function runTests() {
  // Find test files
  const extractor = new TestExtractor({
    directories: ['src', 'packages'],
    patterns: ['**/*.test.ts']
  });
  
  const files = await extractor.findTestFiles();
  
  // Run tests
  const runner = new TestRunner({
    parallel: true,
    maxWorkers: 4
  });
  
  const results = await runner.runFiles(files);
  
  // Report results
  const reporter = new TestReporter({
    format: 'default',
    colors: true
  });
  
  await reporter.report(results, runner.getSummary());
}
```

## Test API

### test(name, fn)
Define a test case:
```typescript
test('should work', () => {
  // test code
});

test.skip('skip this', () => {
  // skipped
});

test.only('only this', () => {
  // only run this test
});
```

### describe(name, fn)
Group related tests:
```typescript
describe('Math operations', () => {
  test('addition', () => {
    assert(1 + 1 === 2);
  });
  
  test('subtraction', () => {
    assert(5 - 3 === 2);
  });
});
```

### assert(condition, message?)
Simple assertion:
```typescript
assert(value === expected, 'Values should match');
```

### expect(value)
Chainable assertions:
```typescript
expect(result).toBe(42);
expect(result).toEqual({ a: 1, b: 2 });
expect(array).toContain('item');
expect(value).toBeGreaterThan(10);
expect(value).toBeTruthy();
expect(value).toBeFalsy();
```

## Options

### ExtractorOptions
- `patterns`: Glob patterns for test files (default: `['**/*.test.ts', '**/*.spec.ts']`)
- `directories`: Directories to search (default: `['src', 'packages']`)
- `ignore`: Directories to ignore (default: `['node_modules', 'dist']`)
- `extensions`: File extensions (default: `['.ts', '.js', '.mjs']`)

### RunnerOptions
- `parallel`: Run tests in parallel (default: `true`)
- `maxWorkers`: Maximum parallel workers (default: `4`)
- `timeout`: Test timeout in ms (default: `5000`)
- `bail`: Stop on first failure (default: `false`)
- `grep`: Filter tests by pattern
- `verbose`: Verbose output (default: `false`)

### ReporterOptions
- `format`: Output format - 'default' | 'json' | 'tap' | 'junit' (default: `'default'`)
- `output`: File path for output (default: console)
- `showTests`: Show individual test results (default: `true`)
- `showStacks`: Show error stacks (default: `true`)
- `colors`: Use colored output (default: `true`)

## Example Output

```
Test Results
============

✓ src/math.test.ts
  ✓ add should sum two numbers (2.34ms)
  ✓ multiply should multiply two numbers (1.23ms)

✓ src/utils.test.ts
  ✓ formatDate returns ISO string (0.56ms)
  ○ parseJSON handles errors (skipped)

Summary
-------
Files:    2
Tests:    4
Passed:   3
Failed:   0
Skipped:  1
Duration: 0.24s

All tests passed!
```

## Philosophy

Following BRUTAL's principles:
- **Zero Dependencies**: No external test runners or assertion libraries
- **Co-location**: Tests live with the code they test
- **Performance**: Parallel execution for speed
- **Simplicity**: Minimal API, maximum clarity