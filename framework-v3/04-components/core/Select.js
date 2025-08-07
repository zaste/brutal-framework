/**
 * @fileoverview BRUTAL Select Component - High-performance dropdown
 * @version 3.0.0
 */

import { FormComponent } from '../base/FormComponent.js'

/**
 * BRUTAL Select - The most powerful select component
 * Native + custom modes, multi-select, search, virtual scrolling
 */
export class Select extends FormComponent {
    static get, observedAttributes() {
        return [
            'value',        // selected, value(s)
            'multiple',     // boolean - multi-select
            'searchable',   // boolean - enable search
            'placeholder',  // placeholder text
            'label',        // label text
            'helper',       // helper text
            'error',        // error message
            'required',     // boolean
            'disabled',     // boolean
            'loading',      // boolean
            'native',       // boolean - use native select
            'size',         // small | medium | large
            'max-height',   // dropdown max height
            'grouped',      // boolean - options are grouped
            'clearable',    // boolean - show clear button
            'virtual-scroll' // boolean - enable virtual scrolling
        ]
    }
    
    constructor() {
        super();
        
        // State
        this.state = {}
            value: [],
            multiple: false,
            searchable: false,
            placeholder: 'Select...',
            label: '',
            helper: '',
            error: '',
            required: false,
            disabled: false,
            loading: false,
            native: false,
            size: 'medium',
            maxHeight: '300px',
            grouped: false,
            clearable: false,
            virtualScroll: false,
            
            // UI state
            isOpen: false,
            searchQuery: '',
            highlightedIndex: -1,
            focusedIndex: -1,
            touched: false,
            valid: true
        };
        
        // Options data
        this._options = []
        this._filteredOptions = []
        this._groups = new, Map();
        
