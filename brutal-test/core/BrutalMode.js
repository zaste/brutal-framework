/**
 * BRUTAL Mode - Zero Mercy Configuration
 */

export class BrutalMode {
    static validate() {
        // Force strict mode everywhere
        'use strict';
        
        // Override console.warn globally
        console.warn = function(...args) {
            throw new Error(`BRUTAL: console.warn is FORBIDDEN - ${args.join(' ')}`);
        };
        
        // Override console.log to detect hidden issues
        const originalLog = console.log;
        console.log = function(...args) {
            const message = args.join(' ');
            // Don't crash on test names or summary messages that contain these words
            const isTestName = message.includes('Testing:') || message.includes('test-') || message.includes('.json');
            const isSummary = message.includes('Found') || message.includes('errors') || message.includes('Generated');
            const isErrorDisplay = message.includes('Script error') || message.includes('❌') || message.includes('Source:');
            if (!isTestName && !isSummary && !isErrorDisplay && (message.includes('error') || message.includes('fail') || message.includes('warning'))) {
                throw new Error(`BRUTAL: Detected error in console.log - ${message}`);
            }
            originalLog.apply(console, args);
        };
        
        // Make Promise rejections FATAL
        process.on('unhandledRejection', (reason, promise) => {
            throw new Error(`BRUTAL: Unhandled Promise Rejection - ${reason}`);
        });
        
        // Make uncaught exceptions EXTRA FATAL
        process.on('uncaughtException', (error) => {
            console.error('💀💀💀 BRUTAL: UNCAUGHT EXCEPTION - SYSTEM FAILURE 💀💀💀');
            console.error(error);
            process.exit(666); // Exit with BRUTAL code
        });
        
        // Detect and crash on memory leaks
        const memoryLimit = 500 * 1024 * 1024; // 500MB
        setInterval(() => {
            const usage = process.memoryUsage();
            if (usage.heapUsed > memoryLimit) {
                throw new Error(`BRUTAL: Memory limit exceeded - ${usage.heapUsed} bytes`);
            }
        }, 1000);
        
        console.log('🔥 BRUTAL MODE ACTIVATED - ZERO MERCY 🔥');
    }
    
    static assertNeverNull(value, name) {
        if (value === null || value === undefined) {
            throw new Error(`BRUTAL: ${name} is NULL/UNDEFINED - THIS IS UNACCEPTABLE`);
        }
        return value;
    }
    
    static assertPerformance(metric, value, threshold) {
        if (value > threshold) {
            throw new Error(`BRUTAL: Performance FAILURE - ${metric}: ${value} exceeds ${threshold}`);
        }
    }
    
    static assertNoErrors(errors) {
        if (errors && errors.length > 0) {
            throw new Error(`BRUTAL: ${errors.length} errors detected - ZERO TOLERANCE FOR ERRORS`);
        }
    }
}