#!/usr/bin/env node

/**
 * Run BRUTAL Test System on critical framework pages
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const criticalPages = [
    'framework-v3/component-showcase.html',
    'framework-v3/test-modal.html',
    'framework-v3/final-test-all.html',
    'framework-v3/test-carousel.html',
    'framework-v3/test-charts.html',
    'framework-v3/test-notifications.html',
    'framework-v3/test-searchbox.html',
    'framework-v3/test-timeline.html'
];

async function runTest(page) {
    console.log(`\n🔍 Testing: ${page}`);
    
    return new Promise((resolve) => {
        const child = spawn('node', [
            'brutal-test/cli.js',
            '--mode=quick',
            `--path=${page}`,
            '--output=./brutal-analysis'
        ], { stdio: 'inherit' });
        
        child.on('close', (code) => {
            if (code !== 0) {
                console.log(`❌ Test failed for ${page} with code ${code}`);
            }
            resolve(code);
        });
    });
}

async function main() {
    console.log('🚀 Starting BRUTAL Framework V3 Analysis');
    console.log('=' .repeat(60));
    
    const results = [];
    
    for (const page of criticalPages) {
        const code = await runTest(page);
        results.push({ page, code });
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY:');
    console.log('=' .repeat(60));
    
    const failed = results.filter(r => r.code !== 0);
    const passed = results.filter(r => r.code === 0);
    
    console.log(`✅ Passed: ${passed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
        console.log('\nFailed pages:');
        failed.forEach(r => console.log(`  - ${r.page}`));
    }
    
    // Read the final report
    try {
        const report = JSON.parse(await fs.readFile('./brutal-analysis/report.json', 'utf-8'));
        console.log(`\n🐛 Total Errors Found: ${report.errors?.length || 0}`);
        
        if (report.errors && report.errors.length > 0) {
            console.log('\nTop Errors:');
            const errorTypes = {};
            report.errors.forEach(err => {
                errorTypes[err.type] = (errorTypes[err.type] || 0) + 1;
            });
            
            Object.entries(errorTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([type, count]) => {
                    console.log(`  - ${type}: ${count} occurrences`);
                });
        }
    } catch (e) {
        console.log('\nCould not read final report');
    }
}

main().catch(console.error);