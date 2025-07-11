/**
 * @fileoverview BRUTAL Data Worker - State synchronization and data management
 * @version 1.0.0
 * @license MIT
 */

// Worker state
let workerId = null;
let sharedBuffer = null;
let sharedView = null;
let dataStore = new Map();
let subscriptions = new Map();
let transactionLog = [];

// Performance metrics
const metrics = {
    operations: 0,
    reads: 0,
    writes: 0,
    transactions: 0,
    cacheHits: 0,
    avgOperationTime: 0,
    dataSize: 0
};

/**
 * Initialize worker
 */
function initialize(data) {
    workerId = data.workerId;
    
    if (data.sharedBuffer) {
        sharedBuffer = data.sharedBuffer;
        sharedView = new Int32Array(sharedBuffer);
        
        // Initialize shared state area
        initializeSharedState();
    }
    
    self.postMessage({ type: 'READY', workerId });
}

/**
 * Initialize shared state management
 */
function initializeSharedState() {
    // Reserve first 1024 bytes for metadata
    // Layout:
    // [0-3]: Version number
    // [4-7]: Last update timestamp
    // [8-11]: Operation counter
    // [12-15]: Lock status
    // [16-1023]: Reserved for future use
    
    Atomics.store(sharedView, 0, 1); // Version
    Atomics.store(sharedView, 1, Date.now()); // Timestamp
    Atomics.store(sharedView, 2, 0); // Operation counter
    Atomics.store(sharedView, 3, 0); // Lock (0 = unlocked)
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
                const result = await processDataTask(data);
                self.postMessage({
                    type: 'RESULT',
                    taskId,
                    result,
                    workerId,
                    metrics
                });
                break;

            case 'SUBSCRIBE':
                handleSubscription(data);
                break;

            case 'UNSUBSCRIBE':
                handleUnsubscription(data);
                break;

            case 'HEALTH_CHECK':
                self.postMessage({ 
                    type: 'HEALTH_RESPONSE', 
                    workerId,
                    metrics,
                    storeSize: dataStore.size,
                    subscriptions: subscriptions.size,
                    transactionLogSize: transactionLog.length
                });
                break;

            case 'CLEAR_CACHE':
                dataStore.clear();
                transactionLog = [];
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
 * Process data task
 */
async function processDataTask(data) {
    const { operation, params } = data;
    const startTime = performance.now();
    
    metrics.operations++;

    switch (operation) {
        case 'GET':
            return getData(params);
            
        case 'SET':
            return setData(params);
            
        case 'UPDATE':
            return updateData(params);
            
        case 'DELETE':
            return deleteData(params);
            
        case 'TRANSACTION':
            return executeTransaction(params);
            
        case 'QUERY':
            return queryData(params);
            
        case 'SYNC':
            return syncData(params);
            
        case 'AGGREGATE':
            return aggregateData(params);
            
        case 'BATCH':
            return batchOperations(params);
            
        case 'STREAM':
            return streamData(params);
            
        default:
            throw new Error(`Unknown data operation: ${operation}`);
    }
}

/**
 * Get data by key
 */
function getData(params) {
    const { key, options = {} } = params;
    const startTime = performance.now();
    
    metrics.reads++;
    
    // Check local cache first
    if (dataStore.has(key)) {
        metrics.cacheHits++;
        const data = dataStore.get(key);
        
        const operationTime = performance.now() - startTime;
        updateOperationMetrics(operationTime);
        
        return {
            data,
            metadata: {
                cached: true,
                timestamp: data._timestamp || Date.now(),
                version: data._version || 1
            },
            stats: {
                operationTime
            }
        };
    }
    
    // Check shared memory if available
    if (options.useShared && sharedBuffer) {
        const sharedData = readFromSharedMemory(key);
        if (sharedData !== null) {
            // Cache locally
            dataStore.set(key, sharedData);
            
            const operationTime = performance.now() - startTime;
            updateOperationMetrics(operationTime);
            
            return {
                data: sharedData,
                metadata: {
                    cached: false,
                    source: 'shared',
                    timestamp: Date.now()
                },
                stats: {
                    operationTime
                }
            };
        }
    }
    
    // Not found
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    
    return {
        data: null,
        metadata: {
            found: false
        },
        stats: {
            operationTime
        }
    };
}

/**
 * Set data
 */
function setData(params) {
    const { key, value, options = {} } = params;
    const startTime = performance.now();
    
    metrics.writes++;
    
    // Add metadata
    const data = {
        ...value,
        _timestamp: Date.now(),
        _version: 1,
        _checksum: calculateChecksum(value)
    };
    
    // Store locally
    dataStore.set(key, data);
    
    // Write to shared memory if requested
    if (options.useShared && sharedBuffer) {
        writeToSharedMemory(key, data);
    }
    
    // Log transaction
    if (options.log !== false) {
        logTransaction({
            type: 'SET',
            key,
            timestamp: data._timestamp,
            size: JSON.stringify(value).length
        });
    }
    
    // Notify subscribers
    notifySubscribers(key, {
        type: 'set',
        key,
        value: data,
        timestamp: data._timestamp
    });
    
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    updateDataSize();
    
    return {
        success: true,
        metadata: {
            timestamp: data._timestamp,
            version: data._version,
            checksum: data._checksum
        },
        stats: {
            operationTime,
            dataSize: JSON.stringify(value).length
        }
    };
}

/**
 * Update data (partial update)
 */
function updateData(params) {
    const { key, updates, options = {} } = params;
    const startTime = performance.now();
    
    metrics.writes++;
    
    // Get existing data
    const existing = dataStore.get(key);
    if (!existing) {
        throw new Error(`Key not found: ${key}`);
    }
    
    // Apply updates
    const updated = {
        ...existing,
        ...updates,
        _timestamp: Date.now(),
        _version: (existing._version || 0) + 1
    };
    
    // Recalculate checksum
    updated._checksum = calculateChecksum(updated);
    
    // Optimistic locking check
    if (options.version && existing._version !== options.version) {
        throw new Error(`Version mismatch. Expected ${options.version}, got ${existing._version}`);
    }
    
    // Store updated data
    dataStore.set(key, updated);
    
    // Write to shared memory if requested
    if (options.useShared && sharedBuffer) {
        writeToSharedMemory(key, updated);
    }
    
    // Log transaction
    if (options.log !== false) {
        logTransaction({
            type: 'UPDATE',
            key,
            updates: Object.keys(updates),
            timestamp: updated._timestamp,
            version: updated._version
        });
    }
    
    // Notify subscribers
    notifySubscribers(key, {
        type: 'update',
        key,
        updates,
        value: updated,
        previousVersion: existing._version,
        timestamp: updated._timestamp
    });
    
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    
    return {
        success: true,
        metadata: {
            timestamp: updated._timestamp,
            version: updated._version,
            checksum: updated._checksum,
            previousVersion: existing._version
        },
        stats: {
            operationTime,
            fieldsUpdated: Object.keys(updates).length
        }
    };
}

/**
 * Delete data
 */
function deleteData(params) {
    const { key, options = {} } = params;
    const startTime = performance.now();
    
    const existing = dataStore.get(key);
    if (!existing && !options.force) {
        throw new Error(`Key not found: ${key}`);
    }
    
    // Delete from store
    dataStore.delete(key);
    
    // Delete from shared memory if requested
    if (options.useShared && sharedBuffer) {
        deleteFromSharedMemory(key);
    }
    
    // Log transaction
    if (options.log !== false) {
        logTransaction({
            type: 'DELETE',
            key,
            timestamp: Date.now()
        });
    }
    
    // Notify subscribers
    notifySubscribers(key, {
        type: 'delete',
        key,
        timestamp: Date.now()
    });
    
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    updateDataSize();
    
    return {
        success: true,
        deleted: existing !== undefined,
        stats: {
            operationTime
        }
    };
}

/**
 * Execute transaction
 */
async function executeTransaction(params) {
    const { operations, options = {} } = params;
    const startTime = performance.now();
    
    metrics.transactions++;
    
    // Create transaction context
    const transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        operations: [],
        rollback: [],
        timestamp: Date.now()
    };
    
    // Lock if using shared memory
    if (options.useShared && sharedBuffer) {
        acquireLock();
    }
    
    try {
        // Execute operations
        for (const op of operations) {
            const rollbackOp = createRollbackOperation(op);
            transaction.rollback.push(rollbackOp);
            
            const result = await processDataTask({
                operation: op.type,
                params: op.params
            });
            
            transaction.operations.push({
                ...op,
                result
            });
        }
        
        // Commit transaction
        if (options.log !== false) {
            logTransaction({
                type: 'TRANSACTION',
                id: transaction.id,
                operations: operations.length,
                timestamp: transaction.timestamp,
                status: 'committed'
            });
        }
        
        const operationTime = performance.now() - startTime;
        updateOperationMetrics(operationTime);
        
        return {
            success: true,
            transactionId: transaction.id,
            results: transaction.operations.map(op => op.result),
            stats: {
                operationTime,
                operationCount: operations.length
            }
        };
        
    } catch (error) {
        // Rollback on error
        for (const rollbackOp of transaction.rollback.reverse()) {
            try {
                await processDataTask(rollbackOp);
            } catch (rollbackError) {
                }
        }
        
        if (options.log !== false) {
            logTransaction({
                type: 'TRANSACTION',
                id: transaction.id,
                operations: operations.length,
                timestamp: transaction.timestamp,
                status: 'rolled_back',
                error: error.message
            });
        }
        
        throw error;
        
    } finally {
        // Release lock
        if (options.useShared && sharedBuffer) {
            releaseLock();
        }
    }
}

