/**
 * BRUTAL V4 - Worker Proxy
 * Simplified interface for worker communication
 */

import { WorkerMessage, MessageType } from './WorkerMessage.js';
import { devLog, devError } from '../../build/env.js';

/**
 * WorkerProxy - Provides a clean interface for worker communication
 */
export class WorkerProxy {
    constructor(worker) {
        this.worker = worker;
        this.pendingTasks = new Map();
        this.eventHandlers = new Map();
        this.isReady = false;
        
        this.setupMessageHandler();
        this.waitForReady();
    }
    
    /**
     * Setup message handler
     */
    setupMessageHandler() {
        this.worker.addEventListener('message', (event) => {
            const message = WorkerMessage.deserialize(event.data);
            
            switch (message.type) {
                case MessageType.READY:
                    this.handleReady();
                    break;
                    
                case MessageType.RESULT:
                case MessageType.ERROR:
                    this.handleTaskResponse(message);
                    break;
                    
                case MessageType.EVENT:
                    this.handleEvent(message);
                    break;
                    
                case MessageType.PONG:
                    this.handlePong(message);
                    break;
                    
                default:
                    devLog(`Unknown message type: ${message.type}`);
            }
        });
        
        this.worker.addEventListener('error', (error) => {
            devError('Worker error:', error);
            this.rejectAllPending(error);
        });
    }
    
    /**
     * Wait for worker to be ready
     */
    async waitForReady() {
        return new Promise((resolve) => {
            if (this.isReady) {
                resolve();
                return;
            }
            
            const checkReady = () => {
                if (this.isReady) {
                    resolve();
                } else {
                    setTimeout(checkReady, 10);
                }
            };
            
            checkReady();
        });
    }
    
    /**
     * Handle ready message
     */
    handleReady() {
        this.isReady = true;
        devLog('Worker is ready');
    }
    
    /**
     * Handle task response
     */
    handleTaskResponse(message) {
        const responseId = message.metadata.responseId;
        const pending = this.pendingTasks.get(responseId);
        
        if (!pending) {
            devError(`No pending task for response: ${responseId}`);
            return;
        }
        
        clearTimeout(pending.timeoutId);
        this.pendingTasks.delete(responseId);
        
        if (message.type === MessageType.ERROR) {
            const error = new Error(message.data.error.message);
            error.stack = message.data.error.stack;
            error.name = message.data.error.name;
            pending.reject(error);
        } else {
            pending.resolve(message.data.result);
        }
    }
    
    /**
     * Handle event from worker
     */
    handleEvent(message) {
        const { name, data } = message.data;
        const handlers = this.eventHandlers.get(name);
        
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    devError(`Event handler error for '${name}':`, error);
                }
            });
        }
    }
    
    /**
     * Handle pong response
     */
    handlePong(message) {
        const pending = this.pendingTasks.get(message.metadata.responseId);
        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingTasks.delete(message.metadata.responseId);
            pending.resolve(message.data);
        }
    }
    
    /**
     * Execute task on worker
     */
    async execute(task, data, options = {}) {
        await this.waitForReady();
        
        const message = WorkerMessage.execute(task, data, options.transferables);
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.pendingTasks.delete(message.id);
                reject(new Error(`Task timeout: ${task}`));
            }, options.timeout || 30000);
            
            this.pendingTasks.set(message.id, {
                resolve,
                reject,
                timeoutId,
                task
            });
            
            const transferables = options.transferables || [];
            this.worker.postMessage(message.serialize(), transferables);
        });
    }
    
    /**
     * Post message to worker
     */
    postMessage(message, transferables = []) {
        this.worker.postMessage(message, transferables);
    }
    
    /**
     * Add event listener
     */
    addEventListener(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, new Set());
        }
        
        this.eventHandlers.get(eventName).add(handler);
        
        // Return unsubscribe function
        return () => {
            const handlers = this.eventHandlers.get(eventName);
            if (handlers) {
                handlers.delete(handler);
            }
        };
    }
    
    /**
     * Remove event listener
     */
    removeEventListener(eventName, handler) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    
    /**
     * Ping worker
     */
    async ping() {
        const message = new WorkerMessage(MessageType.PING);
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.pendingTasks.delete(message.id);
                reject(new Error('Ping timeout'));
            }, 1000);
            
            this.pendingTasks.set(message.id, {
                resolve,
                reject,
                timeoutId
            });
            
            this.worker.postMessage(message.serialize());
        });
    }
    
    /**
     * Terminate worker
     */
    terminate() {
        // Send terminate message
        const message = WorkerMessage.status(MessageType.TERMINATE);
        this.worker.postMessage(message.serialize());
        
        // Give worker time to cleanup
        setTimeout(() => {
            this.worker.terminate();
            this.rejectAllPending(new Error('Worker terminated'));
        }, 100);
    }
    
    /**
     * Reject all pending tasks
     */
    rejectAllPending(error) {
        for (const [id, pending] of this.pendingTasks) {
            clearTimeout(pending.timeoutId);
            pending.reject(error);
        }
        this.pendingTasks.clear();
    }
}