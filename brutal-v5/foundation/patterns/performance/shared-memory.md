# Shared Memory Pattern

## Problem
Traditional worker communication through postMessage involves expensive serialization/deserialization. Large data transfers between workers create performance bottlenecks.

## Solution
SharedArrayBuffer-based shared memory with automatic fallback, enabling zero-copy data sharing between workers while maintaining compatibility.

### Implementation
```typescript
// Shared memory state management
export class SharedMemoryState {
  private buffer?: SharedArrayBuffer;
  private fallback: Map<string, any> = new Map();
  private useSharedMemory: boolean;
  
  constructor(size: number = 1024 * 1024) { // 1MB default
    this.useSharedMemory = this.detectSupport();
    
    if (this.useSharedMemory) {
      try {
        this.buffer = new SharedArrayBuffer(size);
        this.initializeAtomics();
      } catch (e) {
        // Fallback if headers not configured
        this.useSharedMemory = false;
      }
    }
  }
  
  private detectSupport(): boolean {
    // Check for SharedArrayBuffer availability
    if (typeof SharedArrayBuffer === 'undefined') {
      return false;
    }
    
    // Check for required headers
    if (!crossOriginIsolated) {
      console.warn('SharedArrayBuffer requires crossOriginIsolated');
      return false;
    }
    
    return true;
  }
  
  // Atomic operations for thread-safe access
  private initializeAtomics() {
    if (!this.buffer) return;
    
    // Header: [version, lock, writeIndex, readIndex]
    const header = new Int32Array(this.buffer, 0, 4);
    Atomics.store(header, 0, 1); // version
    Atomics.store(header, 1, 0); // lock (0 = unlocked)
    Atomics.store(header, 2, 16); // writeIndex (after header)
    Atomics.store(header, 3, 16); // readIndex
  }
  
  // Thread-safe write
  write(key: string, value: any): void {
    if (!this.useSharedMemory) {
      this.fallback.set(key, value);
      return;
    }
    
    const header = new Int32Array(this.buffer!, 0, 4);
    
    // Acquire lock
    while (Atomics.compareExchange(header, 1, 0, 1) !== 0) {
      // Spin wait
    }
    
    try {
      // Write data
      this.writeToBuffer(key, value);
    } finally {
      // Release lock
      Atomics.store(header, 1, 0);
      Atomics.notify(header, 1);
    }
  }
  
  // Thread-safe read
  read(key: string): any {
    if (!this.useSharedMemory) {
      return this.fallback.get(key);
    }
    
    const header = new Int32Array(this.buffer!, 0, 4);
    
    // Acquire read lock (multiple readers allowed)
    while (Atomics.load(header, 1) === 1) {
      Atomics.wait(header, 1, 1);
    }
    
    return this.readFromBuffer(key);
  }
}
```

### Worker Pool Integration
```typescript
// Worker pool with shared memory
export class SharedMemoryWorkerPool {
  private workers: Worker[] = [];
  private sharedState: SharedMemoryState;
  
  constructor(workerCount: number = navigator.hardwareConcurrency) {
    this.sharedState = new SharedMemoryState();
    
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker('/worker.js');
      
      if (this.sharedState.useSharedMemory) {
        // Share the buffer with worker
        worker.postMessage({
          type: 'init',
          buffer: this.sharedState.buffer
        });
      }
      
      this.workers.push(worker);
    }
  }
  
  // Distribute work without data transfer
  async processInParallel<T>(
    items: T[],
    processor: (item: T) => any
  ): Promise<any[]> {
    if (this.sharedState.useSharedMemory) {
      // Store items in shared memory
      this.sharedState.write('workItems', items);
      
      // Workers read directly from shared memory
      const promises = this.workers.map((worker, index) => 
        this.processWithWorker(worker, index, items.length)
      );
      
      return Promise.all(promises);
    } else {
      // Fallback to traditional message passing
      return this.processWithMessagePassing(items, processor);
    }
  }
}
```

### Security Headers Required
```javascript
// Server configuration for SharedArrayBuffer
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
```

### Performance Monitoring
```typescript
class SharedMemoryMetrics {
  measureTransferSpeed() {
    const size = 1024 * 1024; // 1MB
    const data = new Float64Array(size / 8);
    
    // Traditional transfer
    const traditionalStart = performance.now();
    worker.postMessage({ data });
    const traditionalTime = performance.now() - traditionalStart;
    
    // Shared memory "transfer" (just index)
    const sharedStart = performance.now();
    sharedState.write('data', 0); // Just write index
    const sharedTime = performance.now() - sharedStart;
    
    return {
      traditional: traditionalTime,
      shared: sharedTime,
      improvement: traditionalTime / sharedTime
    };
  }
}
```

## Evolution
- V3: postMessage only, serialization overhead
- V4: Some worker optimizations
- V5: SharedArrayBuffer with automatic fallback

## Trade-offs
- ✅ Zero-copy data sharing
- ✅ Massive performance gains
- ✅ Automatic fallback
- ✅ Thread-safe operations
- ❌ Security header requirements
- ❌ Browser support limitations
- ❌ Complexity increase

## Related
- [Worker Pool Management](./worker-pool.md)
- [Performance Budgets](./performance-budgets.md)
- [State Management](../core/proxy-state-management.md)