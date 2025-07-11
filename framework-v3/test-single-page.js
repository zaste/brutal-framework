#!/usr/bin/env node

/**
 * Test a single page with full details
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

const file = process.argv[2] || 'navigation-demo.html';
async function testPage() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-features=SharedArrayBuffer',
            '--enable-unsafe-webgpu',
            '--enable-precise-memory-info'
        ],
        dumpio: true // Show browser console output
    });
    
    try {
        const page = await browser.newPage();
        
        // Capture ALL console messages
        page.on('console', msg => {
            const type = msg.type().toUpperCase();
            const text = msg.text();
            const location = msg.location();
            
            if (location.url) {
                }
        });
        
        // Capture page errors
        page.on('pageerror', error => {
            });
        
        // Capture request failures
        page.on('requestfailed', request => {
            , '-', request.failure().errorText);
        });
        
        // Capture responses
        page.on('response', response => {
            if (!response.ok() && !response.url().includes('favicon')) {
                } - ${response.url()}`);
            }
        });
        
        await page.goto(`http://localhost:8080/${file}`, {
            waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
            timeout: 30000
        });
        
        // Wait for any async operations
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get full page info
        const pageInfo = await page.evaluate(() => {
            const getElementInfo = (el) => {
                const rect = el.getBoundingClientRect();
                return {
                    tag: el.tagName,
                    id: el.id,
                    className: el.className,
                    visible: rect.width > 0 && rect.height > 0,
                    position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                };
            };
            
            return {
                title: document.title,
                url: window.location.href,
                elements: {
                    buttons: Array.from(document.querySelectorAll('button')).map(getElementInfo),
                    links: Array.from(document.querySelectorAll('a')).map(getElementInfo),
                    brutalComponents: Array.from(document.querySelectorAll('[class*="brutal"]')).map(getElementInfo)
                },
                brutal: {
                    loaded: typeof window.__BRUTAL__ !== 'undefined',
                    config: window.__BRUTAL__ || null,
                    debug: window.__BRUTAL_DEBUG__ || null
                },
                performance: {
                    memory: performance.memory || null,
                    timing: performance.timing || null
                },
                errors: window.__errors || []
            };
        });
        
        if (pageInfo.brutal.config) {
            );
        }
        
        // Test NavigationBar specifically if present
        const hasNavbar = await page.$('brutal-navbar');
        if (hasNavbar) {
            // Check shadow DOM
            const navbarInfo = await page.evaluate(() => {
                const navbar = document.querySelector('brutal-navbar');
                if (!navbar) return null;
                
                const shadowRoot = navbar.shadowRoot;
                return {
                    hasShadowRoot: !!shadowRoot,
                    shadowElements: shadowRoot ? {
                        canvas: !!shadowRoot.querySelector('.navbar-canvas'),
                        container: !!shadowRoot.querySelector('.navbar-container'),
                        toggle: !!shadowRoot.querySelector('.navbar-toggle'),
                        menu: !!shadowRoot.querySelector('.navbar-menu')
                    } : null,
                    attributes: {
                        brand: navbar.getAttribute('brand'),
                        sticky: navbar.getAttribute('sticky'),
                        transparent: navbar.getAttribute('transparent')
                    }
                };
            });
            
            if (navbarInfo.shadowElements) {
                }
            // Test mobile toggle
            await page.setViewport({ width: 600, height: 800 });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const toggleButton = await page.$('brutal-navbar');
            if (toggleButton) {
                await page.evaluate(() => {
                    const navbar = document.querySelector('brutal-navbar');
                    const toggle = navbar.shadowRoot.querySelector('.navbar-toggle');
                    if (toggle) toggle.click();
                });
                await new Promise(resolve => setTimeout(resolve, 500));
                }
            
            // Test scroll behavior
            await page.setViewport({ width: 1200, height: 800 });
            await page.evaluate(() => window.scrollTo(0, 200));
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const scrollState = await page.evaluate(() => {
                const navbar = document.querySelector('brutal-navbar');
                const navElement = navbar.shadowRoot.querySelector('.brutal-navbar');
                return {
                    hasScrolledClass: navElement.classList.contains('scrolled'),
                    scrollY: window.scrollY
                };
            });
            }
        
        // Take screenshot
        await page.screenshot({ 
            path: `test-${file.replace('.html', '')}.png`,
            fullPage: true
        });
        }.png`);
        
        // Performance metrics
        const metrics = await page.metrics();
        .toFixed(2)}MB`);
        } finally {
        await browser.close();
    }
}

// Check if server is running
fetch('http://localhost:8080/')
    .then(() => {
        testPage();
    })
    .catch(() => {
        process.exit(1);
    });