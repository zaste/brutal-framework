/**
 * @fileoverview BRUTAL V3 - Recording Engine for Visual Debug Layer
 * Time-travel debugging with full state snapshots at 60fps
 * @version 3.0.0
 */

import { GPUDetector } from '../gpu/GPUDetector.js';

/**
 * Recording Engine - Capture everything, replay anything
 */
export class RecordingEngine {
    constructor(options = {}) {
        this.recording = false;
        this.playing = false;
        this.currentFrame = 0;
        
        // Configuration
        this.config = {
            maxFrames: options.maxFrames || 36000, // 10 minutes at 60fps
            frameRate: options.frameRate || 60,
            compression: options.compression ?? true,
            storage: options.storage || 'indexedDB', // 'memory' | 'indexedDB' | 'filesystem'
            ...options
        };
        
        // Storage
        this.frames = [];
        this.metadata = {
            startTime: 0,
            endTime: 0,
            frameCount: 0,
            events: [],
            performance: [],
            errors: []
        };
        
        // Compression worker
        this.compressionWorker = null;
        
        // IndexedDB
        this.db = null;
        this.dbName = 'BrutalRecordings';
        this.dbVersion = 1;
        
        // Playback state
        this.playbackSpeed = 1;
        this.loopPlayback = false;
        this.breakpoints = new Set();
        
        // Performance tracking
        this.captureMetrics = {
            framesRecorded: 0,
            bytesStored: 0,
            compressionRatio: 0,
            cpuUsage: 0
        };
        
        // Event queues
        this.eventQueue = [];
        this.stateSnapshots = new Map();
        
        // Time sync
        this.recordingStartTime = 0;
        this.playbackStartTime = 0;
        
        // V8 optimizations
        this._boundCaptureFrame = this._captureFrame.bind(this);
        this._boundPlaybackFrame = this._playbackFrame.bind(this);
    }
    
    /**
     * Initialize recording engine
     */
    async init() {
        // Initialize storage backend
        if (this.config.storage === 'indexedDB') {
            await this._initIndexedDB();
        }
        
        // Initialize compression worker if enabled
        if (this.config.compression) {
            await this._initCompressionWorker();
        }
        
        // Detect GPU capabilities for optimized recording
        const gpuDetector = new GPUDetector();
        const gpuCaps = await gpuDetector.init();
        
        // Adjust settings based on capabilities
        if (gpuCaps.score < 50) {
            this.config.frameRate = 30; // Reduce framerate on weak devices
        }
        
        }
    
