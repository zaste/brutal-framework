/**
 * Page Builder - Visual page composition with drag & drop
 * Professional no-code/low-code interface
 */

import { BrutalComponent } from '../01-core/BrutalComponent.js';
import { dragDropSystem } from './DragDropSystem.js';
import { componentGenerator } from '../07-ai/ComponentGenerator.js';

export class PageBuilder extends BrutalComponent {
    constructor() {
        super();
        
        this.components = this.getComponentList();
        this.selectedComponent = null;
        this.pageData = {
            title: 'Untitled Page',
            components: [],
            theme: 'default',
            metadata: {}
        };
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        // Property editors
        this.propertyEditors = new Map();
        
        this.init();
    }

    init() {
        // Register keyboard shortcuts
        document.addEventListener('keydown', this.handleShortcuts.bind(this));
    }

    getComponentList() {
        return [
            // Core Components
            { name: 'Button', tag: 'brutal-button', category: 'Core', icon: '🔘' },
            { name: 'Input', tag: 'brutal-input', category: 'Core', icon: '📝' },
            { name: 'Card', tag: 'brutal-card', category: 'Core', icon: '🗂️' },
            { name: 'Select', tag: 'brutal-select', category: 'Core', icon: '📋' },
            
            // Data Components
            { name: 'Table', tag: 'brutal-table', category: 'Data', icon: '📊' },
            { name: 'Chart', tag: 'brutal-chart', category: 'Data', icon: '📈' },
            { name: 'List', tag: 'brutal-list', category: 'Data', icon: '📜' },
            { name: 'DataGrid', tag: 'brutal-datagrid', category: 'Data', icon: '🗃️' },
            
            // Feedback Components
            { name: 'Alert', tag: 'brutal-alert', category: 'Feedback', icon: '🚨' },
            { name: 'Toast', tag: 'brutal-toast', category: 'Feedback', icon: '💬' },
            { name: 'Progress', tag: 'brutal-progress', category: 'Feedback', icon: '📊' },
            { name: 'Skeleton', tag: 'brutal-skeleton', category: 'Feedback', icon: '⚡' },
            
            // UI Components
            { name: 'Modal', tag: 'brutal-modal', category: 'UI', icon: '🪟' },
            { name: 'Tooltip', tag: 'brutal-tooltip', category: 'UI', icon: '💡' },
            { name: 'Popover', tag: 'brutal-popover', category: 'UI', icon: '🗨️' },
            { name: 'Sidebar', tag: 'brutal-sidebar', category: 'UI', icon: '📱' },
            
            // Layout Components
            { name: 'Grid', tag: 'brutal-grid', category: 'Layout', icon: '🏗️' },
            { name: 'Stack', tag: 'brutal-stack', category: 'Layout', icon: '📚' },
            { name: 'Container', tag: 'brutal-container', category: 'Layout', icon: '📦' },
            { name: 'Divider', tag: 'brutal-divider', category: 'Layout', icon: '➖' }
        ];
    }

