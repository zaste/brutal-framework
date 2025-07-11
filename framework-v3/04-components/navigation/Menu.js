/**
 * @fileoverview BRUTAL Menu Component - Dropdown and context menus
 * @version 3.0.0
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';

/**
 * BRUTAL Menu - High-performance dropdown menus
 * Nested support, keyboard navigation, touch optimized
 */
export class Menu extends InteractiveComponent {
    static get observedAttributes() {
        return [
            'items',        // JSON menu items
            'trigger',      // click | hover | contextmenu
            'position',     // auto | top | bottom | left | right
            'align',        // start | center | end
            'offset',       // gap from trigger
            'nested-offset', // offset for nested menus
            'max-height',   // max menu height
            'min-width',    // min menu width
            'close-on-click', // boolean - close on item click
            'show-arrow',   // boolean - show pointing arrow
            'animated'      // boolean - animate open/close
        ];
    }
    
    constructor() {
        super();
        
        // State
        this.state = {
            items: [],
            trigger: 'click',
            position: 'auto',
            align: 'start',
            offset: 8,
            nestedOffset: 4,
            maxHeight: '400px',
            minWidth: '200px',
            closeOnClick: true,
            showArrow: false,
            animated: true,
            
            // Internal
            isOpen: false,
            activeIndex: -1,
            openSubmenus: new Set(),
            menuPosition: { top: 0, left: 0 },
            arrowPosition: { top: 0, left: 0 }
        };
        
        // References
        this._triggerEl = null;
        this._menuEl = null;
        this._activeSubmenu = null;
        
        // V8 optimization
        this._boundHandleTriggerClick = this._handleTriggerClick.bind(this);
        this._boundHandleTriggerHover = this._handleTriggerHover.bind(this);
        this._boundHandleTriggerContext = this._handleTriggerContext.bind(this);
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleClickOutside = this._handleClickOutside.bind(this);
        this._boundHandleItemClick = this._handleItemClick.bind(this);
        this._boundHandleResize = this._handleResize.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        this._setupTrigger();
        document.addEventListener('click', this._boundHandleClickOutside);
        window.addEventListener('resize', this._boundHandleResize);
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._boundHandleClickOutside);
        window.removeEventListener('resize', this._boundHandleResize);
        this._removeTriggerListeners();
    }
    
    /**
     * Render menu
     */
    render() {
        const { isOpen, animated } = this.state;
        
        const triggerSlot = '<slot name="trigger"></slot>';
        const menuContent = isOpen ? this._renderMenu() : '';
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()}</style>
            <div class="brutal-menu-wrapper" part="wrapper">
                <div class="brutal-menu-trigger" part="trigger">
                    ${triggerSlot}
                </div>
                ${menuContent}
            </div>
        `;
        
        this._attachEventListeners();
        
        if (isOpen) {
            this._positionMenu();
        }
    }
    
    /**
     * Get styles
     */
    _getStyles() {
        return `
            :host {
                display: inline-block;
                position: relative;
                font-family: inherit;
            }
            
            * {
                box-sizing: border-box;
            }
            
            .brutal-menu-wrapper {
                position: relative;
                display: inline-block;
            }
            
            .brutal-menu-trigger {
                cursor: pointer;
            }
            
            /* Menu container */
            .brutal-menu {
                position: fixed;
                z-index: 1000;
                min-width: var(--min-width, 200px);
                max-height: var(--max-height, 400px);
                background: #111;
                border: 2px solid #333;
                border-radius: 8px;
                box-shadow: 
                    0 10px 25px rgba(0, 0, 0, 0.3),
                    0 4px 10px rgba(0, 0, 0, 0.2);
                overflow: auto;
                overscroll-behavior: contain;
            }
            
            .brutal-menu--animated {
                animation: menuFadeIn 0.2s ease-out;
            }
            
            @keyframes menuFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Arrow */
            .brutal-menu-arrow {
                position: absolute;
                width: 12px;
                height: 12px;
                background: #111;
                border: 2px solid #333;
                transform: rotate(45deg);
                z-index: -1;
            }
            
            .brutal-menu-arrow--top {
                top: -8px;
                border-right: none;
                border-bottom: none;
            }
            
            .brutal-menu-arrow--bottom {
                bottom: -8px;
                border-left: none;
                border-top: none;
            }
            
            /* Menu items */
            .brutal-menu-items {
                padding: 0.5rem 0;
                margin: 0;
                list-style: none;
            }
            
            .brutal-menu-item {
                position: relative;
                margin: 0;
            }
            
            .brutal-menu-item-content {
                display: flex;
                align-items: center;
                padding: 0.75rem 1rem;
                color: #ccc;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s;
                user-select: none;
            }
            
            .brutal-menu-item-content:hover,
            .brutal-menu-item--active .brutal-menu-item-content {
                background: rgba(0, 255, 136, 0.1);
                color: #00ff88;
            }
            
            .brutal-menu-item--disabled .brutal-menu-item-content {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }
            
            /* Icons */
            .brutal-menu-item-icon {
                width: 1.5rem;
                margin-right: 0.75rem;
                font-size: 1.125rem;
                text-align: center;
            }
            
            .brutal-menu-item-label {
                flex: 1;
            }
            
            /* Shortcuts */
            .brutal-menu-item-shortcut {
                margin-left: 2rem;
                font-size: 0.875rem;
                opacity: 0.6;
            }
            
            /* Submenu indicator */
            .brutal-menu-item-submenu-icon {
                margin-left: 0.5rem;
                font-size: 0.875rem;
                opacity: 0.6;
            }
            
            /* Divider */
            .brutal-menu-divider {
                height: 1px;
                margin: 0.5rem 0;
                background: #333;
            }
            
            /* Nested menu */
            .brutal-menu-item--has-submenu > .brutal-menu {
                position: absolute;
                top: 0;
                left: 100%;
                margin-left: var(--nested-offset, 4px);
            }
            
            /* Scrollbar */
            .brutal-menu::-webkit-scrollbar {
                width: 8px;
            }
            
            .brutal-menu::-webkit-scrollbar-track {
                background: #111;
            }
            
            .brutal-menu::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 4px;
            }
            
            .brutal-menu::-webkit-scrollbar-thumb:hover {
                background: #00ff88;
            }
            
            /* Mobile optimizations */
            @media (max-width: 640px) {
                .brutal-menu {
                    max-width: calc(100vw - 2rem);
                }
            }
        `;
    }
    
    /**
     * Render menu
     */
    _renderMenu() {
        const { 
            items, 
            showArrow, 
            animated,
            minWidth,
            maxHeight
        } = this.state;
        
        const classes = ['brutal-menu'];
        if (animated) classes.push('brutal-menu--animated');
        
        return `
            <div 
                class="${classes.join(' ')}"
                role="menu"
                style="--min-width: ${minWidth}; --max-height: ${maxHeight}"
                part="menu"
            >
                ${showArrow ? '<div class="brutal-menu-arrow"></div>' : ''}
                <ul class="brutal-menu-items">
                    ${this._renderItems(items)}
                </ul>
            </div>
        `;
    }
    
    /**
     * Render menu items
     */
    _renderItems(items, level = 0) {
        return items.map((item, index) => {
            if (item.divider) {
                return '<li class="brutal-menu-divider" role="separator"></li>';
            }
            
            const hasSubmenu = item.items && item.items.length > 0;
            const isActive = this.state.activeIndex === index && level === 0;
            const isOpen = this.state.openSubmenus.has(item.id || index);
            
            const classes = ['brutal-menu-item'];
            if (hasSubmenu) classes.push('brutal-menu-item--has-submenu');
            if (isActive) classes.push('brutal-menu-item--active');
            if (item.disabled) classes.push('brutal-menu-item--disabled');
            
            return `
                <li 
                    class="${classes.join(' ')}"
                    role="menuitem"
                    data-index="${index}"
                    data-level="${level}"
                    ${item.disabled ? 'aria-disabled="true"' : ''}
                >
                    <div class="brutal-menu-item-content">
                        ${item.icon ? `
                            <span class="brutal-menu-item-icon">${item.icon}</span>
                        ` : ''}
                        <span class="brutal-menu-item-label">${item.label}</span>
                        ${item.shortcut ? `
                            <span class="brutal-menu-item-shortcut">${item.shortcut}</span>
                        ` : ''}
                        ${hasSubmenu ? `
                            <span class="brutal-menu-item-submenu-icon">▶</span>
                        ` : ''}
                    </div>
                    ${hasSubmenu && isOpen ? `
                        <div class="brutal-menu brutal-submenu">
                            <ul class="brutal-menu-items">
                                ${this._renderItems(item.items, level + 1)}
                            </ul>
                        </div>
                    ` : ''}
                </li>
            `;
        }).join('');
    }
    
    /**
     * Setup trigger
     */
    _setupTrigger() {
        this._triggerEl = this.querySelector('[slot="trigger"]');
        if (!this._triggerEl) return;
        
        this._attachTriggerListeners();
    }
    
    /**
     * Attach trigger listeners
     */
    _attachTriggerListeners() {
        if (!this._triggerEl) return;
        
        switch (this.state.trigger) {
            case 'click':
                this._triggerEl.addEventListener('click', this._boundHandleTriggerClick);
                break;
            case 'hover':
                this._triggerEl.addEventListener('mouseenter', this._boundHandleTriggerHover);
                this._triggerEl.addEventListener('mouseleave', this._boundHandleTriggerHover);
                break;
            case 'contextmenu':
                this._triggerEl.addEventListener('contextmenu', this._boundHandleTriggerContext);
                break;
        }
    }
    
    /**
     * Remove trigger listeners
     */
    _removeTriggerListeners() {
        if (!this._triggerEl) return;
        
        this._triggerEl.removeEventListener('click', this._boundHandleTriggerClick);
        this._triggerEl.removeEventListener('mouseenter', this._boundHandleTriggerHover);
        this._triggerEl.removeEventListener('mouseleave', this._boundHandleTriggerHover);
        this._triggerEl.removeEventListener('contextmenu', this._boundHandleTriggerContext);
    }
    
    /**
     * Handle trigger click
     */
    _handleTriggerClick(e) {
        e.stopPropagation();
        this.toggle();
    }
    
    /**
     * Handle trigger hover
     */
    _handleTriggerHover(e) {
        if (e.type === 'mouseenter') {
            this.open();
        } else {
            // Delay close to allow moving to menu
            setTimeout(() => {
                if (!this._menuEl?.matches(':hover')) {
                    this.close();
                }
            }, 100);
        }
    }
    
    /**
     * Handle trigger context menu
     */
    _handleTriggerContext(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Store click position for context menu
        this._contextPosition = { x: e.clientX, y: e.clientY };
        this.open();
    }
    
    /**
     * Position menu
     */
    _positionMenu() {
        this._menuEl = this.shadowRoot.querySelector('.brutal-menu');
        if (!this._menuEl || !this._triggerEl) return;
        
        const { position, align, offset, showArrow } = this.state;
        
        // Get dimensions
        const triggerRect = this._triggerEl.getBoundingClientRect();
        const menuRect = this._menuEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let top, left;
        let actualPosition = position;
        
        // Context menu positioning
        if (this._contextPosition) {
            top = this._contextPosition.y;
            left = this._contextPosition.x;
            
            // Adjust if overflowing
            if (left + menuRect.width > viewportWidth) {
                left = viewportWidth - menuRect.width - offset;
            }
            if (top + menuRect.height > viewportHeight) {
                top = viewportHeight - menuRect.height - offset;
            }
        } else {
            // Auto positioning
            if (position === 'auto') {
                // Determine best position
                const spaceBelow = viewportHeight - triggerRect.bottom;
                const spaceAbove = triggerRect.top;
                const spaceRight = viewportWidth - triggerRect.right;
                const spaceLeft = triggerRect.left;
                
                if (spaceBelow >= menuRect.height + offset) {
                    actualPosition = 'bottom';
                } else if (spaceAbove >= menuRect.height + offset) {
                    actualPosition = 'top';
                } else if (spaceRight >= menuRect.width + offset) {
                    actualPosition = 'right';
                } else if (spaceLeft >= menuRect.width + offset) {
                    actualPosition = 'left';
                } else {
                    actualPosition = 'bottom'; // Default
                }
            }
            
            // Calculate position based on actualPosition
            switch (actualPosition) {
                case 'top':
                    top = triggerRect.top - menuRect.height - offset;
                    left = this._getAlignedPosition(triggerRect, menuRect, align, 'horizontal');
                    break;
                case 'bottom':
                    top = triggerRect.bottom + offset;
                    left = this._getAlignedPosition(triggerRect, menuRect, align, 'horizontal');
                    break;
                case 'left':
                    top = this._getAlignedPosition(triggerRect, menuRect, align, 'vertical');
                    left = triggerRect.left - menuRect.width - offset;
                    break;
                case 'right':
                    top = this._getAlignedPosition(triggerRect, menuRect, align, 'vertical');
                    left = triggerRect.right + offset;
                    break;
            }
        }
        
        // Apply position
        this._menuEl.style.top = `${top}px`;
        this._menuEl.style.left = `${left}px`;
        
        // Position arrow
        if (showArrow && !this._contextPosition) {
            this._positionArrow(actualPosition, triggerRect, { top, left });
        }
    }
    
    /**
     * Get aligned position
     */
    _getAlignedPosition(triggerRect, menuRect, align, axis) {
        if (axis === 'horizontal') {
            switch (align) {
                case 'start':
                    return triggerRect.left;
                case 'center':
                    return triggerRect.left + (triggerRect.width - menuRect.width) / 2;
                case 'end':
                    return triggerRect.right - menuRect.width;
                default:
                    return triggerRect.left;
            }
        } else {
            switch (align) {
                case 'start':
                    return triggerRect.top;
                case 'center':
                    return triggerRect.top + (triggerRect.height - menuRect.height) / 2;
                case 'end':
                    return triggerRect.bottom - menuRect.height;
                default:
                    return triggerRect.top;
            }
        }
    }
    
    /**
     * Position arrow
     */
    _positionArrow(position, triggerRect, menuPosition) {
        const arrow = this.shadowRoot.querySelector('.brutal-menu-arrow');
        if (!arrow) return;
        
        arrow.className = `brutal-menu-arrow brutal-menu-arrow--${position}`;
        
        // Calculate arrow position
        if (position === 'top' || position === 'bottom') {
            const centerX = triggerRect.left + triggerRect.width / 2;
            arrow.style.left = `${centerX - menuPosition.left - 6}px`;
        } else {
            const centerY = triggerRect.top + triggerRect.height / 2;
            arrow.style.top = `${centerY - menuPosition.top - 6}px`;
        }
    }
    
    /**
     * Handle keyboard navigation
     */
    _handleKeyDown(e) {
        if (!this.state.isOpen) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this._navigateItems(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._navigateItems(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this._openSubmenu();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this._closeSubmenu();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this._selectActiveItem();
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    }
    
    /**
     * Navigate items
     */
    _navigateItems(direction) {
        const items = this.shadowRoot.querySelectorAll('.brutal-menu-item:not(.brutal-menu-divider)');
        const enabledItems = Array.from(items).filter(item => 
            !item.classList.contains('brutal-menu-item--disabled')
        );
        
        if (enabledItems.length === 0) return;
        
        let newIndex = this.state.activeIndex + direction;
        
        if (newIndex < 0) {
            newIndex = enabledItems.length - 1;
        } else if (newIndex >= enabledItems.length) {
            newIndex = 0;
        }
        
        this.state.activeIndex = newIndex;
        this.render();
        
        // Focus for screen readers
        enabledItems[newIndex]?.focus();
    }
    
    /**
     * Handle item click
     */
    _handleItemClick(e) {
        const item = e.target.closest('.brutal-menu-item');
        if (!item || item.classList.contains('brutal-menu-item--disabled')) return;
        
        const index = parseInt(item.dataset.index);
        const level = parseInt(item.dataset.level);
        const menuItem = this._getItemByIndex(index, level);
        
        if (menuItem.items) {
            // Toggle submenu
            if (this.state.openSubmenus.has(menuItem.id || index)) {
                this.state.openSubmenus.delete(menuItem.id || index);
            } else {
                this.state.openSubmenus.add(menuItem.id || index);
            }
            this.render();
        } else {
            // Execute action
            this.dispatchEvent(new CustomEvent('brutal:select', {
                bubbles: true,
                composed: true,
                detail: { item: menuItem, index }
            }));
            
            if (this.state.closeOnClick) {
                this.close();
            }
        }
    }
    
    /**
     * Get item by index
     */
    _getItemByIndex(index, level = 0) {
        // TODO: Implement recursive item lookup
        return this.state.items[index];
    }
    
    /**
     * Handle click outside
     */
    _handleClickOutside(e) {
        if (!this.state.isOpen) return;
        if (this.contains(e.target)) return;
        
        this.close();
    }
    
    /**
     * Handle resize
     */
    _handleResize() {
        if (this.state.isOpen) {
            this._positionMenu();
        }
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Keyboard navigation
        this.addEventListener('keydown', this._boundHandleKeyDown);
        
        // Menu interactions
        const menu = this.shadowRoot.querySelector('.brutal-menu');
        menu?.addEventListener('click', this._boundHandleItemClick);
        
        // Keep menu open on hover for hover trigger
        if (this.state.trigger === 'hover') {
            menu?.addEventListener('mouseenter', () => {
                clearTimeout(this._closeTimeout);
            });
            menu?.addEventListener('mouseleave', () => {
                this._closeTimeout = setTimeout(() => this.close(), 100);
            });
        }
    }
    
    /**
     * Open menu
     */
    open() {
        if (this.state.isOpen) return;
        
        this.state.isOpen = true;
        this.state.activeIndex = -1;
        this.state.openSubmenus.clear();
        this._contextPosition = null;
        
        this.render();
        
        this.dispatchEvent(new CustomEvent('brutal:open', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Close menu
     */
    close() {
        if (!this.state.isOpen) return;
        
        this.state.isOpen = false;
        this.render();
        
        this.dispatchEvent(new CustomEvent('brutal:close', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Toggle menu
     */
    toggle() {
        this.state.isOpen ? this.close() : this.open();
    }
    
    /**
     * Set items
     */
    setItems(items) {
        this.state.items = items;
        this.render();
    }
}

// Register component
customElements.define('brutal-menu', Menu);