/**
 * BrutalTestRunner - Visual Test Orchestrator Component
 * 
 * A component that discovers, runs, and visualizes test execution.
 * True to the symbiotic philosophy - the test runner IS a component.
 */

import { BrutalComponent } from '../../core/foundation/Component.js';
import { BrutalState } from '../../core/state/State.js';
import { html } from '../../core/templates/index.js';
import { BrutalTest } from '../core/BrutalTest.js';

export class BrutalTestRunner extends BrutalComponent {
    constructor() {
        super();
        
        // Runner state
        this._runnerState = new BrutalState({
            status: 'idle', // idle | discovering | running | complete
            tests: [],
            currentTest: null,
            results: {
                total: 0,
                passed: 0,
                failed: 0,
                duration: 0
            },
            startTime: 0,
            endTime: 0,
            filter: '',
            autoRun: false
        });
        
        // React to state changes
        this._runnerState.on('change', () => this.render());
        
        // Test registry
        this._testRegistry = new Map();
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Auto-discover tests on connect
        this.discoverTests();
        
        // Auto-run if attribute set
        if (this.hasAttribute('autorun')) {
            this._runnerState.set({ autoRun: true });
            requestAnimationFrame(() => this.runAll());
        }
    }
    
    // Discover all test components
    discoverTests() {
        this._runnerState.set({ status: 'discovering' });
        
        // Find all BrutalTest instances
        const tests = [];
        
        // Check children
        const testElements = this.querySelectorAll('[is-test], brutal-test');
        testElements.forEach(el => {
            if (el instanceof BrutalTest) {
                tests.push({
                    id: el.id || `test-${tests.length}`,
                    name: el.constructor.name,
                    element: el,
                    status: 'pending',
                    result: null
                });
            }
        });
        
        // Check registered test classes
        this._testRegistry.forEach((TestClass, name) => {
            const existing = tests.find(t => t.name === name);
            if (!existing) {
                tests.push({
                    id: `test-${tests.length}`,
                    name,
                    class: TestClass,
                    status: 'pending',
                    result: null
                });
            }
        });
        
        this._runnerState.set({ 
            tests,
            status: 'idle',
            'results.total': tests.length
        });
        
        return tests;
    }
    
    // Register a test class
    registerTest(name, TestClass) {
        this._testRegistry.set(name, TestClass);
        this.discoverTests();
    }
    
    // Run all tests
    async runAll() {
        const tests = this._runnerState.get('tests');
        if (tests.length === 0) {
            this.discoverTests();
        }
        
        this._runnerState.set({
            status: 'running',
            startTime: performance.now(),
            results: {
                total: tests.length,
                passed: 0,
                failed: 0,
                duration: 0
            }
        });
        
        // Run tests sequentially
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            await this.runTest(test);
        }
        
        const endTime = performance.now();
        const duration = endTime - this._runnerState.get('startTime');
        
        this._runnerState.set({
            status: 'complete',
            endTime,
            'results.duration': duration
        });
        
