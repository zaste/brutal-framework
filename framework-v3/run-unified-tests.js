#!/usr/bin/env node

/**
 * BRUTAL V3 - Unified Test Runner
 * Leverages ConsolidatedTestSystem for comprehensive testing
 */

import { unifiedTestSystem } from './test/UnifiedTestSystem.js';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import http from 'http';

);

/**
 * Check if server is running
 */
async function checkServer(port = 8080) {
    return new Promise((resolve) => {
        const options = {
            host: 'localhost',
            port: port,
            timeout: 2000,
            path: '/'
        };

        const req = http.get(options, (res) => {
            resolve(true);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.abort();
            resolve(false);
        });
    });
}

/**
 * Find test files based on pattern
 */
async function findTestFiles() {
    const testFiles = [];
    
    // Look for HTML test files
    const files = await readdir('.');
    const htmlFiles = files.filter(f => f.endsWith('.html') && 
        (f.includes('test') || f.includes('demo') || f.includes('example')));
    
    // Look for component test files
    const componentDirs = ['04-components'];
    for (const dir of componentDirs) {
        if (existsSync(dir)) {
            const componentFiles = await readdir(dir, { withFileTypes: true });
            for (const file of componentFiles) {
                if (file.isDirectory()) {
                    const subFiles = await readdir(`${dir}/${file.name}`);
                    const testHtmls = subFiles.filter(f => f.endsWith('.html'));
                    testFiles.push(...testHtmls.map(f => `${dir}/${file.name}/${f}`));
                }
            }
        }
    }
    
    return [...new Set([...htmlFiles, ...testFiles])];
}

/**
 * Main test runner
 */
async function runTests() {
    try {
        // Check server
        const serverRunning = await checkServer();
        
        if (!serverRunning) {
            process.exit(1);
        }
        
        // Find test files
        const testFiles = await findTestFiles();
        if (testFiles.length === 0) {
            return;
        }
        
        // Initialize test system
        await unifiedTestSystem.initialize({
            headless: process.env.HEADLESS !== 'false',
            devtools: process.env.DEVTOOLS === 'true'
        });
        
        // Configure test types based on environment
        if (process.env.QUICK_TEST === 'true') {
            unifiedTestSystem._config.tests = {
                unit: true,
                integration: true,
                visual: false,
                performance: true,
                accessibility: false,
                gpu: false,
                gestures: false,
                workers: false,
                realBrowser: true
            };
        }
        
        // Run test suite
        const results = await unifiedTestSystem.runTestSuite(testFiles);
        
        // Cleanup
        await unifiedTestSystem.cleanup();
        
        // Exit with appropriate code
        process.exit(results.summary.failed > 0 ? 1 : 0);
        
    } catch (error) {
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    await unifiedTestSystem.cleanup();
    process.exit(1);
});

process.on('unhandledRejection', async (error) => {
    await unifiedTestSystem.cleanup();
    process.exit(1);
});

// Run tests
runTests();