    /**
     * Initialize IndexedDB for large recordings
     */
    async _initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Recordings store
                if (!db.objectStoreNames.contains('recordings')) {
                    const store = db.createObjectStore('recordings', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('name', 'name');
                }
                
                // Frames store
                if (!db.objectStoreNames.contains('frames')) {
                    const store = db.createObjectStore('frames', { 
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('recordingId', 'recordingId');
                    store.createIndex('frameNumber', 'frameNumber');
                }
            };
        });
    }
    
    /**
     * Initialize compression worker
     */
    async _initCompressionWorker() {
        // Create inline worker for compression
        const workerCode = `
            // LZ4-style compression for speed
            self.onmessage = function(e) {
                const { action, data } = e.data;
                
                if (action === 'compress') {
                    const compressed = compress(data);
                    self.postMessage({ 
                        action: 'compressed', 
                        data: compressed,
                        originalSize: data.length,
                        compressedSize: compressed.length
                    });
                } else if (action === 'decompress') {
                    const decompressed = decompress(data);
                    self.postMessage({ 
                        action: 'decompressed', 
                        data: decompressed 
                    });
                }
            };
            
            function compress(data) {
                // Simple RLE compression for demo
                // In production, use proper LZ4 or Brotli
                const str = JSON.stringify(data);
                let compressed = '';
                let count = 1;
                
                for (let i = 0; i < str.length; i++) {
                    if (str[i] === str[i + 1]) {
                        count++;
                    } else {
                        compressed += count > 1 ? count + str[i] : str[i];
                        count = 1;
                    }
                }
                
                return compressed;
            }
            
            function decompress(data) {
                // Decompress RLE
                let decompressed = '';
                let i = 0;
                
                while (i < data.length) {
                    let count = '';
                    while (!isNaN(data[i])) {
                        count += data[i];
                        i++;
                    }
                    
                    const char = data[i];
                    const repeat = count ? parseInt(count) : 1;
                    decompressed += char.repeat(repeat);
                    i++;
                }
                
                return JSON.parse(decompressed);
            }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.compressionWorker = new Worker(workerUrl);
        
        // Cleanup
        URL.revokeObjectURL(workerUrl);
    }
    
    /**
     * Start recording
     */
    async startRecording(name = `Recording ${Date.now()}`) {
        if (this.recording) return;
        
        this.recording = true;
        this.recordingStartTime = performance.now();
        this.frames = [];
        this.eventQueue = [];
        this.stateSnapshots.clear();
        
        // Reset metadata
        this.metadata = {
            name,
            startTime: Date.now(),
            endTime: 0,
            frameCount: 0,
            events: [],
            performance: [],
            errors: [],
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            userAgent: navigator.userAgent
        };
        
        // Start capture loop
        this._startCaptureLoop();
        
        // Attach global listeners
        this._attachRecordingListeners();
        
        }
    
    /**
     * Stop recording
     */
    async stopRecording() {
        if (!this.recording) return;
        
        this.recording = false;
        this.metadata.endTime = Date.now();
        this.metadata.frameCount = this.frames.length;
        
        // Detach listeners
        this._detachRecordingListeners();
        
        // Save to storage
        const recordingId = await this._saveRecording();
        
        return recordingId;
    }
    
    /**
     * Start capture loop
     */
    _startCaptureLoop() {
        const captureInterval = 1000 / this.config.frameRate;
        let lastCaptureTime = performance.now();
        
        const capture = () => {
            if (!this.recording) return;
            
            const now = performance.now();
            const delta = now - lastCaptureTime;
            
            if (delta >= captureInterval) {
                this._captureFrame();
                lastCaptureTime = now - (delta % captureInterval);
            }
            
            requestAnimationFrame(capture);
        };
        
        capture();
    }
    
    /**
     * Capture single frame
     */
    _captureFrame() {
        const timestamp = performance.now() - this.recordingStartTime;
        
        // Capture frame data
        const frame = {
            timestamp,
            frameNumber: this.frames.length,
            
            // DOM snapshot
            dom: this._captureDOMSnapshot(),
            
            // Visual state
            visual: {
                particles: this._captureParticles(),
                effects: this._captureEffects(),
                debugOverlay: this._captureDebugOverlay()
            },
            
            // Component state
            components: this._captureComponentStates(),
            
            // Performance metrics
            performance: this._capturePerformanceMetrics(),
            
            // Pending events
            events: [...this.eventQueue]
        };
        
        // Clear event queue
        this.eventQueue = [];
        
        // Compress if enabled
        if (this.config.compression && this.compressionWorker) {
            this.compressionWorker.postMessage({
                action: 'compress',
                data: frame
            });
            
            this.compressionWorker.onmessage = (e) => {
                if (e.data.action === 'compressed') {
                    this.frames.push({
                        compressed: true,
                        data: e.data.data,
                        originalSize: e.data.originalSize,
                        compressedSize: e.data.compressedSize
                    });
                    
                    this.captureMetrics.compressionRatio = 
                        e.data.originalSize / e.data.compressedSize;
                }
            };
        } else {
            this.frames.push(frame);
        }
        
        // Update metrics
        this.captureMetrics.framesRecorded++;
        
        // Trim old frames if over limit
        if (this.frames.length > this.config.maxFrames) {
            this.frames.shift();
        }
    }
    
    /**
     * Capture DOM snapshot efficiently
     */
    _captureDOMSnapshot() {
        // Only capture visible elements and their states
        const visibleElements = [];
        const elements = document.querySelectorAll('[data-brutal-component]');
        
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                visibleElements.push({
                    id: el.id,
                    tagName: el.tagName,
                    className: el.className,
                    rect: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    },
                    attributes: this._getRelevantAttributes(el)
                });
            }
        });
        
        return visibleElements;
    }
    
    /**
     * Get relevant attributes for recording
     */
    _getRelevantAttributes(element) {
        const attrs = {};
        const relevant = ['data-state', 'data-props', 'data-render-count'];
        
        relevant.forEach(attr => {
            if (element.hasAttribute(attr)) {
                attrs[attr] = element.getAttribute(attr);
            }
        });
        
        return attrs;
    }
    
    /**
     * Capture particle states
     */
    _captureParticles() {
        if (!window.__BRUTAL_DEBUG_GPU__?.particleSystem) return null;
        
        const particleSystem = window.__BRUTAL_DEBUG_GPU__.particleSystem;
        return {
            count: particleSystem.particleCount,
            spawners: particleSystem.spawners.length,
            config: { ...particleSystem.config }
        };
    }
    
    /**
     * Capture active effects
     */
    _captureEffects() {
        // Capture any active visual effects
        return {
            screenShake: document.querySelector('#brutal-debug-layer-gpu')?.style.transform || '',
            activeAnimations: document.getAnimations().length
        };
    }
    
    /**
     * Capture debug overlay state
     */
    _captureDebugOverlay() {
        const debugLayer = window.__BRUTAL_DEBUG_GPU__ || window.__BRUTAL_DEBUG__;
        if (!debugLayer) return null;
        
        return {
            enabled: debugLayer.enabled,
            metrics: { ...debugLayer.metrics },
            recording: debugLayer.recording
        };
    }
    
    /**
     * Capture component states
     */
    _captureComponentStates() {
        const states = [];
        
        // Get all BRUTAL components
        document.querySelectorAll('[data-brutal-component]').forEach(component => {
            if (component.__brutalState) {
                states.push({
                    id: component.id,
                    state: JSON.parse(JSON.stringify(component.__brutalState))
                });
            }
        });
        
        return states;
    }
    
    /**
     * Capture performance metrics
     */
    _capturePerformanceMetrics() {
        const metrics = {
            timestamp: performance.now(),
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null
        };
        
        // Get FPS from debug layer
        const debugLayer = window.__BRUTAL_DEBUG_GPU__ || window.__BRUTAL_DEBUG__;
        if (debugLayer?.metrics) {
            metrics.fps = debugLayer.metrics.fps;
            metrics.renderTime = debugLayer.metrics.lastRenderTime;
        }
        
        return metrics;
    }
    
    /**
     * Attach recording listeners
     */
    _attachRecordingListeners() {
        // Capture all framework events
        const events = [
            'brutal:render',
            'brutal:error', 
            'brutal:state-change',
            'brutal:mount',
            'brutal:unmount'
        ];
        
        events.forEach(eventType => {
            window.addEventListener(eventType, this._handleEvent.bind(this));
        });
        
        // Capture user interactions
        ['click', 'keydown', 'scroll', 'resize'].forEach(eventType => {
            window.addEventListener(eventType, this._handleUserEvent.bind(this));
        });
    }
    
    /**
     * Handle framework event
     */
    _handleEvent(event) {
        if (!this.recording) return;
        
        this.eventQueue.push({
            type: event.type,
            timestamp: performance.now() - this.recordingStartTime,
            detail: event.detail,
            target: event.target?.id || event.target?.tagName
        });
    }
    
    /**
     * Handle user event
     */
    _handleUserEvent(event) {
        if (!this.recording) return;
        
        const eventData = {
            type: event.type,
            timestamp: performance.now() - this.recordingStartTime
        };
        
        // Add specific event data
        switch (event.type) {
            case 'click':
                eventData.x = event.clientX;
                eventData.y = event.clientY;
                eventData.target = event.target?.id || event.target?.tagName;
                break;
            case 'keydown':
                eventData.key = event.key;
                eventData.code = event.code;
                eventData.modifiers = {
                    ctrl: event.ctrlKey,
                    shift: event.shiftKey,
                    alt: event.altKey,
                    meta: event.metaKey
                };
                break;
            case 'scroll':
                eventData.scrollX = window.scrollX;
                eventData.scrollY = window.scrollY;
                break;
            case 'resize':
                eventData.width = window.innerWidth;
                eventData.height = window.innerHeight;
                break;
        }
        
        this.eventQueue.push(eventData);
    }
    
    /**
     * Detach recording listeners
     */
    _detachRecordingListeners() {
        // Remove all listeners
        // In production, store references to remove specific listeners
    }
    
    /**
     * Save recording to storage
     */
    async _saveRecording() {
        if (this.config.storage === 'memory') {
            // Keep in memory
            return this.metadata.startTime;
        }
        
        if (this.config.storage === 'indexedDB' && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['recordings', 'frames'], 'readwrite');
                
                // Save metadata
                const recordingStore = transaction.objectStore('recordings');
                const recordingRequest = recordingStore.add(this.metadata);
                
                recordingRequest.onsuccess = () => {
                    const recordingId = recordingRequest.result;
                    
                    // Save frames
                    const frameStore = transaction.objectStore('frames');
                    const promises = this.frames.map((frame, index) => {
                        return frameStore.add({
                            recordingId,
                            frameNumber: index,
                            data: frame
                        });
                    });
                    
                    transaction.oncomplete = () => resolve(recordingId);
                    transaction.onerror = () => reject(transaction.error);
                };
            });
        }
        
        // Fallback to download
        return this._downloadRecording();
    }
    
    /**
     * Download recording as file
     */
    _downloadRecording() {
        const recording = {
            metadata: this.metadata,
            frames: this.frames
        };
        
        const blob = new Blob([JSON.stringify(recording)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brutal-recording-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        return this.metadata.startTime;
    }
    
    /**
     * Load recording
     */
    async loadRecording(recordingId) {
        if (this.config.storage === 'indexedDB' && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['recordings', 'frames'], 'readonly');
                
                // Load metadata
                const recordingStore = transaction.objectStore('recordings');
                const metadataRequest = recordingStore.get(recordingId);
                
                metadataRequest.onsuccess = () => {
                    this.metadata = metadataRequest.result;
                    
                    // Load frames
                    const frameStore = transaction.objectStore('frames');
                    const frameIndex = frameStore.index('recordingId');
                    const frameRequest = frameIndex.getAll(recordingId);
                    
                    frameRequest.onsuccess = () => {
                        this.frames = frameRequest.result
                            .sort((a, b) => a.frameNumber - b.frameNumber)
                            .map(f => f.data);
                        
                        resolve(this.metadata);
                    };
                };
                
                transaction.onerror = () => reject(transaction.error);
            });
        }
    }
    
    /**
     * Start playback
     */
    startPlayback(fromFrame = 0) {
        if (this.frames.length === 0) {
            return;
        }
        
        this.playing = true;
        this.currentFrame = fromFrame;
        this.playbackStartTime = performance.now();
        
        this._startPlaybackLoop();
    }
    
    /**
     * Stop playback
     */
    stopPlayback() {
        this.playing = false;
        }
    
    /**
     * Start playback loop
     */
    _startPlaybackLoop() {
        const playbackInterval = 1000 / this.config.frameRate;
        let lastPlaybackTime = performance.now();
        
        const playback = () => {
            if (!this.playing) return;
            
            const now = performance.now();
            const delta = now - lastPlaybackTime;
            
            if (delta >= playbackInterval / this.playbackSpeed) {
                this._playbackFrame();
                lastPlaybackTime = now - (delta % playbackInterval);
            }
            
            requestAnimationFrame(playback);
        };
        
        playback();
    }
    
    /**
     * Playback single frame
     */
    _playbackFrame() {
        if (this.currentFrame >= this.frames.length) {
            if (this.loopPlayback) {
                this.currentFrame = 0;
            } else {
                this.stopPlayback();
                return;
            }
        }
        
        // Check breakpoints
        if (this.breakpoints.has(this.currentFrame)) {
            this.stopPlayback();
            return;
        }
        
        let frame = this.frames[this.currentFrame];
        
        // Decompress if needed
        if (frame.compressed && this.compressionWorker) {
            this.compressionWorker.postMessage({
                action: 'decompress',
                data: frame.data
            });
            
            this.compressionWorker.onmessage = (e) => {
                if (e.data.action === 'decompressed') {
                    this._applyFrame(e.data.data);
                }
            };
        } else {
            this._applyFrame(frame);
        }
        
        this.currentFrame++;
    }
    
    /**
     * Apply frame state
     */
    _applyFrame(frame) {
        // Emit playback event
        window.dispatchEvent(new CustomEvent('brutal:playback-frame', {
            detail: {
                frame,
                currentFrame: this.currentFrame,
                totalFrames: this.frames.length
            }
        }));
        
        // Let the debug layer handle visualization
        const debugLayer = window.__BRUTAL_DEBUG_GPU__ || window.__BRUTAL_DEBUG__;
        if (debugLayer && debugLayer.applyRecordedFrame) {
            debugLayer.applyRecordedFrame(frame);
        }
    }
    
    /**
     * Seek to frame
     */
    seekToFrame(frameNumber) {
        if (frameNumber < 0 || frameNumber >= this.frames.length) {
            return;
        }
        
        this.currentFrame = frameNumber;
        
        if (!this.playing) {
            this._playbackFrame();
        }
    }
    
    /**
     * Seek to time
     */
    seekToTime(milliseconds) {
        // Find closest frame
        let closestFrame = 0;
        let closestDiff = Infinity;
        
        for (let i = 0; i < this.frames.length; i++) {
            const frame = this.frames[i];
            const timestamp = frame.compressed ? i * (1000 / this.config.frameRate) : frame.timestamp;
            const diff = Math.abs(timestamp - milliseconds);
            
            if (diff < closestDiff) {
                closestDiff = diff;
                closestFrame = i;
            }
        }
        
        this.seekToFrame(closestFrame);
    }
    
    /**
     * Set playback speed
     */
    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(10, speed));
    }
    
    /**
     * Add breakpoint
     */
    addBreakpoint(frameNumber) {
        this.breakpoints.add(frameNumber);
    }
    
    /**
     * Remove breakpoint
     */
    removeBreakpoint(frameNumber) {
        this.breakpoints.delete(frameNumber);
    }
    
    /**
     * Get recording list
     */
    async getRecordingList() {
        if (this.config.storage === 'indexedDB' && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['recordings'], 'readonly');
                const store = transaction.objectStore('recordings');
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        return [];
    }
    
    /**
     * Delete recording
     */
    async deleteRecording(recordingId) {
        if (this.config.storage === 'indexedDB' && this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['recordings', 'frames'], 'readwrite');
                
                // Delete metadata
                const recordingStore = transaction.objectStore('recordings');
                recordingStore.delete(recordingId);
                
                // Delete frames
                const frameStore = transaction.objectStore('frames');
                const frameIndex = frameStore.index('recordingId');
                const frameRequest = frameIndex.getAllKeys(recordingId);
                
                frameRequest.onsuccess = () => {
                    frameRequest.result.forEach(key => {
                        frameStore.delete(key);
                    });
                };
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        }
    }
    
    /**
     * Export recording
     */
    async exportRecording(recordingId, format = 'json') {
        await this.loadRecording(recordingId);
        
        if (format === 'json') {
            this._downloadRecording();
        } else if (format === 'video') {
            // Future: Export as video using MediaRecorder API
            }
    }
    
    /**
     * Get recording stats
     */
    getStats() {
        return {
            isRecording: this.recording,
            isPlaying: this.playing,
            currentFrame: this.currentFrame,
            totalFrames: this.frames.length,
            duration: this.metadata.endTime - this.metadata.startTime,
            captureMetrics: { ...this.captureMetrics },
            storageUsed: this._calculateStorageUsed()
        };
    }
    
    /**
     * Calculate storage used
     */
    _calculateStorageUsed() {
        let bytes = 0;
        
        this.frames.forEach(frame => {
            if (frame.compressed) {
                bytes += frame.compressedSize;
            } else {
                bytes += JSON.stringify(frame).length;
            }
        });
        
        return bytes;
    }
    
    /**
     * Destroy recording engine
     */
    destroy() {
        this.stopRecording();
        this.stopPlayback();
        
        if (this.compressionWorker) {
            this.compressionWorker.terminate();
        }
        
        if (this.db) {
            this.db.close();
        }
        
        this.frames = [];
        this.eventQueue = [];
        this.stateSnapshots.clear();
        this.breakpoints.clear();
    }
}

// Export singleton for easy access
export const recordingEngine = new RecordingEngine();