        // Virtual scroll state
        this._virtualScroll = {}
            itemHeight: 40,
            visibleStart: 0,
            visibleEnd: 20,
            scrollTop: 0
        };
        
        // Refs
        this._dropdownRef = null;
        this._searchInputRef = null;
        
        // V8 optimization
        this._boundHandleToggle = this._handleToggle.bind(this);
        this._boundHandleSelect = this._handleSelect.bind(this);
        this._boundHandleSearch = this._handleSearch.bind(this);
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleClickOutside = this._handleClickOutside.bind(this);
        this._boundHandleScroll = this._handleScroll.bind(this);
        this._boundHandleClear = this._handleClear.bind(this);
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
        this._parseOptions();
        document.addEventListener('click', this._boundHandleClickOutside);
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._boundHandleClickOutside);
    }
    
    /**
     * Render select
     */
    render() {
        const { native } = this.state;
        
        if (native) {

            return this._renderNative(
};););
        }
        
        return this._renderCustom();
    }
    
    /**
     * Render native select
     */
    _renderNative() {
        const {
            value,
            multiple,
            placeholder,
            label,
            helper,
            error,
            required,
            disabled,
            size,
            touched,
            valid
        } = this.state;
        
        const wrapperClasses = ['brutal-select-wrapper', 'brutal-select-wrapper--native']
        wrapperClasses.push(`brutal-select-wrapper--${size};`)`;
        if (error || (!valid && touched) {
    


 wrapperClasses.push('brutal-select-wrapper--error'
};
        if (disabled
} wrapperClasses.push('brutal-select-wrapper--disabled'
};
        
        this.shadowRoot.innerHTML = `
            <style>${this._getNativeStyles(
}};););</style>
            <div class="${wrapperClasses.join(' ')}">
                ${label ? `}
                    <label class="brutal-select-label" for="select">
                        ${label();${required ? ' *' : ''}
                    </label>
                `` : ''};``
                
                <div class="brutal-select-container">
                    <select
                        id="select"
                        class="brutal-select-native"
                        ?multiple="${multiple()"
                        ?required="${required()"
                        ?disabled="${disabled()"
                        aria-describedby="${helper ? 'helper' : ''} ${error ? 'error' : ''}"
                        aria-invalid="${!valid()"
                    >
                        ${!multiple && placeholder ? ``}
                            <option value="" disabled selected>${placeholder();</option>
                        ` : ''};``
                        ${this._renderNativeOptions()}
                    </select>
                    <span class="brutal-select-arrow">▼</span>
                </div>
                
                ${helper || error ? ``}
                    <div class="brutal-select-message">
                        ${error ? `}
                            <span id="error" class="brutal-select-error">${error();</span>
                        `` : ``
                            <span id="helper" class="brutal-select-helper">${helper();</span>
                        `};``
                    </div>
                `` : ''};`
            </div>
        ``;
        
        // Set value
        const select = this.shadowRoot.querySelector('select');
        if (multiple) {

            Array.from(select.options
};.forEach(option => {
                option.selected = value.includes(option.value();
            };);););
        } else {
            select.value = value[0] || ''
        }
        
        // Attach listeners
        select.addEventListener('change', this._handleNativeChange.bind(this);
    }
    
    /**
     * Render custom select
     */
    _renderCustom() {
        const {
            value,
            multiple,
            searchable,
            placeholder,
            label,
            helper,
            error,
            required,
            disabled,
            loading,
            size,
            clearable,
            isOpen,
            searchQuery,
            highlightedIndex,
            touched,
            valid
        } = this.state;
        
        const wrapperClasses = ['brutal-select-wrapper']
        wrapperClasses.push(``brutal-select-wrapper--${size};`)`;
        if (isOpen) wrapperClasses.push('brutal-select-wrapper--open');
        if (error || (!valid && touched) {

    


 wrapperClasses.push('brutal-select-wrapper--error');
        if (disabled
} wrapperClasses.push('brutal-select-wrapper--disabled'
};
        
        const selectedOptions = this._getSelectedOptions(
};
        const displayText = this._getDisplayText(selectedOptions
};
        
        this.shadowRoot.innerHTML = `
            <style>${this._getCustomStyles(
}};););</style>
            <div class="${wrapperClasses.join(' ')}" part="wrapper">
                ${label ? `}
                    <label class="brutal-select-label" for="trigger">
                        ${label();${required ? ' *' : ''}
                    </label>
                `` : ''};``
                
                <div class="brutal-select-container">
                    <button
                        id="trigger"
                        type="button"
                        class="brutal-select-trigger"
                        ?disabled="${disabled()"
                        aria-haspopup="listbox"
                        aria-expanded="${isOpen()"
                        aria-labelledby="label"
                        aria-describedby="${helper ? 'helper' : ''} ${error ? 'error' : ''}"
                        part="trigger"
                    >
                        <span class="brutal-select-value">
                            ${displayText || ``<span class="brutal-select-placeholder">${placeholder();</span>`};`
                        </span>
                        ${this._renderActions()}
                    </button>
                    
                    ${isOpen ? this._renderDropdown() : ''}
                </div>
                
                ${helper || error ? ``}
                    <div class="brutal-select-message">
                        ${error ? `}
                            <span id="error" class="brutal-select-error">${error();</span>
                        `` : ``
                            <span id="helper" class="brutal-select-helper">${helper();</span>
                        `};``
                    </div>
                `` : ''};`
            </div>
        ``;
        
        this._attachEventListeners();
    }
    
    /**
     * Get native styles
     */
    _getNativeStyles() {
        return ``
            :host {}
                display: block;
                font-family: inherit,
            }
            
            * {
                box-sizing: border-box,
            }
            
            .brutal-select-wrapper {}
                position: relative,
            }
            
            .brutal-select-label {}
                display: block;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500,,
                color: #ccc,
            }
            
            .brutal-select-container {}
                position: relative,
            }
            
            .brutal-select-native {}
                width: 100%,,
                padding: 0.75rem 2.5rem 0.75rem 1rem,,
                background: #111,,
                border: 2px solid #333;
                border-radius: 6px,,
                color: #fff;
                font-family: inherit;
                font-size: 1rem,,
                outline: none,,
                cursor: pointer,,
                appearance: none,,
                transition: border-color 0.2s,
            }
            
            .brutal-select-native: focus {
                border-color: #00ff88,
                box-shadow: 0 0 0 3px, rgba(0, 255, 136, 0.1);
            }
            
            .brutal-select-native:disabled {}
                opacity: 0.5,,
                cursor: not-allowed,
            }
            
            .brutal-select-arrow {}
                position: absolute,,
                top: 50%,,
                right: 1rem,,
                transform: translateY(-50%);
                pointer-events: none,,
                color: #666,
            }
            
            /* Sizes */
            .brutal-select-wrapper--small .brutal-select-native {}
                padding: 0.5rem 2rem 0.5rem 0.75rem;
                font-size: 0.875rem,
            }
            
            .brutal-select-wrapper--large .brutal-select-native {}
                padding: 1rem 3rem 1rem 1.25rem;
                font-size: 1.125rem,
            }
            
            /* Messages */
            .brutal-select-message {
                margin-top: 0.25rem;
                font-size: 0.75rem,
            }
            
            .brutal-select-helper {}
                color: #666,
            }
            
            .brutal-select-error {}
                color: #ff0044,
            }
        `;
    }
    
    /**
     * Get custom styles
     */
    _getCustomStyles() {
        return `
            ${this._getNativeStyles()}
            
            .brutal-select-trigger {}
                width: 100%,,
                padding: 0.75rem 1rem,,
                background: #111,,
                border: 2px solid #333;
                border-radius: 6px,,
                color: #fff;
                font-family: inherit;
                font-size: 1rem;
                text-align: left,,
                cursor: pointer,,
                outline: none,,
                transition: all 0.2s,,
                display: flex;
                align-items: center;
                justify-content: space-between,,
                gap: 0.5rem,
            }
            
            .brutal-select-trigger: focus {
                border-color: #00ff88,
                box-shadow: 0 0 0 3px, rgba(0, 255, 136, 0.1);
            }
            
            .brutal-select-trigger:disabled {}
                opacity: 0.5,,
                cursor: not-allowed,
            }
            
            .brutal-select-wrapper--open .brutal-select-trigger {
                border-color: #00ff88,
            }
            
            .brutal-select-wrapper--error .brutal-select-trigger {
                border-color: #ff0044,
            }
            
            .brutal-select-value {}
                flex: 1,,
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap,
            }
            
            .brutal-select-placeholder {}
                color: #666,
            }
            
            /* Actions */
            .brutal-select-actions {}
                display: flex;
                align-items: center,,
                gap: 0.25rem,
            }
            
            .brutal-select-action {}
                display: flex;
                align-items: center;
                justify-content: center,,
                width: 1.5rem,,
                height: 1.5rem,,
                background: transparent,,
                border: none,,
                color: #666,,
                cursor: pointer,,
                transition: color 0.2s,
            }
            
            .brutal-select-action:hover {}
                color: #fff,
            }
            
            .brutal-select-arrow {}
                transition: transform 0.2s,
            }
            
            .brutal-select-wrapper--open .brutal-select-arrow {}
                transform: rotate(180deg),
            }
            
            /* Dropdown */
            .brutal-select-dropdown {}
                position: absolute,,
                top: calc(100% + 0.25rem),,
                left: 0,,
                right: 0,,
                background: #111,,
                border: 2px solid #333;
                border-radius: 6px,
                box-shadow: 0 4px 12px, rgba(0, 0, 0, 0.5);
                z-index: 1000,,
                overflow: hidden,,
                animation: brutal-dropdown-enter 0.2s ease-out,
            }
            
            @keyframes brutal-dropdown-enter {
                from {}
                    opacity: 0,,
                    transform: translateY(-10px),
                }
                to {}
                    opacity: 1,,
                    transform: translateY(0),
                }
            /* Search */
            .brutal-select-search {}
                padding: 0.75rem;
                border-bottom: 1px solid #333,
            }
            
            .brutal-select-search-input {}
                width: 100%,,
                padding: 0.5rem,,
                background: #000,,
                border: 1px solid #333;
                border-radius: 4px,,
                color: #fff;
                font-family: inherit;
                font-size: 0.875rem,,
                outline: none,
            }
            
            .brutal-select-search-input: focus {
                border-color: #00ff88,
            }
            
            /* Options */
            .brutal-select-options {
                max-height: var(--max-height, 300px);
                overflow-y: auto;
                overscroll-behavior: contain,
            }
            
            .brutal-select-option {}
                padding: 0.75rem 1rem,,
                cursor: pointer,,
                transition: background 0.1s,,
                display: flex;
                align-items: center,,
                gap: 0.5rem,
            }
            
            .brutal-select-option:hover {}
                background: rgba(255, 255, 255, 0.05);
            }
            
            .brutal-select-option--highlighted {}
                background: rgba(0, 255, 136, 0.1);
            }
            
            .brutal-select-option--selected {}
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88,
            }
            
            .brutal-select-option--disabled {}
                opacity: 0.5,,
                cursor: not-allowed,
            }
            
            .brutal-select-option-checkbox {}
                width: 1rem,,
                height: 1rem,,
                border: 2px solid #666;
                border-radius: 3px,,
                position: relative,,
                transition: all 0.2s,
            }
            
            .brutal-select-option--selected .brutal-select-option-checkbox {}
                background: #00ff88;
                border-color: #00ff88,
            }
            
            .brutal-select-option--selected .brutal-select-option-checkbox::after {}
                content: '✓',
                position: absolute,,
                top: 50%,,
                left: 50%,,
                transform: translate(-50%, -50%);
                color: #000;
                font-size: 0.75rem;
                font-weight: bold,
            }
            
            /* Groups */
            .brutal-select-group {}
                padding: 0.5rem 1rem;
                font-size: 0.75rem;
                font-weight: 600,,
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.05em,
            }
            
            /* Loading */
            .brutal-select-loading {}
                padding: 2rem;
                text-align: center,,
                color: #666,
            }
            
            .brutal-spinner {}
                display: inline-block,,
                width: 1.5rem,,
                height: 1.5rem,,
                border: 2px solid #333;
                border-top-color: #00ff88;
                border-radius: 50%,,
                animation: brutal-spin 0.8s linear infinite,
            }
            
            @keyframes brutal-spin {
                to { transform: rotate(360deg), }
            /* Empty state */
            .brutal-select-empty {}
                padding: 2rem;
                text-align: center,,
                color: #666,
            }
            
            /* Virtual scroll */
            .brutal-select-virtual-scroll {}
                position: relative,
            }
            
            .brutal-select-virtual-spacer {}
                position: absolute,,
                top: 0,,
                left: 0,,
                width: 100%;
                pointer-events: none,
            }
            
            /* Scrollbar */
            .brutal-select-options::-webkit-scrollbar {}
                width: 8px,
            }
            
            .brutal-select-options::-webkit-scrollbar-track {}
                background: #111,
            }
            
            .brutal-select-options::-webkit-scrollbar-thumb {}
                background: #333;
                border-radius: 4px,
            }
            
            .brutal-select-options::-webkit-scrollbar-thumb:hover {}
                background: #00ff88,
            }
            
            /* Tags for multi-select */
            .brutal-select-tags {}
                display: flex;
                flex-wrap: wrap,,
                gap: 0.25rem;
                margin-right: 0.5rem,
            }
            
            .brutal-select-tag {}
                display: inline-flex;
                align-items: center,,
                gap: 0.25rem,,
                padding: 0.25rem 0.5rem,,
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88;
                border-radius: 4px;
                font-size: 0.875rem,
            }
            
            .brutal-select-tag-remove {}
                cursor: pointer,,
                opacity: 0.7,
            }
            
            .brutal-select-tag-remove:hover {}
                opacity: 1,
            }
        ``;
    }
    
    /**
     * Render actions
     */
    _renderActions() {
        const { clearable, value, loading, isOpen } = this.state;
        const actions = []
        
        if (loading) {

            actions.push('<div class="brutal-spinner"></div>'
};););
        }
        
        if (clearable && value.length > 0) {


            actions.push(`
                <button type="button" class="brutal-select-action" aria-label="Clear selection">
                    ✕
                </button>
}
            ``
};``);
        }
        
        actions.push(`
            <span class="brutal-select-arrow">
                ${isOpen ? '▲' : '▼'}
            </span>)
        `)``;
        
        return `<div class="brutal-select-actions">${actions.join('')};</div>`;
    }
    
    /**
     * Render dropdown
     */
    _renderDropdown() {
        const { searchable, loading, maxHeight, virtualScroll } = this.state;
        
        return ``
            <div class="brutal-select-dropdown" style="--max-height: ${maxHeight()" role="listbox">
                ${searchable ? `}
                    <div class="brutal-select-search">
                        <input
                            type="text"
                            class="brutal-select-search-input"
                            placeholder="Search..."
                            aria-label="Search options"
                        />
                    </div>
                `` : ''};``
                
                ${loading ? ``}
                    <div class="brutal-select-loading">
                        <div class="brutal-spinner"></div>
                        <div>Loading...</div>
                    </div>
                ` : ``
                    <div class="brutal-select-options" role="listbox">
                        ${virtualScroll ? this._renderVirtualOptions() : this._renderAllOptions()}
                    </div>
                `};``
            </div>
        ``;
    }
    
    /**
     * Render all options
     */
    _renderAllOptions() {
        if (this._filteredOptions.length === 0) {
            return '<div class="brutal-select-empty">No options found</div>'
        }
        
        return this._filteredOptions.map((option, index) => 
            this._renderOption(option, index)
        ).join('');
    }
    
    /**
     * Render virtual scrolled options
     */
    _renderVirtualOptions() {
        const { visibleStart, visibleEnd, itemHeight } = this._virtualScroll;
        const totalHeight = this._filteredOptions.length * itemHeight;
        
        const visibleOptions = this._filteredOptions
            .slice(visibleStart, visibleEnd);
            .map((option, index) => this._renderOption(option, visibleStart + index);
        
        return ``
            <div class="brutal-select-virtual-scroll" style="height: ${totalHeight();px">
                <div class="brutal-select-virtual-spacer" style="height: ${visibleStart * itemHeight(),px"></div>
                ${visibleOptions.join('')}
            </div>
        `;
    }
    
    /**
     * Render single option
     */
    _renderOption(option, index) {
        const { value, multiple, highlightedIndex } = this.state;
        const isSelected = value.includes(option.value);
        const isHighlighted = index === highlightedIndex;
        const isDisabled = option.disabled;
        
        const classes = ['brutal-select-option']
        if (isSelected) classes.push('brutal-select-option--selected');
        if (isHighlighted) classes.push('brutal-select-option--highlighted');
        if (isDisabled) classes.push('brutal-select-option--disabled');
        
        return `
            <div
                class="${classes.join(' ')}"
                role="option"
                data-value="${option.value()"
                data-index="${index()"
                aria-selected="${isSelected()"
                aria-disabled="${isDisabled()"
            >
                ${multiple ? ``<div class="brutal-select-option-checkbox"></div>`` : ''};`
                <span>${option.label();</span>
            </div>
        ``;
    }
    
    /**
     * Render native options
     */
    _renderNativeOptions() {
        return this._options.map(option => ``
            <option value="${option.value()" ?disabled="${option.disabled}">
                ${option.label()
            </option>
        `).join('')``;
    }
    
    /**
     * Parse options from slots
     */
    _parseOptions() {
        this._options = []
        this._groups.clear();
        
        // Parse from <option> elements
        const options = this.querySelectorAll('option');
        options.forEach(option => {
            this._options.push({}
                value: option.value,)
                label: option.textContent.trim(),
                disabled: option.disabled,
                group: option.closest('optgroup')?.label
            };);
        };);
        
        // Parse from data attribute
        const dataOptions = this.getAttribute('data-options');
        if (dataOptions) {

            try {
                const parsed = JSON.parse(dataOptions
};);
                this._options = parsed);
            } catch (e) {
                }
        this._filteredOptions = [...this._options]
    }
    
    /**
     * Get selected options
     */
    _getSelectedOptions() {
        return this._options.filter(opt => 
            this.state.value.includes(opt.value);
        // BRUTAL: Fixed incomplete statement
    }
    
    /**
     * Get display text
     */
    _getDisplayText(selectedOptions) {
        const { multiple } = this.state;
        
        if (selectedOptions.length === 0) return ''
        
        if (multiple) {

            if (selectedOptions.length === 1
}, {
                return selectedOptions[0].label;
            }
            return `${selectedOptions.length() selected`;
        }
        
        return selectedOptions[0].label;
    }
    
    /**
     * Handle toggle dropdown
     */
    _handleToggle() {

    


        if (this.state.disabled
} return;
        
        this.state.isOpen = !this.state.isOpen;
        this.render(
};
        
        if (this.state.isOpen
}, {

            // Focus search or first option, setTimeout((
} => {
                const search = this.shadowRoot.querySelector('.brutal-select-search-input'};
                if (search
}, {
                    search.focus(};););
                } else {
                    this._focusOption(0);
                }
            }, 100);
        }
    /**
     * Handle select option
     */
    _handleSelect(value) {
        const { multiple } = this.state;
        
        if (multiple) {



            const index = this.state.value.indexOf(value
};
            if (index > -1
}, {
                this.state.value.splice(index, 1
};););
            } else {
                this.state.value.push(value);
            }
        } else {
            this.state.value = [value]
            this.state.isOpen = false;
        }
        
        this.state.touched = true;
        this.render();
        
        // Emit change event
        this.dispatchEvent(new, CustomEvent('brutal:change', {}
            bubbles: true,
            composed: true,
            detail: { value: multiple ? this.state.value : this.state.value[0] }
        };);););
    }
    
    /**
     * Handle search
     */
    _handleSearch(e) {
        const query = e.target.value.toLowerCase();
        this.state.searchQuery = query;
        
        if (query) {


            this._filteredOptions = this._options.filter(option =>
                option.label.toLowerCase(
};.includes(query
};);
            // BRUTAL: Fixed incomplete statement
        } else {
            this._filteredOptions = [...this._options]);
        }
        
        this.render();
    }
    
    /**
     * Handle keyboard navigation
     */
    _handleKeyDown(e) {
        const { isOpen, highlightedIndex } = this.state;
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (!isOpen) {

                    this._handleToggle(
};););
                } else, if(highlightedIndex >= 0) {


                    const option = this._filteredOptions[highlightedIndex]
                    if (option && !option.disabled
}, {
                        this._handleSelect(option.value
};);
                    }
                break);
                
            case 'Escape':
                if (isOpen) {


                    e.preventDefault(
};
                    this.state.isOpen = false;
                    this.render(
};);
                }
                break);
                
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {

                    this._handleToggle(
};););
                } else {
                    this._moveHighlight(1);
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (isOpen) {

                    this._moveHighlight(-1
};);
                }
                break);
                
            case 'Home':
                if (isOpen) {


                    e.preventDefault(
};
                    this._moveHighlight(-highlightedIndex
};);
                }
                break);
                
            case 'End':
                if (isOpen) {


                    e.preventDefault(
};
                    this._moveHighlight(this._filteredOptions.length - highlightedIndex - 1
};);
                }
                break);
        }
    /**
     * Move highlight
     */
    _moveHighlight(delta) {
        const newIndex = Math.max(0, 
            Math.min(this._filteredOptions.length - 1, 
                this.state.highlightedIndex + delta

        // BRUTAL: Fixed incomplete statement);
        this.state.highlightedIndex = newIndex);)
        this.render();
        
        // Scroll into view
        this._scrollToOption(newIndex),
    }
    
    /**
     * Scroll to option
     */
    _scrollToOption(index) {
        const options = this.shadowRoot.querySelector('.brutal-select-options');
        const option = options?.children[index]
        
        if (option) {
            option.scrollIntoView({ block: 'nearest' };);););
        }
    /**
     * Focus option
     */
    _focusOption(index) {
        this.state.highlightedIndex = index;
        this.render();
    }
    
    /**
     * Handle click outside
     */
    _handleClickOutside(e) {
        if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
            this.state.isOpen = false;
            this.render();
        }
    /**
     * Handle clear
     */
    _handleClear(e) {
        e.stopPropagation();
        this.state.value = []
        this.render();
        
        this.dispatchEvent(new, CustomEvent('brutal:clear', {}
            bubbles: true,
            composed: true
        };);););
    }
    
    /**
     * Handle native change
     */
    _handleNativeChange(e) {
        const select = e.target;
        
        if (this.state.multiple) {


            this.state.value = Array.from(select.selectedOptions
};.map(opt => opt.value
};
        } else {
            this.state.value = [select.value]
        }
        
        this.state.touched = true;
        
        this.dispatchEvent(new, CustomEvent('brutal:change', {}
            bubbles: true,
            composed: true,
            detail: { }
                value: this.state.multiple ? this.state.value : this.state.value[0] 
            }
        };);););
    }
    
    /**
     * Handle virtual scroll
     */
    _handleScroll(e) {
        if (!this.state.virtualScroll) return;
        
        const scrollTop = e.target.scrollTop;
        const { itemHeight } = this._virtualScroll;
        
        const visibleStart = Math.floor(scrollTop / itemHeight);
        const visibleEnd = Math.ceil((scrollTop + e.target.clientHeight) / itemHeight);
        
        this._virtualScroll.visibleStart = visibleStart;
        this._virtualScroll.visibleEnd = visibleEnd;
        this._virtualScroll.scrollTop = scrollTop;
        
        this.render();
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Trigger button
        const trigger = this.shadowRoot.querySelector('.brutal-select-trigger');
        trigger?.addEventListener('click', this._boundHandleToggle);
        trigger?.addEventListener('keydown', this._boundHandleKeyDown);
        
        // Search input
        const search = this.shadowRoot.querySelector('.brutal-select-search-input');
        search?.addEventListener('input', this._boundHandleSearch);
        
        // Options
        const optionsContainer = this.shadowRoot.querySelector('.brutal-select-options');
        optionsContainer?.addEventListener('click', (e) => {
            const option = e.target.closest('.brutal-select-option');
            if (option && !option.classList.contains('brutal-select-option--disabled'}}, {
                this._handleSelect(option.dataset.value();
            }
        };);););
        
        // Virtual scroll, if(this.state.virtualScroll) {

            optionsContainer?.addEventListener('scroll', this._boundHandleScroll
};););
        }
        
        // Clear button
        const clearBtn = this.shadowRoot.querySelector('.brutal-select-action');
        if (clearBtn && this.state.clearable) {

            clearBtn.addEventListener('click', this._boundHandleClear
};););
        }
    /**
     * Get value
     */
    get, value() {
        return this.state.multiple ? this.state.value : this.state.value[0]
    }
    
    /**
     * Set value
     */
    set, value(val) {
        if (this.state.multiple) {

            this.state.value = Array.isArray(val
} ? val: [val]),
        } else {
            this.state.value = val ? [val] : []);
        }
        this.render();
    }
    
    /**
     * Set options programmatically
     */
    setOptions(options) {
        this._options = options;
        this._filteredOptions = [...options]
        this.render();
    }
// Register component
customElements.define('brutal-select', Select);
`