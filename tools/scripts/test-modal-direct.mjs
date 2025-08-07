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
});

console.log('Navigating to modal test page...');
await page.goto('http://localhost:8000/test-modal-brutal.html', {
    waitUntil: 'networkidle2'
});

// Wait for framework to load
await page.waitForSelector('#controls', { visible: true });

// Get test results element
const setupTestResults = await page.evaluate(() => {
    const results = document.getElementById('test-results');
    return results ? results.textContent : 'No results element';
});

console.log('\n=== Initial Test Results ===');
console.log(setupTestResults);

// Test basic modal
console.log('\n=== Testing Basic Modal ===');
await page.click('button[onclick="testBasicModal()"]');
await page.waitForTimeout(2000);

const basicModalResults = await page.evaluate(() => {
    const results = document.getElementById('test-results');
    return results ? results.textContent : 'No results';
});

console.log(basicModalResults);

// Test all animations
console.log('\n=== Testing All Animations ===');
await page.click('button[onclick="testAllAnimations()"]');
await page.waitForTimeout(5000);

const animationResults = await page.evaluate(() => {
    const results = document.getElementById('test-results');
    return results ? results.textContent : 'No results';
});

console.log(animationResults);

// Check for any final errors
const finalStatus = await page.evaluate(() => {
    return {
        brutal: window.__BRUTAL__ || null,
        modalElement: document.getElementById('testModal') ? 'exists' : 'missing',
        customElementDefined: customElements.get('brutal-modal') ? 'defined' : 'not defined'
    };
});

console.log('\n=== Final Status ===');
console.log('BRUTAL:', finalStatus.brutal);
console.log('Modal element:', finalStatus.modalElement);
console.log('Custom element:', finalStatus.customElementDefined);

await browser.close();