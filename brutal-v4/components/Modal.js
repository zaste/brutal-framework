/**
 * BRUTAL V4 - Modal Component Example
 * Demonstrates accessibility, focus management, and portal behavior
 */

import { BrutalComponent } from '../core/foundation/Component.js';
import { html, css } from '../core/templates/index.js';
import { BrutalCore } from '../core/integration/CoreIntegration.js';
import { BrutalA11y, FocusManager } from '../core/accessibility/A11y.js';

/**
 * BrutalModal - Example modal component with full accessibility
 */
export class BrutalModal extends BrutalComponent {
    static get observedAttributes() {
        return ['open', 'size', 'backdrop-close', 'escape-close', 'title'];
    }
    
    constructor() {
        super();
        
        // Wire with core systems
        BrutalCore.wireComponent(this);
        
        // Modal-specific setup
        this.modalId = BrutalA11y.generateId('brutal-modal');
        this.titleId = BrutalA11y.generateId('brutal-modal-title');
        this.contentId = BrutalA11y.generateId('brutal-modal-content');
        this.focusManager = null;
        this.previousActiveElement = null;
        
        // Setup modal behavior
        this.setupModalBehavior();
    }
    
    /**
     * Initialize modal state
     */
    initializeState() {
        super.initializeState();
        
        // Modal-specific state
        this._state.set({
            open: this.hasAttribute('open'),
            size: this.getAttribute('size') || 'medium',
            backdropClose: this.getAttribute('backdrop-close') !== 'false',
            escapeClose: this.getAttribute('escape-close') !== 'false',
            title: this.getAttribute('title') || '',
            animating: false
        });
        
        // Watch for open state changes
        this._state.subscribe((changes) => {
            if ('open' in changes) {
                if (changes.open) {
                    this.openModal();
                } else {
                    this.closeModal();
                }
            }
        });
    }
    
