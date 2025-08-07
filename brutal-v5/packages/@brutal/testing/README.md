# @brutal/testing

Ultra-minimal testing utilities for BRUTAL. Zero dependencies, 2.17KB minified.

## Features

- 🧪 **Test Runner** - Suites and tests with async support
- ✅ **Assertions** - Equal, strict equal, truthy, fail, throws
- 🎭 **Mocking** - Function mocks with call tracking
- 🕵️ **Spying** - Spy on existing methods
- 🌐 **DOM Testing** - Render, query, events, cleanup
- ⏱️ **Async Utilities** - Wait, waitFor, flush promises
- 📦 **2.17KB minified** - Under 3KB budget

## Installation

```bash
npm install @brutal/testing
```

## Usage

### Basic Testing

```javascript
import { test, suite, run, assert } from '@brutal/testing';

suite('Math operations', () => {
  test('addition works', () => {
    assert.e(1 + 1, 2);
  });
  
  test('async test', async () => {
    const result = await Promise.resolve(42);
    assert.i(result, 42);
  });
});

// Run all tests
const result = await run();
console.log(`Passed: ${result.p}, Failed: ${result.f}`);
```

### Assertions

```javascript
import { assert } from '@brutal/testing';

// Deep equality
assert.e({ a: 1 }, { a: 1 });
assert.e([1, 2, 3], [1, 2, 3]);

// Strict equality
assert.i(1, 1);
assert.i('hello', 'hello');

// Truthy check
assert.o(true);
assert.o('value');

// Force fail
assert.f('This test should fail');

// Throws assertion
await assert.t(() => {
  throw new Error('Expected');
}, /Expected/);
```

### Mocking

```javascript
import { mock } from '@brutal/testing';

const fn = mock();

// Set return value
fn.r(42);
console.log(fn()); // 42

// Set thrown error
fn.t(new Error('Mock error'));
try {
  fn();
} catch (e) {
  console.log(e.message); // 'Mock error'
}

// Check calls
fn('arg1', 'arg2');
console.log(fn.s()); // Number of calls
console.log(fn.l()); // Last call { a: ['arg1', 'arg2'] }
console.log(fn.w(0)); // Get specific call

// Reset
fn.x();
```

### Spying

```javascript
import { spy } from '@brutal/testing';

const obj = {
  method: (x) => x * 2
};

const s = spy(obj, 'method');

obj.method(5); // Returns 10
console.log(s.l()); // { a: [5], r: 10 }

// Restore original
obj.method.restore();
```

### DOM Testing

```javascript
import { dom } from '@brutal/testing';

// Render HTML
const el = dom.r('<div class="test">Hello</div>');

// Query elements
const div = dom.f('.test');
const all = dom.a('div'); // querySelectorAll

// Fire events
dom.e(div, 'click', { detail: 'data' });

// Cleanup
dom.c();
```

### Async Utilities

```javascript
import { async } from '@brutal/testing';

// Wait for time
await async.w(100); // Wait 100ms

// Wait for condition
let ready = false;
setTimeout(() => { ready = true; }, 50);
await async.f(() => ready, 1000); // Timeout after 1s

// Flush promises
await async.p();
```

## API Reference

### Test Runner
- `test(name, fn)` - Define a test
- `suite(name, fn)` - Define a test suite
- `run()` - Run all tests, returns `{ p: passed, f: failed, e: errors }`
- `clear()` - Clear all tests

### Assertions (assert)
- `e(actual, expected, msg?)` - Deep equality
- `i(actual, expected, msg?)` - Strict equality (===)
- `o(value, msg?)` - Truthy check
- `f(msg?)` - Force failure
- `t(fn, expected?, msg?)` - Assert throws

### Mock Functions
- `mock()` - Create mock function
  - `.r(value)` - Set return value
  - `.t(error)` - Set thrown error
  - `.c` - Array of calls
  - `.s()` - Number of calls
  - `.l()` - Last call
  - `.w(n)` - Get nth call
  - `.x()` - Reset

### DOM Helpers (dom)
- `r(html)` - Render HTML
- `f(selector, element?)` - querySelector
- `a(selector, element?)` - querySelectorAll
- `e(element, event, detail?)` - Fire event
- `c()` - Cleanup

### Async Utilities (async)
- `w(ms)` - Wait milliseconds
- `f(condition, timeout?, interval?)` - Wait for condition
- `p()` - Flush promise queue

## Size

Current size: **2.17KB minified** (under 3KB budget ✅)

## License

MIT