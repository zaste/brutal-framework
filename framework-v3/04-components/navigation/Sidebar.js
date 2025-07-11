/**
 * @fileoverview BRUTAL Sidebar Component - Responsive navigation sidebar
 * @version 3.0.0
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';

/**
 * BRUTAL Sidebar - Collapsible navigation with gestures
 * Mini variant, overlay mode, touch optimized
 */
export class Sidebar extends InteractiveComponent {
    static get observedAttributes() {
        return [
            'position',     // left | right
            'width',        // sidebar width
            'mini-width',   // width when collapsed
            'mode',         // push | overlay | mini
            'collapsed',    // boolean - start collapsed
            'backdrop',     // boolean - show backdrop in overlay
            'swipeable',    // boolean - enable swipe gestures
            'breakpoint',   // responsive breakpoint
            'persist',      // boolean - persist state
            'animated',     // boolean - animate transitions
            'header',       // header content/title
            'footer'        // footer content
        ];
    }
    
    constructor() {
        super();
        
        // State
        this.state = {
            position: 'left',
            width: '280px',
            miniWidth: '60px',
            mode: 'push',
            collapsed: false,
            backdrop: true,
            swipeable: true,
            breakpoint: '768px',
            persist: true,
            animated: true,
            header: '',
            footer: '',
            
            // Internal
            isMobile: false,
            isDragging: false,
            dragStart: 0,
            dragOffset: 0,
            isClosing: false
        };
        
        // Touch tracking
        this._touchStartX = 0;
        this._touchStartY = 0;
        
        // V8 optimization
        this._boundHandleToggle = this._handleToggle.bind(this);
        this._boundHandleBackdrop = this._handleBackdrop.bind(this);
        this._boundHandleSwipeStart = this._handleSwipeStart.bind(this);
        this._boundHandleSwipeMove = this._handleSwipeMove.bind(this);
        this._boundHandleSwipeEnd = this._handleSwipeEnd.bind(this);
        this._boundHandleResize = this._handleResize.bind(this);
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Restore persisted state
        if (this.state.persist) {
            this._restoreState();
        }
        
        // Check mobile
        this._checkMobile();
        window.addEventListener('resize', this._boundHandleResize);
        
        // Apply to body for push mode
        if (this.state.mode === 'push') {
            this._applyBodyOffset();
        }
        
        // Setup swipe gestures
        if (this.state.swipeable) {
            this._setupSwipeGestures();
        }
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this._boundHandleResize);
        this._removeBodyOffset();
        this._removeSwipeGestures();
    }
    
    /**
     * Render sidebar
     */
    render() {
        const {
            position,
            width,
            miniWidth,
            mode,
            collapsed,
            backdrop,
            animated,
            header,
            footer,
            isMobile,
            isDragging,
            dragOffset,
            isClosing
        } = this.state;
        
        const classes = ['brutal-sidebar'];
        classes.push(`brutal-sidebar--${position}`);
        classes.push(`brutal-sidebar--${mode}`);
        if (collapsed) classes.push('brutal-sidebar--collapsed');
        if (isMobile) classes.push('brutal-sidebar--mobile');
        if (isDragging) classes.push('brutal-sidebar--dragging');
        if (isClosing) classes.push('brutal-sidebar--closing');
        if (animated) classes.push('brutal-sidebar--animated');
        
        const sidebarWidth = collapsed && mode === 'mini' ? miniWidth : width;
        const transform = isDragging ? `translateX(${dragOffset}px)` : '';
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()}</style>
            ${backdrop && mode === 'overlay' && !collapsed ? `
                <div 
                    class="brutal-sidebar-backdrop ${animated ? 'brutal-sidebar-backdrop--animated' : ''}"
                    part="backdrop"
                ></div>
            ` : ''}
            <aside
                class="${classes.join(' ')}"
                style="--width: ${sidebarWidth}; --mini-width: ${miniWidth}; transform: ${transform}"
                role="navigation"
                aria-label="Main navigation"
                aria-expanded="${!collapsed}"
                part="sidebar"
            >
                ${header ? `
                    <header class="brutal-sidebar-header" part="header">
                        ${header}
                        <button
                            class="brutal-sidebar-toggle brutal-sidebar-toggle--header"
                            aria-label="${collapsed ? 'Expand' : 'Collapse'} sidebar"
                            part="toggle"
                        >
                            <span class="brutal-sidebar-toggle-icon">
                                ${collapsed ? '☰' : '✕'}
                            </span>
                        </button>
                    </header>
                ` : `
                    <button
                        class="brutal-sidebar-toggle brutal-sidebar-toggle--floating"
                        aria-label="${collapsed ? 'Expand' : 'Collapse'} sidebar"
                        part="toggle"
                    >
                        <span class="brutal-sidebar-toggle-icon">
                            ${collapsed ? '☰' : '✕'}
                        </span>
                    </button>
                `}
                
                <nav class="brutal-sidebar-content" part="content">
                    <slot></slot>
                </nav>
                
                ${footer ? `
                    <footer class="brutal-sidebar-footer" part="footer">
                        ${footer}
                    </footer>
                ` : ''}
            </aside>
        `;
        
        this._attachEventListeners();
    }
    
    /**
     * Get styles
     */
    _getStyles() {
        return `
            :host {
                display: block;
                font-family: inherit;
                --sidebar-bg: #111;
                --sidebar-border: #333;
                --sidebar-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            }
            
            * {
                box-sizing: border-box;
            }
            
            /* Backdrop */
            .brutal-sidebar-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 998;
                cursor: pointer;
            }
            
            .brutal-sidebar-backdrop--animated {
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* Sidebar */
            .brutal-sidebar {
                position: fixed;
                top: 0;
                bottom: 0;
                width: var(--width);
                background: var(--sidebar-bg);
                border-right: 2px solid var(--sidebar-border);
                z-index: 999;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .brutal-sidebar--right {
                right: 0;
                left: auto;
                border-right: none;
                border-left: 2px solid var(--sidebar-border);
            }
            
            .brutal-sidebar--left {
                left: 0;
            }
            
            /* Modes */
            .brutal-sidebar--push {
                position: relative;
            }
            
            .brutal-sidebar--overlay {
                box-shadow: var(--sidebar-shadow);
            }
            
            .brutal-sidebar--mini.brutal-sidebar--collapsed {
                width: var(--mini-width);
            }
            
            /* Collapsed states */
            .brutal-sidebar--collapsed:not(.brutal-sidebar--mini) {
                transform: translateX(-100%);
            }
            
            .brutal-sidebar--right.brutal-sidebar--collapsed:not(.brutal-sidebar--mini) {
                transform: translateX(100%);
            }
            
            /* Animations */
            .brutal-sidebar--animated {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .brutal-sidebar--dragging {
                transition: none;
            }
            
            .brutal-sidebar--closing {
                animation: slideOut 0.3s ease-in forwards;
            }
            
            @keyframes slideOut {
                to {
                    transform: translateX(-100%);
                    opacity: 0;
                }
            }
            
            /* Toggle button */
            .brutal-sidebar-toggle {
                position: absolute;
                background: #1a1a1a;
                border: 2px solid #333;
                border-radius: 8px;
                color: #00ff88;
                cursor: pointer;
                transition: all 0.2s;
                z-index: 10;
            }
            
            .brutal-sidebar-toggle:hover {
                background: #00ff88;
                color: #000;
                transform: scale(1.1);
            }
            
            .brutal-sidebar-toggle--floating {
                top: 1rem;
                right: -3rem;
                width: 2.5rem;
                height: 2.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .brutal-sidebar--right .brutal-sidebar-toggle--floating {
                right: auto;
                left: -3rem;
            }
            
            .brutal-sidebar-toggle--header {
                position: static;
                width: 2rem;
                height: 2rem;
                padding: 0;
                margin-left: auto;
            }
            
            .brutal-sidebar-toggle-icon {
                font-size: 1.25rem;
                line-height: 1;
            }
            
            /* Header */
            .brutal-sidebar-header {
                display: flex;
                align-items: center;
                padding: 1rem 1.5rem;
                border-bottom: 2px solid var(--sidebar-border);
                font-weight: 600;
                color: #00ff88;
            }
            
            .brutal-sidebar--mini.brutal-sidebar--collapsed .brutal-sidebar-header {
                padding: 1rem 0.5rem;
                justify-content: center;
            }
            
            /* Content */
            .brutal-sidebar-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 1.5rem;
                scrollbar-width: thin;
            }
            
            .brutal-sidebar--mini.brutal-sidebar--collapsed .brutal-sidebar-content {
                padding: 0.5rem;
            }
            
            /* Footer */
            .brutal-sidebar-footer {
                padding: 1rem 1.5rem;
                border-top: 2px solid var(--sidebar-border);
                color: #666;
                font-size: 0.875rem;
            }
            
            .brutal-sidebar--mini.brutal-sidebar--collapsed .brutal-sidebar-footer {
                padding: 0.5rem;
                text-align: center;
            }
            
            /* Scrollbar */
            .brutal-sidebar-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .brutal-sidebar-content::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .brutal-sidebar-content::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 3px;
            }
            
            .brutal-sidebar-content::-webkit-scrollbar-thumb:hover {
                background: #00ff88;
            }
            
            /* Mobile */
            .brutal-sidebar--mobile {
                width: 85vw !important;
                max-width: 320px;
            }
            
            .brutal-sidebar--mobile.brutal-sidebar--mini.brutal-sidebar--collapsed {
                transform: translateX(-100%);
            }
            
            .brutal-sidebar--mobile.brutal-sidebar--right.brutal-sidebar--mini.brutal-sidebar--collapsed {
                transform: translateX(100%);
            }
            
            /* Content styles for slotted elements */
            ::slotted(*) {
                display: block;
                margin-bottom: 0.5rem;
            }
            
            ::slotted(a) {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                color: #ccc;
                text-decoration: none;
                border-radius: 6px;
                transition: all 0.2s;
            }
            
            ::slotted(a:hover) {
                background: rgba(0, 255, 136, 0.1);
                color: #00ff88;
            }
            
            ::slotted(a[aria-current="page"]) {
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88;
                font-weight: 500;
            }
            
            ::slotted(hr) {
                margin: 1rem 0;
                border: none;
                border-top: 1px solid #333;
            }
            
            ::slotted(h3) {
                margin: 1.5rem 0 0.5rem;
                padding: 0 1rem;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #666;
            }
            
            /* Mini mode adjustments */
            .brutal-sidebar--mini.brutal-sidebar--collapsed ::slotted(a) {
                justify-content: center;
                padding: 0.75rem;
            }
            
            .brutal-sidebar--mini.brutal-sidebar--collapsed ::slotted(span:not(:first-child)) {
                display: none;
            }
            
            /* Focus styles */
            .brutal-sidebar-toggle:focus-visible,
            ::slotted(a:focus-visible) {
                outline: 2px solid #00ff88;
                outline-offset: 2px;
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .brutal-sidebar,
                .brutal-sidebar-backdrop,
                .brutal-sidebar-toggle {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `;
    }
    
    /**
     * Check if mobile
     */
    _checkMobile() {
        const breakpoint = parseInt(this.state.breakpoint);
        const wasMobile = this.state.isMobile;
        this.state.isMobile = window.innerWidth < breakpoint;
        
        // Auto-collapse on mobile
        if (!wasMobile && this.state.isMobile) {
            this.state.collapsed = true;
        }
    }
    
    /**
     * Apply body offset for push mode
     */
    _applyBodyOffset() {
        if (this.state.mode !== 'push' || this.state.isMobile) return;
        
        const offset = this.state.collapsed 
            ? (this.state.mode === 'mini' ? this.state.miniWidth : '0')
            : this.state.width;
        
        document.body.style.transition = 'margin 0.3s';
        document.body.style[`margin${this.state.position === 'left' ? 'Left' : 'Right'}`] = offset;
    }
    
    /**
     * Remove body offset
     */
    _removeBodyOffset() {
        document.body.style.marginLeft = '';
        document.body.style.marginRight = '';
    }
    
    /**
     * Setup swipe gestures
     */
    _setupSwipeGestures() {
        document.addEventListener('touchstart', this._boundHandleSwipeStart, { passive: true });
        document.addEventListener('touchmove', this._boundHandleSwipeMove, { passive: true });
        document.addEventListener('touchend', this._boundHandleSwipeEnd);
    }
    
    /**
     * Remove swipe gestures
     */
    _removeSwipeGestures() {
        document.removeEventListener('touchstart', this._boundHandleSwipeStart);
        document.removeEventListener('touchmove', this._boundHandleSwipeMove);
        document.removeEventListener('touchend', this._boundHandleSwipeEnd);
    }
    
    /**
     * Handle swipe start
     */
    _handleSwipeStart(e) {
        if (!this.state.isMobile) return;
        
        const touch = e.touches[0];
        this._touchStartX = touch.clientX;
        this._touchStartY = touch.clientY;
        
        // Check if swipe from edge
        const edgeThreshold = 20;
        const isLeftEdge = this._touchStartX < edgeThreshold;
        const isRightEdge = this._touchStartX > window.innerWidth - edgeThreshold;
        
        if (this.state.position === 'left' && isLeftEdge && this.state.collapsed) {
            this.state.isDragging = true;
            this.state.dragStart = this._touchStartX;
        } else if (this.state.position === 'right' && isRightEdge && this.state.collapsed) {
            this.state.isDragging = true;
            this.state.dragStart = this._touchStartX;
        } else if (!this.state.collapsed && this.contains(e.target)) {
            this.state.isDragging = true;
            this.state.dragStart = this._touchStartX;
        }
    }
    
    /**
     * Handle swipe move
     */
    _handleSwipeMove(e) {
        if (!this.state.isDragging) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.state.dragStart;
        const deltaY = touch.clientY - this._touchStartY;
        
        // Only handle horizontal swipes
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            this.state.isDragging = false;
            return;
        }
        
        // Calculate offset based on position and state
        if (this.state.position === 'left') {
            if (this.state.collapsed) {
                this.state.dragOffset = Math.max(0, deltaX);
            } else {
                this.state.dragOffset = Math.min(0, deltaX);
            }
        } else {
            if (this.state.collapsed) {
                this.state.dragOffset = Math.min(0, deltaX);
            } else {
                this.state.dragOffset = Math.max(0, deltaX);
            }
        }
        
        this.render();
    }
    
    /**
     * Handle swipe end
     */
    _handleSwipeEnd(e) {
        if (!this.state.isDragging) return;
        
        this.state.isDragging = false;
        
        // Determine if should open/close based on threshold
        const threshold = 50;
        const shouldToggle = Math.abs(this.state.dragOffset) > threshold;
        
        if (shouldToggle) {
            this.toggle();
        } else {
            this.state.dragOffset = 0;
            this.render();
        }
    }
    
    /**
     * Handle toggle
     */
    _handleToggle() {
        this.toggle();
    }
    
    /**
     * Handle backdrop click
     */
    _handleBackdrop() {
        if (this.state.mode === 'overlay') {
            this.close();
        }
    }
    
    /**
     * Handle keyboard
     */
    _handleKeyDown(e) {
        if (e.key === 'Escape' && !this.state.collapsed && this.state.mode === 'overlay') {
            this.close();
        }
    }
    
    /**
     * Handle resize
     */
    _handleResize() {
        this._checkMobile();
        this._applyBodyOffset();
        this.render();
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Toggle button
        const toggle = this.shadowRoot.querySelector('.brutal-sidebar-toggle');
        toggle?.addEventListener('click', this._boundHandleToggle);
        
        // Backdrop
        const backdrop = this.shadowRoot.querySelector('.brutal-sidebar-backdrop');
        backdrop?.addEventListener('click', this._boundHandleBackdrop);
        
        // Keyboard
        this.addEventListener('keydown', this._boundHandleKeyDown);
        
        // Focus trap for overlay mode
        if (this.state.mode === 'overlay' && !this.state.collapsed) {
            this._trapFocus();
        }
    }
    
    /**
     * Trap focus
     */
    _trapFocus() {
        const focusableElements = this.shadowRoot.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        // Focus first element
        firstFocusable.focus();
        
        // Trap focus
        this.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }
    
    /**
     * Save state
     */
    _saveState() {
        if (!this.state.persist) return;
        
        localStorage.setItem('brutal-sidebar-collapsed', this.state.collapsed);
    }
    
    /**
     * Restore state
     */
    _restoreState() {
        const collapsed = localStorage.getItem('brutal-sidebar-collapsed');
        if (collapsed !== null) {
            this.state.collapsed = collapsed === 'true';
        }
    }
    
    /**
     * Open sidebar
     */
    open() {
        if (!this.state.collapsed) return;
        
        this.state.collapsed = false;
        this.state.dragOffset = 0;
        this._applyBodyOffset();
        this._saveState();
        this.render();
        
        this.dispatchEvent(new CustomEvent('brutal:open', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Close sidebar
     */
    close() {
        if (this.state.collapsed) return;
        
        this.state.collapsed = true;
        this.state.dragOffset = 0;
        this._applyBodyOffset();
        this._saveState();
        this.render();
        
        this.dispatchEvent(new CustomEvent('brutal:close', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Toggle sidebar
     */
    toggle() {
        this.state.collapsed ? this.open() : this.close();
    }
}

// Register component
customElements.define('brutal-sidebar', Sidebar);