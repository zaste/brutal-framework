/**
 * BRUTAL V3 - Notifications Component
 * GPU-accelerated notifications with particle effects
 * Zero dependencies, stack management, smooth animations
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';
import { html } from '../../01-core/Template.js';
import { animationSystem } from '../../02-performance/08-AnimationSystem.js';

export class Notifications extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {
            position: 'top-right', // top-right, top-left, bottom-right, bottom-left, center
            animation: 'slide', // slide, fade, bounce, explode
            duration: 5000, // auto-dismiss time
            maxStack: 5,
            spacing: 10,
            particleEffects: true,
            sounds: false,
            theme: 'brutal' // brutal, minimal, neon, glassmorphic
        };
        
        // State
        this._notifications = [];
        this._queue = [];
        this._container = null;
        this._particleCanvas = null;
        this._particleCtx = null;
        this._particles = [];
        this._animationFrame = null;
        this._notificationId = 0;
        
        // Animation presets
        this._animationPresets = {
            slide: {
                enter: { transform: 'translateX(400px)', opacity: 0 },
                active: { transform: 'translateX(0)', opacity: 1 },
                exit: { transform: 'translateX(400px)', opacity: 0 }
            },
            fade: {
                enter: { transform: 'scale(0.8)', opacity: 0 },
                active: { transform: 'scale(1)', opacity: 1 },
                exit: { transform: 'scale(0.8)', opacity: 0 }
            },
            bounce: {
                enter: { transform: 'translateY(-50px) scale(0.7)', opacity: 0 },
                active: { transform: 'translateY(0) scale(1)', opacity: 1 },
                exit: { transform: 'translateY(50px) scale(0.7)', opacity: 0 }
            },
            explode: {
                enter: { transform: 'scale(0)', opacity: 0 },
                active: { transform: 'scale(1)', opacity: 1 },
                exit: { transform: 'scale(1.5)', opacity: 0 }
            }
        };
        
        // Themes
        this._themes = {
            brutal: {
                background: 'linear-gradient(135deg, #000 0%, #111 100%)',
                border: '2px solid #0f0',
                text: '#0f0',
                shadow: '0 0 20px rgba(0, 255, 0, 0.5)'
            },
            minimal: {
                background: '#fff',
                border: '1px solid #e0e0e0',
                text: '#333',
                shadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            },
            neon: {
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: '2px solid #00ffff',
                text: '#00ffff',
                shadow: '0 0 30px rgba(0, 255, 255, 0.6)'
            },
            glassmorphic: {
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                text: '#fff',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                backdrop: 'blur(10px)'
            }
        };
        
        // Sound URLs
        this._soundUrls = {
            show: 'data:audio/wav;base64,...', // Placeholder
            dismiss: 'data:audio/wav;base64,...',
            error: 'data:audio/wav;base64,...',
            success: 'data:audio/wav;base64,...'
        };
    }
    
    template() {
        return html`
            <div class="notifications-wrapper">
                <canvas class="particle-canvas"></canvas>
                <div class="notifications-container ${this._config.position} ${this._config.theme}">
                    ${this._notifications.map(notification => this._renderNotification(notification)).join('')}
                </div>
            </div>
            
            <style>
                :host {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 9999;
                    isolation: isolate;
                }
                
                .notifications-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                
                .particle-canvas {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                
                .notifications-container {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing, 10px);
                    padding: 20px;
                    pointer-events: none;
                    max-height: 100vh;
                    overflow: hidden;
                }
                
                /* Position variants */
                .notifications-container.top-right {
                    top: 0;
                    right: 0;
                    align-items: flex-end;
                }
                
                .notifications-container.top-left {
                    top: 0;
                    left: 0;
                    align-items: flex-start;
                }
                
                .notifications-container.bottom-right {
                    bottom: 0;
                    right: 0;
                    align-items: flex-end;
                    flex-direction: column-reverse;
                }
                
                .notifications-container.bottom-left {
                    bottom: 0;
                    left: 0;
                    align-items: flex-start;
                    flex-direction: column-reverse;
                }
                
                .notifications-container.center {
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    align-items: center;
                }
                
                /* Notification base */
                .notification {
                    position: relative;
                    min-width: 300px;
                    max-width: 400px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    pointer-events: all;
                    cursor: pointer;
                    transform-origin: center;
                    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform, opacity;
                }
                
                /* Theme styles */
                .brutal .notification {
                    background: var(--bg, linear-gradient(135deg, #000 0%, #111 100%));
                    border: var(--border, 2px solid #0f0);
                    color: var(--text, #0f0);
                    box-shadow: var(--shadow, 0 0 20px rgba(0, 255, 0, 0.5));
                }
                
                .minimal .notification {
                    background: var(--bg, #fff);
                    border: var(--border, 1px solid #e0e0e0);
                    color: var(--text, #333);
                    box-shadow: var(--shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
                }
                
                .neon .notification {
                    background: var(--bg, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
                    border: var(--border, 2px solid #00ffff);
                    color: var(--text, #00ffff);
                    box-shadow: var(--shadow, 0 0 30px rgba(0, 255, 255, 0.6));
                }
                
                .glassmorphic .notification {
                    background: var(--bg, rgba(255, 255, 255, 0.1));
                    border: var(--border, 1px solid rgba(255, 255, 255, 0.2));
                    color: var(--text, #fff);
                    box-shadow: var(--shadow, 0 8px 32px rgba(0, 0, 0, 0.1));
                    backdrop-filter: var(--backdrop, blur(10px));
                    -webkit-backdrop-filter: var(--backdrop, blur(10px));
                }
                
                /* Notification types */
                .notification.success {
                    --border-color: #0f0;
                    --icon-color: #0f0;
                }
                
                .notification.error {
                    --border-color: #f00;
                    --icon-color: #f00;
                }
                
                .notification.warning {
                    --border-color: #ff0;
                    --icon-color: #ff0;
                }
                
                .notification.info {
                    --border-color: #00f;
                    --icon-color: #00f;
                }
                
                /* Notification content */
                .notification-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }
                
                .notification-icon {
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                    color: var(--icon-color, currentColor);
                }
                
                .notification-body {
                    flex: 1;
                    min-width: 0;
                }
                
                .notification-title {
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 4px;
                    line-height: 1.4;
                }
                
                .notification-message {
                    font-size: 14px;
                    line-height: 1.5;
                    opacity: 0.9;
                }
                
                .notification-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .notification-action {
                    padding: 4px 12px;
                    background: transparent;
                    border: 1px solid currentColor;
                    border-radius: 4px;
                    color: currentColor;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 200ms ease;
                }
                
                .notification-action:hover {
                    background: currentColor;
                    color: var(--bg-color, #000);
                }
                
                .notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    color: currentColor;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 200ms ease;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                /* Progress bar */
                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 0 0 8px 8px;
                    overflow: hidden;
                }
                
                .notification-progress-bar {
                    height: 100%;
                    background: currentColor;
                    transform-origin: left;
                    animation: progress-countdown var(--duration, 5s) linear forwards;
                }
                
                @keyframes progress-countdown {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                /* Animations */
                .notification-enter {
                    animation: notification-enter 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                .notification-exit {
                    animation: notification-exit 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                @keyframes notification-enter {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes notification-exit {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
                
                /* Hover effects */
                .notification:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-hover, 0 0 30px rgba(0, 255, 0, 0.7));
                }
                
                .notification:hover .notification-progress-bar {
                    animation-play-state: paused;
                }
                
                /* Mobile responsiveness */
                @media (max-width: 480px) {
                    .notifications-container {
                        padding: 10px;
                    }
                    
                    .notification {
                        min-width: calc(100vw - 20px);
                        max-width: calc(100vw - 20px);
                    }
                }
            </style>
        `.content;
    }
    
    _renderNotification(notification) {
        const theme = this._themes[this._config.theme];
        const icon = this._getIcon(notification.type);
        
        return `
            <div class="notification ${notification.type} notification-enter"
                 data-id="${notification.id}"
                 style="--duration: ${notification.duration}ms; --bg: ${theme.background}; --border: ${theme.border}; --text: ${theme.text}; --shadow: ${theme.shadow}; ${theme.backdrop ? `--backdrop: ${theme.backdrop}` : ''}">
                <div class="notification-content">
                    ${icon ? `<div class="notification-icon">${icon}</div>` : ''}
                    <div class="notification-body">
                        ${notification.title ? `<div class="notification-title">${this._escapeHtml(notification.title)}</div>` : ''}
                        <div class="notification-message">${this._escapeHtml(notification.message)}</div>
                        ${notification.actions && notification.actions.length > 0 ? `
                            <div class="notification-actions">
                                ${notification.actions.map((action, index) => `
                                    <button class="notification-action" 
                                            data-action="custom-action" 
                                            data-notification-id="${notification.id}"
                                            data-action-index="${index}">
                                        ${this._escapeHtml(action.label)}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <button class="notification-close" 
                        data-action="close" 
                        data-notification-id="${notification.id}"
                        aria-label="Close notification">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                    </svg>
                </button>
                ${notification.duration && notification.duration !== Infinity ? `
                    <div class="notification-progress">
                        <div class="notification-progress-bar"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    _getIcon(type) {
        const icons = {
            success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        return icons[type] || '';
    }
    
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame(() => {
            // Get container
            this._container = this.shadowRoot.querySelector('.notifications-container');
            
            // Initialize particle canvas
            if (this._config.particleEffects) {
                this._initParticles();
            }
            
            // Setup event delegation
            this.shadowRoot.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;
                
                const action = target.dataset.action;
                const notificationId = parseInt(target.dataset.notificationId);
                
                switch (action) {
                    case 'close':
                        this.dismiss(notificationId);
                        break;
                    case 'custom-action':
                        const actionIndex = parseInt(target.dataset.actionIndex);
                        this._handleCustomAction(notificationId, actionIndex);
                        break;
                }
            });
            
            // Handle hover to pause auto-dismiss
            this.shadowRoot.addEventListener('mouseenter', (e) => {
                const notification = e.target.closest('.notification');
                if (notification) {
                    const id = parseInt(notification.dataset.id);
                    this._pauseAutoDismiss(id);
                }
            }, true);
            
            this.shadowRoot.addEventListener('mouseleave', (e) => {
                const notification = e.target.closest('.notification');
                if (notification) {
                    const id = parseInt(notification.dataset.id);
                    this._resumeAutoDismiss(id);
                }
            }, true);
        });
    }
    
    _initParticles() {
        this._particleCanvas = this.shadowRoot.querySelector('.particle-canvas');
        this._particleCtx = this._particleCanvas.getContext('2d');
        
        // Set canvas size
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
        
        // Start animation loop
        this._animateParticles();
    }
    
    _resizeCanvas() {
        if (!this._particleCanvas) return;
        
        const rect = this.getBoundingClientRect();
        this._particleCanvas.width = rect.width;
        this._particleCanvas.height = rect.height;
    }
    
    _animateParticles() {
        if (!this._particleCtx) return;
        
        // Clear canvas
        this._particleCtx.clearRect(0, 0, this._particleCanvas.width, this._particleCanvas.height);
        
        // Update and draw particles
        for (let i = this._particles.length - 1; i >= 0; i--) {
            const particle = this._particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.life -= particle.decay;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this._particles.splice(i, 1);
                continue;
            }
            
            // Draw particle
            this._particleCtx.save();
            this._particleCtx.globalAlpha = particle.life;
            this._particleCtx.fillStyle = particle.color;
            this._particleCtx.beginPath();
            this._particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this._particleCtx.fill();
            this._particleCtx.restore();
        }
        
        // Continue animation
        this._animationFrame = requestAnimationFrame(() => this._animateParticles());
    }
    
    _createParticles(x, y, type = 'default') {
        if (!this._config.particleEffects || !this._particleCtx) return;
        
        const colors = {
            success: ['#0f0', '#0a0', '#050'],
            error: ['#f00', '#a00', '#500'],
            warning: ['#ff0', '#aa0', '#550'],
            info: ['#00f', '#00a', '#005'],
            default: ['#fff', '#aaa', '#555']
        };
        
        const particleColors = colors[type] || colors.default;
        const particleCount = type === 'explode' ? 50 : 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 2 + Math.random() * 4;
            
            this._particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - Math.random() * 2,
                size: 2 + Math.random() * 3,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                gravity: 0.1
            });
        }
    }
    
    show(message, options = {}) {
        const notification = {
            id: ++this._notificationId,
            message,
            title: options.title || null,
            type: options.type || 'info',
            duration: options.duration !== undefined ? options.duration : this._config.duration,
            actions: options.actions || [],
            data: options.data || {},
            timestamp: Date.now(),
            paused: false,
            timer: null
        };
        
        // Add to queue if at max stack
        if (this._notifications.length >= this._config.maxStack) {
            this._queue.push(notification);
            return notification.id;
        }
        
        // Add to active notifications
        this._notifications.push(notification);
        this.render();
        
        // Get notification element after render
        requestAnimationFrame(() => {
            const element = this.shadowRoot.querySelector(`[data-id="${notification.id}"]`);
            if (element) {
                // Create particles at notification position
                const rect = element.getBoundingClientRect();
                const containerRect = this.getBoundingClientRect();
                this._createParticles(
                    rect.left - containerRect.left + rect.width / 2,
                    rect.top - containerRect.top + rect.height / 2,
                    notification.type
                );
                
                // Play sound
                if (this._config.sounds) {
                    this._playSound(notification.type);
                }
                
                // Setup auto-dismiss
                if (notification.duration && notification.duration !== Infinity) {
                    notification.timer = setTimeout(() => {
                        this.dismiss(notification.id);
                    }, notification.duration);
                }
            }
        });
        
        // Emit event
        this.dispatchEvent(new CustomEvent('show', {
            detail: { notification }
        }));
        
        return notification.id;
    }
    
    dismiss(id) {
        const index = this._notifications.findIndex(n => n.id === id);
        if (index === -1) return;
        
        const notification = this._notifications[index];
        
        // Clear timer
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        
        // Get element for animation
        const element = this.shadowRoot.querySelector(`[data-id="${id}"]`);
        if (element) {
            // Add exit animation
            element.classList.remove('notification-enter');
            element.classList.add('notification-exit');
            
            // Create dismiss particles
            const rect = element.getBoundingClientRect();
            const containerRect = this.getBoundingClientRect();
            this._createParticles(
                rect.left - containerRect.left + rect.width / 2,
                rect.top - containerRect.top + rect.height / 2,
                'explode'
            );
            
            // Remove after animation
            setTimeout(() => {
                this._notifications.splice(index, 1);
                this.render();
                
                // Process queue
                this._processQueue();
                
                // Emit event
                this.dispatchEvent(new CustomEvent('dismiss', {
                    detail: { notification }
                }));
            }, 300);
        } else {
            // Direct removal if no element
            this._notifications.splice(index, 1);
            this.render();
            this._processQueue();
        }
    }
    
    update(id, options) {
        const notification = this._notifications.find(n => n.id === id);
        if (!notification) return;
        
        // Update properties
        if (options.message !== undefined) notification.message = options.message;
        if (options.title !== undefined) notification.title = options.title;
        if (options.type !== undefined) notification.type = options.type;
        if (options.actions !== undefined) notification.actions = options.actions;
        
        // Reset timer if duration changed
        if (options.duration !== undefined && options.duration !== notification.duration) {
            if (notification.timer) {
                clearTimeout(notification.timer);
            }
            notification.duration = options.duration;
            if (notification.duration && notification.duration !== Infinity && !notification.paused) {
                notification.timer = setTimeout(() => {
                    this.dismiss(notification.id);
                }, notification.duration);
            }
        }
        
        this.render();
        
        // Emit event
        this.dispatchEvent(new CustomEvent('update', {
            detail: { notification }
        }));
    }
    
    clear() {
        // Clear all timers
        this._notifications.forEach(n => {
            if (n.timer) clearTimeout(n.timer);
        });
        
        // Animate all out
        const elements = this.shadowRoot.querySelectorAll('.notification');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.remove('notification-enter');
                element.classList.add('notification-exit');
            }, index * 50);
        });
        
        // Clear after animations
        setTimeout(() => {
            this._notifications = [];
            this._queue = [];
            this.render();
        }, 300 + elements.length * 50);
    }
    
    _processQueue() {
        if (this._queue.length === 0) return;
        if (this._notifications.length >= this._config.maxStack) return;
        
        const notification = this._queue.shift();
        this.show(notification.message, notification);
    }
    
    _pauseAutoDismiss(id) {
        const notification = this._notifications.find(n => n.id === id);
        if (!notification || !notification.timer) return;
        
        notification.paused = true;
        clearTimeout(notification.timer);
        notification.timer = null;
    }
    
    _resumeAutoDismiss(id) {
        const notification = this._notifications.find(n => n.id === id);
        if (!notification || !notification.paused) return;
        
        notification.paused = false;
        if (notification.duration && notification.duration !== Infinity) {
            // Calculate remaining time
            const elapsed = Date.now() - notification.timestamp;
            const remaining = Math.max(notification.duration - elapsed, 1000);
            
            notification.timer = setTimeout(() => {
                this.dismiss(notification.id);
            }, remaining);
        }
    }
    
    _handleCustomAction(notificationId, actionIndex) {
        const notification = this._notifications.find(n => n.id === notificationId);
        if (!notification || !notification.actions[actionIndex]) return;
        
        const action = notification.actions[actionIndex];
        
        // Call action handler
        if (action.handler && typeof action.handler === 'function') {
            action.handler(notification);
        }
        
        // Auto-dismiss if configured
        if (action.dismiss !== false) {
            this.dismiss(notificationId);
        }
        
        // Emit event
        this.dispatchEvent(new CustomEvent('action', {
            detail: { notification, action, actionIndex }
        }));
    }
    
    _playSound(type) {
        if (!this._config.sounds) return;
        
        try {
            const audio = new Audio(this._soundUrls[type] || this._soundUrls.show);
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            // Ignore audio errors
        }
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        this.style.setProperty('--spacing', `${this._config.spacing}px`);
        this.render();
    }
    
    getNotifications() {
        return [...this._notifications];
    }
    
    getQueueSize() {
        return this._queue.length;
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clear all timers
        this._notifications.forEach(n => {
            if (n.timer) clearTimeout(n.timer);
        });
        
        // Stop particle animation
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
        }
        
        // Remove resize listener
        window.removeEventListener('resize', () => this._resizeCanvas());
    }
    
    // Static methods for global access
    static show(message, options = {}) {
        if (!Notifications._instance) {
            Notifications._instance = new Notifications();
            document.body.appendChild(Notifications._instance);
        }
        return Notifications._instance.show(message, options);
    }
    
    static success(message, options = {}) {
        return Notifications.show(message, { ...options, type: 'success' });
    }
    
    static error(message, options = {}) {
        return Notifications.show(message, { ...options, type: 'error' });
    }
    
    static warning(message, options = {}) {
        return Notifications.show(message, { ...options, type: 'warning' });
    }
    
    static info(message, options = {}) {
        return Notifications.show(message, { ...options, type: 'info' });
    }
    
    static dismiss(id) {
        if (Notifications._instance) {
            Notifications._instance.dismiss(id);
        }
    }
    
    static clear() {
        if (Notifications._instance) {
            Notifications._instance.clear();
        }
    }
}

// Static instance holder
Notifications._instance = null;

// Register element
customElements.define('brutal-notifications', Notifications);