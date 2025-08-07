/**
 * BRUTAL V4 - Accessibility Foundation
 * WCAG 2.1 AA compliance with native web standards
 * Screen reader support, focus management, ARIA integration
 */

/**
 * BrutalA11y - Accessibility management system
 * Provides WCAG-compliant accessibility features
 * Integrates with native web component lifecycle
 */
export class BrutalA11y {
    static announceRegion = null;
    static focusHistory = [];
    static currentFocusTracker = null;
    
    /**
     * Initialize accessibility system
     */
    static init() {
        this.createAnnounceRegion();
        this.setupFocusTracking();
        this.setupKeyboardNavigation();
        this.validateAccessibility();
    }
    
    /**
     * Create screen reader announcement region
     */
    static createAnnounceRegion() {
        if (this.announceRegion) return;
        
        this.announceRegion = document.createElement('div');
        this.announceRegion.setAttribute('aria-live', 'polite');
        this.announceRegion.setAttribute('aria-atomic', 'true');
        this.announceRegion.setAttribute('aria-hidden', 'false');
        this.announceRegion.style.cssText = `
            position: absolute !important;
            left: -10000px !important;
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
        `;
        
        document.body.appendChild(this.announceRegion);
    }
    
    /**
     * Announce message to screen readers
     */
    static announce(message, priority = 'polite') {
        if (!this.announceRegion) {
            this.createAnnounceRegion();
        }
        
        this.announceRegion.setAttribute('aria-live', priority);
        this.announceRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            this.announceRegion.textContent = '';
        }, 1000);
    }
    
    /**
     * Set ARIA role on element
     */
    static setRole(element, role) {
        if (!element || !role) return false;
        
        const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 
            'button', 'checkbox', 'columnheader', 'combobox', 'complementary',
            'contentinfo', 'dialog', 'directory', 'document', 'form',
            'grid', 'gridcell', 'group', 'heading', 'img', 'link',
            'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
            'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'navigation', 'note', 'option', 'presentation',
            'progressbar', 'radio', 'radiogroup', 'region', 'row',
            'rowgroup', 'rowheader', 'scrollbar', 'search', 'separator',
            'slider', 'spinbutton', 'status', 'tab', 'tablist',
            'tabpanel', 'textbox', 'timer', 'toolbar', 'tooltip',
            'tree', 'treegrid', 'treeitem'
        ];
        
        if (!validRoles.includes(role)) {
            console.warn(`[BrutalA11y] Invalid ARIA role: ${role}`);
            return false;
        }
        
        element.setAttribute('role', role);
        return true;
    }
    
    /**
     * Set ARIA label
     */
    static setLabel(element, label) {
        if (!element || !label) return false;
        
        element.setAttribute('aria-label', label);
        return true;
    }
    
    /**
     * Set ARIA described by
     */
    static setDescribedBy(element, describerId) {
        if (!element || !describerId) return false;
        
        element.setAttribute('aria-describedby', describerId);
        return true;
    }
    
    /**
     * Set ARIA labelled by
     */
    static setLabelledBy(element, labelId) {
        if (!element || !labelId) return false;
        
        element.setAttribute('aria-labelledby', labelId);
        return true;
    }
    
    /**
     * Set ARIA expanded state
     */
    static setExpanded(element, expanded) {
        if (!element) return false;
        
        element.setAttribute('aria-expanded', String(expanded));
        return true;
    }
    
    /**
     * Set ARIA hidden state
     */
    static setHidden(element, hidden) {
        if (!element) return false;
        
        element.setAttribute('aria-hidden', String(hidden));
        return true;
    }
    
    /**
     * Set ARIA disabled state
     */
    static setDisabled(element, disabled) {
        if (!element) return false;
        
        element.setAttribute('aria-disabled', String(disabled));
        
        if (disabled) {
            element.setAttribute('tabindex', '-1');
        } else {
            element.removeAttribute('tabindex');
        }
        
        return true;
    }
    
    /**
     * Manage focus for component
     */
    static manageFocus(component, options = {}) {
        if (!component) return null;
        
        const manager = new FocusManager(component, options);
        return manager;
    }
    
    /**
     * Setup global focus tracking
     */
    static setupFocusTracking() {
        let lastFocused = null;
        
        document.addEventListener('focusin', (event) => {
            this.focusHistory.push({
                element: event.target,
                timestamp: Date.now(),
                previous: lastFocused
            });
            
            lastFocused = event.target;
            
            // Limit history size
            if (this.focusHistory.length > 50) {
                this.focusHistory.shift();
            }
        });
        
        document.addEventListener('focusout', (event) => {
            // Track focus out for restoration
        });
    }
    
    /**
     * Setup keyboard navigation
     */
    static setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Handle escape key globally
            if (event.key === 'Escape') {
                this.handleEscape(event);
            }
            
            // Handle tab navigation
            if (event.key === 'Tab') {
                this.handleTabNavigation(event);
            }
            
            // Handle arrow navigation
            if (event.key.startsWith('Arrow')) {
                this.handleArrowNavigation(event);
            }
        });
    }
    
    /**
     * Handle escape key
     */
    static handleEscape(event) {
        // Close modals, dropdowns, etc.
        const modals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
        if (modals.length > 0) {
            const modal = modals[modals.length - 1]; // Close topmost modal
            if (modal.close) {
                modal.close();
            } else {
                this.setHidden(modal, true);
            }
            event.preventDefault();
        }
    }
    
    /**
     * Handle tab navigation
     */
    static handleTabNavigation(event) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(event.target);
        
        if (currentIndex === -1) return;
        
        let nextIndex;
        if (event.shiftKey) {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
                nextIndex = focusableElements.length - 1;
            }
        } else {
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length) {
                nextIndex = 0;
            }
        }
        
        // Check if we're in a modal or dialog
        const dialog = event.target.closest('[role="dialog"]');
        if (dialog) {
            const dialogFocusable = this.getFocusableElements(dialog);
            const dialogIndex = dialogFocusable.indexOf(event.target);
            
            if (dialogIndex !== -1) {
                let nextDialogIndex;
                if (event.shiftKey) {
                    nextDialogIndex = dialogIndex - 1;
                    if (nextDialogIndex < 0) {
                        nextDialogIndex = dialogFocusable.length - 1;
                    }
                } else {
                    nextDialogIndex = dialogIndex + 1;
                    if (nextDialogIndex >= dialogFocusable.length) {
                        nextDialogIndex = 0;
                    }
                }
                
                dialogFocusable[nextDialogIndex].focus();
                event.preventDefault();
            }
        }
    }
    
    /**
     * Handle arrow navigation
     */
    static handleArrowNavigation(event) {
        const target = event.target;
        const role = target.getAttribute('role');
        
        // Handle different ARIA patterns
        switch (role) {
            case 'menuitem':
            case 'option':
                this.handleMenuNavigation(event);
                break;
            case 'tab':
                this.handleTablistNavigation(event);
                break;
            case 'gridcell':
                this.handleGridNavigation(event);
                break;
        }
    }
    
    /**
     * Handle menu navigation
     */
    static handleMenuNavigation(event) {
        const menu = event.target.closest('[role="menu"], [role="listbox"]');
        if (!menu) return;
        
        const items = Array.from(menu.querySelectorAll('[role="menuitem"], [role="option"]'));
        const currentIndex = items.indexOf(event.target);
        
        let nextIndex;
        switch (event.key) {
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowUp':
                nextIndex = currentIndex - 1;
                if (nextIndex < 0) nextIndex = items.length - 1;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = items.length - 1;
                break;
            default:
                return;
        }
        
        items[nextIndex].focus();
        event.preventDefault();
    }
    
    /**
     * Get focusable elements
     */
    static getFocusableElements(container = document) {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([aria-disabled="true"])',
            '[role="link"]:not([aria-disabled="true"])',
            '[role="menuitem"]:not([aria-disabled="true"])',
            '[role="option"]:not([aria-disabled="true"])',
            '[role="tab"]:not([aria-disabled="true"])'
        ];
        
        return Array.from(container.querySelectorAll(focusableSelectors.join(', ')))
            .filter(el => {
                // Check if element is visible
                const style = getComputedStyle(el);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' &&
                       el.getAttribute('aria-hidden') !== 'true';
            });
    }
    
    /**
     * Validate accessibility
     */
    static validateAccessibility() {
        const issues = [];
        
        // Check for images without alt text
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
            issues.push(`${images.length} images missing alt text`);
        }
        
        // Check for buttons without accessible names
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            if (!button.textContent.trim()) {
                issues.push('Button without accessible name found');
            }
        });
        
        // Check for form inputs without labels
        const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        inputs.forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (!label && input.type !== 'hidden' && input.type !== 'submit') {
                issues.push(`Input without label: ${input.type}`);
            }
        });
        
        // Check color contrast (basic check)
        this.checkColorContrast(issues);
        
        if (issues.length > 0) {
            console.warn('[BrutalA11y] Accessibility issues found:', issues);
        }
        
        return issues;
    }
    
    /**
     * Check color contrast
     */
    static checkColorContrast(issues) {
        // Basic contrast checking - would need more sophisticated implementation
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
        
        textElements.forEach(el => {
            const style = getComputedStyle(el);
            const color = style.color;
            const backgroundColor = style.backgroundColor;
            
            // Simple check - in real implementation would calculate actual contrast ratio
            if (color === backgroundColor) {
                issues.push('Potential contrast issue detected');
            }
        });
    }
    
    /**
     * Create accessible component mixin
     */
    static createAccessibleComponent() {
        return class AccessibleMixin {
            setAccessibleName(name) {
                BrutalA11y.setLabel(this, name);
            }
            
            setAccessibleDescription(description) {
                const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
                const descElement = document.createElement('div');
                descElement.id = descId;
                descElement.textContent = description;
                descElement.style.cssText = `
                    position: absolute;
                    left: -10000px;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                `;
                
                this.appendChild(descElement);
                BrutalA11y.setDescribedBy(this, descId);
            }
            
            setAccessibleRole(role) {
                BrutalA11y.setRole(this, role);
            }
            
            announceChange(message) {
                BrutalA11y.announce(message);
            }
        };
    }
}

