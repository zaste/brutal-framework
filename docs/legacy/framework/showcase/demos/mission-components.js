/**
 * MISSION COMPONENTS - Layer 2: Component Architecture
 * Native Web Components Framework - Enterprise Design System
 * 100% aligned with Native WC approach, ZERO external dependencies
 */

// ===== BASE COMPONENT CLASS =====
class MissionComponentBase extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.performanceObserver = null;
        this.isInitialized = false;
        this.eventListeners = new Map();
        
        // Performance optimization
        this.componentId = this.generateComponentId();
        this.renderCount = 0;
        this.lastRenderTime = 0;
    }

    generateComponentId() {
        return `mission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    connectedCallback() {
        if (!this.isInitialized) {
            this.initialize();
            this.render();
            this.setupEventListeners();
            this.isInitialized = true;
            this.trackPerformance();
        }
    }

    disconnectedCallback() {
        this.cleanup();
        this.stopPerformanceTracking();
    }

    initialize() {
        // Override in subclasses
    }

    render() {
        const startTime = performance.now();
        
        this.shadowRoot.innerHTML = `
            <style>
                ${this.getStyles()}
            </style>
            ${this.getTemplate()}
        `;
        
        this.renderCount++;
        this.lastRenderTime = performance.now() - startTime;
        
        this.dispatchEvent(new CustomEvent('component-rendered', {
            detail: {
                componentId: this.componentId,
                renderTime: this.lastRenderTime,
                renderCount: this.renderCount
            }
        }));
    }

    getStyles() {
        return `
            :host {
                --component-bg: var(--nasa-blue-dark);
                --component-border: var(--nasa-cyan-bright);
                --component-text: var(--spectrum-gray-50);
                --component-radius: var(--radius-md);
                --component-shadow: var(--shadow-lg);
                --component-transition: var(--perf-transition);
                
                display: block;
                box-sizing: border-box;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                color: var(--component-text);
                transform: var(--perf-transform);
                will-change: var(--perf-will-change);
            }
            
            .component-container {
                background: var(--component-bg);
                border: 1px solid var(--component-border);
                border-radius: var(--component-radius);
                box-shadow: var(--component-shadow);
                transition: all var(--component-transition);
                position: relative;
                overflow: hidden;
            }
            
            .component-container:hover {
                box-shadow: var(--glow-cyan);
                transform: translateY(-2px);
            }
            
            .component-header {
                padding: var(--space-md);
                border-bottom: 1px solid var(--nasa-cyan-dark);
                background: linear-gradient(90deg, var(--nasa-blue-medium), var(--nasa-blue-dark));
            }
            
            .component-body {
                padding: var(--space-lg);
            }
            
            .component-footer {
                padding: var(--space-md);
                border-top: 1px solid var(--nasa-cyan-dark);
                background: rgba(0, 0, 0, 0.2);
            }
        `;
    }

    getTemplate() {
        return `
            <div class="component-container">
                <div class="component-header">
                    <slot name="header">Mission Component</slot>
                </div>
                <div class="component-body">
                    <slot></slot>
                </div>
                <div class="component-footer">
                    <slot name="footer">Ready</slot>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Override in subclasses
    }

    cleanup() {
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.clear();
    }

    trackPerformance() {
        if (!window.PerformanceObserver) return;
        
        this.performanceObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log(`Component ${this.componentId}: ${entry.name} - ${entry.duration}ms`);
            });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure'] });
    }

    stopPerformanceTracking() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
    }

    // Utility method for safe event binding
    bindEvent(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.set(element, { event, handler });
    }
}

// ===== MISSION BUTTON COMPONENT =====
class MissionButton extends MissionComponentBase {
    static get observedAttributes() {
        return ['variant', 'size', 'disabled', 'loading'];
    }

