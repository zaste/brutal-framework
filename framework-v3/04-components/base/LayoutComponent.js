/**
 * BRUTAL V3 - LayoutComponent Base Class
 * Base class for responsive layout components with grid and flexbox utilities
 */

import { Component } from '../../01-core/Component.js';
import { LayoutThrottle } from '../../02-performance/04-LayoutThrottle.js';

export class LayoutComponent extends Component {
    constructor() {
        super();
        
        // Layout type
        this._layoutType = 'flex'; // 'flex' | 'grid' | 'masonry' | 'stack'
        
        // Responsive breakpoints
        this._breakpoints = {
            xs: 0,
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200,
            xxl: 1400
        };
        
        // Current breakpoint
        this._currentBreakpoint = null;
        
        // Layout configuration per breakpoint
        this._layouts = {
            xs: {},
            sm: {},
            md: {},
            lg: {},
            xl: {},
            xxl: {}
        };
        
        // Container queries
        this._containerQueries = {
            enabled: false,
            queries: []
        };
        
        // Gap management
        this._gap = {
            row: 16,
            column: 16,
            responsive: {}
        };
        
        // Alignment
        this._alignment = {
            justify: 'start', // start | center | end | space-between | space-around | space-evenly
            align: 'stretch', // start | center | end | stretch | baseline
            place: 'start start' // shorthand for align-content justify-content
        };
        
        // Grid specific
        this._grid = {
            columns: 12,
            rows: 'auto',
            areas: null,
            autoFlow: 'row',
            autoRows: 'auto',
            autoColumns: 'auto'
        };
        
        // Masonry specific
        this._masonry = {
            columnWidth: 300,
            gutter: 16,
            fitWidth: true,
            originLeft: true,
            originTop: true,
            transitionDuration: 300
        };
        
        // Performance
        this._layoutThrottle = new LayoutThrottle();
        this._resizeObserver = null;
        this._mutationObserver = null;
        
        // Layout cache
        this._layoutCache = new Map();
        this._cacheKey = null;
        
        // V8 optimization
        this._boundHandleResize = this._handleResize.bind(this);
        this._boundHandleMutation = this._handleMutation.bind(this);
        this._boundUpdateLayout = this._updateLayout.bind(this);
    }
    
    /**
     * Set layout type
     */
    setLayoutType(type) {
        if (this._layoutType !== type) {
            this._layoutType = type;
            this._invalidateCache();
            this._updateLayout();
        }
    }
    
    /**
     * Configure layout for breakpoint
     */
    configureBreakpoint(breakpoint, config) {
        if (breakpoint in this._layouts) {
            Object.assign(this._layouts[breakpoint], config);
            this._invalidateCache();
            
            if (this._currentBreakpoint === breakpoint) {
                this._updateLayout();
            }
        }
    }
    
    /**
     * Set responsive gap
     */
    setGap(rowGap, columnGap = rowGap, responsive = {}) {
        this._gap.row = rowGap;
        this._gap.column = columnGap;
        this._gap.responsive = responsive;
        this._updateLayout();
    }
    
    /**
     * Set alignment
     */
    setAlignment(justify, align, place = null) {
        this._alignment.justify = justify;
        this._alignment.align = align;
        if (place) this._alignment.place = place;
        this._updateLayout();
    }
    
    /**
     * Configure grid
     */
    configureGrid(options) {
        Object.assign(this._grid, options);
        if (this._layoutType === 'grid') {
            this._updateLayout();
        }
    }
    
    /**
     * Define grid areas
     */
    defineGridAreas(areas) {
        this._grid.areas = areas;
        if (this._layoutType === 'grid') {
            this._updateLayout();
        }
    }
    
    /**
     * Configure masonry
     */
    configureMasonry(options) {
        Object.assign(this._masonry, options);
        if (this._layoutType === 'masonry') {
            this._updateLayout();
        }
    }
    
    /**
     * Add container query
     */
    addContainerQuery(query, callback) {
        this._containerQueries.queries.push({ query, callback });
        this._setupContainerQueries();
    }
    
    /**
     * Get current breakpoint
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        let current = 'xs';
        
        for (const [breakpoint, minWidth] of Object.entries(this._breakpoints)) {
            if (width >= minWidth) {
                current = breakpoint;
            }
        }
        
        return current;
    }
    
    /**
     * Update layout
     */
    _updateLayout() {
        this._layoutThrottle.schedule(() => {
            const breakpoint = this.getCurrentBreakpoint();
            
            // Check if breakpoint changed
            if (breakpoint !== this._currentBreakpoint) {
                this._currentBreakpoint = breakpoint;
                this._onBreakpointChange(breakpoint);
            }
            
            // Get cached layout if available
            const cacheKey = this._generateCacheKey();
            if (this._layoutCache.has(cacheKey)) {
                this._applyLayout(this._layoutCache.get(cacheKey));
                return;
            }
            
            // Calculate new layout
            const layout = this._calculateLayout(breakpoint);
            this._layoutCache.set(cacheKey, layout);
            this._applyLayout(layout);
        });
    }
    
