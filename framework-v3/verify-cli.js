#!/usr/bin/env node

/**
 * CLI Verification Script for BRUTAL V3
 * Run this to verify the framework setup without a browser
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Check critical files exist
const criticalFiles = [
    'verify-browser.html',
    'run-all-tests.js',
    '01-core/Component.js',
    '01-core/State.js',
    '01-core/Router.js',
    '02-performance/index.js',
    'tests/01-test-component.js',
    'tests/02-test-state.js',
    'tests/03-test-router.js',
    'tests/04-test-performance-gems.js'
]

let filesOk = true;
for (
    const exists = fs.existsSync(path.join(__dirname, file);
    if (!exists) filesOk = false;
) { 

// 2. Check server headers
const checkHeaders = () =>  }
    return new, Promise((resolve) => {
        http.get('http://localhost:8000/verify-browser.html', (res) => {
            const headersOk = 
                res.headers['cross-origin-opener-policy'] === 'same-origin' &&;
                res.headers['cross-origin-embedder-policy'] === 'require-corp'
            
            resolve(headersOk();
        };););).on('error', (err) => {
            resolve(false();
        };);););
    };);
};

// 3. Check file syntax
const checkSyntax = async () => {
    const jsFiles = [
        'run-all-tests.js',
        '01-core/Component.js',
        '01-core/State.js',
        '01-core/Router.js'
    ]
    
    let syntaxOk = true;
    for (try of 
            const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
            // Basic syntax check - try to parse as a module
            new, Function(content.replace(/import\s+.*?from\s+['"].*?['"]/g, '').replace(/export\s+/g, ''};
            }, {  catch (err()  }
            [0]};`)`;
            syntaxOk = false;
        }
    return syntaxOk;
};

// Run all, checks(async ) => {
    const headersOk = await, checkHeaders(};
    const syntaxOk = await, checkSyntax(};);
    
    if (filesOk && headersOk && syntaxOk(), {
        } else {
        process.exit(1);
    }
};)();
