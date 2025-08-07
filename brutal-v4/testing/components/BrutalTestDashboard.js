/**
 * BrutalTestDashboard - Visual Dashboard Component for Test Results
 * 
 * A beautiful, interactive dashboard that shows test execution in real-time.
 * True to the philosophy: the dashboard IS a component.
 */

import { BrutalComponent } from '../../core/foundation/Component.js';
import { BrutalState } from '../../core/state/State.js';
import { html } from '../../core/templates/index.js';
import { BrutalTestRunner } from './BrutalTestRunner.js';

export class BrutalTestDashboard extends BrutalComponent {
    constructor() {
        super();
        
        // Dashboard state
        this._dashboardState = new BrutalState({
            title: 'BRUTAL Test Dashboard',
            status: 'idle', // idle | running | complete
            startTime: null,
            endTime: null,
            totalDuration: 0,
            
            // Test statistics
            stats: {
                total: 0,
                passed: 0,
                failed: 0,
                pending: 0,
                running: 0
            },
            
            // Test history
            history: [],
            currentRun: null,
            
            // UI state
            view: 'overview', // overview | details | history
            selectedTest: null,
            autoRefresh: true,
            theme: 'dark'
        });
        
        // React to state changes
        this._dashboardState.on('change', () => this.render());
        
        // Test runner reference
        this._runner = null;
        
        // Update interval
        this._updateInterval = null;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Find or create test runner
        this._runner = this.querySelector('brutal-test-runner') || this._createRunner();
        
        // Listen to runner events
        this._setupRunnerListeners();
        
        // Start auto-refresh if enabled
        if (this._dashboardState.get('autoRefresh')) {
            this._startAutoRefresh();
        }
        
        // Initial stats update
        this._updateStats();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopAutoRefresh();
    }
    
    _createRunner() {
        const runner = new BrutalTestRunner();
        this.appendChild(runner);
        return runner;
    }
    
    _setupRunnerListeners() {
        if (!this._runner) return;
        
        // Listen for test events
        this._runner.addEventListener('test:complete', (e) => {
            this._onTestComplete(e.detail);
        });
        
        this._runner.addEventListener('runner:complete', (e) => {
            this._onRunnerComplete(e.detail);
        });
        
        // Listen for runner state changes
        this._runner._runnerState.on('change', () => {
            this._updateStats();
        });
    }
    
    _onTestComplete(detail) {
        const { test, result } = detail;
        
        // Update history
        const history = [...this._dashboardState.get('history')];
        history.push({
            id: `${test.name}-${Date.now()}`,
            name: test.name,
            result,
            timestamp: new Date().toISOString()
        });
        
        // Keep last 100 entries
        if (history.length > 100) {
            history.shift();
        }
        
        this._dashboardState.set({ history });
        this._updateStats();
    }
    
    _onRunnerComplete(results) {
        this._dashboardState.set({
            status: 'complete',
            endTime: Date.now(),
            totalDuration: results.duration
        });
        
        // Save current run
        const currentRun = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            results,
            stats: { ...this._dashboardState.get('stats') }
        };
        