    /**
     * Calculate layout based on type and breakpoint
     */
    _calculateLayout(breakpoint) {
        const config = this._layouts[breakpoint] || {};
        const gap = this._gap.responsive[breakpoint] || this._gap;
        
        switch (this._layoutType) {
            case 'flex':
                return this._calculateFlexLayout(config, gap);
            case 'grid':
                return this._calculateGridLayout(config, gap);
            case 'masonry':
                return this._calculateMasonryLayout(config, gap);
            case 'stack':
                return this._calculateStackLayout(config, gap);
            default:
                return {};
        }
    }
    
    /**
     * Calculate flex layout
     */
    _calculateFlexLayout(config, gap) {
        const {
            direction = 'row',
            wrap = 'wrap',
            justify = this._alignment.justify,
            align = this._alignment.align,
            alignContent = 'stretch'
        } = config;
        
        return {
            display: 'flex',
            flexDirection: direction,
            flexWrap: wrap,
            justifyContent: justify,
            alignItems: align,
            alignContent: alignContent,
            gap: `${gap.row || gap}px ${gap.column || gap}px`
        };
    }
    
    /**
     * Calculate grid layout
     */
    _calculateGridLayout(config, gap) {
        const {
            columns = this._grid.columns,
            rows = this._grid.rows,
            areas = this._grid.areas,
            autoFlow = this._grid.autoFlow,
            autoRows = this._grid.autoRows,
            autoColumns = this._grid.autoColumns,
            justify = this._alignment.justify,
            align = this._alignment.align,
            placeItems = this._alignment.place
        } = config;
        
        const styles = {
            display: 'grid',
            gap: `${gap.row || gap}px ${gap.column || gap}px`,
            justifyContent: justify,
            alignContent: align,
            placeItems: placeItems,
            gridAutoFlow: autoFlow,
            gridAutoRows: autoRows,
            gridAutoColumns: autoColumns
        };
        
        // Handle columns
        if (typeof columns === 'number') {
            styles.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        } else {
            styles.gridTemplateColumns = columns;
        }
        
        // Handle rows
        if (rows !== 'auto') {
            styles.gridTemplateRows = rows;
        }
        
        // Handle areas
        if (areas) {
            styles.gridTemplateAreas = areas;
        }
        
        return styles;
    }
    
    /**
     * Calculate masonry layout
     */
    _calculateMasonryLayout(config, gap) {
        // Masonry requires JS positioning
        // Return base styles, actual positioning done in _applyMasonryLayout
        return {
            position: 'relative',
            width: this._masonry.fitWidth ? 'fit-content' : '100%',
            margin: '0 auto'
        };
    }
    
    /**
     * Calculate stack layout
     */
    _calculateStackLayout(config, gap) {
        const {
            direction = 'vertical',
            justify = this._alignment.justify,
            align = this._alignment.align
        } = config;
        
        return {
            display: 'flex',
            flexDirection: direction === 'vertical' ? 'column' : 'row',
            justifyContent: justify,
            alignItems: align,
            gap: `${gap.row || gap}px`
        };
    }
    
    /**
     * Apply layout styles
     */
    _applyLayout(styles) {
        const container = this._getLayoutContainer();
        
        // Apply styles
        Object.assign(container.style, styles);
        
        // Special handling for masonry
        if (this._layoutType === 'masonry') {
            this._applyMasonryLayout(container);
        }
        
        // Emit layout change event
        this.dispatchEvent(new CustomEvent('layoutchange', {
            detail: {
                type: this._layoutType,
                breakpoint: this._currentBreakpoint,
                styles
            }
        }));
    }
    
