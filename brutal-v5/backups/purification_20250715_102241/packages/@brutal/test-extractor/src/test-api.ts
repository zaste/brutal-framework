/**
 * Simple test API for writing tests
 */

interface TestFunction {
  (name: string, fn: () => void | Promise<void>): void;
  skip: (name: string, fn: () => void | Promise<void>) => void;
  only: (name: string, fn: () => void | Promise<void>) => void;
}

interface DescribeFunction {
  (name: string, fn: () => void): void;
  skip: (name: string, fn: () => void) => void;
  only: (name: string, fn: () => void) => void;
}

// Global test registry
declare global {
  var __brutalTests: any[];
  var __brutalSuites: any[];
}

// Initialize global registry
global.__brutalTests = [];
global.__brutalSuites = [];

// Test function
export const test: TestFunction = (name: string, fn: () => void | Promise<void>) => {
  global.__brutalTests.push({ name, fn });
};

test.skip = (name: string, fn: () => void | Promise<void>) => {
  global.__brutalTests.push({ name, fn, skip: true });
};

test.only = (name: string, fn: () => void | Promise<void>) => {
  global.__brutalTests.push({ name, fn, only: true });
};

// Alias for test
export const it = test;

// Describe function for test suites
export const describe: DescribeFunction = (name: string, fn: () => void) => {
  const suite = { name, tests: [] };
  global.__brutalSuites.push(suite);
  
  // Temporarily store current test target
  const previousTests = global.__brutalTests;
  global.__brutalTests = suite.tests;
  
  // Run suite definition
  fn();
  
  // Restore previous test target
  global.__brutalTests = previousTests;
};

describe.skip = (_name: string, _fn: () => void) => {
  // Skip entire suite
};

describe.only = (name: string, fn: () => void) => {
  // Only run this suite
  describe(name, fn);
};

// Assert function
export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Expect-style assertions
export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toContain(expected: any) {
      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}`);
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(expected)) {
          throw new Error(`Expected string to contain ${expected}`);
        }
      }
    },
    toBeGreaterThan(expected: number) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    }
  };
}

// Export for use
export default {
  test,
  it,
  describe,
  assert,
  expect
};