/**
 * @fileoverview BRUTAL Compute Worker - Heavy computation offloading
 * @version 1.0.0
 * @license MIT
 */

// Worker state
let workerId = null;
let sharedBuffer = null;
let sharedView = null;
let computeCache = new Map();

// Performance metrics
const metrics = {
    computations: 0,
    cacheHits: 0,
    avgComputeTime: 0,
    peakMemory: 0
};

/**
 * Initialize worker
 */
function initialize(data) {
    workerId = data.workerId;
    
    if (data.sharedBuffer) {
        sharedBuffer = data.sharedBuffer;
        sharedView = new Float64Array(sharedBuffer);
    }
    
    self.postMessage({ type: 'READY', workerId });
}

/**
 * Main message handler
 */
self.onmessage = async function(e) {
    const { type, data, taskId } = e.data;

    try {
        switch (type) {
            case 'INIT':
                initialize(e.data);
                break;

            case 'TASK':
                const result = await processComputeTask(data);
                self.postMessage({
                    type: 'RESULT',
                    taskId,
                    result,
                    workerId,
                    metrics
                });
                break;

            case 'HEALTH_CHECK':
                self.postMessage({ 
                    type: 'HEALTH_RESPONSE', 
                    workerId,
                    metrics,
                    memory: performance.memory?.usedJSHeapSize || 0,
                    cacheSize: computeCache.size
                });
                break;

            case 'CLEAR_CACHE':
                computeCache.clear();
                self.postMessage({ 
                    type: 'CACHE_CLEARED', 
                    workerId 
                });
                break;

            case 'TERMINATE':
                cleanup();
                self.close();
                break;
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            taskId,
            error: error.message,
            stack: error.stack,
            workerId
        });
    }
};

/**
 * Process compute task
 */
async function processComputeTask(data) {
    const { operation, params } = data;
    const startTime = performance.now();
    
    metrics.computations++;

    switch (operation) {
        case 'MATRIX_MULTIPLY':
            return matrixMultiply(params);
            
        case 'SORT_LARGE_ARRAY':
            return sortLargeArray(params);
            
        case 'CALCULATE_PRIMES':
            return calculatePrimes(params);
            
        case 'DATA_TRANSFORM':
            return transformData(params);
            
        case 'CRYPTO_HASH':
            return cryptoHash(params);
            
        case 'IMAGE_PROCESS':
            return processImage(params);
            
        case 'PHYSICS_SIMULATION':
            return physicsSimulation(params);
            
        case 'ML_INFERENCE':
            return mlInference(params);
            
        default:
            throw new Error(`Unknown compute operation: ${operation}`);
    }
}

/**
 * Matrix multiplication (optimized)
 */
function matrixMultiply(params) {
    const { matrixA, matrixB, useCache = true } = params;
    const startTime = performance.now();
    
    // Cache key
    const cacheKey = `matrix-${matrixA.length}x${matrixA[0].length}-${matrixB.length}x${matrixB[0].length}`;
    
    if (useCache && computeCache.has(cacheKey)) {
        metrics.cacheHits++;
        return computeCache.get(cacheKey);
    }
    
    const rowsA = matrixA.length;
    const colsA = matrixA[0].length;
    const rowsB = matrixB.length;
    const colsB = matrixB[0].length;
    
    if (colsA !== rowsB) {
        throw new Error('Invalid matrix dimensions for multiplication');
    }
    
    // Result matrix
    const result = new Array(rowsA);
    for (let i = 0; i < rowsA; i++) {
        result[i] = new Float64Array(colsB);
    }
    
    // Optimized multiplication with cache-friendly access pattern
    for (let i = 0; i < rowsA; i++) {
        for (let k = 0; k < colsA; k++) {
            const aik = matrixA[i][k];
            for (let j = 0; j < colsB; j++) {
                result[i][j] += aik * matrixB[k][j];
            }
        }
    }
    
    const computeTime = performance.now() - startTime;
    metrics.avgComputeTime = (metrics.avgComputeTime * (metrics.computations - 1) + computeTime) / metrics.computations;
    
    const response = {
        result,
        stats: {
            computeTime,
            operations: rowsA * colsA * colsB,
            flops: (rowsA * colsA * colsB * 2) / (computeTime / 1000) // FLOPS
        }
    };
    
    if (useCache) {
        computeCache.set(cacheKey, response);
    }
    
    return response;
}

/**
 * Sort large array with custom algorithm selection
 */
