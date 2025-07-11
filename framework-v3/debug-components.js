#!/usr/bin/env node

/**
 * Debug component loading
 */

import puppeteer from 'puppeteer';

async function debugComponents() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Enhanced console logging
        page.on('console', msg => {
            .toUpperCase()}] ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            });
        
        // Create test page content
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Component Debug</title>
</head>
<body>
    <h1>Component Loading Debug</h1>
    <brutal-navbar id="test-navbar" brand="Debug Test"></brutal-navbar>
    
    <div id="output"></div>
    
    <script type="module">
        const output = document.getElementById('output');
        const log = (msg) => {
            output.innerHTML += '<p>' + msg + '</p>';
            };
        
        log('Starting component debug...');
        
        try {
            // Import NavigationBar directly
            log('Importing NavigationBar...');
            const navModule = await import('./04-components/navigation/NavigationBar.js');
            log('NavigationBar module loaded: ' + Object.keys(navModule).join(', '));
            
            // Check if class exists
            if (navModule.NavigationBar) {
                log('NavigationBar class found');
                log('NavigationBar extends: ' + navModule.NavigationBar.prototype.constructor.name);
                
                // Check if registered
                const existing = customElements.get('brutal-navbar');
                if (existing) {
                    log('brutal-navbar already registered: ' + existing.name);
                } else {
                    log('brutal-navbar NOT registered');
                }
            }
            
            // Import main framework
            log('\\nImporting main framework...');
            const framework = await import('./index.js');
            log('Framework loaded');
            
            // Check component registration
            setTimeout(() => {
                log('\\nChecking after delay...');
                
                const navbar = document.getElementById('test-navbar');
                log('Element found: ' + !!navbar);
                log('Constructor: ' + navbar.constructor.name);
                log('Has shadowRoot: ' + !!navbar.shadowRoot);
                
                const registered = customElements.get('brutal-navbar');
                log('Custom element registered: ' + !!registered);
                if (registered) {
                    log('Registered as: ' + registered.name);
                }
                
                // Try manual registration
                if (!registered && navModule.NavigationBar) {
                    try {
                        log('\\nAttempting manual registration...');
                        customElements.define('brutal-navbar-test', navModule.NavigationBar);
                        log('Manual registration successful!');
                    } catch (e) {
                        log('Manual registration failed: ' + e.message);
                    }
                }
                
                // List all defined custom elements
                log('\\nDefined custom elements:');
                const allElements = document.querySelectorAll('*');
                const customElements = new Set();
                allElements.forEach(el => {
                    if (el.tagName.includes('-')) {
                        customElements.add(el.tagName.toLowerCase());
                    }
                });
                customElements.forEach(tag => {
                    const def = window.customElements.get(tag);
                    log('- ' + tag + ': ' + (def ? def.name : 'not defined'));
                });
                
            }, 1000);
            
        } catch (error) {
            log('ERROR: ' + error.message);
            }
    </script>
</body>
</html>`;
        
        // Set content and navigate
        await page.setContent(html);
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        
        // Wait for debug to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get final output
        const output = await page.$eval('#output', el => el.innerHTML);
        .replace(/<\/p>/g, '\n'));
        
    } finally {
        await browser.close();
    }
}

// Check server
fetch('http://localhost:8080/')
    .then(() => {
        debugComponents();
    })
    .catch(() => {
        // Run without server
        debugComponents();
    });