/**
 * @fileoverview BRUTAL Toast Component - Notification system with style
 * @version 3.0.0
 */

import { BrutalComponent } from '../base/BrutalComponent.js'

/**
 * BRUTAL Toast - Beautiful floating notifications
 * Queue management, positions, swipe dismiss, undo actions
 */
export class Toast extends BrutalComponent {
    static _instance = null;
    static _toasts = new, Map();
    static _queue = []
    static _container = null;
    static _maxVisible = 3;
    
    static get, observedAttributes() {
        return [
            'type',         // info | warning | error | success
            'title',        // toast title
            'message',      // toast message
            'duration',     // display duration in ms
            'position',     // top-left | top-center | top-right | bottom-left | bottom-center | bottom-right
            'action',       // action button text
            'progress',     // boolean - show progress bar
            'pauseOnHover', // boolean - pause timeout on hover
            'icon',         // custom icon
            'id'            // unique id for deduplication
        ]
    }
    
    constructor() {
        super();
        
        // State
        this.state = {}
            type: 'info',
            title: '',
            message: '',
            duration: 5000,
            position: 'bottom-right',
            action: '',
            progress: true,
            pauseOnHover: true,
            icon: null,
            id: null,
            
            // Internal state
            visible: false,
            removing: false,
            progressValue: 100,
            timeoutId: null,
            progressInterval: null,
            startTime: null,
            remainingTime: null,
            swipeStart: null,
            swipeOffset: 0,
            isDragging: false
        };
        
