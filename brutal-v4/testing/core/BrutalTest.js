/**
 * BrutalTest - Base Test Component
 * 
 * Philosophy: Tests ARE components that extend BrutalComponent.
 * They use the same systems they test - truly symbiotic.
 */

import { BrutalComponent } from '../../core/foundation/Component.js';
import { BrutalState } from '../../core/state/State.js';
import { html } from '../../core/templates/index.js';
import { BrutalTestErrorCapture } from './BrutalTestErrorCapture.js';

export class BrutalTest extends BrutalComponent {
    constructor() {
        super();
        
        // Error capture is integral to every test
        this._errorCapture = new BrutalTestErrorCapture();
        
        // Test state using BrutalState (dogfooding)
        this._testState = new BrutalState({
            name: this.constructor.name,
            phase: 'pending', // pending | setup | running | passed | failed
            startTime: 0,
            endTime: 0,
            duration: 0,
            assertions: [],
            errors: [],
            metrics: {
                memory: { before: 0, after: 0 },
                renders: 0,
                stateChanges: 0
            },
            errorCapture: {
                enabled: true,
                errors: [],
                summary: {}
            }
        });
        
        // Reactive state updates trigger re-renders
        this._testState.on('change', () => this.render());
        
        // Track metrics
        this._trackMetrics();
    }
    
    // Test lifecycle methods (to be implemented by subclasses)
    async setup() {
        // Override in subclasses for test setup
    }
    
    async execute() {
        // Override in subclasses for test logic
        throw new Error('execute() must be implemented');
    }
    
    async teardown() {
        // Override in subclasses for cleanup
    }
    
    // Main test runner
    async run() {
        try {
            // Initialize error capture for this test run
            this._errorCapture.init();
            
            // Listen for errors during test execution
            this._errorCapture.on('error', (errorData) => {
                const currentErrors = this._testState.get('errorCapture.errors');
                this._testState.set({
                    'errorCapture.errors': [...currentErrors, errorData]
                });
            });
            
            this._testState.set({
                phase: 'setup',
                startTime: performance.now()
            });
            
            await this.setup();
            
            this._testState.set({ 
                phase: 'running',
                'metrics.memory.before': performance.memory?.usedJSHeapSize || 0
            });
            
            await this.execute();
            
            this._testState.set({
                phase: 'passed',
                endTime: performance.now(),
                'metrics.memory.after': performance.memory?.usedJSHeapSize || 0
            });
            
        } catch (error) {
            this._testState.set({
                phase: 'failed',
                endTime: performance.now(),
                errors: [...this._testState.get('errors'), {
                    message: error.message,
                    stack: error.stack,
                    timestamp: Date.now()
                }]
            });
        } finally {
            await this.teardown();
            
            const duration = this._testState.get('endTime') - this._testState.get('startTime');
            this._testState.set({ duration });
            
            // Capture error summary
            const errorSummary = this._errorCapture.getSummary();
            this._testState.set({ 'errorCapture.summary': errorSummary });
            
            // Clean up error capture
            this._errorCapture.destroy();
            
            // Emit test completion event
            this.emit('test:complete', this.getResults());
        }
    }
    
    // Assertion method
    assert(condition, message = '') {
        const assertion = {
            passed: !!condition,
            message,
            timestamp: performance.now()
        };
        
        this._testState.set({
            assertions: [...this._testState.get('assertions'), assertion]
        });
        
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
        
        return this;
    }
    
    // Get test results
    getResults() {
        const state = this._testState.getAll();
        const assertions = state.assertions;
        
        return {
            name: state.name,
            phase: state.phase,
            passed: state.phase === 'passed',
            duration: state.duration,
            assertions: {
                total: assertions.length,
                passed: assertions.filter(a => a.passed).length,
                failed: assertions.filter(a => !a.passed).length,
                details: assertions
            },
            errors: state.errors,
            metrics: state.metrics,
            errorCapture: state.errorCapture
        };
    }
    
