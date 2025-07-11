/**
 * @fileoverview BRUTAL Breadcrumb Component - Navigation trail
 * @version 3.0.0
 */

import { BrutalComponent } from '../../01-core/BrutalComponent.js';

/**
 * BRUTAL Breadcrumb - Smart navigation breadcrumbs
 * Auto-generation, overflow handling, schema markup
 */
export class Breadcrumb extends BrutalComponent {
    static get observedAttributes() {
        return [
            'items',        // JSON array of breadcrumb items
            'separator',    // separator character/icon
            'max-items',    // max visible items before collapse
            'home-label',   // label for home/root
            'home-icon',    // icon for home
            'schema',       // boolean - add schema.org markup
            'auto-generate', // boolean - auto-generate from URL
            'capitalize',   // boolean - auto-capitalize labels
            'truncate',     // max chars per item
            'responsive'    // boolean - responsive collapse
        ];
    }
    
    constructor() {
        super();
        
        // State
        this.state = {
            items: [],
            separator: '/',
            maxItems: 0,
            homeLabel: 'Home',
            homeIcon: '🏠',
            schema: true,
            autoGenerate: false,
            capitalize: true,
            truncate: 30,
            responsive: true,
            
            // Internal
            collapsed: false,
            expandedDropdown: false
        };
        
        // V8 optimization
        this._boundHandleDropdownToggle = this._handleDropdownToggle.bind(this);
        this._boundHandleItemClick = this._handleItemClick.bind(this);
        this._boundHandleResize = this._handleResize.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        if (this.state.autoGenerate) {
            this._generateFromURL();
        }
        
        if (this.state.responsive) {
            window.addEventListener('resize', this._boundHandleResize);
            this._checkOverflow();
        }
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this._boundHandleResize);
    }
    
    /**
     * Render breadcrumb
     */
    render() {
        const { items, schema, collapsed } = this.state;
        
        if (!items || items.length === 0) {
            this.shadowRoot.innerHTML = '';
            return;
        }
        
        const itemsToRender = this._getItemsToRender();
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()}</style>
            <nav 
                class="brutal-breadcrumb"
                aria-label="Breadcrumb"
                part="nav"
                ${schema ? 'itemscope itemtype="https://schema.org/BreadcrumbList"' : ''}
            >
                <ol class="brutal-breadcrumb-list">
                    ${this._renderItems(itemsToRender)}
                </ol>
            </nav>
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
            }
            
            * {
                box-sizing: border-box;
            }
            
            .brutal-breadcrumb {
                padding: 0.75rem 0;
                overflow-x: auto;
                overflow-y: hidden;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
            }
            
            .brutal-breadcrumb-list {
                display: flex;
                align-items: center;
                margin: 0;
                padding: 0;
                list-style: none;
                white-space: nowrap;
            }
            
            .brutal-breadcrumb-item {
                display: flex;
                align-items: center;
                position: relative;
            }
            
            .brutal-breadcrumb-link {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.75rem;
                color: #ccc;
                text-decoration: none;
                border-radius: 6px;
                transition: all 0.2s;
                max-width: 200px;
                position: relative;
            }
            
            .brutal-breadcrumb-link:hover {
                color: #00ff88;
                background: rgba(0, 255, 136, 0.1);
            }
            
            .brutal-breadcrumb-link:focus-visible {
                outline: 2px solid #00ff88;
                outline-offset: 2px;
            }
            
            /* Current page */
            .brutal-breadcrumb-item--current .brutal-breadcrumb-link {
                color: #00ff88;
                font-weight: 500;
                cursor: default;
                pointer-events: none;
            }
            
            /* Home icon */
            .brutal-breadcrumb-icon {
                font-size: 1.125rem;
                line-height: 1;
            }
            
            /* Label */
            .brutal-breadcrumb-label {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            /* Separator */
            .brutal-breadcrumb-separator {
                margin: 0 0.5rem;
                color: #666;
                font-size: 0.875rem;
                user-select: none;
            }
            
            /* Dropdown for collapsed items */
            .brutal-breadcrumb-dropdown {
                position: relative;
            }
            
            .brutal-breadcrumb-dropdown-toggle {
                display: flex;
                align-items: center;
                padding: 0.5rem 0.75rem;
                background: transparent;
                border: 1px solid #333;
                border-radius: 6px;
                color: #ccc;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .brutal-breadcrumb-dropdown-toggle:hover {
                border-color: #00ff88;
                color: #00ff88;
            }
            
            .brutal-breadcrumb-dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: 0.5rem;
                min-width: 200px;
                background: #111;
                border: 2px solid #333;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 100;
                opacity: 0;
                transform: translateY(-8px);
                pointer-events: none;
                transition: all 0.2s;
            }
            
            .brutal-breadcrumb-dropdown-menu--open {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            
            .brutal-breadcrumb-dropdown-item {
                display: block;
                width: 100%;
                padding: 0.75rem 1rem;
                color: #ccc;
                text-decoration: none;
                text-align: left;
                transition: all 0.2s;
            }
            
            .brutal-breadcrumb-dropdown-item:hover {
                background: rgba(0, 255, 136, 0.1);
                color: #00ff88;
            }
            
            .brutal-breadcrumb-dropdown-item:first-child {
                border-radius: 6px 6px 0 0;
            }
            
            .brutal-breadcrumb-dropdown-item:last-child {
                border-radius: 0 0 6px 6px;
            }
            
            /* Responsive */
            @media (max-width: 640px) {
                .brutal-breadcrumb {
                    padding: 0.5rem 0;
                }
                
                .brutal-breadcrumb-link {
                    padding: 0.375rem 0.5rem;
                    font-size: 0.875rem;
                }
                
                .brutal-breadcrumb-separator {
                    margin: 0 0.25rem;
                }
            }
            
            /* Scrollbar */
            .brutal-breadcrumb::-webkit-scrollbar {
                height: 4px;
            }
            
            .brutal-breadcrumb::-webkit-scrollbar-track {
                background: #111;
            }
            
            .brutal-breadcrumb::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 2px;
            }
            
            .brutal-breadcrumb::-webkit-scrollbar-thumb:hover {
                background: #00ff88;
            }
            
            /* Schema.org microdata */
            [itemprop] {
                /* Visual indicator in dev mode */
            }
        `;
    }
    
    /**
     * Render items
     */
    _renderItems(items) {
        const { separator, expandedDropdown } = this.state;
        const hasCollapsed = items.some(item => item.collapsed);
        
        return items.map((item, index) => {
            if (item.collapsed) {
                return `
                    <li class="brutal-breadcrumb-item brutal-breadcrumb-dropdown">
                        <button
                            class="brutal-breadcrumb-dropdown-toggle"
                            aria-label="Show ${item.count} more items"
                            aria-expanded="${expandedDropdown}"
                        >
                            •••
                        </button>
                        <div class="brutal-breadcrumb-dropdown-menu ${expandedDropdown ? 'brutal-breadcrumb-dropdown-menu--open' : ''}">
                            ${item.items.map(subItem => `
                                <a 
                                    href="${subItem.href || '#'}"
                                    class="brutal-breadcrumb-dropdown-item"
                                    ${this._getSchemaProps(subItem, index)}
                                >
                                    ${this._truncateLabel(subItem.label)}
                                </a>
                            `).join('')}
                        </div>
                        ${index < items.length - 1 ? `
                            <span class="brutal-breadcrumb-separator" aria-hidden="true">
                                ${separator}
                            </span>
                        ` : ''}
                    </li>
                `;
            }
            
            const isHome = index === 0;
            const isCurrent = index === items.length - 1;
            const classes = ['brutal-breadcrumb-item'];
            if (isCurrent) classes.push('brutal-breadcrumb-item--current');
            
            return `
                <li 
                    class="${classes.join(' ')}"
                    ${this._getSchemaProps(item, index)}
                >
                    <a 
                        href="${item.href || '#'}"
                        class="brutal-breadcrumb-link"
                        ${isCurrent ? 'aria-current="page"' : ''}
                        ${item.title ? `title="${item.title}"` : ''}
                    >
                        ${isHome && item.icon !== false ? `
                            <span class="brutal-breadcrumb-icon" aria-hidden="true">
                                ${item.icon || this.state.homeIcon}
                            </span>
                        ` : ''}
                        <span class="brutal-breadcrumb-label">
                            ${this._truncateLabel(item.label)}
                        </span>
                    </a>
                    ${index < items.length - 1 ? `
                        <span class="brutal-breadcrumb-separator" aria-hidden="true">
                            ${separator}
                        </span>
                    ` : ''}
                </li>
            `;
        }).join('');
    }
    
    /**
     * Get schema props
     */
    _getSchemaProps(item, index) {
        if (!this.state.schema) return '';
        
        return `
            itemprop="itemListElement" 
            itemscope 
            itemtype="https://schema.org/ListItem"
        `;
    }
    
    /**
     * Truncate label
     */
    _truncateLabel(label) {
        const { truncate } = this.state;
        if (!truncate || label.length <= truncate) return label;
        
        return label.substring(0, truncate - 3) + '...';
    }
    
    /**
     * Get items to render
     */
    _getItemsToRender() {
        const { items, maxItems } = this.state;
        
        if (!maxItems || items.length <= maxItems) {
            return items;
        }
        
        // Collapse middle items
        const firstItem = items[0];
        const lastItems = items.slice(-2);
        const collapsedItems = items.slice(1, -2);
        
        return [
            firstItem,
            {
                collapsed: true,
                count: collapsedItems.length,
                items: collapsedItems
            },
            ...lastItems
        ];
    }
    
    /**
     * Generate from URL
     */
    _generateFromURL() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        
        const items = [
            {
                label: this.state.homeLabel,
                href: '/',
                icon: this.state.homeIcon
            }
        ];
        
        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            
            let label = segment.replace(/-/g, ' ');
            if (this.state.capitalize) {
                label = label.replace(/\b\w/g, l => l.toUpperCase());
            }
            
            items.push({
                label,
                href: currentPath,
                title: label
            });
        });
        
        this.state.items = items;
    }
    
    /**
     * Check overflow
     */
    _checkOverflow() {
        const nav = this.shadowRoot?.querySelector('.brutal-breadcrumb');
        const list = this.shadowRoot?.querySelector('.brutal-breadcrumb-list');
        
        if (!nav || !list) return;
        
        const navWidth = nav.offsetWidth;
        const listWidth = list.scrollWidth;
        
        if (listWidth > navWidth && this.state.maxItems === 0) {
            // Auto-collapse if overflowing
            this.state.maxItems = Math.max(3, Math.floor(this.state.items.length / 2));
            this.render();
        }
    }
    
    /**
     * Handle dropdown toggle
     */
    _handleDropdownToggle(e) {
        e.preventDefault();
        this.state.expandedDropdown = !this.state.expandedDropdown;
        this.render();
    }
    
    /**
     * Handle item click
     */
    _handleItemClick(e) {
        const link = e.target.closest('.brutal-breadcrumb-link, .brutal-breadcrumb-dropdown-item');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (href === '#') {
            e.preventDefault();
        }
        
        // Close dropdown
        if (this.state.expandedDropdown) {
            this.state.expandedDropdown = false;
            this.render();
        }
        
        this.dispatchEvent(new CustomEvent('brutal:navigate', {
            bubbles: true,
            composed: true,
            detail: { href }
        }));
    }
    
    /**
     * Handle resize
     */
    _handleResize() {
        this._checkOverflow();
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Dropdown toggle
        const dropdownToggle = this.shadowRoot.querySelector('.brutal-breadcrumb-dropdown-toggle');
        dropdownToggle?.addEventListener('click', this._boundHandleDropdownToggle);
        
        // Item clicks
        this.shadowRoot.addEventListener('click', this._boundHandleItemClick);
        
        // Close dropdown on outside click
        if (this.state.expandedDropdown) {
            const closeDropdown = (e) => {
                if (!this.contains(e.target)) {
                    this.state.expandedDropdown = false;
                    this.render();
                    document.removeEventListener('click', closeDropdown);
                }
            };
            document.addEventListener('click', closeDropdown);
        }
    }
    
    /**
     * Set items
     */
    setItems(items) {
        this.state.items = items;
        this.render();
    }
    
    /**
     * Parse items from attribute
     */
    _parseItems(value) {
        if (!value) return [];
        
        try {
            return JSON.parse(value);
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Attribute changed callback
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'items':
                this.state.items = this._parseItems(newValue);
                break;
            case 'separator':
                this.state.separator = newValue || '/';
                break;
            case 'max-items':
                this.state.maxItems = parseInt(newValue) || 0;
                break;
            case 'home-label':
                this.state.homeLabel = newValue || 'Home';
                if (this.state.autoGenerate) {
                    this._generateFromURL();
                }
                break;
            case 'home-icon':
                this.state.homeIcon = newValue || '🏠';
                break;
            case 'schema':
                this.state.schema = newValue !== 'false';
                break;
            case 'auto-generate':
                this.state.autoGenerate = newValue === 'true';
                if (this.state.autoGenerate) {
                    this._generateFromURL();
                }
                break;
            case 'capitalize':
                this.state.capitalize = newValue !== 'false';
                if (this.state.autoGenerate) {
                    this._generateFromURL();
                }
                break;
            case 'truncate':
                this.state.truncate = parseInt(newValue) || 30;
                break;
            case 'responsive':
                this.state.responsive = newValue !== 'false';
                break;
        }
        
        this.render();
    }
}

// Register component
customElements.define('brutal-breadcrumb', Breadcrumb);