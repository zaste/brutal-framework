/**
 * @fileoverview BRUTAL Card Component - Flexible container with variants
 * @version 3.0.0
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';

/**
 * BRUTAL Card - The most versatile card component
 * Header/Body/Footer slots, elevation, interactive states
 */
export class Card extends InteractiveComponent {
    static get observedAttributes() {
        return [
            'variant',      // default | article | product | profile | stats
            'elevation',    // 0-5
            'interactive',  // boolean - clickable/hoverable
            'selected',     // boolean
            'loading',      // boolean
            'horizontal',   // boolean - horizontal layout
            'compact',      // boolean - reduced padding
            'href',         // link mode
            'target'        // for link mode
        ];
    }
    
    constructor() {
        super();
        
        // State
        this.state = {
            variant: 'default',
            elevation: 1,
            interactive: false,
            selected: false,
            loading: false,
            horizontal: false,
            compact: false,
            hovered: false,
            imageLoaded: false
        };
        
        // Intersection observer for lazy loading
        this._observer = null;
        
        // V8 optimization
        this._boundHandleClick = this._handleClick.bind(this);
        this._boundHandleMouseEnter = this._handleMouseEnter.bind(this);
        this._boundHandleMouseLeave = this._handleMouseLeave.bind(this);
        this._boundHandleImageLoad = this._handleImageLoad.bind(this);
        this._boundHandleImageError = this._handleImageError.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        this._setupIntersectionObserver();
        this._attachEventListeners();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer?.disconnect();
        this._removeEventListeners();
    }
    
