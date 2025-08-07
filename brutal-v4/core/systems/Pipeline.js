/**
 * BRUTAL V4 - Pipeline System
 * Middleware pipeline for critical paths
 * Handles request/response, state mutations, and routing
 */

import { HookSystem } from './HookSystem.js';

const pipelineRegistry = new Map();

export class Pipeline {
    constructor(name) {
        this.name = name;
        this.stages = [];
        this.errorHandlers = [];
        this.hookSystem = new HookSystem(`pipeline:${name}`);
        this.metrics = {
            totalRuns: 0,
            totalErrors: 0,
            averageTime: 0,
            stageMetrics: new Map()
        };
    }

    /**
     * Add middleware stage
     */
    use(middleware, options = {}) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }

        const stage = {
            name: options.name || middleware.name || 'anonymous',
            handler: middleware,
            skipOn: options.skipOn || null,
            runOn: options.runOn || null,
            async: options.async !== false,
            timeout: options.timeout || 0,
            retries: options.retries || 0,
            id: Symbol('stage')
        };

        this.stages.push(stage);
        return this;
    }

    /**
     * Add error handler
     */
    catch(handler, options = {}) {
        this.errorHandlers.push({
            handler,
            types: options.types || [],
            id: Symbol('error-handler')
        });
        return this;
    }

    /**
     * Execute pipeline
     */
    async execute(context = {}, input) {
        const startTime = performance.now();
        let result = input;
        
        // Create pipeline context
        const pipelineContext = {
            ...context,
            pipeline: this.name,
            stages: [],
            errors: [],
            startTime
        };

        try {
            // Execute before hooks
            await this.hookSystem.execute('before', pipelineContext, result);

            // Execute stages
            for (const stage of this.stages) {
                result = await this._executeStage(stage, pipelineContext, result);
            }

            // Execute after hooks
            await this.hookSystem.execute('after', pipelineContext, result);

            // Update metrics
            this._updateMetrics(performance.now() - startTime, false);

            return result;

        } catch (error) {
            // Handle error
            const handled = await this._handleError(error, pipelineContext, result);
            
            if (!handled) {
                this._updateMetrics(performance.now() - startTime, true);
                throw error;
            }

            return handled;
        }
    }

    /**
     * Execute single stage
     */
    async _executeStage(stage, context, input) {
        // Check conditions
        if (stage.skipOn && stage.skipOn(context, input)) {
            return input;
        }

        if (stage.runOn && !stage.runOn(context, input)) {
            return input;
        }

        const stageStartTime = performance.now();
        let attempts = 0;
        let lastError;

        // Retry logic
        while (attempts <= stage.retries) {
            try {
                attempts++;

                // Execute with timeout if specified
                const result = stage.timeout > 0
                    ? await this._executeWithTimeout(stage, context, input)
                    : await this._executeHandler(stage, context, input);

                // Update stage metrics
                this._updateStageMetrics(stage.name, performance.now() - stageStartTime, false);

                // Record stage execution
                context.stages.push({
                    name: stage.name,
                    duration: performance.now() - stageStartTime,
                    attempts
                });

                return result;

            } catch (error) {
                lastError = error;
                
                if (attempts > stage.retries) {
                    this._updateStageMetrics(stage.name, performance.now() - stageStartTime, true);
                    throw error;
                }

                // Wait before retry
                if (stage.retries > 0) {
                    await new Promise(resolve => 
                        setTimeout(resolve, Math.pow(2, attempts - 1) * 100)
                    );
                }
            }
        }

        throw lastError;
    }

    /**
     * Execute handler with timeout
     */
    async _executeWithTimeout(stage, context, input) {
        return Promise.race([
            this._executeHandler(stage, context, input),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Stage '${stage.name}' timed out`)), stage.timeout)
            )
        ]);
    }

    /**
     * Execute handler
     */
    async _executeHandler(stage, context, input) {
        if (stage.async) {
            return await stage.handler(input, context);
        } else {
            return stage.handler(input, context);
        }
    }

    /**
     * Handle pipeline error
     */
    async _handleError(error, context, input) {
        context.errors.push(error);

        // Try error handlers
        for (const errorHandler of this.errorHandlers) {
            // Check error type match
            if (errorHandler.types.length > 0) {
                const matches = errorHandler.types.some(type => 
                    error instanceof type || error.name === type
                );
                if (!matches) continue;
            }

            try {
                const result = await errorHandler.handler(error, context, input);
                if (result !== undefined) {
                    return result;
                }
            } catch (handlerError) {
                console.error('Error handler failed:', handlerError);
            }
        }

        // Execute error hooks
        const hookResults = await this.hookSystem.execute('error', context, error, input);
        
        // Check if any hook handled the error
        for (const result of hookResults) {
            if (result !== undefined) {
                return result;
            }
        }

        return null;
    }

    /**
     * Update metrics
     */
    _updateMetrics(duration, isError) {
        this.metrics.totalRuns++;
        if (isError) {
            this.metrics.totalErrors++;
        }

        // Update average time
        const prevAvg = this.metrics.averageTime;
        const prevTotal = this.metrics.totalRuns - 1;
        this.metrics.averageTime = (prevAvg * prevTotal + duration) / this.metrics.totalRuns;
    }

    /**
     * Update stage metrics
     */
    _updateStageMetrics(stageName, duration, isError) {
        if (!this.metrics.stageMetrics.has(stageName)) {
            this.metrics.stageMetrics.set(stageName, {
                runs: 0,
                errors: 0,
                averageTime: 0
            });
        }

        const metrics = this.metrics.stageMetrics.get(stageName);
        metrics.runs++;
        if (isError) {
            metrics.errors++;
        }

        // Update average
        const prevAvg = metrics.averageTime;
        const prevTotal = metrics.runs - 1;
        metrics.averageTime = (prevAvg * prevTotal + duration) / metrics.runs;
    }

    /**
     * Get pipeline statistics
     */
    getStats() {
        return {
            name: this.name,
            stages: this.stages.length,
            errorHandlers: this.errorHandlers.length,
            metrics: {
                ...this.metrics,
                stageMetrics: Array.from(this.metrics.stageMetrics.entries()).map(([name, metrics]) => ({
                    name,
                    ...metrics
                }))
            }
        };
    }

    /**
     * Clear pipeline
     */
    clear() {
        this.stages = [];
        this.errorHandlers = [];
        this.hookSystem.clear();
    }
}

/**
 * Create pipeline
 */
export function createPipeline(name) {
    if (pipelineRegistry.has(name)) {
        return pipelineRegistry.get(name);
    }

    const pipeline = new Pipeline(name);
    pipelineRegistry.set(name, pipeline);
    return pipeline;
}

/**
 * Get pipeline
 */
export function getPipeline(name) {
    return pipelineRegistry.get(name);
}

/**
 * Common pipeline middlewares
 */
export const Middlewares = {
    // Logging middleware
    logger: (options = {}) => {
        return async (input, context) => {
            const { level = 'info', prefix = '' } = options;
            console[level](`${prefix}[${context.pipeline}]`, input);
            return input;
        };
    },

    // Validation middleware
    validate: (schema) => {
        return async (input, context) => {
            // Simple validation example
            for (const [key, validator] of Object.entries(schema)) {
                if (!validator(input[key])) {
                    throw new Error(`Validation failed for ${key}`);
                }
            }
            return input;
        };
    },

    // Transform middleware
    transform: (transformer) => {
        return async (input, context) => {
            return transformer(input, context);
        };
    },

    // Cache middleware
    cache: (cacheManager, options = {}) => {
        return async (input, context) => {
            const { keyFn = JSON.stringify, ttl = 300000 } = options;
            const key = keyFn(input);

            const cached = cacheManager.get(key);
            if (cached) {
                context.cached = true;
                return cached;
            }

            // Continue pipeline and cache result
            return input;
        };
    }
};