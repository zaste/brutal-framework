/**
 * BRUTAL Framework V3 - Float64 Atomic Operations
 * High-performance atomic operations for Float64Array in SharedArrayBuffer
 * Zero dependencies, maximum performance
 */

/**
 * Float64AtomicView - Type punning approach for atomic float64 operations
 * Maps Float64Array to Uint32Array pairs for hardware atomic support
 */
export class Float64AtomicView {
  constructor(buffer, byteOffset = 0, length) {
    // Validate alignment
    if (byteOffset % 8 !== 0) {
      throw new TypeError('byteOffset must be 8-byte aligned for Float64');
    }
    
    // Calculate actual length if not provided
    const bytesAvailable = buffer.byteLength - byteOffset;
    const maxLength = Math.floor(bytesAvailable / 8);
    
    this.length = length !== undefined ? Math.min(length, maxLength) : maxLength;
    this.buffer = buffer;
    this.byteOffset = byteOffset;
    
    // Create views - uint32 needs double the length
    this.float64 = new Float64Array(buffer, byteOffset, this.length);
    this.uint32 = new Uint32Array(buffer, byteOffset, this.length * 2);
    
    // Reusable conversion buffer for performance
    this._conversionBuffer = new ArrayBuffer(8);
    this._conversionUint32 = new Uint32Array(this._conversionBuffer);
    this._conversionFloat64 = new Float64Array(this._conversionBuffer);
  }
  
  /**
   * Atomic load - reads float64 value atomically
   */
  load(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const uint32Index = index * 2;
    
    // Read both halves atomically
    const low = Atomics.load(this.uint32, uint32Index);
    const high = Atomics.load(this.uint32, uint32Index + 1);
    
    // Type pun back to float
    this._conversionUint32[0] = low;
    this._conversionUint32[1] = high;
    
    return this._conversionFloat64[0];
  }
  
  /**
   * Atomic store - writes float64 value atomically
   */
  store(index, value) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const uint32Index = index * 2;
    
    // Type pun float to uint32 pair
    this._conversionFloat64[0] = value;
    
    // Store both halves atomically
    Atomics.store(this.uint32, uint32Index, this._conversionUint32[0]);
    Atomics.store(this.uint32, uint32Index + 1, this._conversionUint32[1]);
    
    return value;
  }
  
  /**
   * Atomic exchange - swaps value and returns old value
   */
  exchange(index, value) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const uint32Index = index * 2;
    
    // Type pun new value
    this._conversionFloat64[0] = value;
    const newLow = this._conversionUint32[0];
    const newHigh = this._conversionUint32[1];
    
    // Exchange both halves
    const oldLow = Atomics.exchange(this.uint32, uint32Index, newLow);
    const oldHigh = Atomics.exchange(this.uint32, uint32Index + 1, newHigh);
    
    // Return old value
    this._conversionUint32[0] = oldLow;
    this._conversionUint32[1] = oldHigh;
    
    return this._conversionFloat64[0];
  }
  
  /**
   * Atomic add - adds to value and returns old value
   * Note: This is NOT truly atomic for float64, use with caution
   */
  add(index, delta) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    // This operation is not truly atomic - for demonstration only
    const oldValue = this.load(index);
    this.store(index, oldValue + delta);
    return oldValue;
  }
  
  /**
   * Compare and exchange - CAS operation for float64
   * WARNING: Not truly atomic due to two-part read
   */
  compareExchange(index, expectedValue, newValue) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const uint32Index = index * 2;
    
    // Type pun expected value
    this._conversionFloat64[0] = expectedValue;
    const expectedLow = this._conversionUint32[0];
    const expectedHigh = this._conversionUint32[1];
    
    // Type pun new value
    this._conversionFloat64[0] = newValue;
    const newLow = this._conversionUint32[0];
    const newHigh = this._conversionUint32[1];
    
    // Read current value
    const currentLow = Atomics.load(this.uint32, uint32Index);
    const currentHigh = Atomics.load(this.uint32, uint32Index + 1);
    
    // Check if matches expected
    if (currentLow === expectedLow && currentHigh === expectedHigh) {
      // Attempt to update
      Atomics.store(this.uint32, uint32Index, newLow);
      Atomics.store(this.uint32, uint32Index + 1, newHigh);
      return expectedValue;
    }
    
    // Return actual current value
    this._conversionUint32[0] = currentLow;
    this._conversionUint32[1] = currentHigh;
    
    return this._conversionFloat64[0];
  }
  
  /**
   * Wait for value to change (for synchronization)
   */
  wait(index, value, timeout) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    // Type pun expected value
    this._conversionFloat64[0] = value;
    const expectedLow = this._conversionUint32[0];
    
    // Wait on low word (sufficient for most cases)
    const uint32Index = index * 2;
    return Atomics.wait(this.uint32, uint32Index, expectedLow, timeout);
  }
  
  /**
   * Notify waiting threads
   */
  notify(index, count) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const uint32Index = index * 2;
    return Atomics.notify(this.uint32, uint32Index, count);
  }
}

/**
 * SeqLockFloat64Array - Sequence lock implementation for read-heavy workloads
 * Readers never block but may retry, writers are serialized
 */
