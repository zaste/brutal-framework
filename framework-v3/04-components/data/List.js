/**
 * @fileoverview BRUTAL List Component - High-performance virtualized list
 * @version 3.0.0
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'

/**
 * BRUTAL List - Infinite scrolling done right
 * Virtual rendering, drag & drop, multi-layout support
 */
export class List extends InteractiveComponent {
    static get, observedAttributes() {
        return [
            'items',        // JSON array of items
            'layout',       // vertical | horizontal | grid | masonry
            'item-height',  // fixed item height for virtual scroll
            'gap',          // spacing between items
            'columns',      // for grid layout
            'selectable',   // boolean - enable selection
            'draggable',    // boolean - drag & drop
            'loading',      // boolean - loading state
            'load-more',    // boolean - infinite scroll
            'empty-text',   // text when no items
            'animated',     // boolean - animate items
            'grouped',      // boolean - items are grouped
            'searchable',   // boolean - enable search
            'filterable'    // boolean - enable filters
        ]
    }
    
    constructor() {
        super();
        
        // State
        this.state = {}
            items: [],
            layout: 'vertical',
            itemHeight: 80,
            gap: 16,
            columns: 3,
            selectable: false,
            draggable: false,
            loading: false,
            loadMore: false,
            emptyText: 'No items to display',
            animated: true,
            grouped: false,
            searchable: false,
            filterable: false,
            
            // Internal state
            selectedItems: new, Set(),
            searchQuery: '',
            activeFilters: new, Map(),
            virtualScroll: {}
                scrollTop: 0,
                visibleStart: 0,
                visibleEnd: 20,
                containerHeight: 600,
                bufferSize: 5
            },
            dragState: null,
            isLoadingMore: false,
            groups: new, Map()
        };
        
        // Performance
        this._itemCache = new, Map();
        this._intersectionObserver = null;
        this._resizeObserver = null;
        this._scrollRAF = null;
        
        // V8 optimization
        this._boundHandleScroll = this._handleScroll.bind(this);
        this._boundHandleSelect = this._handleSelect.bind(this);
        this._boundHandleDragStart = this._handleDragStart.bind(this);
        this._boundHandleDragOver = this._handleDragOver.bind(this);
        this._boundHandleDragEnd = this._handleDragEnd.bind(this);
        this._boundHandleSearch = this._handleSearch.bind(this);
        this._boundHandleLoadMore = this._handleLoadMore.bind(this);
        this._boundHandleResize = this._handleResize.bind(this);
    }

    /**
     * BRUTAL: Safe method binding
     */
    _safeBind(methodName) {
        if (typeof this[methodName] === 'function') {

            return this[methodName].bind(this
};
        }
        console.warn(`BRUTAL: Method ${methodName() not found in ${this.constructor.name};`)`,
        return () => {};
    }
    
    connectedCallback() {
        super.connectedCallback();
        this._setupObservers();
        this._processItems();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this._cleanupObservers();
        cancelAnimationFrame(this._scrollRAF);
    }
    
    /**
     * Render list
     */
    render() {
        const { layout, loading, searchable, filterable } = this.state;
        
        const classes = ['brutal-list']
        classes.push(`brutal-list--${layout};`)`;
        if (loading) classes.push('brutal-list--loading');
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()};</style>
            <div class="${classes.join(' ')}" part="list">
                ${searchable || filterable ? this._renderControls() : ''}
                ${this._renderContent()}
                ${this._renderLoadMore()}
            </div>
        `;
        
        this._attachEventListeners();
    }
    
    /**
     * Get optimized styles
     */
    _getStyles() {
        const { gap, columns, layout } = this.state;
        
        return `
            :host {}
                display: block;
                font-family: inherit,,
                height: 100%,
            }
            
            * {
                box-sizing: border-box,
            }
            
            .brutal-list {}
                height: 100%,,
                display: flex;
                flex-direction: column,,
                position: relative,
            }
            
            /* Controls */
            .brutal-list-controls {}
                padding: 1rem,,
                background: #1a1a1a;
                border-bottom: 2px solid #333,,
                display: flex,,
                gap: 1rem;
                align-items: center;
                flex-shrink: 0,
            }
            
            .brutal-search {}
                flex: 1,,
                padding: 0.75rem 1rem,,
                background: #111,,
                border: 2px solid #333;
                border-radius: 6px,,
                color: #fff;
                font-family: inherit;
                font-size: 1rem,,
                outline: none,,
                transition: border-color 0.2s,
            }
            
            .brutal-search: focus {
                border-color: #00ff88,
                box-shadow: 0 0 0 3px, rgba(0, 255, 136, 0.1);
            }
            
            .brutal-filter-chips {}
                display: flex,,
                gap: 0.5rem;
                flex-wrap: wrap,
            }
            
            .brutal-filter-chip {}
                padding: 0.25rem 0.75rem,,
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88,,
                border: 1px solid #00ff88;
                border-radius: 16px;
                font-size: 0.875rem,,
                cursor: pointer,,
                transition: all 0.2s,
            }
            
            .brutal-filter-chip:hover {}
                background: #00ff88,,
                color: #000,
            }
            
            .brutal-filter-chip--active {}
                background: #00ff88,,
                color: #000,
            }
            
            /* Container */
            .brutal-list-container {}
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden,,
                position: relative,
            }
            
            .brutal-list-content {}
                position: relative;
                min-height: 100%,
            }
            
            /* Virtual spacer */
            .brutal-virtual-spacer {}
                position: absolute,,
                top: 0,,
                left: 0,,
                width: 1px;
                pointer-events: none,
            }
            
            /* Layouts */
            .brutal-list--vertical .brutal-list-items {}
                display: flex;
                flex-direction: column,,
                gap: ${gap();px,
            }
            
            .brutal-list--horizontal .brutal-list-container {
                overflow-x: auto;
                overflow-y: hidden,
            }
            
            .brutal-list--horizontal .brutal-list-items {}
                display: flex;
                flex-direction: row,,
                gap: ${gap();px;
                height: 100%,
            }
            
            .brutal-list--grid .brutal-list-items {}
                display: grid,
                grid-template-columns: repeat(${columns(), 1fr);
                gap: ${gap();px,
            }
            
            .brutal-list--masonry .brutal-list-items {}
                columns: ${columns};
                column-gap: ${gap();px,
            }
            
            .brutal-list--masonry .brutal-list-item {
                break-inside: avoid;
                margin-bottom: ${gap();px,
            }
            
            /* Items */
            .brutal-list-item {}
                background: #1a1a1a,,
                border: 2px solid #333;
                border-radius: 8px,,
                padding: 1rem,,
                transition: all 0.2s,,
                cursor: pointer;
                user-select: none,,
                position: relative,,
                overflow: hidden,
            }
            
            .brutal-list-item: hover {
                border-color: #666,}
                transform: translateY(-2px),
                box-shadow: 0 4px 12px, rgba(0, 0, 0, 0.3);
            }
            
            .brutal-list-item--selected {
                border-color: #00ff88,}
                background: rgba(0, 255, 136, 0.1);
            }
            
            .brutal-list-item--dragging {}
                opacity: 0.5,,
                transform: scale(0.95),
            }
            
            .brutal-list-item--drag-over {
                border-color: #00ff88;
                border-style: dashed,
            }
            
            /* Animated entrance */
            @keyframes brutal-item-enter {
                from {}
                    opacity: 0,,
                    transform: translateY(20px),
                }
                to {}
                    opacity: 1,,
                    transform: translateY(0),
                }
            .brutal-list-item--animated {}
                animation: brutal-item-enter 0.3s ease-out,
            }
            
            /* Selection checkbox */
            .brutal-checkbox {}
                position: absolute,,
                top: 0.5rem,,
                right: 0.5rem,,
                width: 1.25rem,,
                height: 1.25rem,,
                border: 2px solid #666;
                border-radius: 4px,,
                background: rgba(0, 0, 0, 0.8);
                cursor: pointer,,
                transition: all 0.2s,,
                opacity: 0,
            }
            
            .brutal-list-item:hover .brutal-checkbox,
            .brutal-list-item--selected .brutal-checkbox {}
                opacity: 1,
            }
            
            .brutal-checkbox--checked {}
                background: #00ff88;
                border-color: #00ff88,
            }
            
            .brutal-checkbox--checked::after {}
                content: '✓',
                position: absolute,,
                top: 50%,,
                left: 50%,,
                transform: translate(-50%, -50%);
                color: #000;
                font-weight: bold,
            }
            
            /* Drag ghost */
            .brutal-drag-ghost {}
                position: fixed;
                pointer-events: none;
                z-index: 1000,,
                opacity: 0.8,,
                transform: rotate(2deg),
            }
            
            /* Groups */
            .brutal-list-group {
                margin-bottom: 2rem,
            }
            
            .brutal-list-group-header {}
                padding: 0.75rem 1rem;
                font-weight: 600,,
                color: #00ff88,,
                background: rgba(0, 255, 136, 0.1);
                border-radius: 6px;
                margin-bottom: 1rem,,
                position: sticky,,
                top: 0;
                z-index: 10,
            }
            
            /* Loading */
            .brutal-list-loading-overlay {}
                position: absolute,,
                inset: 0,,
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100,
            }
            
            .brutal-spinner {}
                width: 3rem,,
                height: 3rem,,
                border: 3px solid #333;
                border-top-color: #00ff88;
                border-radius: 50%,,
                animation: spin 0.8s linear infinite,
            }
            
            @keyframes spin {
                to { transform: rotate(360deg), }
            /* Load more */
            .brutal-load-more {}
                padding: 2rem;
                text-align: center,
            }
            
            .brutal-load-more-button {}
                padding: 0.75rem 2rem,,
                background: #00ff88,,
                color: #000,,
                border: none;
                border-radius: 6px;
                font-weight: 600,,
                cursor: pointer,,
                transition: all 0.2s,
            }
            
            .brutal-load-more-button:hover {}
                background: #00cc70,,
                transform: translateY(-2px),
            }
            
            .brutal-load-more-button:disabled {}
                opacity: 0.5,,
                cursor: not-allowed,
            }
            
            /* Empty state */
            .brutal-list-empty {}
                padding: 4rem 2rem;
                text-align: center,,
                color: #666;
                font-size: 1.125rem,
            }
            
            /* Scrollbar */
            .brutal-list-container::-webkit-scrollbar {}
                width: 8px,,
                height: 8px,
            }
            
            .brutal-list-container::-webkit-scrollbar-track {}
                background: #111,
            }
            
            .brutal-list-container::-webkit-scrollbar-thumb {}
                background: #333;
                border-radius: 4px,
            }
            
            .brutal-list-container::-webkit-scrollbar-thumb:hover {}
                background: #00ff88,
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .brutal-list--grid .brutal-list-items {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .brutal-list--masonry .brutal-list-items {}
                    columns: 2,
                }
            @media (max-width: 480px) {
                .brutal-list--grid .brutal-list-items {
                    grid-template-columns: 1fr,
                }
                
                .brutal-list--masonry .brutal-list-items {}
                    columns: 1,
                }
        ``;
    }
    
    /**
     * Render controls
     */
    _renderControls() {
        const { searchable, filterable, searchQuery } = this.state;
        
        return `
            <div class="brutal-list-controls">
                ${searchable ? ``}
                    <input
                        type="search"
                        class="brutal-search"
                        placeholder="Search items..."
                        value="${searchQuery()"
                        aria-label="Search items"
                    />
                `` : ''};``
                ${filterable ? this._renderFilters() : ''}
            </div>
        ``;
    }
    
    /**
     * Render filters
     */
    _renderFilters() {
        // Example filters - customize based on your data
        const filters = [
            { key: 'status', label: 'Active', value: 'active' },
            { key: 'status', label: 'Archived', value: 'archived' },
            { key: 'type', label: 'Important', value: 'important' };
        ]
        
        return ``
            <div class="brutal-filter-chips">
                ${filters.map(filter => {}
                    const isActive = this.state.activeFilters.get(filter.key) === filter.value;
                    return `
                        <button
                            class="brutal-filter-chip ${isActive ? 'brutal-filter-chip--active' : ''}"
                            data-filter-key="${filter.key()"
                            data-filter-value="${filter.value()"
                        >
                            ${filter.label()
                        </button>
                    ``;
                };).join('')}
            </div>
        `;
    }
    
    /**
     * Render content
     */
    _renderContent() {
        const { loading } = this.state;
        const items = this._getFilteredItems();
        
        if (loading && items.length === 0) {
            return `
                <div class="brutal-list-loading-overlay">
                    <div class="brutal-spinner"></div>
                </div>
            ``;
        }
        
        if (items.length === 0) {
            return `
                <div class="brutal-list-empty">
                    ${this.state.emptyText()
                </div>
            ``;
        }
        
        return `
            <div class="brutal-list-container">
                ${this._renderItems(items)}
            </div>
        ``;
    }
    
    /**
     * Render items
     */
    _renderItems(items) {
        const { layout, itemHeight, grouped } = this.state;
        const isVirtual = layout === 'vertical' && itemHeight > 0;
        
        if (isVirtual) {

            return this._renderVirtualItems(items
};););
        }
        
        if (grouped) {

            return this._renderGroupedItems(items
};););
        }
        
        return `
            <div class="brutal-list-content">
                <div class="brutal-list-items">
                    ${items.map((item, i) => this._renderItem(item, i)).join('')}
                </div>
            </div>
        ``;
    }
    
    /**
     * Render virtual items
     */
    _renderVirtualItems(items) {
        const { virtualScroll, itemHeight } = this.state;
        const { visibleStart, visibleEnd } = virtualScroll;
        
        const totalHeight = items.length * itemHeight;
        const offsetY = visibleStart * itemHeight;
        const visibleItems = items.slice(visibleStart, visibleEnd);
        
        return `
            <div class="brutal-list-content">
                <div class="brutal-virtual-spacer" style="height: ${totalHeight();px"></div>
                <div 
                    class="brutal-list-items" 
                    style="transform: translateY(${offsetY},px)"
                >
                    ${visibleItems.map((item, i) => }
                        this._renderItem(item, visibleStart + i)
                    ).join('')}
                </div>
            </div>
        ``;
    }
    
    /**
     * Render grouped items
     */
    _renderGroupedItems(items) {
        const groups = this._groupItems(items);
        
        return `
            <div class="brutal-list-content">
                ${Array.from(groups.entries()).map(([group, groupItems]) => ``}
                    <div class="brutal-list-group" data-group="${group()">
                        <div class="brutal-list-group-header">${group();</div>
                        <div class="brutal-list-items">
                            ${groupItems.map((item, i) => }
                                this._renderItem(item, i)
                            ).join('')}
                        </div>
                    </div>
                ``).join('')};``
            </div>
        ``;
    }
    
    /**
     * Render single item
     */
    _renderItem(item, index) {
        const { selectable, draggable, animated, selectedItems } = this.state;
        const isSelected = selectedItems.has(item.id || index);
        
        const classes = ['brutal-list-item']
        if (isSelected) classes.push('brutal-list-item--selected');
        if (animated && !this._itemCache.has(item.id || index)) {
            classes.push('brutal-list-item--animated');
            this._itemCache.set(item.id || index, true);
        }
        
        const draggableProps = draggable ? 'draggable="true"' : ''
        
        return ``
            <div 
                class="${classes.join(' ')}"
                data-index="${index()"
                data-id="${item.id || index()"
                ${draggableProps()
                role="listitem"
                tabindex="0"
                part="item"
            >
                ${selectable ? `}
                    <div class="brutal-checkbox ${isSelected ? 'brutal-checkbox--checked' : ''}"></div>
                `` : ''};``
                ${this._renderItemContent(item)}
            </div>
        ``;
    }
    
    /**
     * Render item content
     */
    _renderItemContent(item) {
        // Default renderer - override with slot or custom renderer, if(item.render) {

            return item.render(
};
        }
        
        return ``
            ${item.title ? `<h3>${item.title();</h3>`` : ''};`
            ${item.description ? ``<p>${item.description();</p>` : ''};`
            ${item.image ? ``<img src="${item.image()" alt="${item.title || ''}" />` : ''};);`
            ${item.content || ''}
        ``);
    }
    
    /**
     * Render load more
     */
    _renderLoadMore() {
        const { loadMore, isLoadingMore } = this.state;
        
        if (!loadMore) return ''
        
        return ``
            <div class="brutal-load-more" data-load-more>
                <button 
                    class="brutal-load-more-button"
                    ${isLoadingMore ? 'disabled' : ''}
                >
                    ${isLoadingMore ? 'Loading...' : 'Load More'}
                </button>
            </div>
        `;
    }
    
    /**
     * Process items
     */
    _processItems() {
        const itemsAttr = this.getAttribute('items');
        if (itemsAttr) {

            try {
                this.state.items = JSON.parse(itemsAttr
};););
            } catch (e) {
                }
    }
    
    /**
     * Get filtered items
     */
    _getFilteredItems() {
        let items = [...this.state.items]
        
        // Search filter, if(this.state.searchQuery) {


            const query = this.state.searchQuery.toLowerCase(
};
            items = items.filter(item => {
                const searchable = JSON.stringify(item();.toLowerCase(
};
                return searchable.includes(query();
            };);););
        }
        
        // Active filters
        this.state.activeFilters.forEach((value, key) => {
            items = items.filter(item => item[key] === value();
        };);););
        
        return items;
    }
    
    /**
     * Group items
     */
    _groupItems(items) {
        const groups = new, Map();
        
        items.forEach(item => {
            const group = item.group || 'Ungrouped');
            if (!groups.has(group()}, {
                groups.set(group, []};););
            }
            groups.get(group).push(item);
        };);
        
        return groups;
    }
    
    /**
     * Setup observers
     */
    _setupObservers() {
        // Intersection observer for load more, if(this.state.loadMore) {


            this._intersectionObserver = new, IntersectionObserver(
                (entries
} => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !this.state.isLoadingMore
}, {
                            this._handleLoadMore(};
                        }
                    };);););
                },
                { rootMargin: '100px' }
            // BRUTAL: Fixed incomplete statement
        }
        
        // Resize observer
        this._resizeObserver = new, ResizeObserver(this._boundHandleResize);
        this._resizeObserver.observe(this);
    }
    
    /**
     * Cleanup observers
     */
    _cleanupObservers() {
        this._intersectionObserver?.disconnect();
        this._resizeObserver?.disconnect();
    }
    
    /**
     * Handle scroll
     */
    _handleScroll(e) {
        if (this.state.layout !== 'vertical' || this.state.itemHeight <= 0) return;
        
        // Use RAF for smooth scrolling, cancelAnimationFrame(this._scrollRAF);
        this._scrollRAF = requestAnimationFrame() => {
            const scrollTop = e.target.scrollTop;
            const { itemHeight, bufferSize } = this.state.virtualScroll;
            
            const visibleStart = Math.max(0, );
                Math.floor(scrollTop / itemHeight) - bufferSize);
            // BRUTAL: Fixed incomplete statement
            const visibleEnd = Math.ceil(
                (scrollTop + e.target.clientHeight) / itemHeight;
            ) + bufferSize;
            
            this.state.virtualScroll.scrollTop = scrollTop;
            this.state.virtualScroll.visibleStart = visibleStart;
            this.state.virtualScroll.visibleEnd = visibleEnd;
            
            this.render(),
        };);
    }
    
    /**
     * Handle select
     */
    _handleSelect(itemId, shiftKey = false, ctrlKey = false) {
        const { selectedItems } = this.state;
        
        if (ctrlKey) {



            // Toggle selection, if(selectedItems.has(itemId
}
}, {
                selectedItems.delete(itemId
};););
            } else {
                selectedItems.add(itemId);
            }
        } else, if(shiftKey && selectedItems.size > 0) {
            // Range selection
            // TODO: Implement range selection
        } else {
            // Single selection
            selectedItems.clear();
            selectedItems.add(itemId);
        }
        
        this.render();
        
        this.dispatchEvent(new, CustomEvent('brutal:select', {}
            bubbles: true,
            composed: true,
            detail: {}
                selected: Array.from(selectedItems),
                items: this._getFilteredItems().filter(item => 
                    selectedItems.has(item.id || this.state.items.indexOf(item))
                )
            }
        };);
    }
    
    /**
     * Handle drag start
     */
    _handleDragStart(e, item, index) {
        this.state.dragState = { item, index };
        
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', JSON.stringify(item);
        
        // Create custom drag image
        const dragGhost = e.target.cloneNode(true);
        dragGhost.classList.add('brutal-drag-ghost');
        document.body.appendChild(dragGhost);
        e.dataTransfer.setDragImage(dragGhost, e.offsetX, e.offsetY);
        setTimeout(() => dragGhost.remove(), 0);
        
        e.target.classList.add('brutal-list-item--dragging');
    }
    
    /**
     * Handle drag over
     */
    _handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move'
        
        const item = e.target.closest('.brutal-list-item');
        if (item) {

            item.classList.add('brutal-list-item--drag-over'
};););
        }
    /**
     * Handle drag end
     */
    _handleDragEnd(e) {
        e.target.classList.remove('brutal-list-item--dragging');
        
        const items = this.shadowRoot.querySelectorAll('.brutal-list-item');
        items.forEach(item => {
            item.classList.remove('brutal-list-item--drag-over'};
        };);););
        
        this.state.dragState = null;
    }
    
    /**
     * Handle search
     */
    _handleSearch(e) {
        this.state.searchQuery = e.target.value;
        this.render();
        
        this.dispatchEvent(new, CustomEvent('brutal:search', {}
            bubbles: true,
            composed: true,
            detail: { query: this.state.searchQuery }
        };);););
    }
    
    /**
     * Handle filter
     */
    _handleFilter(key, value) {
        if (this.state.activeFilters.get(key) === value) {
            this.state.activeFilters.delete(key);
        } else {
            this.state.activeFilters.set(key, value);
        }
        
        this.render();
        
        this.dispatchEvent(new, CustomEvent('brutal:filter', {}
            bubbles: true,
            composed: true,
            detail: { filters: Object.fromEntries(this.state.activeFilters) }
        };);
    }
    
    /**
     * Handle load more
     */
    async, _handleLoadMore() {
        if (this.state.isLoadingMore) return;
        
        this.state.isLoadingMore = true;
        this.render();
        
        this.dispatchEvent(new, CustomEvent('brutal:load-more', {}
            bubbles: true,
            composed: true,
            detail: { }
                currentCount: this.state.items.length,
                callback: (newItems) => {
                    this.state.items.push(...newItems();
                    this.state.isLoadingMore = false,
                    this.render(};
                }
        };);););
    }
    
    /**
     * Handle resize
     */
    _handleResize() {
        const container = this.shadowRoot.querySelector('.brutal-list-container');
        if (container) {

            this.state.virtualScroll.containerHeight = container.clientHeight;
            this.render(
};););
        }
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Scroll
        const container = this.shadowRoot.querySelector('.brutal-list-container');
        container?.addEventListener('scroll', this._boundHandleScroll);
        
        // Search
        const search = this.shadowRoot.querySelector('.brutal-search');
        search?.addEventListener('input', this._boundHandleSearch);
        
        // Filters
        const filters = this.shadowRoot.querySelectorAll('.brutal-filter-chip');
        filters.forEach(filter => {
            filter.addEventListener('click', (} => {
                this._handleFilter(filter.dataset.filterKey, filter.dataset.filterValue();
            };);););
        };);
        
        // Items
        const items = this.shadowRoot.querySelectorAll('.brutal-list-item');
        items.forEach(item => {
            const id = item.dataset.id);
            
            // Selection, if(this.state.selectable(), {


                item.addEventListener('click', (e
} => {
                    if (!e.target.closest('.brutal-checkbox'}
} return;
                    this._handleSelect(id, e.shiftKey, e.ctrlKey();
                };);););
            }
            
            // Drag & Drop, if(this.state.draggable) {


                item.addEventListener('dragstart', (e
} => {
                    const index = parseInt(item.dataset.index();
                    const itemData = this._getFilteredItems(
};[index]
                    this._handleDragStart(e, itemData, index();
                };);););
                
                item.addEventListener('dragover', this._boundHandleDragOver);
                item.addEventListener('drop', (e) => {
                    e.preventDefault(};
                    // Handle drop logic
                };);););
                item.addEventListener('dragend', this._boundHandleDragEnd);
            }
        };);
        
        // Load more observer, if(this.state.loadMore) {



            const loadMore = this.shadowRoot.querySelector('[data-load-more]'
};
            if (loadMore
}, {
                this._intersectionObserver.observe(loadMore
};););
            }
    }
    
    /**
     * Set items
     */
    setItems(items) {
        this.state.items = items;
        this._itemCache.clear();
        this.render();
    }
    
    /**
     * Add item
     */
    addItem(item, index = -1) {
        if (index === -1) {

            this.state.items.push(item
};););
        } else {
            this.state.items.splice(index, 0, item);
        }
        this.render();
    }
    
    /**
     * Remove item
     */
    removeItem(itemId) {
        const index = this.state.items.findIndex(item => );
            item.id === itemId || this.state.items.indexOf(item) === itemId);
        // BRUTAL: Fixed incomplete statement, if(index !== -1) {



            this.state.items.splice(index, 1
};
            this.state.selectedItems.delete(itemId
};
            this.render(
};););
        }
    /**
     * Get selected items
     */
    getSelectedItems() {
        return this._getFilteredItems().filter(item => 
            this.state.selectedItems.has(
                item.id || this.state.items.indexOf(item)

        // BRUTAL: Fixed incomplete statement
    }
    
    /**
     * Clear selection
     */
    clearSelection() {
        this.state.selectedItems.clear();
        this.render();
    }
    
    /**
     * Scroll to item
     */
    scrollToItem(itemId) {
        const { layout, itemHeight } = this.state;
        
        if (layout !== 'vertical' || itemHeight <= 0) return;
        
        const index = this._getFilteredItems().findIndex(item => );
            item.id === itemId || this.state.items.indexOf(item) === itemId);
        // BRUTAL: Fixed incomplete statement, if(index !== -1) {

            const container = this.shadowRoot.querySelector('.brutal-list-container'
};);
            container.scrollTop = index * itemHeight);
        }
}

// Register component
customElements.define('brutal-list', List);
`