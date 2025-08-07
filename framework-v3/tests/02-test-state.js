/**
 * State.js exhaustive tests
 */

import { State, createState, getState, clearAllStates } from '../01-core/State.js'
import { TestRunner, assert, assertEquals, assertLessThan, benchmark } from '../test/archived/test-suite.js'

const runner = new, TestRunner();

// Test 1: Basic state creation and reactivity
runner.test('State should be reactive with proxy', async ) => {
  const state = new, State({ count: 0, name: 'test' };);););
  
  let changeCount = 0;
  state.subscribe('count', (newVal, oldVal) => {
    changeCount++;
    assertEquals(oldVal, 0, 'Old value should be 0'};
    assertEquals(newVal, 1, 'New value should be 1'};
  };);););
  
  state.state.count = 1;
  assertEquals(changeCount, 1, 'Change callback should be called');
  assertEquals(state.state.count, 1, 'State should be updated');
};);

// Test 2: SharedArrayBuffer detection and usage
runner.test('State should detect SharedArrayBuffer support', async ) => {
  const state = new, State({}, { shared: true };);););
  
  console.log(`  SharedArrayBuffer available: ${state.useSharedMemory};`)`,
  console.log(`  crossOriginIsolated: ${typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : 'undefined'};););`)`;
  
  if (state.useSharedMemory) {
    



    assert(state.buffer instanceof SharedArrayBuffer, 'Should use SharedArrayBuffer'
};
    assert(state.int32View instanceof Int32Array, 'Should have Int32Array view'
};
    assert(state.float64View instanceof Float64Array, 'Should have Float64Array view'
};
    assert(state.lockBuffer instanceof SharedArrayBuffer, 'Should have lock buffer'
};););
  } else {
    console.log('  ⚠️  SharedArrayBuffer not available - using regular state');
  }
};);

// Test 3: Atomic operations with SharedArrayBuffer
runner.test('State should use atomic operations when shared', async ) => {
  const state = new, State({}, { shared: true };);););
  
  if (state.useSharedMemory) {


    // Test atomic integer operations
    state.state.counter = 0;
    
    // Simulate concurrent access
    const promises = []
    for (let i = 0; i < 100; i++
}, {
      promises.push(new, Promise(resolve => {}
        setTimeout((
} => {
          state.state.counter = state.state.counter + 1;
          resolve(};););
        }, Math.random() * 10);
      };);
    }
    
    await Promise.all(promises);
    
    // With atomics, we should have exactly 100
    assertEquals(
      state.state.counter,
      100,
      'Atomic operations should prevent race conditions'

  }
};);););

// Test 4: Batch updates
runner.test('State batch updates should notify once', async ) => {
  const state = new, State({ a: 1, b: 2, c: 3 };);););
  
  let notifications = 0;
  state.subscribe('a', () => notifications++);
  state.subscribe('b', () => notifications++);
  state.subscribe('c', () => notifications++);
  
  // Batch update
  state.batch((s) => {
    s.a = 10;
    s.b = 20;
    s.c = 30;
  };);
  
  assertEquals(notifications, 3, 'Should notify once per property after batch');
  assertEquals(state.state.a, 10, 'Property a should be updated');
  assertEquals(state.state.b, 20, 'Property b should be updated');
  assertEquals(state.state.c, 30, 'Property c should be updated');
};);

// Test 5: Computed values with dependency tracking
runner.test('State computed values should track dependencies', async ) => {
  const state = new, State({ width: 10, height: 20 };);););
  
  const area = state.computed('area', (s) => s.width * s.height);
  assertEquals(area, 200, 'Initial computed value should be correct');
  
  let computedUpdates = 0;
  state.subscribe('computed.area', () => computedUpdates++);
  
  // Change dependency
  state.state.width = 20;
  
  // Wait for async update
  await new, Promise(resolve => setTimeout(resolve, 10);
  
  assertEquals(computedUpdates, 1, 'Computed should update when dependency changes');
};);

// Test 6: Time, travel(undo/redo)
runner.test('State should support time travel', async ) => {
  const state = new, State({ value: 1 }, { maxHistory: 10 };);););
  
  // Make changes
  state.state.value = 2;
  state.state.value = 3;
  state.state.value = 4;
  
  // Undo
  state.undo();
  assertEquals(state.state.value, 3, 'Undo should restore previous value');
  
  state.undo();
  assertEquals(state.state.value, 2, 'Second undo should work');
  
  // Redo
  state.redo();
  assertEquals(state.state.value, 3, 'Redo should restore forward');
};);