function sortLargeArray(params) {
    const { array, algorithm = 'quicksort', compareFn } = params;
    const startTime = performance.now();
    
    let sorted;
    const size = array.length;
    
    // Algorithm selection based on size and characteristics
    switch (algorithm) {
        case 'quicksort':
            sorted = quickSort([...array], compareFn);
            break;
            
        case 'mergesort':
            sorted = mergeSort([...array], compareFn);
            break;
            
        case 'heapsort':
            sorted = heapSort([...array], compareFn);
            break;
            
        case 'radix':
            // Only for integers
            sorted = radixSort([...array]);
            break;
            
        case 'auto':
            // Auto-select based on size
            if (size < 100) {
                sorted = [...array].sort(compareFn);
            } else if (size < 10000) {
                sorted = quickSort([...array], compareFn);
            } else {
                sorted = mergeSort([...array], compareFn);
            }
            break;
            
        default:
            sorted = [...array].sort(compareFn);
    }
    
    const computeTime = performance.now() - startTime;
    
    return {
        sorted,
        stats: {
            computeTime,
            algorithm,
            size,
            comparisons: Math.floor(size * Math.log2(size)) // Approximate
        }
    };
}

/**
 * QuickSort implementation
 */
function quickSort(arr, compareFn = (a, b) => a - b) {
    if (arr.length <= 1) return arr;
    
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = [];
    const right = [];
    const equal = [];
    
    for (const elem of arr) {
        const comp = compareFn(elem, pivot);
        if (comp < 0) left.push(elem);
        else if (comp > 0) right.push(elem);
        else equal.push(elem);
    }
    
    return [...quickSort(left, compareFn), ...equal, ...quickSort(right, compareFn)];
}

/**
 * MergeSort implementation
 */
function mergeSort(arr, compareFn = (a, b) => a - b) {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid), compareFn);
    const right = mergeSort(arr.slice(mid), compareFn);
    
    return merge(left, right, compareFn);
}

function merge(left, right, compareFn) {
    const result = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
        if (compareFn(left[i], right[j]) <= 0) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
}

/**
 * HeapSort implementation
 */
function heapSort(arr, compareFn = (a, b) => a - b) {
    const n = arr.length;
    
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(arr, n, i, compareFn);
    }
    
    // Extract elements from heap
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        heapify(arr, i, 0, compareFn);
    }
    
    return arr;
}

function heapify(arr, n, i, compareFn) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n && compareFn(arr[left], arr[largest]) > 0) {
        largest = left;
    }
    
    if (right < n && compareFn(arr[right], arr[largest]) > 0) {
        largest = right;
    }
    
    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        heapify(arr, n, largest, compareFn);
    }
}

/**
 * RadixSort for integers
 */
function radixSort(arr) {
    const max = Math.max(...arr);
    const maxDigits = Math.floor(Math.log10(max)) + 1;
    
    for (let digit = 0; digit < maxDigits; digit++) {
        const buckets = Array.from({ length: 10 }, () => []);
        
        for (const num of arr) {
            const digitValue = Math.floor(num / Math.pow(10, digit)) % 10;
            buckets[digitValue].push(num);
        }
        
        arr = buckets.flat();
    }
    
    return arr;
}

/**
 * Calculate prime numbers (Sieve of Eratosthenes)
 */
function calculatePrimes(params) {
    const { limit, returnList = false } = params;
    const startTime = performance.now();
    
    const sieve = new Uint8Array(limit + 1).fill(1);
    sieve[0] = sieve[1] = 0;
    
    for (let i = 2; i * i <= limit; i++) {
        if (sieve[i]) {
            for (let j = i * i; j <= limit; j += i) {
                sieve[j] = 0;
            }
        }
    }
    
    let count = 0;
    const primes = returnList ? [] : null;
    
    for (let i = 2; i <= limit; i++) {
        if (sieve[i]) {
            count++;
            if (returnList) primes.push(i);
        }
    }
    
    const computeTime = performance.now() - startTime;
    
    return {
        count,
        primes,
        stats: {
            computeTime,
            limit,
            density: count / limit
        }
    };
}

/**
 * Transform large datasets
 */
function transformData(params) {
    const { data, operations } = params;
    const startTime = performance.now();
    
    let result = data;
    const stats = {
        operations: []
    };
    
    for (const op of operations) {
        const opStart = performance.now();
        
        switch (op.type) {
            case 'map':
                result = result.map(op.fn);
                break;
                
            case 'filter':
                result = result.filter(op.fn);
                break;
                
            case 'reduce':
                result = result.reduce(op.fn, op.initial);
                break;
                
            case 'groupBy':
                result = groupBy(result, op.key);
                break;
                
            case 'aggregate':
                result = aggregate(result, op.aggregations);
                break;
                
            case 'pivot':
                result = pivot(result, op.row, op.column, op.value);
                break;
        }
        
        stats.operations.push({
            type: op.type,
            time: performance.now() - opStart,
            outputSize: Array.isArray(result) ? result.length : 1
        });
    }
    
    const computeTime = performance.now() - startTime;
    
    return {
        result,
        stats: {
            computeTime,
            inputSize: data.length,
            outputSize: Array.isArray(result) ? result.length : 1,
            operations: stats.operations
        }
    };
}

