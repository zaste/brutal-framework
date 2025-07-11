/**
 * BRUTAL V3 - Component Playground
 * Live examples, code generation, and API documentation
 */

import { Component } from '../01-core/Component.js';
import { Registry } from '../01-core/Registry.js';
import { themeSystem } from '../02-performance/10-ThemeSystem.js';
import { testHarness } from './ComponentTestHarness.js';

export class ComponentPlayground extends Component {
    constructor() {
        super();
        
        // Playground state
        this.state.set({
            selectedComponent: null,
            componentList: [],
            code: '',
            props: {},
            theme: 'default',
            viewport: 'desktop',
            showCode: true,
            showProps: true,
            showDocs: false,
            autoRefresh: true
        });
        
        // Component registry
        this._componentRegistry = new Map();
        this._exampleCode = new Map();
        this._propDefinitions = new Map();
        
        // Preview iframe
        this._previewFrame = null;
        this._previewDoc = null;
        
        // Code editor
        this._codeEditor = null;
        this._propEditors = new Map();
        
        // Performance metrics
        this._metrics = {
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0
        };
    }
    
    /**
     * Register component for playground
     */
    registerComponent(name, ComponentClass, config = {}) {
        this._componentRegistry.set(name, {
            class: ComponentClass,
            description: config.description || '',
            category: config.category || 'General',
            tags: config.tags || []
        });
        
        // Store example code
        if (config.example) {
            this._exampleCode.set(name, config.example);
        }
        
        // Store prop definitions
        if (config.props) {
            this._propDefinitions.set(name, config.props);
        }
        
        // Update component list
        this._updateComponentList();
    }
    
