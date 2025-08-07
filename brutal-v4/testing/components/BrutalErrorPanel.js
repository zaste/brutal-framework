/**
 * BrutalErrorPanel - Visual Error Display Component
 * 
 * A component that visualizes captured errors in real-time.
 * Part of the symbiotic test system - errors are components too.
 */

import { BrutalComponent } from '../../core/foundation/Component.js';
import { BrutalState } from '../../core/state/State.js';
import { html } from '../../core/templates/index.js';

export class BrutalErrorPanel extends BrutalComponent {
    constructor() {
        super();
        
        // Error panel state
        this._panelState = new BrutalState({
            errors: [],
            filter: 'all', // all | runtime | console | network | promise
            expanded: true,
            autoScroll: true,
            maxErrors: 100
        });
        
        // React to state changes
        this._panelState.on('change', () => this.render());
    }
    
    /**
     * Add an error to the panel
     */
    addError(error) {
        const errors = [...this._panelState.get('errors'), error];
        
        // Limit number of errors
        const maxErrors = this._panelState.get('maxErrors');
        if (errors.length > maxErrors) {
            errors.shift();
        }
        
        this._panelState.set({ errors });
        
        // Auto scroll if enabled
        if (this._panelState.get('autoScroll')) {
            requestAnimationFrame(() => {
                const container = this.shadowRoot?.querySelector('.error-list');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        }
    }
    
    /**
     * Clear all errors
     */
    clearErrors() {
        this._panelState.set({ errors: [] });
    }
    
    /**
     * Set error filter
     */
    setFilter(filter) {
        this._panelState.set({ filter });
    }
    
    /**
     * Toggle panel expansion
     */
    toggleExpanded() {
        this._panelState.set({ 
            expanded: !this._panelState.get('expanded') 
        });
    }
    
    /**
     * Get filtered errors
     */
    getFilteredErrors() {
        const errors = this._panelState.get('errors');
        const filter = this._panelState.get('filter');
        
        if (filter === 'all') return errors;
        
        return errors.filter(error => error.category === filter);
    }
    
    /**
     * Format error for display
     */
    formatError(error) {
        const time = new Date(error.timestamp).toLocaleTimeString();
        
        let message = error.message || 'Unknown error';
        let location = '';
        
        if (error.filename) {
            location = `${error.filename}:${error.line}:${error.column}`;
        } else if (error.url) {
            location = error.url;
        }
        
        return { time, message, location };
    }
    
    createTemplate() {
        const state = this._panelState.getAll();
        const { expanded, filter } = state;
        const errors = this.getFilteredErrors();
        
        const errorCounts = {
            all: state.errors.length,
            runtime: state.errors.filter(e => e.category === 'runtime').length,
            console: state.errors.filter(e => e.category === 'console').length,
            network: state.errors.filter(e => e.category === 'network').length,
            promise: state.errors.filter(e => e.category === 'promise').length
        };
        
        return html`
            <style>
                :host {
                    display: block;
                    background: #0a0a0a;
                    border: 2px solid #333;
                    border-radius: 8px;
                    overflow: hidden;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: #1a1a1a;
                    border-bottom: 1px solid #333;
                    cursor: pointer;
                }
                
                .title {
                    font-weight: bold;
                    color: #f39c12;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .error-count {
                    background: #e74c3c;
                    color: #fff;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                }
                
                .controls {
                    display: flex;
                    gap: 8px;
                }
                
                button {
                    background: #222;
                    border: 1px solid #444;
                    color: #aaa;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                }
                
                button:hover {
                    background: #333;
                    color: #fff;
                }
                
                button.active {
                    background: #f39c12;
                    color: #000;
                    border-color: #f39c12;
                }
                
                .content {
                    display: ${expanded ? 'block' : 'none'};
                }
                
                .filters {
                    display: flex;
                    gap: 4px;
                    padding: 8px;
                    background: #151515;
                    border-bottom: 1px solid #333;
                }
                
                .error-list {
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 8px;
                }
                
                .error-item {
                    padding: 8px;
                    margin-bottom: 4px;
                    background: #1a1a1a;
                    border-radius: 4px;
                    border-left: 3px solid #666;
                }
                
                .error-item.runtime {
                    border-left-color: #e74c3c;
                }
                
                .error-item.console {
                    border-left-color: #f39c12;
                }
                
                .error-item.network {
                    border-left-color: #3498db;
                }
                
                .error-item.promise {
                    border-left-color: #9b59b6;
                }
                
                .error-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                
                .error-type {
                    color: #888;
                    font-size: 10px;
                    text-transform: uppercase;
                }
                
                .error-time {
                    color: #666;
                    font-size: 10px;
                }
                
                .error-message {
                    color: #fff;
                    word-break: break-word;
                }
                
                .error-location {
                    color: #666;
                    font-size: 10px;
                    margin-top: 4px;
                }
                
                .empty {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                }
                
                .expand-icon {
                    transition: transform 0.2s;
                    display: inline-block;
                }
                
                .expand-icon.collapsed {
                    transform: rotate(-90deg);
                }
            </style>
            
            <div class="header" @click=${() => this.toggleExpanded()}>
                <div class="title">
                    <span class="expand-icon ${expanded ? '' : 'collapsed'}">▼</span>
                    Error Capture
                    ${errorCounts.all > 0 ? html`
                        <span class="error-count">${errorCounts.all}</span>
                    ` : ''}
                </div>
                <div class="controls" @click=${(e) => e.stopPropagation()}>
                    <button @click=${() => this.clearErrors()}>Clear</button>
                </div>
            </div>
            
            <div class="content">
                <div class="filters">
                    <button 
                        class="${filter === 'all' ? 'active' : ''}"
                        @click=${() => this.setFilter('all')}
                    >
                        All (${errorCounts.all})
                    </button>
                    <button 
                        class="${filter === 'runtime' ? 'active' : ''}"
                        @click=${() => this.setFilter('runtime')}
                    >
                        Runtime (${errorCounts.runtime})
                    </button>
                    <button 
                        class="${filter === 'console' ? 'active' : ''}"
                        @click=${() => this.setFilter('console')}
                    >
                        Console (${errorCounts.console})
                    </button>
                    <button 
                        class="${filter === 'network' ? 'active' : ''}"
                        @click=${() => this.setFilter('network')}
                    >
                        Network (${errorCounts.network})
                    </button>
                    <button 
                        class="${filter === 'promise' ? 'active' : ''}"
                        @click=${() => this.setFilter('promise')}
                    >
                        Promise (${errorCounts.promise})
                    </button>
                </div>
                
                <div class="error-list">
                    ${errors.length > 0 ? errors.map(error => {
                        const formatted = this.formatError(error);
                        return html`
                            <div class="error-item ${error.category}">
                                <div class="error-header">
                                    <span class="error-type">${error.type}</span>
                                    <span class="error-time">${formatted.time}</span>
                                </div>
                                <div class="error-message">${formatted.message}</div>
                                ${formatted.location ? html`
                                    <div class="error-location">${formatted.location}</div>
                                ` : ''}
                            </div>
                        `;
                    }) : html`
                        <div class="empty">No errors captured</div>
                    `}
                </div>
            </div>
        `;
    }
}

// Register the error panel component
customElements.define('brutal-error-panel', BrutalErrorPanel);