/**
 * Group by key
 */
function groupBy(data, key) {
    return data.reduce((acc, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
    }, {});
}

/**
 * Aggregate data
 */
function aggregate(data, aggregations) {
    const result = {};
    
    for (const [field, agg] of Object.entries(aggregations)) {
        switch (agg.type) {
            case 'sum':
                result[field] = data.reduce((sum, item) => sum + (item[field] || 0), 0);
                break;
                
            case 'avg':
                result[field] = data.reduce((sum, item) => sum + (item[field] || 0), 0) / data.length;
                break;
                
            case 'min':
                result[field] = Math.min(...data.map(item => item[field] || Infinity));
                break;
                
            case 'max':
                result[field] = Math.max(...data.map(item => item[field] || -Infinity));
                break;
                
            case 'count':
                result[field] = data.filter(item => item[field] !== undefined).length;
                break;
        }
    }
    
    return result;
}

/**
 * Pivot table
 */
function pivot(data, rowKey, columnKey, valueKey) {
    const result = {};
    
    for (const item of data) {
        const row = item[rowKey];
        const col = item[columnKey];
        const val = item[valueKey];
        
        if (!result[row]) result[row] = {};
        if (!result[row][col]) result[row][col] = [];
        
        result[row][col].push(val);
    }
    
    // Aggregate values
    for (const row of Object.values(result)) {
        for (const [col, values] of Object.entries(row)) {
            row[col] = values.reduce((a, b) => a + b, 0) / values.length;
        }
    }
    
    return result;
}

/**
 * Crypto hash calculation
 */
async function cryptoHash(params) {
    const { data, algorithm = 'SHA-256' } = params;
    const startTime = performance.now();
    
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const computeTime = performance.now() - startTime;
    
    return {
        hash: hashHex,
        algorithm,
        stats: {
            computeTime,
            dataSize: dataBuffer.byteLength
        }
    };
}

/**
 * Image processing
 */
function processImage(params) {
    const { imageData, operations } = params;
    const startTime = performance.now();
    
    let result = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
    );
    
    for (const op of operations) {
        switch (op.type) {
            case 'brightness':
                applyBrightness(result, op.value);
                break;
                
            case 'contrast':
                applyContrast(result, op.value);
                break;
                
            case 'blur':
                result = applyBlur(result, op.radius);
                break;
                
            case 'sharpen':
                result = applySharpen(result, op.amount);
                break;
                
            case 'grayscale':
                applyGrayscale(result);
                break;
        }
    }
    
    const computeTime = performance.now() - startTime;
    
    return {
        imageData: result,
        stats: {
            computeTime,
            pixels: imageData.width * imageData.height,
            operations: operations.length
        }
    };
}

/**
 * Apply brightness adjustment
 */
function applyBrightness(imageData, value) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + value));     // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + value)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + value)); // B
    }
}

/**
 * Apply contrast adjustment
 */
function applyContrast(imageData, value) {
    const data = imageData.data;
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
}

/**
 * Apply grayscale
 */
function applyGrayscale(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
    }
}

/**
 * Simple box blur
 */
function applyBlur(imageData, radius) {
    // Simplified box blur for demonstration
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    
                    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                        const idx = (ny * width + nx) * 4;
                        r += data[idx];
                        g += data[idx + 1];
                        b += data[idx + 2];
                        a += data[idx + 3];
                        count++;
                    }
                }
            }
            
            const idx = (y * width + x) * 4;
            output[idx] = r / count;
            output[idx + 1] = g / count;
            output[idx + 2] = b / count;
            output[idx + 3] = a / count;
        }
    }
    
    return new ImageData(output, width, height);
}

/**
 * Simple sharpen filter
 */
function applySharpen(imageData, amount) {
    // Simplified sharpen for demonstration
    const kernel = [
        0, -amount, 0,
        -amount, 1 + 4 * amount, -amount,
        0, -amount, 0
    ];
    
    // Apply convolution (simplified)
    return imageData; // TODO: Implement full convolution
}

/**
 * Physics simulation
 */
