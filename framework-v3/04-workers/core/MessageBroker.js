/**
 * @fileoverview BRUTAL MessageBroker - High-performance message passing system
 * @version 1.0.0
 * @license MIT
 */

/**
 * MessageBroker manages inter-worker communication with:
 * - Priority queue system
 * - Message routing and filtering
 * - Retry logic with exponential backoff
 * - Dead letter queue for failed messages
 * - Performance monitoring
 */
export class MessageBroker {
    constructor(config = {}) {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000, // Initial retry delay in ms
            maxQueueSize: 10000,
            deadLetterThreshold: 5, // Failed attempts before dead letter
            enableMetrics: true,
            priorities: {
                CRITICAL: 0,
                HIGH: 1,
                NORMAL: 2,
                LOW: 3,
                IDLE: 4
            },
            ...config
        };

        // Priority queues (lower number = higher priority)
        this.queues = new Map();
        for (const priority of Object.values(this.config.priorities)) {
            this.queues.set(priority, []);
        }

        // Message tracking
        this.messages = new Map();
        this.subscribers = new Map();
        this.deadLetterQueue = [];
        
        // Metrics
        this.metrics = {
            sent: 0,
            delivered: 0,
            failed: 0,
            retried: 0,
            deadLettered: 0,
            avgDeliveryTime: 0,
            queueSizes: new Map()
        };

