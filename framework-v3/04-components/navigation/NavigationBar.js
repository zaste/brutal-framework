/**
 * BRUTAL NavigationBar Component
 * Features:
 * - GPU-accelerated animations
 * - Smooth transitions with WebGL shaders
 * - Mobile-responsive with gesture support
 * - Automatic active state detection
 * - Sticky behavior with performance optimization
 */

import { BrutalComponent } from '../base/BrutalComponent.js';
// GPU effects will be initialized lazily

export class NavigationBar extends BrutalComponent {
  constructor() {
    super();
    
    // Configuration
    this.sticky = true;
    this.transparent = false;
    this.breakpoint = 768;
    
    // State
    this._scrollY = 0;
    this._isSticky = false;
    this._isMobileOpen = false;
    this._activeItem = null;
    
    // GPU effects
    this._gpuEffects = null;
    this._rippleProgram = null;
    this._glowProgram = null;
    
    // Touch handling
    this._touchStartX = 0;
    this._touchEndX = 0;
    
    // Performance optimization
    this._rafId = null;
    this._lastUpdate = 0;
    this._updateThreshold = 16; // 60fps
  }
  
  static get observedAttributes() {
    return ['sticky', 'transparent', 'breakpoint', 'logo', 'brand'];
  }
  
  async connectedCallback() {
    await super.connectedCallback();
    
    // Initialize GPU effects
    await this._initGPUEffects();
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Check initial state
    this._checkSticky();
    this._detectActiveItem();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Clean up
    this._cleanupEventListeners();
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    if (this._gpuEffects) {
      this._gpuEffects.destroy();
    }
  }
  
