/**
 * BRUTAL V4 - Lifecycle Hooks Test
 * Tests the enhanced component with lifecycle hooks
 */

import { EnhancedBrutalComponent, HookPhase } from '../core/components/EnhancedComponent.js';
import { html, css } from '../core/templates/index.js';

export class LifecycleTestComponent extends EnhancedBrutalComponent {
    static get observedAttributes() {
        return ['test-value'];
    }

    constructor() {
        super();
        
        this.hookLog = [];
        
        // Register hooks for all phases
        Object.values(HookPhase).forEach(phase => {
            this.hook(phase, (...args) => {
                this.hookLog.push({
                    phase,
                    time: Date.now(),
                    args
                });
                console.log(`[Hook] ${phase}`, args);
            });
        });
    }

    createTemplate() {
        const testValue = this.getAttribute('test-value') || 'default';
        
        this._template = html`
            <div class="test-container">
                <h3>Lifecycle Hooks Test</h3>
                <p>Test Value: ${testValue}</p>
                <p>Render Count: ${this._renderCount}</p>
                <div class="hook-log">
                    <h4>Hook Execution Log:</h4>
                    <ul>
                        ${this.hookLog.map(entry => html`
                            <li>${entry.phase} - ${new Date(entry.time).toLocaleTimeString()}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="actions">
                    <button @click=${() => this.updateAttribute()}>Update Attribute</button>
                    <button @click=${() => this.forceRender()}>Force Render</button>
                    <button @click=${() => this.triggerError()}>Trigger Error</button>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        
        this.setStyles(css`
            :host {
                display: block;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 20px;
                border: 2px solid #0066cc;
                border-radius: 8px;
                margin: 20px;
            }
            
            .test-container {
                background: white;
            }
            
            h3 {
                color: #0066cc;
                margin-top: 0;
            }
            
            .hook-log {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                margin: 15px 0;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .hook-log h4 {
                margin-top: 0;
                color: #666;
            }
            
            .hook-log ul {
                list-style: none;
                padding: 0;
                margin: 0;
                font-family: monospace;
                font-size: 12px;
            }
            
            .hook-log li {
                padding: 4px 0;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .actions {
                margin-top: 15px;
            }
            
            button {
                padding: 8px 16px;
                margin-right: 8px;
                border: none;
                border-radius: 4px;
                background: #0066cc;
                color: white;
                cursor: pointer;
            }
            
            button:hover {
                background: #0052a3;
            }
        `);
    }

    updateAttribute() {
        const current = this.getAttribute('test-value') || 'default';
        const newValue = `updated-${Date.now()}`;
        this.setAttribute('test-value', newValue);
    }

    triggerError() {
        // This will trigger errorCaptured hook
        throw new Error('Test error from component');
    }

    // Hook to see stats
    onRender() {
        super.onRender();
        
        // Log hook statistics
        const stats = this.getHookStats();
        console.log('Hook Statistics:', stats);
    }
}

// Define the component
EnhancedBrutalComponent.define.call(
    LifecycleTestComponent,
    'lifecycle-test',
    { debug: true }
);