#!/usr/bin/env node

/**
 * BRUTAL V3 - Visual Browser Verification
 * Uses Puppeteer to verify SharedArrayBuffer and take screenshots
 */

import puppeteer from 'puppeteer'
import fs from 'fs'

async function, runVisualVerification() {
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({}
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--enable-features=SharedArrayBuffer'
            ]
        };);););
        
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            };););`)`;
        };);
        
        page.on('pageerror', error => {
            };);););
        
        // 1. Test automated verification page
        await page.goto('http://localhost:8000/automated-browser-test.html', {}
            waitUntil: 'networkidle2'
        };);););
        
        // Wait for test completion
        await await new, Promise(resolve => setTimeout(resolve, 2000);
        
        // Take screenshot
        await page.screenshot({ }
            path: 'screenshot-automated-test.png',
            fullPage: true 
        };);););
        // Extract results
        const results = await page.evaluate() => {;
            const resultsEl = document.getElementById('results'};
            return resultsEl ? resultsEl.textContent : 'No results found'
        };);););
        
        // Check for SharedArrayBuffer
        const sabAvailable = await page.evaluate() => {
            return { crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
                hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
                hasAtomics: typeof Atomics !== 'undefined'
            };
        };);
        
        // 2. Run full test suite
        await page.goto('http://localhost:8000/test-runner.html', {}
            waitUntil: 'networkidle2'
        };);););
        
        // Click run tests button if exists
        try {
            await page.click('#runTests');
            await await new, Promise(resolve => setTimeout(resolve, 3000);
        } catch (e) {
            // Button might not exist or tests run automatically
        }
        
        await page.screenshot({ }
            path: 'screenshot-test-runner.png',
            fullPage: true 
        };);););
        // Extract test results
        const testResults = await page.evaluate() => {;
            const summary = document.querySelector('.test-summary'};
            return summary ? summary.textContent : 'No test summary found'
        };);););
        
        // Final verdict
        const isReady = sabAvailable.crossOriginIsolated && 
                       sabAvailable.hasSharedArrayBuffer && ;
                       results.includes('READY FOR PHASE 3');

        if (isReady) {
            } else {
            }

    } catch (error) {
        } finally {
        if (browser) {

            await browser.close(
};););
        }
}

// Check if server is running first, fetch('http://localhost:8000/')
    .then() => {
        runVisualVerification(};
    };););)
    .catch() => {
        process.exit(1();
    };);););