    render() {
        return `
            <div class="page-builder">
                <header class="builder-header">
                    <div class="header-left">
                        <h1>BRUTAL Page Builder</h1>
                        <input 
                            type="text" 
                            class="page-title" 
                            value="${this.pageData.title}"
                            placeholder="Page Title"
                        >
                    </div>
                    <div class="header-center">
                        <button class="tool-btn" onclick="this.undo()" title="Undo (Ctrl+Z)">
                            <span>↶</span>
                        </button>
                        <button class="tool-btn" onclick="this.redo()" title="Redo (Ctrl+Y)">
                            <span>↷</span>
                        </button>
                        <div class="separator"></div>
                        <button class="tool-btn" onclick="this.togglePreview()" title="Preview">
                            <span>👁️</span>
                        </button>
                        <button class="tool-btn" onclick="this.toggleResponsive()" title="Responsive">
                            <span>📱</span>
                        </button>
                        <div class="separator"></div>
                        <button class="tool-btn" onclick="this.showAIAssistant()" title="AI Assistant">
                            <span>🤖</span>
                        </button>
                    </div>
                    <div class="header-right">
                        <button class="btn-secondary" onclick="this.exportCode()">
                            Export Code
                        </button>
                        <button class="btn-primary" onclick="this.save()">
                            Save
                        </button>
                    </div>
                </header>

                <div class="builder-body">
                    <aside class="component-palette">
                        <div class="palette-header">
                            <h3>Components</h3>
                            <input 
                                type="search" 
                                placeholder="Search components..."
                                class="component-search"
                                oninput="this.filterComponents(event.target.value)"
                            >
                        </div>
                        <div class="component-categories">
                            ${this.renderComponentPalette()}
                        </div>
                    </aside>

                    <main class="canvas-container">
                        <div class="canvas-toolbar">
                            <div class="viewport-selector">
                                <button class="viewport-btn active" data-viewport="desktop">
                                    <span>💻</span> Desktop
                                </button>
                                <button class="viewport-btn" data-viewport="tablet">
                                    <span>📱</span> Tablet
                                </button>
                                <button class="viewport-btn" data-viewport="mobile">
                                    <span>📲</span> Mobile
                                </button>
                            </div>
                            <div class="zoom-controls">
                                <button onclick="this.zoom(-10)">−</button>
                                <span class="zoom-level">100%</span>
                                <button onclick="this.zoom(10)">+</button>
                            </div>
                        </div>
                        <div class="canvas-wrapper">
                            <div class="canvas" id="pageCanvas">
                                <div class="empty-state">
                                    <h3>Start Building</h3>
                                    <p>Drag components from the palette or use AI to generate</p>
                                    <button class="btn-primary" onclick="this.showAIAssistant()">
                                        🤖 Generate with AI
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>

                    <aside class="properties-panel">
                        <div class="panel-header">
                            <h3>Properties</h3>
                        </div>
                        <div class="properties-content">
                            <div class="no-selection">
                                <p>Select a component to edit its properties</p>
                            </div>
                        </div>
                    </aside>
                </div>

                <div class="ai-assistant-modal" id="aiAssistant" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>AI Page Assistant</h2>
                            <button onclick="this.hideAIAssistant()">×</button>
                        </div>
                        <div class="modal-body">
                            <textarea 
                                placeholder="Describe the page you want to create..."
                                rows="4"
                                id="aiPrompt"
                            ></textarea>
                            <div class="ai-suggestions">
                                <button onclick="this.setAIPrompt('Create a contact form with name, email, and message fields')">
                                    Contact Form
                                </button>
                                <button onclick="this.setAIPrompt('Build a product card with image, title, price, and buy button')">
                                    Product Card
                                </button>
                                <button onclick="this.setAIPrompt('Design a dashboard with stats cards and charts')">
                                    Dashboard
                                </button>
                            </div>
                            <button class="btn-primary" onclick="this.generateWithAI()">
                                Generate Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    style() {
        return `
            .page-builder {
                height: 100vh;
                display: flex;
                flex-direction: column;
                background: #0a0a0a;
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .builder-header {
                height: 60px;
                background: #1a1a1a;
                border-bottom: 1px solid #333;
                display: flex;
                align-items: center;
                padding: 0 1rem;
                gap: 2rem;
            }

            .header-left, .header-center, .header-right {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .header-left {
                flex: 1;
            }

            .header-left h1 {
                font-size: 1.25rem;
                margin: 0;
                background: linear-gradient(45deg, #3b82f6, #10b981);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .page-title {
                background: #2a2a2a;
                border: 1px solid #333;
                color: #fff;
                padding: 0.5rem 1rem;
                border-radius: 0.25rem;
                font-size: 0.875rem;
            }

            .tool-btn {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #2a2a2a;
                border: 1px solid #333;
                border-radius: 0.25rem;
                color: #fff;
                cursor: pointer;
                transition: all 0.2s;
            }

            .tool-btn:hover {
                background: #3a3a3a;
                border-color: #3b82f6;
            }

            .separator {
                width: 1px;
                height: 24px;
                background: #333;
            }

            .builder-body {
                flex: 1;
                display: flex;
                overflow: hidden;
            }

            .component-palette {
                width: 260px;
                background: #1a1a1a;
                border-right: 1px solid #333;
                overflow-y: auto;
            }

            .palette-header {
                padding: 1rem;
                border-bottom: 1px solid #333;
            }

            .palette-header h3 {
                margin: 0 0 0.5rem 0;
                font-size: 0.875rem;
                text-transform: uppercase;
                color: #888;
            }

            .component-search {
                width: 100%;
                background: #2a2a2a;
                border: 1px solid #333;
                color: #fff;
                padding: 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.875rem;
            }

            .component-category {
                padding: 0.5rem 1rem;
            }

            .category-title {
                font-size: 0.75rem;
                text-transform: uppercase;
                color: #666;
                margin: 0.5rem 0;
            }

            .component-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                background: #2a2a2a;
                border: 1px solid #333;
                border-radius: 0.25rem;
                margin-bottom: 0.25rem;
                cursor: move;
                transition: all 0.2s;
            }

            .component-item:hover {
                background: #3a3a3a;
                border-color: #3b82f6;
                transform: translateX(4px);
            }

            .component-icon {
                font-size: 1.25rem;
            }

            .component-name {
                font-size: 0.875rem;
            }

            .canvas-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #0a0a0a;
            }

            .canvas-toolbar {
                height: 48px;
                background: #1a1a1a;
                border-bottom: 1px solid #333;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 1rem;
            }

            .viewport-selector {
                display: flex;
                gap: 0.5rem;
            }

            .viewport-btn {
                padding: 0.5rem 1rem;
                background: #2a2a2a;
                border: 1px solid #333;
                color: #fff;
                border-radius: 0.25rem;
                cursor: pointer;
                font-size: 0.875rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
            }

            .viewport-btn:hover {
                background: #3a3a3a;
            }

            .viewport-btn.active {
                background: #3b82f6;
                border-color: #3b82f6;
            }

            .zoom-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: #2a2a2a;
                border: 1px solid #333;
                border-radius: 0.25rem;
                padding: 0.25rem;
            }

            .zoom-controls button {
                width: 24px;
                height: 24px;
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 1rem;
            }

            .zoom-level {
                font-size: 0.875rem;
                min-width: 50px;
                text-align: center;
            }

            .canvas-wrapper {
                flex: 1;
                overflow: auto;
                padding: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .canvas {
                background: #fff;
                min-height: 600px;
                width: 100%;
                max-width: 1200px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                border-radius: 0.5rem;
                position: relative;
                transition: all 0.3s;
            }

            .canvas.tablet {
                max-width: 768px;
            }

            .canvas.mobile {
                max-width: 375px;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                min-height: 600px;
                color: #666;
                text-align: center;
                padding: 2rem;
            }

            .empty-state h3 {
                font-size: 1.5rem;
                margin: 0 0 0.5rem 0;
                color: #333;
            }

            .empty-state p {
                margin: 0 0 1.5rem 0;
            }

            .properties-panel {
                width: 300px;
                background: #1a1a1a;
                border-left: 1px solid #333;
                overflow-y: auto;
            }

            .panel-header {
                padding: 1rem;
                border-bottom: 1px solid #333;
            }

            .panel-header h3 {
                margin: 0;
                font-size: 0.875rem;
                text-transform: uppercase;
                color: #888;
            }

            .properties-content {
                padding: 1rem;
            }

            .no-selection {
                text-align: center;
                color: #666;
                padding: 2rem 0;
            }

            .property-group {
                margin-bottom: 1.5rem;
            }

            .property-label {
                display: block;
                font-size: 0.75rem;
                text-transform: uppercase;
                color: #888;
                margin-bottom: 0.25rem;
            }

            .property-input {
                width: 100%;
                background: #2a2a2a;
                border: 1px solid #333;
                color: #fff;
                padding: 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.875rem;
            }

            .ai-assistant-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .modal-content {
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 0.5rem;
                width: 90%;
                max-width: 600px;
            }

            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem;
                border-bottom: 1px solid #333;
            }

            .modal-header h2 {
                margin: 0;
                font-size: 1.25rem;
            }

            .modal-header button {
                width: 32px;
                height: 32px;
                background: none;
                border: none;
                color: #888;
                font-size: 1.5rem;
                cursor: pointer;
            }

            .modal-body {
                padding: 1.5rem;
            }

            .modal-body textarea {
                width: 100%;
                background: #2a2a2a;
                border: 1px solid #333;
                color: #fff;
                padding: 1rem;
                border-radius: 0.25rem;
                font-size: 1rem;
                resize: vertical;
                margin-bottom: 1rem;
            }

            .ai-suggestions {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }

            .ai-suggestions button {
                padding: 0.5rem 1rem;
                background: #2a2a2a;
                border: 1px solid #333;
                color: #fff;
                border-radius: 0.25rem;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ai-suggestions button:hover {
                background: #3a3a3a;
                border-color: #3b82f6;
            }

            .btn-primary, .btn-secondary {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 0.25rem;
                font-size: 0.875rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #3b82f6;
                color: #fff;
            }

            .btn-primary:hover {
                background: #2563eb;
            }

            .btn-secondary {
                background: #2a2a2a;
                color: #fff;
                border: 1px solid #333;
            }

            .btn-secondary:hover {
                background: #3a3a3a;
            }

            /* Component in canvas styles */
            .canvas .brutal-draggable {
                margin: 0.5rem;
                position: relative;
            }

            .canvas .brutal-draggable.selected {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }

            .component-actions {
                position: absolute;
                top: -32px;
                right: 0;
                display: none;
                gap: 0.25rem;
                background: #1a1a1a;
                padding: 0.25rem;
                border-radius: 0.25rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }

            .brutal-draggable.selected .component-actions {
                display: flex;
            }

            .action-btn {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #2a2a2a;
                border: 1px solid #333;
                border-radius: 0.25rem;
                color: #fff;
                font-size: 0.75rem;
                cursor: pointer;
            }

            .action-btn:hover {
                background: #3a3a3a;
            }
        `;
    }

    renderComponentPalette() {
        const categories = {};
        
        // Group by category
        this.components.forEach(comp => {
            if (!categories[comp.category]) {
                categories[comp.category] = [];
            }
            categories[comp.category].push(comp);
        });
        
        return Object.entries(categories).map(([category, items]) => `
            <div class="component-category">
                <div class="category-title">${category}</div>
                ${items.map(comp => `
                    <div class="component-item" 
                         data-component="${comp.tag}"
                         draggable="true">
                        <span class="component-icon">${comp.icon}</span>
                        <span class="component-name">${comp.name}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupDragDrop();
        this.setupEventListeners();
    }

    setupDragDrop() {
        const canvas = this.querySelector('#pageCanvas');
        
        // Make canvas a drop zone
        dragDropSystem.createDropZone(canvas, {
            accepts: ['component'],
            onDrop: (items, zone) => {
                items.forEach(item => {
                    const componentTag = item.dataset.component;
                    if (componentTag) {
                        this.addComponent(componentTag, zone);
                    }
                });
            }
        });
        
        // Make all palette items draggable
        this.querySelectorAll('.component-item').forEach(item => {
            dragDropSystem.enableDrag(item, {
                group: 'component',
                data: { component: item.dataset.component }
            });
        });
    }

    setupEventListeners() {
        // Page title
        this.querySelector('.page-title').addEventListener('input', (e) => {
            this.pageData.title = e.target.value;
            this.saveToHistory();
        });
        
        // Viewport buttons
        this.querySelectorAll('.viewport-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setViewport(btn.dataset.viewport);
            });
        });
        
        // Canvas click
        this.querySelector('#pageCanvas').addEventListener('click', (e) => {
            const component = e.target.closest('.brutal-draggable');
            if (component) {
                this.selectComponent(component);
            } else {
                this.deselectAll();
            }
        });
    }

    addComponent(tag, container) {
        const component = document.createElement(tag);
        component.classList.add('brutal-draggable');
        
        // Add default content
        this.setDefaultContent(component, tag);
        
        // Add component actions
        const actions = document.createElement('div');
        actions.className = 'component-actions';
        actions.innerHTML = `
            <button class="action-btn" onclick="this.duplicateComponent(event)" title="Duplicate">📋</button>
            <button class="action-btn" onclick="this.deleteComponent(event)" title="Delete">🗑️</button>
        `;
        component.appendChild(actions);
        
        // Make it draggable within canvas
        dragDropSystem.enableDrag(component, {
            group: 'canvas-component'
        });
        
        // Add to container
        if (container.querySelector('.empty-state')) {
            container.innerHTML = '';
        }
        container.appendChild(component);
        
        // Select it
        this.selectComponent(component);
        
        // Save to history
        this.saveToHistory();
    }

    setDefaultContent(component, tag) {
        const defaults = {
            'brutal-button': { innerHTML: 'Click Me', variant: 'primary' },
            'brutal-input': { placeholder: 'Enter text...', type: 'text' },
            'brutal-card': { innerHTML: '<h3>Card Title</h3><p>Card content goes here</p>' },
            'brutal-alert': { innerHTML: 'This is an alert message', type: 'info' },
            'brutal-progress': { value: '50', max: '100' }
        };
        
        const config = defaults[tag] || {};
        
        if (config.innerHTML) {
            component.innerHTML = config.innerHTML;
        }
        
        Object.entries(config).forEach(([key, value]) => {
            if (key !== 'innerHTML') {
                component.setAttribute(key, value);
            }
        });
    }

    selectComponent(component) {
        this.deselectAll();
        component.classList.add('selected');
        this.selectedComponent = component;
        this.showProperties(component);
    }

    deselectAll() {
        this.querySelectorAll('.brutal-draggable').forEach(comp => {
            comp.classList.remove('selected');
        });
        this.selectedComponent = null;
        this.hideProperties();
    }

    showProperties(component) {
        const panel = this.querySelector('.properties-content');
        const tag = component.tagName.toLowerCase();
        
        panel.innerHTML = `
            <div class="property-group">
                <label class="property-label">Component Type</label>
                <input type="text" class="property-input" value="${tag}" readonly>
            </div>
            ${this.getPropertyFields(component)}
        `;
        
        // Add event listeners
        panel.querySelectorAll('.property-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateComponentProperty(component, input.dataset.prop, e.target.value);
            });
        });
    }

    getPropertyFields(component) {
        const tag = component.tagName.toLowerCase();
        const properties = {
            'brutal-button': [
                { name: 'text', type: 'text', attr: false },
                { name: 'variant', type: 'select', options: ['primary', 'secondary', 'danger', 'success'] },
                { name: 'disabled', type: 'checkbox' }
            ],
            'brutal-input': [
                { name: 'type', type: 'select', options: ['text', 'email', 'password', 'number'] },
                { name: 'placeholder', type: 'text' },
                { name: 'required', type: 'checkbox' }
            ],
            'brutal-card': [
                { name: 'elevated', type: 'checkbox' },
                { name: 'interactive', type: 'checkbox' }
            ]
        };
        
        const props = properties[tag] || [];
        
        return props.map(prop => {
            if (prop.type === 'select') {
                const current = component.getAttribute(prop.name) || prop.options[0];
                return `
                    <div class="property-group">
                        <label class="property-label">${prop.name}</label>
                        <select class="property-input" data-prop="${prop.name}">
                            ${prop.options.map(opt => `
                                <option value="${opt}" ${opt === current ? 'selected' : ''}>${opt}</option>
                            `).join('')}
                        </select>
                    </div>
                `;
            } else if (prop.type === 'checkbox') {
                const checked = component.hasAttribute(prop.name);
                return `
                    <div class="property-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" data-prop="${prop.name}" ${checked ? 'checked' : ''}>
                            <span class="property-label" style="margin: 0;">${prop.name}</span>
                        </label>
                    </div>
                `;
            } else {
                const value = prop.attr === false ? 
                    component.textContent : 
                    component.getAttribute(prop.name) || '';
                return `
                    <div class="property-group">
                        <label class="property-label">${prop.name}</label>
                        <input type="text" class="property-input" data-prop="${prop.name}" value="${value}">
                    </div>
                `;
            }
        }).join('');
    }

    updateComponentProperty(component, prop, value) {
        if (prop === 'text') {
            component.textContent = value;
        } else if (prop.type === 'checkbox') {
            if (value) {
                component.setAttribute(prop, '');
            } else {
                component.removeAttribute(prop);
            }
        } else {
            component.setAttribute(prop, value);
        }
        
        this.saveToHistory();
    }

    hideProperties() {
        const panel = this.querySelector('.properties-content');
        panel.innerHTML = `
            <div class="no-selection">
                <p>Select a component to edit its properties</p>
            </div>
        `;
    }

    // AI Integration
    showAIAssistant() {
        this.querySelector('#aiAssistant').style.display = 'flex';
    }

    hideAIAssistant() {
        this.querySelector('#aiAssistant').style.display = 'none';
    }

    setAIPrompt(prompt) {
        this.querySelector('#aiPrompt').value = prompt;
    }

    generateWithAI() {
        const prompt = this.querySelector('#aiPrompt').value;
        if (!prompt) return;
        
        const canvas = this.querySelector('#pageCanvas');
        
        // Clear empty state
        if (canvas.querySelector('.empty-state')) {
            canvas.innerHTML = '';
        }
        
        // Generate components based on prompt
        const components = this.parseAIPrompt(prompt);
        components.forEach(comp => {
            const result = componentGenerator.generate(comp.prompt);
            if (result.success) {
                canvas.innerHTML += result.component;
            }
        });
        
        // Make new components draggable
        canvas.querySelectorAll('brutal-button, brutal-input, brutal-card').forEach(comp => {
            comp.classList.add('brutal-draggable');
            dragDropSystem.enableDrag(comp, {
                group: 'canvas-component'
            });
        });
        
        this.hideAIAssistant();
        this.saveToHistory();
    }

    parseAIPrompt(prompt) {
        // Simple parsing logic - in real app would use NLP
        const components = [];
        
        if (prompt.includes('contact form')) {
            components.push(
                { prompt: 'create an input field for name with placeholder "Your Name"' },
                { prompt: 'create an email input field with placeholder "your@email.com"' },
                { prompt: 'create a textarea for message' },
                { prompt: 'create a primary submit button' }
            );
        } else if (prompt.includes('product card')) {
            components.push(
                { prompt: 'create a card with product information' },
                { prompt: 'create a primary button that says "Add to Cart"' }
            );
        } else {
            // Generic parsing
            const words = prompt.toLowerCase().split(' ');
            if (words.includes('button')) {
                components.push({ prompt });
            }
            if (words.includes('input') || words.includes('form')) {
                components.push({ prompt });
            }
        }
        
        return components;
    }

    // History management
    saveToHistory() {
        const state = {
            html: this.querySelector('#pageCanvas').innerHTML,
            pageData: { ...this.pageData }
        };
        
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    restoreState(state) {
        this.querySelector('#pageCanvas').innerHTML = state.html;
        this.pageData = { ...state.pageData };
        this.querySelector('.page-title').value = this.pageData.title;
        
        // Re-setup drag/drop for restored elements
        this.querySelector('#pageCanvas').querySelectorAll('.brutal-draggable').forEach(comp => {
            dragDropSystem.enableDrag(comp, {
                group: 'canvas-component'
            });
        });
    }

    // Viewport control
    setViewport(viewport) {
        // Update buttons
        this.querySelectorAll('.viewport-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.viewport === viewport);
        });
        
        // Update canvas
        const canvas = this.querySelector('.canvas');
        canvas.classList.remove('desktop', 'tablet', 'mobile');
        canvas.classList.add(viewport);
    }

    // Zoom control
    zoom(delta) {
        const canvas = this.querySelector('.canvas');
        const current = parseInt(canvas.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1') * 100;
        const newZoom = Math.max(50, Math.min(150, current + delta));
        
        canvas.style.transform = `scale(${newZoom / 100})`;
        this.querySelector('.zoom-level').textContent = `${newZoom}%`;
    }

    // Component actions
    duplicateComponent(event) {
        event.stopPropagation();
        const component = event.target.closest('.brutal-draggable');
        const clone = component.cloneNode(true);
        
        // Make it draggable
        dragDropSystem.enableDrag(clone, {
            group: 'canvas-component'
        });
        
        component.parentNode.insertBefore(clone, component.nextSibling);
        this.selectComponent(clone);
        this.saveToHistory();
    }

    deleteComponent(event) {
        event.stopPropagation();
        const component = event.target.closest('.brutal-draggable');
        component.remove();
        
        // Check if canvas is empty
        const canvas = this.querySelector('#pageCanvas');
        if (!canvas.querySelector('.brutal-draggable')) {
            canvas.innerHTML = `
                <div class="empty-state">
                    <h3>Start Building</h3>
                    <p>Drag components from the palette or use AI to generate</p>
                    <button class="btn-primary" onclick="this.showAIAssistant()">
                        🤖 Generate with AI
                    </button>
                </div>
            `;
        }
        
        this.deselectAll();
        this.saveToHistory();
    }

    // Export functionality
    exportCode() {
        const canvas = this.querySelector('#pageCanvas');
        const html = canvas.innerHTML
            .replace(/\sclass="brutal-draggable(\s+selected)?"/g, '')
            .replace(/<div class="component-actions">[\s\S]*?<\/div>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        const code = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.pageData.title}</title>
    <script type="module">
        import { BrutalFramework } from '@brutal/framework';
        BrutalFramework.init();
    </script>
</head>
<body>
    ${html}
</body>
</html>`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(code).then(() => {
            // Show toast
            const toast = document.createElement('brutal-toast');
            toast.setAttribute('message', 'Code copied to clipboard!');
            toast.setAttribute('type', 'success');
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        });
    }

    save() {
        // In real app, would save to server
        const data = {
            ...this.pageData,
            html: this.querySelector('#pageCanvas').innerHTML,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('brutal-page-builder-save', JSON.stringify(data));
        
        // Show toast
        const toast = document.createElement('brutal-toast');
        toast.setAttribute('message', 'Page saved successfully!');
        toast.setAttribute('type', 'success');
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Keyboard shortcuts
    handleShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.save();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportCode();
                    break;
            }
        } else if (e.key === 'Delete' && this.selectedComponent) {
            this.selectedComponent.remove();
            this.deselectAll();
            this.saveToHistory();
        }
    }
}

// Register component
customElements.define('brutal-page-builder', PageBuilder);