import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--enable-features=SharedArrayBuffer']
});

const page = await browser.newPage();

// Capture console messages
page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
});

// Capture errors
page.on('pageerror', error => {
    console.error('Page Error:', error.message);
    console.error('Stack:', error.stack);
});

// Capture response details
page.on('response', response => {
    if (response.status() >= 400) {
        console.error(`HTTP ${response.status()} for ${response.url()}`);
    }
});

// Capture failed requests
page.on('requestfailed', request => {
    console.error('Request failed:', request.url(), request.failure().errorText);
});

console.log('Navigating to test page...');
await page.goto('http://localhost:8000/test-modal-brutal.html', {
    waitUntil: 'networkidle2'
});

// Wait a bit for any async errors
await new Promise(resolve => setTimeout(resolve, 2000));

// Get the page content
const content = await page.evaluate(() => {
    return {
        status: document.getElementById('status')?.innerHTML || 'No status element',
        brutal: window.__BRUTAL__ || null,
        errors: window.errors || []
    };
});

console.log('\n=== Page Content ===');
console.log('Status:', content.status);
console.log('BRUTAL global:', content.brutal);
console.log('Errors:', content.errors);

await browser.close();