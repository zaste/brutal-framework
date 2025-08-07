/**
 * BRUTAL V4 - Worker Infrastructure Exports
 * Web Workers support for parallel processing
 */

export { WorkerManager, workerManager } from './WorkerManager.js';
export { WorkerPool } from './WorkerPool.js';
export { WorkerMessage, MessageType, MessageHandlerMixin } from './WorkerMessage.js';
export { WorkerProxy } from './WorkerProxy.js';