    // Track performance metrics
    _trackMetrics() {
        // Count renders
        const originalRender = this.render.bind(this);
        this.render = () => {
            this._testState.set({
                'metrics.renders': this._testState.get('metrics.renders') + 1
            });
            return originalRender();
        };
        
        // Count state changes
        this._state.on('change', () => {
            this._testState.set({
                'metrics.stateChanges': this._testState.get('metrics.stateChanges') + 1
            });
        });
    }
    
    // Visual representation of the test
    createTemplate() {
        const { name, phase, duration, assertions, errors } = this._testState.getAll();
        const assertionStats = {
            total: assertions.length,
            passed: assertions.filter(a => a.passed).length,
            failed: assertions.filter(a => !a.passed).length
        };
        
        return html`
            <style>
                :host {
                    display: block;
                    margin: 8px;
                    padding: 16px;
                    border-radius: 8px;
                    background: var(--bg-color, #1a1a1a);
                    border: 2px solid var(--border-color, #333);
                    transition: all 0.3s ease;
                    font-family: 'SF Mono', Monaco, monospace;
                }
                
                :host([phase="pending"]) {
                    --border-color: #666;
                }
                
                :host([phase="setup"]),
                :host([phase="running"]) {
                    --border-color: #f39c12;
                    --bg-color: #1a1a0a;
                }
                
                :host([phase="passed"]) {
                    --border-color: #27ae60;
                    --bg-color: #0a1a0a;
                }
                
                :host([phase="failed"]) {
                    --border-color: #e74c3c;
                    --bg-color: #1a0a0a;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .name {
                    font-size: 16px;
                    font-weight: bold;
                    color: #fff;
                }
                
                .phase {
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    background: var(--border-color);
                    color: #000;
                    text-transform: uppercase;
                }
                
                .metrics {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .metric {
                    padding: 8px;
                    background: #0a0a0a;
                    border-radius: 4px;
                    text-align: center;
                }
                
                .metric-value {
                    font-size: 20px;
                    color: var(--border-color);
                    font-weight: bold;
                }
                
                .metric-label {
                    font-size: 10px;
                    color: #666;
                    text-transform: uppercase;
                }
                
                .assertions {
                    margin-top: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .assertion {
                    padding: 4px 8px;
                    margin: 2px 0;
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .assertion.passed {
                    background: #27ae6022;
                    color: #27ae60;
                }
                
                .assertion.failed {
                    background: #e74c3c22;
                    color: #e74c3c;
                }
                
                .error {
                    margin-top: 8px;
                    padding: 8px;
                    background: #e74c3c22;
                    border-radius: 4px;
                    color: #e74c3c;
                    font-size: 12px;
                    white-space: pre-wrap;
                }
            </style>
            
            <div class="header">
                <div class="name">${name}</div>
                <div class="phase">${phase}</div>
            </div>
            
            ${phase !== 'pending' ? html`
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-value">${assertionStats.passed}/${assertionStats.total}</div>
                        <div class="metric-label">Assertions</div>
                    </div>
                    ${duration > 0 ? html`
                        <div class="metric">
                            <div class="metric-value">${duration.toFixed(2)}ms</div>
                            <div class="metric-label">Duration</div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${assertions.length > 0 ? html`
                <div class="assertions">
                    ${assertions.map(a => html`
                        <div class="assertion ${a.passed ? 'passed' : 'failed'}">
                            ${a.passed ? '✓' : '✗'} ${a.message}
                        </div>
                    `)}
                </div>
            ` : ''}
            
            ${errors.length > 0 ? html`
                ${errors.map(e => html`
                    <div class="error">
                        ${e.message}
                    </div>
                `)}
            ` : ''}
        `;
    }
    
    // Update host attributes for styling
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        
        if (name === 'phase') {
            this.setAttribute('phase', newValue);
        }
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Auto-run if has autorun attribute
        if (this.hasAttribute('autorun')) {
            requestAnimationFrame(() => this.run());
        }
    }
}

// Register as custom element
customElements.define('brutal-test', BrutalTest);