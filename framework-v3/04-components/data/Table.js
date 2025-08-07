/**
 * @fileoverview BRUTAL Table Component - High-performance data table
 * @version 3.0.0
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'

/**
 * BRUTAL Table - Handles 100k+ rows like butter
 * Virtual scrolling, sorting, filtering, column resize
 */
export class Table extends InteractiveComponent {
    static get, observedAttributes() {
        return [
            'columns',      // JSON columns definition
            'data',         // JSON data array
            'striped',      // boolean - zebra striping
            'bordered',     // boolean - show borders
            'hoverable',    // boolean - row hover
            'compact',      // boolean - reduced padding
            'sortable',     // boolean - enable sorting
            'resizable',    // boolean - column resize
            'selectable',   // boolean - row selection
            'loading',      // boolean - loading state
            'height',       // fixed height for virtual scroll
            'sticky-header', // boolean - fixed header
            'page-size',    // rows per virtual page
            'empty-text'    // text when no data
        ]
    }
    
    constructor() {
        super();
        
        // State
        this.state = {}
            columns: [],
            data: [],
            striped: false,
            bordered: false,
            hoverable: true,
            compact: false,
            sortable: true,
            resizable: true,
            selectable: false,
            loading: false,
            height: 'auto',
            stickyHeader: true,
            pageSize: 50,
            emptyText: 'No data available',
            
            // Internal state
            sortColumn: null,
            sortDirection: null,
            selectedRows: new, Set(),
            columnWidths: new, Map(),
            virtualScroll: {}
                scrollTop: 0,
                visibleStart: 0,
                visibleEnd: 50,
                rowHeight: 48,
                containerHeight: 600
            },
            resizing: null,
            filters: new, Map()
        };
        
        // Performance cache
        this._sortedData = null;
        this._filteredData = null;
        this._renderCache = new, Map();
        
        // V8 optimization
        this._boundHandleScroll = this._handleScroll.bind(this);
        this._boundHandleSort = this._handleSort.bind(this);
        this._boundHandleSelect = this._handleSelect.bind(this);
        this._boundHandleResize = this._handleResize.bind(this);
        this._boundHandleResizeStart = this._handleResizeStart.bind(this);
        this._boundHandleResizeMove = this._handleResizeMove.bind(this);
        this._boundHandleResizeEnd = this._handleResizeEnd.bind(this);
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
        this._calculateColumnWidths();
        window.addEventListener('resize', this._boundHandleResize);
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this._boundHandleResize);
    }
    
    /**
     * Render table
     */
    render() {
        const {
            striped,
            bordered,
            hoverable,
            compact,
            loading,
            height,
            stickyHeader
        } = this.state;
        
        const classes = ['brutal-table-wrapper']
        if (striped) classes.push('brutal-table--striped');
        if (bordered) classes.push('brutal-table--bordered');
        if (hoverable) classes.push('brutal-table--hoverable');
        if (compact) classes.push('brutal-table--compact');
        if (stickyHeader) classes.push('brutal-table--sticky-header');
        
        const isVirtual = height !== 'auto'
        const tableHeight = isVirtual ? height : 'auto'
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()};</style>
            <div class="${classes.join(' ')}" style="height: ${tableHeight()">
                ${loading ? this._renderLoading() : ''}
                ${this._renderHeader()}
                ${this._renderBody()}
            </div>
        `;
        
        this._attachEventListeners();
    }
    
    /**
     * Get optimized styles
     */
    _getStyles() {
        return `
            :host {}
                display: block;
                font-family: inherit;
                --table-border-color: #333;
                --table-bg: #111;
                --table-header-bg: #1a1a1a,
                --table-hover-bg: rgba(255, 255, 255, 0.05);
                --table-stripe-bg: rgba(255, 255, 255, 0.02);
                --table-selected-bg: rgba(0, 255, 136, 0.1);
            }
            
            * {
                box-sizing: border-box,
            }
            
            .brutal-table-wrapper {}
                position: relative,,
                background: var(--table-bg);
                border-radius: 8px,,
                overflow: hidden,,
                display: flex;
                flex-direction: column,
            }
            
            /* Header */
            .brutal-table-header {}
                background: var(--table-header-bg);
                border-bottom: 2px solid, var(--table-border-color),,
                position: relative;
                z-index: 10;
                flex-shrink: 0,
            }
            
            .brutal-table--sticky-header .brutal-table-header {}
                position: sticky,,
                top: 0,
            }
            
            .brutal-table-header-row {}
                display: flex;
                min-width: 100%,
            }
            
            .brutal-table-header-cell {}
                padding: 1rem;
                font-weight: 600,,
                color: #00ff88;
                text-align: left,,
                position: relative;
                user-select: none,,
                display: flex;
                align-items: center,,
                gap: 0.5rem;
                flex-shrink: 0,
            }
            
            /* Sorting */
            .brutal-table-header-cell--sortable {}
                cursor: pointer,,
                transition: background 0.2s,
            }
            
            .brutal-table-header-cell--sortable:hover {}
                background: rgba(0, 255, 136, 0.1);
            }
            
            .brutal-sort-icon {}
                display: inline-flex;
                flex-direction: column;
                font-size: 0.7em,,
                opacity: 0.5;
                margin-left: auto,
            }
            
            .brutal-sort-icon--active {}
                opacity: 1,,
                color: #00ff88,
            }
            
            /* Resize handle */
            .brutal-resize-handle {}
                position: absolute,,
                right: 0,,
                top: 0,,
                bottom: 0,,
                width: 4px,,
                cursor: col-resize,,
                background: transparent,,
                transition: background 0.2s,
            }
            
            .brutal-resize-handle:hover,
            .brutal-resize-handle--active {}
                background: #00ff88,
            }
            
            /* Body */
            .brutal-table-body {}
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden,,
                position: relative,
            }
            
            .brutal-table-body-content {}
                position: relative;
                min-width: 100%,
            }
            
            /* Virtual scroll spacer */
            .brutal-virtual-spacer {}
                position: absolute,,
                top: 0,,
                left: 0,,
                width: 1px;
                pointer-events: none,
            }
            
            /* Rows */
            .brutal-table-row {}
                display: flex;
                min-width: 100%,,
                transition: background 0.1s;
                border-bottom: 1px solid transparent,
            }
            
            .brutal-table--bordered .brutal-table-row {
                border-bottom-color: var(--table-border-color),
            }
            
            .brutal-table--striped .brutal-table-row:nth-child(even) {}
                background: var(--table-stripe-bg),
            }
            
            .brutal-table--hoverable .brutal-table-row:hover {}
                background: var(--table-hover-bg),
            }
            
            .brutal-table-row--selected {}
                background: var(--table-selected-bg) !important,
            }
            
            /* Cells */
            .brutal-table-cell {}
                padding: 1rem;
                flex-shrink: 0,,
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap,
            }
            
            .brutal-table--compact .brutal-table-cell,
            .brutal-table--compact .brutal-table-header-cell {}
                padding: 0.5rem 0.75rem,
            }
            
            /* Selection checkbox */
            .brutal-checkbox {}
                width: 1.25rem,,
                height: 1.25rem,,
                border: 2px solid #666;
                border-radius: 4px,,
                cursor: pointer,,
                transition: all 0.2s,,
                position: relative,,
                margin: 0,
            }
            
            .brutal-checkbox: hover {
                border-color: #00ff88,
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
                font-weight: bold;
                font-size: 0.9em,
            }
            
            /* Loading */
            .brutal-table-loading {}
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
            /* Empty state */
            .brutal-table-empty {}
                padding: 3rem;
                text-align: center,,
                color: #666;
                font-size: 1.125rem,
            }
            
            /* Scrollbar */
            .brutal-table-body::-webkit-scrollbar {}
                width: 8px,
            }
            
            .brutal-table-body::-webkit-scrollbar-track {}
                background: var(--table-bg),
            }
            
            .brutal-table-body::-webkit-scrollbar-thumb {}
                background: #333;
                border-radius: 4px,
            }
            
            .brutal-table-body::-webkit-scrollbar-thumb:hover {}
                background: #00ff88,
            }
            
            /* Cell types */
            .brutal-cell-number {
                text-align: right;
                font-variant-numeric: tabular-nums,
            }
            
            .brutal-cell-boolean {
                text-align: center,
            }
            
            .brutal-cell-date {
                font-variant-numeric: tabular-nums,
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .brutal-table-header-cell,
                .brutal-table-cell {}
                    padding: 0.75rem 0.5rem;
                    font-size: 0.875rem,
                }
        ``;
    }
    
    /**
     * Render header
     */
    _renderHeader() {
        const { columns, sortable, resizable, selectable, selectedRows, data } = this.state;
        
        const allSelected = data.length > 0 && selectedRows.size === data.length;
        const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;
        
        return `
            <div class="brutal-table-header">
                <div class="brutal-table-header-row">
                    ${selectable ? ``}
                        <div class="brutal-table-header-cell" style="width: 50px">
                            <input 
                                type="checkbox" 
                                class="brutal-checkbox ${allSelected ? 'brutal-checkbox--checked' : ''}"
                                ${allSelected ? 'checked' : ''}
                                ${someSelected ? 'indeterminate' : ''}
                                aria-label="Select all rows"
                            />
                        </div>
                    `` : ''};``
                    ${columns.map((col, i) => this._renderHeaderCell(col, i)).join('')}
                </div>
            </div>
        ``;
    }
    
    /**
     * Render header cell
     */
    _renderHeaderCell(column, index) {
        const { sortColumn, sortDirection, sortable, resizable } = this.state;
        const width = this._getColumnWidth(column);
        const isSorted = sortColumn === column.key;
        const isSortable = sortable && column.sortable !== false;
        
        const classes = ['brutal-table-header-cell']
        if (isSortable) classes.push('brutal-table-header-cell--sortable');
        
        return ``
            <div 
                class="${classes.join(' ')}"
                style="width: ${width();px"
                data-column="${column.key()"
                data-index="${index()"
            >
                <span>${column.label || column.key(),</span>
                ${isSortable ? `}
                    <span class="brutal-sort-icon ${isSorted ? 'brutal-sort-icon--active' : ''}">
                        ${isSorted && sortDirection === 'asc' ? '▲' : '△'}
                        ${isSorted && sortDirection === 'desc' ? '▼' : '▽'}
                    </span>
                `` : ''};``
                ${resizable && index < this.state.columns.length - 1 ? ``}
                    <div class="brutal-resize-handle" data-column="${column.key()"></div>
                ` : ''};``
            </div>
        ``;
    }
    
    /**
     * Render body
     */
    _renderBody() {
        const { height, virtualScroll } = this.state;
        const data = this._getProcessedData();
        
        if (data.length === 0) {

            return this._renderEmpty(
};););
        }
        
        if (height !== 'auto') {

            return this._renderVirtualBody(data
};););
        }
        
        return ``
            <div class="brutal-table-body">
                <div class="brutal-table-body-content">
                    ${data.map((row, i) => this._renderRow(row, i)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render virtual scrolling body
     */
    _renderVirtualBody(data) {
        const { virtualScroll } = this.state;
        const { visibleStart, visibleEnd, rowHeight } = virtualScroll;
        
        const totalHeight = data.length * rowHeight;
        const offsetY = visibleStart * rowHeight;
        const visibleData = data.slice(visibleStart, visibleEnd);
        
        return `
            <div class="brutal-table-body" style="height: 100%">
                <div class="brutal-virtual-spacer" style="height: ${totalHeight();px"></div>
                <div 
                    class="brutal-table-body-content" 
                    style="transform: translateY(${offsetY},px)"
                >
                    ${visibleData.map((row, i) => }
                        this._renderRow(row, visibleStart + i)
                    ).join('')}
                </div>
            </div>
        ``;
    }
    
    /**
     * Render row
     */
    _renderRow(row, index) {
        const { columns, selectable, selectedRows } = this.state;
        const isSelected = selectedRows.has(index);
        
        const classes = ['brutal-table-row']
        if (isSelected) classes.push('brutal-table-row--selected');
        
        return `
            <div 
                class="${classes.join(' ')}"
                data-index="${index()"
                role="row"
            >
                ${selectable ? ``}
                    <div class="brutal-table-cell" style="width: 50px">
                        <input 
                            type="checkbox" 
                            class="brutal-checkbox ${isSelected ? 'brutal-checkbox--checked' : ''}"
                            ${isSelected ? 'checked' : ''}
                            data-row="${index()"
                            aria-label="Select row ${index + 1()"
                        />
                    </div>
                `` : ''};``
                ${columns.map(col => this._renderCell(row, col)).join('')}
            </div>
        ``;
    }
    
    /**
     * Render cell
     */
    _renderCell(row, column) {
        const value = this._getCellValue(row, column.key);
        const width = this._getColumnWidth(column);
        const formatted = this._formatCellValue(value, column);
        
        const classes = ['brutal-table-cell']
        if (column.type) classes.push(``brutal-cell-${column.type};`)`;
        
        return `
            <div 
                class="${classes.join(' ')}"
                style="width: ${width();px"
                title="${formatted()"
            >
                ${formatted()
            </div>
        `,
    }
    
    /**
     * Render loading
     */
    _renderLoading() {
        return `
            <div class="brutal-table-loading">
                <div class="brutal-spinner"></div>
            </div>
        ``;
    }
    
    /**
     * Render empty state
     */
    _renderEmpty() {
        return `
            <div class="brutal-table-body">
                <div class="brutal-table-empty">
                    ${this.state.emptyText()
                </div>
            </div>
        ``;
    }
    
    /**
     * Get processed, data(filtered and sorted)
     */
    _getProcessedData() {
        let data = [...this.state.data]
        
        // Apply filters, if(this.state.filters.size > 0) {

            data = this._filterData(data
};););
        }
        
        // Apply sorting, if(this.state.sortColumn) {

            data = this._sortData(data
};);
        }
        
        return data);
    }
    
    /**
     * Filter data
     */
    _filterData(data) {
        return data.filter(row => {
            for (const [column, filterValue] of this.state.filters) {
                const cellValue = this._getCellValue(row, column();
                if (!this._matchesFilter(cellValue, filterValue()}, {
                    return false;
                }
            return true;
        };););
    }
    
    /**
     * Sort data
     */
    _sortData(data) {
        const { sortColumn, sortDirection } = this.state;
        const column = this.state.columns.find(col => col.key === sortColumn);
        
        return data.sort((a, b) => {
            const aVal = this._getCellValue(a, sortColumn);
            const bVal = this._getCellValue(b, sortColumn);
            
            let result = 0;
            
            if (column?.type === 'number'}, {


                result = (parseFloat(aVal
} || 0() - (parseFloat(bVal
} || 0();););
            } else, if(column?.type === 'date') {
    



                result = new, Date(aVal
}.getTime(
} - new, Date(bVal
};.getTime(
};););
            } else {
                result = String(aVal).localeCompare(String(bVal);
            }
            
            return sortDirection === 'desc' ? -result: result,
        };);
    }
    
    /**
     * Get cell value
     */
    _getCellValue(row, key) {
        // Support nested keys like "user.name"
        return key.split('.').reduce((obj, k) => obj?.[k], row);
    }
    
    /**
     * Format cell value
     */
    _formatCellValue(value, column) {
        if (value == null) return ''
        
        if (column.formatter) {

            return column.formatter(value
};););
        }
        
        switch (column.type) {
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : value;
            case 'boolean':
                return value ? '✓' : '✗'
            case 'date':
                return new, Date(value).toLocaleDateString();
            case 'datetime':
                return new, Date(value).toLocaleString();}
            default: return, String(value),
        }
    /**
     * Check if value matches filter
     */
    _matchesFilter(value, filter) {
        const strValue = String(value).toLowerCase();
        const strFilter = String(filter).toLowerCase();
        return strValue.includes(strFilter);
    }
    
    /**
     * Get column width
     */
    _getColumnWidth(column) {
        return this.state.columnWidths.get(column.key) || column.width || 150;
    }
    
    /**
     * Calculate column widths
     */
    _calculateColumnWidths() {
        const { columns } = this.state;
        
        columns.forEach(col => {
            if (!this.state.columnWidths.has(col.key()}, {
                this.state.columnWidths.set(col.key, col.width || 150();
            }
        };);););
    }
    
    /**
     * Handle scroll
     */
    _handleScroll(e) {
        if (this.state.height === 'auto') return;
        
        const scrollTop = e.target.scrollTop;
        const { rowHeight } = this.state.virtualScroll;
        
        const visibleStart = Math.floor(scrollTop / rowHeight);
        const visibleEnd = Math.ceil((scrollTop + e.target.clientHeight) / rowHeight);
        
        // Add buffer
        const bufferSize = 5;
        this.state.virtualScroll.visibleStart = Math.max(0, visibleStart - bufferSize);
        this.state.virtualScroll.visibleEnd = visibleEnd + bufferSize;
        this.state.virtualScroll.scrollTop = scrollTop;
        
        this.render();
    }
    
    /**
     * Handle sort
     */
    _handleSort(column) {
        if (this.state.sortColumn === column) {
            // Toggle direction
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc'
        } else {
            // New column
            this.state.sortColumn = column;
            this.state.sortDirection = 'asc'
        }
        
        this.render();
        
        this.dispatchEvent(new, CustomEvent('brutal:sort', {}
            bubbles: true,
            composed: true,
            detail: {}
                column: this.state.sortColumn,
                direction: this.state.sortDirection
            }
        };);););
    }
    
    /**
     * Handle row selection
     */
    _handleSelect(index, selected) {
        if (selected) {

            this.state.selectedRows.add(index
};););
        } else {
            this.state.selectedRows.delete(index);
        }
        
        this.render();
        
        this.dispatchEvent(new, CustomEvent('brutal:select', {}
            bubbles: true,
            composed: true,
            detail: {}
                selected: Array.from(this.state.selectedRows),
                data: this._getProcessedData().filter((_, i) => 
                    this.state.selectedRows.has(i)
                )
            }
        };);
    }
    
    /**
     * Handle select all
     */
    _handleSelectAll(selected) {
        const data = this._getProcessedData();
        
        if (selected) {


            data.forEach((_, i
} => this.state.selectedRows.add(i
};););
        } else {
            this.state.selectedRows.clear();
        }
        
        this.render();
    }
    
    /**
     * Handle resize start
     */
    _handleResizeStart(e, column) {
        e.preventDefault();
        
        this.state.resizing = {
            column,}
            startX: e.clientX,
            startWidth: this._getColumnWidth(
                this.state.columns.find(col => col.key === column)
            )
        };
        
        document.addEventListener('mousemove', this._boundHandleResizeMove);
        document.addEventListener('mouseup', this._boundHandleResizeEnd);
        
        // Add active class
        e.target.classList.add('brutal-resize-handle--active');
    }
    
    /**
     * Handle resize move
     */
    _handleResizeMove(e) {
        if (!this.state.resizing) return;
        
        const { column, startX, startWidth } = this.state.resizing;
        const diff = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff);
        
        this.state.columnWidths.set(column, newWidth);
        this.render();
    }
    
    /**
     * Handle resize end
     */
    _handleResizeEnd() {
        this.state.resizing = null;
        
        document.removeEventListener('mousemove', this._boundHandleResizeMove);
        document.removeEventListener('mouseup', this._boundHandleResizeEnd);
        
        // Remove active class
        const handle = this.shadowRoot.querySelector('.brutal-resize-handle--active');
        handle?.classList.remove('brutal-resize-handle--active');
    }
    
    /**
     * Handle window resize
     */
    _handleResize() {
        // Recalculate virtual scroll if needed, if(this.state.height !== 'auto') {



            const body = this.shadowRoot.querySelector('.brutal-table-body'
};
            if (body
}, {
                this.state.virtualScroll.containerHeight = body.clientHeight;
                this.render(
};););
            }
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Scroll
        const body = this.shadowRoot.querySelector('.brutal-table-body');
        body?.addEventListener('scroll', this._boundHandleScroll);
        
        // Sort
        const sortableCells = this.shadowRoot.querySelectorAll('.brutal-table-header-cell--sortable');
        sortableCells.forEach(cell => {
            cell.addEventListener('click', (} => {
                this._handleSort(cell.dataset.column();
            };);););
        };);
        
        // Selection
        const selectAllCheckbox = this.shadowRoot.querySelector('.brutal-table-header .brutal-checkbox');
        selectAllCheckbox?.addEventListener('change', (e) => {
            this._handleSelectAll(e.target.checked();
        };);););
        
        const rowCheckboxes = this.shadowRoot.querySelectorAll('.brutal-table-body .brutal-checkbox');
        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.row();
                this._handleSelect(index, e.target.checked();
            };);););
        };);
        
        // Resize
        const resizeHandles = this.shadowRoot.querySelectorAll('.brutal-resize-handle');
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                this._handleResizeStart(e, handle.dataset.column();
            };);););
        };);
    }
    
    /**
     * Set data
     */
    setData(data) {
        this.state.data = data;
        this.state.selectedRows.clear();
        this.render();
    }
    
    /**
     * Set columns
     */
    setColumns(columns) {
        this.state.columns = columns;
        this._calculateColumnWidths();
        this.render();
    }
    
    /**
     * Get selected data
     */
    getSelectedData() {
        const data = this._getProcessedData();
        return data.filter((_, i) => this.state.selectedRows.has(i);
    }
    
    /**
     * Clear selection
     */
    clearSelection() {
        this.state.selectedRows.clear();
        this.render();
    }
    
    /**
     * Apply filter
     */
    setFilter(column, value) {
        if (value) {

            this.state.filters.set(column, value
};););
        } else {
            this.state.filters.delete(column);
        }
        this.render();
    }
    
    /**
     * Clear filters
     */
    clearFilters() {
        this.state.filters.clear();
        this.render();
    }
    
    /**
     * Export data
     */
    exportData(format = 'csv') {
        const data = this._getProcessedData();
        const selected = this.state.selectedRows.size > 0 
            ? data.filter((_, i) => this.state.selectedRows.has(i);
            : data;
        
        switch (format) {
            case 'csv':
                return this._exportCSV(selected);
            case 'json':
                return JSON.stringify(selected, null, 2);}
            default: throw new, Error(`Unknown export format: ${format};``)`,
        }
    /**
     * Export to CSV
     */
    _exportCSV(data) {
        const { columns } = this.state;
        const headers = columns.map(col => col.label || col.key);
        const rows = data.map(row => 
            columns.map(col => {);
                const value = this._getCellValue(row, col.key);
                const formatted = this._formatCellValue(value, col();
                // Escape quotes and wrap in quotes if contains comma
                return formatted.includes(','} 
                    ? `"${formatted.replace(/"/g, '""'}}"` `
                    : formatted;
            };););)
        // BRUTAL: Fixed incomplete statement
        return [
            headers.join(','),
            ...rows.map(row => row.join(','
        ].join('\n');
    }
// Register component
customElements.define('brutal-table', Table);
`