    /**
     * Render card
     */
    render() {
        const {
            variant,
            elevation,
            interactive,
            selected,
            loading,
            horizontal,
            compact,
            hovered
        } = this.state;
        
        // Build classes
        const classes = ['brutal-card'];
        classes.push(`brutal-card--${variant}`);
        classes.push(`brutal-card--elevation-${elevation}`);
        
        if (interactive) classes.push('brutal-card--interactive');
        if (selected) classes.push('brutal-card--selected');
        if (loading) classes.push('brutal-card--loading');
        if (horizontal) classes.push('brutal-card--horizontal');
        if (compact) classes.push('brutal-card--compact');
        if (hovered) classes.push('brutal-card--hovered');
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()}</style>
            <article 
                class="${classes.join(' ')}"
                role="${interactive ? 'button' : 'article'}"
                tabindex="${interactive ? '0' : '-1'}"
                aria-pressed="${selected}"
                part="card"
            >
                ${loading ? this._renderSkeleton() : this._renderContent()}
            </article>
        `;
    }
    
    /**
     * Get optimized styles
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
            
            .brutal-card {
                position: relative;
                background: #1a1a1a;
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform: translateZ(0);
                will-change: transform, box-shadow;
            }
            
            /* Elevation levels */
            .brutal-card--elevation-0 {
                box-shadow: none;
                border: 1px solid #333;
            }
            
            .brutal-card--elevation-1 {
                box-shadow: 
                    0 1px 3px rgba(0, 0, 0, 0.12),
                    0 1px 2px rgba(0, 0, 0, 0.24);
            }
            
            .brutal-card--elevation-2 {
                box-shadow: 
                    0 3px 6px rgba(0, 0, 0, 0.16),
                    0 3px 6px rgba(0, 0, 0, 0.23);
            }
            
            .brutal-card--elevation-3 {
                box-shadow: 
                    0 10px 20px rgba(0, 0, 0, 0.19),
                    0 6px 6px rgba(0, 0, 0, 0.23);
            }
            
            .brutal-card--elevation-4 {
                box-shadow: 
                    0 14px 28px rgba(0, 0, 0, 0.25),
                    0 10px 10px rgba(0, 0, 0, 0.22);
            }
            
            .brutal-card--elevation-5 {
                box-shadow: 
                    0 19px 38px rgba(0, 0, 0, 0.30),
                    0 15px 12px rgba(0, 0, 0, 0.22);
            }
            
            /* Interactive states */
            .brutal-card--interactive {
                cursor: pointer;
                user-select: none;
            }
            
            .brutal-card--interactive:hover {
                transform: translateY(-2px);
            }
            
            .brutal-card--elevation-1.brutal-card--interactive:hover {
                box-shadow: 
                    0 3px 6px rgba(0, 0, 0, 0.16),
                    0 3px 6px rgba(0, 0, 0, 0.23);
            }
            
            .brutal-card--elevation-2.brutal-card--interactive:hover {
                box-shadow: 
                    0 10px 20px rgba(0, 0, 0, 0.19),
                    0 6px 6px rgba(0, 0, 0, 0.23);
            }
            
            .brutal-card--interactive:active {
                transform: translateY(0);
            }
            
            .brutal-card--selected {
                border: 2px solid #00ff88;
                box-shadow: 
                    0 0 0 4px rgba(0, 255, 136, 0.2),
                    0 10px 20px rgba(0, 0, 0, 0.19);
            }
            
            /* Layout variations */
            .brutal-card--horizontal {
                display: flex;
                flex-direction: row;
            }
            
            .brutal-card--horizontal ::slotted([slot="media"]) {
                width: 40%;
                max-width: 300px;
            }
            
            .brutal-card--compact {
                /* Handled by slotted elements */
            }
            
            /* Slots */
            ::slotted([slot="header"]) {
                padding: 1.5rem 1.5rem 1rem;
                border-bottom: 1px solid #333;
            }
            
            ::slotted([slot="media"]) {
                display: block;
                width: 100%;
                height: auto;
                object-fit: cover;
            }
            
            ::slotted([slot="body"]) {
                padding: 1.5rem;
            }
            
            ::slotted([slot="footer"]) {
                padding: 1rem 1.5rem 1.5rem;
                border-top: 1px solid #333;
            }
            
            /* Compact mode */
            .brutal-card--compact ::slotted([slot="header"]),
            .brutal-card--compact ::slotted([slot="body"]),
            .brutal-card--compact ::slotted([slot="footer"]) {
                padding: 0.75rem;
            }
            
            /* Loading skeleton */
            .brutal-skeleton {
                padding: 1.5rem;
            }
            
            .brutal-skeleton-line {
                height: 1rem;
                background: linear-gradient(
                    90deg,
                    #333 25%,
                    #444 50%,
                    #333 75%
                );
                background-size: 200% 100%;
                animation: brutal-shimmer 1.5s infinite;
                border-radius: 4px;
                margin-bottom: 0.75rem;
            }
            
            .brutal-skeleton-line:last-child {
                margin-bottom: 0;
            }
            
            .brutal-skeleton-line--header {
                height: 1.5rem;
                width: 60%;
                margin-bottom: 1rem;
            }
            
            .brutal-skeleton-line--short {
                width: 80%;
            }
            
            .brutal-skeleton-media {
                height: 200px;
                background: linear-gradient(
                    90deg,
                    #333 25%,
                    #444 50%,
                    #333 75%
                );
                background-size: 200% 100%;
                animation: brutal-shimmer 1.5s infinite;
            }
            
            @keyframes brutal-shimmer {
                0% {
                    background-position: 200% 0;
                }
                100% {
                    background-position: -200% 0;
                }
            }
            
            /* Variant: Article */
            .brutal-card--article {
                /* Custom article styles */
            }
            
            .brutal-card--article ::slotted([slot="header"]) {
                position: relative;
            }
            
            .brutal-card--article ::slotted(.article-category) {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                background: #00ff88;
                color: #000;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            
            /* Variant: Product */
            .brutal-card--product {
                /* Custom product styles */
            }
            
            .brutal-card--product ::slotted(.product-badge) {
                position: absolute;
                top: 1rem;
                right: 1rem;
                padding: 0.25rem 0.75rem;
                background: #ff0044;
                color: #fff;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 4px;
                z-index: 1;
            }
            
            .brutal-card--product ::slotted(.product-price) {
                font-size: 1.5rem;
                font-weight: 700;
                color: #00ff88;
            }
            
            /* Variant: Profile */
            .brutal-card--profile {
                text-align: center;
            }
            
            .brutal-card--profile ::slotted([slot="media"]) {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                margin: 1.5rem auto 0;
            }
            
            /* Variant: Stats */
            .brutal-card--stats {
                /* Custom stats styles */
            }
            
            .brutal-card--stats ::slotted(.stats-grid) {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 1rem;
                padding: 1.5rem;
            }
            
            .brutal-card--stats ::slotted(.stat-value) {
                font-size: 2rem;
                font-weight: 700;
                color: #00ff88;
                font-variant-numeric: tabular-nums;
            }
            
            .brutal-card--stats ::slotted(.stat-label) {
                font-size: 0.875rem;
                color: #999;
            }
            
            /* Focus styles */
            .brutal-card--interactive:focus-visible {
                outline: 2px solid #00ff88;
                outline-offset: 2px;
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .brutal-card,
                .brutal-skeleton-line,
                .brutal-skeleton-media {
                    animation: none;
                    transition: none;
                }
            }
            
            /* Dark mode adjustments */
            @media (prefers-color-scheme: light) {
                .brutal-card {
                    background: #fff;
                    color: #000;
                }
                
                .brutal-card--elevation-0 {
                    border-color: #ddd;
                }
                
                ::slotted([slot="header"]),
                ::slotted([slot="footer"]) {
                    border-color: #eee;
                }
                
                .brutal-skeleton-line,
                .brutal-skeleton-media {
                    background: linear-gradient(
                        90deg,
                        #eee 25%,
                        #ddd 50%,
                        #eee 75%
                    );
                }
            }
        `;
    }
    
    /**
     * Render card content
     */
    _renderContent() {
        return `
            <slot name="media"></slot>
            <slot name="header"></slot>
            <slot name="body"></slot>
            <slot name="footer"></slot>
            <slot></slot>
        `;
    }
    
    /**
     * Render loading skeleton
     */
    _renderSkeleton() {
        const { variant } = this.state;
        
        if (variant === 'profile') {
            return `
                <div class="brutal-skeleton">
                    <div class="brutal-skeleton-media" style="width: 120px; height: 120px; border-radius: 50%; margin: 1.5rem auto 0;"></div>
                    <div class="brutal-skeleton-line brutal-skeleton-line--header" style="margin: 1rem auto; width: 150px;"></div>
                    <div class="brutal-skeleton-line brutal-skeleton-line--short" style="margin: 0 auto; width: 200px;"></div>
                </div>
            `;
        }
        
        return `
            ${variant === 'article' || variant === 'product' ? '<div class="brutal-skeleton-media"></div>' : ''}
            <div class="brutal-skeleton">
                <div class="brutal-skeleton-line brutal-skeleton-line--header"></div>
                <div class="brutal-skeleton-line"></div>
                <div class="brutal-skeleton-line brutal-skeleton-line--short"></div>
            </div>
        `;
    }
    
    /**
     * Handle click
     */
    _handleClick(e) {
        if (!this.state.interactive) return;
        
        // Handle link mode
        if (this.getAttribute('href')) {
            e.preventDefault();
            const target = this.getAttribute('target') || '_self';
            window.open(this.getAttribute('href'), target);
        }
        
        // Toggle selection
        this.state.selected = !this.state.selected;
        this.render();
        
        // Emit event
        this.dispatchEvent(new CustomEvent('brutal:card-click', {
            bubbles: true,
            composed: true,
            detail: { 
                selected: this.state.selected,
                variant: this.state.variant
            }
        }));
    }
    
    /**
     * Handle mouse enter
     */
    _handleMouseEnter() {
        this.state.hovered = true;
        this.render();
    }
    
    /**
     * Handle mouse leave
     */
    _handleMouseLeave() {
        this.state.hovered = false;
        this.render();
    }
    
    /**
     * Handle image load
     */
    _handleImageLoad(e) {
        this.state.imageLoaded = true;
        e.target.classList.add('brutal-image-loaded');
        
        this.dispatchEvent(new CustomEvent('brutal:image-load', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Handle image error
     */
    _handleImageError(e) {
        e.target.style.display = 'none';
        
        this.dispatchEvent(new CustomEvent('brutal:image-error', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Setup intersection observer for lazy loading
     */
    _setupIntersectionObserver() {
        const images = this.querySelectorAll('img[loading="lazy"]');
        if (images.length === 0) return;
        
        const options = {
            rootMargin: '50px'
        };
        
        this._observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    this._observer.unobserve(img);
                }
            });
        }, options);
        
        images.forEach(img => {
            if (img.dataset.src) {
                this._observer.observe(img);
            }
        });
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        const card = this.shadowRoot.querySelector('.brutal-card');
        
        if (this.state.interactive) {
            card.addEventListener('click', this._boundHandleClick);
            card.addEventListener('mouseenter', this._boundHandleMouseEnter);
            card.addEventListener('mouseleave', this._boundHandleMouseLeave);
            
            // Keyboard support
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._handleClick(e);
                }
            });
        }
        
        // Image load events
        const images = this.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('load', this._boundHandleImageLoad);
            img.addEventListener('error', this._boundHandleImageError);
        });
    }
    
    /**
     * Remove event listeners
     */
    _removeEventListeners() {
        const card = this.shadowRoot.querySelector('.brutal-card');
        if (!card) return;
        
        card.removeEventListener('click', this._boundHandleClick);
        card.removeEventListener('mouseenter', this._boundHandleMouseEnter);
        card.removeEventListener('mouseleave', this._boundHandleMouseLeave);
        
        const images = this.querySelectorAll('img');
        images.forEach(img => {
            img.removeEventListener('load', this._boundHandleImageLoad);
            img.removeEventListener('error', this._boundHandleImageError);
        });
    }
    
    /**
     * Attribute changed callback
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'variant':
                this.state.variant = newValue || 'default';
                break;
            case 'elevation':
                this.state.elevation = parseInt(newValue) || 1;
                this.state.elevation = Math.max(0, Math.min(5, this.state.elevation));
                break;
            case 'interactive':
                this.state.interactive = newValue !== null;
                break;
            case 'selected':
                this.state.selected = newValue !== null;
                break;
            case 'loading':
                this.state.loading = newValue !== null;
                break;
            case 'horizontal':
                this.state.horizontal = newValue !== null;
                break;
            case 'compact':
                this.state.compact = newValue !== null;
                break;
        }
        
        this.render();
    }
}

// Register component
customElements.define('brutal-card', Card);