/**
 * BRUTAL V3 - DragDropZone Component
 * Physics-based drag and drop with realistic movement
 * GPU-accelerated drag preview, multi-item selection, particle effects
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';
import { html } from '../../01-core/Template.js';
import { ParticleEngine } from '../../03-visual/gpu/ParticleEngine.js';
import { gestureSystem } from '../../02-performance/09-GestureSystem.js';

export class DragDropZone extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {
            accept: '*', // MIME types or selectors
            multiple: true,
            sortable: true,
            groups: [], // Drag groups for connected zones
            physics: {
                enabled: true,
                gravity: 0.5,
                friction: 0.95,
                bounce: 0.8,
                spring: 0.1,
                magnetism: true,
                magnetRange: 50,
                constraints: 'container' // container, none, custom
            },
            preview: {
                type: 'ghost', // ghost, clone, custom
                opacity: 0.8,
                scale: 1.05,
                rotate: true,
                gpu: true
            },
            effects: {
                particles: true,
                glow: true,
                trails: true,
                ripples: true
            },
            validation: null, // Function to validate drops
            theme: 'brutal', // brutal, minimal, neon, glassmorphic
            layout: 'grid', // grid, list, free
            autoScroll: true,
            multiSelect: true,
            keyboard: true
        };
        
        // State
        this._items = [];
        this._dragging = null;
        this._dragSelection = new Set();
        this._dropTarget = null;
        this._isDragOver = false;
        this._physics = new Map(); // Physics state per item
        this._magnetPoints = [];
        
        // Drag state
        this._dragOffset = { x: 0, y: 0 };
        this._dragStart = { x: 0, y: 0 };
        this._velocity = { x: 0, y: 0 };
        this._lastPosition = { x: 0, y: 0 };
        this._lastTime = 0;
        
        // GPU acceleration
        this._canvas = null;
        this._gl = null;
        this._rafId = null;
        
        // Particle system
        this._particleEngine = null;
        
        // Selection
        this._selectionBox = null;
        this._isSelecting = false;
        
        // Keyboard navigation
        this._focusedIndex = -1;
    }
    
    template() {
        const theme = this._getThemeStyles();
        
        return html`
            <div class="dropzone-container ${this._config.theme} ${this._config.layout} ${this._isDragOver ? 'drag-over' : ''}"
                 data-dropzone="true"
                 tabindex="0">
                
                <div class="dropzone-content">
                    ${this._items.length === 0 ? this._renderEmptyState(theme) : ''}
                    
                    <div class="items-container">
                        ${this._renderItems()}
                    </div>
                    
                    ${this._selectionBox ? this._renderSelectionBox() : ''}
                </div>
                
                <canvas class="physics-canvas"></canvas>
                <canvas class="effects-canvas"></canvas>
                
                <div class="particle-container"></div>
                
                ${this._dragging ? this._renderDragPreview() : ''}
                
                <div class="drop-indicator"></div>
            </div>
            
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    min-height: 200px;
                }
                
                .dropzone-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 200px;
                    overflow: hidden;
                    ${theme.container}
                }
                
                .dropzone-container:focus {
                    outline: 2px solid var(--focus-color);
                    outline-offset: 2px;
                }
                
                .dropzone-content {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: inherit;
                }
                
                /* Empty state */
                .empty-state {
                    position: absolute;
                    inset: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border: 2px dashed var(--border-color);
                    border-radius: 8px;
                    transition: all 200ms ease;
                    ${theme.emptyState}
                }
                
                .dropzone-container.drag-over .empty-state {
                    border-color: var(--accent-color);
                    background: var(--drag-over-bg);
                    ${theme.emptyStateDragOver}
                }
                
                .empty-icon {
                    width: 64px;
                    height: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                
                .empty-text {
                    font-size: 16px;
                    opacity: 0.7;
                    margin-bottom: 8px;
                }
                
                .empty-hint {
                    font-size: 14px;
                    opacity: 0.5;
                }
                
                /* Items container */
                .items-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: inherit;
                }
                
                /* Grid layout */
                .grid .items-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 16px;
                    padding: 20px;
                }
                
                /* List layout */
                .list .items-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 20px;
                }
                
                /* Free layout */
                .free .items-container {
                    position: relative;
                }
                
                /* Draggable items */
                .draggable-item {
                    position: relative;
                    cursor: grab;
                    user-select: none;
                    transition: transform 200ms ease, box-shadow 200ms ease;
                    ${theme.item}
                }
                
                .draggable-item:hover {
                    transform: translateY(-2px);
                    ${theme.itemHover}
                }
                
                .draggable-item.dragging {
                    opacity: 0.5;
                    cursor: grabbing;
                    ${theme.itemDragging}
                }
                
                .draggable-item.selected {
                    ${theme.itemSelected}
                }
                
                .draggable-item.focused {
                    ${theme.itemFocused}
                }
                
                .free .draggable-item {
                    position: absolute !important;
                    transition: none;
                }
                
                /* Item content */
                .item-content {
                    padding: 16px;
                    border-radius: 8px;
                    background: var(--item-bg);
                    border: 1px solid var(--item-border);
                    ${theme.itemContent}
                }
                
                .item-handle {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    width: 20px;
                    height: 20px;
                    cursor: grab;
                    opacity: 0.3;
                    transition: opacity 200ms ease;
                }
                
                .draggable-item:hover .item-handle {
                    opacity: 0.7;
                }
                
                .item-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    background: var(--accent-color);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                /* Selection box */
                .selection-box {
                    position: absolute;
                    border: 2px dashed var(--accent-color);
                    background: var(--selection-bg);
                    pointer-events: none;
                    ${theme.selectionBox}
                }
                
                /* Drag preview */
                .drag-preview {
                    position: fixed;
                    pointer-events: none;
                    z-index: 9999;
                    opacity: var(--preview-opacity, 0.8);
                    transform: scale(var(--preview-scale, 1.05));
                    ${theme.dragPreview}
                }
                
                .drag-preview.rotating {
                    animation: subtle-rotate 2s ease-in-out infinite;
                }
                
                @keyframes subtle-rotate {
                    0%, 100% { transform: scale(1.05) rotate(-2deg); }
                    50% { transform: scale(1.05) rotate(2deg); }
                }
                
                .drag-preview-count {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: var(--accent-color);
                    color: white;
                    border-radius: 12px;
                    padding: 4px 8px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                /* Drop indicator */
                .drop-indicator {
                    position: absolute;
                    display: none;
                    pointer-events: none;
                    ${theme.dropIndicator}
                }
                
                .drop-indicator.show {
                    display: block;
                }
                
                .grid .drop-indicator {
                    width: 4px;
                    height: 100%;
                    background: var(--accent-color);
                }
                
                .list .drop-indicator {
                    width: 100%;
                    height: 4px;
                    background: var(--accent-color);
                }
                
                /* Canvas layers */
                .physics-canvas,
                .effects-canvas {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0;
                }
                
                .physics-canvas.debug {
                    opacity: 0.3;
                }
                
                .effects-canvas.active {
                    opacity: 1;
                }
                
                /* Particle container */
                .particle-container {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 2;
                }
                
                /* Themes */
                .brutal {
                    --border-color: #0f0;
                    --accent-color: #0f0;
                    --item-bg: #000;
                    --item-border: #0f0;
                    --drag-over-bg: rgba(0, 255, 0, 0.05);
                    --selection-bg: rgba(0, 255, 0, 0.1);
                    --focus-color: #0f0;
                }
                
                .minimal {
                    --border-color: #e0e0e0;
                    --accent-color: #007aff;
                    --item-bg: #fff;
                    --item-border: #e0e0e0;
                    --drag-over-bg: rgba(0, 122, 255, 0.05);
                    --selection-bg: rgba(0, 122, 255, 0.1);
                    --focus-color: #007aff;
                }
                
                .neon {
                    --border-color: #00ffff;
                    --accent-color: #00ffff;
                    --item-bg: #1a1a2e;
                    --item-border: #00ffff;
                    --drag-over-bg: rgba(0, 255, 255, 0.05);
                    --selection-bg: rgba(0, 255, 255, 0.1);
                    --focus-color: #00ffff;
                }
                
                .glassmorphic {
                    --border-color: rgba(255, 255, 255, 0.2);
                    --accent-color: rgba(255, 255, 255, 0.9);
                    --item-bg: rgba(255, 255, 255, 0.1);
                    --item-border: rgba(255, 255, 255, 0.2);
                    --drag-over-bg: rgba(255, 255, 255, 0.05);
                    --selection-bg: rgba(255, 255, 255, 0.1);
                    --focus-color: rgba(255, 255, 255, 0.9);
                }
                
                /* Drag over effects */
                .dropzone-container.drag-over {
                    ${theme.containerDragOver}
                }
                
                /* File type indicators */
                .item-type-image {
                    --item-accent: #4CAF50;
                }
                
                .item-type-video {
                    --item-accent: #FF5722;
                }
                
                .item-type-audio {
                    --item-accent: #FF9800;
                }
                
                .item-type-document {
                    --item-accent: #2196F3;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .grid .items-container {
                        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                        gap: 12px;
                        padding: 16px;
                    }
                }
                
                /* GPU optimization */
                @supports (transform: translateZ(0)) {
                    .draggable-item,
                    .drag-preview {
                        transform: translateZ(0);
                        backface-visibility: hidden;
                        will-change: transform;
                    }
                }
                
                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .draggable-item {
                        transition: none !important;
                    }
                    
                    .drag-preview.rotating {
                        animation: none !important;
                    }
                }
            </style>
        `.content;
    }
    
    _getThemeStyles() {
        const themes = {
            brutal: {
                container: 'background: #000; border: 3px solid #0f0;',
                emptyState: 'color: #0f0;',
                emptyStateDragOver: 'box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);',
                item: 'box-shadow: 0 2px 0 #0f0;',
                itemHover: 'box-shadow: 0 4px 0 #0f0;',
                itemDragging: 'box-shadow: none;',
                itemSelected: 'box-shadow: 0 0 0 2px #0f0;',
                itemFocused: 'box-shadow: 0 0 0 2px #0f0, 0 0 20px rgba(0, 255, 0, 0.3);',
                itemContent: 'font-family: monospace; text-transform: uppercase;',
                selectionBox: 'background: rgba(0, 255, 0, 0.1);',
                dragPreview: 'filter: drop-shadow(0 0 10px #0f0);',
                dropIndicator: 'box-shadow: 0 0 10px #0f0;',
                containerDragOver: 'background: rgba(0, 255, 0, 0.02);'
            },
            minimal: {
                container: 'background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px;',
                emptyState: 'color: #666;',
                emptyStateDragOver: 'background: rgba(0, 122, 255, 0.05);',
                item: 'box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);',
                itemHover: 'box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);',
                itemDragging: 'box-shadow: none;',
                itemSelected: 'box-shadow: 0 0 0 2px #007aff;',
                itemFocused: 'box-shadow: 0 0 0 2px #007aff, 0 0 0 4px rgba(0, 122, 255, 0.2);',
                itemContent: '',
                selectionBox: '',
                dragPreview: 'filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));',
                dropIndicator: '',
                containerDragOver: 'background: rgba(0, 122, 255, 0.02);'
            },
            neon: {
                container: 'background: #1a1a2e; border: 2px solid #00ffff; box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);',
                emptyState: 'color: #00ffff; text-shadow: 0 0 10px #00ffff;',
                emptyStateDragOver: 'box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);',
                item: 'box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);',
                itemHover: 'box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);',
                itemDragging: 'box-shadow: none;',
                itemSelected: 'box-shadow: 0 0 0 2px #00ffff, 0 0 20px rgba(0, 255, 255, 0.5);',
                itemFocused: 'box-shadow: 0 0 0 2px #00ffff, 0 0 30px rgba(0, 255, 255, 0.7);',
                itemContent: 'text-shadow: 0 0 5px currentColor;',
                selectionBox: 'box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);',
                dragPreview: 'filter: drop-shadow(0 0 20px #00ffff);',
                dropIndicator: 'box-shadow: 0 0 20px #00ffff;',
                containerDragOver: 'box-shadow: inset 0 0 50px rgba(0, 255, 255, 0.1);'
            },
            glassmorphic: {
                container: 'background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px;',
                emptyState: 'color: rgba(255, 255, 255, 0.9);',
                emptyStateDragOver: 'background: rgba(255, 255, 255, 0.1);',
                item: 'backdrop-filter: blur(5px);',
                itemHover: 'background: rgba(255, 255, 255, 0.2);',
                itemDragging: 'opacity: 0.5;',
                itemSelected: 'border-color: rgba(255, 255, 255, 0.5);',
                itemFocused: 'box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);',
                itemContent: '',
                selectionBox: 'backdrop-filter: blur(5px);',
                dragPreview: 'backdrop-filter: blur(10px);',
                dropIndicator: '',
                containerDragOver: 'background: rgba(255, 255, 255, 0.15);'
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    _renderEmptyState(theme) {
        return `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <div class="empty-text">Drop files here</div>
                <div class="empty-hint">or click to browse</div>
            </div>
        `;
    }
    
    _renderItems() {
        return this._items.map((item, index) => {
            const isSelected = this._dragSelection.has(item.id);
            const isFocused = this._focusedIndex === index;
            const isDragging = this._dragging?.id === item.id;
            const position = this._getItemPosition(item);
            
            return `
                <div class="draggable-item ${isSelected ? 'selected' : ''} 
                          ${isFocused ? 'focused' : ''} 
                          ${isDragging ? 'dragging' : ''}
                          item-type-${item.type}"
                     data-item-id="${item.id}"
                     data-index="${index}"
                     draggable="true"
                     style="${this._config.layout === 'free' ? `left: ${position.x}px; top: ${position.y}px;` : ''}">
                    
                    ${this._config.sortable ? '<div class="item-handle" data-handle="true">☰</div>' : ''}
                    
                    <div class="item-content">
                        ${this._renderItemContent(item)}
                    </div>
                    
                    ${isSelected && this._dragSelection.size > 1 ? 
                        `<div class="item-badge">${this._dragSelection.size}</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    _renderItemContent(item) {
        // Override this method for custom item rendering
        if (item.type === 'image' && item.preview) {
            return `<img src="${item.preview}" alt="${item.name}" style="width: 100%; height: 120px; object-fit: cover;">`;
        }
        
        return `
            <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">${this._getItemIcon(item.type)}</div>
                <div style="font-size: 14px; word-break: break-all;">${item.name}</div>
                ${item.size ? `<div style="font-size: 12px; opacity: 0.7;">${this._formatSize(item.size)}</div>` : ''}
            </div>
        `;
    }
    
    _getItemIcon(type) {
        const icons = {
            image: '🖼️',
            video: '🎬',
            audio: '🎵',
            document: '📄',
            code: '💻',
            archive: '📦',
            default: '📎'
        };
        
        return icons[type] || icons.default;
    }
    
    _formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size > 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    
    _renderSelectionBox() {
        if (!this._selectionBox) return '';
        
        return `
            <div class="selection-box" style="
                left: ${Math.min(this._selectionBox.start.x, this._selectionBox.end.x)}px;
                top: ${Math.min(this._selectionBox.start.y, this._selectionBox.end.y)}px;
                width: ${Math.abs(this._selectionBox.end.x - this._selectionBox.start.x)}px;
                height: ${Math.abs(this._selectionBox.end.y - this._selectionBox.start.y)}px;
            "></div>
        `;
    }
    
    _renderDragPreview() {
        if (!this._dragging) return '';
        
        const count = this._dragSelection.size || 1;
        const rotate = this._config.preview.rotate ? 'rotating' : '';
        
        return `
            <div class="drag-preview ${rotate}" 
                 style="left: ${this._lastPosition.x}px; 
                        top: ${this._lastPosition.y}px;
                        --preview-opacity: ${this._config.preview.opacity};
                        --preview-scale: ${this._config.preview.scale};">
                ${this._renderItemContent(this._dragging)}
                ${count > 1 ? `<div class="drag-preview-count">${count}</div>` : ''}
            </div>
        `;
    }
    
    _getItemPosition(item) {
        if (this._physics.has(item.id)) {
            return this._physics.get(item.id).position;
        }
        return { x: 0, y: 0 };
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame(() => {
            this._setupEventListeners();
            this._setupKeyboardNavigation();
            
            if (this._config.physics.enabled) {
                this._initPhysics();
            }
            
            if (this._config.effects.particles) {
                this._initParticles();
            }
            
            if (this._config.preview.gpu) {
                this._initGPUPreview();
            }
        });
    }
    
    _setupEventListeners() {
        const container = this.shadowRoot.querySelector('.dropzone-container');
        
        // Drag and drop events
        container.addEventListener('dragstart', this._handleDragStart.bind(this));
        container.addEventListener('dragend', this._handleDragEnd.bind(this));
        container.addEventListener('dragover', this._handleDragOver.bind(this));
        container.addEventListener('dragenter', this._handleDragEnter.bind(this));
        container.addEventListener('dragleave', this._handleDragLeave.bind(this));
        container.addEventListener('drop', this._handleDrop.bind(this));
        
        // Mouse events for selection
        container.addEventListener('mousedown', this._handleMouseDown.bind(this));
        container.addEventListener('mousemove', this._handleMouseMove.bind(this));
        container.addEventListener('mouseup', this._handleMouseUp.bind(this));
        
        // Click events
        container.addEventListener('click', this._handleClick.bind(this));
        
        // Touch events
        container.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
        container.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
        container.addEventListener('touchend', this._handleTouchEnd.bind(this));
        
        // File input for click-to-browse
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = this._config.multiple;
                input.accept = this._config.accept;
                input.onchange = (e) => this._handleFileSelect(e.target.files);
                input.click();
            });
        }
    }
    
    _setupKeyboardNavigation() {
        if (!this._config.keyboard) return;
        
        const container = this.shadowRoot.querySelector('.dropzone-container');
        
        container.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    e.preventDefault();
                    this._navigateItems(e.key);
                    break;
                case ' ':
                    e.preventDefault();
                    this._toggleItemSelection(this._focusedIndex);
                    break;
                case 'Enter':
                    e.preventDefault();
                    this._activateItem(this._focusedIndex);
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this._deleteSelected();
                    break;
                case 'a':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this._selectAll();
                    }
                    break;
            }
        });
    }
    
    _initPhysics() {
        this._canvas = this.shadowRoot.querySelector('.physics-canvas');
        const ctx = this._canvas.getContext('2d');
        
        // Initialize physics for existing items
        this._items.forEach(item => {
            if (!this._physics.has(item.id)) {
                this._physics.set(item.id, {
                    position: { x: Math.random() * 400, y: Math.random() * 400 },
                    velocity: { x: 0, y: 0 },
                    mass: 1,
                    radius: 50
                });
            }
        });
        
        // Start physics simulation
        this._startPhysicsSimulation();
    }
    
    _startPhysicsSimulation() {
        const animate = () => {
            this._updatePhysics();
            
            if (this._config.physics.enabled) {
                this._rafId = requestAnimationFrame(animate);
            }
        };
        
        this._rafId = requestAnimationFrame(animate);
    }
    
    _updatePhysics() {
        const config = this._config.physics;
        
        this._physics.forEach((physics, itemId) => {
            // Apply gravity
            physics.velocity.y += config.gravity;
            
            // Apply friction
            physics.velocity.x *= config.friction;
            physics.velocity.y *= config.friction;
            
            // Update position
            physics.position.x += physics.velocity.x;
            physics.position.y += physics.velocity.y;
            
            // Container constraints
            if (config.constraints === 'container') {
                const container = this.shadowRoot.querySelector('.items-container');
                const bounds = container.getBoundingClientRect();
                
                // Bounce off walls
                if (physics.position.x - physics.radius < 0 || 
                    physics.position.x + physics.radius > bounds.width) {
                    physics.velocity.x *= -config.bounce;
                    physics.position.x = Math.max(physics.radius, 
                        Math.min(bounds.width - physics.radius, physics.position.x));
                }
                
                if (physics.position.y - physics.radius < 0 || 
                    physics.position.y + physics.radius > bounds.height) {
                    physics.velocity.y *= -config.bounce;
                    physics.position.y = Math.max(physics.radius, 
                        Math.min(bounds.height - physics.radius, physics.position.y));
                }
            }
            
            // Magnetism
            if (config.magnetism && this._magnetPoints.length > 0) {
                this._magnetPoints.forEach(magnet => {
                    const dx = magnet.x - physics.position.x;
                    const dy = magnet.y - physics.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < config.magnetRange && distance > 0) {
                        const force = (config.magnetRange - distance) / config.magnetRange * config.spring;
                        physics.velocity.x += (dx / distance) * force;
                        physics.velocity.y += (dy / distance) * force;
                    }
                });
            }
        });
        
        // Update DOM positions for free layout
        if (this._config.layout === 'free') {
            this._updateItemPositions();
        }
    }
    
    _updateItemPositions() {
        this._items.forEach(item => {
            const element = this.shadowRoot.querySelector(`[data-item-id="${item.id}"]`);
            if (element && this._physics.has(item.id)) {
                const physics = this._physics.get(item.id);
                element.style.transform = `translate(${physics.position.x}px, ${physics.position.y}px)`;
            }
        });
    }
    
    _initParticles() {
        const container = this.shadowRoot.querySelector('.particle-container');
        this._particleEngine = new ParticleEngine({
            container,
            maxParticles: 200,
            autoStart: false,
            mode: 'cpu',
            config: {
                particle: {
                    size: { min: 2, max: 6 },
                    life: { min: 500, max: 1500 },
                    velocity: { min: 1, max: 4 },
                    colors: this._getParticleColors()
                }
            }
        });
    }
    
    _getParticleColors() {
        const colors = {
            brutal: ['#00ff00', '#00cc00', '#00ff00'],
            minimal: ['#007aff', '#0051d5', '#007aff'],
            neon: ['#00ffff', '#00cccc', '#0099cc'],
            glassmorphic: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)']
        };
        
        return colors[this._config.theme] || colors.brutal;
    }
    
    _initGPUPreview() {
        const canvas = this.shadowRoot.querySelector('.effects-canvas');
        this._gl = canvas.getContext('webgl') || canvas.getContext('2d');
        
        // Setup WebGL shaders for GPU effects
        // Similar to other components
    }
    
    _handleDragStart(e) {
        const item = e.target.closest('.draggable-item');
        if (!item) return;
        
        const itemId = item.dataset.itemId;
        const itemData = this._items.find(i => i.id === itemId);
        if (!itemData) return;
        
        this._dragging = itemData;
        this._dragOffset = {
            x: e.clientX - item.offsetLeft,
            y: e.clientY - item.offsetTop
        };
        
        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            item: itemData,
            selection: Array.from(this._dragSelection)
        }));
        
        // Create custom drag image if GPU preview
        if (this._config.preview.gpu) {
            const dragImage = new Image();
            dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(dragImage, 0, 0);
        }
        
        // Add dragging class
        item.classList.add('dragging');
        
        // Trigger particle effect
        if (this._config.effects.particles) {
            this._triggerDragStartParticles(e.clientX, e.clientY);
        }
        
        // Start physics if enabled
        if (this._config.physics.enabled) {
            this._lastPosition = { x: e.clientX, y: e.clientY };
            this._lastTime = Date.now();
        }
    }
    
    _handleDragEnd(e) {
        const item = e.target.closest('.draggable-item');
        if (item) {
            item.classList.remove('dragging');
        }
        
        this._dragging = null;
        this._dragSelection.clear();
        this.render();
    }
    
    _handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Update physics
        if (this._config.physics.enabled && this._dragging) {
            const now = Date.now();
            const dt = now - this._lastTime;
            
            this._velocity = {
                x: (e.clientX - this._lastPosition.x) / dt,
                y: (e.clientY - this._lastPosition.y) / dt
            };
            
            this._lastPosition = { x: e.clientX, y: e.clientY };
            this._lastTime = now;
        }
        
        // Update drop indicator
        this._updateDropIndicator(e);
    }
    
    _handleDragEnter(e) {
        if (e.target === this.shadowRoot.querySelector('.dropzone-container')) {
            this._isDragOver = true;
            this.render();
        }
    }
    
    _handleDragLeave(e) {
        if (e.target === this.shadowRoot.querySelector('.dropzone-container')) {
            this._isDragOver = false;
            this.render();
        }
    }
    
    _handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this._isDragOver = false;
        
        // Handle file drop
        if (e.dataTransfer.files.length > 0) {
            this._handleFileSelect(e.dataTransfer.files);
            return;
        }
        
        // Handle item drop
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const dropPosition = this._getDropPosition(e);
            
            // Validate drop
            if (this._config.validation) {
                const isValid = this._config.validation(data.item, dropPosition);
                if (!isValid) {
                    this._triggerInvalidDropEffect(e.clientX, e.clientY);
                    return;
                }
            }
            
            // Apply physics to dropped item
            if (this._config.physics.enabled && this._physics.has(data.item.id)) {
                const physics = this._physics.get(data.item.id);
                physics.position = { x: e.clientX, y: e.clientY };
                physics.velocity = this._velocity;
            }
            
            // Trigger drop effects
            if (this._config.effects.particles) {
                this._triggerDropParticles(e.clientX, e.clientY);
            }
            
            if (this._config.effects.ripples) {
                this._triggerRippleEffect(e.clientX, e.clientY);
            }
            
            // Emit drop event
            this.dispatchEvent(new CustomEvent('itemdrop', {
                detail: {
                    item: data.item,
                    position: dropPosition,
                    selection: data.selection
                }
            }));
        } catch (e) {
            }
        
        this.render();
    }
    
    _handleFileSelect(files) {
        const fileArray = Array.from(files);
        
        fileArray.forEach(file => {
            const item = {
                id: `file-${Date.now()}-${Math.random()}`,
                name: file.name,
                type: this._getFileType(file),
                size: file.size,
                file: file,
                preview: null
            };
            
            // Generate preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    item.preview = e.target.result;
                    this.render();
                };
                reader.readAsDataURL(file);
            }
            
            this.addItem(item);
        });
        
        // Trigger upload effect
        if (this._config.effects.particles) {
            this._triggerUploadParticles();
        }
    }
    
    _getFileType(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type.includes('pdf') || file.type.includes('document')) return 'document';
        if (file.name.match(/\.(js|ts|py|java|cpp|c|h|css|html|json|xml)$/i)) return 'code';
        if (file.name.match(/\.(zip|rar|7z|tar|gz)$/i)) return 'archive';
        return 'default';
    }
    
    _handleMouseDown(e) {
        if (e.target.closest('.draggable-item')) return;
        
        // Start selection box
        if (this._config.multiSelect) {
            this._isSelecting = true;
            const rect = this.shadowRoot.querySelector('.items-container').getBoundingClientRect();
            this._selectionBox = {
                start: { x: e.clientX - rect.left, y: e.clientY - rect.top },
                end: { x: e.clientX - rect.left, y: e.clientY - rect.top }
            };
        }
    }
    
    _handleMouseMove(e) {
        if (!this._isSelecting) return;
        
        const rect = this.shadowRoot.querySelector('.items-container').getBoundingClientRect();
        this._selectionBox.end = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Update selection
        this._updateSelection();
        this.render();
    }
    
    _handleMouseUp(e) {
        if (this._isSelecting) {
            this._isSelecting = false;
            this._selectionBox = null;
            this.render();
        }
    }
    
    _handleClick(e) {
        const item = e.target.closest('.draggable-item');
        if (!item) {
            // Clear selection when clicking empty space
            this._dragSelection.clear();
            this.render();
            return;
        }
        
        const itemId = item.dataset.itemId;
        const index = parseInt(item.dataset.index);
        
        if (e.ctrlKey || e.metaKey) {
            // Toggle selection
            if (this._dragSelection.has(itemId)) {
                this._dragSelection.delete(itemId);
            } else {
                this._dragSelection.add(itemId);
            }
        } else if (e.shiftKey && this._focusedIndex >= 0) {
            // Range selection
            const start = Math.min(this._focusedIndex, index);
            const end = Math.max(this._focusedIndex, index);
            
            for (let i = start; i <= end; i++) {
                const id = this._items[i]?.id;
                if (id) this._dragSelection.add(id);
            }
        } else {
            // Single selection
            this._dragSelection.clear();
            this._dragSelection.add(itemId);
        }
        
        this._focusedIndex = index;
        this.render();
    }
    
    _handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const item = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.draggable-item');
        
        if (item) {
            e.preventDefault();
            this._touchDragItem = item;
            this._touchStartPosition = { x: touch.clientX, y: touch.clientY };
        }
    }
    
    _handleTouchMove(e) {
        if (!this._touchDragItem || e.touches.length !== 1) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        // Create drag preview
        if (!this._touchDragPreview) {
            this._touchDragPreview = this._touchDragItem.cloneNode(true);
            this._touchDragPreview.classList.add('drag-preview');
            this._touchDragPreview.style.position = 'fixed';
            this._touchDragPreview.style.pointerEvents = 'none';
            document.body.appendChild(this._touchDragPreview);
        }
        
        // Update preview position
        this._touchDragPreview.style.left = `${touch.clientX - 50}px`;
        this._touchDragPreview.style.top = `${touch.clientY - 50}px`;
    }
    
    _handleTouchEnd(e) {
        if (this._touchDragPreview) {
            this._touchDragPreview.remove();
            this._touchDragPreview = null;
        }
        
        this._touchDragItem = null;
    }
    
    _navigateItems(direction) {
        const itemCount = this._items.length;
        if (itemCount === 0) return;
        
        let newIndex = this._focusedIndex;
        
        switch (direction) {
            case 'ArrowUp':
                newIndex = Math.max(0, newIndex - this._getColumnsCount());
                break;
            case 'ArrowDown':
                newIndex = Math.min(itemCount - 1, newIndex + this._getColumnsCount());
                break;
            case 'ArrowLeft':
                newIndex = Math.max(0, newIndex - 1);
                break;
            case 'ArrowRight':
                newIndex = Math.min(itemCount - 1, newIndex + 1);
                break;
        }
        
        this._focusedIndex = newIndex;
        this._scrollToItem(newIndex);
        this.render();
    }
    
    _getColumnsCount() {
        if (this._config.layout !== 'grid') return 1;
        
        const container = this.shadowRoot.querySelector('.items-container');
        const itemWidth = 150 + 16; // item width + gap
        return Math.floor(container.offsetWidth / itemWidth);
    }
    
    _scrollToItem(index) {
        const item = this.shadowRoot.querySelector(`[data-index="${index}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    _toggleItemSelection(index) {
        if (index < 0 || index >= this._items.length) return;
        
        const itemId = this._items[index].id;
        if (this._dragSelection.has(itemId)) {
            this._dragSelection.delete(itemId);
        } else {
            this._dragSelection.add(itemId);
        }
        
        this.render();
    }
    
    _activateItem(index) {
        if (index < 0 || index >= this._items.length) return;
        
        const item = this._items[index];
        this.dispatchEvent(new CustomEvent('itemactivate', {
            detail: { item, index }
        }));
    }
    
    _selectAll() {
        this._items.forEach(item => {
            this._dragSelection.add(item.id);
        });
        this.render();
    }
    
    _deleteSelected() {
        const selectedIds = Array.from(this._dragSelection);
        
        selectedIds.forEach(id => {
            const index = this._items.findIndex(item => item.id === id);
            if (index >= 0) {
                this._items.splice(index, 1);
                this._physics.delete(id);
            }
        });
        
        this._dragSelection.clear();
        this._focusedIndex = Math.min(this._focusedIndex, this._items.length - 1);
        
        if (this._config.effects.particles) {
            this._triggerDeleteParticles();
        }
        
        this.render();
        
        this.dispatchEvent(new CustomEvent('itemsdelete', {
            detail: { items: selectedIds }
        }));
    }
    
    _updateSelection() {
        if (!this._selectionBox) return;
        
        const box = {
            left: Math.min(this._selectionBox.start.x, this._selectionBox.end.x),
            top: Math.min(this._selectionBox.start.y, this._selectionBox.end.y),
            right: Math.max(this._selectionBox.start.x, this._selectionBox.end.x),
            bottom: Math.max(this._selectionBox.start.y, this._selectionBox.end.y)
        };
        
        this._dragSelection.clear();
        
        this._items.forEach((item, index) => {
            const element = this.shadowRoot.querySelector(`[data-index="${index}"]`);
            if (!element) return;
            
            const rect = element.getBoundingClientRect();
            const containerRect = this.shadowRoot.querySelector('.items-container').getBoundingClientRect();
            
            const itemBox = {
                left: rect.left - containerRect.left,
                top: rect.top - containerRect.top,
                right: rect.right - containerRect.left,
                bottom: rect.bottom - containerRect.top
            };
            
            // Check intersection
            if (!(itemBox.left > box.right || itemBox.right < box.left ||
                  itemBox.top > box.bottom || itemBox.bottom < box.top)) {
                this._dragSelection.add(item.id);
            }
        });
    }
    
    _updateDropIndicator(e) {
        const indicator = this.shadowRoot.querySelector('.drop-indicator');
        if (!indicator) return;
        
        const dropPosition = this._getDropPosition(e);
        
        if (this._config.layout === 'grid' || this._config.layout === 'list') {
            const isVertical = this._config.layout === 'list';
            
            if (isVertical) {
                indicator.style.top = `${dropPosition.y}px`;
                indicator.style.left = '20px';
                indicator.style.right = '20px';
                indicator.style.height = '4px';
            } else {
                indicator.style.left = `${dropPosition.x}px`;
                indicator.style.top = '20px';
                indicator.style.bottom = '20px';
                indicator.style.width = '4px';
            }
            
            indicator.classList.add('show');
        }
    }
    
    _getDropPosition(e) {
        const container = this.shadowRoot.querySelector('.items-container');
        const rect = container.getBoundingClientRect();
        
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            index: this._getDropIndex(e)
        };
    }
    
    _getDropIndex(e) {
        // Calculate drop index based on mouse position
        // This is a simplified version
        return this._items.length;
    }
    
    // Particle effects
    _triggerDragStartParticles(x, y) {
        if (!this._particleEngine) return;
        
        this._particleEngine.burst({
            count: 20,
            position: { x: x / window.innerWidth, y: y / window.innerHeight },
            velocity: { min: 2, max: 5 },
            spread: { x: 0.1, y: 0.1 }
        });
    }
    
    _triggerDropParticles(x, y) {
        if (!this._particleEngine) return;
        
        this._particleEngine.burst({
            count: 30,
            position: { x: x / window.innerWidth, y: y / window.innerHeight },
            velocity: { min: -5, max: 5 },
            spread: { x: 0.2, y: 0.2 },
            gravity: 0.5
        });
    }
    
    _triggerUploadParticles() {
        if (!this._particleEngine) return;
        
        // Fireworks effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this._particleEngine.burst({
                    count: 50,
                    position: { x: 0.5, y: 0.8 },
                    velocity: { min: -10, max: -5 },
                    spread: { x: 0.3, y: 0.1 }
                });
            }, i * 200);
        }
    }
    
    _triggerDeleteParticles() {
        if (!this._particleEngine) return;
        
        // Disintegration effect
        this._particleEngine.burst({
            count: 40,
            position: { x: 0.5, y: 0.5 },
            velocity: { min: 2, max: 8 },
            spread: { x: 0.5, y: 0.5 },
            life: { min: 1000, max: 2000 }
        });
    }
    
    _triggerInvalidDropEffect(x, y) {
        // Red flash or shake effect
        const container = this.shadowRoot.querySelector('.dropzone-container');
        container.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
    }
    
    _triggerRippleEffect(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.shadowRoot.querySelector('.dropzone-container').appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 1000);
    }
    
    // Public API
    addItem(item) {
        if (!item.id) {
            item.id = `item-${Date.now()}-${Math.random()}`;
        }
        
        this._items.push(item);
        
        // Initialize physics
        if (this._config.physics.enabled) {
            this._physics.set(item.id, {
                position: { x: Math.random() * 400, y: Math.random() * 400 },
                velocity: { x: 0, y: 0 },
                mass: 1,
                radius: 50
            });
        }
        
        this.render();
        
        this.dispatchEvent(new CustomEvent('itemadd', {
            detail: { item }
        }));
    }
    
    removeItem(itemId) {
        const index = this._items.findIndex(item => item.id === itemId);
        if (index >= 0) {
            const item = this._items[index];
            this._items.splice(index, 1);
            this._physics.delete(itemId);
            this._dragSelection.delete(itemId);
            
            this.render();
            
            this.dispatchEvent(new CustomEvent('itemremove', {
                detail: { item }
            }));
        }
    }
    
    getItems() {
        return [...this._items];
    }
    
    getSelectedItems() {
        return this._items.filter(item => this._dragSelection.has(item.id));
    }
    
    clearSelection() {
        this._dragSelection.clear();
        this.render();
    }
    
    setItems(items) {
        this._items = items;
        this._dragSelection.clear();
        this._physics.clear();
        
        // Initialize physics for new items
        if (this._config.physics.enabled) {
            items.forEach(item => {
                this._physics.set(item.id, {
                    position: { x: Math.random() * 400, y: Math.random() * 400 },
                    velocity: { x: 0, y: 0 },
                    mass: 1,
                    radius: 50
                });
            });
        }
        
        this.render();
    }
    
    sortItems(compareFn) {
        this._items.sort(compareFn);
        this.render();
    }
    
    filterItems(predicate) {
        this._items = this._items.filter(predicate);
        this.render();
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        
        if (config.physics?.enabled && !this._rafId) {
            this._initPhysics();
        } else if (!config.physics?.enabled && this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        
        this.render();
    }
    
    addMagnetPoint(x, y) {
        this._magnetPoints.push({ x, y });
    }
    
    clearMagnetPoints() {
        this._magnetPoints = [];
    }
    
    enableDebugMode() {
        const canvas = this.shadowRoot.querySelector('.physics-canvas');
        if (canvas) {
            canvas.classList.add('debug');
        }
    }
    
    disableDebugMode() {
        const canvas = this.shadowRoot.querySelector('.physics-canvas');
        if (canvas) {
            canvas.classList.remove('debug');
        }
    }
    
    destroy() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        
        if (this._particleEngine) {
            this._particleEngine.destroy();
        }
        
        this._items = [];
        this._physics.clear();
        this._dragSelection.clear();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this.destroy();
    }
}

// Register element
customElements.define('brutal-dragdrop', DragDropZone);