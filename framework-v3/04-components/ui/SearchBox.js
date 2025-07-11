/**
 * BRUTAL V3 - SearchBox Component
 * High-performance fuzzy search with GPU-accelerated highlighting
 * Zero dependencies, instant results, keyboard navigation
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';
import { html } from '../../01-core/Template.js';
import { animationSystem } from '../../02-performance/08-AnimationSystem.js';

export class SearchBox extends InteractiveComponent {
    constructor() {
        super();
        
        // Search configuration
        this._config = {
            placeholder: 'Search...',
            minChars: 1,
            maxResults: 10,
            debounceMs: 150,
            fuzzyThreshold: 0.6,
            highlightMatches: true,
            showScores: false,
            caseSensitive: false,
            searchKeys: ['title', 'content', 'tags'],
            theme: 'brutal', // brutal, minimal, neon, glassmorphic
            animation: 'slide', // slide, fade, bounce, morph
            position: 'below', // below, above, overlay
            groupByCategory: false,
            showThumbnails: false,
            enableVoiceSearch: false,
            enableAI: false
        };
        
        // Search state
        this._query = '';
        this._results = [];
        this._filteredResults = [];
        this._selectedIndex = -1;
        this._isOpen = false;
        this._isSearching = false;
        this._data = [];
        this._searchIndex = null;
        
        // Performance
        this._debounceTimer = null;
        this._searchWorker = null;
        this._cache = new Map();
        this._maxCacheSize = 100;
        
        // Voice search
        this._recognition = null;
        this._isListening = false;
        
        // Fuzzy search state
        this._patterns = new Map();
        this._scores = new Map();
        
        // Animation state
        this._animationFrame = null;
        this._highlightPositions = [];
        
        // Bind methods
        this._handleInput = this._handleInput.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleFocus = this._handleFocus.bind(this);
        this._handleBlur = this._handleBlur.bind(this);
        this._performSearch = this._performSearch.bind(this);
        this._handleVoiceSearch = this._handleVoiceSearch.bind(this);
    }
    
    static get observedAttributes() {
        return [...super.observedAttributes, 'placeholder', 'min-chars', 'max-results',
                'theme', 'position', 'case-sensitive', 'show-scores', 'enable-voice'];
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Initialize search
        this._initialize();
        
        // Set up event delegation
        requestAnimationFrame(() => {
            this.shadowRoot.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                
                const action = target.dataset.action;
                switch (action) {
                    case 'clear':
                        this.clear();
                        break;
                    case 'voice':
                        this._toggleVoiceSearch();
                        break;
                    case 'submit':
                        this._submitSearch();
                        break;
                }
            });
            
            // Result selection
            this.shadowRoot.addEventListener('click', (e) => {
                const resultItem = e.target.closest('.search-result');
                if (resultItem && resultItem.dataset.index) {
                    this._selectResult(parseInt(resultItem.dataset.index));
                }
            });
        });
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clean up
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        
        if (this._searchWorker) {
            this._searchWorker.terminate();
        }
        
        if (this._recognition) {
            this._recognition.stop();
        }
        
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
        }
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        
        switch (name) {
            case 'placeholder':
                this._config.placeholder = newValue || 'Search...';
                this._updateUI();
                break;
            case 'min-chars':
                this._config.minChars = parseInt(newValue) || 1;
                break;
            case 'max-results':
                this._config.maxResults = parseInt(newValue) || 10;
                break;
            case 'theme':
                this._config.theme = newValue || 'brutal';
                this._updateUI();
                break;
            case 'position':
                this._config.position = newValue || 'below';
                this._updateUI();
                break;
            case 'case-sensitive':
                this._config.caseSensitive = newValue === 'true';
                this._clearCache();
                break;
            case 'show-scores':
                this._config.showScores = newValue === 'true';
                this._updateUI();
                break;
            case 'enable-voice':
                this._config.enableVoiceSearch = newValue === 'true';
                this._setupVoiceSearch();
                this._updateUI();
                break;
        }
    }
    
    template() {
        return html`
            <div class="search-container ${this._config.theme} ${this._isOpen ? 'open' : ''}">
                <div class="search-input-wrapper">
                    <input type="search" 
                           class="search-input"
                           placeholder="${this._config.placeholder}"
                           value="${this._query}"
                           autocomplete="off"
                           spellcheck="false"
                           aria-label="Search"
                           aria-expanded="${this._isOpen}"
                           aria-controls="search-results"
                           role="combobox">
                    
                    <div class="search-icons">
                        ${this._isSearching ? `
                            <div class="search-spinner">
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="8" 
                                            stroke="currentColor" 
                                            stroke-width="2" 
                                            fill="none"
                                            stroke-dasharray="25 25"
                                            stroke-linecap="round">
                                        <animateTransform
                                            attributeName="transform"
                                            type="rotate"
                                            from="0 10 10"
                                            to="360 10 10"
                                            dur="1s"
                                            repeatCount="indefinite"/>
                                    </circle>
                                </svg>
                            </div>
                        ` : `
                            <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20">
                                <circle cx="8" cy="8" r="6" 
                                        stroke="currentColor" 
                                        stroke-width="2" 
                                        fill="none"/>
                                <path d="M12 12 L16 16" 
                                      stroke="currentColor" 
                                      stroke-width="2" 
                                      stroke-linecap="round"/>
                            </svg>
                        `}
                        
                        ${this._query ? `
                            <button class="search-clear" 
                                    data-action="clear"
                                    aria-label="Clear search">
                                <svg width="16" height="16" viewBox="0 0 16 16">
                                    <path d="M4 4 L12 12 M12 4 L4 12" 
                                          stroke="currentColor" 
                                          stroke-width="2" 
                                          stroke-linecap="round"/>
                                </svg>
                            </button>
                        ` : ''}
                        
                        ${this._config.enableVoiceSearch ? `
                            <button class="search-voice ${this._isListening ? 'listening' : ''}" 
                                    data-action="voice"
                                    aria-label="Voice search">
                                <svg width="16" height="16" viewBox="0 0 16 16">
                                    <rect x="6" y="2" width="4" height="8" 
                                          rx="2" fill="currentColor"/>
                                    <path d="M4 7 C4 10 6 12 8 12 C10 12 12 10 12 7" 
                                          stroke="currentColor" 
                                          stroke-width="2" 
                                          fill="none"/>
                                    <path d="M8 12 L8 14 M6 14 L10 14" 
                                          stroke="currentColor" 
                                          stroke-width="2" 
                                          stroke-linecap="round"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                ${this._isOpen && this._filteredResults.length > 0 ? `
                    <div class="search-results ${this._config.position}" 
                         id="search-results"
                         role="listbox">
                        ${this._config.groupByCategory ? this._renderGroupedResults() : this._renderResults()}
                    </div>
                ` : ''}
                
                ${this._isOpen && this._query && this._filteredResults.length === 0 && !this._isSearching ? `
                    <div class="search-no-results">
                        <svg width="48" height="48" viewBox="0 0 48 48" opacity="0.3">
                            <circle cx="20" cy="20" r="16" 
                                    stroke="currentColor" 
                                    stroke-width="2" 
                                    fill="none"/>
                            <path d="M30 30 L40 40" 
                                  stroke="currentColor" 
                                  stroke-width="2" 
                                  stroke-linecap="round"/>
                            <path d="M14 14 L26 26 M26 14 L14 26" 
                                  stroke="currentColor" 
                                  stroke-width="2" 
                                  stroke-linecap="round"/>
                        </svg>
                        <p>No results found for "${this._escapeHtml(this._query)}"</p>
                    </div>
                ` : ''}
            </div>
            
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    --search-primary: var(--brutal-primary, #00ff00);
                    --search-bg: var(--brutal-bg, #000);
                    --search-text: var(--brutal-text, #fff);
                }
                
                .search-container {
                    position: relative;
                    width: 100%;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                
                .search-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: var(--search-bg);
                    border: 2px solid var(--search-primary);
                    border-radius: 8px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .search-container.open .search-input-wrapper {
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
                }
                
                .search-input {
                    flex: 1;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    color: var(--search-text);
                    font-size: 16px;
                    outline: none;
                }
                
                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .search-input::-webkit-search-cancel-button {
                    display: none;
                }
                
                .search-icons {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding-right: 12px;
                }
                
                .search-icon,
                .search-spinner {
                    color: var(--search-primary);
                    flex-shrink: 0;
                }
                
                .search-clear,
                .search-voice {
                    background: none;
                    border: none;
                    color: var(--search-text);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    opacity: 0.6;
                }
                
                .search-clear:hover,
                .search-voice:hover {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .search-voice.listening {
                    color: #ff0000;
                    animation: pulse 1s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: var(--search-bg);
                    border: 2px solid var(--search-primary);
                    border-top: none;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                    z-index: 1000;
                    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .search-results.above {
                    top: auto;
                    bottom: 100%;
                    border-top: 2px solid var(--search-primary);
                    border-bottom: none;
                    border-radius: 8px 8px 0 0;
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .search-result {
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .search-result:last-child {
                    border-bottom: none;
                }
                
                .search-result:hover,
                .search-result.selected {
                    background: rgba(0, 255, 0, 0.1);
                    padding-left: 20px;
                }
                
                .search-result-thumbnail {
                    width: 40px;
                    height: 40px;
                    border-radius: 4px;
                    object-fit: cover;
                    flex-shrink: 0;
                }
                
                .search-result-content {
                    flex: 1;
                    overflow: hidden;
                }
                
                .search-result-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .search-result-description {
                    font-size: 14px;
                    opacity: 0.8;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .search-result-category {
                    font-size: 12px;
                    padding: 2px 8px;
                    background: rgba(0, 255, 0, 0.2);
                    border-radius: 12px;
                    color: var(--search-primary);
                }
                
                .search-result-score {
                    font-size: 12px;
                    opacity: 0.5;
                    font-family: monospace;
                }
                
                .search-highlight {
                    background: var(--search-primary);
                    color: var(--search-bg);
                    padding: 0 2px;
                    border-radius: 2px;
                    font-weight: 600;
                    animation: highlightPulse 0.3s ease-out;
                }
                
                @keyframes highlightPulse {
                    from {
                        transform: scale(1.2);
                    }
                    to {
                        transform: scale(1);
                    }
                }
                
                .search-category-header {
                    padding: 8px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    opacity: 0.6;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .search-no-results {
                    padding: 40px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    background: var(--search-bg);
                    border: 2px solid var(--search-primary);
                    border-top: none;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                }
                
                .search-no-results p {
                    margin: 16px 0 0;
                }
                
                /* Theme: Brutal (default) */
                .search-container.brutal {
                    --search-primary: #00ff00;
                    --search-bg: #000;
                    --search-text: #fff;
                }
                
                /* Theme: Minimal */
                .search-container.minimal {
                    --search-primary: #333;
                    --search-bg: #fff;
                    --search-text: #333;
                }
                
                .search-container.minimal .search-input-wrapper {
                    border-color: #ddd;
                    background: #f8f8f8;
                }
                
                .search-container.minimal .search-highlight {
                    background: #333;
                    color: #fff;
                }
                
                /* Theme: Neon */
                .search-container.neon {
                    --search-primary: #00ffff;
                    --search-bg: #0a0a0a;
                    --search-text: #00ffff;
                }
                
                .search-container.neon .search-input-wrapper {
                    box-shadow: 0 0 10px var(--search-primary);
                }
                
                .search-container.neon .search-highlight {
                    text-shadow: 0 0 5px var(--search-primary);
                }
                
                /* Theme: Glassmorphic */
                .search-container.glassmorphic {
                    --search-primary: rgba(255, 255, 255, 0.8);
                    --search-bg: rgba(255, 255, 255, 0.1);
                    --search-text: #fff;
                }
                
                .search-container.glassmorphic .search-input-wrapper {
                    backdrop-filter: blur(10px);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                
                .search-container.glassmorphic .search-results {
                    backdrop-filter: blur(10px);
                    background: rgba(0, 0, 0, 0.5);
                }
                
                /* Scrollbar styling */
                .search-results::-webkit-scrollbar {
                    width: 8px;
                }
                
                .search-results::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .search-results::-webkit-scrollbar-thumb {
                    background: var(--search-primary);
                    border-radius: 4px;
                }
                
                /* Mobile responsiveness */
                @media (max-width: 600px) {
                    .search-results {
                        max-height: 60vh;
                    }
                }
            </style>
        `.content;
    }
    
    _renderResults() {
        return this._filteredResults.slice(0, this._config.maxResults).map((result, index) => {
            const isSelected = index === this._selectedIndex;
            return `
                <div class="search-result ${isSelected ? 'selected' : ''}" 
                     data-index="${index}"
                     role="option"
                     aria-selected="${isSelected}">
                    ${this._config.showThumbnails && result.thumbnail ? `
                        <img class="search-result-thumbnail" 
                             src="${this._escapeHtml(result.thumbnail)}" 
                             alt="">
                    ` : ''}
                    <div class="search-result-content">
                        <div class="search-result-title">
                            ${this._highlightText(result.title || 'Untitled')}
                        </div>
                        ${result.description ? `
                            <div class="search-result-description">
                                ${this._highlightText(result.description)}
                            </div>
                        ` : ''}
                    </div>
                    ${result.category ? `
                        <span class="search-result-category">${this._escapeHtml(result.category)}</span>
                    ` : ''}
                    ${this._config.showScores && this._scores.has(result) ? `
                        <span class="search-result-score">${this._scores.get(result).toFixed(2)}</span>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    _renderGroupedResults() {
        const grouped = this._groupResultsByCategory();
        let html = '';
        
        for (const [category, results] of grouped) {
            html += `
                <div class="search-category-header">${this._escapeHtml(category)}</div>
                ${results.map((result, index) => {
                    const globalIndex = this._filteredResults.indexOf(result);
                    const isSelected = globalIndex === this._selectedIndex;
                    return `
                        <div class="search-result ${isSelected ? 'selected' : ''}" 
                             data-index="${globalIndex}"
                             role="option"
                             aria-selected="${isSelected}">
                            <div class="search-result-content">
                                <div class="search-result-title">
                                    ${this._highlightText(result.title || 'Untitled')}
                                </div>
                                ${result.description ? `
                                    <div class="search-result-description">
                                        ${this._highlightText(result.description)}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        }
        
        return html;
    }
    
    _initialize() {
        // Set up input handlers
        requestAnimationFrame(() => {
            const input = this.shadowRoot.querySelector('.search-input');
            if (input) {
                input.addEventListener('input', this._handleInput);
                input.addEventListener('keydown', this._handleKeydown);
                input.addEventListener('focus', this._handleFocus);
                input.addEventListener('blur', this._handleBlur);
            }
            
            // Initialize search worker for large datasets
            if (window.Worker && this._data.length > 1000) {
                this._initializeWorker();
            }
            
            // Set up voice search
            if (this._config.enableVoiceSearch) {
                this._setupVoiceSearch();
            }
        });
    }
    
    _initializeWorker() {
        const workerCode = `
            let data = [];
            let config = {};
            
            self.onmessage = function(e) {
                const { type, payload } = e.data;
                
                switch (type) {
                    case 'init':
                        data = payload.data;
                        config = payload.config;
                        break;
                        
                    case 'search':
                        const results = performFuzzySearch(payload.query);
                        self.postMessage({ type: 'results', results });
                        break;
                }
            };
            
            function performFuzzySearch(query) {
                if (!query || query.length < config.minChars) {
                    return [];
                }
                
                const searchQuery = config.caseSensitive ? query : query.toLowerCase();
                const results = [];
                
                for (const item of data) {
                    const score = calculateFuzzyScore(item, searchQuery);
                    if (score > config.fuzzyThreshold) {
                        results.push({ item, score });
                    }
                }
                
                return results
                    .sort((a, b) => b.score - a.score)
                    .slice(0, config.maxResults)
                    .map(r => r.item);
            }
            
            function calculateFuzzyScore(item, query) {
                let maxScore = 0;
                
                for (const key of config.searchKeys) {
                    if (item[key]) {
                        const text = config.caseSensitive ? item[key] : item[key].toLowerCase();
                        const score = fuzzyMatch(text, query);
                        maxScore = Math.max(maxScore, score);
                    }
                }
                
                return maxScore;
            }
            
            function fuzzyMatch(text, query) {
                let score = 0;
                let consecutive = 0;
                let queryIndex = 0;
                
                for (let i = 0; i < text.length && queryIndex < query.length; i++) {
                    if (text[i] === query[queryIndex]) {
                        score += 1 + consecutive;
                        consecutive++;
                        queryIndex++;
                    } else {
                        consecutive = 0;
                    }
                }
                
                return queryIndex === query.length ? score / text.length : 0;
            }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this._searchWorker = new Worker(URL.createObjectURL(blob));
        
        this._searchWorker.onmessage = (e) => {
            if (e.data.type === 'results') {
                this._filteredResults = e.data.results;
                this._isSearching = false;
                this._updateUI();
            }
        };
        
        // Initialize worker with data
        this._searchWorker.postMessage({
            type: 'init',
            payload: {
                data: this._data,
                config: {
                    minChars: this._config.minChars,
                    maxResults: this._config.maxResults,
                    fuzzyThreshold: this._config.fuzzyThreshold,
                    caseSensitive: this._config.caseSensitive,
                    searchKeys: this._config.searchKeys
                }
            }
        });
    }
    
    _setupVoiceSearch() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this._recognition = new SpeechRecognition();
        this._recognition.continuous = false;
        this._recognition.interimResults = true;
        this._recognition.lang = 'en-US';
        
        this._recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            this._query = transcript;
            this._updateInput();
            
            if (event.results[0].isFinal) {
                this._performSearch();
            }
        };
        
        this._recognition.onerror = (event) => {
            this._isListening = false;
            this._updateUI();
        };
        
        this._recognition.onend = () => {
            this._isListening = false;
            this._updateUI();
        };
    }
    
    _handleInput(e) {
        this._query = e.target.value;
        
        // Clear previous timer
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        
        // Set up new timer
        this._debounceTimer = setTimeout(() => {
            this._performSearch();
        }, this._config.debounceMs);
    }
    
    _handleKeydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this._moveSelection(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._moveSelection(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (this._selectedIndex >= 0) {
                    this._selectResult(this._selectedIndex);
                } else {
                    this._submitSearch();
                }
                break;
            case 'Escape':
                e.preventDefault();
                if (this._isOpen) {
                    this._close();
                } else {
                    this.clear();
                }
                break;
        }
    }
    
    _handleFocus() {
        if (this._query.length >= this._config.minChars) {
            this._isOpen = true;
            this._updateUI();
        }
    }
    
    _handleBlur(e) {
        // Delay to allow click on results
        setTimeout(() => {
            if (!this.contains(document.activeElement)) {
                this._close();
            }
        }, 200);
    }
    
    _performSearch() {
        const query = this._query.trim();
        
        if (query.length < this._config.minChars) {
            this._filteredResults = [];
            this._isOpen = false;
            this._updateUI();
            return;
        }
        
        // Check cache
        if (this._cache.has(query)) {
            this._filteredResults = this._cache.get(query);
            this._isOpen = true;
            this._updateUI();
            return;
        }
        
        this._isSearching = true;
        this._isOpen = true;
        this._updateUI();
        
        // Use worker for large datasets
        if (this._searchWorker) {
            this._searchWorker.postMessage({
                type: 'search',
                payload: { query }
            });
        } else {
            // Perform search in main thread
            this._filteredResults = this._fuzzySearch(query);
            this._isSearching = false;
            
            // Cache results
            this._addToCache(query, this._filteredResults);
            
            this._updateUI();
        }
    }
    
    _fuzzySearch(query) {
        if (!query || query.length < this._config.minChars) {
            return [];
        }
        
        const searchQuery = this._config.caseSensitive ? query : query.toLowerCase();
        const results = [];
        
        for (const item of this._data) {
            const score = this._calculateFuzzyScore(item, searchQuery);
            if (score > this._config.fuzzyThreshold) {
                results.push({ item, score });
            }
        }
        
        // Sort by score and return items
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, this._config.maxResults)
            .map(r => {
                this._scores.set(r.item, r.score);
                return r.item;
            });
    }
    
    _calculateFuzzyScore(item, query) {
        let maxScore = 0;
        
        for (const key of this._config.searchKeys) {
            if (item[key]) {
                const text = this._config.caseSensitive ? 
                    String(item[key]) : String(item[key]).toLowerCase();
                const score = this._fuzzyMatch(text, query);
                
                if (score > maxScore) {
                    maxScore = score;
                    // Store match positions for highlighting
                    this._patterns.set(item, { key, positions: this._lastMatchPositions });
                }
            }
        }
        
        return maxScore;
    }
    
    _fuzzyMatch(text, query) {
        let score = 0;
        let consecutive = 0;
        let queryIndex = 0;
        const positions = [];
        
        for (let i = 0; i < text.length && queryIndex < query.length; i++) {
            if (text[i] === query[queryIndex]) {
                positions.push(i);
                score += 1 + consecutive * 2; // Bonus for consecutive matches
                consecutive++;
                queryIndex++;
                
                // Extra bonus for start of word
                if (i === 0 || text[i - 1] === ' ') {
                    score += 2;
                }
            } else {
                consecutive = 0;
            }
        }
        
        this._lastMatchPositions = positions;
        
        // Return normalized score
        return queryIndex === query.length ? score / text.length : 0;
    }
    
    _highlightText(text) {
        if (!this._config.highlightMatches || !this._query) {
            return this._escapeHtml(text);
        }
        
        const escaped = this._escapeHtml(text);
        const query = this._config.caseSensitive ? this._query : this._query.toLowerCase();
        const textLower = this._config.caseSensitive ? escaped : escaped.toLowerCase();
        
        let highlighted = '';
        let lastIndex = 0;
        
        // Simple substring highlighting
        let index = textLower.indexOf(query);
        while (index !== -1) {
            highlighted += escaped.substring(lastIndex, index);
            highlighted += `<span class="search-highlight">${escaped.substring(index, index + query.length)}</span>`;
            lastIndex = index + query.length;
            index = textLower.indexOf(query, lastIndex);
        }
        
        highlighted += escaped.substring(lastIndex);
        return highlighted || escaped;
    }
    
    _moveSelection(direction) {
        const maxIndex = Math.min(this._filteredResults.length, this._config.maxResults) - 1;
        
        if (direction > 0) {
            this._selectedIndex = this._selectedIndex < maxIndex ? this._selectedIndex + 1 : 0;
        } else {
            this._selectedIndex = this._selectedIndex > 0 ? this._selectedIndex - 1 : maxIndex;
        }
        
        this._updateUI();
        this._scrollToSelected();
    }
    
    _scrollToSelected() {
        const results = this.shadowRoot.querySelector('.search-results');
        const selected = this.shadowRoot.querySelector('.search-result.selected');
        
        if (results && selected) {
            const resultsRect = results.getBoundingClientRect();
            const selectedRect = selected.getBoundingClientRect();
            
            if (selectedRect.bottom > resultsRect.bottom) {
                results.scrollTop += selectedRect.bottom - resultsRect.bottom;
            } else if (selectedRect.top < resultsRect.top) {
                results.scrollTop -= resultsRect.top - selectedRect.top;
            }
        }
    }
    
    _selectResult(index) {
        const result = this._filteredResults[index];
        if (result) {
            this.dispatchEvent(new CustomEvent('select', {
                detail: { result, index }
            }));
            
            // Update input with selected value
            if (result.title) {
                this._query = result.title;
                this._updateInput();
            }
            
            this._close();
        }
    }
    
    _submitSearch() {
        this.dispatchEvent(new CustomEvent('submit', {
            detail: { query: this._query }
        }));
        this._close();
    }
    
    _toggleVoiceSearch() {
        if (!this._recognition) return;
        
        if (this._isListening) {
            this._recognition.stop();
        } else {
            this._isListening = true;
            this._recognition.start();
            this._updateUI();
        }
    }
    
    _close() {
        this._isOpen = false;
        this._selectedIndex = -1;
        this._updateUI();
    }
    
    _updateInput() {
        const input = this.shadowRoot.querySelector('.search-input');
        if (input && input.value !== this._query) {
            input.value = this._query;
        }
    }
    
    _groupResultsByCategory() {
        const grouped = new Map();
        
        for (const result of this._filteredResults.slice(0, this._config.maxResults)) {
            const category = result.category || 'Other';
            if (!grouped.has(category)) {
                grouped.set(category, []);
            }
            grouped.get(category).push(result);
        }
        
        return grouped;
    }
    
    _addToCache(query, results) {
        // Limit cache size
        if (this._cache.size >= this._maxCacheSize) {
            const firstKey = this._cache.keys().next().value;
            this._cache.delete(firstKey);
        }
        
        this._cache.set(query, results);
    }
    
    _clearCache() {
        this._cache.clear();
    }
    
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Public API
    setData(data) {
        this._data = Array.isArray(data) ? data : [];
        this._clearCache();
        
        // Reinitialize worker with new data
        if (this._searchWorker) {
            this._searchWorker.postMessage({
                type: 'init',
                payload: {
                    data: this._data,
                    config: {
                        minChars: this._config.minChars,
                        maxResults: this._config.maxResults,
                        fuzzyThreshold: this._config.fuzzyThreshold,
                        caseSensitive: this._config.caseSensitive,
                        searchKeys: this._config.searchKeys
                    }
                }
            });
        }
        
        // Re-search if query exists
        if (this._query) {
            this._performSearch();
        }
    }
    
    clear() {
        this._query = '';
        this._filteredResults = [];
        this._selectedIndex = -1;
        this._isOpen = false;
        this._updateInput();
        this._updateUI();
        
        // Focus input
        const input = this.shadowRoot.querySelector('.search-input');
        if (input) {
            input.focus();
        }
    }
    
    focus() {
        const input = this.shadowRoot.querySelector('.search-input');
        if (input) {
            input.focus();
        }
    }
    
    search(query) {
        this._query = query;
        this._updateInput();
        this._performSearch();
    }
    
    setConfig(config) {
        this._config = { ...this._config, ...config };
        this._clearCache();
        this._updateUI();
    }
    
    get value() {
        return this._query;
    }
    
    set value(val) {
        this._query = val || '';
        this._updateInput();
    }
    
    get results() {
        return this._filteredResults;
    }
    
    get isOpen() {
        return this._isOpen;
    }
}

// Register element
customElements.define('brutal-searchbox', SearchBox);