    constructor() {
        super();
        this.clickCount = 0;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .mission-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-sm);
                padding: var(--button-padding-x-md);
                height: var(--button-height-md);
                background: var(--gradient-primary);
                border: 1px solid var(--nasa-cyan-bright);
                border-radius: var(--radius-full);
                color: var(--spectrum-gray-50);
                font-weight: var(--font-weight-semibold);
                font-size: var(--font-size-sm);
                cursor: pointer;
                transition: all var(--perf-transition);
                position: relative;
                overflow: hidden;
                min-width: 120px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .mission-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left var(--transition-fast);
            }
            
            .mission-button:hover::before {
                left: 100%;
            }
            
            .mission-button:hover {
                transform: translateY(-2px);
                box-shadow: var(--glow-cyan);
                border-color: var(--nasa-green-status);
            }
            
            .mission-button:active {
                transform: translateY(0);
            }
            
            .mission-button[disabled] {
                opacity: 0.5;
                cursor: not-allowed;
                background: var(--spectrum-gray-600);
            }
            
            .mission-button.loading {
                pointer-events: none;
            }
            
            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid var(--nasa-cyan-bright);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Variants */
            .mission-button.primary {
                background: var(--gradient-primary);
                border-color: var(--spectrum-blue-600);
            }
            
            .mission-button.success {
                background: var(--gradient-success);
                border-color: var(--nasa-green-status);
            }
            
            .mission-button.warning {
                background: var(--gradient-warning);
                border-color: var(--nasa-yellow-warning);
                color: var(--spectrum-gray-900);
            }
            
            .mission-button.danger {
                background: var(--gradient-error);
                border-color: var(--nasa-red-alert);
            }
            
            /* Sizes */
            .mission-button.small {
                height: var(--button-height-sm);
                padding: var(--button-padding-x-sm);
                font-size: var(--font-size-xs);
                min-width: 80px;
            }
            
            .mission-button.large {
                height: var(--button-height-lg);
                padding: var(--button-padding-x-lg);
                font-size: var(--font-size-lg);
                min-width: 160px;
            }
        `;
    }

    getTemplate() {
        const variant = this.getAttribute('variant') || 'primary';
        const size = this.getAttribute('size') || 'medium';
        const loading = this.hasAttribute('loading');
        const disabled = this.hasAttribute('disabled');

        return `
            <button 
                class="mission-button ${variant} ${size} ${loading ? 'loading' : ''}"
                ${disabled ? 'disabled' : ''}
            >
                ${loading ? '<div class="loading-spinner"></div>' : ''}
                <slot>${loading ? 'Loading...' : 'Execute'}</slot>
            </button>
        `;
    }

    setupEventListeners() {
        const button = this.shadowRoot.querySelector('.mission-button');
        this.bindEvent(button, 'click', (e) => {
            this.clickCount++;
            this.dispatchEvent(new CustomEvent('mission-click', {
                detail: {
                    clickCount: this.clickCount,
                    timestamp: Date.now(),
                    componentId: this.componentId
                },
                bubbles: true
            }));
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.isInitialized) {
            this.render();
        }
    }
}

// ===== MISSION PANEL COMPONENT =====
class MissionPanel extends MissionComponentBase {
    static get observedAttributes() {
        return ['title', 'status', 'collapsible', 'collapsed'];
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .mission-panel {
                background: var(--gradient-nasa);
                border: 1px solid var(--nasa-cyan-bright);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-xl);
                overflow: hidden;
                transition: all var(--perf-transition);
            }
            
            .mission-panel:hover {
                box-shadow: var(--glow-cyan);
            }
            
            .panel-header {
                padding: var(--space-lg);
                background: linear-gradient(90deg, var(--nasa-blue-medium), var(--nasa-blue-dark));
                border-bottom: 1px solid var(--nasa-cyan-dark);
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
            }
            
            .panel-title {
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-semibold);
                color: var(--nasa-cyan-bright);
                display: flex;
                align-items: center;
                gap: var(--space-md);
            }
            
            .panel-status {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            .panel-status.operational {
                background: var(--nasa-green-status);
                box-shadow: var(--glow-green);
            }
            
            .panel-status.warning {
                background: var(--nasa-yellow-warning);
                box-shadow: var(--glow-yellow);
            }
            
            .panel-status.critical {
                background: var(--nasa-red-alert);
                box-shadow: var(--glow-red);
            }
            
            .panel-collapse-icon {
                transition: transform var(--perf-transition);
                font-size: var(--font-size-lg);
                color: var(--nasa-cyan-bright);
            }
            
            .panel-collapsed .panel-collapse-icon {
                transform: rotate(-90deg);
            }
            
            .panel-body {
                padding: var(--space-xl);
                background: rgba(0, 0, 0, 0.3);
                transition: all var(--perf-transition);
                overflow: hidden;
            }
            
            .panel-collapsed .panel-body {
                max-height: 0;
                padding-top: 0;
                padding-bottom: 0;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
    }

    getTemplate() {
        const title = this.getAttribute('title') || 'Mission Panel';
        const status = this.getAttribute('status') || 'operational';
        const collapsible = this.hasAttribute('collapsible');
        const collapsed = this.hasAttribute('collapsed');

        return `
            <div class="mission-panel ${collapsed ? 'panel-collapsed' : ''}">
                <div class="panel-header" ${collapsible ? 'onclick="this.getRootNode().host.toggleCollapse()"' : ''}>
                    <div class="panel-title">
                        <div class="panel-status ${status}"></div>
                        ${title}
                    </div>
                    ${collapsible ? '<div class="panel-collapse-icon">▼</div>' : ''}
                </div>
                <div class="panel-body">
                    <slot></slot>
                </div>
            </div>
        `;
    }

    toggleCollapse() {
        if (this.hasAttribute('collapsed')) {
            this.removeAttribute('collapsed');
        } else {
            this.setAttribute('collapsed', '');
        }
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.isInitialized) {
            this.render();
        }
    }
}

// ===== MISSION METRICS COMPONENT =====
class MissionMetrics extends MissionComponentBase {
    constructor() {
        super();
        this.metrics = new Map();
        this.updateInterval = null;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--space-lg);
                padding: var(--space-lg);
            }
            
            .metric-card {
                background: var(--gradient-nasa);
                border: 1px solid var(--nasa-cyan-dark);
                border-radius: var(--radius-md);
                padding: var(--space-lg);
                transition: all var(--perf-transition);
            }
            
            .metric-card:hover {
                border-color: var(--nasa-cyan-bright);
                box-shadow: var(--glow-cyan);
            }
            
            .metric-header {
                display: flex;
                align-items: center;
                gap: var(--space-md);
                margin-bottom: var(--space-md);
            }
            
            .metric-icon {
                font-size: var(--font-size-xl);
            }
            
            .metric-title {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                color: var(--nasa-cyan-bright);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .metric-value {
                font-size: var(--font-size-3xl);
                font-weight: var(--font-weight-bold);
                color: var(--nasa-green-status);
                margin-bottom: var(--space-sm);
                font-family: 'Courier New', monospace;
            }
            
            .metric-subtitle {
                font-size: var(--font-size-xs);
                color: var(--spectrum-gray-400);
                margin-bottom: var(--space-md);
            }
            
            .metric-bar {
                width: 100%;
                height: 8px;
                background: var(--spectrum-gray-800);
                border-radius: var(--radius-full);
                overflow: hidden;
                position: relative;
            }
            
            .metric-fill {
                height: 100%;
                background: var(--gradient-success);
                transition: width var(--transition-normal);
                border-radius: var(--radius-full);
            }
            
            .metric-fill.warning {
                background: var(--gradient-warning);
            }
            
            .metric-fill.danger {
                background: var(--gradient-error);
            }
            
            .metric-trend {
                position: absolute;
                top: var(--space-sm);
                right: var(--space-sm);
                font-size: var(--font-size-sm);
            }
            
            .trend-up {
                color: var(--nasa-green-status);
            }
            
            .trend-down {
                color: var(--nasa-red-alert);
            }
        `;
    }

    getTemplate() {
        return `
            <div class="metrics-grid">
                <slot></slot>
            </div>
        `;
    }

    addMetric(id, icon, title, value, subtitle, percentage = 100, trend = null) {
        this.metrics.set(id, { icon, title, value, subtitle, percentage, trend });
        this.renderMetrics();
    }

    updateMetric(id, updates) {
        const metric = this.metrics.get(id);
        if (metric) {
            Object.assign(metric, updates);
            this.renderMetrics();
        }
    }

    renderMetrics() {
        const metricsHTML = Array.from(this.metrics.entries()).map(([id, metric]) => `
            <div class="metric-card" data-metric-id="${id}">
                <div class="metric-header">
                    <div class="metric-icon">${metric.icon}</div>
                    <div class="metric-title">${metric.title}</div>
                    ${metric.trend ? `<div class="metric-trend trend-${metric.trend > 0 ? 'up' : 'down'}">
                        ${metric.trend > 0 ? '↗' : '↘'} ${Math.abs(metric.trend)}%
                    </div>` : ''}
                </div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-subtitle">${metric.subtitle}</div>
                <div class="metric-bar">
                    <div class="metric-fill ${metric.percentage > 80 ? '' : metric.percentage > 50 ? 'warning' : 'danger'}" 
                         style="width: ${metric.percentage}%"></div>
                </div>
            </div>
        `).join('');

        this.shadowRoot.querySelector('.metrics-grid').innerHTML = metricsHTML;
    }

    startAutoUpdate(interval = 5000) {
        this.updateInterval = setInterval(() => {
            this.dispatchEvent(new CustomEvent('metrics-update-requested', {
                detail: { componentId: this.componentId }
            }));
        }, interval);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.stopAutoUpdate();
    }
}

