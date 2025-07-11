/**
 * BRUTAL V3 - VideoPlayer Component
 * GPU-accelerated video player with custom controls
 * Picture-in-picture, performance monitoring, and particle effects
 */

import { MediaComponent } from '../base/MediaComponent.js';
import { html } from '../../01-core/Template.js';
import { ParticleEngine } from '../../03-visual/gpu/ParticleEngine.js';

export class VideoPlayer extends MediaComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {
            controls: true,
            autoplay: false,
            loop: false,
            muted: false,
            preload: 'metadata', // none, metadata, auto
            poster: null,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            theme: 'brutal', // brutal, minimal, neon, glassmorphic, cinema
            pip: true, // Picture-in-picture support
            fullscreen: true,
            keyboard: true,
            gestures: true,
            quality: 'auto', // auto, 1080p, 720p, 480p, 360p
            subtitles: [],
            chapters: [],
            analytics: true,
            effects: {
                particles: true,
                glow: true,
                visualizer: false
            }
        };
        
        // State
        this._video = null;
        this._isPlaying = false;
        this._currentTime = 0;
        this._duration = 0;
        this._volume = 1;
        this._playbackRate = 1;
        this._isFullscreen = false;
        this._isPiP = false;
        this._buffered = 0;
        this._quality = 'auto';
        this._selectedSubtitle = null;
        
        // UI State
        this._showControls = true;
        this._controlsTimeout = null;
        this._progressHover = false;
        this._volumeHover = false;
        this._settingsOpen = false;
        
        // Performance
        this._fps = 0;
        this._dropped = 0;
        this._bitrate = 0;
        this._lastFrameTime = 0;
        this._frameCount = 0;
        
        // WebGL for effects
        this._canvas = null;
        this._gl = null;
        this._analyser = null;
        this._audioContext = null;
        
        // Particle system
        this._particleEngine = null;
        
        // Gesture tracking
        this._touchStartX = 0;
        this._touchStartY = 0;
        this._seekStartTime = 0;
    }
    
    template() {
        const theme = this._getThemeStyles();
        
        return html`
            <div class="video-container ${this._config.theme}" 
                 data-fullscreen="${this._isFullscreen}"
                 data-playing="${this._isPlaying}">
                
                <video class="video-element"
                       ${this._config.autoplay ? 'autoplay' : ''}
                       ${this._config.loop ? 'loop' : ''}
                       ${this._config.muted ? 'muted' : ''}
                       preload="${this._config.preload}"
                       ${this._config.poster ? `poster="${this._config.poster}"` : ''}>
                </video>
                
                <canvas class="effects-canvas"></canvas>
                
                ${this._config.controls ? this._renderControls(theme) : ''}
                
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                
                <div class="big-play-button" data-action="play">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="4"/>
                        <path d="M32 25 L55 40 L32 55 Z" fill="currentColor"/>
                    </svg>
                </div>
                
                ${this._config.analytics ? this._renderAnalytics(theme) : ''}
                
                <div class="particle-container"></div>
                
                <div class="gesture-feedback">
                    <div class="seek-preview">
                        <span class="seek-time"></span>
                    </div>
                    <div class="volume-feedback">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path class="volume-waves" d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        <span class="volume-percent"></span>
                    </div>
                </div>
            </div>
            
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    background: #000;
                }
                
                .video-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    ${theme.container}
                }
                
                .video-element {
                    width: 100%;
                    height: 100%;
                    display: block;
                    object-fit: contain;
                }
                
                /* Effects canvas */
                .effects-canvas {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 300ms ease;
                }
                
                .effects-canvas.active {
                    opacity: 1;
                }
                
                /* Loading spinner */
                .loading-spinner {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: none;
                }
                
                .video-container.loading .loading-spinner {
                    display: block;
                }
                
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid transparent;
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Big play button */
                .big-play-button {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    cursor: pointer;
                    transition: all 200ms ease;
                    ${theme.bigPlayButton}
                }
                
                .video-container[data-playing="true"] .big-play-button {
                    opacity: 0;
                    pointer-events: none;
                }
                
                .big-play-button:hover {
                    transform: translate(-50%, -50%) scale(1.1);
                    ${theme.bigPlayButtonHover}
                }
                
                /* Controls */
                .video-controls {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 20px;
                    background: linear-gradient(transparent, rgba(0,0,0,0.8));
                    transform: translateY(0);
                    transition: transform 300ms ease, opacity 300ms ease;
                    ${theme.controls}
                }
                
                .video-container:not(:hover) .video-controls {
                    transform: translateY(100%);
                    opacity: 0;
                }
                
                .video-container[data-playing="false"] .video-controls,
                .video-container.show-controls .video-controls {
                    transform: translateY(0);
                    opacity: 1;
                }
                
                /* Progress bar */
                .progress-container {
                    position: relative;
                    height: 6px;
                    margin-bottom: 15px;
                    cursor: pointer;
                    ${theme.progressContainer}
                }
                
                .progress-container:hover {
                    height: 10px;
                }
                
                .progress-bg {
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0.2);
                    border-radius: 3px;
                }
                
                .progress-buffered {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    background: rgba(255,255,255,0.3);
                    border-radius: 3px;
                    width: 0%;
                }
                
                .progress-played {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    background: var(--accent-color);
                    border-radius: 3px;
                    width: 0%;
                    ${theme.progressPlayed}
                }
                
                .progress-thumb {
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 16px;
                    height: 16px;
                    background: var(--accent-color);
                    border-radius: 50%;
                    opacity: 0;
                    transition: opacity 200ms ease;
                    ${theme.progressThumb}
                }
                
                .progress-container:hover .progress-thumb {
                    opacity: 1;
                }
                
                .progress-preview {
                    position: absolute;
                    bottom: 100%;
                    transform: translateX(-50%);
                    padding: 5px 10px;
                    background: rgba(0,0,0,0.9);
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    margin-bottom: 10px;
                }
                
                .progress-container:hover .progress-preview {
                    opacity: 1;
                }
                
                /* Control buttons */
                .controls-main {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .control-button {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 200ms ease;
                    ${theme.controlButton}
                }
                
                .control-button:hover {
                    ${theme.controlButtonHover}
                }
                
                .control-button svg {
                    width: 24px;
                    height: 24px;
                }
                
                /* Time display */
                .time-display {
                    font-size: 14px;
                    color: white;
                    font-family: monospace;
                    ${theme.timeDisplay}
                }
                
                /* Volume control */
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .volume-slider {
                    width: 0;
                    overflow: hidden;
                    transition: width 200ms ease;
                }
                
                .volume-control:hover .volume-slider {
                    width: 80px;
                }
                
                .volume-track {
                    height: 4px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                    position: relative;
                    cursor: pointer;
                }
                
                .volume-level {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    background: white;
                    border-radius: 2px;
                    ${theme.volumeLevel}
                }
                
                /* Settings menu */
                .settings-menu {
                    position: absolute;
                    bottom: 100%;
                    right: 0;
                    margin-bottom: 10px;
                    background: rgba(0,0,0,0.95);
                    border-radius: 8px;
                    padding: 10px 0;
                    min-width: 200px;
                    display: none;
                    ${theme.settingsMenu}
                }
                
                .settings-menu.open {
                    display: block;
                }
                
                .settings-item {
                    padding: 8px 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: background 200ms ease;
                }
                
                .settings-item:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .settings-item.active {
                    color: var(--accent-color);
                }
                
                /* Analytics overlay */
                .analytics-overlay {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    background: rgba(0,0,0,0.8);
                    padding: 15px;
                    border-radius: 8px;
                    font-family: monospace;
                    font-size: 12px;
                    display: none;
                    ${theme.analytics}
                }
                
                .analytics-overlay.show {
                    display: block;
                }
                
                .analytics-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    margin: 5px 0;
                }
                
                .analytics-label {
                    opacity: 0.7;
                }
                
                .analytics-value {
                    font-weight: bold;
                }
                
                /* Gesture feedback */
                .gesture-feedback {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                }
                
                .seek-preview,
                .volume-feedback {
                    background: rgba(0,0,0,0.8);
                    padding: 20px 30px;
                    border-radius: 8px;
                    font-size: 24px;
                    font-weight: bold;
                    opacity: 0;
                    transition: opacity 200ms ease;
                    ${theme.gestureFeedback}
                }
                
                .seek-preview.show,
                .volume-feedback.show {
                    opacity: 1;
                }
                
                .volume-feedback {
                    display: flex;
                    align-items: center;
                    gap: 15px;
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
                    --accent-color: #0f0;
                }
                
                .minimal {
                    --accent-color: #007aff;
                }
                
                .neon {
                    --accent-color: #00ffff;
                }
                
                .glassmorphic {
                    --accent-color: rgba(255,255,255,0.9);
                }
                
                .cinema {
                    --accent-color: #ff0000;
                    background: #000;
                }
                
                /* Fullscreen styles */
                .video-container[data-fullscreen="true"] {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: #000;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .video-controls {
                        padding: 10px;
                    }
                    
                    .controls-main {
                        gap: 10px;
                    }
                    
                    .control-button svg {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .time-display {
                        font-size: 12px;
                    }
                }
                
                /* GPU optimization */
                @supports (transform: translateZ(0)) {
                    .video-element,
                    .effects-canvas {
                        transform: translateZ(0);
                        backface-visibility: hidden;
                    }
                }
            </style>
        `.content;
    }
    
    _renderControls(theme) {
        return `
            <div class="video-controls">
                <div class="progress-container" data-action="seek">
                    <div class="progress-bg"></div>
                    <div class="progress-buffered" style="width: ${this._buffered}%"></div>
                    <div class="progress-played" style="width: ${(this._currentTime / this._duration) * 100}%">
                        <div class="progress-thumb"></div>
                    </div>
                    <div class="progress-preview">
                        <span class="preview-time">0:00</span>
                    </div>
                </div>
                
                <div class="controls-main">
                    <button class="control-button play-pause" data-action="toggle">
                        ${this._isPlaying ? 
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' :
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
                        }
                    </button>
                    
                    <div class="time-display">
                        <span class="current-time">${this._formatTime(this._currentTime)}</span>
                        <span> / </span>
                        <span class="duration">${this._formatTime(this._duration)}</span>
                    </div>
                    
                    <div class="volume-control">
                        <button class="control-button volume-button" data-action="mute">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                ${this._volume > 0 ? '<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>' : ''}
                            </svg>
                        </button>
                        <div class="volume-slider">
                            <div class="volume-track" data-action="volume">
                                <div class="volume-level" style="width: ${this._volume * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="flex: 1"></div>
                    
                    ${this._config.subtitles.length > 0 ? `
                        <button class="control-button" data-action="subtitles">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <line x1="8" y1="10" x2="16" y2="10"/>
                                <line x1="6" y1="14" x2="18" y2="14"/>
                            </svg>
                        </button>
                    ` : ''}
                    
                    <button class="control-button" data-action="settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6m12-7h-6m-6 0H1m20.5-7.5L17 9l-4.5 4.5m-1-1L7 17l-4.5 4.5"/>
                        </svg>
                    </button>
                    
                    ${this._config.pip ? `
                        <button class="control-button" data-action="pip">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="3" width="20" height="14" rx="2"/>
                                <rect x="12" y="10" width="8" height="5" rx="1"/>
                            </svg>
                        </button>
                    ` : ''}
                    
                    ${this._config.fullscreen ? `
                        <button class="control-button" data-action="fullscreen">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                ${this._isFullscreen ?
                                    '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>' :
                                    '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'
                                }
                            </svg>
                        </button>
                    ` : ''}
                    
                    <div class="settings-menu">
                        <div class="settings-submenu quality-menu">
                            <div class="settings-header">Quality</div>
                            ${['auto', '1080p', '720p', '480p', '360p'].map(q => `
                                <div class="settings-item ${this._quality === q ? 'active' : ''}" data-quality="${q}">
                                    ${q}
                                </div>
                            `).join('')}
                        </div>
                        <div class="settings-submenu speed-menu">
                            <div class="settings-header">Speed</div>
                            ${this._config.playbackRates.map(rate => `
                                <div class="settings-item ${this._playbackRate === rate ? 'active' : ''}" data-speed="${rate}">
                                    ${rate}x
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    _renderAnalytics(theme) {
        return `
            <div class="analytics-overlay">
                <div class="analytics-row">
                    <span class="analytics-label">FPS:</span>
                    <span class="analytics-value fps-value">0</span>
                </div>
                <div class="analytics-row">
                    <span class="analytics-label">Dropped:</span>
                    <span class="analytics-value dropped-value">0</span>
                </div>
                <div class="analytics-row">
                    <span class="analytics-label">Bitrate:</span>
                    <span class="analytics-value bitrate-value">0 kbps</span>
                </div>
                <div class="analytics-row">
                    <span class="analytics-label">Buffer:</span>
                    <span class="analytics-value buffer-value">0s</span>
                </div>
                <div class="analytics-row">
                    <span class="analytics-label">Resolution:</span>
                    <span class="analytics-value resolution-value">0x0</span>
                </div>
            </div>
        `;
    }
    
    _getThemeStyles() {
        const themes = {
            brutal: {
                container: 'border: 3px solid #0f0;',
                bigPlayButton: 'color: #0f0;',
                bigPlayButtonHover: 'color: #0f0; filter: drop-shadow(0 0 20px #0f0);',
                controls: 'background: linear-gradient(transparent, #000);',
                progressContainer: 'background: #001100;',
                progressPlayed: 'box-shadow: 0 0 10px #0f0;',
                progressThumb: 'box-shadow: 0 0 15px #0f0;',
                controlButton: '',
                controlButtonHover: 'color: #0f0; transform: scale(1.1);',
                timeDisplay: 'color: #0f0;',
                volumeLevel: 'background: #0f0;',
                settingsMenu: 'border: 2px solid #0f0;',
                analytics: 'border: 2px solid #0f0; color: #0f0;',
                gestureFeedback: 'border: 2px solid #0f0; color: #0f0;'
            },
            minimal: {
                container: '',
                bigPlayButton: 'color: white;',
                bigPlayButtonHover: '',
                controls: '',
                progressContainer: '',
                progressPlayed: '',
                progressThumb: '',
                controlButton: '',
                controlButtonHover: 'opacity: 0.8;',
                timeDisplay: '',
                volumeLevel: '',
                settingsMenu: '',
                analytics: '',
                gestureFeedback: ''
            },
            neon: {
                container: '',
                bigPlayButton: 'color: #00ffff; filter: drop-shadow(0 0 10px #00ffff);',
                bigPlayButtonHover: 'filter: drop-shadow(0 0 30px #00ffff);',
                controls: 'background: linear-gradient(transparent, rgba(26,26,46,0.9));',
                progressContainer: 'box-shadow: 0 0 10px rgba(0,255,255,0.3);',
                progressPlayed: 'box-shadow: 0 0 20px #00ffff;',
                progressThumb: 'box-shadow: 0 0 20px #00ffff;',
                controlButton: 'text-shadow: 0 0 10px #00ffff;',
                controlButtonHover: 'color: #00ffff; transform: scale(1.1);',
                timeDisplay: 'color: #00ffff; text-shadow: 0 0 5px #00ffff;',
                volumeLevel: 'background: #00ffff; box-shadow: 0 0 10px #00ffff;',
                settingsMenu: 'border: 1px solid #00ffff; box-shadow: 0 0 20px rgba(0,255,255,0.3);',
                analytics: 'border: 1px solid #00ffff; color: #00ffff;',
                gestureFeedback: 'border: 1px solid #00ffff; color: #00ffff; box-shadow: 0 0 30px rgba(0,255,255,0.5);'
            },
            glassmorphic: {
                container: '',
                bigPlayButton: 'color: white; backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); border-radius: 50%; padding: 20px;',
                bigPlayButtonHover: 'background: rgba(255,255,255,0.2);',
                controls: 'backdrop-filter: blur(10px); background: linear-gradient(transparent, rgba(0,0,0,0.5));',
                progressContainer: 'background: rgba(255,255,255,0.1);',
                progressPlayed: 'background: rgba(255,255,255,0.9);',
                progressThumb: 'background: white;',
                controlButton: '',
                controlButtonHover: 'background: rgba(255,255,255,0.1); border-radius: 50%;',
                timeDisplay: '',
                volumeLevel: 'background: rgba(255,255,255,0.9);',
                settingsMenu: 'backdrop-filter: blur(20px); background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2);',
                analytics: 'backdrop-filter: blur(10px); background: rgba(0,0,0,0.7);',
                gestureFeedback: 'backdrop-filter: blur(10px); background: rgba(0,0,0,0.7);'
            },
            cinema: {
                container: 'background: #000; box-shadow: inset 0 0 100px rgba(255,0,0,0.1);',
                bigPlayButton: 'color: #ff0000;',
                bigPlayButtonHover: 'filter: drop-shadow(0 0 30px #ff0000);',
                controls: 'background: linear-gradient(transparent, rgba(0,0,0,0.95));',
                progressContainer: 'background: #1a0000;',
                progressPlayed: 'background: #ff0000;',
                progressThumb: 'background: #ff0000; box-shadow: 0 0 10px #ff0000;',
                controlButton: '',
                controlButtonHover: 'color: #ff0000;',
                timeDisplay: 'color: #ff0000;',
                volumeLevel: 'background: #ff0000;',
                settingsMenu: 'background: #000; border: 1px solid #ff0000;',
                analytics: 'background: #000; border: 1px solid #ff0000; color: #ff0000;',
                gestureFeedback: 'background: #000; border: 2px solid #ff0000; color: #ff0000;'
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    _formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame(() => {
            this._video = this.shadowRoot.querySelector('.video-element');
            this._setupVideoListeners();
            this._setupControlListeners();
            this._setupKeyboardControls();
            this._setupGestures();
            
            if (this._config.effects.particles) {
                this._initParticles();
            }
            
            if (this._config.effects.visualizer) {
                this._initAudioVisualizer();
            }
            
            if (this._config.analytics) {
                this._startAnalytics();
            }
        });
    }
    
    _setupVideoListeners() {
        if (!this._video) return;
        
        // Media events
        this._video.addEventListener('loadedmetadata', () => {
            this._duration = this._video.duration;
            this.render();
        });
        
        this._video.addEventListener('timeupdate', () => {
            this._currentTime = this._video.currentTime;
            this._updateProgress();
        });
        
        this._video.addEventListener('play', () => {
            this._isPlaying = true;
            this.render();
            this._triggerPlayParticles();
        });
        
        this._video.addEventListener('pause', () => {
            this._isPlaying = false;
            this.render();
        });
        
        this._video.addEventListener('ended', () => {
            this._isPlaying = false;
            this.render();
            this._triggerEndParticles();
        });
        
        this._video.addEventListener('progress', () => {
            this._updateBuffered();
        });
        
        this._video.addEventListener('waiting', () => {
            this.shadowRoot.querySelector('.video-container').classList.add('loading');
        });
        
        this._video.addEventListener('canplay', () => {
            this.shadowRoot.querySelector('.video-container').classList.remove('loading');
        });
        
        this._video.addEventListener('volumechange', () => {
            this._volume = this._video.volume;
            this._updateVolumeDisplay();
        });
        
        // Error handling
        this._video.addEventListener('error', (e) => {
            this.dispatchEvent(new CustomEvent('error', { detail: e }));
        });
    }
    
    _setupControlListeners() {
        const container = this.shadowRoot.querySelector('.video-container');
        
        // Click handlers
        container.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            switch (action) {
                case 'play':
                case 'toggle':
                    this.togglePlay();
                    break;
                case 'mute':
                    this.toggleMute();
                    break;
                case 'pip':
                    this.togglePiP();
                    break;
                case 'fullscreen':
                    this.toggleFullscreen();
                    break;
                case 'settings':
                    this._toggleSettings();
                    break;
                case 'subtitles':
                    this._toggleSubtitles();
                    break;
            }
            
            // Quality selection
            if (e.target.dataset.quality) {
                this.setQuality(e.target.dataset.quality);
            }
            
            // Speed selection
            if (e.target.dataset.speed) {
                this.setPlaybackRate(parseFloat(e.target.dataset.speed));
            }
        });
        
        // Progress bar interaction
        const progressContainer = this.shadowRoot.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('mousedown', this._startSeeking.bind(this));
            progressContainer.addEventListener('mousemove', this._updateSeekPreview.bind(this));
            progressContainer.addEventListener('mouseleave', this._hideSeekPreview.bind(this));
        }
        
        // Volume control
        const volumeTrack = this.shadowRoot.querySelector('.volume-track');
        if (volumeTrack) {
            volumeTrack.addEventListener('mousedown', this._startVolumeChange.bind(this));
        }
        
        // Show/hide controls
        let hideControlsTimeout;
        container.addEventListener('mousemove', () => {
            container.classList.add('show-controls');
            clearTimeout(hideControlsTimeout);
            
            if (this._isPlaying) {
                hideControlsTimeout = setTimeout(() => {
                    container.classList.remove('show-controls');
                }, 3000);
            }
        });
    }
    
    _setupKeyboardControls() {
        if (!this._config.keyboard) return;
        
        this.shadowRoot.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seek(this._currentTime - 10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.seek(this._currentTime + 10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(Math.min(this._volume + 0.1, 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(Math.max(this._volume - 0.1, 0));
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'p':
                    e.preventDefault();
                    if (this._config.pip) this.togglePiP();
                    break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    const percent = parseInt(e.key) * 10;
                    this.seek((this._duration * percent) / 100);
                    break;
            }
        });
    }
    
    _setupGestures() {
        if (!this._config.gestures) return;
        
        const container = this.shadowRoot.querySelector('.video-container');
        let touchStartX = 0;
        let touchStartY = 0;
        let startTime = 0;
        let startVolume = 0;
        let isSeeking = false;
        let isVolumeChanging = false;
        
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            startTime = this._currentTime;
            startVolume = this._volume;
        });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                // Horizontal swipe - seek
                e.preventDefault();
                isSeeking = true;
                const seekAmount = (deltaX / container.offsetWidth) * 60; // 60 seconds max
                const newTime = Math.max(0, Math.min(this._duration, startTime + seekAmount));
                this._showSeekFeedback(newTime);
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
                // Vertical swipe - volume
                e.preventDefault();
                isVolumeChanging = true;
                const volumeChange = -(deltaY / container.offsetHeight) * 2;
                const newVolume = Math.max(0, Math.min(1, startVolume + volumeChange));
                this.setVolume(newVolume);
                this._showVolumeFeedback(newVolume);
            }
        });
        
        container.addEventListener('touchend', (e) => {
            if (isSeeking) {
                const deltaX = e.changedTouches[0].clientX - touchStartX;
                const seekAmount = (deltaX / container.offsetWidth) * 60;
                const newTime = Math.max(0, Math.min(this._duration, startTime + seekAmount));
                this.seek(newTime);
                this._hideSeekFeedback();
            }
            
            if (isVolumeChanging) {
                this._hideVolumeFeedback();
            }
            
            isSeeking = false;
            isVolumeChanging = false;
        });
        
        // Double tap to seek
        let lastTap = 0;
        container.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                const rect = container.getBoundingClientRect();
                const x = e.changedTouches[0].clientX - rect.left;
                
                if (x < rect.width / 3) {
                    // Left side - rewind 10s
                    this.seek(this._currentTime - 10);
                } else if (x > rect.width * 2 / 3) {
                    // Right side - forward 10s
                    this.seek(this._currentTime + 10);
                } else {
                    // Center - play/pause
                    this.togglePlay();
                }
            }
            
            lastTap = currentTime;
        });
    }
    
    _initParticles() {
        const container = this.shadowRoot.querySelector('.particle-container');
        this._particleEngine = new ParticleEngine({
            container,
            maxParticles: 100,
            autoStart: false,
            mode: 'cpu',
            config: {
                particle: {
                    size: { min: 2, max: 4 },
                    life: { min: 500, max: 1500 },
                    velocity: { min: 2, max: 5 },
                    colors: this._getParticleColors()
                },
                emitter: {
                    rate: 0,
                    position: { x: 0.5, y: 0.5 }
                }
            }
        });
    }
    
    _getParticleColors() {
        const colors = {
            brutal: ['#00ff00', '#00cc00', '#00ff00'],
            minimal: ['#007aff', '#0051d5', '#007aff'],
            neon: ['#00ffff', '#00cccc', '#0099cc'],
            glassmorphic: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)'],
            cinema: ['#ff0000', '#cc0000', '#ff3333']
        };
        
        return colors[this._config.theme] || colors.brutal;
    }
    
    _initAudioVisualizer() {
        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this._audioContext.createMediaElementSource(this._video);
            this._analyser = this._audioContext.createAnalyser();
            
            source.connect(this._analyser);
            this._analyser.connect(this._audioContext.destination);
            
            this._analyser.fftSize = 256;
            
            this._canvas = this.shadowRoot.querySelector('.effects-canvas');
            this._gl = this._canvas.getContext('webgl') || this._canvas.getContext('2d');
            
            if (this._gl && this._gl.getParameter) {
                // WebGL visualizer
                this._initWebGLVisualizer();
            } else {
                // 2D canvas fallback
                this._init2DVisualizer();
            }
        } catch (e) {
            }
    }
    
    _initWebGLVisualizer() {
        // WebGL shader setup for audio visualization
        // Similar to the ImageGallery WebGL setup but for audio data
    }
    
    _init2DVisualizer() {
        const bufferLength = this._analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this._isPlaying) return;
            
            requestAnimationFrame(draw);
            
            this._analyser.getByteFrequencyData(dataArray);
            
            const ctx = this._gl;
            const width = this._canvas.width;
            const height = this._canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height * 0.5;
                
                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;
                
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    _startAnalytics() {
        const updateAnalytics = () => {
            if (!this._video) return;
            
            // Calculate FPS
            const now = performance.now();
            if (this._lastFrameTime) {
                const delta = now - this._lastFrameTime;
                this._fps = Math.round(1000 / delta);
            }
            this._lastFrameTime = now;
            
            // Get video quality info
            const videoQuality = this._video.getVideoPlaybackQuality?.() || {};
            this._dropped = videoQuality.droppedVideoFrames || 0;
            
            // Estimate bitrate
            if (this._video.webkitVideoDecodedByteCount) {
                const bytes = this._video.webkitVideoDecodedByteCount;
                const seconds = this._video.currentTime;
                this._bitrate = Math.round((bytes * 8) / seconds / 1000); // kbps
            }
            
            // Update display
            this._updateAnalyticsDisplay();
            
            if (this._isPlaying) {
                requestAnimationFrame(updateAnalytics);
            }
        };
        
        this._video.addEventListener('play', () => {
            requestAnimationFrame(updateAnalytics);
        });
    }
    
    _updateAnalyticsDisplay() {
        const analytics = this.shadowRoot.querySelector('.analytics-overlay');
        if (!analytics) return;
        
        analytics.querySelector('.fps-value').textContent = this._fps;
        analytics.querySelector('.dropped-value').textContent = this._dropped;
        analytics.querySelector('.bitrate-value').textContent = `${this._bitrate} kbps`;
        
        // Buffer health
        const buffered = this._video.buffered;
        let bufferHealth = 0;
        if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            bufferHealth = Math.round(bufferedEnd - this._currentTime);
        }
        analytics.querySelector('.buffer-value').textContent = `${bufferHealth}s`;
        
        // Resolution
        analytics.querySelector('.resolution-value').textContent = 
            `${this._video.videoWidth}x${this._video.videoHeight}`;
    }
    
    _updateProgress() {
        const played = this.shadowRoot.querySelector('.progress-played');
        const thumb = this.shadowRoot.querySelector('.progress-thumb');
        const currentTimeEl = this.shadowRoot.querySelector('.current-time');
        
        if (played) {
            const percent = (this._currentTime / this._duration) * 100;
            played.style.width = `${percent}%`;
            if (thumb) {
                thumb.style.left = `${percent}%`;
            }
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = this._formatTime(this._currentTime);
        }
    }
    
    _updateBuffered() {
        const buffered = this.shadowRoot.querySelector('.progress-buffered');
        if (!buffered || !this._video.buffered.length) return;
        
        const bufferedEnd = this._video.buffered.end(this._video.buffered.length - 1);
        this._buffered = (bufferedEnd / this._duration) * 100;
        buffered.style.width = `${this._buffered}%`;
    }
    
    _updateVolumeDisplay() {
        const volumeLevel = this.shadowRoot.querySelector('.volume-level');
        const volumeButton = this.shadowRoot.querySelector('.volume-button svg');
        
        if (volumeLevel) {
            volumeLevel.style.width = `${this._volume * 100}%`;
        }
        
        if (volumeButton) {
            // Update volume icon based on level
            const waves = volumeButton.querySelector('.volume-waves');
            if (waves) {
                waves.style.opacity = this._volume > 0 ? '1' : '0';
            }
        }
    }
    
    _startSeeking(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.seek(this._duration * percent);
        
        const handleMove = (e) => {
            const percent = (e.clientX - rect.left) / rect.width;
            this.seek(this._duration * percent);
        };
        
        const handleEnd = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
        };
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    _updateSeekPreview(e) {
        const preview = this.shadowRoot.querySelector('.progress-preview');
        if (!preview) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = this._duration * percent;
        
        preview.style.left = `${percent * 100}%`;
        preview.querySelector('.preview-time').textContent = this._formatTime(time);
    }
    
    _hideSeekPreview() {
        const preview = this.shadowRoot.querySelector('.progress-preview');
        if (preview) {
            preview.style.opacity = '0';
        }
    }
    
    _startVolumeChange(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.setVolume(percent);
        
        const handleMove = (e) => {
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            this.setVolume(percent);
        };
        
        const handleEnd = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
        };
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    _toggleSettings() {
        const menu = this.shadowRoot.querySelector('.settings-menu');
        if (menu) {
            menu.classList.toggle('open');
            this._settingsOpen = menu.classList.contains('open');
        }
    }
    
    _toggleSubtitles() {
        // Toggle subtitles menu
        this.dispatchEvent(new CustomEvent('subtitlestoggle'));
    }
    
    _showSeekFeedback(time) {
        const feedback = this.shadowRoot.querySelector('.seek-preview');
        if (feedback) {
            feedback.classList.add('show');
            feedback.querySelector('.seek-time').textContent = this._formatTime(time);
        }
    }
    
    _hideSeekFeedback() {
        const feedback = this.shadowRoot.querySelector('.seek-preview');
        if (feedback) {
            feedback.classList.remove('show');
        }
    }
    
    _showVolumeFeedback(volume) {
        const feedback = this.shadowRoot.querySelector('.volume-feedback');
        if (feedback) {
            feedback.classList.add('show');
            feedback.querySelector('.volume-percent').textContent = `${Math.round(volume * 100)}%`;
        }
    }
    
    _hideVolumeFeedback() {
        const feedback = this.shadowRoot.querySelector('.volume-feedback');
        if (feedback) {
            feedback.classList.remove('show');
        }
    }
    
    _triggerPlayParticles() {
        if (!this._particleEngine) return;
        
        this._particleEngine.burst({
            count: 20,
            position: { x: 0.5, y: 1 },
            spread: { x: 1, y: 0.3 },
            velocity: { min: -5, max: -2 }
        });
    }
    
    _triggerEndParticles() {
        if (!this._particleEngine) return;
        
        // Fireworks effect
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this._particleEngine.burst({
                    count: 30,
                    position: { 
                        x: 0.2 + Math.random() * 0.6, 
                        y: 0.3 + Math.random() * 0.4 
                    },
                    spread: { x: 0.3, y: 0.3 }
                });
            }, i * 200);
        }
    }
    
    // Public API
    load(src, options = {}) {
        if (!this._video) return;
        
        this._video.src = src;
        
        if (options.poster) {
            this._video.poster = options.poster;
        }
        
        if (options.subtitles) {
            this._config.subtitles = options.subtitles;
        }
        
        if (options.autoplay) {
            this._video.autoplay = true;
        }
        
        this._video.load();
    }
    
    play() {
        if (this._video) {
            const playPromise = this._video.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    });
            }
        }
    }
    
    pause() {
        if (this._video) {
            this._video.pause();
        }
    }
    
    togglePlay() {
        if (this._isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    seek(time) {
        if (this._video) {
            this._video.currentTime = Math.max(0, Math.min(time, this._duration));
        }
    }
    
    setVolume(volume) {
        if (this._video) {
            this._video.volume = Math.max(0, Math.min(1, volume));
            this._volume = this._video.volume;
        }
    }
    
    toggleMute() {
        if (this._video) {
            this._video.muted = !this._video.muted;
            if (this._video.muted) {
                this._previousVolume = this._volume;
                this.setVolume(0);
            } else {
                this.setVolume(this._previousVolume || 1);
            }
        }
    }
    
    setPlaybackRate(rate) {
        if (this._video) {
            this._video.playbackRate = rate;
            this._playbackRate = rate;
            this.render();
        }
    }
    
    setQuality(quality) {
        this._quality = quality;
        this.render();
        
        // Emit event for adaptive streaming implementation
        this.dispatchEvent(new CustomEvent('qualitychange', {
            detail: { quality }
        }));
    }
    
    async togglePiP() {
        if (!this._video || !document.pictureInPictureEnabled) return;
        
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                this._isPiP = false;
            } else {
                await this._video.requestPictureInPicture();
                this._isPiP = true;
            }
        } catch (e) {
            }
    }
    
    async toggleFullscreen() {
        const container = this.shadowRoot.querySelector('.video-container');
        
        if (!document.fullscreenElement) {
            try {
                await container.requestFullscreen();
                this._isFullscreen = true;
            } catch (e) {
                }
        } else {
            await document.exitFullscreen();
            this._isFullscreen = false;
        }
        
        this.render();
    }
    
    showAnalytics() {
        const analytics = this.shadowRoot.querySelector('.analytics-overlay');
        if (analytics) {
            analytics.classList.add('show');
        }
    }
    
    hideAnalytics() {
        const analytics = this.shadowRoot.querySelector('.analytics-overlay');
        if (analytics) {
            analytics.classList.remove('show');
        }
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        this.render();
    }
    
    getCurrentTime() {
        return this._currentTime;
    }
    
    getDuration() {
        return this._duration;
    }
    
    getVolume() {
        return this._volume;
    }
    
    isPlaying() {
        return this._isPlaying;
    }
    
    destroy() {
        if (this._video) {
            this._video.pause();
            this._video.src = '';
        }
        
        if (this._particleEngine) {
            this._particleEngine.destroy();
        }
        
        if (this._audioContext) {
            this._audioContext.close();
        }
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this.destroy();
    }
}

// Register element
customElements.define('brutal-video', VideoPlayer);