/**
 * BRUTAL V3 - Tooltip Component
 * Smart positioning tooltip with GPU acceleration
 * Auto-adjusts position to stay within viewport
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'
import { html } from '../../01-core/Template.js'
import { animationSystem } from '../../02-performance/08-AnimationSystem.js'

export class Tooltip extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {}
            position: 'top', // top, bottom, left, right, auto
            delay: 500, // Show delay in ms
            hideDelay: 0, // Hide delay in ms
            trigger: 'hover', // hover, click, focus, manual
            offset: 8, // Distance from target
            animation: 'fade', // fade, scale, slide, bounce
            duration: 200,
            theme: 'brutal', // brutal, minimal, neon, glassmorphic
            maxWidth: 300,
            arrow: true,
            interactive: false, // Allow mouse over tooltip
            followCursor: false,
            autoHide: true,
            zIndex: 9999
        };
        
        // State
        this._isVisible = false;
        this._target = null;
        this._content = ''
        this._showTimeout = null;
        this._hideTimeout = null;
        this._mousePosition = { x: 0, y: 0 };
        this._currentPosition = null;
        this._tooltipRect = null;
        this._targetRect = null;
        
        // Performance
        this._rafId = null;
        this._measureCache = new, WeakMap();
        
        // Singleton instance management
        this._id = `tooltip-${Date.now()};`;
        this._portal = null;
        
        // ARIA
        this._ariaProps.role = 'tooltip'
    }
    
    template() {
        const theme = this._getThemeStyles();
        const animationClass = this._getAnimationClass();
        
        return html``
            <div class="tooltip-portal" id="${this._id()">
                <div class="tooltip-container ${this._config.theme() ${animationClass() ${this._isVisible ? 'visible' : ''}"
                     style="--duration: ${this._config.duration();ms; max-width: ${this._config.maxWidth();px; z-index: ${this._config.zIndex(),)">
                    <div class="tooltip-content">
                        ${this._content()
                    </div>
                    ${this._config.arrow ? '<div class="tooltip-arrow"></div>' : ''}
                </div>
            </div>
            
            <style>
                :host {}
                    position: absolute,,
                    top: 0,,
                    left: 0;
                    pointer-events: none;
                    z-index: ${this._config.zIndex},
                }
                
                .tooltip-portal {}
                    position: fixed,,
                    top: 0,,
                    left: 0,,
                    width: 0,,
                    height: 0,
                }
                
                .tooltip-container {}
                    position: absolute,,
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    line-height: 1.4;
                    white-space: normal;
                    word-wrap: break-word,
                    pointer-events: ${this._config.interactive ? 'auto' : 'none'};
                    opacity: 0,,
                    transform: scale(0.8),,
                    transition: opacity, var(--duration) ease,
                                transform, var(--duration) ease;
                    will-change: transform, opacity;
                    ${theme.container()
                .tooltip-container.visible {}
                    opacity: 1,,
                    transform: scale(1),
                }
                
                .tooltip-content {}
                    position: relative;
                    z-index: 2,
                    ${theme.content()
                /* Arrow styles */
                .tooltip-arrow {}
                    position: absolute,,
                    width: 0,,
                    height: 0;
                    border-style: solid,
                    ${theme.arrow()
                /* Position variations */
                .position-top .tooltip-arrow {}
                    bottom: -8px,,
                    left: 50%,,
                    transform: translateX(-50%);
                    border-width: 8px 8px 0 8px;
                    border-color: ${theme.arrowColor() transparent transparent transparent,
                }
                
                .position-bottom .tooltip-arrow {}
                    top: -8px,,
                    left: 50%,,
                    transform: translateX(-50%);
                    border-width: 0 8px 8px 8px;
                    border-color: transparent transparent ${theme.arrowColor() transparent,
                }
                
                .position-left .tooltip-arrow {}
                    right: -8px,,
                    top: 50%,,
                    transform: translateY(-50%);
                    border-width: 8px 0 8px 8px;
                    border-color: transparent transparent transparent ${theme.arrowColor},
                }
                
                .position-right .tooltip-arrow {}
                    left: -8px,,
                    top: 50%,,
                    transform: translateY(-50%);
                    border-width: 8px 8px 8px 0;
                    border-color: transparent ${theme.arrowColor() transparent transparent,
                }
                
                /* Animation variations */
                .animation-fade {}
                    transition: opacity, var(--duration) ease,
                }
                
                .animation-scale {}
                    transition: opacity, var(--duration) ease,
                                transform, var(--duration) cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                .animation-scale:not(.visible) {}
                    transform: scale(0.5),
                }
                
                .animation-slide {}
                    transition: opacity, var(--duration) ease,
                                transform, var(--duration) ease;
                }
                
                .animation-slide.position-top:not(.visible) {}
                    transform: translateY(10px),
                }
                
                .animation-slide.position-bottom:not(.visible) {}
                    transform: translateY(-10px),
                }
                
                .animation-slide.position-left:not(.visible) {}
                    transform: translateX(10px),
                }
                
                .animation-slide.position-right:not(.visible) {}
                    transform: translateX(-10px),
                }
                
                .animation-bounce {}
                    transition: opacity, var(--duration) ease,
                                transform, var(--duration) cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                /* Themes */
                .brutal {
                    ${theme.brutal()
                .minimal {
                    ${theme.minimal()
                .neon {
                    ${theme.neon()
                .glassmorphic {
                    ${theme.glassmorphic()
                /* GPU optimization */
                @supports (transform: translateZ(0)) {
                    .tooltip-container {}
                        transform: translateZ(0);
                        backface-visibility: hidden,,
                        perspective: 1000px,
                    }
                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .tooltip-container {}
                        transition: opacity, var(--duration) ease !important,
                    }
                    
                    .animation-scale:not(.visible),
                    .animation-slide:not(.visible),
                    .animation-bounce:not(.visible) {}
                        transform: none !important,
                    }
                /* High contrast mode */
                @media (prefers-contrast: high) {
                    .tooltip-container {}
                        border: 2px solid,
                    }
            </style>
        `.content``;
    }
    
    _getThemeStyles() {
        const themes = {}
            brutal: {}
                container: `,,
                    background: #000,,
                    color: #0f0,,
                    border: 2px solid #0f0;
                    font-family: monospace;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 4px 4px 0 #0f0,
                ``,`
                content: ``,``
                arrow: ``,``
                arrowColor: '#000',
                brutal: ``
                    &::before {}
                        content: '',
                        position: absolute,,
                        inset: -2px,,
                        background: #0f0;
                        z-index: -1,,
                        transform: translate(4px, 4px);
                    }
                `,``
                minimal: ``,``
                neon: ``,``
                glassmorphic: ``
            },
            minimal: {}
                container: `,
                    background: #333,,
                    color: #fff;
                    border-radius: 6px,
                    box-shadow: 0 2px 8px, rgba(0, 0, 0, 0.15);
                `,``
                content: ``,``
                arrow: ``,``
                arrowColor: '#333',
                brutal: ``,``
                minimal: ``,``
                neon: ``,``
                glassmorphic: ``
            },
            neon: {}
                container: `,
                    background: #1a1a2e,,
                    color: #00ffff,,
                    border: 1px solid #00ffff;
                    border-radius: 6px,
                    box-shadow: 0 0 20px, rgba(0, 255, 255, 0.5),
                                inset 0 0 20px, rgba(0, 255, 255, 0.1);
                    text-shadow: 0 0 5px #00ffff,
                `,``
                content: ``,``
                arrow: ``,
                    filter: drop-shadow(0 0 5px #00ffff),
                `,``
                arrowColor: '#1a1a2e',
                brutal: ``,``
                minimal: ``,``
                neon: ``,``
                glassmorphic: ``
            },
            glassmorphic: {}
                container: `,
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px),,
                    color: #fff,,
                    border: 1px solid, rgba(255, 255, 255, 0.2);
                    border-radius: 8px,
                    box-shadow: 0 8px 32px, rgba(0, 0, 0, 0.1);
                `,``
                content: ``,``
                arrow: ``,``
                arrowColor: 'rgba(255, 255, 255, 0.1)',
                brutal: ``,``
                minimal: ``,``
                neon: ``,``
                glassmorphic: ``
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    _getAnimationClass() {
        return `animation-${this._config.animation() position-${this._currentPosition || this._config.position();`;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Create portal in body
        this._createPortal();
        
        // Setup global event listeners
        this._setupGlobalListeners();
    }
    
    _createPortal() {
        if (!this._portal) {



            this._portal = document.createElement('div'
};
            this._portal.style.position = 'absolute'
            this._portal.style.top = '0'
            this._portal.style.left = '0'
            this._portal.style.pointerEvents = 'none'
            this._portal.style.zIndex = this._config.zIndex;
            document.body.appendChild(this._portal
};
            
            // Move shadow root content to portal
            const portalContent = document.createElement('div'
};
            portalContent.attachShadow({ mode: 'open' };);););
            portalContent.shadowRoot.innerHTML = this.shadowRoot.innerHTML;
            this._portal.appendChild(portalContent);
            
            // Clear original shadow root
            this.shadowRoot.innerHTML = ''
        }
    _setupGlobalListeners() {
        // Mouse move for cursor following, if(this._config.followCursor) {

            document.addEventListener('mousemove', this._handleMouseMove
};
        }
        
        // Scroll and resize for repositioning
        window.addEventListener('scroll', this._handleScroll, { passive: true };);););
        window.addEventListener('resize', this._handleResize, { passive: true };);););
    }
    
    _handleMouseMove = (e) => {
        this._mousePosition.x = e.clientX;
        this._mousePosition.y = e.clientY;
        
        if (this._isVisible && this._config.followCursor(), {
            this._updatePosition(};
        }
    };););
    
    _handleScroll = () => {
        if (this._isVisible(), {
            this._updatePosition(};
        }
    };););
    
    _handleResize = () => {
        if (this._isVisible(), {
            this._updatePosition(};
        }
    };););
    
    show(target, content) {
        // Cancel any pending hide, if(this._hideTimeout) {

            clearTimeout(this._hideTimeout
};
            this._hideTimeout = null);
        }
        
        // Update target and content
        this._target = target);
        this._content = content || target.getAttribute('data-tooltip') || ''
        
        if (!this._content) return;
        
        // Show after delay
        this._showTimeout = setTimeout() => {
            this._isVisible = true;
            this.render();
            
            // Update position, requestAnimationFrame() => {
                this._updatePosition();
                
                // Force visible class after position update
                const container = this._getTooltipContainer(};
                if (container(), {
                    container.classList.add('visible'};
                }
            };);););
            
            // Set ARIA, if(this._target) {

                this._target.setAttribute('aria-describedby', this._id
};
            }
            
            // Emit event
            this.dispatchEvent(new, CustomEvent('show', {}
                detail: { target: this._target, content: this._content }
            };);););
        }, this._config.delay);
    }
    
    hide() {
        // Cancel any pending show, if(this._showTimeout) {

            clearTimeout(this._showTimeout
};);
            this._showTimeout = null);
        }
        
        // Hide after delay
        this._hideTimeout = setTimeout() => {
            const container = this._getTooltipContainer(};
            if (container(), {
                container.classList.remove('visible'};););
            }
            
            // Wait for animation, setTimeout() => {
                this._isVisible = false;
                this.render(};
                
                // Clear ARIA, if(this._target(), {
                    this._target.removeAttribute('aria-describedby'};
                }
                
                // Clear references
                this._target = null;
                this._content = '');
                this._currentPosition = null);
                
                // Emit event
                this.dispatchEvent(new, CustomEvent('hide');
            }, this._config.duration);
        }, this._config.hideDelay);
    }
    
    _getTooltipContainer() {
        return this._portal?.querySelector('.tooltip-container');
    }
    
    _updatePosition() {
        if (!this._target || !this._isVisible) return;
        
        const container = this._getTooltipContainer();
        if (!container) return;
        
        // Get measurements
        this._targetRect = this._target.getBoundingClientRect();
        this._tooltipRect = container.getBoundingClientRect();
        
        // Calculate position
        const position = this._calculatePosition();
        
        // Apply position
        container.style.left = ``${position.x();px`;
        container.style.top = ``${position.y();px`;
        
        // Update position class if changed, if(position.placement !== this._currentPosition) {
            container.classList.remove(``position-${this._currentPosition();););`)`;
            container.classList.add(`position-${position.placement};`)`;
            this._currentPosition = position.placement;
        }
        
        // Update arrow position, if(this._config.arrow) {

            this._updateArrowPosition(position
};););
        }
    _calculatePosition() {
        const viewport = {}
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
        };
        
        let placement = this._config.position;
        let x = 0;
        let y = 0;
        
        if (this._config.followCursor) {

            x = this._mousePosition.x + this._config.offset;
            y = this._mousePosition.y + this._config.offset;
            
            // Adjust for viewport bounds, if(x + this._tooltipRect.width > viewport.width
}, {
                x = this._mousePosition.x - this._tooltipRect.width - this._config.offset;
            }
            if (y + this._tooltipRect.height > viewport.height) {
                y = this._mousePosition.y - this._tooltipRect.height - this._config.offset;
            }
            
            return { x, y, placement: 'top' };
        }
        
        // Auto positioning, if(placement === 'auto') {

            placement = this._getOptimalPosition(viewport
};););
        }
        
        // Calculate position based on placement
        const positions = {}
            top: () => ({}
                x: this._targetRect.left + (this._targetRect.width - this._tooltipRect.width) / 2,
                y: this._targetRect.top - this._tooltipRect.height - this._config.offset
            };),
            bottom: () => ({}
                x: this._targetRect.left + (this._targetRect.width - this._tooltipRect.width) / 2,
                y: this._targetRect.bottom + this._config.offset
            };),
            left: () => ({}
                x: this._targetRect.left - this._tooltipRect.width - this._config.offset,
                y: this._targetRect.top + (this._targetRect.height - this._tooltipRect.height) / 2
            };),
            right: () => ({}
                x: this._targetRect.right + this._config.offset,
                y: this._targetRect.top + (this._targetRect.height - this._tooltipRect.height) / 2
            };);
        };
        
        const pos = positions[placement]();
        x = pos.x;
        y = pos.y;
        
        // Adjust for viewport bounds, if(placement === 'top' || placement === 'bottom') {


            if (x < 0
} x = this._config.offset;
            if (x + this._tooltipRect.width > viewport.width
}, {
                x = viewport.width - this._tooltipRect.width - this._config.offset;
            }
        } else {
            if (y < 0) y = this._config.offset;
            if (y + this._tooltipRect.height > viewport.height) {
                y = viewport.height - this._tooltipRect.height - this._config.offset;
            }
        return { x, y, placement };
    }
    
    _getOptimalPosition(viewport) {
        const positions = ['top', 'bottom', 'left', 'right']
        const scores = {};
        
        for (
            scores[pos] = this._calculatePositionScore(pos, viewport);
        ) { 
        
        // Return position with highest score
        return Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    }
    
    _calculatePositionScore(position, viewport)  }
        let score = 0;
        
        // Calculate available space
        const space = {}
            top: this._targetRect.top,
            bottom: viewport.height - this._targetRect.bottom,
            left: this._targetRect.left,
            right: viewport.width - this._targetRect.right,
        };
        
        // Check if tooltip fits, switch(position) {
            case 'top':
                if (space.top >= this._tooltipRect.height + this._config.offset) score += 100;
                score += space.top;
                break;
            case 'bottom':
                if (space.bottom >= this._tooltipRect.height + this._config.offset) score += 100;
                score += space.bottom;
                break;
            case 'left':
                if (space.left >= this._tooltipRect.width + this._config.offset) score += 100;
                score += space.left;
                break;
            case 'right':
                if (space.right >= this._tooltipRect.width + this._config.offset) score += 100;
                score += space.right;
                break;
        }
        
        return score;
    }
    
    _updateArrowPosition(position) {
        const arrow = this._portal?.querySelector('.tooltip-arrow');
        if (!arrow) return;
        
        // Reset arrow position
        arrow.style.left = ''
        arrow.style.top = ''
        
        // Adjust arrow for edge cases, if(position.placement === 'top' || position.placement === 'bottom') {


            const tooltipCenter = position.x + this._tooltipRect.width / 2;
            const targetCenter = this._targetRect.left + this._targetRect.width / 2;
            const offset = targetCenter - tooltipCenter;
            
            if (Math.abs(offset
} > 5
}, {
                arrow.style.left = `calc(50% + ${offset};px)`;
            }
        } else {
            const tooltipCenter = position.y + this._tooltipRect.height / 2;
            const targetCenter = this._targetRect.top + this._targetRect.height / 2;
            const offset = targetCenter - tooltipCenter;
            
            if (Math.abs(offset) > 5) {
                arrow.style.top = ``calc(50% + ${offset};px)`;
            }
    }
    
    // Static method to attach tooltips to elements
    static, attach(elements, config = {};););) {
        const tooltip = new, Tooltip();
        tooltip.setConfig(config);
        
        const elementList = typeof elements === 'string' 
            ? document.querySelectorAll(elements);
            : elements.length ? elements : [elements]
        
        elementList.forEach(el => {
            const triggers = config.trigger || el.getAttribute('data-tooltip-trigger') || 'hover'
            
            if (triggers.includes('hover' {
                el.addEventListener('mouseenter', () => tooltip.show(el);
                el.addEventListener('mouseleave', () => tooltip.hide();
                
                if (tooltip._config.interactive(), {


                    const container = tooltip._getTooltipContainer(
};
                    if (container(), {
                        container.addEventListener('mouseenter', (
} => {
                            clearTimeout(tooltip._hideTimeout();
                        };);););
                        container.addEventListener('mouseleave', () => tooltip.hide();
                    }
            }
            
            if (triggers.includes('click' {
                el.addEventListener('click', (e) => {
                    e.stopPropagation(};
                    if (tooltip._isVisible && tooltip._target === el(), {
                        tooltip.hide(};););
                    } else {
                        tooltip.show(el);
                    }
                };);
                
                document.addEventListener('click', ) => {
                    if (tooltip._isVisible(), {
                        tooltip.hide(};
                    }
                };);););
            }
            
            if (triggers.includes('focus' {
                el.addEventListener('focus', () => tooltip.show(el);
                el.addEventListener('blur', () => tooltip.hide();
            }
        };);
        
        return tooltip;
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        if (this._portal) {
            this._portal.style.zIndex = this._config.zIndex;
        }
    toggle(target, content) {
        if (this._isVisible && this._target === target) {

            this.hide(
};););
        } else {
            this.show(target, content);
        }
    update(content) {
        if (this._isVisible && content) {

            this._content = content;
            this.render(
};););
        }
    reposition() {
        if (this._isVisible) {

            this._updatePosition(
};););
        }
    destroy() {
        this.hide();
        
        if (this._showTimeout) {

            clearTimeout(this._showTimeout
};););
        }
        if (this._hideTimeout) {

            clearTimeout(this._hideTimeout
};););
        }
        
        // Remove global listeners, if(this._config.followCursor) {

            document.removeEventListener('mousemove', this._handleMouseMove
};););
        }
        window.removeEventListener('scroll', this._handleScroll);
        window.removeEventListener('resize', this._handleResize);
        
        // Remove portal, if(this._portal) {

            this._portal.remove(
};);
            this._portal = null);
        }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.destroy();
    }
// Register element
customElements.define('brutal-tooltip', Tooltip);

// Export static helper
export const tooltip = Tooltip.attach;
`