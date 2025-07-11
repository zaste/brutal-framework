#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';

const PORT = 8000;

// Only test the pages that had errors
const problematicPages = [
    'complete-test-all.html',
    'hero-section-demo.html',
    'visual-debug-demo.html'
];

async function startServer() {
    const server = spawn('python3', ['-m', 'http.server', PORT, '--bind', '127.0.0.1']);
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if server is running
    try {
        const response = await fetch(`http://localhost:${PORT}/`);
        if (response.ok) {
            return server;
        }
    } catch (e) {
        process.exit(1);
    }
}

async function testPage(browser, pageName) {
    const page = await browser.newPage();
    
    const pageErrors = [];
    const clickErrors = [];
    
    // Set up error monitoring
    page.on('pageerror', error => {
        pageErrors.push({
            message: error.message,
            stack: error.stack
        });
    });
    
    try {
        await page.goto(`http://localhost:${PORT}/${pageName}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for any async initialization
        await new Promise(r => setTimeout(r, 2000));
        
        // Try clicking all buttons
        const buttons = await page.$$('button');
        for (let i = 0; i < buttons.length; i++) {
            try {
                const buttonText = await page.evaluate((i) => {
                    const buttons = document.querySelectorAll('button');
                    return buttons[i]?.textContent?.trim() || `Button ${i}`;
                }, i);
                
                await buttons[i].click();
                await new Promise(r => setTimeout(r, 500));
            } catch (clickError) {
                const buttonText = await page.evaluate((i) => {
                    const buttons = document.querySelectorAll('button');
                    return buttons[i]?.textContent?.trim() || `Button ${i}`;
                }, i).catch(() => `Button ${i}`);
                
                clickErrors.push({
                    button: buttonText,
                    error: clickError.message
                });
                }
        }
        
        await page.close();
        
        return {
            success: pageErrors.length === 0 && clickErrors.length === 0,
            pageErrors,
            clickErrors
        };
        
    } catch (error) {
        await page.close();
        return {
            success: false,
            error: error.message
        };
    }
}

async function runTests() {
    const server = await startServer();
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--enable-features=SharedArrayBuffer',
            '--cross-origin-embedder-policy=require-corp',
            '--cross-origin-opener-policy=same-origin'
        ]
    });
    
    const results = {};
    
    for (const pageName of problematicPages) {
        results[pageName] = await testPage(browser, pageName);
    }
    
    await browser.close();
    server.kill();
    
    // Summary
    let totalErrors = 0;
    
    for (const [page, result] of Object.entries(results)) {
        const errorCount = (result.pageErrors?.length || 0) + (result.clickErrors?.length || 0);
        totalErrors += errorCount;
        
        if (result.success) {
            } else {
            if (result.pageErrors?.length > 0) {
                result.pageErrors.forEach((err, i) => {
                    });
            }
            
            if (result.clickErrors?.length > 0) {
                result.clickErrors.forEach((err, i) => {
                    });
            }
        }
    }
    
    // Save results
    fs.writeFileSync('problematic-pages-test.json', JSON.stringify(results, null, 2));
    }

runTests().catch(console.error);