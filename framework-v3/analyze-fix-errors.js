#!/usr/bin/env node

/**
 * BRUTAL V3 - Error Analysis & Fix System
 * Analyzes all test results and provides fixes
 */

import { promises as fs } from 'fs';
import path from 'path';

async function analyzeErrors() {
    const outputDir = './test-output';
    const dirs = await fs.readdir(outputDir);
    
    // Pattern analysis
    const errorPatterns = {
        router404: [],
        nullReference: [],
        gpuFallback: [],
        stateErrors: [],
        visualDebug: [],
        other: []
    };
    
    // Analyze each test result
    for (const dir of dirs) {
        if (dir.includes('-')) {
            const testResultPath = path.join(outputDir, dir, 'test-results.json');
            try {
                const data = JSON.parse(await fs.readFile(testResultPath, 'utf8'));
                
                // Categorize errors
                if (data.errors) {
                    data.errors.forEach(error => {
                        const msg = error.message || error.text || '';
                        
                        if (msg.includes('404: Route not found')) {
                            errorPatterns.router404.push({ file: data.file, error });
                        } else if (msg.includes('Cannot read properties of null') || msg.includes('Cannot read properties of undefined')) {
                            errorPatterns.nullReference.push({ file: data.file, error, stack: error.stack });
                        } else if (msg.includes('GPU initialization failed')) {
                            errorPatterns.gpuFallback.push({ file: data.file, error });
                        } else if (msg.includes('getBoundingClientRect')) {
                            errorPatterns.visualDebug.push({ file: data.file, error });
                        } else {
                            errorPatterns.other.push({ file: data.file, error });
                        }
                    });
                }
            } catch (e) {
                // Skip invalid files
            }
        }
    }
    
    // Generate report
    );
    
    `);
    `);
    if (errorPatterns.nullReference.length > 0) {
        const unique = new Set();
        errorPatterns.nullReference.forEach(e => {
            if (e.stack && e.stack.includes('.js')) {
                const match = e.stack.match(/([^\/]+\.js):(\d+):(\d+)/);
                if (match) unique.add(`${match[1]}:${match[2]}`);
            }
        });
        unique.forEach(loc => );
        }
    
    `);
    `);
    // Generate fixes
    // Fix 1: Visual Debug null checks
    const visualDebugFix = `
// Add to DataFlowRenderer.js at line 43
const sourceEl = document.querySelector(\`[data-component-id="\${source}"]\`);
const targetEl = document.querySelector(\`[data-component-id="\${target}"]\`);

if (!sourceEl || !targetEl) {
    return; // Skip if elements not found
}

const sourceRect = sourceEl.getBoundingClientRect();
const targetRect = targetEl.getBoundingClientRect();
`;
    
    // Summary
    `);
    `);
    `);
    `);
    
    // Priority fixes
    return errorPatterns;
}

analyzeErrors().catch(console.error);