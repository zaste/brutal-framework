import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--enable-features=SharedArrayBuffer']
});

const page = await browser.newPage();

// Capture ALL console messages with full details
page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
        msg.args().forEach(async (arg) => {
            const val = await arg.jsonValue();
            console.log('  Error details:', val);
        });
    }
});

// Capture page errors
page.on('pageerror', error => {
    console.error('Page Error:', error.message);
    console.error('Stack:', error.stack);
});

console.log('Navigating to modal test page...');
await page.goto('http://localhost:8000/test-modal-brutal.html', {
    waitUntil: 'networkidle2',
    timeout: 10000
});

// Wait a bit for any errors
await page.waitForTimeout(2000);

// Get the page status
const pageStatus = await page.evaluate(() => {
    const status = document.getElementById('status');
    const results = document.getElementById('test-results');
    return {
        status: status ? status.textContent : 'No status',
        results: results ? results.textContent : 'No results',
        brutal: window.__BRUTAL__ || null,
        errors: window.errors || [],
        hasControls: !!document.getElementById('controls')
    };
});

console.log('\n=== Page Status ===');
console.log('Status:', pageStatus.status);
console.log('Has controls:', pageStatus.hasControls);
console.log('BRUTAL loaded:', !!pageStatus.brutal);

// Check specific imports
const importStatus = await page.evaluate(async () => {
    const results = [];
    
    try {
        const core = await import('./index.js');
        results.push('✅ Framework index loaded');
    } catch (e) {
        results.push(`❌ Framework index error: ${e.message}`);
    }
    
    try {
        const modal = await import('./04-components/ui/Modal.js');
        results.push('✅ Modal module loaded');
        results.push(`Modal class: ${typeof modal.Modal}`);
    } catch (e) {
        results.push(`❌ Modal module error: ${e.message}`);
    }
    
    return results;
});

console.log('\n=== Import Status ===');
importStatus.forEach(msg => console.log(msg));

await browser.close();