/**
 * Query data
 */
function queryData(params) {
    const { filter, sort, limit, offset = 0, projection } = params;
    const startTime = performance.now();
    
    let results = [];
    
    // Apply filter
    for (const [key, value] of dataStore) {
        if (!filter || matchesFilter(value, filter)) {
            results.push({ key, ...value });
        }
    }
    
    // Apply sort
    if (sort) {
        results.sort((a, b) => {
            for (const [field, order] of Object.entries(sort)) {
                const aVal = a[field];
                const bVal = b[field];
                
                if (aVal < bVal) return order === 'asc' ? -1 : 1;
                if (aVal > bVal) return order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
    
    // Apply pagination
    const total = results.length;
    if (limit) {
        results = results.slice(offset, offset + limit);
    }
    
    // Apply projection
    if (projection) {
        results = results.map(item => {
            const projected = { key: item.key };
            for (const field of projection) {
                if (field in item) {
                    projected[field] = item[field];
                }
            }
            return projected;
        });
    }
    
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    
    return {
        results,
        metadata: {
            total,
            returned: results.length,
            offset,
            hasMore: offset + results.length < total
        },
        stats: {
            operationTime,
            scannedCount: dataStore.size
        }
    };
}

/**
 * Check if value matches filter
 */
function matchesFilter(value, filter) {
    for (const [field, condition] of Object.entries(filter)) {
        const fieldValue = value[field];
        
        if (typeof condition === 'object' && condition !== null) {
            // Complex condition
            for (const [op, expectedValue] of Object.entries(condition)) {
                switch (op) {
                    case '$eq':
                        if (fieldValue !== expectedValue) return false;
                        break;
                    case '$ne':
                        if (fieldValue === expectedValue) return false;
                        break;
                    case '$gt':
                        if (fieldValue <= expectedValue) return false;
                        break;
                    case '$gte':
                        if (fieldValue < expectedValue) return false;
                        break;
                    case '$lt':
                        if (fieldValue >= expectedValue) return false;
                        break;
                    case '$lte':
                        if (fieldValue > expectedValue) return false;
                        break;
                    case '$in':
                        if (!expectedValue.includes(fieldValue)) return false;
                        break;
                    case '$nin':
                        if (expectedValue.includes(fieldValue)) return false;
                        break;
                    case '$regex':
                        if (!new RegExp(expectedValue).test(fieldValue)) return false;
                        break;
                }
            }
        } else {
            // Simple equality
            if (fieldValue !== condition) return false;
        }
    }
    
    return true;
}

/**
 * Sync data with external source
 */
async function syncData(params) {
    const { source, target, options = {} } = params;
    const startTime = performance.now();
    
    const changes = {
        added: 0,
        updated: 0,
        deleted: 0,
        conflicts: []
    };
    
    // Sync from source to target
    if (source === 'local' && target === 'shared') {
        // Push local changes to shared memory
        for (const [key, value] of dataStore) {
            const sharedValue = readFromSharedMemory(key);
            
            if (!sharedValue) {
                writeToSharedMemory(key, value);
                changes.added++;
            } else if (value._timestamp > sharedValue._timestamp) {
                writeToSharedMemory(key, value);
                changes.updated++;
            } else if (value._timestamp < sharedValue._timestamp && options.bidirectional) {
                // Conflict - shared is newer
                changes.conflicts.push({
                    key,
                    localTimestamp: value._timestamp,
                    sharedTimestamp: sharedValue._timestamp
                });
            }
        }
    } else if (source === 'shared' && target === 'local') {
        // Pull shared changes to local
        // This would require iterating shared memory keys
        // For now, simplified implementation
        }
    
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    
    return {
        success: true,
        changes,
        stats: {
            operationTime,
            totalChanges: changes.added + changes.updated + changes.deleted
        }
    };
}

/**
 * Aggregate data
 */
function aggregateData(params) {
    const { groupBy, aggregations, filter } = params;
    const startTime = performance.now();
    
    const groups = new Map();
    
    // Group data
    for (const [key, value] of dataStore) {
        if (!filter || matchesFilter(value, filter)) {
            const groupKey = groupBy ? 
                (typeof groupBy === 'function' ? groupBy(value) : value[groupBy]) : 
                'all';
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(value);
        }
    }
    
    // Apply aggregations
    const results = [];
    
    for (const [groupKey, groupValues] of groups) {
        const result = { _group: groupKey };
        
        for (const [field, agg] of Object.entries(aggregations)) {
            const values = groupValues.map(v => v[agg.field || field]).filter(v => v !== undefined);
            
            switch (agg.type) {
                case 'count':
                    result[field] = values.length;
                    break;
                case 'sum':
                    result[field] = values.reduce((a, b) => a + b, 0);
                    break;
                case 'avg':
                    result[field] = values.length > 0 ? 
                        values.reduce((a, b) => a + b, 0) / values.length : 0;
                    break;
                case 'min':
                    result[field] = values.length > 0 ? Math.min(...values) : null;
                    break;
                case 'max':
                    result[field] = values.length > 0 ? Math.max(...values) : null;
                    break;
                case 'first':
                    result[field] = groupValues[0]?.[agg.field || field];
                    break;
                case 'last':
                    result[field] = groupValues[groupValues.length - 1]?.[agg.field || field];
                    break;
            }
        }
        
        results.push(result);
    }
    
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    
    return {
        results,
        metadata: {
            groupCount: groups.size,
            totalRecords: Array.from(groups.values()).reduce((sum, g) => sum + g.length, 0)
        },
        stats: {
            operationTime,
            scannedCount: dataStore.size
        }
    };
}

/**
 * Batch operations
 */
async function batchOperations(params) {
    const { operations, options = {} } = params;
    const startTime = performance.now();
    
    const results = [];
    const errors = [];
    
    // Process operations in parallel or series
    if (options.parallel) {
        const promises = operations.map(async (op, index) => {
            try {
                const result = await processDataTask({
                    operation: op.type,
                    params: op.params
                });
                results[index] = { success: true, result };
            } catch (error) {
                results[index] = { success: false, error: error.message };
                errors.push({ index, error: error.message });
            }
        });
        
        await Promise.all(promises);
    } else {
        for (let i = 0; i < operations.length; i++) {
            try {
                const result = await processDataTask({
                    operation: operations[i].type,
                    params: operations[i].params
                });
                results.push({ success: true, result });
            } catch (error) {
                results.push({ success: false, error: error.message });
                errors.push({ index: i, error: error.message });
                
                if (!options.continueOnError) {
                    break;
                }
            }
        }
    }
    
    const operationTime = performance.now() - startTime;
    updateOperationMetrics(operationTime);
    
    return {
        results,
        metadata: {
            total: operations.length,
            succeeded: results.filter(r => r.success).length,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined
        },
        stats: {
            operationTime,
            avgOperationTime: operationTime / operations.length
        }
    };
}

/**
 * Stream data changes
 */
function streamData(params) {
    const { keys, filter, options = {} } = params;
    
    // Create stream subscription
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const stream = {
        id: streamId,
        keys: keys || [],
        filter,
        buffer: [],
        active: true
    };
    
    // Subscribe to changes
    const handler = (event) => {
        if (stream.active) {
            if (keys && !keys.includes(event.key)) return;
            if (filter && !matchesFilter(event.value, filter)) return;
            
            stream.buffer.push(event);
            
            // Send batch update
            if (stream.buffer.length >= (options.batchSize || 10)) {
                self.postMessage({
                    type: 'STREAM_DATA',
                    streamId,
                    events: stream.buffer.splice(0, stream.buffer.length)
                });
            }
        }
    };
    
    // Register stream
    subscriptions.set(streamId, { stream, handler });
    
    // Start streaming
    if (options.sendInitial) {
        const initial = [];
        for (const [key, value] of dataStore) {
            if (keys && !keys.includes(key)) continue;
            if (filter && !matchesFilter(value, filter)) continue;
            
            initial.push({
                type: 'initial',
                key,
                value,
                timestamp: Date.now()
            });
        }
        
        self.postMessage({
            type: 'STREAM_DATA',
            streamId,
            events: initial
        });
    }
    
    return {
        streamId,
        active: true
    };
}

/**
 * Handle subscription
 */
function handleSubscription(params) {
    const { key, pattern, handler } = params;
    
    if (!subscriptions.has(key)) {
        subscriptions.set(key, new Set());
    }
    
    subscriptions.get(key).add({ pattern, handler });
}

/**
 * Handle unsubscription
 */
function handleUnsubscription(params) {
    const { key, handler } = params;
    
    if (subscriptions.has(key)) {
        const subs = subscriptions.get(key);
        subs.delete(handler);
        
        if (subs.size === 0) {
            subscriptions.delete(key);
        }
    }
}

/**
 * Notify subscribers of changes
 */
function notifySubscribers(key, event) {
    // Direct key subscribers
    if (subscriptions.has(key)) {
        for (const sub of subscriptions.get(key)) {
            sub.handler(event);
        }
    }
    
    // Pattern subscribers
    for (const [pattern, subs] of subscriptions) {
        if (pattern.includes('*') && matchPattern(key, pattern)) {
            for (const sub of subs) {
                sub.handler(event);
            }
        }
    }
    
    // Stream subscribers
    for (const [streamId, { handler }] of subscriptions) {
        if (streamId.startsWith('stream-')) {
            handler(event);
        }
    }
}

/**
 * Match pattern with wildcards
 */
function matchPattern(str, pattern) {
    const regex = new RegExp('^' + pattern.split('*').map(s => 
        s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('.*') + '$');
    return regex.test(str);
}

/**
 * Create rollback operation
 */
function createRollbackOperation(operation) {
    switch (operation.type) {
        case 'SET':
            return {
                operation: 'DELETE',
                params: { key: operation.params.key }
            };
            
        case 'UPDATE':
            // Would need to store previous value
            return {
                operation: 'SET',
                params: {
                    key: operation.params.key,
                    value: dataStore.get(operation.params.key)
                }
            };
            
        case 'DELETE':
            return {
                operation: 'SET',
                params: {
                    key: operation.params.key,
                    value: dataStore.get(operation.params.key)
                }
            };
            
        default:
            return null;
    }
}

/**
 * Calculate checksum for data integrity
 */
function calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
}

/**
 * Log transaction
 */
function logTransaction(transaction) {
    transactionLog.push(transaction);
    
    // Limit log size
    if (transactionLog.length > 10000) {
        transactionLog.splice(0, 1000);
    }
}

/**
 * Read from shared memory
 */
function readFromSharedMemory(key) {
    // Simplified implementation
    // In real implementation, would need proper memory mapping
    return null;
}

/**
 * Write to shared memory
 */
function writeToSharedMemory(key, value) {
    if (!sharedBuffer) return;
    
    // Update operation counter
    Atomics.add(sharedView, 2, 1);
    
    // Update timestamp
    Atomics.store(sharedView, 1, Date.now());
    
    // In real implementation, would serialize and write to allocated region
}

/**
 * Delete from shared memory
 */
function deleteFromSharedMemory(key) {
    if (!sharedBuffer) return;
    
    // Update operation counter
    Atomics.add(sharedView, 2, 1);
    
    // Update timestamp
    Atomics.store(sharedView, 1, Date.now());
    
    // In real implementation, would mark region as free
}

/**
 * Acquire lock for shared memory
 */
function acquireLock() {
    while (Atomics.compareExchange(sharedView, 3, 0, 1) !== 0) {
        // Wait for lock
        Atomics.wait(sharedView, 3, 1, 100);
    }
}

/**
 * Release lock
 */
function releaseLock() {
    Atomics.store(sharedView, 3, 0);
    Atomics.notify(sharedView, 3, 1);
}

/**
 * Update operation metrics
 */
function updateOperationMetrics(operationTime) {
    const total = metrics.operations;
    metrics.avgOperationTime = (metrics.avgOperationTime * (total - 1) + operationTime) / total;
}

/**
 * Update data size metric
 */
function updateDataSize() {
    let totalSize = 0;
    for (const [key, value] of dataStore) {
        totalSize += key.length + JSON.stringify(value).length;
    }
    metrics.dataSize = totalSize;
}

/**
 * Cleanup worker resources
 */
function cleanup() {
    dataStore.clear();
    subscriptions.clear();
    transactionLog = [];
    }

// Error handling
self.onerror = function(error) {
    self.postMessage({
        type: 'ERROR',
        error: error.message,
        workerId
    });
};

