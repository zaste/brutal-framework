/**
 * BRUTAL V4 - Directives Demo Component
 * Demonstrates template directives usage
 */

import { BrutalComponent } from '../core/foundation/Component.js';
import { html, css } from '../core/templates/index.js';
import { Registry } from '../core/base/Registry.js';

export class DirectivesDemo extends BrutalComponent {
    constructor() {
        super();
        
        // Initialize state
        this.initializeState();
        this._state.set({
            showMessage: true,
            items: ['Apple', 'Banana', 'Orange', 'Grape'],
            selectedIndex: -1,
            dynamicClasses: {
                'highlight': false,
                'bordered': true
            },
            dynamicStyles: {
                fontSize: '16px',
                color: '#333'
            }
        });
    }

    createTemplate() {
        const state = this._state.get();
        
        this._template = html`
            <div class="demo-container">
                <h2>Template Directives Demo</h2>
                
                <!-- :if directive -->
                <section>
                    <h3>Conditional Rendering (:if)</h3>
                    <button @click=${() => this.toggleMessage()}>
                        Toggle Message
                    </button>
                    <p :if="${state.showMessage}" class="message">
                        This message is conditionally rendered!
                    </p>
                </section>

                <!-- :for directive -->
                <section>
                    <h3>List Rendering (:for)</h3>
                    <ul>
                        <li :for="item in ${state.items}" 
                            @click=${() => this.selectItem('${item}')}>
                            ${item} ${state.selectedIndex === state.items.indexOf('${item}') ? '✓' : ''}
                        </li>
                    </ul>
                    <p>Selected: ${state.selectedIndex >= 0 ? state.items[state.selectedIndex] : 'None'}</p>
                </section>

                <!-- :show directive -->
                <section>
                    <h3>Visibility Control (:show)</h3>
                    <div :show="${state.selectedIndex >= 0}" class="selection-info">
                        You selected item at index ${state.selectedIndex}
                    </div>
                </section>

                <!-- :class directive -->
                <section>
                    <h3>Dynamic Classes (:class)</h3>
                    <button @click=${() => this.toggleClass('highlight')}>
                        Toggle Highlight
                    </button>
                    <button @click=${() => this.toggleClass('bordered')}>
                        Toggle Border
                    </button>
                    <div :class="${state.dynamicClasses}" class="dynamic-box">
                        Dynamic class binding
                    </div>
                </section>

                <!-- :style directive -->
                <section>
                    <h3>Dynamic Styles (:style)</h3>
                    <button @click=${() => this.changeFontSize()}>
                        Change Font Size
                    </button>
                    <button @click=${() => this.changeColor()}>
                        Change Color
                    </button>
                    <div :style="${state.dynamicStyles}" class="styled-box">
                        Dynamic style binding
                    </div>
                </section>

                <!-- :ref directive -->
                <section>
                    <h3>Element References (:ref)</h3>
                    <input :ref="myInput" type="text" placeholder="Focus me programmatically">
                    <button @click=${() => this.focusInput()}>
                        Focus Input
                    </button>
                </section>
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
            }
            
            .demo-container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            section {
                margin: 30px 0;
                padding: 20px;
                background: #f5f5f5;
                border-radius: 8px;
            }
            
            h2 {
                color: #333;
                margin-top: 0;
            }
            
            h3 {
                color: #666;
                margin-top: 0;
            }
            
            button {
                padding: 8px 16px;
                margin: 0 8px 8px 0;
                border: none;
                border-radius: 4px;
                background: #0066cc;
                color: white;
                cursor: pointer;
            }
            
            button:hover {
                background: #0052a3;
            }
            
            .message {
                padding: 12px;
                background: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 4px;
                color: #155724;
            }
            
            ul {
                list-style: none;
                padding: 0;
            }
            
            li {
                padding: 8px 12px;
                margin: 4px 0;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            li:hover {
                background: #e9ecef;
            }
            
            .selection-info {
                padding: 12px;
                background: #cfe2ff;
                border: 1px solid #b6d4fe;
                border-radius: 4px;
                color: #084298;
            }
            
            .dynamic-box, .styled-box {
                padding: 20px;
                margin: 10px 0;
                background: white;
                border-radius: 4px;
                transition: all 0.3s;
            }
            
            .highlight {
                background: #fff3cd !important;
            }
            
            .bordered {
                border: 2px solid #0066cc !important;
            }
            
            input {
                padding: 8px 12px;
                margin-right: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
            }
        `);
    }

    toggleMessage() {
        this._state.update(state => ({
            showMessage: !state.showMessage
        }));
    }

    selectItem(item) {
        const index = this._state.get('items').indexOf(item);
        this._state.set('selectedIndex', index);
    }

    toggleClass(className) {
        this._state.update(state => ({
            dynamicClasses: {
                ...state.dynamicClasses,
                [className]: !state.dynamicClasses[className]
            }
        }));
    }

    changeFontSize() {
        const sizes = ['14px', '16px', '18px', '20px'];
        const current = this._state.get('dynamicStyles').fontSize;
        const index = sizes.indexOf(current);
        const next = sizes[(index + 1) % sizes.length];
        
        this._state.update(state => ({
            dynamicStyles: {
                ...state.dynamicStyles,
                fontSize: next
            }
        }));
    }

    changeColor() {
        const colors = ['#333', '#0066cc', '#28a745', '#dc3545'];
        const current = this._state.get('dynamicStyles').color;
        const index = colors.indexOf(current);
        const next = colors[(index + 1) % colors.length];
        
        this._state.update(state => ({
            dynamicStyles: {
                ...state.dynamicStyles,
                color: next
            }
        }));
    }

    focusInput() {
        const input = this.shadowRoot.querySelector('[data-ref="myInput"]');
        if (input) {
            input.focus();
            input.value = 'Focused!';
        }
    }
}

// Register component
Registry.register('directives-demo', DirectivesDemo);
customElements.define('directives-demo', DirectivesDemo);