/**
 * BRUTAL V4 - Worker Message Protocol
 * Standardized message format for worker communication
 */

/**
 * Message types
 */
export const MessageType = {
    // Task execution
    EXECUTE: 'execute',
    RESULT: 'result',
    ERROR: 'error',
    
    // Status
    READY: 'ready',
    BUSY: 'busy',
    IDLE: 'idle',
    
    // Control
    TERMINATE: 'terminate',
    PING: 'ping',
    PONG: 'pong',
    
    // Data transfer
    TRANSFER: 'transfer',
    SHARED: 'shared',
    
    // Events
    EVENT: 'event',
    BROADCAST: 'broadcast'
};

/**
 * WorkerMessage - Standardized message format
 */
export class WorkerMessage {
    constructor(type, data = null, metadata = {}) {
        this.id = WorkerMessage.generateId();
        this.type = type;
        this.data = data;
        this.metadata = {
            timestamp: Date.now(),
            ...metadata
        };
    }
    
    /**
     * Generate unique message ID
     */
    static generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Create execute message
     */
    static execute(task, data, transferables = []) {
        return new WorkerMessage(MessageType.EXECUTE, {
            task,
            data,
            transferables
        });
    }
    
    /**
     * Create result message
     */
    static result(id, result, transferables = []) {
        return new WorkerMessage(MessageType.RESULT, {
            result,
            transferables
        }, { responseId: id });
    }
    
    /**
     * Create error message
     */
    static error(id, error) {
        return new WorkerMessage(MessageType.ERROR, {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        }, { responseId: id });
    }
    
    /**
     * Create status message
     */
    static status(status) {
        return new WorkerMessage(status);
    }
    
    /**
     * Create event message
     */
    static event(eventName, eventData) {
        return new WorkerMessage(MessageType.EVENT, {
            name: eventName,
            data: eventData
        });
    }
    
    /**
     * Create transfer message
     */
    static transfer(data, transferables) {
        return new WorkerMessage(MessageType.TRANSFER, {
            data,
            transferables
        });
    }
    
    /**
     * Serialize message for transfer
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            data: this.data,
            metadata: this.metadata
        };
    }
    
    /**
     * Deserialize message from transfer
     */
    static deserialize(obj) {
        const message = new WorkerMessage(obj.type, obj.data, obj.metadata);
        message.id = obj.id;
        return message;
    }
    
    /**
     * Check if message is a response to another
     */
    isResponseTo(messageId) {
        return this.metadata.responseId === messageId;
    }
    
    /**
     * Get transferable objects from message
     */
    getTransferables() {
        if (this.data && this.data.transferables) {
            return this.data.transferables;
        }
        return [];
    }
}

/**
 * Message handler mixin for workers
 */
export const MessageHandlerMixin = {
    /**
     * Setup message handling
     */
    setupMessageHandling() {
        this.messageHandlers = new Map();
        this.pendingResponses = new Map();
        
        // Default handlers
        this.registerHandler(MessageType.PING, () => {
            return { pong: true, timestamp: Date.now() };
        });
        
        this.registerHandler(MessageType.TERMINATE, () => {
            this.cleanup?.();
            self.close();
        });
    },
    
    /**
     * Register message handler
     */
    registerHandler(type, handler) {
        this.messageHandlers.set(type, handler);
    },
    
    /**
     * Handle incoming message
     */
    async handleMessage(event) {
        const message = WorkerMessage.deserialize(event.data);
        
        try {
            const handler = this.messageHandlers.get(message.type);
            if (!handler) {
                throw new Error(`No handler for message type: ${message.type}`);
            }
            
            const result = await handler.call(this, message.data, message);
            
            // Send response
            if (message.type === MessageType.EXECUTE) {
                const response = WorkerMessage.result(message.id, result);
                this.postMessage(response.serialize());
            }
            
        } catch (error) {
            const errorResponse = WorkerMessage.error(message.id, error);
            this.postMessage(errorResponse.serialize());
        }
    },
    
    /**
     * Send message and wait for response
     */
    async sendAndWait(message, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.pendingResponses.delete(message.id);
                reject(new Error(`Message timeout: ${message.id}`));
            }, timeout);
            
            this.pendingResponses.set(message.id, {
                resolve,
                reject,
                timeoutId
            });
            
            this.postMessage(message.serialize());
        });
    },
    
    /**
     * Handle response message
     */
    handleResponse(message) {
        const pending = this.pendingResponses.get(message.metadata.responseId);
        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingResponses.delete(message.metadata.responseId);
            
            if (message.type === MessageType.ERROR) {
                const error = new Error(message.data.error.message);
                error.stack = message.data.error.stack;
                error.name = message.data.error.name;
                pending.reject(error);
            } else {
                pending.resolve(message.data.result);
            }
        }
    }
};