    /**
     * Apply masonry layout with JavaScript
     */
    _applyMasonryLayout(container) {
        const items = Array.from(container.children);
        if (items.length === 0) return;
        
        const columnWidth = this._masonry.columnWidth;
        const gutter = this._masonry.gutter;
        const containerWidth = container.offsetWidth;
        
        // Calculate columns
        const columns = Math.floor((containerWidth + gutter) / (columnWidth + gutter));
        const columnHeights = new Array(columns).fill(0);
        
        // Position items
        items.forEach((item, index) => {
            // Find shortest column
            const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
            
            // Calculate position
            const x = shortestColumn * (columnWidth + gutter);
            const y = columnHeights[shortestColumn];
            
            // Apply position with transition
            item.style.position = 'absolute';
            item.style.width = `${columnWidth}px`;
            item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            item.style.transition = `transform ${this._masonry.transitionDuration}ms ease`;
            
            // Update column height
            columnHeights[shortestColumn] += item.offsetHeight + gutter;
        });
        
        // Update container height
        container.style.height = `${Math.max(...columnHeights)}px`;
    }
    
    /**
     * Get layout container
     */
    _getLayoutContainer() {
        let container = this.shadowRoot.querySelector('.layout-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'layout-container';
            this.shadowRoot.appendChild(container);
        }
        return container;
    }
    
    /**
     * Handle resize
     */
    _handleResize(entries) {
        if (entries && entries.length > 0) {
            this._updateLayout();
        }
    }
    
    /**
     * Handle DOM mutations
     */
    _handleMutation(mutations) {
        // Check if children were added/removed
        const childListChanged = mutations.some(m => m.type === 'childList');
        if (childListChanged) {
            this._invalidateCache();
            this._updateLayout();
        }
    }
    
    /**
     * Setup container queries
     */
    _setupContainerQueries() {
        if (!this._containerQueries.enabled || !('ResizeObserver' in window)) {
            return;
        }
        
        const container = this._getLayoutContainer();
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            const width = entry.contentBoxSize?.[0]?.inlineSize || entry.contentRect.width;
            
            // Check queries
            this._containerQueries.queries.forEach(({ query, callback }) => {
                if (this._matchesQuery(query, width)) {
                    callback(width);
                }
            });
        });
        
        observer.observe(container);
    }
    
    /**
     * Check if width matches query
     */
    _matchesQuery(query, width) {
        // Parse query like "min-width: 500px"
        const match = query.match(/^(min|max)-width:\s*(\d+)px$/);
        if (!match) return false;
        
        const [, type, value] = match;
        const threshold = parseInt(value);
        
        return type === 'min' ? width >= threshold : width <= threshold;
    }
    
    /**
     * Breakpoint change handler
     */
    _onBreakpointChange(breakpoint) {
        this.dispatchEvent(new CustomEvent('breakpointchange', {
            detail: { breakpoint }
        }));
    }
    
    /**
     * Generate cache key
     */
    _generateCacheKey() {
        return `${this._layoutType}-${this._currentBreakpoint}-${JSON.stringify(this._gap)}`;
    }
    
    /**
     * Invalidate layout cache
     */
    _invalidateCache() {
        this._layoutCache.clear();
    }
    
    /**
     * Add child with layout properties
     */
    addChild(element, layoutProps = {}) {
        const container = this._getLayoutContainer();
        
        // Apply layout properties
        if (this._layoutType === 'grid' && layoutProps.area) {
            element.style.gridArea = layoutProps.area;
        }
        
        if (layoutProps.order !== undefined) {
            element.style.order = layoutProps.order;
        }
        
        if (layoutProps.flex) {
            element.style.flex = layoutProps.flex;
        }
        
        if (layoutProps.span) {
            element.style.gridColumn = `span ${layoutProps.span}`;
        }
        
        container.appendChild(element);
    }
    
    /**
     * Connected callback
     */
    connectedCallback() {
        super.connectedCallback();
        
        // Setup resize observer
        if ('ResizeObserver' in window) {
            this._resizeObserver = new ResizeObserver(this._boundHandleResize);
            this._resizeObserver.observe(this);
        } else {
            // Fallback to window resize
            window.addEventListener('resize', this._boundUpdateLayout);
        }
        
        // Setup mutation observer
        this._mutationObserver = new MutationObserver(this._boundHandleMutation);
        this._mutationObserver.observe(this._getLayoutContainer(), {
            childList: true,
            subtree: false
        });
        
        // Initial layout
        this._updateLayout();
    }
    
    /**
     * Disconnected callback
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clean up observers
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
        }
        
        // Remove event listener
        window.removeEventListener('resize', this._boundUpdateLayout);
        
        // Clear cache
        this._layoutCache.clear();
    }
    
    /**
     * Get layout metrics
     */
    getMetrics() {
        const container = this._getLayoutContainer();
        return {
            type: this._layoutType,
            breakpoint: this._currentBreakpoint,
            childCount: container.children.length,
            containerWidth: container.offsetWidth,
            containerHeight: container.offsetHeight,
            cacheSize: this._layoutCache.size
        };
    }
}