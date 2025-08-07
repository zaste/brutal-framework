/**
 * Example component showing integration with new base modules
 */

import { BrutalComponent } from '../core/foundation/Component.js';
import { Registry } from '../core/base/Registry.js';
import { ConfigLoader } from '../core/base/ConfigLoader.js';
import { PolyfillStrategy } from '../core/base/PolyfillStrategy.js';
import { html, css } from '../core/templates/index.js';

export class IntegratedExample extends BrutalComponent {
    static get observedAttributes() {
        return ['theme', 'title'];
    }

    constructor() {
        super();
        
        // Check for required features
        if (!PolyfillStrategy.detect('constructableStyleSheets')) {
            console.log('Using fallback styles');
        }
        
        // Use config
        this.debug = ConfigLoader.get('debug');
    }

    createTemplate() {
        const theme = this.getAttribute('theme') || 'light';
        const title = this.getAttribute('title') || 'Integrated Component';
        
        this._template = html`
            <div class="container ${theme}">
                <h2>${title}</h2>
                <p>Framework version: ${ConfigLoader.get('version') || '4.0.0'}</p>
                <p>Debug mode: ${this.debug ? 'ON' : 'OFF'}</p>
                <p>Features detected:</p>
                <ul>
                    <li>Constructable StyleSheets: ${PolyfillStrategy.detect('constructableStyleSheets') ? '✓' : '✗'}</li>
                    <li>requestIdleCallback: ${PolyfillStrategy.detect('requestIdleCallback') ? '✓' : '✗'}</li>
                    <li>SharedArrayBuffer: ${PolyfillStrategy.detect('sharedArrayBuffer') ? '✓' : '✗'}</li>
                </ul>
                <slot></slot>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Set styles
        this.setStyles(css`
            :host {
                display: block;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 20px;
            }
            
            .container {
                border: 2px solid var(--border-color, #ccc);
                border-radius: 8px;
                padding: 20px;
                background: var(--bg-color, white);
                color: var(--text-color, black);
            }
            
            .container.dark {
                --bg-color: #1a1a1a;
                --text-color: white;
                --border-color: #444;
            }
            
            h2 {
                margin-top: 0;
                color: var(--primary-color, #0066cc);
            }
            
            ul {
                list-style: none;
                padding: 0;
            }
            
            li {
                padding: 4px 0;
            }
        `);
        
        // Listen for config changes
        ConfigLoader.eventBus.on('config:changed', ({ path, value }) => {
            if (path === 'debug') {
                this.debug = value;
                this.scheduleRender();
            }
        });
    }

    onAttributeChanged(name, oldValue, newValue) {
        if (name === 'theme' || name === 'title') {
            this.createTemplate();
        }
    }
}

// Register the component
Registry.register('integrated-example', IntegratedExample);

// Also register with native API for immediate use
customElements.define('integrated-example', IntegratedExample);