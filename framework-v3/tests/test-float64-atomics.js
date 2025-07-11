/**
 * Test suite for Float64 Atomic operations
 */

import { 
  Float64AtomicView, 
  SeqLockFloat64Array, 
  DoubleBufferedFloat64Array,
  createFloat64AtomicView 
} from '../01-core/Float64Atomics.js';

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertFloat64Equal(actual, expected, tolerance = 1e-10) {
  assert(
    Math.abs(actual - expected) < tolerance,
    `Expected ${expected}, got ${actual}`
  );
}

// Test Float64AtomicView
export async function testFloat64AtomicView() {
  console.log('Testing Float64AtomicView...');
  
  const buffer = new SharedArrayBuffer(1024);
  const view = new Float64AtomicView(buffer, 0, 10);
  
  // Test basic store/load
  view.store(0, 3.14159);
  assertFloat64Equal(view.load(0), 3.14159);
  
  view.store(1, -2.71828);
  assertFloat64Equal(view.load(1), -2.71828);
  
  // Test special values
  view.store(2, Infinity);
  assert(view.load(2) === Infinity, 'Infinity failed');
  
  view.store(3, -Infinity);
  assert(view.load(3) === -Infinity, '-Infinity failed');
  
  view.store(4, NaN);
  assert(isNaN(view.load(4)), 'NaN failed');
  
  // Test exchange
  const oldValue = view.exchange(0, 2.0);
  assertFloat64Equal(oldValue, 3.14159);
  assertFloat64Equal(view.load(0), 2.0);
  
  // Test bounds checking
  try {
    view.load(-1);
    assert(false, 'Should throw on negative index');
  } catch (e) {
    assert(e instanceof RangeError, 'Should be RangeError');
  }
  
  try {
    view.store(10, 1.0);
    assert(false, 'Should throw on out of bounds');
  } catch (e) {
    assert(e instanceof RangeError, 'Should be RangeError');
  }
  
  console.log('✓ Float64AtomicView tests passed');
}

// Test SeqLockFloat64Array
export async function testSeqLockFloat64Array() {
  console.log('Testing SeqLockFloat64Array...');
  
  const buffer = new SharedArrayBuffer(1024);
  const seqlock = new SeqLockFloat64Array(buffer, 10);
  
  // Test single write/read
  seqlock.write(0, 1.23456);
  assertFloat64Equal(seqlock.read(0), 1.23456);
  
  // Test batch operations
  seqlock.writeBatch([
    { index: 1, value: 2.0 },
    { index: 2, value: 3.0 },
    { index: 3, value: 4.0 }
  ]);
  
  const batch = seqlock.readBatch([1, 2, 3]);
  assertFloat64Equal(batch[0], 2.0);
  assertFloat64Equal(batch[1], 3.0);
  assertFloat64Equal(batch[2], 4.0);
  
  console.log('✓ SeqLockFloat64Array tests passed');
}

// Test DoubleBufferedFloat64Array
export async function testDoubleBufferedFloat64Array() {
  console.log('Testing DoubleBufferedFloat64Array...');
  
  const buffer = new SharedArrayBuffer(2048);
  const doubleBuffer = new DoubleBufferedFloat64Array(buffer, 10);
  
  // Initial state
  assert(doubleBuffer.getVersion() === 0, 'Initial version should be 0');
  
  // Test update
  const update = doubleBuffer.beginUpdate();
  
  // Copy current data
  update.writeBuffer.set(update.readBuffer);
  
  // Modify
  update.writeBuffer[0] = 10.0;
  update.writeBuffer[1] = 20.0;
  
  // Commit
  update.commit();
  
  assert(doubleBuffer.getVersion() === 1, 'Version should increment');
  assertFloat64Equal(doubleBuffer.read(0), 10.0);
  assertFloat64Equal(doubleBuffer.read(1), 20.0);
  
  console.log('✓ DoubleBufferedFloat64Array tests passed');
}

