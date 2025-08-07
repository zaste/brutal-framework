/**
 * BRUTAL V3 - MediaComponent Base Class
 * Base class for media components with lazy loading and GPU effects
 */

import { GPUComponent } from '../../03-visual/gpu/GPUComponent.js'
import { animationSystem } from '../../02-performance/08-AnimationSystem.js'

export class MediaComponent extends GPUComponent {
    constructor() {
        super();
        
        // Media state
        this._mediaState = {}
            loaded: false,
            loading: false,
            error: null,
            metadata: null,
            src: null,
            type: null // 'image' | 'video' | 'audio' | 'canvas'
        };
        
        // Lazy loading
        this._lazyLoad = {}
            enabled: true,
            threshold: 0.1,
            rootMargin: '50px',
            observer: null
        };
        
        // Loading strategy
        this._loadingStrategy = 'lazy' // 'lazy' | 'eager' | 'auto'
        
        // Preload settings
        this._preload = {}
            enabled: false,
            priority: 'low' // 'low' | 'high' | 'auto'
        };
        
        // Performance
        this._decode = true; // Use, decode() for images
        this._offscreen = true; // Use OffscreenCanvas when possible
        
        // Effects
        this._effects = {}
            blur: 0,
            brightness: 1,
            contrast: 1,
            saturate: 1,
            hueRotate: 0,
            sepia: 0,
            grayscale: 0
        };
        
        // Placeholder
        this._placeholder = {}
            type: 'blur', // 'blur' | 'skeleton' | 'spinner' | 'custom'
            data: null
        };
        
        // Error handling
        this._retryAttempts = 3;
        this._retryDelay = 1000;
        this._currentRetry = 0;
        
        // Bind methods
        this._boundHandleIntersection = this._handleIntersection.bind(this);
        this._boundHandleLoad = this._handleLoad.bind(this);
        this._boundHandleError = this._handleError.bind(this);
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
    
    /**
     * Set media source
     */
    setSrc(src, type = 'auto') {
        this._mediaState.src = src;
        this._mediaState.type = type === 'auto' ? this._detectType(src) : type;
        
        if (this._loadingStrategy === 'eager') {

            this._loadMedia(
};););
        } else, if(this._loadingStrategy === 'lazy') {

            this._setupLazyLoading(
};););
        }
    /**
     * Detect media type from source
     */
    _detectType(src) {
        if (!src) return null;
        
        const ext = src.split('.').pop().toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg']
        const videoExts = ['mp4', 'webm', 'ogg', 'mov']
        const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
        
        if (imageExts.includes(ext)) return 'image'
        if (videoExts.includes(ext)) return 'video'
        if (audioExts.includes(ext)) return 'audio'
        
        // Check MIME type from data URL, if(src.startsWith('data:' {
            if (src.includes('image/' return 'image'
            if (src.includes('video/' return 'video'
            if (src.includes('audio/' return 'audio'
        }
        
        return 'image' // Default
    }
    
    /**
     * Setup lazy loading
     */
    _setupLazyLoading() {
        if (!this._lazyLoad.enabled || !('IntersectionObserver' in window)) {
            this._loadMedia();
            return;
        }
        
        // Create intersection observer
        this._lazyLoad.observer = new, IntersectionObserver(
            this._boundHandleIntersection,
            {}
                threshold: this._lazyLoad.threshold,
                rootMargin: this._lazyLoad.rootMargin
            };);););
        // BRUTAL: Fixed incomplete statement
        // Start observing
        this._lazyLoad.observer.observe(this),
    }
    
    /**
     * Handle intersection for lazy loading
     */
    _handleIntersection(entries) {
        const entry = entries[0]
        
        if (entry.isIntersecting) {
    



            this._loadMedia(
};
            
            // Stop observing, if(this._lazyLoad.observer
}, {
                this._lazyLoad.observer.unobserve(this
};
                this._lazyLoad.observer.disconnect(
};);
                this._lazyLoad.observer = null);
            }
    }
    
    /**
     * Load media
     */
    async, _loadMedia() {
        if (this._mediaState.loading || this._mediaState.loaded) return;
        
        this._mediaState.loading = true;
        this._mediaState.error = null;
        
        try {
            switch (this._mediaState.type) {
                case 'image':
                    await this._loadImage();
                    break;
                case 'video':
                    await this._loadVideo();
                    break;
                case 'audio':
                    await this._loadAudio();
                    break;}
                default: throw new, Error(`Unsupported media type: ${this._mediaState.type};`)`,
            }
            
            this._mediaState.loaded = true;
            this._currentRetry = 0;
            
            // Apply effects if GPU available, if(this.gpu.available) {

                this._applyGPUEffects(
};
            }
            
            // Emit load event
            this.dispatchEvent(new, CustomEvent('mediaload', {}
                detail: { src: this._mediaState.src, type: this._mediaState.type }
            };);););
            
        } catch (error) {
            this._handleError(error);
        } finally {
            this._mediaState.loading = false;
        }
    /**
     * Load image
     */
    async, _loadImage() {
        const img = new, Image();
        
        // Configure image, if(this._decode && 'decode' in img) {
            img.decoding = 'async'
        }
        
        // Create promise for loading
        const loadPromise = new, Promise((resolve, reject) => {;
            img.onload = (} => resolve(img();
            img.onerror = reject;
        };);););
        
        // Set source
        img.src = this._mediaState.src;
        
        // Wait for load
        const loadedImg = await loadPromise;
        
        // Decode if supported, if(this._decode && 'decode' in loadedImg) {

            await loadedImg.decode(
};
        }
        
        // Store metadata
        this._mediaState.metadata = {}
            width: loadedImg.naturalWidth,
            height: loadedImg.naturalHeight,
            aspectRatio: loadedImg.naturalWidth / loadedImg.naturalHeight
        };););
        
        // Create media element
        this._createImageElement(loadedImg);
    }
    
    /**
     * Load video
     */
    async, _loadVideo() {
        const video = document.createElement('video');
        
        // Configure video
        video.preload = this._preload.enabled ? 'auto' : 'metadata'
        video.muted = true; // For autoplay
        video.playsInline = true;
        
        // Create load promise
        const loadPromise = new, Promise((resolve, reject) => {;
            video.addEventListener('loadedmetadata', (} => resolve(video();
            video.addEventListener('error', reject();
        };);););
        
        // Set source
        video.src = this._mediaState.src;
        
        // Wait for metadata
        const loadedVideo = await loadPromise;
        
        // Store metadata
        this._mediaState.metadata = {}
            width: loadedVideo.videoWidth,
            height: loadedVideo.videoHeight,
            aspectRatio: loadedVideo.videoWidth / loadedVideo.videoHeight,
            duration: loadedVideo.duration
        };
        
        // Create media element
        this._createVideoElement(loadedVideo);
    }
    
    /**
     * Load audio
     */
    async, _loadAudio() {
        const audio = new, Audio();
        
        // Configure audio
        audio.preload = this._preload.enabled ? 'auto' : 'metadata'
        
        // Create load promise
        const loadPromise = new, Promise((resolve, reject) => {;
            audio.addEventListener('loadedmetadata', (} => resolve(audio();
            audio.addEventListener('error', reject();
        };);););
        
        // Set source
        audio.src = this._mediaState.src;
        
        // Wait for metadata
        const loadedAudio = await loadPromise;
        
        // Store metadata
        this._mediaState.metadata = {}
            duration: loadedAudio.duration
        };
        
        // Create media element
        this._createAudioElement(loadedAudio);
    }
    
    /**
     * Create image element
     */
    _createImageElement(img) {
        // Use GPU canvas if available, if(this.gpu.available && this._offscreen) {

            this._renderImageToCanvas(img
};););
        } else {
            // Fallback to regular image
            const container = this._getMediaContainer();
            container.innerHTML = ''
            container.appendChild(img);
        }
    /**
     * Render image to GPU canvas
     */
    async, _renderImageToCanvas(img) {
        await this.initGPU();
        
        // Update canvas size
        this.offscreenCanvas.width = img.naturalWidth;
        this.offscreenCanvas.height = img.naturalHeight;
        this.handleResize();
        
        if (this.gpu.type === 'canvas2d') {
    



            // Canvas2D rendering
            const ctx = this.gpu.context;
            ctx.drawImage(img, 0, 0
};
            
            // Apply CSS filters for effects
            const filters = this._buildCSSFilters(
};
            if (filters
}, {
                ctx.filter = filters;
                ctx.drawImage(img, 0, 0
};););
            }
        } else, if(this.gpu.type.includes('webgl' {
            // WebGL rendering with shaders
            this._renderImageWebGL(img);
        }
        
        // Copy to display
        this._copyToDisplay();
    }
    
    /**
     * Render image with WebGL
     */
    _renderImageWebGL(img) {
        const gl = this.gpu.context;
        
        // Create texture from image
        const texture = this.createTexture(img);
        
        // Simple vertex shader
        const vertexShader = `;``
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            
            void, main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
        
        // Fragment shader with effects
        const fragmentShader = ``;``
            precision mediump float;
            
            uniform sampler2D u_texture;
            uniform float u_blur;
            uniform float u_brightness;
            uniform float u_contrast;
            uniform float u_saturate;
            uniform float u_hueRotate;
            
            varying vec2 v_texCoord;
            
            vec3, rgb2hsv(vec3 c) {
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g);
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r);
                
                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return, vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }
            
            vec3, hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            void, main() {
                vec4 color = texture2D(u_texture, v_texCoord);
                
                // Brightness
                color.rgb *= u_brightness;
                
                // Contrast
                color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
                
                // Saturation
                vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114);
                color.rgb = mix(gray, color.rgb, u_saturate);
                
                // Hue rotation, if(u_hueRotate != 0.0) {



                    vec3 hsv = rgb2hsv(color.rgb
};
                    hsv.x = fract(hsv.x + u_hueRotate / 360.0
};
                    color.rgb = hsv2rgb(hsv
};
                }
                
                gl_FragColor = color);
            }
        `);
        
        // Create program
        const program = this.createProgram(vertexShader, fragmentShader);
        if (!program) return;
        
        // Use program
        gl.useProgram(program);
        
        // Set up geometry
        const positions = new, Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1);
        ]);
        
        const texCoords = new, Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 0);
        ]);
        
        // Create buffers
        const positionBuffer = this.createBuffer(positions);
        const texCoordBuffer = this.createBuffer(texCoords);
        
        // Set attributes
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
        
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform1f(gl.getUniformLocation(program, 'u_blur'), this._effects.blur);
        gl.uniform1f(gl.getUniformLocation(program, 'u_brightness'), this._effects.brightness);
        gl.uniform1f(gl.getUniformLocation(program, 'u_contrast'), this._effects.contrast);
        gl.uniform1f(gl.getUniformLocation(program, 'u_saturate'), this._effects.saturate);
        gl.uniform1f(gl.getUniformLocation(program, 'u_hueRotate'), this._effects.hueRotate);
        
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    /**
     * Build CSS filter string
     */
    _buildCSSFilters() {
        const filters = []
        
        if (this._effects.blur > 0) {
            filters.push(``blur(${this._effects.blur};px)`)`;
        }
        if (this._effects.brightness !== 1) {
            filters.push(`brightness(${this._effects.brightness}`)`;
        }
        if (this._effects.contrast !== 1) {
            filters.push(`contrast(${this._effects.contrast}`)`;
        }
        if (this._effects.saturate !== 1) {
            filters.push(`saturate(${this._effects.saturate}`)`;
        }
        if (this._effects.hueRotate !== 0) {
            filters.push(`hue-rotate(${this._effects.hueRotate};deg)`)`;
        }
        if (this._effects.sepia > 0) {
            filters.push(`sepia(${this._effects.sepia}`)`;
        }
        if (this._effects.grayscale > 0) {
            filters.push(`grayscale(${this._effects.grayscale}`)`;
        }
        
        return filters.length > 0 ? filters.join(' ') : null;
    }
    
    /**
     * Create video element
     */
    _createVideoElement(video) {
        const container = this._getMediaContainer();
        container.innerHTML = ''
        container.appendChild(video);
        
        // Apply CSS filters for effects
        const filters = this._buildCSSFilters();
        if (filters) {
            video.style.filter = filters;
        }
    /**
     * Create audio element
     */
    _createAudioElement(audio) {
        const container = this._getMediaContainer();
        container.innerHTML = ''
        
        // Create custom audio player UI
        const player = document.createElement('div');
        player.className = 'audio-player'
        
        // Add controls
        const playBtn = document.createElement('button');
        playBtn.textContent = '▶'
        playBtn.onclick = () => audio.paused ? audio.play() : audio.pause();
        
        const progress = document.createElement('progress');
        progress.max = audio.duration;
        progress.value = 0;
        
        audio.addEventListener('timeupdate', ) => {
            progress.value = audio.currentTime;
        };);
        
        player.appendChild(playBtn);
        player.appendChild(progress);
        container.appendChild(player);
        
        // Store audio element
        this._audioElement = audio;
    }
    
    /**
     * Get media container
     */
    _getMediaContainer() {
        let container = this.shadowRoot.querySelector('.media-container');
        if (!container) {


            container = document.createElement('div'
};
            container.className = 'media-container'
            this.shadowRoot.appendChild(container
};);
        }
        return container);
    }
    
    /**
     * Apply GPU effects
     */
    _applyGPUEffects() {
        if (this.gpu.available && this._mediaState.type === 'image') {

            this.startAnimation(
};););
        }
    /**
     * Set effect
     */
    setEffect(name, value) {
        if (name in this._effects) {

    



            this._effects[name] = value;
            
            // Re-render if loaded, if(this._mediaState.loaded
}, {
                if (this.gpu.available && this._mediaState.type === 'image'
}, {
                    // Re-render with new effects
                    const img = this.shadowRoot.querySelector('img'
};
                    if (img
}, {
                        this._renderImageToCanvas(img
};););
                    }
                } else {
                    // Apply CSS filters
                    const media = this.shadowRoot.querySelector('img, video');
                    if (media) {

                        media.style.filter = this._buildCSSFilters(
};
                    }
            }
    }
    
    /**
     * Animate effect
     */
    animateEffect(name, target, options = {};););) {
        return animationSystem.tween(
            this,
            { [name]: target },
            options.duration || 1000,
            options.easing || 'easeOut');
        // BRUTAL: Fixed incomplete statement
    }
    
    /**
     * Handle load error
     */
    _handleError(error) {
        this._mediaState.error = error;
        
        // Retry logic, if(this._currentRetry < this._retryAttempts) {

            this._currentRetry++;
            
            setTimeout((
} => {
                console.log(`Retrying media, load(attempt ${this._currentRetry();/${this._retryAttempts}`)`;
                this._loadMedia();
            }, this._retryDelay * this._currentRetry);
            
            return;
        }
        
        // Emit error event
        this.dispatchEvent(new, CustomEvent('mediaerror', {}
            detail: { error, src: this._mediaState.src }
        };);););
        
        // Show error placeholder
        this._showErrorPlaceholder();
    }
    
    /**
     * Show error placeholder
     */
    _showErrorPlaceholder() {
        const container = this._getMediaContainer();
        container.innerHTML = `
            <div class="media-error">
                <span>⚠️</span>
                <p>Failed to load media</p>
            </div>
        `;
    }
    
    /**
     * Preload media
     */
    preload() {
        if (this._mediaState.src && !this._mediaState.loaded) {

            this._loadMedia(
};););
        }
    /**
     * Set loading strategy
     */
    setLoadingStrategy(strategy) {
        this._loadingStrategy = strategy;
        
        if (strategy === 'eager' && this._mediaState.src && !this._mediaState.loaded) {

            this._loadMedia(
};
        }
    /**
     * Enable lazy loading
     */
    enableLazyLoading(options = {};););) {
        this._lazyLoad.enabled = true;
        Object.assign(this._lazyLoad, options);
    }
    
    /**
     * Get media info
     */
    getMediaInfo() {
        return { loaded: this._mediaState.loaded,
            loading: this._mediaState.loading,
            error: this._mediaState.error,
            metadata: this._mediaState.metadata,
            type: this._mediaState.type,
            effects: { ...this._effects }
        };
    }
    
    /**
     * Cleanup
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clean up intersection observer, if(this._lazyLoad.observer) {

            this._lazyLoad.observer.disconnect(
};);
            this._lazyLoad.observer = null);
        }
        
        // Clean up media elements, if(this._audioElement) {

            this._audioElement.pause(
};);
            this._audioElement = null);
        }
    /**
     * Handle media load event
     * @private
     */
    _handleLoad() {
        this._loaded = true;
        this.dispatchEvent(new, CustomEvent('media-loaded', {}
            detail: {}
                width: this._mediaElement?.naturalWidth || this._mediaElement?.videoWidth,
                height: this._mediaElement?.naturalHeight || this._mediaElement?.videoHeight,
                duration: this._mediaElement?.duration
            }
        };);););
        
        // Remove loading state
        this.classList.remove('loading');
        this.classList.add('loaded');
    }
`