        // Emit completion event
        this.emit('runner:complete', this._runnerState.get('results'));
    }
    
    // Run a single test
    async runTest(testInfo) {
        this._runnerState.set({ currentTest: testInfo.id });
        
        try {
            // Create or get test instance
            let testInstance;
            if (testInfo.element) {
                testInstance = testInfo.element;
            } else if (testInfo.class) {
                testInstance = new testInfo.class();
                // Add to DOM for visual feedback
                this.appendChild(testInstance);
            }
            
            // Update test status
            const tests = this._runnerState.get('tests');
            const testIndex = tests.findIndex(t => t.id === testInfo.id);
            tests[testIndex].status = 'running';
            this._runnerState.set({ tests: [...tests] });
            
            // Run the test
            await testInstance.run();
            const result = testInstance.getResults();
            
            // Update results
            tests[testIndex].status = result.passed ? 'passed' : 'failed';
            tests[testIndex].result = result;
            
            const results = this._runnerState.get('results');
            if (result.passed) {
                results.passed++;
            } else {
                results.failed++;
            }
            
            this._runnerState.set({ 
                tests: [...tests],
                results: { ...results }
            });
            
            // Emit test completion
            this.emit('test:complete', { test: testInfo, result });
            
        } catch (error) {
            // Handle test errors
            const tests = this._runnerState.get('tests');
            const testIndex = tests.findIndex(t => t.id === testInfo.id);
            tests[testIndex].status = 'failed';
            tests[testIndex].result = {
                passed: false,
                error: error.message
            };
            
            const results = this._runnerState.get('results');
            results.failed++;
            
            this._runnerState.set({ 
                tests: [...tests],
                results: { ...results }
            });
        }
        
        this._runnerState.set({ currentTest: null });
    }
    
    // Filter tests
    filterTests(query) {
        this._runnerState.set({ filter: query });
    }
    
    // Get filtered tests
    getFilteredTests() {
        const tests = this._runnerState.get('tests');
        const filter = this._runnerState.get('filter').toLowerCase();
        
        if (!filter) return tests;
        
        return tests.filter(test => 
            test.name.toLowerCase().includes(filter)
        );
    }
    
    // Reset runner
    reset() {
        this._runnerState.set({
            status: 'idle',
            currentTest: null,
            results: {
                total: 0,
                passed: 0,
                failed: 0,
                duration: 0
            },
            startTime: 0,
            endTime: 0
        });
        
        // Reset test statuses
        const tests = this._runnerState.get('tests');
        tests.forEach(test => {
            test.status = 'pending';
            test.result = null;
        });
        this._runnerState.set({ tests: [...tests] });
    }
    
    // Visual template
    createTemplate() {
        const state = this._runnerState.getAll();
        const filteredTests = this.getFilteredTests();
        const { results, status } = state;
        
        return html`
            <style>
                :host {
                    display: block;
                    padding: 20px;
                    background: #0a0a0a;
                    color: #fff;
                    font-family: 'SF Mono', Monaco, monospace;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #333;
                }
                
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    background: linear-gradient(45deg, #f39c12, #e74c3c);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .controls {
                    display: flex;
                    gap: 10px;
                }
                
                button {
                    padding: 8px 16px;
                    background: #1a1a1a;
                    border: 2px solid #333;
                    color: #fff;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                
                button:hover {
                    background: #222;
                    border-color: #f39c12;
                }
                
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .filter {
                    margin-bottom: 20px;
                }
                
                input {
                    width: 100%;
                    padding: 10px;
                    background: #1a1a1a;
                    border: 2px solid #333;
                    color: #fff;
                    border-radius: 6px;
                    font-family: inherit;
                }
                
                input:focus {
                    outline: none;
                    border-color: #f39c12;
                }
                
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .stat {
                    padding: 15px;
                    background: #1a1a1a;
                    border-radius: 8px;
                    text-align: center;
                    border: 2px solid #333;
                }
                
                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }
                
                .stat.passed .stat-value {
                    color: #27ae60;
                }
                
                .stat.failed .stat-value {
                    color: #e74c3c;
                }
                
                .stat.duration .stat-value {
                    color: #f39c12;
                }
                
                .progress {
                    height: 4px;
                    background: #1a1a1a;
                    border-radius: 2px;
                    margin-bottom: 20px;
                    overflow: hidden;
                }
                
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #27ae60, #f39c12);
                    transition: width 0.3s ease;
                }
                
                .test-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .test-item {
                    padding: 12px;
                    background: #1a1a1a;
                    border-radius: 6px;
                    border: 2px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                }
                
                .test-item.running {
                    border-color: #f39c12;
                    background: #1a1a0a;
                }
                
                .test-item.passed {
                    border-color: #27ae60;
                    background: #0a1a0a;
                }
                
                .test-item.failed {
                    border-color: #e74c3c;
                    background: #1a0a0a;
                }
                
                .test-name {
                    font-weight: bold;
                }
                
                .test-status {
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                
                .test-status.pending {
                    background: #333;
                    color: #999;
                }
                
                .test-status.running {
                    background: #f39c12;
                    color: #000;
                }
                
                .test-status.passed {
                    background: #27ae60;
                    color: #000;
                }
                
                .test-status.failed {
                    background: #e74c3c;
                    color: #fff;
                }
                
                .empty {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
            </style>
            
            <div class="header">
                <div class="title">BRUTAL Test Runner</div>
                <div class="controls">
                    <button 
                        @click=${() => this.runAll()} 
                        ?disabled=${status === 'running'}
                    >
                        ${status === 'running' ? 'Running...' : 'Run All'}
                    </button>
                    <button @click=${() => this.reset()}>Reset</button>
                    <button @click=${() => this.discoverTests()}>Discover</button>
                </div>
            </div>
            
            <div class="filter">
                <input 
                    type="text" 
                    placeholder="Filter tests..."
                    value=${state.filter}
                    @input=${(e) => this.filterTests(e.target.value)}
                />
            </div>
            
            ${results.total > 0 ? html`
                <div class="stats">
                    <div class="stat">
                        <div class="stat-value">${results.total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat passed">
                        <div class="stat-value">${results.passed}</div>
                        <div class="stat-label">Passed</div>
                    </div>
                    <div class="stat failed">
                        <div class="stat-value">${results.failed}</div>
                        <div class="stat-label">Failed</div>
                    </div>
                    ${results.duration > 0 ? html`
                        <div class="stat duration">
                            <div class="stat-value">${results.duration.toFixed(0)}ms</div>
                            <div class="stat-label">Duration</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="progress">
                    <div 
                        class="progress-bar" 
                        style="width: ${(results.passed + results.failed) / results.total * 100}%"
                    ></div>
                </div>
            ` : ''}
            
            <div class="test-list">
                ${filteredTests.length > 0 ? filteredTests.map(test => html`
                    <div class="test-item ${test.status}">
                        <div class="test-name">${test.name}</div>
                        <div class="test-status ${test.status}">
                            ${test.status}
                        </div>
                    </div>
                `) : html`
                    <div class="empty">
                        No tests found. Add test components or register test classes.
                    </div>
                `}
            </div>
            
            <slot></slot>
        `;
    }
}

// Register as custom element
customElements.define('brutal-test-runner', BrutalTestRunner);