        this.isProcessing = false;
        this.processInterval = null;
    }

    /**
     * Initialize the message broker
     */
    init() {
        // Start message processing
        this.startProcessing();
        }

    /**
     * Send a message
     */
    send(message, options = {}) {
        const messageId = this.generateId();
        const priority = options.priority || this.config.priorities.NORMAL;
        
        const messageData = {
            id: messageId,
            ...message,
            priority,
            timestamp: Date.now(),
            attempts: 0,
            options
        };

        // Validate queue size
        const queue = this.queues.get(priority);
        if (queue.length >= this.config.maxQueueSize) {
            throw new Error(`Queue full for priority ${priority}`);
        }

        // Store message
        this.messages.set(messageId, messageData);
        
        // Add to priority queue
        queue.push(messageData);
        
        // Update metrics
        if (this.config.enableMetrics) {
            this.metrics.sent++;
            this.updateQueueMetrics();
        }

        // Process immediately if not already processing
        if (!this.isProcessing) {
            this.processMessages();
        }

        return messageId;
    }

    /**
     * Send message and wait for response
     */
    async request(message, options = {}) {
        return new Promise((resolve, reject) => {
            const messageId = this.send(message, options);
            const timeout = options.timeout || 30000;

            // Setup response handler
            const responseHandler = (response) => {
                if (response.correlationId === messageId) {
                    this.unsubscribe(response.type, responseHandler);
                    clearTimeout(timer);
                    resolve(response);
                }
            };

            // Subscribe to response
            this.subscribe(message.responseType || 'response', responseHandler);

            // Setup timeout
            const timer = setTimeout(() => {
                this.unsubscribe(message.responseType || 'response', responseHandler);
                reject(new Error(`Request timeout for message ${messageId}`));
            }, timeout);
        });
    }

    /**
     * Subscribe to message type
     */
    subscribe(type, handler) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set());
        }
        this.subscribers.get(type).add(handler);
    }

    /**
     * Unsubscribe from message type
     */
    unsubscribe(type, handler) {
        if (this.subscribers.has(type)) {
            this.subscribers.get(type).delete(handler);
        }
    }

    /**
     * Process messages from queues
     */
    async processMessages() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Process each priority level
            for (const [priority, queue] of this.queues) {
                while (queue.length > 0) {
                    const message = queue.shift();
                    await this.deliverMessage(message);
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Deliver a message to subscribers
     */
    async deliverMessage(message) {
        const startTime = Date.now();
        message.attempts++;

        try {
            // Get subscribers for message type
            const handlers = this.subscribers.get(message.type);
            if (!handlers || handlers.size === 0) {
                // No subscribers, move to dead letter if configured
                if (message.options.requireDelivery) {
                    this.handleFailedMessage(message, 'No subscribers');
                }
                return;
            }

            // Deliver to all handlers
            const promises = [];
            for (const handler of handlers) {
                promises.push(this.invokeHandler(handler, message));
            }

            await Promise.all(promises);

            // Update metrics
            if (this.config.enableMetrics) {
                const deliveryTime = Date.now() - startTime;
                this.updateDeliveryMetrics(deliveryTime);
            }

            // Remove from tracking
            this.messages.delete(message.id);

        } catch (error) {
            this.handleDeliveryError(message, error);
        }
    }

    /**
     * Invoke a message handler safely
     */
    async invokeHandler(handler, message) {
        try {
            await handler(message);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle delivery error with retry logic
     */
    async handleDeliveryError(message, error) {
        if (message.attempts < this.config.maxRetries) {
            // Retry with exponential backoff
            const delay = this.config.retryDelay * Math.pow(2, message.attempts - 1);
            
            setTimeout(() => {
                const priority = message.priority;
                this.queues.get(priority).push(message);
                this.processMessages();
            }, delay);

            if (this.config.enableMetrics) {
                this.metrics.retried++;
            }
        } else {
            // Max retries exceeded
            this.handleFailedMessage(message, error.message);
        }
    }

    /**
     * Handle failed message (dead letter)
     */
    handleFailedMessage(message, reason) {
        // Add to dead letter queue
        this.deadLetterQueue.push({
            message,
            reason,
            timestamp: Date.now()
        });

        // Remove from tracking
        this.messages.delete(message.id);

        // Update metrics
        if (this.config.enableMetrics) {
            this.metrics.failed++;
            this.metrics.deadLettered++;
        }

        // Emit dead letter event if configured
        if (message.options.onDeadLetter) {
            message.options.onDeadLetter(message, reason);
        }
    }

    /**
     * Broadcast message to all workers
     */
    broadcast(message, options = {}) {
        const broadcastMessage = {
            ...message,
            type: 'broadcast',
            broadcast: true
        };
        return this.send(broadcastMessage, options);
    }

    /**
     * Route message to specific worker
     */
    route(workerId, message, options = {}) {
        const routedMessage = {
            ...message,
            targetWorker: workerId
        };
        return this.send(routedMessage, options);
    }

    /**
     * Create a message channel between workers
     */
    createChannel(name, config = {}) {
        const channel = {
            name,
            id: this.generateId(),
            created: Date.now(),
            config,
            send: (message) => {
                return this.send({
                    ...message,
                    channel: name
                }, config);
            },
            subscribe: (handler) => {
                this.subscribe(`channel:${name}`, handler);
            },
            unsubscribe: (handler) => {
                this.unsubscribe(`channel:${name}`, handler);
            }
        };

        return channel;
    }

    /**
     * Start periodic message processing
     */
    startProcessing() {
        this.processInterval = setInterval(() => {
            this.processMessages();
            this.cleanupDeadLetters();
        }, 100); // Process every 100ms
    }

    /**
     * Cleanup old dead letter messages
     */
    cleanupDeadLetters() {
        const maxAge = 3600000; // 1 hour
        const now = Date.now();
        
        this.deadLetterQueue = this.deadLetterQueue.filter(item => {
            return now - item.timestamp < maxAge;
        });
    }

    /**
     * Update queue size metrics
     */
    updateQueueMetrics() {
        for (const [priority, queue] of this.queues) {
            this.metrics.queueSizes.set(priority, queue.length);
        }
    }

    /**
     * Update delivery time metrics
     */
    updateDeliveryMetrics(deliveryTime) {
        this.metrics.delivered++;
        const total = this.metrics.delivered;
        const currentAvg = this.metrics.avgDeliveryTime;
        this.metrics.avgDeliveryTime = (currentAvg * (total - 1) + deliveryTime) / total;
    }

    /**
     * Generate unique message ID
     */
    generateId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get queue statistics
     */
    getStats() {
        const queueStats = {};
        for (const [priority, queue] of this.queues) {
            queueStats[priority] = queue.length;
        }

        return {
            messages: {
                sent: this.metrics.sent,
                delivered: this.metrics.delivered,
                failed: this.metrics.failed,
                retried: this.metrics.retried,
                deadLettered: this.metrics.deadLettered
            },
            queues: queueStats,
            deadLetterQueue: this.deadLetterQueue.length,
            performance: {
                avgDeliveryTime: this.metrics.avgDeliveryTime.toFixed(2) + 'ms'
            },
            subscribers: Object.fromEntries(
                Array.from(this.subscribers.entries()).map(([type, handlers]) => 
                    [type, handlers.size]
                )
            )
        };
    }

    /**
     * Replay dead letter messages
     */
    replayDeadLetters(filter = null) {
        const toReplay = filter 
            ? this.deadLetterQueue.filter(filter)
            : [...this.deadLetterQueue];

        let replayed = 0;
        for (const item of toReplay) {
            const message = item.message;
            message.attempts = 0; // Reset attempts
            
            this.send(message, message.options);
            replayed++;
        }

        // Remove replayed messages
        this.deadLetterQueue = this.deadLetterQueue.filter(item => 
            !toReplay.includes(item)
        );

        return replayed;
    }

    /**
     * Clear all queues
     */
    clear() {
        for (const queue of this.queues.values()) {
            queue.length = 0;
        }
        this.messages.clear();
        this.deadLetterQueue = [];
        
        if (this.config.enableMetrics) {
            this.metrics = {
                sent: 0,
                delivered: 0,
                failed: 0,
                retried: 0,
                deadLettered: 0,
                avgDeliveryTime: 0,
                queueSizes: new Map()
            };
        }
    }

    /**
     * Destroy the message broker
     */
    destroy() {
        if (this.processInterval) {
            clearInterval(this.processInterval);
        }

        this.clear();
        this.subscribers.clear();
        
        }
}