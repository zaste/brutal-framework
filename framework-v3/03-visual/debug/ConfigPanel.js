/**
 * @fileoverview BRUTAL V3 - Configuration Panel UI for Visual Debug Layer
 * Real-time configuration with visual feedback
 * @version 3.0.0
 */

/**
 * Configuration Panel - Control every aspect of the debug experience
 */
export class ConfigPanel {
    constructor(debugLayer) {
        this.debugLayer = debugLayer;
        this.container = null;
        this.isOpen = false;
        this.isDragging = false;
        
        // Panel position
        this.position = {
            x: 20,
            y: 100
        };
        
        // Configuration state
        this.config = {
            // Visual settings
            visual: {
                particleDensity: 1.0,
                effectIntensity: 1.0,
                colorScheme: 'default',
                blendMode: 'additive',
                glowIntensity: 0.8
            },
            
            // Performance settings
            performance: {
                mode: 'auto', // 'auto' | 'high' | 'balanced' | 'low'
                targetFPS: 60,
                maxParticles: 100000,
                gpuAcceleration: true,
                workerThreads: navigator.hardwareConcurrency || 4
            },
            
            // Debug features
            features: {
                showComponentBounds: true,
                showDataFlow: true,
                showPerformanceHUD: true,
                showParticleStats: false,
                autoRecord: false,
                captureErrors: true
            },
            
            // Color themes
            themes: {
                default: {
                    render: '#00ff88',
                    error: '#ff0044',
                    stateChange: '#00aaff',
                    warning: '#ffaa00'
                },
                matrix: {
                    render: '#00ff00',
                    error: '#ff0000',
                    stateChange: '#00ff00',
                    warning: '#ffff00'
                },
                cyberpunk: {
                    render: '#ff00ff',
                    error: '#ff0066',
                    stateChange: '#00ffff',
                    warning: '#ffff00'
                },
                monochrome: {
                    render: '#ffffff',
                    error: '#ffffff',
                    stateChange: '#ffffff',
                    warning: '#ffffff'
                }
            }
        };
        
        // Preset configurations
        this.presets = {
            minimal: {
                visual: { particleDensity: 0.3, effectIntensity: 0.5 },
                performance: { mode: 'low', maxParticles: 10000 }
            },
            balanced: {
                visual: { particleDensity: 0.7, effectIntensity: 0.7 },
                performance: { mode: 'balanced', maxParticles: 50000 }
            },
            cinematic: {
                visual: { particleDensity: 1.5, effectIntensity: 1.2 },
                performance: { mode: 'high', maxParticles: 200000 }
            },
            developer: {
                features: {
                    showComponentBounds: true,
                    showDataFlow: true,
                    showPerformanceHUD: true,
                    showParticleStats: true
                }
            }
        };
        
        // V8 optimizations
        this._boundHandleDrag = this._handleDrag.bind(this);
        this._boundHandleDragEnd = this._handleDragEnd.bind(this);
    }
    
    /**
     * Initialize configuration panel
     */
    init() {
        this._createPanel();
        this._loadSavedConfig();
        this._attachEventListeners();
        
        // Hide by default
        this.hide();
        
        }
    
    /**
     * Create the panel UI
     */
    _createPanel() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'brutal-config-panel';
        this.container.className = 'brutal-config-panel';
        this.container.innerHTML = `
            <div class="brutal-panel-header">
                <h3>🎮 BRUTAL Debug Config</h3>
                <div class="brutal-panel-controls">
                    <button class="brutal-minimize">_</button>
                    <button class="brutal-close">×</button>
                </div>
            </div>
            
            <div class="brutal-panel-tabs">
                <button class="brutal-tab active" data-tab="visual">Visual</button>
                <button class="brutal-tab" data-tab="performance">Performance</button>
                <button class="brutal-tab" data-tab="features">Features</button>
                <button class="brutal-tab" data-tab="presets">Presets</button>
            </div>
            
            <div class="brutal-panel-content">
                ${this._createVisualTab()}
                ${this._createPerformanceTab()}
                ${this._createFeaturesTab()}
                ${this._createPresetsTab()}
            </div>
            
            <div class="brutal-panel-footer">
                <button class="brutal-btn brutal-reset">Reset</button>
                <button class="brutal-btn brutal-export">Export</button>
                <button class="brutal-btn brutal-import">Import</button>
            </div>
        `;
        
