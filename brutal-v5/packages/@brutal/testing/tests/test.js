import { test, suite, run, assert, mock, spy, dom, async } from '../dist/index.js';

// Test the testing framework itself!
suite('Assertions', () => {
  test('equal works', () => {
    assert.e({ a: 1 }, { a: 1 });
    assert.e([1, 2, 3], [1, 2, 3]);
  });

  test('strict equal works', () => {
    assert.i(1, 1);
    assert.i('hello', 'hello');
  });

  test('truthy works', () => {
    assert.o(true);
    assert.o(1);
    assert.o('hello');
  });

  test('throws works', async () => {
    await assert.t(() => {
      throw new Error('Expected error');
    }, 'Expected error');
  });
});

suite('Mocking', () => {
  test('mock function tracks calls', () => {
    const fn = mock();
    fn.r(42);
    
    const result = fn('test', 123);
    assert.i(result, 42);
    assert.i(fn.s(), 2); // 2 calls (1 from .r, 1 from call)
    assert.e(fn.l().a, ['test', 123]);
  });

  test('mock can throw', () => {
    const fn = mock();
    fn.t(new Error('Mock error'));
    
    try {
      fn();
      assert.f('Should have thrown');
    } catch (e) {
      assert.i(e.message, 'Mock error');
    }
  });
});

suite('Async utilities', () => {
  test('wait works', async () => {
    const start = Date.now();
    await async.w(50);
    const elapsed = Date.now() - start;
    assert.o(elapsed >= 45); // Allow some variance
  });

  test('waitFor works', async () => {
    let ready = false;
    setTimeout(() => { ready = true; }, 20);
    
    await async.f(() => ready, 100);
    assert.o(ready);
  });
});

// Run all tests
const result = await run();
console.log(`\n✅ Passed: ${result.p}`);
console.log(`❌ Failed: ${result.f}`);

if (result.f > 0) {
  console.log('\nErrors:');
  result.e.forEach(e => console.error(e));
  process.exit(1);
}