    /**
     * Create modal template
     */
    createTemplate() {
        const state = this._state.getAll();
        
        // Set styles using Constructable StyleSheets
        this.setStyles(this.getModalStyles());
        
        this._template = html`
            ${state.open ? html`
                <div 
                    class="brutal-modal-backdrop" 
                    role="presentation"
                    @click="${this.handleBackdropClick}"
                >
                    <div
                        class="brutal-modal brutal-modal--${state.size}"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="${state.title ? this.titleId : ''}"
                        aria-describedby="${this.contentId}"
                        id="${this.modalId}"
                        @click="${this.handleModalClick}"
                    >
                        <div class="brutal-modal__header">
                            ${state.title ? html`
                                <h2 class="brutal-modal__title" id="${this.titleId}">
                                    ${state.title}
                                </h2>
                            ` : html`
                                <div class="brutal-modal__title-slot">
                                    <slot name="title"></slot>
                                </div>
                            `}
                            
                            <button
                                class="brutal-modal__close"
                                type="button"
                                aria-label="Close modal"
                                @click="${this.close}"
                            >
                                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                                    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="brutal-modal__content" id="${this.contentId}">
                            <slot></slot>
                        </div>
                        
                        <div class="brutal-modal__footer">
                            <slot name="footer"></slot>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    /**
     * Get modal styles with design tokens
     */
    getModalStyles() {
        return css`
            :host {
                display: contents;
            }
            
            .brutal-modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--theme-overlay, rgba(0, 0, 0, 0.5));
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-4);
                z-index: var(--zIndex-modal, 1050);
                opacity: 0;
                animation: backdrop-fade-in var(--animation-duration-300) var(--animation-ease-out) forwards;
            }
            
            .brutal-modal {
                background: var(--theme-surface);
                border-radius: var(--borderRadius-lg);
                box-shadow: var(--shadow-2xl);
                max-height: 90vh;
                width: 100%;
                display: flex;
                flex-direction: column;
                position: relative;
                transform: scale(0.95) translateY(-20px);
                animation: modal-slide-in var(--animation-duration-300) var(--animation-ease-out) forwards;
                animation-delay: 50ms;
            }
            
            /* Size variants */
            .brutal-modal--small {
                max-width: 400px;
            }
            
            .brutal-modal--medium {
                max-width: 600px;
            }
            
            .brutal-modal--large {
                max-width: 800px;
            }
            
            .brutal-modal--fullscreen {
                max-width: none;
                max-height: none;
                width: 100%;
                height: 100%;
                border-radius: 0;
            }
            
            /* Header */
            .brutal-modal__header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
                border-bottom: 1px solid var(--theme-border-primary);
                flex-shrink: 0;
            }
            
            .brutal-modal__title {
                margin: 0;
                font-size: var(--text-xl);
                font-weight: var(--font-semibold);
                color: var(--theme-text-primary);
            }
            
            .brutal-modal__title-slot {
                flex: 1;
            }
            
            .brutal-modal__close {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: var(--borderRadius-md);
                background: transparent;
                color: var(--theme-text-secondary);
                cursor: pointer;
                transition: all var(--animation-duration-200) var(--animation-ease-out);
                margin-left: var(--spacing-4);
                flex-shrink: 0;
            }
            
            .brutal-modal__close:hover {
                background: var(--theme-bg-secondary);
                color: var(--theme-text-primary);
            }
            
            .brutal-modal__close:focus-visible {
                outline: 2px solid var(--theme-border-focus);
                outline-offset: 2px;
            }
            
            /* Content */
            .brutal-modal__content {
                flex: 1;
                padding: var(--spacing-4) var(--spacing-6);
                overflow-y: auto;
                overscroll-behavior: contain;
            }
            
            /* Footer */
            .brutal-modal__footer {
                padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
                border-top: 1px solid var(--theme-border-primary);
                flex-shrink: 0;
            }
            
            .brutal-modal__footer:empty {
                display: none;
            }
            
            /* Animations */
            @keyframes backdrop-fade-in {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            @keyframes modal-slide-in {
                from {
                    transform: scale(0.95) translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
            }
            
            /* Closing animations */
            :host([closing]) .brutal-modal-backdrop {
                animation: backdrop-fade-out var(--animation-duration-200) var(--animation-ease-in) forwards;
            }
            
            :host([closing]) .brutal-modal {
                animation: modal-slide-out var(--animation-duration-200) var(--animation-ease-in) forwards;
            }
            
            @keyframes backdrop-fade-out {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
            
            @keyframes modal-slide-out {
                from {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: scale(0.95) translateY(-20px);
                    opacity: 0;
                }
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .brutal-modal-backdrop {
                    padding: var(--spacing-2);
                    align-items: stretch;
                }
                
                .brutal-modal {
                    max-height: 100%;
                    margin: auto 0;
                }
                
                .brutal-modal--medium,
                .brutal-modal--large {
                    max-width: none;
                    width: 100%;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .brutal-modal-backdrop,
                .brutal-modal {
                    animation: none !important;
                }
                
                .brutal-modal {
                    transform: none;
                    opacity: 1;
                }
            }
            
            /* High contrast support */
            @media (prefers-contrast: high) {
                .brutal-modal {
                    border: 2px solid var(--theme-border-primary);
                }
                
                .brutal-modal__header,
                .brutal-modal__footer {
                    border-color: var(--theme-text-primary);
                }
            }
        `;
    }
    
    /**
     * Setup modal-specific behavior
     */
    setupModalBehavior() {
        // Handle escape key globally
        this.handleEscapeKey = (event) => {
            if (event.key === 'Escape' && this._state.get('open') && this._state.get('escapeClose')) {
                this.close();
            }
        };
        
        // Handle body scroll locking
        this.originalBodyStyle = null;
    }
    
    /**
     * Setup modal event listeners
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        // Global escape key listener
        document.addEventListener('keydown', this.handleEscapeKey);
    }
    
    /**
     * Handle backdrop click
     */
    handleBackdropClick = (event) => {
        if (event.target === event.currentTarget && this._state.get('backdropClose')) {
            this.close();
        }
    }
    
    /**
     * Handle modal click (prevent propagation)
     */
    handleModalClick = (event) => {
        event.stopPropagation();
    }
    
    /**
     * Open modal
     */
    open() {
        if (!this._state.get('open')) {
            this._state.set({ open: true });
            this.setAttribute('open', '');
        }
    }
    
    /**
     * Close modal
     */
    close() {
        if (this._state.get('open')) {
            // Start closing animation
            this.setAttribute('closing', '');
            this._state.set({ animating: true });
            
            // Wait for animation to complete
            setTimeout(() => {
                this._state.set({ open: false, animating: false });
                this.removeAttribute('open');
                this.removeAttribute('closing');
            }, 200);
        }
    }
    
    /**
     * Handle modal opening
     */
    openModal() {
        // Store currently focused element
        this.previousActiveElement = document.activeElement;
        
        // Lock body scroll
        this.lockBodyScroll();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Announce to screen readers
        BrutalA11y.announce('Modal opened');
        
        // Emit open event
        this.emit('brutal:modal:open', {
            title: this._state.get('title'),
            size: this._state.get('size')
        });
    }
    
    /**
     * Handle modal closing
     */
    closeModal() {
        // Cleanup focus management
        this.cleanupFocusManagement();
        
        // Unlock body scroll
        this.unlockBodyScroll();
        
        // Restore focus
        if (this.previousActiveElement && this.previousActiveElement.focus) {
            this.previousActiveElement.focus();
        }
        
        // Announce to screen readers
        BrutalA11y.announce('Modal closed');
        
        // Emit close event
        this.emit('brutal:modal:close', {
            title: this._state.get('title'),
            size: this._state.get('size')
        });
    }
    
    /**
     * Setup focus management
     */
    setupFocusManagement() {
        const modal = this.shadowRoot?.querySelector('.brutal-modal');
        if (!modal) return;
        
        // Create focus manager
        this.focusManager = new FocusManager(modal, {
            trapFocus: true,
            returnFocus: false,
            initialFocus: '.brutal-modal__close'
        });
        
        this.focusManager.activate();
    }
    
    /**
     * Cleanup focus management
     */
    cleanupFocusManagement() {
        if (this.focusManager) {
            this.focusManager.deactivate();
            this.focusManager = null;
        }
    }
    
    /**
     * Lock body scroll
     */
    lockBodyScroll() {
        if (this.originalBodyStyle === null) {
            this.originalBodyStyle = {
                overflow: document.body.style.overflow,
                paddingRight: document.body.style.paddingRight
            };
            
            // Calculate scrollbar width
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            // Apply scroll lock
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
        }
    }
    
    /**
     * Unlock body scroll
     */
    unlockBodyScroll() {
        if (this.originalBodyStyle !== null) {
            document.body.style.overflow = this.originalBodyStyle.overflow;
            document.body.style.paddingRight = this.originalBodyStyle.paddingRight;
            this.originalBodyStyle = null;
        }
    }
    
    /**
     * Component cleanup
     */
    onCleanup() {
        super.onCleanup();
        
        // Remove global listeners
        document.removeEventListener('keydown', this.handleEscapeKey);
        
        // Cleanup modal state
        this.cleanupFocusManagement();
        this.unlockBodyScroll();
    }
    
    /**
     * Handle attribute changes
     */
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        
        if (this._state) {
            switch (name) {
                case 'open':
                    this._state.set({ open: newValue !== null });
                    break;
                case 'size':
                    this._state.set({ size: newValue || 'medium' });
                    break;
                case 'backdrop-close':
                    this._state.set({ backdropClose: newValue !== 'false' });
                    break;
                case 'escape-close':
                    this._state.set({ escapeClose: newValue !== 'false' });
                    break;
                case 'title':
                    this._state.set({ title: newValue || '' });
                    break;
            }
        }
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Check if modal is open
     */
    isOpen() {
        return this._state.get('open');
    }
    
    /**
     * Toggle modal
     */
    toggle() {
        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * Get modal state
     */
    getModalState() {
        return {
            ...this._state.getAll(),
            element: this
        };
    }
}

// Register modal component
if (!customElements.get('brutal-modal')) {
    customElements.define('brutal-modal', BrutalModal);
}