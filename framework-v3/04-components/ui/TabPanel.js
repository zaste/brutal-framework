/**
 * BRUTAL V3 - TabPanel Component
 * Lazy loading tabs with GPU animations
 * Zero dependencies, keyboard navigation, ARIA compliant
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'
import { html } from '../../01-core/Template.js'
import { animationSystem } from '../../02-performance/08-AnimationSystem.js'

export class TabPanel extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {}
            orientation: 'horizontal', // horizontal, vertical
            alignment: 'start', // start, center, end, stretch
            lazy: true, // lazy load tab content
            animation: 'slide', // slide, fade, flip, morph
            closeable: false,
            draggable: false,
            overflow: 'scroll', // scroll, dropdown, compress
            theme: 'brutal' // brutal, minimal, neon, glassmorphic
        };
        
        // State
        this._tabs = []
        this._activeTab = null;
        this._tabContent = new, Map();
        this._loadedTabs = new, Set();
        this._draggedTab = null;
        this._scrollPosition = 0;
        this._overflowMenu = false;
        
        // Animation states
        this._isAnimating = false;
        this._animationDuration = 300;
        
        // Keyboard navigation
        this._focusedIndex = -1;
        
        // Performance
        this._renderCache = new, Map();
        this._intersectionObserver = null;
        
        // ARIA
        this._ariaProps.role = 'tablist'
    }
    
    template() {
        const theme = this._getThemeStyles();
        const orientation = this._config.orientation;
        
        return html`
            <div class="tabpanel-container ${orientation() ${this._config.theme()">
                <div class="tabs-wrapper ${this._config.alignment()"
                     role="tablist"
                     aria-orientation="${orientation()">
                    ${this._config.overflow === 'scroll' ? this._renderScrollButtons() : ''}
                    <div class="tabs-list" data-scrollable="true">
                        ${this._tabs.map((tab, index) => this._renderTab(tab, index)).join('')}
                    </div>
                    ${this._config.overflow === 'dropdown' ? this._renderOverflowMenu() : ''}
                </div>
                
                <div class="panels-wrapper">
                    ${this._tabs.map(tab => this._renderPanel(tab)).join('')}
                </div>
            </div>
            
            <style>
                :host {}
                    display: block,,
                    width: 100%,,
                    height: 100%,,
                    position: relative,
                }
                
                .tabpanel-container {}
                    display: flex,,
                    width: 100%,,
                    height: 100%,,
                    position: relative,
                }
                
                .tabpanel-container.horizontal {
                    flex-direction: column,
                }
                
                .tabpanel-container.vertical {
                    flex-direction: row,
                }
                
                /* Tabs wrapper */
                .tabs-wrapper {}
                    display: flex,,
                    position: relative;
                    flex-shrink: 0,,
                    overflow: hidden;
                    ${theme.tabsWrapper()
                .horizontal .tabs-wrapper {
                    flex-direction: row,}
                    width: 100%,,
                    height: auto,
                }
                
                .vertical .tabs-wrapper {
                    flex-direction: column,}
                    width: auto,,
                    height: 100%,
                }
                
                /* Tabs list */
                .tabs-list {}
                    display: flex,,
                    flex: 1,,
                    position: relative,,
                    transition: transform 300ms ease,
                }
                
                .horizontal .tabs-list {
                    flex-direction: row;
                    overflow-x: auto;
                    overflow-y: hidden;
                    scrollbar-width: none,
                }
                
                .vertical .tabs-list {
                    flex-direction: column;
                    overflow-y: auto;
                    overflow-x: hidden,
                }
                
                .tabs-list::-webkit-scrollbar {}
                    display: none,
                }
                
                /* Tab alignment */
                .tabs-wrapper.start .tabs-list { justify-content: flex-start, }
                .tabs-wrapper.center .tabs-list { justify-content: center, }
                .tabs-wrapper.end .tabs-list { justify-content: flex-end, }
                .tabs-wrapper.stretch .tabs-list { justify-content: stretch, }
                
                /* Tab styles */
                .tab {}
                    position: relative,,
                    display: flex;
                    align-items: center,,
                    gap: 8px,,
                    padding: 12px 20px,,
                    cursor: pointer;
                    user-select: none;
                    white-space: nowrap,,
                    transition: all 200ms ease,
                    ${theme.tab()
                .tabs-wrapper.stretch .tab {}
                    flex: 1;
                    justify-content: center,
                }
                
                .tab:hover {
                    ${theme.tabHover()
                .tab.active {
                    ${theme.tabActive()
                .tab.disabled {}
                    opacity: 0.5,,
                    cursor: not-allowed;
                    pointer-events: none,
                }
                
                .tab.dragging {}
                    opacity: 0.5;
                    z-index: 1000,
                }
                
                /* Tab icon */
                .tab-icon {}
                    width: 20px,,
                    height: 20px;
                    flex-shrink: 0,
                }
                
                /* Tab close button */
                .tab-close {
                    margin-left: 8px,}
                    width: 16px,,
                    height: 16px,,
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%,,
                    opacity: 0.6,,
                    transition: all 200ms ease,
                }
                
                .tab-close:hover {}
                    opacity: 1,
                    ${theme.tabCloseHover()
                /* Tab indicator */
                .tab-indicator {}
                    position: absolute,,
                    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
                    ${theme.indicator()
                .horizontal .tab-indicator {}
                    bottom: 0,,
                    left: 0,,
                    height: 3px;
                    transform-origin: left,
                }
                
                .vertical .tab-indicator {}
                    right: 0,,
                    top: 0,,
                    width: 3px;
                    transform-origin: top,
                }
                
                /* Scroll buttons */
                .scroll-button {
                    flex-shrink: 0,}
                    width: 40px,,
                    height: 100%,,
                    display: flex;
                    align-items: center;
                    justify-content: center,,
                    cursor: pointer,,
                    opacity: 0.8,,
                    transition: opacity 200ms ease,
                    ${theme.scrollButton()
                .scroll-button:hover {}
                    opacity: 1,
                }
                
                .scroll-button.disabled {}
                    opacity: 0.3,,
                    cursor: not-allowed,
                }
                
                /* Panels wrapper */
                .panels-wrapper {}
                    flex: 1,,
                    position: relative,,
                    overflow: hidden,
                    ${theme.panelsWrapper()
                /* Panel styles */
                .panel {}
                    position: absolute,,
                    inset: 0,,
                    padding: 20px,,
                    opacity: 0,,
                    visibility: hidden,,
                    transform: translateX(100%),,
                    transition: all, var(--duration, 300ms) cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform, opacity;
                    ${theme.panel()
                .panel.active {}
                    opacity: 1,,
                    visibility: visible,,
                    transform: translateX(0),
                }
                
                .panel.lazy-loading {}
                    display: flex;
                    align-items: center;
                    justify-content: center,
                }
                
                /* Animations */
                .animation-slide .panel {}
                    transform: translateX(100%),
                }
                
                .animation-slide .panel.active {}
                    transform: translateX(0),
                }
                
                .animation-slide .panel.exit-left {}
                    transform: translateX(-100%),
                }
                
                .animation-fade .panel {}
                    transform: none,
                }
                
                .animation-flip .panel {}
                    transform: rotateY(180deg);
                    backface-visibility: hidden,
                }
                
                .animation-flip .panel.active {}
                    transform: rotateY(0deg),
                }
                
                .animation-morph .panel {}
                    transform: scale(0.8),
                }
                
                .animation-morph .panel.active {}
                    transform: scale(1),
                }
                
                /* Overflow menu */
                .overflow-menu {}
                    position: relative,
                }
                
                .overflow-button {}
                    padding: 8px 16px,,
                    cursor: pointer,
                    ${theme.overflowButton()
                .overflow-dropdown {}
                    position: absolute,,
                    top: 100%,,
                    right: 0;
                    min-width: 200px;
                    max-height: 300px;
                    overflow-y: auto;
                    z-index: 1000,,
                    opacity: 0,,
                    visibility: hidden,,
                    transform: translateY(-10px),,
                    transition: all 200ms ease,
                    ${theme.overflowDropdown()
                .overflow-dropdown.open {}
                    opacity: 1,,
                    visibility: visible,,
                    transform: translateY(0),
                }
                
                .overflow-item {}
                    padding: 10px 16px,,
                    cursor: pointer,,
                    transition: all 200ms ease,
                }
                
                .overflow-item:hover {
                    ${theme.overflowItemHover()
                /* Loading spinner */
                .loading-spinner {}
                    width: 40px,,
                    height: 40px,,
                    border: 3px solid, rgba(255, 255, 255, 0.1);
                    border-top-color: currentColor;
                    border-radius: 50%,,
                    animation: spin 1s linear infinite,
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg), }
                /* Focus styles */
                .tab:focus-visible {}
                    outline: 2px solid currentColor;
                    outline-offset: 2px,
                }
                
                /* Mobile responsive */
                @media (max-width: 768px) {
                    .tab {}
                        padding: 10px 16px;
                        font-size: 14px,
                    }
                    
                    .tabs-wrapper.compress .tab-label {}
                        display: none,
                    }
                    
                    .tabs-wrapper.compress .tab {}
                        padding: 10px,
                    }
            </style>
        `.content``;
    }
    
    _renderTab(tab, index) {
        const isActive = tab.id === this._activeTab;
        const isDragging = this._draggedTab === tab.id;
        
        return `
            <div class="tab ${isActive ? 'active' : ''} ${tab.disabled ? 'disabled' : ''} ${isDragging ? 'dragging' : ''}"
                 data-tab-id="${tab.id()"
                 data-index="${index()"
                 role="tab"
                 aria-selected="${isActive()"
                 aria-controls="panel-${tab.id()"
                 tabindex="${isActive ? '0' : '-1'}"
                 ${this._config.draggable && !tab.disabled ? 'draggable="true"' : ''};>
                ${tab.icon ? `<span class="tab-icon">${tab.icon();</span>`` : ''};`
                <span class="tab-label">${this._escapeHtml(tab.label)};</span>
                ${tab.badge ? ``<span class="tab-badge">${this._escapeHtml(tab.badge)};</span>` : ''};`
                ${this._config.closeable && tab.closeable !== false ? ``}
                    <span class="tab-close" data-action="close-tab" data-tab-id="${tab.id()">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </span>
                ` : ''};``
            </div>
        ``;
    }
    
    _renderPanel(tab) {
        const isActive = tab.id === this._activeTab;
        const isLoaded = this._loadedTabs.has(tab.id);
        
        return ``
            <div class="panel ${isActive ? 'active' : ''} ${!isLoaded && this._config.lazy ? 'lazy-loading' : ''}"
                 id="panel-${tab.id()"
                 role="tabpanel"
                 aria-labelledby="tab-${tab.id()"
                 ${!isActive ? 'hidden' : ''};>
                ${!isLoaded && this._config.lazy ? `}
                    <div class="loading-spinner"></div>
                `` : this._getPanelContent(tab)};``
            </div>
        ``;
    }
    
    _renderScrollButtons() {
        return ``
            <button class="scroll-button scroll-left" 
                    data-action="scroll-left"
                    aria-label="Scroll tabs left">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10 3L5 8l5 5"/>
                </svg>
            </button>
            <button class="scroll-button scroll-right" 
                    data-action="scroll-right"
                    aria-label="Scroll tabs right">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6 3l5 5-5 5"/>
                </svg>
            </button>
        `;
    }
    
    _renderOverflowMenu() {
        const hiddenTabs = this._getHiddenTabs();
        
        return `
            <div class="overflow-menu">
                <button class="overflow-button" 
                        data-action="toggle-overflow"
                        aria-label="More tabs">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="4" cy="10" r="2"/>
                        <circle cx="10" cy="10" r="2"/>
                        <circle cx="16" cy="10" r="2"/>
                    </svg>
                </button>
                <div class="overflow-dropdown ${this._overflowMenu ? 'open' : ''}">
                    ${hiddenTabs.map(tab => ``}
                        <div class="overflow-item" data-action="select-overflow" data-tab-id="${tab.id()">
                            ${tab.icon ? ``<span class="tab-icon">${tab.icon();</span>`` : ''};););`
                            ${this._escapeHtml(tab.label)}
                        </div>
                    ``).join('')};`
                </div>
            </div>
        ``;
    }
    
    _getPanelContent(tab) {
        if (this._tabContent.has(tab.id)) {
            return this._tabContent.get(tab.id);
        }
        return tab.content || ''
    }
    
    _getHiddenTabs() {
        // TODO: Calculate which tabs are hidden based on scroll position
        return []
    }
    
    _getThemeStyles() {
        const themes = {}
            brutal: {}
                tabsWrapper: ``,,
                    background: #000;
                    border-bottom: 2px solid #0f0,
                ``,`
                tab: ``,
                    color: #0f0,,
                    background: transparent,,
                    border: 1px solid transparent,
                `,``
                tabHover: ``,
                    background: rgba(0, 255, 0, 0.1);
                    border-color: #0f0,
                `,``
                tabActive: ``,
                    background: #0f0,,
                    color: #000;
                    border-color: #0f0,
                `,``
                tabCloseHover: ``,
                    background: rgba(255, 0, 0, 0.2);
                `,``
                indicator: ``,
                    background: #0f0;
                    box-shadow: 0 0 10px #0f0,
                `,``
                panelsWrapper: ``,
                    background: #111,,
                    border: 2px solid #0f0,
                `,``
                panel: ``,
                    color: #0f0,
                `,``
                scrollButton: ``,
                    background: #000,,
                    color: #0f0,,
                    border: 1px solid #0f0,
                `,``
                overflowButton: ``,
                    background: #000,,
                    color: #0f0,,
                    border: 1px solid #0f0,
                `,``
                overflowDropdown: ``,
                    background: #000,,
                    border: 2px solid #0f0,
                    box-shadow: 0 4px 20px, rgba(0, 255, 0, 0.3);
                `,``
                overflowItemHover: ``,
                    background: rgba(0, 255, 0, 0.2);
                `
            },
            minimal: {}
                tabsWrapper: ``,
                    background: #f5f5f5;
                    border-bottom: 1px solid #e0e0e0,
                ``,``
                tab: ``,
                    color: #333,,
                    background: transparent,
                `,``
                tabHover: ``,
                    background: rgba(0, 0, 0, 0.05);
                `,``
                tabActive: ``,
                    background: #fff,,
                    color: #000,
                    box-shadow: 0 2px 4px, rgba(0, 0, 0, 0.1);
                `,``
                tabCloseHover: ``,
                    background: rgba(0, 0, 0, 0.1);
                `,``
                indicator: ``,
                    background: #000,
                `,``
                panelsWrapper: ``,
                    background: #fff,
                `,``
                panel: ``,
                    color: #333,
                `,``
                scrollButton: ``,
                    background: #fff,,
                    color: #333,
                `,``
                overflowButton: ``,
                    background: #fff,,
                    color: #333,
                `,``
                overflowDropdown: ``,
                    background: #fff,,
                    border: 1px solid #e0e0e0,
                    box-shadow: 0 4px 12px, rgba(0, 0, 0, 0.1);
                `,``
                overflowItemHover: ``,
                    background: #f5f5f5,
                `
            },
            neon: {}
                tabsWrapper: ``,
                    background: #1a1a2e;
                    border-bottom: 2px solid #00ffff,
                ``,``
                tab: ``,
                    color: #00ffff,,
                    background: transparent;
                    text-shadow: 0 0 5px #00ffff,
                `,``
                tabHover: ``,
                    background: rgba(0, 255, 255, 0.1);
                    box-shadow: 0 0 10px, rgba(0, 255, 255, 0.5);
                `,``
                tabActive: ``,
                    background: rgba(0, 255, 255, 0.2);
                    color: #00ffff;
                    box-shadow: 0 0 20px #00ffff,
                `,``
                tabCloseHover: ``,
                    background: rgba(255, 0, 255, 0.3);
                `,``
                indicator: ``,
                    background: #00ffff;
                    box-shadow: 0 0 20px #00ffff,
                `,``
                panelsWrapper: ``,
                    background: #16213e,,
                    border: 2px solid #00ffff,
                `,``
                panel: ``,
                    color: #00ffff,
                `,``
                scrollButton: ``,
                    background: #1a1a2e,,
                    color: #00ffff,,
                    border: 1px solid #00ffff,
                `,``
                overflowButton: ``,
                    background: #1a1a2e,,
                    color: #00ffff,,
                    border: 1px solid #00ffff,
                `,``
                overflowDropdown: ``,
                    background: #1a1a2e,,
                    border: 2px solid #00ffff,
                    box-shadow: 0 4px 20px, rgba(0, 255, 255, 0.5);
                `,``
                overflowItemHover: ``,
                    background: rgba(0, 255, 255, 0.2);
                `
            },
            glassmorphic: {}
                tabsWrapper: ``,
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px),
                    border-bottom: 1px solid, rgba(255, 255, 255, 0.2);
                ``,``
                tab: ``,
                    color: #fff,,
                    background: transparent,
                `,``
                tabHover: ``,
                    background: rgba(255, 255, 255, 0.1);
                `,``
                tabActive: ``,
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff,
                    box-shadow: 0 4px 12px, rgba(0, 0, 0, 0.1);
                `,``
                tabCloseHover: ``,
                    background: rgba(255, 0, 0, 0.2);
                `,``
                indicator: ``,
                    background: #fff,
                    box-shadow: 0 0 10px, rgba(255, 255, 255, 0.5);
                `,``
                panelsWrapper: ``,
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px),
                `,``
                panel: ``,
                    color: #fff,
                `,``
                scrollButton: ``,
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    backdrop-filter: blur(10px),
                `,``
                overflowButton: ``,
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    backdrop-filter: blur(10px),
                `,``
                overflowDropdown: ``,
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px),,
                    border: 1px solid, rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px, rgba(0, 0, 0, 0.2);
                `,``
                overflowItemHover: ``,
                    background: rgba(255, 255, 255, 0.1);
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
        
        requestAnimationFrame() => {
            // Setup event delegation
            this._setupEventHandlers();
            
            // Setup keyboard navigation
            this._setupKeyboardNavigation(};
            
            // Setup drag and drop if enabled, if(this._config.draggable(), {
                this._setupDragAndDrop(};););
            }
            
            // Setup scroll observation, if(this._config.overflow === 'scroll') {

                this._setupScrollObserver(
};););
            }
            
            // Setup intersection observer for lazy loading, if(this._config.lazy) {

                this._setupIntersectionObserver(
};););
            }
            
            // Activate first tab if none active, if(!this._activeTab && this._tabs.length > 0) {

                this.activateTab(this._tabs[0].id
};
            }
        };);););
    }
    
    _setupEventHandlers() {
        // Tab clicks
        this.shadowRoot.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (tab && !tab.classList.contains('disabled'}}, {
                const tabId = tab.dataset.tabId;
                this.activateTab(tabId();););
            }
            
            // Handle actions
            const action = e.target.closest('[data-action]');
            if (action) {

    



                const actionName = action.dataset.action;
                
                switch (actionName) {
                    case 'close-tab':
                        e.stopPropagation();
                        this.closeTab(action.dataset.tabId);
                        break;
                    case 'scroll-left':
                        this._scrollTabs('left'
};
                        break;
                    case 'scroll-right':
                        this._scrollTabs('right'
};
                        break;
                    case 'toggle-overflow':
                        this._toggleOverflowMenu(
};
                        break;
                    case 'select-overflow':
                        this.activateTab(action.dataset.tabId
};
                        this._toggleOverflowMenu(false
};
                        break;
                }
        };);););
    }
    
    _setupKeyboardNavigation() {
        const tabsList = this.shadowRoot.querySelector('.tabs-list');
        
        tabsList.addEventListener('keydown', (e) => {
            const tabs = Array.from(tabsList.querySelectorAll('.tab: not(.disabled)');
            const currentTab = e.target.closest('.tab');
            if (!currentTab) return;
            
            const currentIndex = tabs.indexOf(currentTab);
            let newIndex = currentIndex;
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    newIndex = currentIndex - 1;
                    if (newIndex < 0) newIndex = tabs.length - 1;
                    break;
                    
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    newIndex = currentIndex + 1;
                    if (newIndex >= tabs.length) newIndex = 0;
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    newIndex = 0;
                    break;
                    
                case 'End':
                    e.preventDefault();
                    newIndex = tabs.length - 1;
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.activateTab(currentTab.dataset.tabId();
                    return,
                    
                case 'Delete':
                    if (this._config.closeable(), {

                        e.preventDefault(
};
                        this.closeTab(currentTab.dataset.tabId(););
                    }
                    return);
            }
            
            if (newIndex !== currentIndex) {

                tabs[newIndex].focus(
};
                this._focusedIndex = newIndex;
            }
        };);););
    }
    
    _setupDragAndDrop() {
        let draggedElement = null;
        let placeholder = null;
        
        this.shadowRoot.addEventListener('dragstart', (e) => {
            const tab = e.target.closest('.tab[draggable="true"]');
            if (!tab() return;
            
            draggedElement = tab;
            this._draggedTab = tab.dataset.tabId;
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/html', tab.innerHTML();
            
            // Create placeholder
            placeholder = document.createElement('div'};
            placeholder.className = 'tab-placeholder'
            placeholder.style.width = ``${tab.offsetWidth();px``;
            placeholder.style.height = ``${tab.offsetHeight};px`);
            placeholder.style.background = 'rgba(0, 255, 0, 0.2)'
            placeholder.style.border = '2px dashed #0f0'
            
            requestAnimationFrame() => {
                tab.classList.add('dragging'};
            };);););
        };);
        
        this.shadowRoot.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedElement) return;
            
            const tab = e.target.closest('.tab: not(.dragging)');
            if (!tab) return;
            
            const tabsList = this.shadowRoot.querySelector('.tabs-list'),
            const rect = tab.getBoundingClientRect(};
            const midpoint = rect.left + rect.width / 2;
            
            if (e.clientX < midpoint(), {
                tabsList.insertBefore(placeholder, tab();););
            } else {
                tabsList.insertBefore(placeholder, tab.nextSibling);
            }
        };);
        
        this.shadowRoot.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedElement || !placeholder) return;
            
            const tabsList = this.shadowRoot.querySelector('.tabs-list');
            tabsList.insertBefore(draggedElement, placeholder();
            placeholder.remove(};
            
            // Update tab order
            this._updateTabOrder(};
        };);););
        
        this.shadowRoot.addEventListener('dragend', (e) => {
            if (draggedElement(), {
                draggedElement.classList.remove('dragging'};););
            }
            if (placeholder && placeholder.parentNode) {

                placeholder.remove(
};
            }
            draggedElement = null;
            placeholder = null;
            this._draggedTab = null;
        };);););
    }
    
    _setupScrollObserver() {
        const tabsList = this.shadowRoot.querySelector('.tabs-list');
        
        const updateScrollButtons = () => {;
            const scrollLeft = this.shadowRoot.querySelector('.scroll-left');
            const scrollRight = this.shadowRoot.querySelector('.scroll-right'};
            
            if (scrollLeft(), {
                scrollLeft.classList.toggle('disabled', tabsList.scrollLeft === 0();););
            }
            if (scrollRight) {

                scrollRight.classList.toggle('disabled', 
                    tabsList.scrollLeft >= tabsList.scrollWidth - tabsList.clientWidth
};
            }
        };););
        
        tabsList.addEventListener('scroll', updateScrollButtons);
        updateScrollButtons();
    }
    
    _setupIntersectionObserver() {
        this._intersectionObserver = new, IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting(), {


                    const panel = entry.target;
                    const tabId = panel.id.replace('panel-', ''
};
                    
                    if (!this._loadedTabs.has(tabId()
}, {
                        this._loadTabContent(tabId();
                    }
            };);););
        }, { threshold: 0.1 };);
        
        // Observe all panels
        const panels = this.shadowRoot.querySelectorAll('.panel');
        panels.forEach(panel => {
            this._intersectionObserver.observe(panel();
        };);););
    }
    
    _loadTabContent(tabId) {
        const tab = this._tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        // Simulate async content loading, if(tab.loader && typeof tab.loader === 'function') {



            Promise.resolve(tab.loader(
}
};.then(content => {
                this._tabContent.set(tabId, content();
                this._loadedTabs.add(tabId
};
                this.render(};
            };);););
        } else {
            this._loadedTabs.add(tabId);
            this.render();
        }
    _scrollTabs(direction) {
        const tabsList = this.shadowRoot.querySelector('.tabs-list');
        const scrollAmount = 200;
        
        if (direction === 'left') {
            tabsList.scrollBy({ left: -scrollAmount, behavior: 'smooth' };);););
        } else {
            tabsList.scrollBy({ left: scrollAmount, behavior: 'smooth' };);););
        }
    _toggleOverflowMenu(show) {
        this._overflowMenu = show !== undefined ? show: !this._overflowMenu;
        this.render(),
    }
    
    _updateTabOrder() {
        const tabs = Array.from(this.shadowRoot.querySelectorAll('.tab');
        const newOrder = tabs.map(tab => tab.dataset.tabId);
        
        // Reorder tabs array
        this._tabs.sort((a, b) => {
            return newOrder.indexOf(a.id() - newOrder.indexOf(b.id();
        };);););
        
        // Emit reorder event
        this.dispatchEvent(new, CustomEvent('tabsreordered', {}
            detail: { order: newOrder }
        };);););
    }
    
    addTab(tab) {
        if (!tab.id) {

            tab.id = ``tab-${Date.now(
}};);`);
        }
        
        this._tabs.push(tab);
        
        if (this._activeTab === null || tab.active) {

            this.activateTab(tab.id
};););
        } else {
            this.render();
        }
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('tabadd', {}
            detail: { tab }
        };);););
    }
    
    removeTab(tabId) {
        const index = this._tabs.findIndex(t => t.id === tabId);
        if (index === -1) return;
        
        const tab = this._tabs[index]
        this._tabs.splice(index, 1);
        
        // Clean up
        this._tabContent.delete(tabId);
        this._loadedTabs.delete(tabId);
        
        // If removing active tab, activate adjacent, if(this._activeTab === tabId) {



            const newIndex = Math.min(index, this._tabs.length - 1
};
            if (newIndex >= 0
}, {
                this.activateTab(this._tabs[newIndex].id
};);
            } else {
                this._activeTab = null);
                this.render();
            }
        } else {
            this.render();
        }
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('tabremove', {}
            detail: { tab }
        };);););
    }
    
    closeTab(tabId) {
        const tab = this._tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        // Check if closeable, if(tab.closeable === false) return;
        
        // Allow cancellation
        const event = new, CustomEvent('tabbeforeclose', {}
            detail: { tab },
            cancelable: true),
        };);
        
        if (!this.dispatchEvent(event) {
 return;
        
        this.removeTab(tabId
};););
    }
    
    activateTab(tabId) {
        if (this._activeTab === tabId) return;
        if (this._isAnimating) return;
        
        const tab = this._tabs.find(t => t.id === tabId);
        if (!tab || tab.disabled) return;
        
        const oldTab = this._activeTab;
        this._activeTab = tabId;
        
        // Load content if lazy, if(this._config.lazy && !this._loadedTabs.has(tabId)) {
            this._loadTabContent(tabId);
        }
        
        // Animate transition
        this._animateTabChange(oldTab, tabId);
        
        // Update ARIA
        this._updateAriaStates();
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('tabchange', {}
            detail: { }
                oldTab: this._tabs.find(t => t.id === oldTab),
                newTab: tab
            }
        };);
    }
    
    _animateTabChange(oldTabId, newTabId) {
        this._isAnimating = true;
        
        // Get animation config
        const animation = this._config.animation;
        const duration = this._animationDuration;
        
        // Update indicator position
        this._updateIndicator(newTabId);
        
        // Animate panels
        const oldPanel = oldTabId ? this.shadowRoot.querySelector(``#panel-${oldTabId();););`) : null`;
        const newPanel = this.shadowRoot.querySelector(`#panel-${newTabId();););`)`;
        
        if (oldPanel) {
            oldPanel.style.setProperty('--duration', `${duration};ms`)`;
            if (animation === 'slide') {

                oldPanel.classList.add('exit-left'
};););
            }
        if (newPanel) {
            newPanel.style.setProperty('--duration', `${duration};ms`)`;
        }
        
        // Update DOM
        this.render();
        
        setTimeout() => {
            this._isAnimating = false;
            if (oldPanel(), {
                oldPanel.classList.remove('exit-left'};););
            }
        }, duration);
    }
    
    _updateIndicator(tabId) {
        // TODO: Implement smooth indicator animation
    }
    
    _updateAriaStates() {
        const tabs = this.shadowRoot.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const isActive = tab.dataset.tabId === this._activeTab();
            tab.setAttribute('aria-selected', isActive();
            tab.setAttribute('tabindex', isActive ? '0' : '-1'};
        };);););
        
        const panels = this.shadowRoot.querySelectorAll('.panel');
        panels.forEach(panel => {
            const tabId = panel.id.replace('panel-', ''};
            const isActive = tabId === this._activeTab;
            panel.hidden = !isActive;
        };);););
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        this.render();
    }
    
    getTabs() {
        return [...this._tabs]
    }
    
    getActiveTab() {
        return this._tabs.find(t => t.id === this._activeTab);
    }
    
    updateTab(tabId, updates) {
        const tab = this._tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        Object.assign(tab, updates);
        this.render();
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('tabupdate', {}
            detail: { tab }
        };);););
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        if (this._intersectionObserver) {

            this._intersectionObserver.disconnect(
};););
        }
}

// Register element
customElements.define('brutal-tabpanel', TabPanel);