  /**
   * Initialize GPU effects
   */
  async _initGPUEffects() {
    try {
      const canvas = this.querySelector('.navbar-canvas');
      if (!canvas) return;
      
      // Try WebGL2 first, fallback to WebGL
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        return;
      }
      
      // Store context
      this._gl = gl;
      this._canvas = canvas;
      
      // Initialize shaders
      this._rippleProgram = this._createRippleProgram(gl);
      this._glowProgram = this._createGlowProgram(gl);
      
      // Create vertex buffer for full-screen quad
      const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ]);
      
      this._vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      // Initialize ripple data
      this._ripples = [];
      this._maxRipples = 10;
      
      // Start render loop
      this._gpuEffects = {
        active: true,
        destroy: () => {
          this._gpuEffects.active = false;
          if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
          }
          
          // Clean up WebGL resources
          if (gl && gl.getExtension('WEBGL_lose_context')) {
            gl.getExtension('WEBGL_lose_context').loseContext();
          }
        }
      };
      
      // Start animation
      this._animateGPUEffects();
      
    } catch (error) {
      this._gpuEffects = null;
    }
  }
  
  /**
   * Create ripple shader program
   */
  _createRippleProgram(gl) {
    const vertexShader = `
      attribute vec2 position;
      varying vec2 vUv;
      
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision highp float;
      
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 rippleOrigin[10];
      uniform float rippleTime[10];
      uniform float rippleStrength[10];
      uniform int rippleCount;
      
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        
        // Calculate ripple effects
        for (int i = 0; i < 10; i++) {
          if (i >= rippleCount) break;
          
          float t = rippleTime[i];
          if (t < 0.0) continue;
          
          vec2 origin = rippleOrigin[i];
          float dist = distance(uv, origin);
          
          // Ripple wave
          float wave = sin(dist * 30.0 - t * 6.0) * exp(-t * 2.0) * exp(-dist * 3.0);
          wave *= rippleStrength[i];
          
          // Add to color
          color += vec3(0.4, 0.6, 1.0) * wave * 0.5;
        }
        
        // Output with alpha
        gl_FragColor = vec4(color, length(color) * 0.8);
      }
    `;
    
    return this._compileProgram(gl, vertexShader, fragmentShader);
  }
  
  /**
   * Create glow shader program
   */
  _createGlowProgram(gl) {
    const vertexShader = `
      attribute vec2 position;
      varying vec2 vUv;
      
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision highp float;
      
      uniform float time;
      uniform vec2 resolution;
      uniform float scrollProgress;
      uniform vec3 glowColor;
      
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv;
        
        // Bottom edge glow
        float glow = 0.0;
        float edge = smoothstep(0.0, 0.02, uv.y) * (1.0 - smoothstep(0.02, 0.1, uv.y));
        
        // Animated glow
        float wave = sin(uv.x * 10.0 + time * 2.0) * 0.5 + 0.5;
        glow = edge * wave * scrollProgress;
        
        // Side edges
        float sideGlow = smoothstep(0.0, 0.05, uv.x) * (1.0 - smoothstep(0.95, 1.0, uv.x));
        glow += sideGlow * 0.3 * scrollProgress;
        
        vec3 color = glowColor * glow;
        gl_FragColor = vec4(color, glow * 0.6);
      }
    `;
    
    return this._compileProgram(gl, vertexShader, fragmentShader);
  }
  
  /**
   * Compile shader program
   */
  _compileProgram(gl, vsSource, fsSource) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      );
      return null;
    }
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      );
      return null;
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      );
      return null;
    }
    
    // Get uniform locations
    program.uniforms = {
      time: gl.getUniformLocation(program, 'time'),
      resolution: gl.getUniformLocation(program, 'resolution'),
      scrollProgress: gl.getUniformLocation(program, 'scrollProgress'),
      glowColor: gl.getUniformLocation(program, 'glowColor'),
      rippleOrigin: gl.getUniformLocation(program, 'rippleOrigin'),
      rippleTime: gl.getUniformLocation(program, 'rippleTime'),
      rippleStrength: gl.getUniformLocation(program, 'rippleStrength'),
      rippleCount: gl.getUniformLocation(program, 'rippleCount')
    };
    
    // Get attribute locations
    program.attributes = {
      position: gl.getAttribLocation(program, 'position')
    };
    
    return program;
  }
  
  /**
   * Animate GPU effects
   */
  _animateGPUEffects() {
    if (!this._gpuEffects || !this._gpuEffects.active) return;
    
    const gl = this._gl;
    const canvas = this._canvas;
    
    // Resize canvas if needed
    const rect = this.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    // Clear
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Update ripples
    const now = Date.now() / 1000;
    this._ripples = this._ripples.filter(r => now - r.startTime < 2);
    
    // Render ripples
    if (this._rippleProgram && this._ripples.length > 0) {
      gl.useProgram(this._rippleProgram);
      
      // Set uniforms
      gl.uniform1f(this._rippleProgram.uniforms.time, now);
      gl.uniform2f(this._rippleProgram.uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1i(this._rippleProgram.uniforms.rippleCount, this._ripples.length);
      
      // Set ripple data
      const origins = [];
      const times = [];
      const strengths = [];
      
      this._ripples.forEach(ripple => {
        origins.push(ripple.x, ripple.y);
        times.push(now - ripple.startTime);
        strengths.push(ripple.strength);
      });
      
      gl.uniform2fv(this._rippleProgram.uniforms.rippleOrigin, new Float32Array(origins));
      gl.uniform1fv(this._rippleProgram.uniforms.rippleTime, new Float32Array(times));
      gl.uniform1fv(this._rippleProgram.uniforms.rippleStrength, new Float32Array(strengths));
      
      // Draw
      this._drawQuad(gl, this._rippleProgram);
    }
    
    // Render glow effect
    if (this._glowProgram && this._state.get('scrolled')) {
      gl.useProgram(this._glowProgram);
      
      // Set uniforms
      gl.uniform1f(this._glowProgram.uniforms.time, now);
      gl.uniform2f(this._glowProgram.uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(this._glowProgram.uniforms.scrollProgress, this._state.get('scrollProgress') || 0);
      
      // Get theme color
      const glowColor = getComputedStyle(this).getPropertyValue('--primary-color') || '#667eea';
      const rgb = this._hexToRgb(glowColor);
      gl.uniform3f(this._glowProgram.uniforms.glowColor, rgb.r / 255, rgb.g / 255, rgb.b / 255);
      
      // Draw
      this._drawQuad(gl, this._glowProgram);
    }
    
    // Continue animation
    this._animationFrame = requestAnimationFrame(() => this._animateGPUEffects());
  }
  
  /**
   * Draw fullscreen quad
   */
  _drawQuad(gl, program) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.enableVertexAttribArray(program.attributes.position);
    gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  /**
   * Add ripple effect
   */
  _addRipple(x, y, strength = 1.0) {
    if (!this._gpuEffects || this._ripples.length >= this._maxRipples) return;
    
    const rect = this._canvas.getBoundingClientRect();
    this._ripples.push({
      x: x / rect.width,
      y: 1.0 - (y / rect.height),
      strength,
      startTime: Date.now() / 1000
    });
  }
  
  /**
   * Convert hex to RGB
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 102, g: 126, b: 234 };
  }
  
  /**
   * Component template
   */
  template() {
    const items = this._parseItems();
    
    return `
      <nav class="brutal-navbar ${this.sticky ? 'sticky' : ''} ${this.transparent ? 'transparent' : ''}" 
           role="navigation" 
           aria-label="Main navigation">
        
        <!-- GPU Canvas Layer -->
        <canvas class="navbar-canvas" aria-hidden="true"></canvas>
        
        <!-- Navigation Content -->
        <div class="navbar-container">
          
          <!-- Brand -->
          <div class="navbar-brand">
            ${this.logo ? `<img src="${this.logo}" alt="${this.brand || 'Logo'}" class="navbar-logo">` : ''}
            ${this.brand ? `<span class="navbar-title">${this.brand}</span>` : ''}
          </div>
          
          <!-- Mobile Toggle -->
          <button class="navbar-toggle" 
                  aria-label="Toggle navigation" 
                  aria-expanded="false"
                  aria-controls="navbar-menu">
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
          </button>
          
          <!-- Navigation Items -->
          <div class="navbar-menu" id="navbar-menu">
            <ul class="navbar-items" role="list">
              ${items.map(item => this._renderNavItem(item)).join('')}
            </ul>
            
            <!-- Actions Slot -->
            <div class="navbar-actions">
              <slot name="actions"></slot>
            </div>
          </div>
        </div>
        
        <!-- Mobile Overlay -->
        <div class="navbar-overlay" aria-hidden="true"></div>
      </nav>
    `;
  }
  
  /**
   * Component styles
   */
  styles() {
    return `
      :host {
        --navbar-height: 64px;
        --navbar-bg: rgba(255, 255, 255, 0.95);
        --navbar-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        --navbar-text: #333;
        --navbar-hover: #007bff;
        --navbar-active: #0056b3;
        --transition-speed: 0.3s;
        display: block;
        position: relative;
        z-index: 1000;
      }
      
      .brutal-navbar {
        position: relative;
        height: var(--navbar-height);
        background: var(--navbar-bg);
        backdrop-filter: blur(10px);
        transition: all var(--transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .brutal-navbar.sticky {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        box-shadow: var(--navbar-shadow);
      }
      
      .brutal-navbar.sticky.scrolled {
        --navbar-height: 56px;
      }
      
      .brutal-navbar.transparent {
        background: transparent;
        backdrop-filter: none;
      }
      
      .brutal-navbar.transparent:not(.scrolled) {
        --navbar-text: white;
        --navbar-shadow: none;
      }
      
      /* GPU Canvas */
      .navbar-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0.3;
      }
      
      /* Container */
      .navbar-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      /* Brand */
      .navbar-brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: bold;
        color: var(--navbar-text);
        text-decoration: none;
        transition: opacity var(--transition-speed);
      }
      
      .navbar-brand:hover {
        opacity: 0.8;
      }
      
      .navbar-logo {
        height: calc(var(--navbar-height) * 0.6);
        width: auto;
        transition: height var(--transition-speed);
      }
      
      .navbar-title {
        font-size: 1.25rem;
      }
      
      /* Mobile Toggle */
      .navbar-toggle {
        display: none;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        width: 32px;
        height: 32px;
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--navbar-text);
      }
      
      .toggle-line {
        display: block;
        width: 24px;
        height: 2px;
        background: currentColor;
        transition: all var(--transition-speed);
        transform-origin: center;
      }
      
      .navbar-toggle[aria-expanded="true"] .toggle-line:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      
      .navbar-toggle[aria-expanded="true"] .toggle-line:nth-child(2) {
        opacity: 0;
      }
      
      .navbar-toggle[aria-expanded="true"] .toggle-line:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
      }
      
      /* Menu */
      .navbar-menu {
        display: flex;
        align-items: center;
        gap: 2rem;
      }
      
      .navbar-items {
        display: flex;
        gap: 1.5rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      
      /* Nav Items */
      .navbar-item {
        position: relative;
      }
      
      .navbar-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 1rem;
        color: var(--navbar-text);
        text-decoration: none;
        font-weight: 500;
        transition: all var(--transition-speed);
        position: relative;
        overflow: hidden;
      }
      
      .navbar-link::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: var(--navbar-hover);
        transform: translateX(-50%);
        transition: width var(--transition-speed);
      }
      
      .navbar-link:hover {
        color: var(--navbar-hover);
      }
      
      .navbar-link:hover::before {
        width: 80%;
      }
      
      .navbar-link.active {
        color: var(--navbar-active);
      }
      
      .navbar-link.active::before {
        width: 80%;
        background: var(--navbar-active);
      }
      
      /* Dropdown */
      .navbar-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 200px;
        padding: 0.5rem 0;
        background: var(--navbar-bg);
        box-shadow: var(--navbar-shadow);
        border-radius: 4px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all var(--transition-speed);
      }
      
      .navbar-item:hover .navbar-dropdown,
      .navbar-item:focus-within .navbar-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      
      .dropdown-item {
        display: block;
        padding: 0.5rem 1rem;
        color: var(--navbar-text);
        text-decoration: none;
        transition: background var(--transition-speed);
      }
      
      .dropdown-item:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      
      /* Actions */
      .navbar-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      /* Mobile Styles */
      @media (max-width: 768px) {
        .navbar-toggle {
          display: flex;
        }
        
        .navbar-menu {
          position: fixed;
          top: var(--navbar-height);
          left: 0;
          right: 0;
          bottom: 0;
          flex-direction: column;
          justify-content: flex-start;
          padding: 2rem;
          background: var(--navbar-bg);
          transform: translateX(100%);
          transition: transform var(--transition-speed);
        }
        
        .navbar-menu.open {
          transform: translateX(0);
        }
        
        .navbar-items {
          flex-direction: column;
          width: 100%;
        }
        
        .navbar-link {
          width: 100%;
          padding: 1rem;
        }
        
        .navbar-dropdown {
          position: static;
          opacity: 1;
          visibility: visible;
          transform: none;
          box-shadow: none;
          background: rgba(0, 0, 0, 0.05);
        }
        
        .navbar-overlay {
          position: fixed;
          top: var(--navbar-height);
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          transition: all var(--transition-speed);
        }
        
        .navbar-overlay.active {
          opacity: 1;
          visibility: visible;
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        :host {
          --navbar-bg: rgba(30, 30, 30, 0.95);
          --navbar-text: #f0f0f0;
          --navbar-hover: #4dabf7;
          --navbar-active: #339af0;
        }
        
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    `;
  }
  
  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Scroll listener with throttling
    this._scrollHandler = this._throttle(() => {
      this._checkSticky();
    }, this._updateThreshold);
    
    window.addEventListener('scroll', this._scrollHandler, { passive: true });
    
    // Resize listener
    this._resizeHandler = this._debounce(() => {
      this._handleResize();
    }, 250);
    
    window.addEventListener('resize', this._resizeHandler);
    
    // Mobile toggle
    const toggle = this.shadowRoot.querySelector('.navbar-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        this._toggleMobile();
        if (this._gpuEffects) {
          const rect = toggle.getBoundingClientRect();
          this._addRipple(rect.x + rect.width / 2, rect.y + rect.height / 2, 0.8);
        }
      });
    }
    
    // Touch gestures for mobile
    const menu = this.shadowRoot.querySelector('.navbar-menu');
    if (menu) {
      menu.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: true });
      menu.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: true });
    }
    
    // Route change detection
    window.addEventListener('popstate', () => this._detectActiveItem());
    
    // Overlay click
    const overlay = this.shadowRoot.querySelector('.navbar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this._closeMobile());
    }
  }
  
  /**
   * Cleanup event listeners
   */
  _cleanupEventListeners() {
    window.removeEventListener('scroll', this._scrollHandler);
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('popstate', this._detectActiveItem);
  }
  
  /**
   * Check sticky state
   */
  _checkSticky() {
    if (!this.sticky) return;
    
    const scrollY = window.scrollY;
    const scrolled = scrollY > 50;
    
    if (scrolled !== this._isScrolled) {
      this._isScrolled = scrolled;
      const navbar = this.shadowRoot.querySelector('.brutal-navbar');
      if (navbar) {
        navbar.classList.toggle('scrolled', scrolled);
      }
      
      // Trigger GPU effect
      if (this._gpuEffects) {
        this._animateScrollEffect(scrolled);
      }
    }
    
    this._scrollY = scrollY;
  }
  
  /**
   * Detect active navigation item
   */
  _detectActiveItem() {
    const currentPath = window.location.pathname;
    const links = this.shadowRoot.querySelectorAll('.navbar-link');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === currentPath || 
                      (href !== '/' && currentPath.startsWith(href));
      
      link.classList.toggle('active', isActive);
      
      if (isActive && this._gpuEffects) {
        this._animateActiveItem(link);
      }
    });
  }
  
  /**
   * Toggle mobile menu
   */
  _toggleMobile() {
    this._isMobileOpen = !this._isMobileOpen;
    
    const toggle = this.shadowRoot.querySelector('.navbar-toggle');
    const menu = this.shadowRoot.querySelector('.navbar-menu');
    const overlay = this.shadowRoot.querySelector('.navbar-overlay');
    
    toggle.setAttribute('aria-expanded', this._isMobileOpen);
    menu.classList.toggle('open', this._isMobileOpen);
    overlay.classList.toggle('active', this._isMobileOpen);
    
    // Prevent body scroll when open
    document.body.style.overflow = this._isMobileOpen ? 'hidden' : '';
  }
  
  /**
   * Close mobile menu
   */
  _closeMobile() {
    if (this._isMobileOpen) {
      this._toggleMobile();
    }
  }
  
  /**
   * Handle touch start
   */
  _handleTouchStart(e) {
    this._touchStartX = e.touches[0].clientX;
  }
  
  /**
   * Handle touch end
   */
  _handleTouchEnd(e) {
    this._touchEndX = e.changedTouches[0].clientX;
    this._handleSwipe();
  }
  
  /**
   * Handle swipe gesture
   */
  _handleSwipe() {
    const swipeDistance = this._touchEndX - this._touchStartX;
    const threshold = 50;
    
    if (swipeDistance > threshold && this._isMobileOpen) {
      this._closeMobile();
    }
  }
  
  /**
   * Handle window resize
   */
  _handleResize() {
    if (window.innerWidth > this.breakpoint && this._isMobileOpen) {
      this._closeMobile();
    }
    
    if (this._gpuEffects) {
      this._resizeCanvas();
    }
  }
  
  /**
   * Resize canvas
   */
  _resizeCanvas() {
    if (!this._gpuEffects) return;
    
    const canvas = this.shadowRoot.querySelector('.navbar-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
  }
  
  /**
   * Parse navigation items from children or attributes
   */
  _parseItems() {
    // Check for slotted items first
    const slot = this.querySelector('[slot="items"]');
    if (slot) {
      return Array.from(slot.children).map(child => ({
        label: child.textContent,
        href: child.getAttribute('href'),
        icon: child.getAttribute('icon'),
        children: this._parseDropdownItems(child)
      }));
    }
    
    // Fall back to items attribute
    const itemsAttr = this.getAttribute('items');
    if (itemsAttr) {
      try {
        return JSON.parse(itemsAttr);
      } catch (e) {
        }
    }
    
    // Default items
    return [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Contact', href: '/contact' }
    ];
  }
  
  /**
   * Parse dropdown items
   */
  _parseDropdownItems(element) {
    const dropdown = element.querySelector('ul');
    if (!dropdown) return null;
    
    return Array.from(dropdown.children).map(child => ({
      label: child.textContent,
      href: child.getAttribute('href')
    }));
  }
  
  /**
   * Render navigation item
   */
  _renderNavItem(item) {
    const hasDropdown = item.children && item.children.length > 0;
    
    return `
      <li class="navbar-item">
        <a href="${item.href}" class="navbar-link">
          ${item.icon ? `<i class="${item.icon}"></i>` : ''}
          <span>${item.label}</span>
          ${hasDropdown ? '<i class="dropdown-arrow"></i>' : ''}
        </a>
        ${hasDropdown ? this._renderDropdown(item.children) : ''}
      </li>
    `;
  }
  
  /**
   * Render dropdown menu
   */
  _renderDropdown(items) {
    return `
      <div class="navbar-dropdown">
        ${items.map(item => `
          <a href="${item.href}" class="dropdown-item">${item.label}</a>
        `).join('')}
      </div>
    `;
  }
  
  /**
   * GPU effect for scroll
   */
  _animateScrollEffect(scrolled) {
    if (!this._rippleProgram) return;
    
    this._rafId = requestAnimationFrame(() => {
      const time = performance.now() * 0.001;
      
      this._gpuEffects.useProgram(this._rippleProgram);
      this._gpuEffects.setUniform('uTime', time);
      this._gpuEffects.setUniform('uScrolled', scrolled ? 1.0 : 0.0);
      this._gpuEffects.draw();
    });
  }
  
  /**
   * GPU effect for active item
   */
  _animateActiveItem(element) {
    if (!this._glowProgram) return;
    
    const rect = element.getBoundingClientRect();
    const navRect = this.shadowRoot.querySelector('.brutal-navbar').getBoundingClientRect();
    
    const x = (rect.left - navRect.left + rect.width / 2) / navRect.width;
    const y = (rect.top - navRect.top + rect.height / 2) / navRect.height;
    
    this._gpuEffects.useProgram(this._glowProgram);
    this._gpuEffects.setUniform('uCenter', [x, y]);
    this._gpuEffects.setUniform('uIntensity', 1.0);
    this._gpuEffects.draw();
  }
  
  /**
   * Get ripple vertex shader
   */
  _getRippleVertexShader() {
    return `
      attribute vec2 position;
      varying vec2 vUv;
      
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
  }
  
  /**
   * Get ripple fragment shader
   */
  _getRippleFragmentShader() {
    return `
      precision mediump float;
      
      uniform float uTime;
      uniform float uScrolled;
      varying vec2 vUv;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        
        float wave = sin(dist * 10.0 - uTime * 2.0) * 0.5 + 0.5;
        wave *= smoothstep(0.5, 0.0, dist);
        wave *= uScrolled;
        
        gl_FragColor = vec4(0.0, 0.5, 1.0, wave * 0.3);
      }
    `;
  }
  
  /**
   * Get glow vertex shader
   */
  _getGlowVertexShader() {
    return `
      attribute vec2 position;
      varying vec2 vUv;
      
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
  }
  
  /**
   * Get glow fragment shader
   */
  _getGlowFragmentShader() {
    return `
      precision mediump float;
      
      uniform vec2 uCenter;
      uniform float uIntensity;
      varying vec2 vUv;
      
      void main() {
        float dist = distance(vUv, uCenter);
        float glow = exp(-dist * dist * 10.0) * uIntensity;
        
        gl_FragColor = vec4(0.2, 0.6, 1.0, glow * 0.5);
      }
    `;
  }
  
  /**
   * Throttle function
   */
  _throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Debounce function
   */
  _debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
}

// Register component
customElements.define('brutal-navbar', NavigationBar);