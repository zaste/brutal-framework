/**
 * Dashboard Server - Real-time test monitoring
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DashboardServer {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3334,
            ...config
        };
        
        this.app = null;
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        this.currentResults = null;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        
        this.app = express();
        
        // Serve static dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
        
        // API endpoints
        this.app.get('/api/results', (req, res) => {
            res.json(this.currentResults || { status: 'waiting' });
        });
        
        // Start HTTP server
        this.server = this.app.listen(this.config.port, () => {
            console.log(`📊 Dashboard running at http://localhost:${this.config.port}`);
            this.isRunning = true;
        });
        
        // Setup WebSocket for real-time updates
        this.wss = new WebSocketServer({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            
            // Send current state
            if (this.currentResults) {
                ws.send(JSON.stringify({
                    type: 'results',
                    data: this.currentResults
                }));
            }
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
    }

    async update(results) {
        this.currentResults = results;
        
        // Broadcast to all connected clients
        const message = JSON.stringify({
            type: 'update',
            data: results,
            timestamp: Date.now()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        });
    }

    async stop() {
        if (!this.isRunning) return;
        
        // Close all WebSocket connections
        this.clients.forEach(client => client.close());
        
        // Stop servers
        if (this.wss) this.wss.close();
        if (this.server) {
            await new Promise(resolve => this.server.close(resolve));
        }
        
        this.isRunning = false;
        console.log('📊 Dashboard stopped');
    }

    getDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRUTAL Test Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            overflow-x: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            padding: 20px;
            border-bottom: 2px solid #00ff00;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        
        h1 {
            font-size: 36px;
            background: linear-gradient(45deg, #00ff00, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }
        
        .status-bar {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        
        .status-item {
            text-align: center;
        }
        
        .status-value {
            font-size: 24px;
            font-weight: bold;
        }
        
        .status-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .panel {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        
        .panel:hover {
            border-color: #00ff00;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
        }
        
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #333;
        }
        
        .panel-title {
            font-size: 18px;
            color: #00ffff;
        }
        
        .error-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .error-item {
            background: #222;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 3px solid #ff0000;
            font-size: 14px;
        }
        
        .error-type {
            color: #ff6666;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .error-message {
            color: #ccc;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            word-break: break-all;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #222;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-name {
            color: #888;
        }
        
        .metric-value {
            font-weight: bold;
            font-size: 18px;
        }
        
        .good { color: #00ff00; }
        .warning { color: #ffff00; }
        .bad { color: #ff0000; }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .live-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff00;
            margin-left: 10px;
            animation: pulse 2s infinite;
        }
        
        .chart {
            height: 200px;
            position: relative;
            overflow: hidden;
        }
        
        .chart-bar {
            position: absolute;
            bottom: 0;
            width: 20px;
            background: #00ff00;
            transition: all 0.3s ease;
        }
        
        .timeline {
            position: relative;
            padding: 20px 0;
        }
        
        .timeline-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .timeline-time {
            width: 80px;
            color: #666;
        }
        
        .timeline-event {
            flex: 1;
            padding: 5px 10px;
            background: #222;
            border-radius: 5px;
            margin-left: 20px;
        }
        
        .recommendations {
            background: #1a2a1a;
            border: 1px solid #00ff00;
        }
        
        .recommendation-item {
            padding: 10px;
            margin-bottom: 10px;
            background: #0f1f0f;
            border-radius: 5px;
        }
        
        .recommendation-title {
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 5px;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #333;
            border-top-color: #00ff00;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 20px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .connection-status.connected {
            border-color: #00ff00;
        }
        
        .connection-status.disconnected {
            border-color: #ff0000;
        }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">
        <span class="status-indicator"></span>
        <span class="status-text">Connecting...</span>
    </div>
    
    <header class="header">
        <h1>BRUTAL TEST DASHBOARD <span class="live-indicator"></span></h1>
        <div class="status-bar" id="statusBar">
            <div class="status-item">
                <div class="status-value" id="errorCount">0</div>
                <div class="status-label">Errors</div>
            </div>
            <div class="status-item">
                <div class="status-value" id="testCount">0</div>
                <div class="status-label">Tests</div>
            </div>
            <div class="status-item">
                <div class="status-value" id="performanceScore">0%</div>
                <div class="status-label">Performance</div>
            </div>
            <div class="status-item">
                <div class="status-value" id="status">
                    <span class="spinner"></span>
                </div>
                <div class="status-label">Status</div>
            </div>
        </div>
    </header>
    
    <div class="container">
        <div class="grid">
            <div class="panel">
                <div class="panel-header">
                    <h2 class="panel-title">Recent Errors</h2>
                    <span id="errorBadge" class="bad">0</span>
                </div>
                <div class="error-list" id="errorList">
                    <p style="color: #666;">No errors yet...</p>
                </div>
            </div>
            
            <div class="panel">
                <div class="panel-header">
                    <h2 class="panel-title">Performance Metrics</h2>
                    <span class="live-indicator"></span>
                </div>
                <div id="performanceMetrics">
                    <div class="metric">
                        <span class="metric-name">First Contentful Paint</span>
                        <span class="metric-value" id="fcp">-</span>
                    </div>
                    <div class="metric">
                        <span class="metric-name">Total Blocking Time</span>
                        <span class="metric-value" id="tbt">-</span>
                    </div>
                    <div class="metric">
                        <span class="metric-name">Cumulative Layout Shift</span>
                        <span class="metric-value" id="cls">-</span>
                    </div>
                    <div class="metric">
                        <span class="metric-name">Average FPS</span>
                        <span class="metric-value" id="fps">-</span>
                    </div>
                </div>
            </div>
            
            <div class="panel">
                <div class="panel-header">
                    <h2 class="panel-title">Memory Usage</h2>
                </div>
                <div class="chart" id="memoryChart"></div>
            </div>
            
            <div class="panel recommendations">
                <div class="panel-header">
                    <h2 class="panel-title">Recommendations</h2>
                </div>
                <div id="recommendations">
                    <p style="color: #666;">Analyzing...</p>
                </div>
            </div>
            
            <div class="panel" style="grid-column: span 2;">
                <div class="panel-header">
                    <h2 class="panel-title">Live Timeline</h2>
                </div>
                <div class="timeline" id="timeline"></div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let reconnectTimeout = null;
        let memoryData = [];
        const maxMemoryPoints = 50;
        
        function connect() {
            ws = new WebSocket('ws://' + window.location.host);
            
            ws.onopen = () => {
                updateConnectionStatus(true);
                console.log('Connected to dashboard server');
            };
            
            ws.onclose = () => {
                updateConnectionStatus(false);
                reconnectTimeout = setTimeout(connect, 2000);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                updateConnectionStatus(false);
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleMessage(message);
            };
        }
        
        function updateConnectionStatus(connected) {
            const status = document.getElementById('connectionStatus');
            const indicator = status.querySelector('.status-indicator');
            const text = status.querySelector('.status-text');
            
            if (connected) {
                status.classList.add('connected');
                status.classList.remove('disconnected');
                indicator.className = 'status-indicator live-indicator';
                text.textContent = 'Connected';
            } else {
                status.classList.remove('connected');
                status.classList.add('disconnected');
                indicator.className = 'status-indicator';
                indicator.style.background = '#ff0000';
                text.textContent = 'Disconnected';
            }
        }
        
        function handleMessage(message) {
            if (message.type === 'update' || message.type === 'results') {
                updateDashboard(message.data);
            }
        }
        
        function updateDashboard(data) {
            // Update status
            updateStatus(data);
            
            // Update errors
            updateErrors(data.errors || []);
            
            // Update performance
            if (data.analysis?.performance) {
                updatePerformance(data.analysis.performance);
            }
            
            // Update recommendations
            if (data.suggestions || data.analysis?.performance?.recommendations) {
                updateRecommendations(data.suggestions || data.analysis.performance.recommendations);
            }
            
            // Update timeline
            updateTimeline(data);
            
            // Update memory chart
            if (data.analysis?.performance?.memory) {
                updateMemoryChart(data.analysis.performance.memory);
            }
        }
        
        function updateStatus(data) {
            document.getElementById('errorCount').textContent = data.errors?.length || 0;
            document.getElementById('testCount').textContent = data.tests?.length || 0;
            
            const perfScore = data.analysis?.performance?.performanceScore || 0;
            const scoreElement = document.getElementById('performanceScore');
            scoreElement.textContent = perfScore + '%';
            scoreElement.className = perfScore >= 90 ? 'good' : perfScore >= 50 ? 'warning' : 'bad';
            
            const statusElement = document.getElementById('status');
            if (data.status === 'complete') {
                statusElement.innerHTML = '<span class="good">Complete</span>';
            } else {
                statusElement.innerHTML = '<span class="spinner"></span> Running';
            }
        }
        
        function updateErrors(errors) {
            const errorList = document.getElementById('errorList');
            const errorBadge = document.getElementById('errorBadge');
            
            errorBadge.textContent = errors.length;
            
            if (errors.length === 0) {
                errorList.innerHTML = '<p style="color: #666;">No errors detected ✅</p>';
            } else {
                errorList.innerHTML = errors.slice(0, 10).map(error => \`
                    <div class="error-item">
                        <div class="error-type">\${error.type || 'ERROR'}</div>
                        <div class="error-message">\${error.message || error.text || 'Unknown error'}</div>
                    </div>
                \`).join('');
            }
        }
        
        function updatePerformance(perf) {
            updateMetric('fcp', perf.firstContentfulPaint, 'ms', 1800);
            updateMetric('tbt', perf.totalBlockingTime, 'ms', 300);
            updateMetric('cls', perf.cumulativeLayoutShift, '', 0.1);
            updateMetric('fps', perf.averageFPS, ' fps', 30, true);
        }
        
        function updateMetric(id, value, unit = '', threshold = null, higherBetter = false) {
            const element = document.getElementById(id);
            if (!element) return;
            
            element.textContent = value ? value + unit : '-';
            
            if (threshold !== null && value) {
                if (higherBetter) {
                    element.className = value >= threshold ? 'metric-value good' : 'metric-value bad';
                } else {
                    element.className = value <= threshold ? 'metric-value good' : 'metric-value bad';
                }
            }
        }
        
        function updateRecommendations(recommendations) {
            const container = document.getElementById('recommendations');
            
            if (!recommendations || recommendations.length === 0) {
                container.innerHTML = '<p style="color: #666;">No recommendations</p>';
            } else {
                container.innerHTML = recommendations.slice(0, 3).map(rec => \`
                    <div class="recommendation-item">
                        <div class="recommendation-title">\${rec.title}</div>
                        <div style="color: #ccc; font-size: 14px;">\${rec.description || ''}</div>
                    </div>
                \`).join('');
            }
        }
        
        function updateTimeline(data) {
            const timeline = document.getElementById('timeline');
            const events = [];
            
            // Add errors to timeline
            if (data.errors) {
                data.errors.forEach(error => {
                    if (error.timestamp) {
                        events.push({
                            time: error.timestamp,
                            type: 'error',
                            message: error.message || error.type || 'Error'
                        });
                    }
                });
            }
            
            // Sort and display recent events
            events.sort((a, b) => b.time - a.time);
            
            timeline.innerHTML = events.slice(0, 10).map(event => \`
                <div class="timeline-item">
                    <span class="timeline-time">\${new Date(event.time).toLocaleTimeString()}</span>
                    <div class="timeline-event \${event.type}">\${event.message}</div>
                </div>
            \`).join('');
        }
        
        function updateMemoryChart(memoryInfo) {
            // Add to data
            memoryData.push(memoryInfo.usedJSHeapSize || 0);
            if (memoryData.length > maxMemoryPoints) {
                memoryData.shift();
            }
            
            // Render chart
            const chart = document.getElementById('memoryChart');
            const max = Math.max(...memoryData);
            
            chart.innerHTML = memoryData.map((value, i) => \`
                <div class="chart-bar" style="
                    left: \${i * (100 / maxMemoryPoints)}%;
                    height: \${(value / max) * 100}%;
                    background: \${value > max * 0.8 ? '#ff0000' : '#00ff00'};
                "></div>
            \`).join('');
        }
        
        // Initialize connection
        connect();
        
        // Periodic data fetch as fallback
        setInterval(async () => {
            try {
                const response = await fetch('/api/results');
                const data = await response.json();
                if (data.status !== 'waiting') {
                    updateDashboard(data);
                }
            } catch (error) {
                console.error('Failed to fetch results:', error);
            }
        }, 2000);
    </script>
</body>
</html>`;
    }
}