/**
 * Focus Manager for components
 */
export class FocusManager {
    constructor(component, options = {}) {
        this.component = component;
        this.options = {
            trapFocus: options.trapFocus || false,
            returnFocus: options.returnFocus || true,
            initialFocus: options.initialFocus || null,
            ...options
        };
        
        this.previousFocus = null;
        this.focusableElements = [];
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        this.updateFocusableElements();
        
        if (this.options.trapFocus) {
            this.setupFocusTrap();
        }
    }
    
    activate() {
        if (this.isActive) return;
        
        this.previousFocus = document.activeElement;
        this.updateFocusableElements();
        
        if (this.options.initialFocus) {
            if (typeof this.options.initialFocus === 'string') {
                const element = this.component.querySelector(this.options.initialFocus);
                if (element) element.focus();
            } else {
                this.options.initialFocus.focus();
            }
        } else if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }
        
        this.isActive = true;
    }
    
    deactivate() {
        if (!this.isActive) return;
        
        if (this.options.returnFocus && this.previousFocus) {
            this.previousFocus.focus();
        }
        
        this.isActive = false;
    }
    
    updateFocusableElements() {
        this.focusableElements = BrutalA11y.getFocusableElements(this.component);
    }
    
    setupFocusTrap() {
        this.component.addEventListener('keydown', (event) => {
            if (!this.isActive || event.key !== 'Tab') return;
            
            if (this.focusableElements.length === 0) {
                event.preventDefault();
                return;
            }
            
            const firstElement = this.focusableElements[0];
            const lastElement = this.focusableElements[this.focusableElements.length - 1];
            
            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        });
    }
}

/**
 * Accessibility utilities
 */
export const A11yUtils = {
    /**
     * Generate unique ID for accessibility
     */
    generateId(prefix = 'brutal-a11y') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Check if element is visible to screen readers
     */
    isAccessible(element) {
        if (!element) return false;
        
        const style = getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               element.getAttribute('aria-hidden') !== 'true';
    },
    
    /**
     * Create live region for announcements
     */
    createLiveRegion(priority = 'polite') {
        const region = document.createElement('div');
        region.setAttribute('aria-live', priority);
        region.setAttribute('aria-atomic', 'true');
        region.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        
        return region;
    },
    
    /**
     * Wait for screen reader announcement
     */
    waitForAnnouncement(duration = 1000) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }
};

// Auto-initialize accessibility system
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => BrutalA11y.init());
    } else {
        BrutalA11y.init();
    }
}