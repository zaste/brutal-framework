#!/usr/bin/env node

/**
 * Browser Test All - See exactly what the browser sees
 */

import puppeteer from 'puppeteer';
import { readdir } from 'fs/promises';

async function testAllPages() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-features=SharedArrayBuffer'
        ]
    });
    
    try {
        // Find all HTML files
        const files = await readdir('.');
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        const results = {};
        
        for (const file of htmlFiles) {
            }`);
            );
            
            const page = await browser.newPage();
            
            // Capture all console messages
            const consoleLogs = [];
            page.on('console', msg => {
                consoleLogs.push({
                    type: msg.type(),
                    text: msg.text(),
                    location: msg.location()
                });
            });
            
            // Capture all errors
            const pageErrors = [];
            page.on('pageerror', error => {
                pageErrors.push({
                    message: error.message,
                    stack: error.stack
                });
            });
            
            // Capture all network failures
            const networkErrors = [];
            page.on('requestfailed', request => {
                networkErrors.push({
                    url: request.url(),
                    error: request.failure().errorText
                });
            });
            
            try {
                // Navigate to page
                await page.goto(`http://localhost:8000/${file}`, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                
                // Wait a bit for any async operations
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check environment
                const environment = await page.evaluate(() => {
                    return {
                        crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
                        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
                        brutal: typeof window.__BRUTAL__ !== 'undefined',
                        brutalDebug: typeof window.__BRUTAL_DEBUG__ !== 'undefined'
                    };
                });
                
                // Try to click all buttons and see what happens
                const buttons = await page.$$('button');
                const clickErrors = [];
                
                for (let i = 0; i < buttons.length; i++) {
                    try {
                        const buttonText = await buttons[i].evaluate(el => el.textContent);
                        await buttons[i].click();
                        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for any effects
                        
                        // Check if any new errors appeared
                        const newErrors = pageErrors.slice(-1);
                        if (newErrors.length > 0) {
                            clickErrors.push({
                                button: buttonText,
                                error: newErrors[0]
                            });
                        }
                    } catch (clickError) {
                        clickErrors.push({
                            button: `Button ${i}`,
                            error: clickError.message
                        });
                    }
                }
                
                // Take screenshot
                await page.screenshot({
                    path: `screenshot-${file.replace('.html', '')}.png`,
                    fullPage: true
                });
                
                // Collect results
                results[file] = {
                    success: pageErrors.length === 0 && networkErrors.length === 0,
                    environment,
                    consoleLogs: consoleLogs.filter(log => log.type === 'error' || log.type === 'warning'),
                    pageErrors,
                    networkErrors,
                    clickErrors,
                    screenshotTaken: true
                };
                
                // Print results
                }`);
                
                if (pageErrors.length > 0) {
                    :`);
                    pageErrors.forEach((err, i) => {
                        if (err.stack) {
                            [1]?.trim()}`);
                        }
                    });
                }
                
                if (networkErrors.length > 0) {
                    :`);
                    networkErrors.forEach((err, i) => {
                        });
                }
                
                if (consoleLogs.length > 0) {
                    :`);
                    consoleLogs.forEach((log, i) => {
                        });
                }
                
                if (clickErrors.length > 0) {
                    :`);
                    clickErrors.forEach((err, i) => {
                        });
                }
                
                if (pageErrors.length === 0 && networkErrors.length === 0 && clickErrors.length === 0) {
                    }
                
            } catch (error) {
                results[file] = {
                    success: false,
                    error: error.message
                };
            } finally {
                await page.close();
            }
        }
        
        // Final summary
        );
        );
        
        let totalErrors = 0;
        let successCount = 0;
        
        for (const [file, result] of Object.entries(results)) {
            if (result.success) {
                successCount++;
            } else {
                const errorCount = (result.pageErrors?.length || 0) + 
                                 (result.networkErrors?.length || 0) + 
                                 (result.clickErrors?.length || 0);
                totalErrors += errorCount;
                }
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: htmlFiles.length,
                successfulPages: successCount,
                totalErrors
            },
            details: results
        };
        
        await import('fs').then(fs => 
            fs.promises.writeFile('browser-test-report.json', JSON.stringify(report, null, 2))
        );
        } finally {
        await browser.close();
    }
}

// Check if server is running
fetch('http://localhost:8000/')
    .then(() => {
        testAllPages();
    })
    .catch(() => {
        process.exit(1);
    });