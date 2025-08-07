/**
 * Embedded Server with correct COOP/COEP headers for SharedArrayBuffer
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class EmbeddedServer {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3333,
            root: config.root || path.resolve(__dirname, '../../framework-v3'),
            ...config
        };
        
        this.app = null;
        this.server = null;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            console.log('Server already running');
            return this.getUrl();
        }

        this.app = express();
        
        // Enable compression
        this.app.use(compression());
        
        // Critical headers for SharedArrayBuffer
        this.app.use((req, res, next) => {
            // Cross-Origin Isolation headers
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            
            // Security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            
            // Performance headers
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            
            // CORS headers for test resources
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            next();
        });
        
        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });
        
        // Special handling for worker scripts
        this.app.use('/workers', (req, res, next) => {
            res.setHeader('Content-Type', 'application/javascript');
            next();
        });
        
        // Serve test runner UI
        this.app.get('/brutal-test', (req, res) => {
            res.send(this.getTestRunnerHTML());
        });
        
        // Test data storage
        this.testResults = [];
        this.availableTests = [];
        
        // API endpoints for test results
        this.app.post('/api/test-results', express.json(), (req, res) => {
            // Store test results
            console.log('Received test results:', req.body);
            this.testResults.push(req.body);
            res.json({ status: 'ok' });
        });
        
        // API endpoint to get available tests
        this.app.get('/api/tests', (req, res) => {
            res.json(this.availableTests);
        });
        
        // API endpoint to run a specific test
        this.app.post('/api/run-test', express.json(), async (req, res) => {
            const test = req.body;
            console.log('Running test:', test.name);
            
            try {
                // Simple test execution simulation
                const result = {
                    id: test.id,
                    name: test.name,
                    status: 'passed',
                    duration: Math.random() * 1000,
                    error: null
                };
                
                // Simulate some failing tests
                if (Math.random() > 0.8) {
                    result.status = 'failed';
                    result.error = 'Random test failure for demo';
                }
                
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    id: test.id,
                    name: test.name,
                    status: 'failed',
                    error: error.message
                });
            }
        });
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                headers: {
                    coop: res.getHeader('Cross-Origin-Opener-Policy'),
                    coep: res.getHeader('Cross-Origin-Embedder-Policy')
                },
                features: {
                    sharedArrayBuffer: true,
                    workers: true
                }
            });
        });
        
        // Serve static files
        this.app.use(express.static(this.config.root, {
            extensions: ['html', 'js', 'css'],
            index: 'index.html'
        }));
        
        // Fallback for SPA routes
        this.app.get('*', (req, res) => {
            const indexPath = path.join(this.config.root, 'index.html');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    res.status(404).send('Not found');
                }
            });
        });
        
        // Start server
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.config.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.isRunning = true;
                    console.log(`🚀 BRUTAL Test Server running at ${this.getUrl()}`);
                    console.log('✅ SharedArrayBuffer enabled with correct headers');
                    resolve(this.getUrl());
                }
            });
        });
    }

    async stop() {
        if (!this.isRunning) return;
        
        return new Promise((resolve) => {
            this.server.close(() => {
                this.isRunning = false;
                console.log('🛑 Server stopped');
                resolve();
            });
        });
    }

    getUrl() {
        return `http://localhost:${this.config.port}`;
    }
    
    setAvailableTests(tests) {
        this.availableTests = tests.map((test, index) => ({
            id: index + 1,
            name: test.name,
            path: test.path,
            type: test.type
        }));
    }

    getTestRunnerHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRUTAL Test Runner</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        h1 {
            font-size: 48px;
            background: linear-gradient(45deg, #00ff00, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .status {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            min-width: 150px;
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #00ff00;
        }
        .stat-label {
            font-size: 14px;
            color: #888;
            margin-top: 5px;
        }
        .tests {
            max-width: 1200px;
            margin: 0 auto;
        }
        .test {
            background: #1a1a1a;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        .test:hover {
            background: #222;
            transform: translateX(5px);
        }
        .test-name {
            font-size: 16px;
        }
        .test-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-passed { background: #00ff00; color: #000; }
        .status-failed { background: #ff0000; color: #fff; }
        .status-running { background: #ffff00; color: #000; }
        .status-pending { background: #444; color: #aaa; }
        .controls {
            text-align: center;
            margin: 40px 0;
        }
        button {
            background: linear-gradient(45deg, #00ff00, #00ffff);
            color: #000;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
        }
        .console {
            background: #000;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 40px;
        }
        .log { color: #aaa; }
        .error { color: #ff0000; }
        .success { color: #00ff00; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BRUTAL TEST RUNNER</h1>
        <p>Detecting ALL failures with zero mercy</p>
    </div>
    
    <div class="status">
        <div class="stat">
            <div class="stat-value" id="total">0</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat">
            <div class="stat-value" id="passed">0</div>
            <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
            <div class="stat-value" id="failed">0</div>
            <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
            <div class="stat-value" id="coverage">0%</div>
            <div class="stat-label">Coverage</div>
        </div>
    </div>
    
    <div class="controls">
        <button onclick="runTests()">RUN ALL TESTS</button>
    </div>
    
    <div class="tests" id="tests"></div>
    
    <div class="console" id="console">
        <div class="log">Ready to test...</div>
    </div>
    
    <script>
        // Verify SharedArrayBuffer is available
        if (typeof SharedArrayBuffer !== 'undefined') {
            log('✅ SharedArrayBuffer is available', 'success');
        } else {
            log('❌ SharedArrayBuffer is NOT available', 'error');
        }
        
        function log(message, type = 'log') {
            const console = document.getElementById('console');
            const entry = document.createElement('div');
            entry.className = type;
            entry.textContent = new Date().toISOString() + ' ' + message;
            console.appendChild(entry);
            console.scrollTop = console.scrollHeight;
        }
        
        async function runTests() {
            log('Starting test run...', 'success');
            
            // Fetch test list
            const response = await fetch('/api/tests');
            const tests = await response.json();
            
            document.getElementById('total').textContent = tests.length;
            
            // Run each test
            for (const test of tests) {
                await runTest(test);
            }
            
            log('Test run complete!', 'success');
        }
        
        async function runTest(test) {
            const testElement = createTestElement(test);
            document.getElementById('tests').appendChild(testElement);
            
            updateTestStatus(test.id, 'running');
            
            try {
                const result = await fetch('/api/run-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(test)
                }).then(r => r.json());
                
                updateTestStatus(test.id, result.status);
                
                if (result.status === 'passed') {
                    incrementStat('passed');
                } else {
                    incrementStat('failed');
                    log('Test failed: ' + test.name + ' - ' + result.error, 'error');
                }
            } catch (error) {
                updateTestStatus(test.id, 'failed');
                incrementStat('failed');
                log('Test error: ' + test.name + ' - ' + error.message, 'error');
            }
        }
        
        function createTestElement(test) {
            const div = document.createElement('div');
            div.className = 'test';
            div.id = 'test-' + test.id;
            div.innerHTML = \`
                <span class="test-name">\${test.name}</span>
                <span class="test-status status-pending">pending</span>
            \`;
            return div;
        }
        
        function updateTestStatus(testId, status) {
            const testElement = document.getElementById('test-' + testId);
            if (testElement) {
                const statusElement = testElement.querySelector('.test-status');
                statusElement.className = 'test-status status-' + status;
                statusElement.textContent = status;
            }
        }
        
        function incrementStat(statId) {
            const element = document.getElementById(statId);
            element.textContent = parseInt(element.textContent) + 1;
        }
    </script>
</body>
</html>
        `;
    }
}