export class SeqLockFloat64Array {
  constructor(buffer, length) {
    // Layout: [seq0, data0_low, data0_high, seq1, data1_low, data1_high, ...]
    const intsPerFloat = 3;
    const requiredInts = length * intsPerFloat;
    const requiredBytes = requiredInts * 4;
    
    if (buffer.byteLength < requiredBytes) {
      throw new RangeError(`Buffer too small. Need ${requiredBytes} bytes`);
    }
    
    this.uint32 = new Uint32Array(buffer, 0, requiredInts);
    this.length = length;
    
    // Conversion buffer
    this._conversionBuffer = new ArrayBuffer(8);
    this._conversionUint32 = new Uint32Array(this._conversionBuffer);
    this._conversionFloat64 = new Float64Array(this._conversionBuffer);
  }
  
  /**
   * Lock-free read - may retry if write in progress
   */
  read(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const baseIndex = index * 3;
    let seq1, seq2, low, high;
    let retries = 0;
    const MAX_RETRIES = 1000;
    
    do {
      // Read sequence number
      seq1 = Atomics.load(this.uint32, baseIndex);
      
      // If write in progress (odd sequence), wait briefly
      if (seq1 & 1) {
        if (++retries > MAX_RETRIES) {
          throw new Error('Read timeout - possible writer deadlock');
        }
        continue;
      }
      
      // Read data
      low = Atomics.load(this.uint32, baseIndex + 1);
      high = Atomics.load(this.uint32, baseIndex + 2);
      
      // Verify sequence hasn't changed
      seq2 = Atomics.load(this.uint32, baseIndex);
      
    } while (seq1 !== seq2 || (seq1 & 1));
    
    // Convert back to float
    this._conversionUint32[0] = low;
    this._conversionUint32[1] = high;
    
    return this._conversionFloat64[0];
  }
  
  /**
   * Serialized write - blocks other writers
   */
  write(index, value) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const baseIndex = index * 3;
    
    // Type pun value
    this._conversionFloat64[0] = value;
    
    // Start write (increment sequence to make odd)
    Atomics.add(this.uint32, baseIndex, 1);
    
    // Write data
    Atomics.store(this.uint32, baseIndex + 1, this._conversionUint32[0]);
    Atomics.store(this.uint32, baseIndex + 2, this._conversionUint32[1]);
    
    // Complete write (increment sequence to make even)
    Atomics.add(this.uint32, baseIndex, 1);
    
    return value;
  }
  
  /**
   * Batch read - reads multiple values consistently
   */
  readBatch(indices) {
    const results = new Float64Array(indices.length);
    
    for (let i = 0; i < indices.length; i++) {
      results[i] = this.read(indices[i]);
    }
    
    return results;
  }
  
  /**
   * Batch write - writes multiple values
   */
  writeBatch(updates) {
    for (const {index, value} of updates) {
      this.write(index, value);
    }
  }
}

/**
 * DoubleBufferedFloat64Array - For batch updates with consistent snapshots
 * Readers always get consistent data, writers prepare updates offline
 */
export class DoubleBufferedFloat64Array {
  constructor(buffer, length) {
    // Layout: [version, active_buffer, buffer0..., buffer1...]
    const controlBytes = 8; // 2 uint32
    const bufferBytes = length * 8;
    const totalBytes = controlBytes + (bufferBytes * 2);
    
    if (buffer.byteLength < totalBytes) {
      throw new RangeError(`Buffer too small. Need ${totalBytes} bytes`);
    }
    
    this.control = new Uint32Array(buffer, 0, 2);
    this.buffer0 = new Float64Array(buffer, controlBytes, length);
    this.buffer1 = new Float64Array(buffer, controlBytes + bufferBytes, length);
    this.length = length;
    
    // Initialize
    Atomics.store(this.control, 0, 0); // version
    Atomics.store(this.control, 1, 0); // active buffer
  }
  
  /**
   * Read from active buffer
   */
  read(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    
    const activeBuffer = Atomics.load(this.control, 1);
    const buffer = activeBuffer === 0 ? this.buffer0 : this.buffer1;
    
    return buffer[index];
  }
  
  /**
   * Read entire array
   */
  readAll() {
    const activeBuffer = Atomics.load(this.control, 1);
    const buffer = activeBuffer === 0 ? this.buffer0 : this.buffer1;
    
    return new Float64Array(buffer);
  }
  
  /**
   * Prepare batch update
   */
  beginUpdate() {
    const activeBuffer = Atomics.load(this.control, 1);
    const inactiveBuffer = activeBuffer === 0 ? 1 : 0;
    
    return {
      readBuffer: activeBuffer === 0 ? this.buffer0 : this.buffer1,
      writeBuffer: inactiveBuffer === 0 ? this.buffer0 : this.buffer1,
      commit: () => this._commit(inactiveBuffer)
    };
  }
  
  /**
   * Commit prepared update
   */
  _commit(newActiveBuffer) {
    // Atomic swap
    Atomics.store(this.control, 1, newActiveBuffer);
    
    // Increment version
    Atomics.add(this.control, 0, 1);
  }
  
  /**
   * Get current version
   */
  getVersion() {
    return Atomics.load(this.control, 0);
  }
}

/**
 * Factory function for creating appropriate atomic float view
 */
export function createFloat64AtomicView(buffer, options = {}) {
  const {
    type = 'default',
    offset = 0,
    length,
    capacity
  } = options;
  
  switch (type) {
    case 'seqlock':
      return new SeqLockFloat64Array(buffer, length);
      
    case 'double-buffered':
      return new DoubleBufferedFloat64Array(buffer, length);
      
    case 'default':
    default:
      return new Float64AtomicView(buffer, offset, length);
  }
}

// Export for use in State.js
export default {
  Float64AtomicView,
  SeqLockFloat64Array,
  DoubleBufferedFloat64Array,
  createFloat64AtomicView
};