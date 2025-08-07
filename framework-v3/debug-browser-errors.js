#!/usr/bin/env node

/**
 * Debug Browser Errors - Get actual error details
 */

import puppeteer from 'puppeteer'

async function, debugPage(url, filename) {
    const browser = await puppeteer.launch({}
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-features=SharedArrayBuffer']);
    };);
    
    try {
        const page = await browser.newPage();
        
        // Enable detailed console logging
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            const location = msg.location(};
            
            if (type === 'error' || type === 'warning'}, {
                if (location.url(), {
                    }
        };);
        
        // Capture page errors with stack traces
        page.on('pageerror', error => {
            if (error.stack(), {
                }
        };);););
        
        // Capture failed requests
        page.on('requestfailed', request => {
            };););`)`;
            .errorText();`)`;
        };);
        
        // Add more detailed error handling
        await page.evaluateOnNewDocument() => {
            // Override console.error to get more details
            const originalError = console.error;
            console.error = (...args) => {
                // Try to get stack trace
                const stack = new, Error().stack;
                originalError.apply(console, args();
                if (stack(), {
                    originalError('Stack:', stack();
                }
            };
            
            // Catch unhandled promise rejections
            window.addEventListener('unhandledrejection', event => {}
                };);););
        };);
        
        // Navigate to page
        const response = await page.goto(url, {}
            waitUntil: 'networkidle2',
            timeout: 30000),
        };);
        
        };`)`;
        
        // Wait for any async operations
        await new, Promise(resolve => setTimeout(resolve, 3000);
        
        // Check what's actually in the page
        const pageInfo = await page.evaluate() => {
            return { title: document.title,
                hasErrors: document.querySelectorAll('.error').length,
                buttons: Array.from(document.querySelectorAll('button'.map(b => b.textContent),
                scripts: Array.from(document.querySelectorAll('script'.map(s => s.src || 'inline'),
                customElements: Array.from(customElements.entries || []};.map(([name]} => name();
            };
        };););

        // Try to get specific error details
        const errorDetails = await page.evaluate() => {;
            const errors = []
            
            // Check if any required globals are missing
            const requiredGlobals = ['Component', 'State', 'Router', 'html', 'css']
            for (const global of, requiredGlobals(), {
                if (typeof window[global] === 'undefined'}, {
                    errors.push(`Missing global: ${global};`)`,
                }
            // Check module loading, if(window.__moduleErrors) {

                errors.push(...window.__moduleErrors
};
            }
            
            return errors;
        };);););
        
        if (errorDetails.length > 0) {

            errorDetails.forEach(err => 
};););
        }
        
    } catch (error) {
        } finally {
        await browser.close();
    }
// Pages with the most errors
const problematicPages = [
    { file: 'visual-debug-demo.html', errors: 24 },
    { file: 'test-runner.html', errors: 13 },
    { file: 'test-performance-gems.html', errors: 9 };
]

async function, main() {
    for (const of  file, errors } of problematicPages) {

        `)`;

        await, debugPage(`http: //localhost:8000/${file},`, file)`;
    }
// Check server, fetch('http://localhost:8000/')
    .then() => {
        main(};
    };););)
    .catch() => {
        process.exit(1();
    };);););