// Test concurrent access with workers
export async function testConcurrentAccess() {
  console.log('Testing concurrent access...');
  
  if (typeof Worker === 'undefined') {
    console.log('⚠️  Skipping worker tests (not in browser)');
    return;
  }
  
  const buffer = new SharedArrayBuffer(1024);
  const view = new Float64AtomicView(buffer);
  
  // Initialize
  view.store(0, 0.0);
  
  // Create worker code
  const workerCode = `
    importScripts('../01-core/Float64Atomics.js');
    
    self.onmessage = function(e) {
      const { buffer, iterations } = e.data;
      const view = new Float64AtomicView(buffer);
      
      for (let i = 0; i < iterations; i++) {
        const current = view.load(0);
        view.store(0, current + 1.0);
      }
      
      self.postMessage('done');
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  
  // Launch workers
  const numWorkers = 4;
  const iterationsPerWorker = 1000;
  const workers = [];
  const promises = [];
  
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(workerUrl);
    workers.push(worker);
    
    const promise = new Promise(resolve => {
      worker.onmessage = () => resolve();
    });
    promises.push(promise);
    
    worker.postMessage({ buffer, iterations: iterationsPerWorker });
  }
  
  // Wait for completion
  await Promise.all(promises);
  
  // Verify result
  const expectedTotal = numWorkers * iterationsPerWorker;
  const actualTotal = view.load(0);
  
  console.log(`Expected: ${expectedTotal}, Actual: ${actualTotal}`);
  
  // Some increments might be lost due to race conditions
  // This is expected without proper synchronization
  assert(actualTotal <= expectedTotal, 'Should not exceed expected');
  assert(actualTotal > 0, 'Should have some increments');
  
  // Cleanup
  workers.forEach(w => w.terminate());
  URL.revokeObjectURL(workerUrl);
  
  console.log('✓ Concurrent access tests passed');
}

// Performance benchmarks
export async function benchmarkFloat64Atomics() {
  console.log('\nRunning benchmarks...');
  
  const buffer = new SharedArrayBuffer(8 * 1024 * 1024); // 8MB
  const length = 1000;
  
  // Benchmark Float64AtomicView
  {
    const view = new Float64AtomicView(buffer, 0, length);
    const iterations = 1000000;
    
    // Write benchmark
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      view.store(i % length, i * 0.1);
    }
    const writeTime = performance.now() - writeStart;
    
    // Read benchmark
    const readStart = performance.now();
    let sum = 0;
    for (let i = 0; i < iterations; i++) {
      sum += view.load(i % length);
    }
    const readTime = performance.now() - readStart;
    
    console.log(`Float64AtomicView:`);
    console.log(`  Writes: ${(iterations / writeTime * 1000).toFixed(0)} ops/sec`);
    console.log(`  Reads:  ${(iterations / readTime * 1000).toFixed(0)} ops/sec`);
  }
  
  // Benchmark SeqLock
  {
    const seqlock = new SeqLockFloat64Array(buffer, length);
    const iterations = 1000000;
    
    // Write benchmark
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      seqlock.write(i % length, i * 0.1);
    }
    const writeTime = performance.now() - writeStart;
    
    // Read benchmark
    const readStart = performance.now();
    let sum = 0;
    for (let i = 0; i < iterations; i++) {
      sum += seqlock.read(i % length);
    }
    const readTime = performance.now() - readStart;
    
    console.log(`\nSeqLockFloat64Array:`);
    console.log(`  Writes: ${(iterations / writeTime * 1000).toFixed(0)} ops/sec`);
    console.log(`  Reads:  ${(iterations / readTime * 1000).toFixed(0)} ops/sec`);
  }
  
  // Benchmark Double Buffer
  {
    const doubleBuffer = new DoubleBufferedFloat64Array(buffer, length);
    const iterations = 10000;
    
    // Batch write benchmark
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const update = doubleBuffer.beginUpdate();
      update.writeBuffer[0] = i * 0.1;
      update.writeBuffer[1] = i * 0.2;
      update.commit();
    }
    const writeTime = performance.now() - writeStart;
    
    // Read benchmark
    const readIterations = 1000000;
    const readStart = performance.now();
    let sum = 0;
    for (let i = 0; i < readIterations; i++) {
      sum += doubleBuffer.read(i % length);
    }
    const readTime = performance.now() - readStart;
    
    console.log(`\nDoubleBufferedFloat64Array:`);
    console.log(`  Batch writes: ${(iterations / writeTime * 1000).toFixed(0)} ops/sec`);
    console.log(`  Reads:        ${(readIterations / readTime * 1000).toFixed(0)} ops/sec`);
  }
}

// Main test runner
export async function runAllTests() {
  console.log('=== Float64 Atomics Test Suite ===\n');
  
  try {
    // Check environment
    if (typeof SharedArrayBuffer === 'undefined') {
      console.error('❌ SharedArrayBuffer not available!');
      console.log('Make sure to run with proper COOP/COEP headers');
      return false;
    }
    
    if (!crossOriginIsolated) {
      console.error('❌ Not cross-origin isolated!');
      console.log('SharedArrayBuffer requires crossOriginIsolated');
      return false;
    }
    
    console.log('✓ Environment check passed\n');
    
    // Run tests
    await testFloat64AtomicView();
    await testSeqLockFloat64Array();
    await testDoubleBufferedFloat64Array();
    await testConcurrentAccess();
    
    // Run benchmarks
    await benchmarkFloat64Atomics();
    
    console.log('\n✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    return false;
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
  runAllTests();
}