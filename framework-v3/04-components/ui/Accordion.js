/**
 * BRUTAL V3 - Accordion Component
 * Smooth animated accordion with GPU acceleration
 * Zero dependencies, accessible, keyboard navigation
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';
import { html } from '../../01-core/Template.js';
import { animationSystem } from '../../02-performance/08-AnimationSystem.js';

export class Accordion extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {
            multiple: false, // Allow multiple panels open
            collapsible: true, // Allow all panels to be closed
            animation: 'smooth', // smooth, bounce, spring, none
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            icons: true,
            iconPosition: 'left', // left, right
            theme: 'brutal' // brutal, minimal, neon, glassmorphic
        };
        
        // State
        this._panels = [];
        this._expandedPanels = new Set();
        this._animatingPanels = new Set();
        this._focusedIndex = -1;
        
        // Performance
        this._measureCache = new Map();
        this._resizeObserver = null;
        
        // ARIA
        this._ariaProps.role = 'region';
    }
    
    template() {
        const theme = this._getThemeStyles();
        
        return html`
            <div class="accordion-container ${this._config.theme}">
                ${this._panels.map((panel, index) => this._renderPanel(panel, index)).join('')}
            </div>
            
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                
                .accordion-container {
                    width: 100%;
                    isolation: isolate;
                }
                
                /* Panel styles */
                .accordion-panel {
                    margin-bottom: var(--panel-gap, 2px);
                    overflow: hidden;
                    ${theme.panel}
                }
                
                .accordion-panel:last-child {
                    margin-bottom: 0;
                }
                
                /* Header styles */
                .accordion-header {
                    position: relative;
                    width: 100%;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    user-select: none;
                    transition: all 200ms ease;
                    ${theme.header}
                }
                
                .accordion-header:hover {
                    ${theme.headerHover}
                }
                
                .accordion-header:focus-visible {
                    outline: 2px solid currentColor;
                    outline-offset: -2px;
                    z-index: 1;
                }
                
                .accordion-header.expanded {
                    ${theme.headerExpanded}
                }
                
                /* Icon styles */
                .accordion-icon {
                    flex-shrink: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform var(--duration, 300ms) var(--easing);
                    ${theme.icon}
                }
                
                .accordion-icon.icon-right {
                    order: 1;
                    margin-left: auto;
                }
                
                .accordion-header.expanded .accordion-icon {
                    transform: rotate(180deg);
                }
                
                /* Title styles */
                .accordion-title {
                    flex: 1;
                    font-weight: 600;
                    font-size: 16px;
                    ${theme.title}
                }
                
                /* Content wrapper */
                .accordion-content-wrapper {
                    overflow: hidden;
                    transition: height var(--duration, 300ms) var(--easing);
                    will-change: height;
                }
                
                .accordion-content-wrapper.collapsed {
                    height: 0 !important;
                }
                
                .accordion-content-wrapper.animating {
                    pointer-events: none;
                }
                
                /* Content styles */
                .accordion-content {
                    padding: 20px;
                    ${theme.content}
                }
                
                /* Animation variations */
                .animation-bounce .accordion-content-wrapper {
                    transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                .animation-spring .accordion-content-wrapper {
                    transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                .animation-none .accordion-content-wrapper {
                    transition: none;
                }
                
                /* Disabled state */
                .accordion-panel.disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                .accordion-panel.disabled .accordion-header {
                    cursor: not-allowed;
                }
                
                /* Loading state */
                .accordion-content.loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100px;
                }
                
                .loading-spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top-color: currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Themes */
                .brutal {
                    --panel-gap: 2px;
                }
                
                .minimal {
                    --panel-gap: 1px;
                }
                
                .neon {
                    --panel-gap: 4px;
                }
                
                .glassmorphic {
                    --panel-gap: 8px;
                }
                
                /* Focus trap */
                .focus-trap {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .accordion-header {
                        padding: 14px 16px;
                    }
                    
                    .accordion-content {
                        padding: 16px;
                    }
                    
                    .accordion-title {
                        font-size: 14px;
                    }
                }
                
                /* Print styles */
                @media print {
                    .accordion-content-wrapper {
                        height: auto !important;
                        transition: none !important;
                    }
                    
                    .accordion-icon {
                        display: none;
                    }
                }
                
                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .accordion-content-wrapper,
                    .accordion-icon {
                        transition: none !important;
                    }
                }
            </style>
        `.content;
    }
    
    _renderPanel(panel, index) {
        const isExpanded = this._expandedPanels.has(panel.id);
        const isAnimating = this._animatingPanels.has(panel.id);
        const isDisabled = panel.disabled || false;
        
        return `
            <div class="accordion-panel ${isDisabled ? 'disabled' : ''} animation-${this._config.animation}"
                 data-panel-id="${panel.id}"
                 data-index="${index}">
                <button class="accordion-header ${isExpanded ? 'expanded' : ''}"
                        data-action="toggle"
                        data-panel-id="${panel.id}"
                        role="button"
                        aria-expanded="${isExpanded}"
                        aria-controls="content-${panel.id}"
                        ${isDisabled ? 'disabled' : ''}>
                    ${this._config.icons && this._config.iconPosition === 'left' ? this._renderIcon() : ''}
                    <span class="accordion-title">${this._escapeHtml(panel.title)}</span>
                    ${this._config.icons && this._config.iconPosition === 'right' ? this._renderIcon(true) : ''}
                </button>
                <div class="accordion-content-wrapper ${isExpanded ? '' : 'collapsed'} ${isAnimating ? 'animating' : ''}"
                     id="content-${panel.id}"
                     role="region"
                     aria-labelledby="header-${panel.id}"
                     style="--duration: ${this._config.duration}ms; --easing: ${this._config.easing};">
                    <div class="accordion-content">
                        ${panel.loading ? `
                            <div class="loading">
                                <div class="loading-spinner"></div>
                            </div>
                        ` : panel.content || ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    _renderIcon(isRight = false) {
        return `
            <span class="accordion-icon ${isRight ? 'icon-right' : ''}">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 8 10 12 14 8"/>
                </svg>
            </span>
        `;
    }
    
    _getThemeStyles() {
        const themes = {
            brutal: {
                panel: `
                    background: #000;
                    border: 2px solid #0f0;
                `,
                header: `
                    background: #000;
                    color: #0f0;
                    border: none;
                    font-family: monospace;
                `,
                headerHover: `
                    background: rgba(0, 255, 0, 0.1);
                `,
                headerExpanded: `
                    background: #0f0;
                    color: #000;
                `,
                icon: `
                    color: inherit;
                `,
                title: `
                    text-transform: uppercase;
                    letter-spacing: 1px;
                `,
                content: `
                    background: #111;
                    color: #0f0;
                    font-family: monospace;
                    border-top: 2px solid #0f0;
                `
            },
            minimal: {
                panel: `
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                `,
                header: `
                    background: #fff;
                    color: #333;
                    border: none;
                `,
                headerHover: `
                    background: #f5f5f5;
                `,
                headerExpanded: `
                    background: #f0f0f0;
                `,
                icon: `
                    color: #666;
                `,
                title: `
                    font-weight: 500;
                `,
                content: `
                    background: #fafafa;
                    color: #666;
                    border-top: 1px solid #e0e0e0;
                `
            },
            neon: {
                panel: `
                    background: #1a1a2e;
                    border: 2px solid #00ffff;
                    border-radius: 8px;
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
                `,
                header: `
                    background: transparent;
                    color: #00ffff;
                    border: none;
                    text-shadow: 0 0 10px #00ffff;
                `,
                headerHover: `
                    background: rgba(0, 255, 255, 0.1);
                    box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.2);
                `,
                headerExpanded: `
                    background: rgba(0, 255, 255, 0.2);
                    box-shadow: inset 0 0 30px rgba(0, 255, 255, 0.3);
                `,
                icon: `
                    filter: drop-shadow(0 0 5px #00ffff);
                `,
                title: `
                    font-weight: 600;
                `,
                content: `
                    background: rgba(0, 255, 255, 0.05);
                    color: #00ffff;
                    border-top: 2px solid #00ffff;
                `
            },
            glassmorphic: {
                panel: `
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                `,
                header: `
                    background: transparent;
                    color: #fff;
                    border: none;
                `,
                headerHover: `
                    background: rgba(255, 255, 255, 0.1);
                `,
                headerExpanded: `
                    background: rgba(255, 255, 255, 0.15);
                `,
                icon: `
                    color: rgba(255, 255, 255, 0.8);
                `,
                title: `
                    font-weight: 500;
                `,
                content: `
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.9);
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                `
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame(() => {
            // Setup event handlers
            this._setupEventHandlers();
            
            // Setup keyboard navigation
            this._setupKeyboardNavigation();
            
            // Setup resize observer
            this._setupResizeObserver();
            
            // Measure initial heights
            this._measureAllPanels();
        });
    }
    
    _setupEventHandlers() {
        this.shadowRoot.addEventListener('click', (e) => {
            const header = e.target.closest('.accordion-header');
            if (header && !header.disabled) {
                const panelId = header.dataset.panelId;
                this.toggle(panelId);
            }
        });
    }
    
    _setupKeyboardNavigation() {
        this.shadowRoot.addEventListener('keydown', (e) => {
            const header = e.target.closest('.accordion-header');
            if (!header) return;
            
            const headers = Array.from(this.shadowRoot.querySelectorAll('.accordion-header:not([disabled])'));
            const currentIndex = headers.indexOf(header);
            let newIndex = currentIndex;
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newIndex = currentIndex - 1;
                    if (newIndex < 0) newIndex = headers.length - 1;
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    newIndex = currentIndex + 1;
                    if (newIndex >= headers.length) newIndex = 0;
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    newIndex = 0;
                    break;
                    
                case 'End':
                    e.preventDefault();
                    newIndex = headers.length - 1;
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.toggle(header.dataset.panelId);
                    return;
            }
            
            if (newIndex !== currentIndex) {
                headers[newIndex].focus();
                this._focusedIndex = newIndex;
            }
        });
    }
    
    _setupResizeObserver() {
        this._resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const panelId = entry.target.closest('.accordion-panel')?.dataset.panelId;
                if (panelId && this._expandedPanels.has(panelId)) {
                    this._measurePanel(panelId);
                    this._updatePanelHeight(panelId);
                }
            }
        });
        
        // Observe all content elements
        const contents = this.shadowRoot.querySelectorAll('.accordion-content');
        contents.forEach(content => {
            this._resizeObserver.observe(content);
        });
    }
    
    _measureAllPanels() {
        this._panels.forEach(panel => {
            this._measurePanel(panel.id);
        });
    }
    
    _measurePanel(panelId) {
        const wrapper = this.shadowRoot.querySelector(`#content-${panelId}`);
        const content = wrapper?.querySelector('.accordion-content');
        
        if (content) {
            // Temporarily show to measure
            const wasCollapsed = wrapper.classList.contains('collapsed');
            if (wasCollapsed) {
                wrapper.style.height = 'auto';
                wrapper.style.visibility = 'hidden';
                wrapper.classList.remove('collapsed');
            }
            
            const height = content.offsetHeight;
            this._measureCache.set(panelId, height);
            
            if (wasCollapsed) {
                wrapper.classList.add('collapsed');
                wrapper.style.height = '';
                wrapper.style.visibility = '';
            }
        }
    }
    
    _updatePanelHeight(panelId) {
        const wrapper = this.shadowRoot.querySelector(`#content-${panelId}`);
        const height = this._measureCache.get(panelId);
        
        if (wrapper && height !== undefined) {
            if (this._expandedPanels.has(panelId)) {
                wrapper.style.height = `${height}px`;
            } else {
                wrapper.style.height = '0';
            }
        }
    }
    
    addPanel(panel) {
        if (!panel.id) {
            panel.id = `panel-${Date.now()}`;
        }
        
        this._panels.push(panel);
        this.render();
        
        // Measure new panel
        requestAnimationFrame(() => {
            this._measurePanel(panel.id);
            
            // Observe new content
            const content = this.shadowRoot.querySelector(`#content-${panel.id} .accordion-content`);
            if (content && this._resizeObserver) {
                this._resizeObserver.observe(content);
            }
        });
        
        // Emit event
        this.dispatchEvent(new CustomEvent('paneladd', {
            detail: { panel }
        }));
    }
    
    removePanel(panelId) {
        const index = this._panels.findIndex(p => p.id === panelId);
        if (index === -1) return;
        
        const panel = this._panels[index];
        this._panels.splice(index, 1);
        
        // Clean up state
        this._expandedPanels.delete(panelId);
        this._animatingPanels.delete(panelId);
        this._measureCache.delete(panelId);
        
        this.render();
        
        // Emit event
        this.dispatchEvent(new CustomEvent('panelremove', {
            detail: { panel }
        }));
    }
    
    toggle(panelId) {
        if (this._animatingPanels.has(panelId)) return;
        
        const panel = this._panels.find(p => p.id === panelId);
        if (!panel || panel.disabled) return;
        
        const isExpanded = this._expandedPanels.has(panelId);
        
        if (isExpanded) {
            this.collapse(panelId);
        } else {
            this.expand(panelId);
        }
    }
    
    expand(panelId) {
        const panel = this._panels.find(p => p.id === panelId);
        if (!panel || panel.disabled) return;
        
        // Handle multiple mode
        if (!this._config.multiple) {
            // Collapse other panels
            const otherPanels = [...this._expandedPanels].filter(id => id !== panelId);
            otherPanels.forEach(id => this.collapse(id));
        }
        
        // Check if already expanded
        if (this._expandedPanels.has(panelId)) return;
        
        // Mark as animating
        this._animatingPanels.add(panelId);
        
        // Update state
        this._expandedPanels.add(panelId);
        
        // Load content if needed
        if (panel.loader && !panel.content) {
            panel.loading = true;
            this.render();
            
            Promise.resolve(panel.loader()).then(content => {
                panel.content = content;
                panel.loading = false;
                delete panel.loader;
                this.render();
                
                requestAnimationFrame(() => {
                    this._measurePanel(panelId);
                    this._animateExpand(panelId);
                });
            });
        } else {
            this.render();
            requestAnimationFrame(() => {
                this._animateExpand(panelId);
            });
        }
        
        // Emit event
        this.dispatchEvent(new CustomEvent('expand', {
            detail: { panel }
        }));
    }
    
    collapse(panelId) {
        const panel = this._panels.find(p => p.id === panelId);
        if (!panel) return;
        
        // Check if collapsible
        if (!this._config.collapsible && this._expandedPanels.size === 1) {
            return;
        }
        
        // Check if already collapsed
        if (!this._expandedPanels.has(panelId)) return;
        
        // Mark as animating
        this._animatingPanels.add(panelId);
        
        // Update state
        this._expandedPanels.delete(panelId);
        
        this.render();
        requestAnimationFrame(() => {
            this._animateCollapse(panelId);
        });
        
        // Emit event
        this.dispatchEvent(new CustomEvent('collapse', {
            detail: { panel }
        }));
    }
    
    _animateExpand(panelId) {
        const wrapper = this.shadowRoot.querySelector(`#content-${panelId}`);
        const header = this.shadowRoot.querySelector(`[data-panel-id="${panelId}"] .accordion-header`);
        
        if (!wrapper) return;
        
        // Get target height
        const height = this._measureCache.get(panelId) || 0;
        
        // Set initial state
        wrapper.style.height = '0';
        wrapper.classList.remove('collapsed');
        
        // Force reflow
        wrapper.offsetHeight;
        
        // Animate to target height
        wrapper.style.height = `${height}px`;
        
        // Update header
        if (header) {
            header.classList.add('expanded');
            header.setAttribute('aria-expanded', 'true');
        }
        
        // Clean up after animation
        setTimeout(() => {
            wrapper.style.height = '';
            this._animatingPanels.delete(panelId);
            wrapper.classList.remove('animating');
        }, this._config.duration);
    }
    
    _animateCollapse(panelId) {
        const wrapper = this.shadowRoot.querySelector(`#content-${panelId}`);
        const header = this.shadowRoot.querySelector(`[data-panel-id="${panelId}"] .accordion-header`);
        
        if (!wrapper) return;
        
        // Get current height
        const height = wrapper.offsetHeight;
        
        // Set explicit height
        wrapper.style.height = `${height}px`;
        
        // Force reflow
        wrapper.offsetHeight;
        
        // Animate to 0
        wrapper.style.height = '0';
        
        // Update header
        if (header) {
            header.classList.remove('expanded');
            header.setAttribute('aria-expanded', 'false');
        }
        
        // Clean up after animation
        setTimeout(() => {
            wrapper.classList.add('collapsed');
            wrapper.style.height = '';
            this._animatingPanels.delete(panelId);
            wrapper.classList.remove('animating');
        }, this._config.duration);
    }
    
    expandAll() {
        if (!this._config.multiple) return;
        
        this._panels.forEach(panel => {
            if (!panel.disabled) {
                this.expand(panel.id);
            }
        });
    }
    
    collapseAll() {
        if (!this._config.collapsible) return;
        
        this._panels.forEach(panel => {
            this.collapse(panel.id);
        });
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        this.render();
    }
    
    updatePanel(panelId, updates) {
        const panel = this._panels.find(p => p.id === panelId);
        if (!panel) return;
        
        Object.assign(panel, updates);
        this.render();
        
        // Re-measure if content changed
        if (updates.content !== undefined) {
            requestAnimationFrame(() => {
                this._measurePanel(panelId);
                if (this._expandedPanels.has(panelId)) {
                    this._updatePanelHeight(panelId);
                }
            });
        }
        
        // Emit event
        this.dispatchEvent(new CustomEvent('panelupdate', {
            detail: { panel }
        }));
    }
    
    getPanels() {
        return [...this._panels];
    }
    
    getExpandedPanels() {
        return [...this._expandedPanels];
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
    }
}

// Register element
customElements.define('brutal-accordion', Accordion);