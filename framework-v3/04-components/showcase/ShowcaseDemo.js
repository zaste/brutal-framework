/**
 * BRUTAL V3 - ShowcaseDemo Component
 * Comprehensive demo showcasing all framework components
 * Interactive playground with real-time performance metrics
 */

import { BrutalComponent } from '../base/BrutalComponent.js';
import { html } from '../../01-core/Template.js';
import { performanceMonitor } from '../../02-performance/01-Monitor.js';

// Import all components
import '../navigation/NavigationBar.js';
import '../data/DataGrid.js';
import '../forms/FormBuilder.js';
import '../ui/Modal.js';
import '../media/Carousel.js';
import '../visualization/Timeline.js';
import '../charts/Charts.js';
import '../ui/SearchBox.js';
import '../ui/Notifications.js';
import '../ui/TabPanel.js';
import '../ui/Accordion.js';
import '../ui/Tooltip.js';
import '../ui/ProgressBar.js';
import '../ui/LoadingSpinner.js';
import '../media/ImageGallery.js';
import '../media/VideoPlayer.js';
import '../advanced/CodeEditor.js';
import '../advanced/DragDropZone.js';
import '../core/HeroSection.js';

export class ShowcaseDemo extends BrutalComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {
            theme: 'brutal', // brutal, minimal, neon, glassmorphic
            performanceMode: true,
            interactiveMode: true,
            categories: [
                'core',
                'navigation',
                'data',
                'forms',
                'ui',
                'media',
                'visualization',
                'charts',
                'advanced'
            ]
        };
        
        // State
        this._activeCategory = 'all';
        this._activeComponent = null;
        this._searchQuery = '';
        this._performanceData = {
            fps: 60,
            memory: 0,
            renderTime: 0,
            componentCount: 0
        };
        
        // Component demos
        this._componentDemos = this._getComponentDemos();
        
        // Performance tracking
        this._startTime = performance.now();
        this._frameCount = 0;
        this._lastFrameTime = 0;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        // Start performance monitoring
        if (this._config.performanceMode) {
            this._startPerformanceMonitoring();
        }
        
        // Setup keyboard navigation
        this._setupKeyboardNavigation();
    }
    
    template() {
        const filteredDemos = this._getFilteredDemos();
        
        return html`
            <div class="showcase-container ${this._config.theme}">
                <!-- Header with search and performance metrics -->
                <header class="showcase-header">
                    <div class="header-content">
                        <h1 class="showcase-title">
                            BRUTAL V3 Component Showcase
                            <span class="version">v3.0.0</span>
                        </h1>
                        
                        <div class="header-controls">
                            <search-box
                                placeholder="Search components..."
                                @search="${this._handleSearch}"
                                theme="minimal"
                            ></search-box>
                            
                            ${this._config.performanceMode ? this._renderPerformanceMetrics() : ''}
                        </div>
                    </div>
                    
                    <!-- Category filter -->
                    <nav class="category-nav">
                        <button 
                            class="category-btn ${this._activeCategory === 'all' ? 'active' : ''}"
                            @click="${() => this._setCategory('all')}"
                        >
                            All Components
                        </button>
                        ${this._config.categories.map(cat => html`
                            <button 
                                class="category-btn ${this._activeCategory === cat ? 'active' : ''}"
                                @click="${() => this._setCategory(cat)}"
                            >
                                ${this._formatCategoryName(cat)}
                            </button>
                        `)}
                    </nav>
                </header>
                
                <!-- Component grid -->
                <main class="showcase-grid">
                    ${filteredDemos.length === 0 ? this._renderEmptyState() : ''}
                    
                    ${filteredDemos.map(demo => this._renderComponentCard(demo))}
                </main>
                
                <!-- Interactive playground modal -->
                ${this._activeComponent ? this._renderPlayground() : ''}
                
                <!-- Notifications for demo interactions -->
                <notifications-component></notifications-component>
            </div>
        `;
    }
    
    _renderPerformanceMetrics() {
        return html`
            <div class="performance-metrics">
                <div class="metric">
                    <span class="metric-value">${this._performanceData.fps}</span>
                    <span class="metric-label">FPS</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${this._performanceData.memory}MB</span>
                    <span class="metric-label">Memory</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${this._performanceData.renderTime}ms</span>
                    <span class="metric-label">Render</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${this._performanceData.componentCount}</span>
                    <span class="metric-label">Components</span>
                </div>
            </div>
        `;
    }
    
    _renderComponentCard(demo) {
        return html`
            <article class="component-card" data-category="${demo.category}">
                <div class="card-header">
                    <h3 class="component-name">${demo.name}</h3>
                    <span class="component-category">${demo.category}</span>
                </div>
                
                <div class="card-preview">
                    ${demo.preview}
                </div>
                
                <p class="component-description">${demo.description}</p>
                
                <div class="card-features">
                    ${demo.features.map(feature => html`
                        <span class="feature-tag">${feature}</span>
                    `)}
                </div>
                
                <div class="card-actions">
                    <button 
                        class="btn-demo"
                        @click="${() => this._openPlayground(demo)}"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Interactive Demo
                    </button>
                    
                    <button 
                        class="btn-code"
                        @click="${() => this._showCode(demo)}"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="16 18 22 12 16 6"/>
                            <polyline points="8 6 2 12 8 18"/>
                        </svg>
                        View Code
                    </button>
                </div>
                
                ${demo.stats ? html`
                    <div class="card-stats">
                        <span class="stat">
                            <strong>${demo.stats.size}</strong> size
                        </span>
                        <span class="stat">
                            <strong>${demo.stats.performance}</strong> perf
                        </span>
                    </div>
                ` : ''}
            </article>
        `;
    }
    
    _renderPlayground() {
        const demo = this._activeComponent;
        
        return html`
            <modal-component
                open="${true}"
                size="fullscreen"
                @close="${() => this._closePlayground()}"
            >
                <div class="playground-container">
                    <header class="playground-header">
                        <h2>${demo.name} Playground</h2>
                        <div class="playground-controls">
                            <tab-panel>
                                <div slot="tab-1">Demo</div>
                                <div slot="panel-1">
                                    <div class="demo-area">
                                        ${demo.playground}
                                    </div>
                                </div>
                                
                                <div slot="tab-2">Code</div>
                                <div slot="panel-2">
                                    <code-editor
                                        language="javascript"
                                        theme="brutal"
                                        value="${demo.code}"
                                        readonly="${true}"
                                    ></code-editor>
                                </div>
                                
                                <div slot="tab-3">Props</div>
                                <div slot="panel-3">
                                    <form-builder
                                        schema="${JSON.stringify(demo.propsSchema)}"
                                        @submit="${(e) => this._updateDemoProps(e.detail)}"
                                    ></form-builder>
                                </div>
                                
                                <div slot="tab-4">Performance</div>
                                <div slot="panel-4">
                                    <charts-component
                                        type="line"
                                        data="${JSON.stringify(this._getComponentMetrics(demo))}"
                                        options="${JSON.stringify({
                                            responsive: true,
                                            gpu: true
                                        })}"
                                    ></charts-component>
                                </div>
                            </tab-panel>
                        </div>
                    </header>
                </div>
            </modal-component>
        `;
    }
    
    _renderEmptyState() {
        return html`
            <div class="empty-state">
                <loading-spinner pattern="matrix"></loading-spinner>
                <p>No components match your search</p>
            </div>
        `;
    }
    
    styles() {
        return `
            :host {
                display: block;
                width: 100%;
                min-height: 100vh;
                background: var(--showcase-bg, #f9fafb);
            }
            
            .showcase-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            /* Header */
            .showcase-header {
                margin-bottom: 3rem;
            }
            
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 2rem;
                flex-wrap: wrap;
                gap: 2rem;
            }
            
            .showcase-title {
                font-size: 2.5rem;
                font-weight: 800;
                margin: 0;
                display: flex;
                align-items: baseline;
                gap: 1rem;
            }
            
            .version {
                font-size: 1rem;
                font-weight: 400;
                color: #666;
            }
            
            .header-controls {
                display: flex;
                gap: 2rem;
                align-items: center;
            }
            
            /* Performance Metrics */
            .performance-metrics {
                display: flex;
                gap: 1.5rem;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 0.5rem;
            }
            
            .metric {
                text-align: center;
            }
            
            .metric-value {
                display: block;
                font-size: 1.5rem;
                font-weight: bold;
                color: #3b82f6;
            }
            
            .metric-label {
                display: block;
                font-size: 0.75rem;
                color: #666;
                text-transform: uppercase;
            }
            
            /* Category Navigation */
            .category-nav {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                padding: 1rem;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .category-btn {
                padding: 0.5rem 1rem;
                border: none;
                background: transparent;
                color: #666;
                font-weight: 500;
                border-radius: 0.25rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .category-btn:hover {
                background: #f3f4f6;
                color: #111;
            }
            
            .category-btn.active {
                background: #3b82f6;
                color: white;
            }
            
            /* Component Grid */
            .showcase-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: 2rem;
            }
            
            /* Component Card */
            .component-card {
                background: white;
                border-radius: 0.75rem;
                padding: 1.5rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: transform;
            }
            
            .component-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }
            
            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .component-name {
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0;
            }
            
            .component-category {
                font-size: 0.75rem;
                text-transform: uppercase;
                color: #666;
                background: #f3f4f6;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
            }
            
            .card-preview {
                height: 200px;
                background: #f9fafb;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            }
            
            .component-description {
                color: #666;
                line-height: 1.6;
                margin-bottom: 1rem;
            }
            
            .card-features {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 1rem;
            }
            
            .feature-tag {
                font-size: 0.75rem;
                background: #e0e7ff;
                color: #4338ca;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
            }
            
            .card-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .btn-demo,
            .btn-code {
                flex: 1;
                padding: 0.75rem 1rem;
                border: none;
                border-radius: 0.5rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            
            .btn-demo {
                background: #3b82f6;
                color: white;
            }
            
            .btn-demo:hover {
                background: #2563eb;
                transform: scale(1.02);
            }
            
            .btn-code {
                background: #f3f4f6;
                color: #666;
            }
            
            .btn-code:hover {
                background: #e5e7eb;
                color: #111;
            }
            
            .card-stats {
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-around;
            }
            
            .stat {
                font-size: 0.875rem;
                color: #666;
            }
            
            .stat strong {
                color: #111;
            }
            
            /* Playground */
            .playground-container {
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .playground-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .playground-header h2 {
                margin: 0 0 1rem 0;
            }
            
            .demo-area {
                padding: 2rem;
                min-height: 400px;
            }
            
            /* Empty State */
            .empty-state {
                grid-column: 1 / -1;
                text-align: center;
                padding: 4rem;
                color: #666;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .showcase-container {
                    padding: 1rem;
                }
                
                .showcase-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .header-content {
                    flex-direction: column;
                }
                
                .performance-metrics {
                    width: 100%;
                }
            }
            
            /* Theme Variations */
            .showcase-container.neon {
                background: #0a0a0a;
                color: white;
            }
            
            .showcase-container.neon .component-card {
                background: #1a1a1a;
                border: 1px solid #333;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
            }
            
            .showcase-container.neon .component-card:hover {
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
            }
            
            /* Animations */
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .component-card {
                animation: slideIn 0.4s ease-out backwards;
            }
            
            .component-card:nth-child(1) { animation-delay: 0s; }
            .component-card:nth-child(2) { animation-delay: 0.05s; }
            .component-card:nth-child(3) { animation-delay: 0.1s; }
            .component-card:nth-child(4) { animation-delay: 0.15s; }
            .component-card:nth-child(5) { animation-delay: 0.2s; }
            .component-card:nth-child(6) { animation-delay: 0.25s; }
        `;
    }
    
    /**
     * Get all component demos
     */
    _getComponentDemos() {
        return [
            {
                name: 'HeroSection',
                category: 'core',
                description: 'GPU-accelerated hero section with WebGL effects, particles, and multiple variants',
                features: ['WebGL', 'Particles', '13 Variants', 'Lazy Loading'],
                preview: html`<hero-section variant="particles" style="height: 100%;"></hero-section>`,
                playground: html`
                    <hero-section 
                        variant="galaxy"
                        title="BRUTAL V3 Framework"
                        subtitle="Building the future of web performance"
                    ></hero-section>
                `,
                code: `<hero-section variant="galaxy" title="..." subtitle="..."></hero-section>`,
                propsSchema: {
                    variant: { type: 'select', options: Object.keys(HeroSection.variants) },
                    title: { type: 'text' },
                    subtitle: { type: 'text' }
                },
                stats: { size: '12KB', performance: '60fps' }
            },
            {
                name: 'NavigationBar',
                category: 'navigation',
                description: 'Adaptive navigation with mobile-first design and gesture support',
                features: ['Responsive', 'Gestures', 'Themes', 'A11y'],
                preview: html`<navigation-bar theme="minimal"></navigation-bar>`,
                playground: html`<navigation-bar></navigation-bar>`,
                code: `<navigation-bar theme="minimal" sticky="true"></navigation-bar>`,
                stats: { size: '8KB', performance: '120fps' }
            },
            {
                name: 'DataGrid',
                category: 'data',
                description: 'Virtual scrolling data grid with 1M+ row support',
                features: ['Virtual Scroll', 'Sorting', 'Filtering', 'GPU'],
                preview: html`<data-grid rows="5"></data-grid>`,
                playground: html`<data-grid></data-grid>`,
                code: `<data-grid virtual="true" pageSize="50"></data-grid>`,
                stats: { size: '15KB', performance: '60fps' }
            },
            {
                name: 'FormBuilder',
                category: 'forms',
                description: 'Dynamic form generation with validation and custom inputs',
                features: ['Validation', 'Dynamic', 'Custom Inputs', 'A11y'],
                preview: html`<form-builder compact="true"></form-builder>`,
                playground: html`<form-builder></form-builder>`,
                code: `<form-builder schema='${JSON.stringify({fields:[]})}' />`,
                stats: { size: '10KB', performance: '120fps' }
            },
            {
                name: 'Modal',
                category: 'ui',
                description: 'Accessible modal with animations and focus management',
                features: ['A11y', 'Animations', 'Focus Trap', 'Backdrop'],
                preview: html`<button>Open Modal</button>`,
                playground: html`<modal-component open="true"></modal-component>`,
                code: `<modal-component size="medium" closable="true"></modal-component>`,
                stats: { size: '6KB', performance: '120fps' }
            },
            {
                name: 'Carousel',
                category: 'media',
                description: '3D carousel with WebGL transitions and touch support',
                features: ['WebGL', 'Touch', '3D Effects', 'Infinite'],
                preview: html`<carousel-component mini="true"></carousel-component>`,
                playground: html`<carousel-component></carousel-component>`,
                code: `<carousel-component effect="coverflow" autoplay="true"></carousel-component>`,
                stats: { size: '14KB', performance: '60fps' }
            },
            {
                name: 'Timeline',
                category: 'visualization',
                description: 'Interactive timeline with zoom, pan, and custom renderers',
                features: ['Zoom/Pan', 'Custom Renderers', 'Touch', 'Virtual'],
                preview: html`<timeline-component compact="true"></timeline-component>`,
                playground: html`<timeline-component></timeline-component>`,
                code: `<timeline-component view="month" interactive="true"></timeline-component>`,
                stats: { size: '12KB', performance: '60fps' }
            },
            {
                name: 'Charts',
                category: 'charts',
                description: 'GPU-accelerated charts with real-time updates',
                features: ['GPU', 'Real-time', 'Multiple Types', 'Responsive'],
                preview: html`<charts-component type="bar" mini="true"></charts-component>`,
                playground: html`<charts-component type="line"></charts-component>`,
                code: `<charts-component type="line" gpu="true" responsive="true"></charts-component>`,
                stats: { size: '18KB', performance: '60fps' }
            },
            {
                name: 'SearchBox',
                category: 'ui',
                description: 'Intelligent search with fuzzy matching and shortcuts',
                features: ['Fuzzy Search', 'Shortcuts', 'Suggestions', 'Voice'],
                preview: html`<search-box placeholder="Search..."></search-box>`,
                playground: html`<search-box></search-box>`,
                code: `<search-box fuzzy="true" voice="true"></search-box>`,
                stats: { size: '9KB', performance: '120fps' }
            },
            {
                name: 'Notifications',
                category: 'ui',
                description: 'Toast notifications with stacking and animations',
                features: ['Stacking', 'Animations', 'Actions', 'Persistent'],
                preview: html`<button>Show Notification</button>`,
                playground: html`<notifications-component></notifications-component>`,
                code: `<notifications-component position="top-right"></notifications-component>`,
                stats: { size: '7KB', performance: '120fps' }
            },
            {
                name: 'TabPanel',
                category: 'ui',
                description: 'Accessible tabs with lazy loading and animations',
                features: ['A11y', 'Lazy Load', 'Animations', 'Icons'],
                preview: html`<tab-panel compact="true"></tab-panel>`,
                playground: html`<tab-panel></tab-panel>`,
                code: `<tab-panel lazy="true" variant="pills"></tab-panel>`,
                stats: { size: '8KB', performance: '120fps' }
            },
            {
                name: 'Accordion',
                category: 'ui',
                description: 'Smooth accordion with single/multiple expansion modes',
                features: ['Smooth', 'Single/Multi', 'Icons', 'A11y'],
                preview: html`<accordion-component compact="true"></accordion-component>`,
                playground: html`<accordion-component></accordion-component>`,
                code: `<accordion-component multiple="true" animated="true"></accordion-component>`,
                stats: { size: '6KB', performance: '120fps' }
            },
            {
                name: 'Tooltip',
                category: 'ui',
                description: 'Smart positioning tooltips with GPU acceleration',
                features: ['Smart Position', 'GPU', 'Themes', 'Rich Content'],
                preview: html`<button>Hover for tooltip</button>`,
                playground: html`<div>Hover over elements</div>`,
                code: `<tooltip-component content="Helpful info" position="auto"></tooltip-component>`,
                stats: { size: '5KB', performance: '120fps' }
            },
            {
                name: 'ProgressBar',
                category: 'ui',
                description: 'GPU shader-based progress with particle effects',
                features: ['GPU Shaders', 'Particles', 'Gradients', 'Animated'],
                preview: html`<progress-bar value="70"></progress-bar>`,
                playground: html`<progress-bar></progress-bar>`,
                code: `<progress-bar value="75" gradient="true" particles="true"></progress-bar>`,
                stats: { size: '7KB', performance: '60fps' }
            },
            {
                name: 'LoadingSpinner',
                category: 'ui',
                description: 'Particle-based loading animations with WebGL',
                features: ['Particles', 'WebGL', '6 Patterns', 'Custom Colors'],
                preview: html`<loading-spinner pattern="orbit"></loading-spinner>`,
                playground: html`<loading-spinner pattern="quantum"></loading-spinner>`,
                code: `<loading-spinner pattern="matrix" size="large"></loading-spinner>`,
                stats: { size: '8KB', performance: '60fps' }
            },
            {
                name: 'ImageGallery',
                category: 'media',
                description: 'WebGL-powered gallery with advanced transitions',
                features: ['WebGL', 'Transitions', 'Lazy Load', 'Touch'],
                preview: html`<image-gallery layout="grid"></image-gallery>`,
                playground: html`<image-gallery></image-gallery>`,
                code: `<image-gallery layout="masonry" transition="morph"></image-gallery>`,
                stats: { size: '16KB', performance: '60fps' }
            },
            {
                name: 'VideoPlayer',
                category: 'media',
                description: 'GPU-accelerated video player with custom controls',
                features: ['GPU', 'Custom Controls', 'PiP', 'Analytics'],
                preview: html`<video-player poster="/preview.jpg"></video-player>`,
                playground: html`<video-player></video-player>`,
                code: `<video-player src="video.mp4" controls="true" pip="true"></video-player>`,
                stats: { size: '14KB', performance: '60fps' }
            },
            {
                name: 'CodeEditor',
                category: 'advanced',
                description: 'Syntax highlighting editor with virtual scrolling',
                features: ['Syntax Highlight', 'Virtual Scroll', 'Themes', 'Collab'],
                preview: html`<code-editor language="js" compact="true"></code-editor>`,
                playground: html`<code-editor></code-editor>`,
                code: `<code-editor language="javascript" theme="brutal"></code-editor>`,
                stats: { size: '20KB', performance: '60fps' }
            },
            {
                name: 'DragDropZone',
                category: 'advanced',
                description: 'Physics-based drag and drop with GPU effects',
                features: ['Physics', 'GPU', 'Multi-select', 'Groups'],
                preview: html`<drag-drop-zone compact="true"></drag-drop-zone>`,
                playground: html`<drag-drop-zone></drag-drop-zone>`,
                code: `<drag-drop-zone physics="true" multiple="true"></drag-drop-zone>`,
                stats: { size: '18KB', performance: '60fps' }
            }
        ];
    }
    
    /**
     * Get filtered demos based on category and search
     */
    _getFilteredDemos() {
        let demos = this._componentDemos;
        
        // Filter by category
        if (this._activeCategory !== 'all') {
            demos = demos.filter(d => d.category === this._activeCategory);
        }
        
        // Filter by search
        if (this._searchQuery) {
            const query = this._searchQuery.toLowerCase();
            demos = demos.filter(d => 
                d.name.toLowerCase().includes(query) ||
                d.description.toLowerCase().includes(query) ||
                d.features.some(f => f.toLowerCase().includes(query))
            );
        }
        
        return demos;
    }
    
    /**
     * Format category name for display
     */
    _formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    /**
     * Handle search input
     */
    _handleSearch = (e) => {
        this._searchQuery = e.detail.query;
        this.requestUpdate();
    }
    
    /**
     * Set active category
     */
    _setCategory(category) {
        this._activeCategory = category;
        this.requestUpdate();
    }
    
    /**
     * Open component playground
     */
    _openPlayground(demo) {
        this._activeComponent = demo;
        this.requestUpdate();
    }
    
    /**
     * Close playground
     */
    _closePlayground() {
        this._activeComponent = null;
        this.requestUpdate();
    }
    
    /**
     * Show component code
     */
    _showCode(demo) {
        // Create notification with code
        const notification = document.querySelector('notifications-component');
        if (notification) {
            notification.show({
                title: `${demo.name} Code Example`,
                message: demo.code,
                type: 'info',
                duration: 10000,
                actions: [
                    {
                        label: 'Copy',
                        action: () => {
                            navigator.clipboard.writeText(demo.code);
                            notification.show({
                                message: 'Code copied to clipboard!',
                                type: 'success'
                            });
                        }
                    }
                ]
            });
        }
    }
    
    /**
     * Update demo component props
     */
    _updateDemoProps(props) {
        // Update the active component with new props
        const demoElement = this.shadowRoot.querySelector(
            `.demo-area ${this._activeComponent.name.toLowerCase()}`
        );
        
        if (demoElement) {
            Object.assign(demoElement, props);
        }
    }
    
    /**
     * Get component performance metrics
     */
    _getComponentMetrics(demo) {
        return {
            labels: ['0s', '1s', '2s', '3s', '4s', '5s'],
            datasets: [{
                label: 'FPS',
                data: [60, 59, 60, 58, 60, 60],
                borderColor: '#3b82f6',
                tension: 0.4
            }, {
                label: 'Memory (MB)',
                data: [12, 12.5, 13, 13.2, 13.5, 13.5],
                borderColor: '#10b981',
                tension: 0.4
            }]
        };
    }
    
    /**
     * Start performance monitoring
     */
    _startPerformanceMonitoring() {
        const updateMetrics = () => {
            const now = performance.now();
            const delta = now - this._lastFrameTime;
            this._lastFrameTime = now;
            this._frameCount++;
            
            // Update FPS
            const fps = Math.round(1000 / delta);
            this._performanceData.fps = fps;
            
            // Update memory if available
            if (performance.memory) {
                this._performanceData.memory = Math.round(
                    performance.memory.usedJSHeapSize / 1024 / 1024
                );
            }
            
            // Update render time
            this._performanceData.renderTime = Math.round(delta * 100) / 100;
            
            // Update component count
            this._performanceData.componentCount = 
                this.shadowRoot.querySelectorAll('[data-brutal-component]').length;
            
            // Update every second
            if (this._frameCount % 60 === 0) {
                this.requestUpdate();
            }
            
            requestAnimationFrame(updateMetrics);
        };
        
        requestAnimationFrame(updateMetrics);
    }
    
    /**
     * Setup keyboard navigation
     */
    _setupKeyboardNavigation() {
        this.addEventListener('keydown', (e) => {
            // Escape closes playground
            if (e.key === 'Escape' && this._activeComponent) {
                this._closePlayground();
            }
            
            // Cmd/Ctrl + K opens search
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                const searchBox = this.shadowRoot.querySelector('search-box');
                searchBox?.focus();
            }
        });
    }
}

// Register the component
customElements.define('showcase-demo', ShowcaseDemo);