        // Add styles
        this._injectStyles();
        
        // Position panel
        this.container.style.left = `${this.position.x}px`;
        this.container.style.top = `${this.position.y}px`;
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Create visual settings tab
     */
    _createVisualTab() {
        return `
            <div class="brutal-tab-content active" data-content="visual">
                <div class="brutal-control-group">
                    <label>
                        <span>Particle Density</span>
                        <input type="range" id="particle-density" min="0" max="2" step="0.1" value="${this.config.visual.particleDensity}">
                        <span class="brutal-value">${this.config.visual.particleDensity}x</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <span>Effect Intensity</span>
                        <input type="range" id="effect-intensity" min="0" max="2" step="0.1" value="${this.config.visual.effectIntensity}">
                        <span class="brutal-value">${this.config.visual.effectIntensity}x</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <span>Glow Intensity</span>
                        <input type="range" id="glow-intensity" min="0" max="1" step="0.1" value="${this.config.visual.glowIntensity}">
                        <span class="brutal-value">${this.config.visual.glowIntensity}</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <span>Color Scheme</span>
                        <select id="color-scheme">
                            <option value="default">Default</option>
                            <option value="matrix">Matrix</option>
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="monochrome">Monochrome</option>
                        </select>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <span>Blend Mode</span>
                        <select id="blend-mode">
                            <option value="additive">Additive</option>
                            <option value="screen">Screen</option>
                            <option value="multiply">Multiply</option>
                            <option value="normal">Normal</option>
                        </select>
                    </label>
                </div>
                
                <div class="brutal-color-preview">
                    <div class="brutal-color-box" data-type="render"></div>
                    <div class="brutal-color-box" data-type="error"></div>
                    <div class="brutal-color-box" data-type="stateChange"></div>
                    <div class="brutal-color-box" data-type="warning"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create performance settings tab
     */
    _createPerformanceTab() {
        return `
            <div class="brutal-tab-content" data-content="performance">
                <div class="brutal-control-group">
                    <label>
                        <span>Performance Mode</span>
                        <select id="performance-mode">
                            <option value="auto">Auto</option>
                            <option value="high">High Performance</option>
                            <option value="balanced">Balanced</option>
                            <option value="low">Power Saving</option>
                        </select>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <span>Target FPS</span>
                        <select id="target-fps">
                            <option value="30">30 FPS</option>
                            <option value="60" selected>60 FPS</option>
                            <option value="120">120 FPS</option>
                            <option value="144">144 FPS</option>
                        </select>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <span>Max Particles</span>
                        <input type="range" id="max-particles" min="1000" max="1000000" step="1000" value="${this.config.performance.maxParticles}">
                        <span class="brutal-value">${this.config.performance.maxParticles.toLocaleString()}</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <span>Worker Threads</span>
                        <input type="range" id="worker-threads" min="1" max="${navigator.hardwareConcurrency * 2}" value="${this.config.performance.workerThreads}">
                        <span class="brutal-value">${this.config.performance.workerThreads}</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <input type="checkbox" id="gpu-acceleration" ${this.config.performance.gpuAcceleration ? 'checked' : ''}>
                        <span>GPU Acceleration</span>
                    </label>
                </div>
                
                <div class="brutal-stats">
                    <div class="brutal-stat">
                        <span class="brutal-stat-label">Current FPS:</span>
                        <span class="brutal-stat-value" id="current-fps">60</span>
                    </div>
                    <div class="brutal-stat">
                        <span class="brutal-stat-label">Memory:</span>
                        <span class="brutal-stat-value" id="memory-usage">0 MB</span>
                    </div>
                    <div class="brutal-stat">
                        <span class="brutal-stat-label">GPU Load:</span>
                        <span class="brutal-stat-value" id="gpu-load">0%</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create features tab
     */
    _createFeaturesTab() {
        return `
            <div class="brutal-tab-content" data-content="features">
                <div class="brutal-control-group">
                    <label>
                        <input type="checkbox" id="show-bounds" ${this.config.features.showComponentBounds ? 'checked' : ''}>
                        <span>Show Component Bounds</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <input type="checkbox" id="show-dataflow" ${this.config.features.showDataFlow ? 'checked' : ''}>
                        <span>Show Data Flow</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <input type="checkbox" id="show-hud" ${this.config.features.showPerformanceHUD ? 'checked' : ''}>
                        <span>Show Performance HUD</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <input type="checkbox" id="show-particle-stats" ${this.config.features.showParticleStats ? 'checked' : ''}>
                        <span>Show Particle Stats</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <input type="checkbox" id="auto-record" ${this.config.features.autoRecord ? 'checked' : ''}>
                        <span>Auto Record Sessions</span>
                    </label>
                </div>
                
                <div class="brutal-control-group">
                    <label>
                        <input type="checkbox" id="capture-errors" ${this.config.features.captureErrors ? 'checked' : ''}>
                        <span>Capture Errors</span>
                    </label>
                </div>
                
                <div class="brutal-hotkeys">
                    <h4>Hotkeys</h4>
                    <div class="brutal-hotkey">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> - Toggle Debug
                    </div>
                    <div class="brutal-hotkey">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> - Open Config
                    </div>
                    <div class="brutal-hotkey">
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> - Record
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create presets tab
     */
    _createPresetsTab() {
        return `
            <div class="brutal-tab-content" data-content="presets">
                <div class="brutal-preset-grid">
                    <button class="brutal-preset" data-preset="minimal">
                        <span class="brutal-preset-icon">🔋</span>
                        <span class="brutal-preset-name">Minimal</span>
                        <span class="brutal-preset-desc">Low resource usage</span>
                    </button>
                    
                    <button class="brutal-preset" data-preset="balanced">
                        <span class="brutal-preset-icon">⚖️</span>
                        <span class="brutal-preset-name">Balanced</span>
                        <span class="brutal-preset-desc">Good performance</span>
                    </button>
                    
                    <button class="brutal-preset" data-preset="cinematic">
                        <span class="brutal-preset-icon">🎬</span>
                        <span class="brutal-preset-name">Cinematic</span>
                        <span class="brutal-preset-desc">Maximum visuals</span>
                    </button>
                    
                    <button class="brutal-preset" data-preset="developer">
                        <span class="brutal-preset-icon">👨‍💻</span>
                        <span class="brutal-preset-name">Developer</span>
                        <span class="brutal-preset-desc">All debug features</span>
                    </button>
                </div>
                
                <div class="brutal-custom-preset">
                    <h4>Save Current as Preset</h4>
                    <input type="text" id="preset-name" placeholder="Preset name...">
                    <button class="brutal-btn brutal-save-preset">Save Preset</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Inject panel styles
     */
    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .brutal-config-panel {
                position: fixed;
                width: 400px;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid #00ff88;
                border-radius: 8px;
                color: #fff;
                font-family: monospace;
                font-size: 14px;
                z-index: 1000002;
                box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
                user-select: none;
            }
            
            .brutal-panel-header {
                background: #00ff88;
                color: #000;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                border-radius: 8px 8px 0 0;
            }
            
            .brutal-panel-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: bold;
            }
            
            .brutal-panel-controls {
                display: flex;
                gap: 5px;
            }
            
            .brutal-panel-controls button {
                background: transparent;
                border: 1px solid #000;
                color: #000;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-weight: bold;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .brutal-panel-controls button:hover {
                background: #000;
                color: #00ff88;
            }
            
            .brutal-panel-tabs {
                display: flex;
                background: #111;
                border-bottom: 1px solid #333;
            }
            
            .brutal-tab {
                flex: 1;
                padding: 10px;
                background: transparent;
                border: none;
                color: #666;
                cursor: pointer;
                transition: all 0.2s;
                border-bottom: 2px solid transparent;
            }
            
            .brutal-tab:hover {
                color: #00ff88;
            }
            
            .brutal-tab.active {
                color: #00ff88;
                border-bottom-color: #00ff88;
            }
            
            .brutal-panel-content {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .brutal-tab-content {
                display: none;
            }
            
            .brutal-tab-content.active {
                display: block;
            }
            
            .brutal-control-group {
                margin-bottom: 15px;
            }
            
            .brutal-control-group label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            
            .brutal-control-group input[type="range"] {
                flex: 1;
                height: 4px;
                background: #333;
                outline: none;
                -webkit-appearance: none;
            }
            
            .brutal-control-group input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: #00ff88;
                cursor: pointer;
                border-radius: 50%;
            }
            
            .brutal-control-group select {
                background: #111;
                color: #fff;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .brutal-control-group input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .brutal-value {
                color: #00ff88;
                min-width: 60px;
                text-align: right;
            }
            
            .brutal-color-preview {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            
            .brutal-color-box {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                border: 1px solid #333;
            }
            
            .brutal-color-box[data-type="render"] {
                background: #00ff88;
            }
            
            .brutal-color-box[data-type="error"] {
                background: #ff0044;
            }
            
            .brutal-color-box[data-type="stateChange"] {
                background: #00aaff;
            }
            
            .brutal-color-box[data-type="warning"] {
                background: #ffaa00;
            }
            
            .brutal-stats {
                background: #0a0a0a;
                padding: 15px;
                border-radius: 4px;
                margin-top: 15px;
            }
            
            .brutal-stat {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .brutal-stat-label {
                color: #666;
            }
            
            .brutal-stat-value {
                color: #00ff88;
                font-weight: bold;
            }
            
            .brutal-hotkeys {
                background: #0a0a0a;
                padding: 15px;
                border-radius: 4px;
                margin-top: 15px;
            }
            
            .brutal-hotkeys h4 {
                margin: 0 0 10px 0;
                color: #00ff88;
            }
            
            .brutal-hotkey {
                margin-bottom: 5px;
                font-size: 12px;
                color: #999;
            }
            
            .brutal-hotkey kbd {
                background: #333;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
            }
            
            .brutal-preset-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .brutal-preset {
                background: #111;
                border: 1px solid #333;
                padding: 20px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }
            
            .brutal-preset:hover {
                border-color: #00ff88;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
            }
            
            .brutal-preset-icon {
                display: block;
                font-size: 32px;
                margin-bottom: 10px;
            }
            
            .brutal-preset-name {
                display: block;
                color: #fff;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .brutal-preset-desc {
                display: block;
                color: #666;
                font-size: 12px;
            }
            
            .brutal-custom-preset {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #333;
            }
            
            .brutal-custom-preset h4 {
                margin: 0 0 10px 0;
                color: #00ff88;
            }
            
            .brutal-custom-preset input {
                width: 100%;
                background: #111;
                border: 1px solid #333;
                color: #fff;
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .brutal-panel-footer {
                padding: 15px;
                background: #0a0a0a;
                border-top: 1px solid #333;
                display: flex;
                gap: 10px;
                border-radius: 0 0 8px 8px;
            }
            
            .brutal-btn {
                flex: 1;
                background: #111;
                border: 1px solid #333;
                color: #fff;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .brutal-btn:hover {
                background: #00ff88;
                color: #000;
                border-color: #00ff88;
            }
            
            /* Scrollbar styling */
            .brutal-panel-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .brutal-panel-content::-webkit-scrollbar-track {
                background: #111;
            }
            
            .brutal-panel-content::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 4px;
            }
            
            .brutal-panel-content::-webkit-scrollbar-thumb:hover {
                background: #00ff88;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Header drag
        const header = this.container.querySelector('.brutal-panel-header');
        header.addEventListener('mousedown', this._handleDragStart.bind(this));
        
        // Tab switching
        const tabs = this.container.querySelectorAll('.brutal-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this._switchTab(e.target.dataset.tab);
            });
        });
        
        // Control buttons
        this.container.querySelector('.brutal-minimize').addEventListener('click', () => {
            this.minimize();
        });
        
        this.container.querySelector('.brutal-close').addEventListener('click', () => {
            this.hide();
        });
        
        // Visual controls
        this._attachVisualControls();
        
        // Performance controls
        this._attachPerformanceControls();
        
        // Feature toggles
        this._attachFeatureToggles();
        
        // Preset buttons
        this._attachPresetButtons();
        
        // Footer buttons
        this.container.querySelector('.brutal-reset').addEventListener('click', () => {
            this.resetConfig();
        });
        
        this.container.querySelector('.brutal-export').addEventListener('click', () => {
            this.exportConfig();
        });
        
        this.container.querySelector('.brutal-import').addEventListener('click', () => {
            this.importConfig();
        });
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                this.toggle();
            }
        });
    }
    
    /**
     * Attach visual control listeners
     */
    _attachVisualControls() {
        // Particle density
        const particleDensity = this.container.querySelector('#particle-density');
        particleDensity.addEventListener('input', (e) => {
            this.config.visual.particleDensity = parseFloat(e.target.value);
            this._updateValue(e.target, `${e.target.value}x`);
            this._applyVisualConfig();
        });
        
        // Effect intensity
        const effectIntensity = this.container.querySelector('#effect-intensity');
        effectIntensity.addEventListener('input', (e) => {
            this.config.visual.effectIntensity = parseFloat(e.target.value);
            this._updateValue(e.target, `${e.target.value}x`);
            this._applyVisualConfig();
        });
        
        // Glow intensity
        const glowIntensity = this.container.querySelector('#glow-intensity');
        glowIntensity.addEventListener('input', (e) => {
            this.config.visual.glowIntensity = parseFloat(e.target.value);
            this._updateValue(e.target, e.target.value);
            this._applyVisualConfig();
        });
        
        // Color scheme
        const colorScheme = this.container.querySelector('#color-scheme');
        colorScheme.addEventListener('change', (e) => {
            this.config.visual.colorScheme = e.target.value;
            this._applyColorScheme();
        });
        
        // Blend mode
        const blendMode = this.container.querySelector('#blend-mode');
        blendMode.addEventListener('change', (e) => {
            this.config.visual.blendMode = e.target.value;
            this._applyVisualConfig();
        });
    }
    
    /**
     * Attach performance control listeners
     */
    _attachPerformanceControls() {
        // Performance mode
        const perfMode = this.container.querySelector('#performance-mode');
        perfMode.addEventListener('change', (e) => {
            this.config.performance.mode = e.target.value;
            this._applyPerformanceMode();
        });
        
        // Target FPS
        const targetFPS = this.container.querySelector('#target-fps');
        targetFPS.addEventListener('change', (e) => {
            this.config.performance.targetFPS = parseInt(e.target.value);
            this._applyPerformanceConfig();
        });
        
        // Max particles
        const maxParticles = this.container.querySelector('#max-particles');
        maxParticles.addEventListener('input', (e) => {
            this.config.performance.maxParticles = parseInt(e.target.value);
            this._updateValue(e.target, parseInt(e.target.value).toLocaleString());
            this._applyPerformanceConfig();
        });
        
        // Worker threads
        const workerThreads = this.container.querySelector('#worker-threads');
        workerThreads.addEventListener('input', (e) => {
            this.config.performance.workerThreads = parseInt(e.target.value);
            this._updateValue(e.target, e.target.value);
            this._applyPerformanceConfig();
        });
        
        // GPU acceleration
        const gpuAccel = this.container.querySelector('#gpu-acceleration');
        gpuAccel.addEventListener('change', (e) => {
            this.config.performance.gpuAcceleration = e.target.checked;
            this._applyPerformanceConfig();
        });
    }
    
    /**
     * Attach feature toggle listeners
     */
    _attachFeatureToggles() {
        const toggles = {
            'show-bounds': 'showComponentBounds',
            'show-dataflow': 'showDataFlow',
            'show-hud': 'showPerformanceHUD',
            'show-particle-stats': 'showParticleStats',
            'auto-record': 'autoRecord',
            'capture-errors': 'captureErrors'
        };
        
        Object.entries(toggles).forEach(([id, configKey]) => {
            const toggle = this.container.querySelector(`#${id}`);
            toggle.addEventListener('change', (e) => {
                this.config.features[configKey] = e.target.checked;
                this._applyFeatureConfig();
            });
        });
    }
    
    /**
     * Attach preset button listeners
     */
    _attachPresetButtons() {
        const presetButtons = this.container.querySelectorAll('.brutal-preset');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // Save custom preset
        const savePresetBtn = this.container.querySelector('.brutal-save-preset');
        savePresetBtn.addEventListener('click', () => {
            const name = this.container.querySelector('#preset-name').value;
            if (name) {
                this.saveCustomPreset(name);
            }
        });
    }
    
    /**
     * Handle drag start
     */
    _handleDragStart(e) {
        if (e.target.tagName === 'BUTTON') return;
        
        this.isDragging = true;
        this.dragOffset = {
            x: e.clientX - this.position.x,
            y: e.clientY - this.position.y
        };
        
        document.addEventListener('mousemove', this._boundHandleDrag);
        document.addEventListener('mouseup', this._boundHandleDragEnd);
        
        e.preventDefault();
    }
    
    /**
     * Handle drag
     */
    _handleDrag(e) {
        if (!this.isDragging) return;
        
        this.position.x = e.clientX - this.dragOffset.x;
        this.position.y = e.clientY - this.dragOffset.y;
        
        // Constrain to viewport
        const rect = this.container.getBoundingClientRect();
        this.position.x = Math.max(0, Math.min(window.innerWidth - rect.width, this.position.x));
        this.position.y = Math.max(0, Math.min(window.innerHeight - rect.height, this.position.y));
        
        this.container.style.left = `${this.position.x}px`;
        this.container.style.top = `${this.position.y}px`;
    }
    
    /**
     * Handle drag end
     */
    _handleDragEnd() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this._boundHandleDrag);
        document.removeEventListener('mouseup', this._boundHandleDragEnd);
    }
    
    /**
     * Switch tab
     */
    _switchTab(tabName) {
        // Update tab buttons
        this.container.querySelectorAll('.brutal-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update content
        this.container.querySelectorAll('.brutal-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
    }
    
    /**
     * Update value display
     */
    _updateValue(input, value) {
        const valueSpan = input.parentElement.querySelector('.brutal-value');
        if (valueSpan) {
            valueSpan.textContent = value;
        }
    }
    
    /**
     * Apply visual configuration
     */
    _applyVisualConfig() {
        // Apply to debug layer
        if (this.debugLayer.particleSystem) {
            // Update particle system config
            // Density affects emission rate
            // Intensity affects size and lifetime
        }
        
        this._saveConfig();
    }
    
    /**
     * Apply color scheme
     */
    _applyColorScheme() {
        const colors = this.config.themes[this.config.visual.colorScheme];
        
        // Update color preview
        Object.entries(colors).forEach(([type, color]) => {
            const box = this.container.querySelector(`.brutal-color-box[data-type="${type}"]`);
            if (box) {
                box.style.background = color;
            }
        });
        
        // Apply to debug layer
        if (this.debugLayer) {
            // Update particle colors
        }
        
        this._saveConfig();
    }
    
    /**
     * Apply performance mode
     */
    _applyPerformanceMode() {
        const modes = {
            auto: { maxParticles: 100000, frameRate: 60 },
            high: { maxParticles: 1000000, frameRate: 120 },
            balanced: { maxParticles: 50000, frameRate: 60 },
            low: { maxParticles: 10000, frameRate: 30 }
        };
        
        const mode = modes[this.config.performance.mode];
        if (mode) {
            this.config.performance.maxParticles = mode.maxParticles;
            this.config.performance.targetFPS = mode.frameRate;
            
            // Update UI
            this.container.querySelector('#max-particles').value = mode.maxParticles;
            this._updateValue(
                this.container.querySelector('#max-particles'),
                mode.maxParticles.toLocaleString()
            );
        }
        
        this._applyPerformanceConfig();
    }
    
    /**
     * Apply performance configuration
     */
    _applyPerformanceConfig() {
        if (this.debugLayer.particleSystem) {
            this.debugLayer.particleSystem.setConfig({
                maxParticles: this.config.performance.maxParticles
            });
        }
        
        this._saveConfig();
    }
    
    /**
     * Apply feature configuration
     */
    _applyFeatureConfig() {
        // Apply feature toggles to debug layer
        if (this.debugLayer) {
            // Toggle HUD visibility
            if (this.debugLayer.performanceHUD) {
                this.debugLayer.performanceHUD.enabled = this.config.features.showPerformanceHUD;
            }
            
            // Toggle data flow
            if (this.debugLayer.dataFlowRenderer) {
                this.debugLayer.dataFlowRenderer.enabled = this.config.features.showDataFlow;
            }
        }
        
        this._saveConfig();
    }
    
    /**
     * Apply preset
     */
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
        // Merge preset into config
        Object.keys(preset).forEach(category => {
            Object.assign(this.config[category], preset[category]);
        });
        
        // Update UI
        this._updateUIFromConfig();
        
        // Apply all changes
        this._applyVisualConfig();
        this._applyPerformanceConfig();
        this._applyFeatureConfig();
        
        }
    
    /**
     * Update UI from config
     */
    _updateUIFromConfig() {
        // Visual
        this.container.querySelector('#particle-density').value = this.config.visual.particleDensity;
        this.container.querySelector('#effect-intensity').value = this.config.visual.effectIntensity;
        this.container.querySelector('#glow-intensity').value = this.config.visual.glowIntensity;
        this.container.querySelector('#color-scheme').value = this.config.visual.colorScheme;
        this.container.querySelector('#blend-mode').value = this.config.visual.blendMode;
        
        // Performance
        this.container.querySelector('#performance-mode').value = this.config.performance.mode;
        this.container.querySelector('#target-fps').value = this.config.performance.targetFPS;
        this.container.querySelector('#max-particles').value = this.config.performance.maxParticles;
        this.container.querySelector('#worker-threads').value = this.config.performance.workerThreads;
        this.container.querySelector('#gpu-acceleration').checked = this.config.performance.gpuAcceleration;
        
        // Features
        this.container.querySelector('#show-bounds').checked = this.config.features.showComponentBounds;
        this.container.querySelector('#show-dataflow').checked = this.config.features.showDataFlow;
        this.container.querySelector('#show-hud').checked = this.config.features.showPerformanceHUD;
        this.container.querySelector('#show-particle-stats').checked = this.config.features.showParticleStats;
        this.container.querySelector('#auto-record').checked = this.config.features.autoRecord;
        this.container.querySelector('#capture-errors').checked = this.config.features.captureErrors;
        
        // Update value displays
        this._updateValue(
            this.container.querySelector('#particle-density'),
            `${this.config.visual.particleDensity}x`
        );
        this._updateValue(
            this.container.querySelector('#effect-intensity'),
            `${this.config.visual.effectIntensity}x`
        );
        this._updateValue(
            this.container.querySelector('#glow-intensity'),
            this.config.visual.glowIntensity
        );
        this._updateValue(
            this.container.querySelector('#max-particles'),
            this.config.performance.maxParticles.toLocaleString()
        );
        this._updateValue(
            this.container.querySelector('#worker-threads'),
            this.config.performance.workerThreads
        );
    }
    
    /**
     * Update stats display
     */
    updateStats(stats) {
        if (!this.isOpen) return;
        
        // FPS
        const fpsEl = this.container.querySelector('#current-fps');
        if (fpsEl) fpsEl.textContent = Math.round(stats.fps || 0);
        
        // Memory
        const memEl = this.container.querySelector('#memory-usage');
        if (memEl && performance.memory) {
            const mb = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
            memEl.textContent = `${mb} MB`;
        }
        
        // GPU Load (simulated)
        const gpuEl = this.container.querySelector('#gpu-load');
        if (gpuEl && stats.gpuTime) {
            const load = Math.min(100, (stats.gpuTime / 16.67) * 100);
            gpuEl.textContent = `${Math.round(load)}%`;
        }
    }
    
    /**
     * Save configuration
     */
    _saveConfig() {
        localStorage.setItem('brutal-debug-config', JSON.stringify(this.config));
    }
    
    /**
     * Load saved configuration
     */
    _loadSavedConfig() {
        const saved = localStorage.getItem('brutal-debug-config');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                // Deep merge
                Object.keys(loaded).forEach(category => {
                    if (this.config[category]) {
                        Object.assign(this.config[category], loaded[category]);
                    }
                });
                
                this._updateUIFromConfig();
            } catch (e) {
                }
        }
    }
    
    /**
     * Reset configuration
     */
    resetConfig() {
        // Reset to defaults
        this.config = {
            visual: {
                particleDensity: 1.0,
                effectIntensity: 1.0,
                colorScheme: 'default',
                blendMode: 'additive',
                glowIntensity: 0.8
            },
            performance: {
                mode: 'auto',
                targetFPS: 60,
                maxParticles: 100000,
                gpuAcceleration: true,
                workerThreads: navigator.hardwareConcurrency || 4
            },
            features: {
                showComponentBounds: true,
                showDataFlow: true,
                showPerformanceHUD: true,
                showParticleStats: false,
                autoRecord: false,
                captureErrors: true
            }
        };
        
        this._updateUIFromConfig();
        this._applyVisualConfig();
        this._applyPerformanceConfig();
        this._applyFeatureConfig();
        
        }
    
    /**
     * Export configuration
     */
    exportConfig() {
        const blob = new Blob([JSON.stringify(this.config, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brutal-debug-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import configuration
     */
    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const imported = JSON.parse(text);
                    
                    // Validate and merge
                    Object.keys(imported).forEach(category => {
                        if (this.config[category]) {
                            Object.assign(this.config[category], imported[category]);
                        }
                    });
                    
                    this._updateUIFromConfig();
                    this._applyVisualConfig();
                    this._applyPerformanceConfig();
                    this._applyFeatureConfig();
                    
                    } catch (e) {
                    }
            }
        };
        
        input.click();
    }
    
    /**
     * Save custom preset
     */
    saveCustomPreset(name) {
        const customPresets = JSON.parse(localStorage.getItem('brutal-custom-presets') || '{}');
        customPresets[name] = JSON.parse(JSON.stringify(this.config));
        localStorage.setItem('brutal-custom-presets', JSON.stringify(customPresets));
        
        // Clear input
        this.container.querySelector('#preset-name').value = '';
    }
    
    /**
     * Show panel
     */
    show() {
        this.isOpen = true;
        this.container.style.display = 'block';
    }
    
    /**
     * Hide panel
     */
    hide() {
        this.isOpen = false;
        this.container.style.display = 'none';
    }
    
    /**
     * Toggle panel
     */
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Minimize panel
     */
    minimize() {
        const content = this.container.querySelector('.brutal-panel-content');
        const footer = this.container.querySelector('.brutal-panel-footer');
        const tabs = this.container.querySelector('.brutal-panel-tabs');
        
        if (content.style.display === 'none') {
            content.style.display = '';
            footer.style.display = '';
            tabs.style.display = '';
        } else {
            content.style.display = 'none';
            footer.style.display = 'none';
            tabs.style.display = 'none';
        }
    }
    
    /**
     * Destroy panel
     */
    destroy() {
        if (this.container) {
            this.container.remove();
        }
    }
}