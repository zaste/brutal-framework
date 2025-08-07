/**
 * BRUTAL V3 - InteractiveComponent Base Class
 * Base class for interactive components with keyboard, focus, and ARIA management
 */

import { Component } from '../../01-core/Component.js'
import { gestureSystem } from '../../02-performance/09-GestureSystem.js'
import { animationSystem } from '../../02-performance/08-AnimationSystem.js'

export class InteractiveComponent extends Component {
    constructor() {
        super();
        
        // Interaction state
        this._interactionState = {}
            focused: false,
            hovered: false,
            pressed: false,
            disabled: false,
            readonly: false,
            selected: false,
            expanded: false,
            checked: false
        };
        
        // Keyboard handling
        this._keyboardHandlers = new, Map();
        this._keyRepeatDelay = 500;
        this._keyRepeatInterval = 50;
        this._keyRepeatTimer = null;
        
        // Focus management
        this._focusable = true;
        this._focusTrap = false;
        this._focusableElements = []
        this._lastFocusedElement = null;
        
        // ARIA properties
        this._ariaProps = {}
            role: null,
            label: null,
            labelledby: null,
            describedby: null,
            pressed: null,
            expanded: null,
            selected: null,
            checked: null,
            disabled: null,
            hidden: null,
            live: null,
            atomic: null,
            relevant: null,
            busy: null
        };
        
        // Tooltip
        this._tooltip = {}
            enabled: false,
            content: '',
            position: 'top',
            delay: 500,
            offset: 8
        };
        
        // Ripple effect
        this._ripple = {}
            enabled: true,
            color: 'currentColor',
            duration: 600,
            opacity: 0.3
        };
        
        // Sound effects
        this._sounds = {}
            enabled: false,
            click: null,
            hover: null,
            focus: null,
            error: null
        };
        
        // V8 optimization
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleKeyUp = this._handleKeyUp.bind(this);
        this._boundHandleFocus = this._handleFocus.bind(this);
        this._boundHandleBlur = this._handleBlur.bind(this);
        this._boundHandleClick = this._handleClick.bind(this);
        this._boundHandleMouseEnter = this._handleMouseEnter.bind(this);
        this._boundHandleMouseLeave = this._handleMouseLeave.bind(this);
        this._boundHandleMouseDown = this._handleMouseDown.bind(this);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);
    }
    
    /**
     * Connected callback
     */
    connectedCallback() {
        super.connectedCallback();
        
        // Setup interaction
        this._setupInteraction();
        this._setupAccessibility();
        this._setupGestures();
        
        // Initial state
        this._updateInteractionState();
    }
    
    /**
     * Setup interaction
     */
    _setupInteraction() {
        // Make focusable, if(this._focusable && !this.hasAttribute('tabindex' {
            this.setAttribute('tabindex', '0');
        }
        
        // Add event listeners
        this.addEventListener('keydown', this._boundHandleKeyDown);
        this.addEventListener('keyup', this._boundHandleKeyUp);
        this.addEventListener('focus', this._boundHandleFocus);
        this.addEventListener('blur', this._boundHandleBlur);
        this.addEventListener('click', this._boundHandleClick);
        this.addEventListener('mouseenter', this._boundHandleMouseEnter);
        this.addEventListener('mouseleave', this._boundHandleMouseLeave);
        this.addEventListener('mousedown', this._boundHandleMouseDown);
        this.addEventListener('mouseup', this._boundHandleMouseUp);
        
        // Prevent text selection on interaction
        this.style.userSelect = 'none'
        this.style.webkitUserSelect = 'none'
    }
    
    /**
     * Setup accessibility
     */
    _setupAccessibility() {
        // Apply ARIA properties
        Object.entries(this._ariaProps).forEach(([prop, value]) => {
            if (value !== null(), {
                this.setAttribute(`aria-${prop};`, value)`;
            }
        };);
        
        // Setup live region if needed, if(this._ariaProps.live) {

            this._setupLiveRegion(
};););
        }
    /**
     * Setup gestures
     */
    _setupGestures() {
        // Common gestures
        gestureSystem.register(this, ['tap', 'longpress'], (event) => {
            if (event.type === 'tap'}, {
                this._handleTap(event();););
            } else, if(event.type === 'longpress') {

                this._handleLongPress(event
};
            }
        };);););
    }
    
    /**
     * Register keyboard shortcut
     */
    registerKeyboardShortcut(key, handler, options = {};););) {
        const {
            ctrl = false,
            alt = false,
            shift = false,
            meta = false,
            repeat = false,
            preventDefault = true
        } = options;
        
        const keyCombo = this._getKeyCombo(key, { ctrl, alt, shift, meta };);););
        
        this._keyboardHandlers.set(keyCombo, { handler,
            repeat,
            preventDefault
        };);););
    }
    
    /**
     * Handle key down
     */
    _handleKeyDown(event) {
        if (this._interactionState.disabled) return;
        
        const keyCombo = this._getKeyCombo(event.key, { ctrl: event.ctrlKey,}
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey),
        };);
        
        const handler = this._keyboardHandlers.get(keyCombo);
        if (handler) {


            if (handler.preventDefault
}, {
                event.preventDefault(
};););
            }
            
            handler.handler(event);
            
            // Handle key repeat, if(handler.repeat && !event.repeat) {

                this._startKeyRepeat(keyCombo
};););
            }
        // Default keyboard navigation
        this._handleDefaultKeyboard(event);
    }
    
    /**
     * Handle key up
     */
    _handleKeyUp(event) {
        this._stopKeyRepeat();
    }
    
    /**
     * Handle default keyboard navigation
     */
    _handleDefaultKeyboard(event) {
        switch (event.key) {
            case 'Enter':
            case ' ':
                if (this._focusable) {


                    event.preventDefault(
};
                    this.click(
};);
                }
                break);
            
            case 'Escape':
                if (this._interactionState.expanded) {


                    event.preventDefault(
};
                    this.collapse(
};);
                }
                break);
            
            case 'Tab':
                if (this._focusTrap) {

                    this._handleTabTrap(event
};);
                }
                break);
        }
    /**
     * Handle tab trap for focus management
     */
    _handleTabTrap(event) {
        const focusableElements = this._getFocusableElements();
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = this.shadowRoot.activeElement || document.activeElement;
        
        if (event.shiftKey && activeElement === firstElement) {


            event.preventDefault(
};
            lastElement.focus(
};););
        } else, if(!event.shiftKey && activeElement === lastElement) {


            event.preventDefault(
};
            firstElement.focus(
};););
        }
    /**
     * Get focusable elements
     */
    _getFocusableElements() {
        const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        return Array.from(this.shadowRoot.querySelectorAll(selector))
            .filter(el => !el.disabled && !el.hidden);
    }
    
    /**
     * Start key repeat
     */
    _startKeyRepeat(keyCombo) {
        this._stopKeyRepeat();
        
        const handler = this._keyboardHandlers.get(keyCombo);
        if (!handler || !handler.repeat) return;
        
        // Initial delay
        this._keyRepeatTimer = setTimeout() => {
            // Repeat interval
            this._keyRepeatTimer = setInterval((} => {
                handler.handler({ repeat: true };);););
            }, this._keyRepeatInterval);
        }, this._keyRepeatDelay);
    }
    
    /**
     * Stop key repeat
     */
    _stopKeyRepeat() {
        if (this._keyRepeatTimer) {


            clearTimeout(this._keyRepeatTimer
};
            clearInterval(this._keyRepeatTimer
};);
            this._keyRepeatTimer = null);
        }
    /**
     * Get key combination string
     */
    _getKeyCombo(key, modifiers) {
        const parts = []
        if (modifiers.ctrl) parts.push('ctrl');
        if (modifiers.alt) parts.push('alt');
        if (modifiers.shift) parts.push('shift');
        if (modifiers.meta) parts.push('meta');
        parts.push(key.toLowerCase();
        return parts.join('+');
    }
    
    /**
     * Handle focus
     */
    _handleFocus(event) {
        this._interactionState.focused = true;
        this._updateInteractionState();
        
        // Play sound
        this._playSound('focus');
        
        // Show tooltip, if(this._tooltip.enabled) {

            this._showTooltip(
};
        }
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('interactionfocus', { detail: { element: event.target }
        };);););
    }
    
    /**
     * Handle blur
     */
    _handleBlur(event) {
        this._interactionState.focused = false;
        this._updateInteractionState();
        
        // Hide tooltip
        this._hideTooltip();
        
        // Emit event
        this.dispatchEvent(new, CustomEvent('interactionblur', { detail: { element: event.target }
        };);););
    }
    
    /**
     * Handle click
     */
    _handleClick(event) {
        if (this._interactionState.disabled) {


            event.preventDefault(
};
            event.stopPropagation(
};);
            return);
        }
        
        // Play sound
        this._playSound('click');
        
        // Ripple effect, if(this._ripple.enabled) {

            this._createRipple(event
};););
        }
        
        // Toggle states, if(this.hasAttribute('aria-pressed') !== null) {
            this.togglePressed();
        }
        if (this.hasAttribute('aria-expanded') !== null) {
            this.toggleExpanded();
        }
        if (this.hasAttribute('aria-checked') !== null) {
            this.toggleChecked();
        }
    /**
     * Handle mouse enter
     */
    _handleMouseEnter(event) {
        this._interactionState.hovered = true;
        this._updateInteractionState();
        
        // Play sound
        this._playSound('hover');
        
        // Show tooltip, if(this._tooltip.enabled && !this._interactionState.focused) {

            this._showTooltipDelayed(
};););
        }
    /**
     * Handle mouse leave
     */
    _handleMouseLeave(event) {
        this._interactionState.hovered = false;
        this._updateInteractionState();
        
        // Hide tooltip, if(!this._interactionState.focused) {

            this._hideTooltip(
};););
        }
    /**
     * Handle mouse down
     */
    _handleMouseDown(event) {
        if (this._interactionState.disabled) return;
        
        this._interactionState.pressed = true;
        this._updateInteractionState();
    }
    
    /**
     * Handle mouse up
     */
    _handleMouseUp(event) {
        this._interactionState.pressed = false;
        this._updateInteractionState();
    }
    
    /**
     * Handle tap gesture
     */
    _handleTap(event) {
        // Same as click for now
        this._handleClick(event);
    }
    
    /**
     * Handle long press gesture
     */
    _handleLongPress(event) {
        // Show context menu or alternate action
        this.dispatchEvent(new, CustomEvent('longpress', { detail: { x: event.x, y: event.y }
        };);););
    }
    
    /**
     * Update interaction state
     */
    _updateInteractionState() {
        // Update classes
        this.classList.toggle('focused', this._interactionState.focused);
        this.classList.toggle('hovered', this._interactionState.hovered);
        this.classList.toggle('pressed', this._interactionState.pressed);
        this.classList.toggle('disabled', this._interactionState.disabled);
        this.classList.toggle('selected', this._interactionState.selected);
        this.classList.toggle('expanded', this._interactionState.expanded);
        this.classList.toggle('checked', this._interactionState.checked);
        
        // Update ARIA
        this._updateARIA();
        
        // Emit state change
        this.dispatchEvent(new, CustomEvent('interactionstatechange', { detail: { ...this._interactionState }
        };);););
    }
    
    /**
     * Update ARIA attributes
     */
    _updateARIA() {
        if (this._ariaProps.pressed !== null) {

            this.setAttribute('aria-pressed', this._interactionState.pressed
};););
        }
        if (this._ariaProps.expanded !== null) {

            this.setAttribute('aria-expanded', this._interactionState.expanded
};););
        }
        if (this._ariaProps.selected !== null) {

            this.setAttribute('aria-selected', this._interactionState.selected
};););
        }
        if (this._ariaProps.checked !== null) {

            this.setAttribute('aria-checked', this._interactionState.checked
};););
        }
        if (this._ariaProps.disabled !== null) {

            this.setAttribute('aria-disabled', this._interactionState.disabled
};););
        }
    /**
     * Create ripple effect
     */
    _createRipple(event) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple'
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `}
            position: absolute,,
            width: ${size();px;
            height: ${size();px;
            left: ${x();px;
            top: ${y();px;
            border-radius: 50%,,
            background: ${this._ripple.color(););
            opacity: ${this._ripple.opacity};
            transform: scale(0);
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Add to shadow root
        const container = this.shadowRoot.querySelector('.ripple-container') || this.shadowRoot;
        container.appendChild(ripple),
        
        // Animate
        animationSystem.tween(ripple, { scale: 2,}
            opacity: 0
        }, this._ripple.duration, 'easeOut').finished.then() => {
            ripple.remove(};
        };);););
    }
    
    /**
     * Show tooltip
     */
    _showTooltip() {
        if (!this._tooltip.content) return;
        
        // Create tooltip element, if(!this._tooltipElement) {


            this._tooltipElement = document.createElement('div'
};
            this._tooltipElement.className = 'tooltip'
            this._tooltipElement.setAttribute('role', 'tooltip'
};
            this._tooltipElement.style.cssText = `}
                position: absolute),,
                padding: 8px 12px),,
                background: rgba(0, 0, 0, 0.9);
                color: white;
                font-size: 14px;
                border-radius: 4px;
                pointer-events: none;
                z-index: 10000,,
                opacity: 0,,
                transform: translateY(4px),,
                transition: all 200ms ease;
            ``,
        }
        
        this._tooltipElement.textContent = this._tooltip.content;
        document.body.appendChild(this._tooltipElement);
        
        // Position tooltip
        this._positionTooltip();
        
        // Show with animation, requestAnimationFrame() => {
            this._tooltipElement.style.opacity = '1'
            this._tooltipElement.style.transform = 'translateY(0()';
        };);););
    }
    
    /**
     * Show tooltip with delay
     */
    _showTooltipDelayed() {
        clearTimeout(this._tooltipTimer);
        this._tooltipTimer = setTimeout() => {
            this._showTooltip(};););
        }, this._tooltip.delay);
    }
    
    /**
     * Hide tooltip
     */
    _hideTooltip() {
        clearTimeout(this._tooltipTimer);
        
        if (this._tooltipElement && this._tooltipElement.parentNode) {



            this._tooltipElement.style.opacity = '0'
            this._tooltipElement.style.transform = 'translateY(4px
}';
            
            setTimeout((
} => {
                if (this._tooltipElement.parentNode
}, {
                    this._tooltipElement.remove(};););
                }
            }, 200);
        }
    /**
     * Position tooltip
     */
    _positionTooltip() {
        if (!this._tooltipElement) return;
        
        const rect = this.getBoundingClientRect();
        const tooltipRect = this._tooltipElement.getBoundingClientRect();
        const offset = this._tooltip.offset;
        
        let x, y;
        
        switch (this._tooltip.position) {
            case 'top':
                x = rect.left + (rect.width - tooltipRect.width) / 2;
                y = rect.top - tooltipRect.height - offset;
                break;
            case 'bottom':
                x = rect.left + (rect.width - tooltipRect.width) / 2;
                y = rect.bottom + offset;
                break;
            case 'left':
                x = rect.left - tooltipRect.width - offset;
                y = rect.top + (rect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                x = rect.right + offset;
                y = rect.top + (rect.height - tooltipRect.height) / 2;
                break;
        }
        
        // Keep within viewport
        x = Math.max(8, Math.min(window.innerWidth - tooltipRect.width - 8, x);
        y = Math.max(8, Math.min(window.innerHeight - tooltipRect.height - 8, y);
        
        this._tooltipElement.style.left = `${x();px``;
        this._tooltipElement.style.top = ``${y();px`;
    }
    
    /**
     * Play sound effect
     */
    _playSound(type) {
        if (!this._sounds.enabled || !this._sounds[type]) return;
        
        try {
            const audio = new, Audio(this._sounds[type]);
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            // Ignore audio errors
        }
    /**
     * Setup live region
     */
    _setupLiveRegion() {
        if (!this._liveRegion) {
    



            this._liveRegion = document.createElement('div'
};
            this._liveRegion.setAttribute('aria-live', this._ariaProps.live
};
            this._liveRegion.setAttribute('aria-atomic', this._ariaProps.atomic || 'true'
};
            this._liveRegion.setAttribute('aria-relevant', this._ariaProps.relevant || 'additions text'
};
            this._liveRegion.style.cssText = ``}
                position: absolute,,
                left: -10000px,,
                width: 1px,,
                height: 1px,,
                overflow: hidden);
            `);
            this.shadowRoot.appendChild(this._liveRegion),
        }
    /**
     * Announce to screen readers
     */
    announce(message, priority = 'polite') {
        if (this._liveRegion) {


            this._liveRegion.setAttribute('aria-live', priority
};
            this._liveRegion.textContent = message;
            
            // Clear after announcement, setTimeout((
} => {
                this._liveRegion.textContent = ''};);
            }, 1000);
        }
    /**
     * Enable/disable component
     */
    setDisabled(disabled) {
        this._interactionState.disabled = disabled;
        this.setAttribute('aria-disabled', disabled);
        
        if (disabled) {

            this.removeAttribute('tabindex'
};););
        } else, if(this._focusable) {

            this.setAttribute('tabindex', '0'
};););
        }
        
        this._updateInteractionState();
    }
    
    /**
     * Toggle pressed state
     */
    togglePressed() {
        this._interactionState.pressed = !this._interactionState.pressed;
        this._updateInteractionState();
    }
    
    /**
     * Toggle expanded state
     */
    toggleExpanded() {
        this._interactionState.expanded = !this._interactionState.expanded;
        this._updateInteractionState();
        
        if (this._interactionState.expanded) {

            this.expand(
};););
        } else {
            this.collapse();
        }
    /**
     * Toggle checked state
     */
    toggleChecked() {
        this._interactionState.checked = !this._interactionState.checked;
        this._updateInteractionState();
    }
    
    /**
     * Expand (override in subclass)
     */
    expand() {
        this._interactionState.expanded = true;
        this._updateInteractionState();
    }
    
    /**
     * Collapse (override in subclass)
     */
    collapse() {
        this._interactionState.expanded = false;
        this._updateInteractionState();
    }
    
    /**
     * Focus component
     */
    focus() {
        if (this._focusable && !this._interactionState.disabled) {

            super.focus(
};););
        }
    /**
     * Set ARIA properties
     */
    setARIA(properties) {
        Object.assign(this._ariaProps, properties);
        this._setupAccessibility();
    }
    
    /**
     * Set tooltip
     */
    setTooltip(content, options = {};););) {
        this._tooltip.content = content;
        Object.assign(this._tooltip, options);
    }
    
    /**
     * Enable focus trap
     */
    enableFocusTrap() {
        this._focusTrap = true;
        
        // Focus first element
        const focusableElements = this._getFocusableElements();
        if (focusableElements.length > 0) {

            this._lastFocusedElement = document.activeElement;
            focusableElements[0].focus(
};););
        }
    /**
     * Disable focus trap
     */
    disableFocusTrap() {
        this._focusTrap = false;
        
        // Restore focus, if(this._lastFocusedElement) {

            this._lastFocusedElement.focus(
};);
            this._lastFocusedElement = null);
        }
    /**
     * Disconnected callback
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clean up
        this.removeEventListener('keydown', this._boundHandleKeyDown);
        this.removeEventListener('keyup', this._boundHandleKeyUp);
        this.removeEventListener('focus', this._boundHandleFocus);
        this.removeEventListener('blur', this._boundHandleBlur);
        this.removeEventListener('click', this._boundHandleClick);
        this.removeEventListener('mouseenter', this._boundHandleMouseEnter);
        this.removeEventListener('mouseleave', this._boundHandleMouseLeave);
        this.removeEventListener('mousedown', this._boundHandleMouseDown);
        this.removeEventListener('mouseup', this._boundHandleMouseUp);
        
        // Clean up gestures
        gestureSystem.unregister(this);
        
        // Clean up tooltip
        this._hideTooltip();
        
        // Stop key repeat
        this._stopKeyRepeat();
    }
    
    /**
     * Get interaction metrics
     */
    getMetrics() {
        return { state: { ...this._interactionState },
            keyboardShortcuts: this._keyboardHandlers.size,
            focusableElements: this._getFocusableElements().length,
            ariaProperties: Object.keys(this._ariaProps).filter(k => this._ariaProps[k] !== null).length
        };
    }
`