function physicsSimulation(params) {
    const { particles, forces, timestep = 0.016, iterations = 100 } = params;
    const startTime = performance.now();
    
    // Clone particles for simulation
    let state = particles.map(p => ({ ...p }));
    
    for (let iter = 0; iter < iterations; iter++) {
        // Apply forces
        for (const particle of state) {
            // Reset acceleration
            particle.ax = 0;
            particle.ay = 0;
            particle.az = 0;
            
            // Apply each force
            for (const force of forces) {
                switch (force.type) {
                    case 'gravity':
                        particle.ay += force.g || -9.81;
                        break;
                        
                    case 'drag':
                        const speed = Math.sqrt(
                            particle.vx ** 2 + 
                            particle.vy ** 2 + 
                            particle.vz ** 2
                        );
                        if (speed > 0) {
                            const dragForce = -force.coefficient * speed;
                            particle.ax += dragForce * particle.vx / speed;
                            particle.ay += dragForce * particle.vy / speed;
                            particle.az += dragForce * particle.vz / speed;
                        }
                        break;
                        
                    case 'spring':
                        // Hooke's law
                        const dx = force.anchor.x - particle.x;
                        const dy = force.anchor.y - particle.y;
                        const dz = force.anchor.z - particle.z;
                        particle.ax += force.k * dx;
                        particle.ay += force.k * dy;
                        particle.az += force.k * dz;
                        break;
                }
            }
            
            // Update velocity
            particle.vx += particle.ax * timestep;
            particle.vy += particle.ay * timestep;
            particle.vz += particle.az * timestep;
            
            // Update position
            particle.x += particle.vx * timestep;
            particle.y += particle.vy * timestep;
            particle.z += particle.vz * timestep;
        }
        
        // Collision detection (simplified)
        for (let i = 0; i < state.length; i++) {
            for (let j = i + 1; j < state.length; j++) {
                const p1 = state[i];
                const p2 = state[j];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dz = p2.z - p1.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const minDist = (p1.radius || 1) + (p2.radius || 1);
                
                if (dist < minDist && dist > 0) {
                    // Simple elastic collision
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;
                    
                    const relVel = (p2.vx - p1.vx) * nx + 
                                  (p2.vy - p1.vy) * ny + 
                                  (p2.vz - p1.vz) * nz;
                    
                    if (relVel < 0) {
                        const impulse = 2 * relVel / (1 / p1.mass + 1 / p2.mass);
                        p1.vx -= impulse * nx / p1.mass;
                        p1.vy -= impulse * ny / p1.mass;
                        p1.vz -= impulse * nz / p1.mass;
                        p2.vx += impulse * nx / p2.mass;
                        p2.vy += impulse * ny / p2.mass;
                        p2.vz += impulse * nz / p2.mass;
                    }
                }
            }
        }
    }
    
    const computeTime = performance.now() - startTime;
    
    return {
        finalState: state,
        stats: {
            computeTime,
            iterations,
            particleCount: particles.length,
            simulatedTime: iterations * timestep
        }
    };
}

/**
 * Simple ML inference (example: linear regression prediction)
 */
function mlInference(params) {
    const { model, inputs, type = 'linear' } = params;
    const startTime = performance.now();
    
    let predictions;
    
    switch (type) {
        case 'linear':
            // y = mx + b
            predictions = inputs.map(x => model.slope * x + model.intercept);
            break;
            
        case 'polynomial':
            // y = a0 + a1*x + a2*x^2 + ... + an*x^n
            predictions = inputs.map(x => {
                let y = 0;
                for (let i = 0; i < model.coefficients.length; i++) {
                    y += model.coefficients[i] * Math.pow(x, i);
                }
                return y;
            });
            break;
            
        case 'neural':
            // Simple feed-forward network
            predictions = inputs.map(input => {
                let current = Array.isArray(input) ? input : [input];
                
                // Forward pass through layers
                for (const layer of model.layers) {
                    const next = new Array(layer.neurons).fill(0);
                    
                    for (let i = 0; i < layer.neurons; i++) {
                        for (let j = 0; j < current.length; j++) {
                            next[i] += current[j] * layer.weights[j][i];
                        }
                        next[i] += layer.biases[i];
                        
                        // Activation function
                        switch (layer.activation) {
                            case 'relu':
                                next[i] = Math.max(0, next[i]);
                                break;
                            case 'sigmoid':
                                next[i] = 1 / (1 + Math.exp(-next[i]));
                                break;
                            case 'tanh':
                                next[i] = Math.tanh(next[i]);
                                break;
                        }
                    }
                    
                    current = next;
                }
                
                return current.length === 1 ? current[0] : current;
            });
            break;
    }
    
    const computeTime = performance.now() - startTime;
    
    return {
        predictions,
        stats: {
            computeTime,
            inputCount: inputs.length,
            modelType: type,
            avgPredictionTime: computeTime / inputs.length
        }
    };
}

/**
 * Update memory metrics
 */
function updateMemoryMetrics() {
    if (performance.memory) {
        metrics.peakMemory = Math.max(
            metrics.peakMemory,
            performance.memory.usedJSHeapSize
        );
    }
}

/**
 * Cleanup worker resources
 */
function cleanup() {
    computeCache.clear();
    }

// Periodic memory monitoring
setInterval(updateMemoryMetrics, 1000);

// Error handling
self.onerror = function(error) {
    self.postMessage({
        type: 'ERROR',
        error: error.message,
        workerId
    });
};