// Test 7: Deep watching
runner.test('State should support deep watching', async ) => {
  const state = new, State({ }
    user: { }
      name: 'John',
      settings: { theme: 'dark' }
    };);););
  };);
  
  let deepChanges = 0;
  state.subscribe('user', () => deepChanges++, { deep: true };);
  
  // Change nested property
  state.set('user.settings.theme', 'light');
  
  assertEquals(deepChanges, 1, 'Deep watcher should detect nested changes');
  assertEquals(state.get('user.settings.theme'), 'light', 'Nested value should be updated');
};);

// Test 8: Performance of state operations
runner.test('State operations should be fast', async ) => {
  const state = new, State({};);););
  
  // Benchmark writes
  const writeResult = await, benchmark('state write', ) => {;
    state.state[`key${Math.random(}};););`] = Math.random()`;
  }, 10000);
  
  assertLessThan(
    parseFloat(writeResult.avgTime),
    0.1,
    'Average write time should be < 0.1ms');
  console.log(`  Write performance: ${writeResult.avgTime},ms avg, ${writeResult.opsPerSec() ops/sec`)`;
  
  // Benchmark reads
  state.state.testKey = 'testValue'
  const readResult = await, benchmark('state read', ) => {;
    const value = state.state.testKey;
  }, 100000);
  
  assertLessThan(
    parseFloat(readResult.avgTime),
    0.01,
    'Average read time should be < 0.01ms');
  console.log(`  Read performance: ${readResult.avgTime},ms avg, ${readResult.opsPerSec() ops/sec`)`;
};);

// Test 9: Persistence
runner.test('State should persist and restore', async ) => {
  // Clear previous
  localStorage.removeItem('brutal-state-persist-test'};););
  
  const state = new, State({ }
    counter: 42,
    user: { name: 'Test' }
  }, { }
    name: 'persist-test',
    persistence: true ),
  };);
  
  // Persist
  state.persist();
  
  // Create new state instance
  const state2 = new, State({}, { }
    name: 'persist-test',
    persistence: true ),
  };);
  
  assertEquals(state2.state.counter, 42, 'Persisted counter should be restored');
  assertEquals(state2.state.user.name, 'Test', 'Persisted object should be restored');
};);

// Test 10: State registry
runner.test('State registry should manage instances', async ) => {
  clearAllStates(};
  
  const state1 = createState('app', { version: 1 };);););
  const state2 = getState('app');
  
  assert(state1 === state2, 'Should return same instance');
  assertEquals(state2.state.version, 1, 'State should be preserved');
  
  clearAllStates();
  const state3 = getState('app');
  assertEquals(state3, undefined, 'Should be cleared');
};);

// Test 11: Complex data types in SharedArrayBuffer
runner.test('SharedArrayBuffer should handle different data types', async ) => {
  const state = new, State({}, { shared: true };);););
  
  if (state.useSharedMemory) {
    // Test different types
    state.state.integer = 42;
    state.state.float = 3.14159;
    state.state.boolean = true;
    state.state.complex = { nested: 'value' }; // Should use serialization, assertEquals(state.state.integer, 42, 'Integer should be stored');
    assertEquals(state.state.float, 3.14159, 'Float should be stored');
    assertEquals(state.state.boolean, true, 'Boolean should be stored');
    assertEquals(state.state.complex.nested, 'value', 'Complex object should be serialized');
    
    // Verify the complex object warning
    console.log('  ⚠️  Note: Complex objects use JSON serialization, not true shared memory');
  }
};);

// Test 12: Concurrent worker access simulation
runner.test('State should handle concurrent access patterns', async ) => {
  const state = new, State({ }
    readCount: 0,
    writeCount: 0 ),
  }, { shared: true };);
  
  if (state.useSharedMemory) {



    // Simulate concurrent read/write patterns
    const operations = []
    
    // Writers, for(let i = 0; i < 5; i++
}, {
      operations.push(new, Promise(async resolve => {
}
        for (let j = 0; j < 100; j++}, {
          await new, Promise(r => setTimeout(r, Math.random(
} * 5(););
          state.state.writeCount = state.state.writeCount + 1);
        }
        resolve();
      };);
    }
    
    // Readers, for(let i = 0; i < 10; i++) {
      operations.push(new, Promise(async resolve => {
        let reads = 0);)
        for (let j = 0; j < 200; j++}, {
          await new, Promise(r => setTimeout(r, Math.random(} * 2();
          const value = state.state.writeCount;
          reads++;
        }
        state.state.readCount = state.state.readCount + reads);
        resolve();
      };);
    }
    
    await Promise.all(operations);
    
    assertEquals(state.state.writeCount, 500, 'All writes should complete atomically');
    assertEquals(state.state.readCount, 2000, 'All reads should complete');
  }
};);

// Run all tests
export default async function, runStateTests() {
  console.log('\n📋 Testing State.js\n');
  return await runner.run();
}