// ===== REGISTER COMPONENTS =====
customElements.define('mission-component-base', MissionComponentBase);
customElements.define('mission-button', MissionButton);
customElements.define('mission-panel', MissionPanel);
customElements.define('mission-metrics', MissionMetrics);

// ===== COMPONENT REGISTRY =====
window.MissionComponents = {
    MissionComponentBase,
    MissionButton,
    MissionPanel,
    MissionMetrics,
    
    // Utility functions
    createComponent(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        if (content) {
            element.innerHTML = content;
        }
        return element;
    },
    
    // Performance tracking
    trackAllComponents() {
        const components = document.querySelectorAll('[is^="mission-"], mission-*');
        const stats = {
            total: components.length,
            renderTimes: [],
            averageRenderTime: 0
        };
        
        components.forEach(component => {
            if (component.lastRenderTime) {
                stats.renderTimes.push(component.lastRenderTime);
            }
        });
        
        if (stats.renderTimes.length > 0) {
            stats.averageRenderTime = stats.renderTimes.reduce((a, b) => a + b, 0) / stats.renderTimes.length;
        }
        
        return stats;
    }
};

console.log(`
🎯 MISSION COMPONENTS - Layer 2 Loaded
=====================================
✅ MissionComponentBase: Enterprise foundation
✅ MissionButton: Interactive mission controls  
✅ MissionPanel: Status display panels
✅ MissionMetrics: Real-time metrics display
✅ Component Registry: Management utilities
✅ Performance Tracking: Built-in optimization

🚀 READY FOR MISSION CONTROL INTEGRATION
`);