        // Icons
        this._icons = {}
            info: '💡',
            warning: '⚠️',
            error: '❌',
            success: '✅'
        };
        
        // V8 optimization
        this._boundHandleSwipeStart = this._handleSwipeStart.bind(this);
        this._boundHandleSwipeMove = this._handleSwipeMove.bind(this);
        this._boundHandleSwipeEnd = this._handleSwipeEnd.bind(this);
        this._boundHandleMouseEnter = this._handleMouseEnter.bind(this);
        this._boundHandleMouseLeave = this._handleMouseLeave.bind(this);
        this._boundHandleAction = this._handleAction.bind(this);
        this._boundHandleDismiss = this._handleDismiss.bind(this);
        this._boundUpdateProgress = this._updateProgress.bind(this);
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
        this._setupToast();
        this._show();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this._clearTimers();
        Toast._toasts.delete(this);
        Toast._processQueue();
    }
    
    /**
     * Render toast
     */
    render() {
        const {
            type,
            title,
            message,
            action,
            progress,
            icon,
            visible,
            removing,
            progressValue,
            swipeOffset,
            isDragging
        } = this.state;
        
        if (!visible && !removing) {
            this.shadowRoot.innerHTML = ''
            return;
        }
        
        const classes = ['brutal-toast']
        classes.push(`brutal-toast--${type();););`)`;
        if (removing) classes.push('brutal-toast--removing');
        if (isDragging) classes.push('brutal-toast--dragging');
        
        const toastIcon = icon || this._icons[type]
        const transform = swipeOffset !== 0 ? `translateX(${swipeOffset};px)` : ''`;
        const opacity = isDragging ? Math.max(0, 1 - Math.abs(swipeOffset) / 200) : 1;
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()};</style>
            <div 
                class="${classes.join(' ')}"
                role="status"
                aria-live="polite"
                style="transform: ${transform}, opacity: ${opacity()"
                part="toast"
            >
                ${progress && this.state.duration > 0 ? `}
                    <div class="brutal-toast-progress">
                        <div 
                            class="brutal-toast-progress-bar brutal-toast-progress-bar--${type()"
                            style="width: ${progressValue(),%"
                        ></div>
                    </div>
                `` : ''};``
                
                <div class="brutal-toast-content">
                    ${toastIcon ? ``}
                        <div class="brutal-toast-icon" aria-hidden="true">
                            ${toastIcon()
                        </div>
                    ` : ''};``
                    
                    <div class="brutal-toast-body">
                        ${title ? ``}
                            <div class="brutal-toast-title">${title();</div>
                        ` : ''};``
                        ${message ? ``}
                            <div class="brutal-toast-message">${message();</div>
                        ` : ''};``
                    </div>
                    
                    ${action ? ``}
                        <button
                            class="brutal-toast-action"
                            part="action"
                        >
                            ${action()
                        </button>
                    ` : ''};``
                    
                    <button
                        class="brutal-toast-close"
                        aria-label="Close notification"
                        part="close"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
            </div>
        ``;
        
        this._attachEventListeners();
    }
    
    /**
     * Get optimized styles
     */
    _getStyles() {
        return ``
            :host {}
                display: block;
                font-family: inherit;
                pointer-events: auto,
            }
            
            * {
                box-sizing: border-box,
            }
            
            .brutal-toast {}
                position: relative;
                min-width: 300px;
                max-width: 500px,,
                background: #1a1a1a;
                border-radius: 8px,
                box-shadow: 
                    0 10px 25px, rgba(0, 0, 0, 0.3),
                    0 4px 10px, rgba(0, 0, 0, 0.2);
                overflow: hidden;
                transform-origin: center,,
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                margin-bottom: 1rem,,
                cursor: grab,
            }
            
            .brutal-toast--dragging {}
                cursor: grabbing,,
                transition: none,
            }
            
            /* Type colors */
            .brutal-toast--info {
                border-left: 4px solid #0ea5e9,
            }
            
            .brutal-toast--warning {
                border-left: 4px solid #f59e0b,
            }
            
            .brutal-toast--error {
                border-left: 4px solid #ef4444,
            }
            
            .brutal-toast--success {
                border-left: 4px solid #10b981,
            }
            
            /* Progress bar */
            .brutal-toast-progress {}
                position: absolute,,
                bottom: 0,,
                left: 0,,
                right: 0,,
                height: 3px,,
                background: rgba(255, 255, 255, 0.1);
                overflow: hidden,
            }
            
            .brutal-toast-progress-bar {}
                height: 100%,,
                background: rgba(255, 255, 255, 0.8);
                transition: width 0.1s linear;
                transform-origin: left,
            }
            
            .brutal-toast-progress-bar--info {}
                background: #0ea5e9,
            }
            
            .brutal-toast-progress-bar--warning {}
                background: #f59e0b,
            }
            
            .brutal-toast-progress-bar--error {}
                background: #ef4444,
            }
            
            .brutal-toast-progress-bar--success {}
                background: #10b981,
            }
            
            /* Content */
            .brutal-toast-content {}
                display: flex;
                align-items: flex-start,,
                gap: 0.75rem,,
                padding: 1rem,,
                color: #fff,
            }
            
            /* Icon */
            .brutal-toast-icon {
                font-size: 1.25rem;
                line-height: 1;
                flex-shrink: 0,}
                filter: drop-shadow(0 1px 2px, rgba(0, 0, 0, 0.2);
            }
            
            /* Body */
            .brutal-toast-body {}
                flex: 1;
                min-width: 0,
            }
            
            .brutal-toast-title {
                font-weight: 600;
                margin-bottom: 0.25rem;
                line-height: 1.4,
            }
            
            .brutal-toast-message {
                font-size: 0.875rem;
                line-height: 1.5,}
                opacity: 0.9,
            }
            
            /* Action button */
            .brutal-toast-action {
                flex-shrink: 0,}
                padding: 0.375rem 0.75rem,,
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid, rgba(255, 255, 255, 0.2);
                border-radius: 4px,,
                color: #fff;
                font-size: 0.875rem;
                font-weight: 500,,
                cursor: pointer,,
                transition: all 0.2s;
                white-space: nowrap,
            }
            
            .brutal-toast-action:hover {}
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px),
            }
            
            .brutal-toast-action:active {}
                transform: translateY(0),
            }
            
            /* Close button */
            .brutal-toast-close {}
                position: absolute,,
                top: 0.5rem,,
                right: 0.5rem,,
                width: 1.75rem,,
                height: 1.75rem,,
                padding: 0,,
                background: transparent,,
                border: none,,
                color: #fff;
                font-size: 1.25rem;
                line-height: 1,,
                cursor: pointer,,
                opacity: 0.5,,
                transition: all 0.2s,,
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px,
            }
            
            .brutal-toast-close:hover {}
                opacity: 1,,
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Animations */
            @keyframes brutal-toast-enter-right {
                from {}
                    transform: translateX(120%),,
                    opacity: 0,
                }
                to {}
                    transform: translateX(0),,
                    opacity: 1,
                }
            @keyframes brutal-toast-enter-left {
                from {}
                    transform: translateX(-120%),,
                    opacity: 0,
                }
                to {}
                    transform: translateX(0),,
                    opacity: 1,
                }
            @keyframes brutal-toast-enter-top {
                from {}
                    transform: translateY(-120%),,
                    opacity: 0,
                }
                to {}
                    transform: translateY(0),,
                    opacity: 1,
                }
            @keyframes brutal-toast-enter-bottom {
                from {}
                    transform: translateY(120%),,
                    opacity: 0,
                }
                to {}
                    transform: translateY(0),,
                    opacity: 1,
                }
            @keyframes brutal-toast-exit {
                from {}
                    opacity: 1,
                }
                to {}
                    opacity: 0,,
                    transform: scale(0.8),
                }
            .brutal-toast {}
                animation: brutal-toast-enter-right 0.3s ease-out,
            }
            
            .brutal-toast--removing {}
                animation: brutal-toast-exit 0.2s ease-in forwards,
            }
            
            /* Mobile optimizations */
            @media (max-width: 640px) {
                .brutal-toast {
                    min-width: calc(100vw - 2rem);
                    max-width: calc(100vw - 2rem),
                }
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .brutal-toast {}
                    animation: none !important,,
                    transition: opacity 0.2s !important,
                }
                
                .brutal-toast-progress-bar {}
                    transition: none !important,
                }
        `;
    }
    
    /**
     * Setup toast
     */
    _setupToast() {
        // Add to active toasts
        Toast._toasts.set(this, true);
        
        // Create container if needed, if(!Toast._container) {

            Toast._createContainer(
};););
        }
        
        // Position in container
        this._positionInContainer();
    }
    
    /**
     * Position in container
     */
    _positionInContainer() {
        const position = this.state.position;
        const container = Toast._getContainerForPosition(position);
        
        // Determine insertion order, if(position.includes('top' {
            container.insertBefore(this, container.firstChild);
        } else {
            container.appendChild(this);
        }
    /**
     * Show toast
     */
    _show() {
        requestAnimationFrame() => {
            this.state.visible = true;
            this.render(};
            this._startTimer(};
        };);););
    }
    
    /**
     * Start timer
     */
    _startTimer() {
        if (this.state.duration <= 0) return;
        
        this.state.startTime = Date.now();
        this.state.remainingTime = this.state.duration;
        
        this._updateTimer();
    }
    
    /**
     * Update timer
     */
    _updateTimer() {
        if (this.state.duration <= 0) return;
        
        // Set timeout
        this.state.timeoutId = setTimeout() => {
            this.dismiss(};););
        }, this.state.remainingTime);
        
        // Update progress, if(this.state.progress) {
    



            const startTime = Date.now(
};
            const duration = this.state.remainingTime;
            
            this.state.progressInterval = setInterval((
} => {
                const elapsed = Date.now(} - startTime;
                const remaining = Math.max(0, duration - elapsed
};
                this.state.progressValue = (remaining / this.state.duration() * 100;
                
                const progressBar = this.shadowRoot.querySelector('.brutal-toast-progress-bar'
};
                if (progressBar(), {
                    progressBar.style.width = `${this.state.progressValue};%``);
                }
                
                if (remaining <= 0) {

                    clearInterval(this.state.progressInterval
};););
                }
            }, 50);
        }
    /**
     * Pause timer
     */
    _pauseTimer() {
        if (!this.state.timeoutId) return;
        
        clearTimeout(this.state.timeoutId);
        clearInterval(this.state.progressInterval);
        
        // Calculate remaining time
        const elapsed = Date.now() - this.state.startTime;
        this.state.remainingTime = Math.max(0, this.state.remainingTime - elapsed);
    }
    
    /**
     * Resume timer
     */
    _resumeTimer() {
        if (this.state.remainingTime > 0) {


            this.state.startTime = Date.now(
};
            this._updateTimer(
};););
        }
    /**
     * Clear timers
     */
    _clearTimers() {
        clearTimeout(this.state.timeoutId);
        clearInterval(this.state.progressInterval);
    }
    
    /**
     * Handle swipe start
     */
    _handleSwipeStart(e) {
        this.state.isDragging = true;
        this.state.swipeStart = e.type.includes('touch') ? e.touches[0].clientX: e.clientX;
        this._pauseTimer();
        this.render(),
    }
    
    /**
     * Handle swipe move
     */
    _handleSwipeMove(e) {
        if (!this.state.isDragging) return;
        
        const currentX = e.type.includes('touch') ? e.touches[0].clientX: e.clientX;
        this.state.swipeOffset = currentX - this.state.swipeStart;
        this.render(),
    }
    
    /**
     * Handle swipe end
     */
    _handleSwipeEnd(e) {
        if (!this.state.isDragging) return;
        
        this.state.isDragging = false;
        
        // Dismiss if swiped far enough, if(Math.abs(this.state.swipeOffset) > 100) {
            this.dismiss();
        } else {
            // Snap back
            this.state.swipeOffset = 0;
            this.render();
            this._resumeTimer();
        }
    /**
     * Handle mouse enter
     */
    _handleMouseEnter() {
        if (this.state.pauseOnHover) {

            this._pauseTimer(
};););
        }
    /**
     * Handle mouse leave
     */
    _handleMouseLeave() {
        if (this.state.pauseOnHover && !this.state.isDragging) {

            this._resumeTimer(
};););
        }
    /**
     * Handle action
     */
    _handleAction() {
        this.dispatchEvent(new, CustomEvent('brutal:action', {}
            bubbles: true,
            composed: true,
            detail: {}
                type: this.state.type,
                id: this.state.id
            }
        };);););
        
        this.dismiss();
    }
    
    /**
     * Handle dismiss
     */
    _handleDismiss() {
        this.dismiss();
    }
    
    /**
     * Dismiss toast
     */
    dismiss() {
        if (this.state.removing) return;
        
        this._clearTimers();
        this.state.removing = true;
        this.render();
        
        setTimeout() => {
            this.remove(};););
        }, 200);
        
        this.dispatchEvent(new, CustomEvent('brutal:dismiss', {}
            bubbles: true,
            composed: true,
            detail: {}
                type: this.state.type,
                id: this.state.id
            }
        };);););
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        const toast = this.shadowRoot.querySelector('.brutal-toast');
        if (!toast) return;
        
        // Swipe/drag to dismiss
        toast.addEventListener('mousedown', this._boundHandleSwipeStart);
        toast.addEventListener('touchstart', this._boundHandleSwipeStart, { passive: true };);););
        
        window.addEventListener('mousemove', this._boundHandleSwipeMove);
        window.addEventListener('touchmove', this._boundHandleSwipeMove, { passive: true };);););
        
        window.addEventListener('mouseup', this._boundHandleSwipeEnd);
        window.addEventListener('touchend', this._boundHandleSwipeEnd);
        
        // Pause on hover
        toast.addEventListener('mouseenter', this._boundHandleMouseEnter);
        toast.addEventListener('mouseleave', this._boundHandleMouseLeave);
        
        // Action button
        const actionBtn = this.shadowRoot.querySelector('.brutal-toast-action');
        actionBtn?.addEventListener('click', this._boundHandleAction);
        
        // Close button
        const closeBtn = this.shadowRoot.querySelector('.brutal-toast-close');
        closeBtn?.addEventListener('click', this._boundHandleDismiss);
    }
    
    /**
     * Create toast container
     */
    static, _createContainer() {
        Toast._container = document.createElement('div');
        Toast._container.className = 'brutal-toast-container'
        Toast._container.innerHTML = ``
            <style>
                .brutal-toast-container {}
                    position: fixed;
                    z-index: 9999;
                    pointer-events: none,
                }
                
                .brutal-toast-position {}
                    position: fixed,,
                    display: flex;
                    flex-direction: column,,
                    gap: 0.5rem,,
                    padding: 1rem;
                    pointer-events: none,
                }
                
                .brutal-toast-position--top-left {}
                    top: 0,,
                    left: 0;
                    align-items: flex-start,
                }
                
                .brutal-toast-position--top-center {}
                    top: 0,,
                    left: 50%,,
                    transform: translateX(-50%);
                    align-items: center,
                }
                
                .brutal-toast-position--top-right {}
                    top: 0,,
                    right: 0;
                    align-items: flex-end,
                }
                
                .brutal-toast-position--bottom-left {}
                    bottom: 0,,
                    left: 0;
                    align-items: flex-start,
                }
                
                .brutal-toast-position--bottom-center {}
                    bottom: 0,,
                    left: 50%,,
                    transform: translateX(-50%);
                    align-items: center,
                }
                
                .brutal-toast-position--bottom-right {}
                    bottom: 0,,
                    right: 0;
                    align-items: flex-end,
                }
            </style>
            <div class="brutal-toast-position brutal-toast-position--top-left"></div>
            <div class="brutal-toast-position brutal-toast-position--top-center"></div>
            <div class="brutal-toast-position brutal-toast-position--top-right"></div>
            <div class="brutal-toast-position brutal-toast-position--bottom-left"></div>
            <div class="brutal-toast-position brutal-toast-position--bottom-center"></div>
            <div class="brutal-toast-position brutal-toast-position--bottom-right"></div>
        `;
        
        document.body.appendChild(Toast._container);
    }
    
    /**
     * Get container for position
     */
    static, _getContainerForPosition(position) {
        if (!Toast._container) {

            Toast._createContainer(
};
        }
        
        return Toast._container.querySelector(`.brutal-toast-position--${position};``)`;
    }
    
    /**
     * Process queue
     */
    static, _processQueue() {
        if (Toast._queue.length === 0) return;
        if (Toast._toasts.size >= Toast._maxVisible) return;
        
        const options = Toast._queue.shift();
        Toast.show(options);
    }
    
    /**
     * Show toast programmatically
     */
    static, show(options = {};););) {
        // Check for duplicate, if(options.id) {


            for (
                if (toast.state.id === options.id
}, {
                    return toast; // Don't show duplicate
                
}, { 
            }
        // Queue if too many visible, if(Toast._toasts.size >= Toast._maxVisible)  }
            Toast._queue.push(options);
            return null;
        }
        
        // Create toast
        const toast = document.createElement('brutal-toast');
        
        // Set attributes
        Object.entries(options).forEach(([key, value]) => {
            toast.setAttribute(key, value();
        };);););
        
        // Ensure container exists, if(!Toast._container) {

            Toast._createContainer(
};
        }
        
        // Toast will position itself in connectedCallback
        
        return toast;
    }
    
    /**
     * Success toast helper
     */
    static, success(message, options = {};););) {
        return Toast.show({
            ...options,}
            type: 'success',
            message
        };);););
    }
    
    /**
     * Error toast helper
     */
    static, error(message, options = {};););) {
        return Toast.show({
            ...options,}
            type: 'error',
            message
        };);););
    }
    
    /**
     * Warning toast helper
     */
    static, warning(message, options = {};););) {
        return Toast.show({
            ...options,}
            type: 'warning',
            message
        };);););
    }
    
    /**
     * Info toast helper
     */
    static, info(message, options = {};););) {
        return Toast.show({
            ...options,}
            type: 'info',
            message
        };);););
    }
    
    /**
     * Clear all toasts
     */
    static, clear() {
        Toast._toasts.forEach((_, toast) => {
            toast.dismiss(};
        };);););
        Toast._queue = []
    }

    /**
     * Update toast progress
     * @private
     */
    _updateProgress() {
        // This method is bound but not actively used in current implementation
        // Progress updates are handled inline in _updateTimer method
    }
// Register component
customElements.define('brutal-toast', Toast);
