/**
 * BRUTAL V3 - ImageGallery Component
 * WebGL-powered image gallery with advanced transitions
 * GPU-accelerated zoom, pan, and gesture support
 */

import { MediaComponent } from '../base/MediaComponent.js';
import { html } from '../../01-core/Template.js';
import { gestureSystem } from '../../02-performance/09-GestureSystem.js';

export class ImageGallery extends MediaComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {
            layout: 'grid', // grid, masonry, carousel, stack, mosaic
            columns: 3,
            gap: 16,
            transition: 'webgl', // webgl, fade, slide, zoom, flip, morph
            transitionDuration: 600,
            lazy: true,
            thumbnails: true,
            fullscreen: true,
            zoom: true,
            autoplay: false,
            autoplayInterval: 5000,
            infinite: true,
            theme: 'brutal', // brutal, minimal, neon, glassmorphic
            effects: {
                blur: true,
                parallax: true,
                tilt: true,
                particles: false
            }
        };
        
        // State
        this._images = [];
        this._currentIndex = 0;
        this._isFullscreen = false;
        this._isZoomed = false;
        this._zoomLevel = 1;
        this._panPosition = { x: 0, y: 0 };
        this._isTransitioning = false;
        
        // WebGL
        this._canvas = null;
        this._gl = null;
        this._program = null;
        this._textures = new Map();
        this._transitionProgress = 0;
        this._rafId = null;
        
        // Performance
        this._loadedImages = new Set();
        this._intersectionObserver = null;
        this._resizeObserver = null;
        
        // Gestures
        this._gestureHandlers = new Map();
        this._touchStartPosition = null;
        this._lastTouchDistance = 0;
        
        // Autoplay
        this._autoplayTimer = null;
    }
    
    template() {
        const theme = this._getThemeStyles();
        
        return html`
            <div class="gallery-container ${this._config.theme} ${this._config.layout}"
                 data-fullscreen="${this._isFullscreen}">
                
                ${this._config.layout === 'grid' || this._config.layout === 'masonry' ? 
                    this._renderGrid(theme) : ''}
                ${this._config.layout === 'carousel' || this._config.layout === 'stack' ? 
                    this._renderCarousel(theme) : ''}
                ${this._config.layout === 'mosaic' ? 
                    this._renderMosaic(theme) : ''}
                
                ${this._config.thumbnails && this._images.length > 1 ? 
                    this._renderThumbnails(theme) : ''}
                
                ${this._isFullscreen ? this._renderFullscreenViewer(theme) : ''}
                
                <canvas class="transition-canvas"></canvas>
                
                <div class="gallery-controls">
                    ${this._images.length > 1 ? `
                        <button class="control-prev" data-action="prev" aria-label="Previous image">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <button class="control-next" data-action="next" aria-label="Next image">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </button>
                    ` : ''}
                    
                    ${this._config.fullscreen ? `
                        <button class="control-fullscreen" data-action="fullscreen" aria-label="Toggle fullscreen">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                ${this._isFullscreen ? 
                                    '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>' :
                                    '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'}
                            </svg>
                        </button>
                    ` : ''}
                    
                    ${this._config.autoplay ? `
                        <button class="control-play" data-action="togglePlay" aria-label="Toggle autoplay">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                ${this._autoplayTimer ? 
                                    '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' :
                                    '<polygon points="5 3 19 12 5 21 5 3"/>'}
                            </svg>
                        </button>
                    ` : ''}
                </div>
                
                <div class="loading-overlay">
                    <div class="loading-spinner"></div>
                </div>
            </div>
            
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                }
                
                .gallery-container {
                    position: relative;
                    width: 100%;
                    min-height: 300px;
                    ${theme.container}
                }
                
                /* Grid layout */
                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(var(--columns, 3), 1fr);
                    gap: var(--gap, 16px);
                }
                
                .gallery-item {
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    aspect-ratio: 1;
                    ${theme.item}
                }
                
                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform var(--duration, 300ms) ease;
                    will-change: transform;
                }
                
                .gallery-item:hover img {
                    transform: scale(1.05);
                }
                
                /* Masonry layout */
                .gallery-masonry {
                    columns: var(--columns, 3);
                    column-gap: var(--gap, 16px);
                }
                
                .gallery-masonry .gallery-item {
                    break-inside: avoid;
                    margin-bottom: var(--gap, 16px);
                    aspect-ratio: auto;
                }
                
                /* Carousel layout */
                .gallery-carousel {
                    position: relative;
                    height: 400px;
                    overflow: hidden;
                }
                
                .carousel-track {
                    display: flex;
                    height: 100%;
                    transition: transform var(--duration, 600ms) cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform;
                }
                
                .carousel-item {
                    flex: 0 0 100%;
                    height: 100%;
                    position: relative;
                }
                
                .carousel-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                /* Stack layout */
                .gallery-stack {
                    position: relative;
                    height: 400px;
                    perspective: 1000px;
                }
                
                .stack-item {
                    position: absolute;
                    inset: 0;
                    transform-style: preserve-3d;
                    transition: transform var(--duration, 600ms) ease,
                                opacity var(--duration, 600ms) ease;
                }
                
                /* Mosaic layout */
                .gallery-mosaic {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    grid-auto-rows: 150px;
                    gap: var(--gap, 16px);
                }
                
                .mosaic-item {
                    ${theme.item}
                }
                
                .mosaic-item:nth-child(5n+1) {
                    grid-column: span 2;
                    grid-row: span 2;
                }
                
                .mosaic-item:nth-child(5n+3) {
                    grid-row: span 2;
                }
                
                /* Thumbnails */
                .thumbnails-container {
                    display: flex;
                    gap: 8px;
                    padding: 16px 0;
                    overflow-x: auto;
                    scrollbar-width: thin;
                    ${theme.thumbnails}
                }
                
                .thumbnail {
                    flex: 0 0 60px;
                    height: 60px;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 200ms ease;
                    ${theme.thumbnail}
                }
                
                .thumbnail.active {
                    opacity: 1;
                    ${theme.thumbnailActive}
                }
                
                .thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                /* Fullscreen viewer */
                .fullscreen-viewer {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .fullscreen-image {
                    max-width: 90vw;
                    max-height: 90vh;
                    position: relative;
                    transform-origin: center;
                    transition: transform 200ms ease;
                    cursor: grab;
                }
                
                .fullscreen-image.grabbing {
                    cursor: grabbing;
                }
                
                .fullscreen-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                /* WebGL transition canvas */
                .transition-canvas {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0;
                    z-index: 10;
                }
                
                .transition-canvas.active {
                    opacity: 1;
                }
                
                /* Controls */
                .gallery-controls {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 5;
                }
                
                .gallery-controls button {
                    position: absolute;
                    background: var(--control-bg, rgba(0, 0, 0, 0.5));
                    border: none;
                    color: var(--control-color, white);
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    pointer-events: auto;
                    transition: all 200ms ease;
                    ${theme.control}
                }
                
                .gallery-controls button:hover {
                    ${theme.controlHover}
                }
                
                .control-prev {
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                
                .control-next {
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                
                .control-fullscreen {
                    top: 16px;
                    right: 16px;
                }
                
                .control-play {
                    bottom: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                /* Loading */
                .loading-overlay {
                    position: absolute;
                    inset: 0;
                    background: var(--loading-bg, rgba(0, 0, 0, 0.8));
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 20;
                }
                
                .loading-overlay.active {
                    display: flex;
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid transparent;
                    border-top-color: var(--spinner-color, #fff);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Lazy loading placeholder */
                .lazy-placeholder {
                    background: var(--placeholder-bg, #f0f0f0);
                    filter: blur(20px);
                    transform: scale(1.1);
                }
                
                /* Effects */
                .effect-blur img {
                    filter: blur(0);
                    transition: filter 300ms ease;
                }
                
                .effect-blur .gallery-item:not(:hover) img {
                    filter: blur(2px);
                }
                
                .effect-parallax {
                    transform-style: preserve-3d;
                }
                
                .effect-tilt {
                    transform-style: preserve-3d;
                    transform: perspective(1000px);
                }
                
                /* Themes */
                .brutal {
                    --columns: ${this._config.columns};
                    --gap: ${this._config.gap}px;
                    --duration: ${this._config.transitionDuration}ms;
                    ${theme.brutal}
                }
                
                .minimal {
                    --columns: ${this._config.columns};
                    --gap: ${this._config.gap}px;
                    --duration: ${this._config.transitionDuration}ms;
                    ${theme.minimal}
                }
                
                .neon {
                    --columns: ${this._config.columns};
                    --gap: ${this._config.gap}px;
                    --duration: ${this._config.transitionDuration}ms;
                    ${theme.neon}
                }
                
                .glassmorphic {
                    --columns: ${this._config.columns};
                    --gap: ${this._config.gap}px;
                    --duration: ${this._config.transitionDuration}ms;
                    ${theme.glassmorphic}
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .gallery-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .gallery-masonry {
                        columns: 2;
                    }
                    
                    .gallery-mosaic {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media (max-width: 480px) {
                    .gallery-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .gallery-masonry {
                        columns: 1;
                    }
                }
                
                /* GPU optimization */
                @supports (transform: translateZ(0)) {
                    .gallery-item img,
                    .carousel-track,
                    .stack-item,
                    .fullscreen-image {
                        transform: translateZ(0);
                        backface-visibility: hidden;
                    }
                }
                
                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .gallery-item img,
                    .carousel-track,
                    .stack-item,
                    .thumbnail {
                        transition: none !important;
                    }
                }
            </style>
        `.content;
    }
    
    _getThemeStyles() {
        const themes = {
            brutal: {
                container: 'background: #000; border: 3px solid #0f0;',
                item: 'border: 2px solid #0f0; position: relative;',
                thumbnails: 'background: #000; border-top: 2px solid #0f0;',
                thumbnail: 'border: 2px solid transparent;',
                thumbnailActive: 'border-color: #0f0; box-shadow: 0 0 10px #0f0;',
                control: 'border: 2px solid #0f0;',
                controlHover: 'background: #0f0; color: #000;',
                brutal: `
                    --control-bg: #000;
                    --control-color: #0f0;
                    --loading-bg: rgba(0, 0, 0, 0.9);
                    --spinner-color: #0f0;
                    --placeholder-bg: #001100;
                `,
                minimal: '',
                neon: '',
                glassmorphic: ''
            },
            minimal: {
                container: 'background: #fff;',
                item: 'border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);',
                thumbnails: 'background: #f5f5f5; padding: 8px;',
                thumbnail: 'border-radius: 4px; overflow: hidden;',
                thumbnailActive: 'box-shadow: 0 0 0 2px #333;',
                control: 'border-radius: 50%;',
                controlHover: 'background: #333;',
                brutal: '',
                minimal: `
                    --control-bg: rgba(255, 255, 255, 0.9);
                    --control-color: #333;
                    --loading-bg: rgba(255, 255, 255, 0.95);
                    --spinner-color: #333;
                    --placeholder-bg: #f0f0f0;
                `,
                neon: '',
                glassmorphic: ''
            },
            neon: {
                container: 'background: #1a1a2e;',
                item: 'border: 1px solid #00ffff; box-shadow: 0 0 20px rgba(0,255,255,0.3);',
                thumbnails: 'background: #16213e;',
                thumbnail: 'border: 1px solid transparent;',
                thumbnailActive: 'border-color: #00ffff; box-shadow: 0 0 15px #00ffff;',
                control: 'box-shadow: 0 0 20px rgba(0,255,255,0.5);',
                controlHover: 'background: #00ffff; color: #1a1a2e; box-shadow: 0 0 30px #00ffff;',
                brutal: '',
                minimal: '',
                neon: `
                    --control-bg: rgba(0, 255, 255, 0.2);
                    --control-color: #00ffff;
                    --loading-bg: rgba(26, 26, 46, 0.95);
                    --spinner-color: #00ffff;
                    --placeholder-bg: #0f3460;
                `,
                glassmorphic: ''
            },
            glassmorphic: {
                container: 'background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);',
                item: 'background: rgba(255,255,255,0.05); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; overflow: hidden;',
                thumbnails: 'background: rgba(255,255,255,0.05); backdrop-filter: blur(10px);',
                thumbnail: 'border-radius: 8px; overflow: hidden; border: 1px solid transparent;',
                thumbnailActive: 'border-color: rgba(255,255,255,0.5);',
                control: 'backdrop-filter: blur(10px); border-radius: 50%;',
                controlHover: 'background: rgba(255,255,255,0.3);',
                brutal: '',
                minimal: '',
                neon: '',
                glassmorphic: `
                    --control-bg: rgba(255, 255, 255, 0.1);
                    --control-color: rgba(255, 255, 255, 0.9);
                    --loading-bg: rgba(0, 0, 0, 0.8);
                    --spinner-color: rgba(255, 255, 255, 0.9);
                    --placeholder-bg: rgba(255, 255, 255, 0.1);
                `
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    _renderGrid(theme) {
        const effectClasses = Object.entries(this._config.effects)
            .filter(([_, enabled]) => enabled)
            .map(([effect]) => `effect-${effect}`)
            .join(' ');
        
        return `
            <div class="gallery-grid ${effectClasses}">
                ${this._images.map((image, index) => `
                    <div class="gallery-item" data-index="${index}">
                        ${this._config.lazy && !this._loadedImages.has(index) ? 
                            `<div class="lazy-placeholder"></div>` :
                            `<img src="${image.src}" 
                                  alt="${image.alt || ''}" 
                                  loading="${this._config.lazy ? 'lazy' : 'eager'}">`
                        }
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    _renderCarousel(theme) {
        return `
            <div class="gallery-carousel">
                <div class="carousel-track" style="transform: translateX(-${this._currentIndex * 100}%)">
                    ${this._images.map((image, index) => `
                        <div class="carousel-item" data-index="${index}">
                            <img src="${image.src}" alt="${image.alt || ''}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    _renderMosaic(theme) {
        return `
            <div class="gallery-mosaic">
                ${this._images.map((image, index) => `
                    <div class="mosaic-item gallery-item" data-index="${index}">
                        <img src="${image.src}" alt="${image.alt || ''}">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    _renderThumbnails(theme) {
        return `
            <div class="thumbnails-container">
                ${this._images.map((image, index) => `
                    <div class="thumbnail ${index === this._currentIndex ? 'active' : ''}" 
                         data-index="${index}">
                        <img src="${image.thumbnail || image.src}" alt="">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    _renderFullscreenViewer(theme) {
        const currentImage = this._images[this._currentIndex];
        if (!currentImage) return '';
        
        return `
            <div class="fullscreen-viewer">
                <div class="fullscreen-image" 
                     style="transform: scale(${this._zoomLevel}) translate(${this._panPosition.x}px, ${this._panPosition.y}px)">
                    <img src="${currentImage.src}" alt="${currentImage.alt || ''}">
                </div>
            </div>
        `;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame(() => {
            this._setupEventListeners();
            this._setupGestures();
            this._setupLazyLoading();
            
            if (this._config.transition === 'webgl') {
                this._initWebGL();
            }
            
            if (this._config.autoplay) {
                this._startAutoplay();
            }
        });
    }
    
    _setupEventListeners() {
        // Gallery item clicks
        this.shadowRoot.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                if (this._config.fullscreen) {
                    this.openFullscreen(index);
                } else {
                    this.goToImage(index);
                }
            }
            
            // Thumbnail clicks
            const thumbnail = e.target.closest('.thumbnail');
            if (thumbnail) {
                const index = parseInt(thumbnail.dataset.index);
                this.goToImage(index);
            }
            
            // Control buttons
            const button = e.target.closest('button');
            if (button) {
                const action = button.dataset.action;
                switch (action) {
                    case 'prev':
                        this.previous();
                        break;
                    case 'next':
                        this.next();
                        break;
                    case 'fullscreen':
                        this.toggleFullscreen();
                        break;
                    case 'togglePlay':
                        this.toggleAutoplay();
                        break;
                }
            }
        });
        
        // Keyboard navigation
        this.shadowRoot.addEventListener('keydown', (e) => {
            if (!this._isFullscreen) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previous();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.next();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeFullscreen();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
            }
        });
    }
    
    _setupGestures() {
        if (!this._config.zoom) return;
        
        const container = this.shadowRoot.querySelector('.gallery-container');
        
        // Touch gestures
        let touchStartX = 0;
        let touchStartY = 0;
        let startDistance = 0;
        
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Pinch zoom start
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                startDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this._isFullscreen && this._zoomLevel > 1) {
                // Pan when zoomed
                e.preventDefault();
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                this._panPosition.x += dx;
                this._panPosition.y += dy;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                this._updateFullscreenImage();
            } else if (e.touches.length === 2) {
                // Pinch zoom
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const scale = distance / startDistance;
                this._zoomLevel = Math.max(1, Math.min(4, this._zoomLevel * scale));
                startDistance = distance;
                this._updateFullscreenImage();
            }
        });
        
        container.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                // Swipe detection
                const swipeThreshold = 50;
                const dx = e.changedTouches[0].clientX - touchStartX;
                
                if (Math.abs(dx) > swipeThreshold) {
                    if (dx > 0) {
                        this.previous();
                    } else {
                        this.next();
                    }
                }
            }
        });
        
        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            if (!this._isFullscreen) return;
            
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this._zoomLevel = Math.max(1, Math.min(4, this._zoomLevel + delta));
            this._updateFullscreenImage();
        });
    }
    
    _setupLazyLoading() {
        if (!this._config.lazy) return;
        
        this._intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const item = entry.target;
                    const index = parseInt(item.dataset.index);
                    
                    if (!this._loadedImages.has(index)) {
                        this._loadImage(index);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        const items = this.shadowRoot.querySelectorAll('.gallery-item');
        items.forEach(item => this._intersectionObserver.observe(item));
    }
    
    _loadImage(index) {
        const image = this._images[index];
        if (!image) return;
        
        const img = new Image();
        img.onload = () => {
            this._loadedImages.add(index);
            const item = this.shadowRoot.querySelector(`.gallery-item[data-index="${index}"]`);
            if (item) {
                const placeholder = item.querySelector('.lazy-placeholder');
                if (placeholder) {
                    placeholder.remove();
                    item.innerHTML = `<img src="${image.src}" alt="${image.alt || ''}">`;
                }
            }
        };
        img.src = image.src;
    }
    
    _initWebGL() {
        this._canvas = this.shadowRoot.querySelector('.transition-canvas');
        if (!this._canvas) return;
        
        this._gl = this._canvas.getContext('webgl2') || this._canvas.getContext('webgl');
        if (!this._gl) {
            this._config.transition = 'fade';
            return;
        }
        
        // Initialize WebGL shaders for transitions
        this._initTransitionShaders();
    }
    
    _initTransitionShaders() {
        const gl = this._gl;
        
        // Vertex shader
        const vsSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
        
        // Fragment shader for transitions
        const fsSource = `
            precision mediump float;
            
            uniform sampler2D u_image1;
            uniform sampler2D u_image2;
            uniform float u_progress;
            uniform int u_transitionType;
            uniform vec2 u_resolution;
            
            varying vec2 v_texCoord;
            
            vec4 fadeTransition(vec2 uv) {
                vec4 color1 = texture2D(u_image1, uv);
                vec4 color2 = texture2D(u_image2, uv);
                return mix(color1, color2, u_progress);
            }
            
            vec4 slideTransition(vec2 uv) {
                vec2 uv1 = uv + vec2(u_progress, 0.0);
                vec2 uv2 = uv - vec2(1.0 - u_progress, 0.0);
                
                vec4 color1 = texture2D(u_image1, uv1);
                vec4 color2 = texture2D(u_image2, uv2);
                
                float mask = step(uv.x, u_progress);
                return mix(color1, color2, mask);
            }
            
            vec4 zoomTransition(vec2 uv) {
                vec2 center = vec2(0.5, 0.5);
                vec2 toCenter = uv - center;
                
                vec2 uv1 = center + toCenter * (1.0 + u_progress);
                vec2 uv2 = center + toCenter * (2.0 - u_progress);
                
                vec4 color1 = texture2D(u_image1, uv1);
                vec4 color2 = texture2D(u_image2, uv2);
                
                return mix(color1, color2, u_progress);
            }
            
            vec4 morphTransition(vec2 uv) {
                vec2 distorted = uv + sin(uv * 10.0 + u_progress * 5.0) * 0.05 * (1.0 - u_progress);
                
                vec4 color1 = texture2D(u_image1, distorted);
                vec4 color2 = texture2D(u_image2, uv);
                
                return mix(color1, color2, u_progress);
            }
            
            void main() {
                vec4 color;
                
                if (u_transitionType == 0) {
                    color = fadeTransition(v_texCoord);
                } else if (u_transitionType == 1) {
                    color = slideTransition(v_texCoord);
                } else if (u_transitionType == 2) {
                    color = zoomTransition(v_texCoord);
                } else if (u_transitionType == 3) {
                    color = morphTransition(v_texCoord);
                } else {
                    color = fadeTransition(v_texCoord);
                }
                
                gl_FragColor = color;
            }
        `;
        
        // Compile shaders
        const vertexShader = this._createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        
        if (!vertexShader || !fragmentShader) return;
        
        // Create program
        this._program = gl.createProgram();
        gl.attachShader(this._program, vertexShader);
        gl.attachShader(this._program, fragmentShader);
        gl.linkProgram(this._program);
        
        if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
            return;
        }
        
        // Get locations
        this._locations = {
            position: gl.getAttribLocation(this._program, 'a_position'),
            texCoord: gl.getAttribLocation(this._program, 'a_texCoord'),
            image1: gl.getUniformLocation(this._program, 'u_image1'),
            image2: gl.getUniformLocation(this._program, 'u_image2'),
            progress: gl.getUniformLocation(this._program, 'u_progress'),
            transitionType: gl.getUniformLocation(this._program, 'u_transitionType'),
            resolution: gl.getUniformLocation(this._program, 'u_resolution')
        };
        
        // Create buffers
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        const texCoords = new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 0
        ]);
        
        this._positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        this._texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    }
    
    _createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            );
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    _performWebGLTransition(fromIndex, toIndex) {
        if (!this._gl || !this._program || this._isTransitioning) return;
        
        this._isTransitioning = true;
        
        const fromImage = this._images[fromIndex];
        const toImage = this._images[toIndex];
        
        // Load textures
        Promise.all([
            this._loadTexture(fromImage.src),
            this._loadTexture(toImage.src)
        ]).then(([texture1, texture2]) => {
            this._animateTransition(texture1, texture2);
        });
    }
    
    _loadTexture(src) {
        return new Promise((resolve) => {
            const gl = this._gl;
            const texture = gl.createTexture();
            const image = new Image();
            
            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.generateMipmap(gl.TEXTURE_2D);
                resolve(texture);
            };
            
            image.src = src;
        });
    }
    
    _animateTransition(texture1, texture2) {
        const gl = this._gl;
        const canvas = this._canvas;
        const startTime = performance.now();
        
        // Show canvas
        canvas.classList.add('active');
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this._config.transitionDuration, 1);
            
            // Clear
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Use program
            gl.useProgram(this._program);
            
            // Set uniforms
            gl.uniform1f(this._locations.progress, progress);
            gl.uniform1i(this._locations.transitionType, this._getTransitionType());
            gl.uniform2f(this._locations.resolution, canvas.width, canvas.height);
            
            // Bind textures
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture1);
            gl.uniform1i(this._locations.image1, 0);
            
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texture2);
            gl.uniform1i(this._locations.image2, 1);
            
            // Set attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
            gl.enableVertexAttribArray(this._locations.position);
            gl.vertexAttribPointer(this._locations.position, 2, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer);
            gl.enableVertexAttribArray(this._locations.texCoord);
            gl.vertexAttribPointer(this._locations.texCoord, 2, gl.FLOAT, false, 0, 0);
            
            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            
            if (progress < 1) {
                this._rafId = requestAnimationFrame(animate);
            } else {
                // Transition complete
                canvas.classList.remove('active');
                this._isTransitioning = false;
                gl.deleteTexture(texture1);
                gl.deleteTexture(texture2);
            }
        };
        
        this._rafId = requestAnimationFrame(animate);
    }
    
    _getTransitionType() {
        const types = {
            'fade': 0,
            'slide': 1,
            'zoom': 2,
            'morph': 3
        };
        
        return types[this._config.transition] || 0;
    }
    
    _updateFullscreenImage() {
        const image = this.shadowRoot.querySelector('.fullscreen-image');
        if (image) {
            image.style.transform = `scale(${this._zoomLevel}) translate(${this._panPosition.x}px, ${this._panPosition.y}px)`;
        }
    }
    
    _startAutoplay() {
        if (this._autoplayTimer) return;
        
        this._autoplayTimer = setInterval(() => {
            this.next();
        }, this._config.autoplayInterval);
    }
    
    _stopAutoplay() {
        if (this._autoplayTimer) {
            clearInterval(this._autoplayTimer);
            this._autoplayTimer = null;
        }
    }
    
    // Public API
    setImages(images) {
        this._images = images;
        this._currentIndex = 0;
        this._loadedImages.clear();
        this.render();
        
        if (this._config.lazy) {
            requestAnimationFrame(() => {
                this._setupLazyLoading();
            });
        }
    }
    
    addImage(image) {
        this._images.push(image);
        this.render();
    }
    
    removeImage(index) {
        if (index >= 0 && index < this._images.length) {
            this._images.splice(index, 1);
            if (this._currentIndex >= this._images.length) {
                this._currentIndex = Math.max(0, this._images.length - 1);
            }
            this.render();
        }
    }
    
    goToImage(index) {
        if (index < 0 || index >= this._images.length || index === this._currentIndex) return;
        
        const fromIndex = this._currentIndex;
        this._currentIndex = index;
        
        if (this._config.transition === 'webgl' && this._gl) {
            this._performWebGLTransition(fromIndex, index);
        }
        
        this.render();
        
        this.dispatchEvent(new CustomEvent('change', {
            detail: { index, image: this._images[index] }
        }));
    }
    
    next() {
        const nextIndex = this._config.infinite 
            ? (this._currentIndex + 1) % this._images.length
            : Math.min(this._currentIndex + 1, this._images.length - 1);
        
        this.goToImage(nextIndex);
    }
    
    previous() {
        const prevIndex = this._config.infinite
            ? (this._currentIndex - 1 + this._images.length) % this._images.length
            : Math.max(this._currentIndex - 1, 0);
        
        this.goToImage(prevIndex);
    }
    
    openFullscreen(index) {
        if (index !== undefined) {
            this._currentIndex = index;
        }
        
        this._isFullscreen = true;
        this._zoomLevel = 1;
        this._panPosition = { x: 0, y: 0 };
        this.render();
        
        // Stop autoplay in fullscreen
        if (this._autoplayTimer) {
            this._stopAutoplay();
        }
        
        this.dispatchEvent(new CustomEvent('fullscreenopen', {
            detail: { index: this._currentIndex }
        }));
    }
    
    closeFullscreen() {
        this._isFullscreen = false;
        this.render();
        
        // Resume autoplay if it was active
        if (this._config.autoplay && !this._autoplayTimer) {
            this._startAutoplay();
        }
        
        this.dispatchEvent(new CustomEvent('fullscreenclose'));
    }
    
    toggleFullscreen() {
        if (this._isFullscreen) {
            this.closeFullscreen();
        } else {
            this.openFullscreen();
        }
    }
    
    zoomIn() {
        this._zoomLevel = Math.min(this._zoomLevel + 0.5, 4);
        this._updateFullscreenImage();
    }
    
    zoomOut() {
        this._zoomLevel = Math.max(this._zoomLevel - 0.5, 1);
        if (this._zoomLevel === 1) {
            this._panPosition = { x: 0, y: 0 };
        }
        this._updateFullscreenImage();
    }
    
    toggleAutoplay() {
        if (this._autoplayTimer) {
            this._stopAutoplay();
        } else {
            this._startAutoplay();
        }
        this.render();
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        this.render();
        
        if (config.autoplay && !this._autoplayTimer) {
            this._startAutoplay();
        } else if (!config.autoplay && this._autoplayTimer) {
            this._stopAutoplay();
        }
    }
    
    getCurrentIndex() {
        return this._currentIndex;
    }
    
    getCurrentImage() {
        return this._images[this._currentIndex];
    }
    
    getTotalImages() {
        return this._images.length;
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        
        if (this._autoplayTimer) {
            this._stopAutoplay();
        }
        
        if (this._intersectionObserver) {
            this._intersectionObserver.disconnect();
        }
        
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        
        if (this._gl) {
            // Clean up WebGL resources
            const gl = this._gl;
            if (this._program) gl.deleteProgram(this._program);
            if (this._positionBuffer) gl.deleteBuffer(this._positionBuffer);
            if (this._texCoordBuffer) gl.deleteBuffer(this._texCoordBuffer);
            
            // Delete all cached textures
            this._textures.forEach(texture => gl.deleteTexture(texture));
        }
    }
}

// Register element
customElements.define('brutal-gallery', ImageGallery);