    /**
     * Create shadow DOM structure
     */
    createShadowDOM() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100vh;
                    font-family: var(--brutal-typography-font-family);
                    background: var(--brutal-colors-background);
                    color: var(--brutal-colors-text);
                }
                
                .playground {
                    display: grid;
                    grid-template-columns: 300px 1fr 400px;
                    height: 100%;
                    gap: 1px;
                    background: var(--brutal-colors-border);
                }
                
                .sidebar {
                    background: var(--brutal-colors-surface);
                    padding: var(--brutal-spacing-lg);
                    overflow-y: auto;
                }
                
                .preview {
                    background: var(--brutal-colors-background);
                    display: flex;
                    flex-direction: column;
                }
                
                .controls {
                    background: var(--brutal-colors-surface);
                    padding: var(--brutal-spacing-lg);
                    overflow-y: auto;
                }
                
                .toolbar {
                    display: flex;
                    align-items: center;
                    gap: var(--brutal-spacing-md);
                    padding: var(--brutal-spacing-md);
                    background: var(--brutal-colors-surface);
                    border-bottom: 1px solid var(--brutal-colors-border);
                }
                
                .viewport-selector {
                    display: flex;
                    gap: var(--brutal-spacing-sm);
                }
                
                .viewport-btn {
                    padding: var(--brutal-spacing-sm) var(--brutal-spacing-md);
                    border: 1px solid var(--brutal-colors-border);
                    background: transparent;
                    cursor: pointer;
                    border-radius: var(--brutal-borders-radius);
                    transition: all var(--brutal-animation-duration) var(--brutal-animation-easing);
                }
                
                .viewport-btn.active {
                    background: var(--brutal-colors-primary);
                    color: white;
                    border-color: var(--brutal-colors-primary);
                }
                
                .preview-container {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--brutal-spacing-xl);
                    overflow: auto;
                }
                
                .preview-frame {
                    width: 100%;
                    max-width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
                    box-shadow: var(--brutal-shadows-lg);
                    transition: all var(--brutal-animation-duration) var(--brutal-animation-easing);
                }
                
                .preview-frame.mobile {
                    max-width: 375px;
                    max-height: 667px;
                }
                
                .preview-frame.tablet {
                    max-width: 768px;
                    max-height: 1024px;
                }
                
                .component-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .component-category {
                    margin-bottom: var(--brutal-spacing-lg);
                }
                
                .category-title {
                    font-size: var(--brutal-typography-small-size);
                    font-weight: var(--brutal-typography-font-weight-bold);
                    text-transform: uppercase;
                    color: var(--brutal-colors-text-secondary);
                    margin-bottom: var(--brutal-spacing-sm);
                }
                
                .component-item {
                    padding: var(--brutal-spacing-md);
                    margin-bottom: var(--brutal-spacing-sm);
                    cursor: pointer;
                    border-radius: var(--brutal-borders-radius);
                    transition: all var(--brutal-animation-duration) var(--brutal-animation-easing);
                }
                
                .component-item:hover {
                    background: var(--brutal-colors-surface);
                }
                
                .component-item.active {
                    background: var(--brutal-colors-primary);
                    color: white;
                }
                
                .tabs {
                    display: flex;
                    gap: var(--brutal-spacing-md);
                    margin-bottom: var(--brutal-spacing-lg);
                    border-bottom: 1px solid var(--brutal-colors-border);
                }
                
                .tab {
                    padding: var(--brutal-spacing-md);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all var(--brutal-animation-duration) var(--brutal-animation-easing);
                }
                
                .tab.active {
                    color: var(--brutal-colors-primary);
                    border-bottom-color: var(--brutal-colors-primary);
                }
                
                .code-editor {
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    padding: var(--brutal-spacing-md);
                    background: #1e1e1e;
                    color: #d4d4d4;
                    border-radius: var(--brutal-borders-radius);
                    overflow: auto;
                    white-space: pre;
                }
                
                .prop-editor {
                    margin-bottom: var(--brutal-spacing-md);
                }
                
                .prop-label {
                    display: block;
                    font-size: var(--brutal-typography-small-size);
                    font-weight: var(--brutal-typography-font-weight-medium);
                    margin-bottom: var(--brutal-spacing-xs);
                }
                
                .prop-input {
                    width: 100%;
                    padding: var(--brutal-spacing-sm);
                    border: 1px solid var(--brutal-colors-border);
                    border-radius: var(--brutal-borders-radius);
                    background: var(--brutal-colors-background);
                    color: var(--brutal-colors-text);
                }
                
                .metrics {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: var(--brutal-spacing-md);
                    margin-top: var(--brutal-spacing-lg);
                    padding: var(--brutal-spacing-md);
                    background: var(--brutal-colors-surface);
                    border-radius: var(--brutal-borders-radius);
                }
                
                .metric {
                    text-align: center;
                }
                
                .metric-value {
                    font-size: 24px;
                    font-weight: var(--brutal-typography-font-weight-bold);
                    color: var(--brutal-colors-primary);
                }
                
                .metric-label {
                    font-size: var(--brutal-typography-small-size);
                    color: var(--brutal-colors-text-secondary);
                }
                
                .actions {
                    display: flex;
                    gap: var(--brutal-spacing-md);
                    margin-top: var(--brutal-spacing-lg);
                }
                
                .btn {
                    flex: 1;
                    padding: var(--brutal-spacing-md);
                    border: none;
                    border-radius: var(--brutal-borders-radius);
                    background: var(--brutal-colors-primary);
                    color: white;
                    font-weight: var(--brutal-typography-font-weight-medium);
                    cursor: pointer;
                    transition: all var(--brutal-animation-duration) var(--brutal-animation-easing);
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--brutal-shadows-lg);
                }
                
                .btn.secondary {
                    background: var(--brutal-colors-secondary);
                }
                
                .search-box {
                    width: 100%;
                    padding: var(--brutal-spacing-md);
                    margin-bottom: var(--brutal-spacing-lg);
                    border: 1px solid var(--brutal-colors-border);
                    border-radius: var(--brutal-borders-radius);
                    background: var(--brutal-colors-background);
                }
                
                @media (max-width: 1200px) {
                    .playground {
                        grid-template-columns: 250px 1fr;
                    }
                    
                    .controls {
                        position: fixed;
                        right: 0;
                        top: 0;
                        height: 100%;
                        transform: translateX(100%);
                        transition: transform var(--brutal-animation-duration) var(--brutal-animation-easing);
                        z-index: 1000;
                        box-shadow: var(--brutal-shadows-xl);
                    }
                    
                    .controls.open {
                        transform: translateX(0);
                    }
                }
            </style>
            
            <div class="playground">
                <aside class="sidebar">
                    <input type="search" 
                           class="search-box" 
                           placeholder="Search components..."
                           @input="${this._handleSearch}">
                    
                    <div class="component-list">
                        <!-- Component categories will be rendered here -->
                    </div>
                </aside>
                
                <main class="preview">
                    <div class="toolbar">
                        <div class="viewport-selector">
                            <button class="viewport-btn mobile" data-viewport="mobile">
                                📱 Mobile
                            </button>
                            <button class="viewport-btn tablet" data-viewport="tablet">
                                📲 Tablet
                            </button>
                            <button class="viewport-btn desktop active" data-viewport="desktop">
                                💻 Desktop
                            </button>
                        </div>
                        
                        <div style="flex: 1"></div>
                        
                        <select class="theme-selector" @change="${this._handleThemeChange}">
                            <option value="default">Default Theme</option>
                            <option value="dark">Dark Theme</option>
                        </select>
                        
                        <button class="btn" @click="${this._toggleControls}">
                            ⚙️ Settings
                        </button>
                    </div>
                    
                    <div class="preview-container">
                        <iframe class="preview-frame desktop"></iframe>
                    </div>
                </main>
                
                <aside class="controls">
                    <div class="tabs">
                        <div class="tab active" data-tab="code">Code</div>
                        <div class="tab" data-tab="props">Props</div>
                        <div class="tab" data-tab="docs">Docs</div>
                    </div>
                    
                    <div class="tab-content" data-content="code">
                        <div class="code-editor" contenteditable="true"></div>
                        
                        <div class="actions">
                            <button class="btn" @click="${this._runCode}">
                                ▶️ Run
                            </button>
                            <button class="btn secondary" @click="${this._copyCode}">
                                📋 Copy
                            </button>
                        </div>
                    </div>
                    
                    <div class="tab-content" data-content="props" style="display: none;">
                        <div class="prop-editors">
                            <!-- Prop editors will be rendered here -->
                        </div>
                        
                        <div class="actions">
                            <button class="btn" @click="${this._resetProps}">
                                🔄 Reset
                            </button>
                            <button class="btn secondary" @click="${this._randomizeProps}">
                                🎲 Randomize
                            </button>
                        </div>
                    </div>
                    
                    <div class="tab-content" data-content="docs" style="display: none;">
                        <div class="documentation">
                            <!-- Documentation will be rendered here -->
                        </div>
                        
                        <div class="actions">
                            <button class="btn" @click="${this._runTests}">
                                🧪 Run Tests
                            </button>
                            <button class="btn secondary" @click="${this._exportComponent}">
                                📦 Export
                            </button>
                        </div>
                    </div>
                    
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-value">${this._metrics.renderTime}ms</div>
                            <div class="metric-label">Render Time</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${this._metrics.updateTime}ms</div>
                            <div class="metric-label">Update Time</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${this._metrics.memoryUsage}KB</div>
                            <div class="metric-label">Memory</div>
                        </div>
                    </div>
                </aside>
            </div>
        `;
        
        // Get references
        this._previewFrame = this.shadowRoot.querySelector('.preview-frame');
        this._codeEditor = this.shadowRoot.querySelector('.code-editor');
        
        // Setup event listeners
        this._setupEventListeners();
        
        // Initialize preview
        this._initializePreview();
    }
    
    /**
     * Setup event listeners
     */
    _setupEventListeners() {
        // Viewport buttons
        this.shadowRoot.querySelectorAll('.viewport-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewport = e.target.dataset.viewport;
                this._setViewport(viewport);
            });
        });
        
        // Tabs
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this._switchTab(tabName);
            });
        });
        
        // Code editor
        this._codeEditor.addEventListener('input', () => {
            if (this.state.get('autoRefresh')) {
                this._debounce(() => this._runCode(), 1000);
            }
        });
    }
    
    /**
     * Initialize preview iframe
     */
    _initializePreview() {
        this._previewDoc = this._previewFrame.contentDocument;
        
        // Inject framework scripts
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Component Preview</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background: #f5f5f5;
                    }
                    
                    #preview-root {
                        width: 100%;
                        max-width: 800px;
                    }
                </style>
            </head>
            <body>
                <div id="preview-root"></div>
                <script type="module">
                    // Import framework
                    import '../index.js';
                    
                    // Expose to parent
                    window.BRUTAL = window.__BRUTAL__;
                    
                    // Ready signal
                    parent.postMessage({ type: 'preview-ready' }, '*');
                </script>
            </body>
            </html>
        `;
        
        this._previewDoc.open();
        this._previewDoc.write(html);
        this._previewDoc.close();
        
        // Listen for ready signal
        window.addEventListener('message', (e) => {
            if (e.data.type === 'preview-ready') {
                this._previewReady = true;
                this._updatePreview();
            }
        });
    }
    
    /**
     * Update component list
     */
    _updateComponentList() {
        const categories = new Map();
        
        // Group by category
        this._componentRegistry.forEach((config, name) => {
            if (!categories.has(config.category)) {
                categories.set(config.category, []);
            }
            categories.get(config.category).push({ name, ...config });
        });
        
        // Render categories
        const listContainer = this.shadowRoot.querySelector('.component-list');
        listContainer.innerHTML = '';
        
        categories.forEach((components, category) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'component-category';
            
            categoryEl.innerHTML = `
                <h3 class="category-title">${category}</h3>
            `;
            
            components.forEach(({ name, description }) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'component-item';
                itemEl.dataset.component = name;
                itemEl.innerHTML = `
                    <strong>${name}</strong>
                    <div style="font-size: 0.875em; opacity: 0.7;">${description}</div>
                `;
                
                itemEl.addEventListener('click', () => {
                    this._selectComponent(name);
                });
                
                categoryEl.appendChild(itemEl);
            });
            
            listContainer.appendChild(categoryEl);
        });
        
        // Update state
        this.state.update(state => {
            state.componentList = Array.from(this._componentRegistry.keys());
        });
    }
    
    /**
     * Select component
     */
    _selectComponent(name) {
        // Update active state
        this.shadowRoot.querySelectorAll('.component-item').forEach(item => {
            item.classList.toggle('active', item.dataset.component === name);
        });
        
        // Update state
        this.state.update(state => {
            state.selectedComponent = name;
        });
        
        // Load example code
        const exampleCode = this._exampleCode.get(name) || this._generateExampleCode(name);
        this._codeEditor.textContent = exampleCode;
        this.state.update(state => {
            state.code = exampleCode;
        });
        
        // Setup prop editors
        this._setupPropEditors(name);
        
        // Update preview
        this._runCode();
        
        // Load documentation
        this._loadDocumentation(name);
    }
    
    /**
     * Generate example code
     */
    _generateExampleCode(componentName) {
        const propDefs = this._propDefinitions.get(componentName) || {};
        const props = Object.entries(propDefs)
            .map(([key, def]) => {
                const value = def.default || this._getDefaultValue(def.type);
                return `${key}="${value}"`;
            })
            .join('\n    ');
        
        return `<${componentName}${props ? '\n    ' + props : ''}
></${componentName}>`;
    }
    
    /**
     * Get default value for type
     */
    _getDefaultValue(type) {
        switch (type) {
            case 'string': return 'Example text';
            case 'number': return '42';
            case 'boolean': return 'true';
            case 'array': return '[]';
            case 'object': return '{}';
            default: return '';
        }
    }
    
    /**
     * Setup prop editors
     */
    _setupPropEditors(componentName) {
        const propDefs = this._propDefinitions.get(componentName) || {};
        const container = this.shadowRoot.querySelector('.prop-editors');
        container.innerHTML = '';
        
        Object.entries(propDefs).forEach(([propName, def]) => {
            const editor = document.createElement('div');
            editor.className = 'prop-editor';
            
            editor.innerHTML = `
                <label class="prop-label">
                    ${propName}
                    <span style="opacity: 0.6">(${def.type})</span>
                </label>
                ${this._createPropInput(propName, def)}
                ${def.description ? `<div style="font-size: 0.875em; opacity: 0.7; margin-top: 4px;">${def.description}</div>` : ''}
            `;
            
            container.appendChild(editor);
            
            // Add event listener
            const input = editor.querySelector('input, select, textarea');
            if (input) {
                input.addEventListener('change', (e) => {
                    this._updateProp(propName, e.target.value, def.type);
                });
                
                this._propEditors.set(propName, input);
            }
        });
    }
    
    /**
     * Create prop input
     */
    _createPropInput(name, def) {
        const { type, enum: enumValues, default: defaultValue } = def;
        
        if (enumValues) {
            return `
                <select class="prop-input" name="${name}">
                    ${enumValues.map(val => 
                        `<option value="${val}" ${val === defaultValue ? 'selected' : ''}>${val}</option>`
                    ).join('')}
                </select>
            `;
        }
        
        switch (type) {
            case 'boolean':
                return `<input type="checkbox" name="${name}" ${defaultValue ? 'checked' : ''}>`;
            case 'number':
                return `<input type="number" class="prop-input" name="${name}" value="${defaultValue || 0}">`;
            case 'string':
                if (def.multiline) {
                    return `<textarea class="prop-input" name="${name}" rows="3">${defaultValue || ''}</textarea>`;
                }
                return `<input type="text" class="prop-input" name="${name}" value="${defaultValue || ''}">`;
            default:
                return `<input type="text" class="prop-input" name="${name}" value="${defaultValue || ''}">`;
        }
    }
    
    /**
     * Update prop
     */
    _updateProp(name, value, type) {
        this.state.update(state => {
            if (!state.props) state.props = {};
            
            // Convert value based on type
            switch (type) {
                case 'number':
                    state.props[name] = Number(value);
                    break;
                case 'boolean':
                    state.props[name] = value === 'true' || value === true;
                    break;
                case 'array':
                    try {
                        state.props[name] = JSON.parse(value);
                    } catch {
                        state.props[name] = [];
                    }
                    break;
                case 'object':
                    try {
                        state.props[name] = JSON.parse(value);
                    } catch {
                        state.props[name] = {};
                    }
                    break;
                default:
                    state.props[name] = value;
            }
        });
        
        // Update code
        this._updateCodeFromProps();
        
        // Refresh preview
        if (this.state.get('autoRefresh')) {
            this._runCode();
        }
    }
    
    /**
     * Update code from props
     */
    _updateCodeFromProps() {
        const componentName = this.state.get('selectedComponent');
        const props = this.state.get('props');
        
        const propString = Object.entries(props)
            .map(([key, value]) => {
                if (typeof value === 'boolean') {
                    return value ? key : '';
                }
                return `${key}="${value}"`;
            })
            .filter(Boolean)
            .join('\n    ');
        
        const code = `<${componentName}${propString ? '\n    ' + propString : ''}
></${componentName}>`;
        
        this._codeEditor.textContent = code;
        this.state.update(state => {
            state.code = code;
        });
    }
    
    /**
     * Run code
     */
    _runCode() {
        if (!this._previewReady) return;
        
        const startTime = performance.now();
        const code = this._codeEditor.textContent;
        
        try {
            // Clear preview
            const previewRoot = this._previewFrame.contentWindow.document.getElementById('preview-root');
            previewRoot.innerHTML = '';
            
            // Create wrapper
            const wrapper = this._previewFrame.contentWindow.document.createElement('div');
            wrapper.innerHTML = code;
            
            // Render component
            const element = wrapper.firstElementChild;
            if (element) {
                previewRoot.appendChild(element);
                
                // Update metrics
                this._metrics.renderTime = Math.round(performance.now() - startTime);
                this._updateMetrics();
            }
            
        } catch (error) {
            this._showError(error.message);
        }
    }
    
    /**
     * Show error
     */
    _showError(message) {
        const previewRoot = this._previewFrame.contentWindow.document.getElementById('preview-root');
        previewRoot.innerHTML = `
            <div style="
                padding: 20px;
                background: #fee;
                border: 1px solid #fcc;
                border-radius: 4px;
                color: #c00;
                font-family: monospace;
            ">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }
    
    /**
     * Copy code
     */
    _copyCode() {
        const code = this._codeEditor.textContent;
        navigator.clipboard.writeText(code).then(() => {
            // Show feedback
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }
    
    /**
     * Load documentation
     */
    _loadDocumentation(componentName) {
        const config = this._componentRegistry.get(componentName);
        const propDefs = this._propDefinitions.get(componentName) || {};
        
        const docsContainer = this.shadowRoot.querySelector('.documentation');
        docsContainer.innerHTML = `
            <h2>${componentName}</h2>
            <p>${config.description}</p>
            
            <h3>Properties</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--brutal-colors-border);">
                        <th style="text-align: left; padding: 8px;">Name</th>
                        <th style="text-align: left; padding: 8px;">Type</th>
                        <th style="text-align: left; padding: 8px;">Default</th>
                        <th style="text-align: left; padding: 8px;">Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(propDefs).map(([name, def]) => `
                        <tr style="border-bottom: 1px solid var(--brutal-colors-border);">
                            <td style="padding: 8px;"><code>${name}</code></td>
                            <td style="padding: 8px;"><code>${def.type}</code></td>
                            <td style="padding: 8px;"><code>${def.default || '-'}</code></td>
                            <td style="padding: 8px;">${def.description || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <h3>Events</h3>
            <p>Coming soon...</p>
            
            <h3>Methods</h3>
            <p>Coming soon...</p>
            
            <h3>CSS Variables</h3>
            <p>Coming soon...</p>
        `;
    }
    
    /**
     * Run tests
     */
    async _runTests() {
        const componentName = this.state.get('selectedComponent');
        const ComponentClass = this._componentRegistry.get(componentName)?.class;
        
        if (!ComponentClass) return;
        
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '⏳ Running...';
        btn.disabled = true;
        
        try {
            const results = await testHarness.testComponent(ComponentClass, this.state.get('props'));
            
            // Show results
            const passed = results.tests.filter(t => t.passed).length;
            const total = results.tests.length;
            
            btn.textContent = `✅ ${passed}/${total} Passed`;
            
            // Generate detailed report
            } catch (error) {
            btn.textContent = '❌ Tests Failed';
            } finally {
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 3000);
        }
    }
    
    /**
     * Export component
     */
    _exportComponent() {
        const componentName = this.state.get('selectedComponent');
        const code = this._codeEditor.textContent;
        const props = this.state.get('props');
        
        const exportData = {
            component: componentName,
            code,
            props,
            timestamp: new Date().toISOString()
        };
        
        // Create download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${componentName}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Set viewport
     */
    _setViewport(viewport) {
        // Update buttons
        this.shadowRoot.querySelectorAll('.viewport-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.viewport === viewport);
        });
        
        // Update frame class
        this._previewFrame.className = `preview-frame ${viewport}`;
        
        // Update state
        this.state.update(state => {
            state.viewport = viewport;
        });
    }
    
    /**
     * Switch tab
     */
    _switchTab(tabName) {
        // Update tabs
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update content
        this.shadowRoot.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = content.dataset.content === tabName ? 'block' : 'none';
        });
    }
    
    /**
     * Toggle controls
     */
    _toggleControls() {
        const controls = this.shadowRoot.querySelector('.controls');
        controls.classList.toggle('open');
    }
    
    /**
     * Reset props
     */
    _resetProps() {
        const componentName = this.state.get('selectedComponent');
        const propDefs = this._propDefinitions.get(componentName) || {};
        
        // Reset to defaults
        const defaultProps = {};
        Object.entries(propDefs).forEach(([name, def]) => {
            defaultProps[name] = def.default || this._getDefaultValue(def.type);
            
            // Update input
            const input = this._propEditors.get(name);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = def.default || false;
                } else {
                    input.value = def.default || '';
                }
            }
        });
        
        this.state.update(state => {
            state.props = defaultProps;
        });
        
        this._updateCodeFromProps();
        this._runCode();
    }
    
    /**
     * Randomize props
     */
    _randomizeProps() {
        const componentName = this.state.get('selectedComponent');
        const propDefs = this._propDefinitions.get(componentName) || {};
        
        const randomProps = {};
        Object.entries(propDefs).forEach(([name, def]) => {
            randomProps[name] = this._getRandomValue(def);
            
            // Update input
            const input = this._propEditors.get(name);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = randomProps[name];
                } else {
                    input.value = randomProps[name];
                }
            }
        });
        
        this.state.update(state => {
            state.props = randomProps;
        });
        
        this._updateCodeFromProps();
        this._runCode();
    }
    
    /**
     * Get random value for type
     */
    _getRandomValue(def) {
        if (def.enum) {
            return def.enum[Math.floor(Math.random() * def.enum.length)];
        }
        
        switch (def.type) {
            case 'boolean':
                return Math.random() > 0.5;
            case 'number':
                const min = def.min || 0;
                const max = def.max || 100;
                return Math.floor(Math.random() * (max - min) + min);
            case 'string':
                const strings = ['Lorem ipsum', 'Hello World', 'Test Value', 'Example Text'];
                return strings[Math.floor(Math.random() * strings.length)];
            default:
                return def.default || '';
        }
    }
    
    /**
     * Handle search
     */
    _handleSearch(event) {
        const query = event.target.value.toLowerCase();
        
        this.shadowRoot.querySelectorAll('.component-item').forEach(item => {
            const name = item.dataset.component.toLowerCase();
            const text = item.textContent.toLowerCase();
            const visible = !query || name.includes(query) || text.includes(query);
            item.style.display = visible ? 'block' : 'none';
        });
    }
    
    /**
     * Update metrics display
     */
    _updateMetrics() {
        this.shadowRoot.querySelector('.metrics').innerHTML = `
            <div class="metric">
                <div class="metric-value">${this._metrics.renderTime}ms</div>
                <div class="metric-label">Render Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this._metrics.updateTime}ms</div>
                <div class="metric-label">Update Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this._metrics.memoryUsage}KB</div>
                <div class="metric-label">Memory</div>
            </div>
        `;
    }
    
    /**
     * Debounce function
     */
    _debounce(func, wait) {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(func, wait);
    }
}

// Register component
customElements.define('brutal-playground', ComponentPlayground);

// Export singleton
export const playground = new ComponentPlayground();