        this._dashboardState.set({ currentRun });
    }
    
    _updateStats() {
        if (!this._runner) return;
        
        const runnerState = this._runner._runnerState.getAll();
        const tests = runnerState.tests || [];
        
        const stats = {
            total: tests.length,
            passed: tests.filter(t => t.status === 'passed').length,
            failed: tests.filter(t => t.status === 'failed').length,
            pending: tests.filter(t => t.status === 'pending').length,
            running: tests.filter(t => t.status === 'running').length
        };
        
        this._dashboardState.set({ 
            stats,
            status: runnerState.status
        });
    }
    
    _startAutoRefresh() {
        this._updateInterval = setInterval(() => {
            this._updateStats();
        }, 100);
    }
    
    _stopAutoRefresh() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
    }
    
    // UI Actions
    async runAllTests() {
        this._dashboardState.set({
            status: 'running',
            startTime: Date.now(),
            endTime: null
        });
        
        await this._runner.runAll();
    }
    
    resetDashboard() {
        this._runner.reset();
        this._dashboardState.set({
            status: 'idle',
            startTime: null,
            endTime: null,
            totalDuration: 0,
            currentRun: null
        });
    }
    
    toggleAutoRefresh() {
        const current = this._dashboardState.get('autoRefresh');
        this._dashboardState.set({ autoRefresh: !current });
        
        if (!current) {
            this._startAutoRefresh();
        } else {
            this._stopAutoRefresh();
        }
    }
    
    setView(view) {
        this._dashboardState.set({ view });
    }
    
    createTemplate() {
        const state = this._dashboardState.getAll();
        const { stats, status, view, history, autoRefresh } = state;
        
        return html`
            <style>
                :host {
                    display: block;
                    background: #0a0a0a;
                    color: #fff;
                    font-family: 'SF Mono', Monaco, monospace;
                    padding: 20px;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #222;
                }
                
                .title {
                    font-size: 32px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #f39c12, #e74c3c, #9b59b6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .controls {
                    display: flex;
                    gap: 10px;
                }
                
                button {
                    padding: 10px 20px;
                    background: #1a1a1a;
                    border: 2px solid #333;
                    color: #fff;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                
                button:hover {
                    background: #222;
                    border-color: #f39c12;
                    transform: translateY(-1px);
                }
                
                button.primary {
                    background: #f39c12;
                    color: #000;
                    border-color: #f39c12;
                }
                
                button.primary:hover {
                    background: #e67e22;
                    border-color: #e67e22;
                }
                
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: #1a1a1a;
                    padding: 25px;
                    border-radius: 12px;
                    border: 2px solid #333;
                    text-align: center;
                    transition: all 0.3s;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.5);
                }
                
                .stat-value {
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .stat-label {
                    font-size: 14px;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .stat-card.total { border-color: #3498db; }
                .stat-card.total .stat-value { color: #3498db; }
                
                .stat-card.passed { border-color: #27ae60; }
                .stat-card.passed .stat-value { color: #27ae60; }
                
                .stat-card.failed { border-color: #e74c3c; }
                .stat-card.failed .stat-value { color: #e74c3c; }
                
                .stat-card.running { border-color: #f39c12; }
                .stat-card.running .stat-value { color: #f39c12; }
                
                .progress-bar {
                    height: 8px;
                    background: #1a1a1a;
                    border-radius: 4px;
                    margin-bottom: 30px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #27ae60, #f39c12);
                    transition: width 0.3s ease;
                    border-radius: 4px;
                }
                
                .view-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #222;
                    padding-bottom: 10px;
                }
                
                .tab {
                    padding: 8px 16px;
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 8px 8px 0 0;
                }
                
                .tab:hover {
                    color: #fff;
                    background: #1a1a1a;
                }
                
                .tab.active {
                    color: #f39c12;
                    background: #1a1a1a;
                    border-bottom: 2px solid #f39c12;
                }
                
                .content-area {
                    min-height: 300px;
                    background: #1a1a1a;
                    border-radius: 12px;
                    padding: 20px;
                }
                
                .history-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .history-item {
                    padding: 10px;
                    margin: 5px 0;
                    background: #0a0a0a;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .history-item.passed {
                    border-left: 4px solid #27ae60;
                }
                
                .history-item.failed {
                    border-left: 4px solid #e74c3c;
                }
                
                .auto-refresh {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 12px;
                    color: #888;
                }
                
                .toggle {
                    width: 40px;
                    height: 20px;
                    background: #333;
                    border-radius: 10px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .toggle.active {
                    background: #27ae60;
                }
                
                .toggle-handle {
                    width: 16px;
                    height: 16px;
                    background: #fff;
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.2s;
                }
                
                .toggle.active .toggle-handle {
                    transform: translateX(20px);
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .running-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #f39c12;
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                    margin-left: 10px;
                }
            </style>
            
            <div class="header">
                <div class="title">
                    ${state.title}
                    ${status === 'running' ? html`<span class="running-indicator"></span>` : ''}
                </div>
                <div class="controls">
                    <div class="auto-refresh">
                        <span>Auto Refresh</span>
                        <div class="toggle ${autoRefresh ? 'active' : ''}" 
                             @click=${() => this.toggleAutoRefresh()}>
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                    <button 
                        class="primary"
                        @click=${() => this.runAllTests()}
                        ?disabled=${status === 'running'}
                    >
                        ${status === 'running' ? 'Running...' : 'Run All Tests'}
                    </button>
                    <button @click=${() => this.resetDashboard()}>Reset</button>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card total">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat-card passed">
                    <div class="stat-value">${stats.passed}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat-card failed">
                    <div class="stat-value">${stats.failed}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-card running">
                    <div class="stat-value">${stats.running}</div>
                    <div class="stat-label">Running</div>
                </div>
            </div>
            
            ${stats.total > 0 ? html`
                <div class="progress-bar">
                    <div class="progress-fill" 
                         style="width: ${((stats.passed + stats.failed) / stats.total) * 100}%">
                    </div>
                </div>
            ` : ''}
            
            <div class="view-tabs">
                <button 
                    class="tab ${view === 'overview' ? 'active' : ''}"
                    @click=${() => this.setView('overview')}
                >
                    Overview
                </button>
                <button 
                    class="tab ${view === 'details' ? 'active' : ''}"
                    @click=${() => this.setView('details')}
                >
                    Test Details
                </button>
                <button 
                    class="tab ${view === 'history' ? 'active' : ''}"
                    @click=${() => this.setView('history')}
                >
                    History
                </button>
            </div>
            
            <div class="content-area">
                ${this._renderContent()}
            </div>
            
            <slot></slot>
        `;
    }
    
    _renderContent() {
        const { view, history } = this._dashboardState.getAll();
        
        switch (view) {
            case 'overview':
                return html`
                    <div class="overview">
                        <h3>Test Runner</h3>
                        <p>Add test components to the dashboard to see them here.</p>
                        ${this._runner ? html`
                            <div style="margin-top: 20px;">
                                ${this._runner}
                            </div>
                        ` : ''}
                    </div>
                `;
                
            case 'details':
                return html`
                    <div class="details">
                        <h3>Test Details</h3>
                        <p>Detailed test information will appear here during execution.</p>
                    </div>
                `;
                
            case 'history':
                return html`
                    <div class="history">
                        <h3>Test History</h3>
                        ${history.length > 0 ? html`
                            <div class="history-list">
                                ${history.reverse().map(item => html`
                                    <div class="history-item ${item.result.passed ? 'passed' : 'failed'}">
                                        <span>${item.name}</span>
                                        <span>${new Date(item.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                `)}
                            </div>
                        ` : html`
                            <p>No test history yet.</p>
                        `}
                    </div>
                `;
                
            default:
                return '';
        }
    }
}

// Register the dashboard component
customElements.define('brutal-test-dashboard', BrutalTestDashboard);