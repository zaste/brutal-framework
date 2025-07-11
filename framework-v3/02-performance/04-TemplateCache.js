/**
 * BRUTAL Framework V3 - Performance Gem #4: TemplateCache
 * Content-addressable template caching with SHA-256
 */

export class TemplateCache {
  constructor(options = {}) {
    // Configuration
    this.maxSize = options.maxSize || 1000;
    this.maxAge = options.maxAge || 3600000; // 1 hour default
    this.enableCompression = options.compression !== false;
    this.enablePrecompile = options.precompile !== false;
    
    // Storage
    this.cache = new Map();
    this.accessOrder = new Map(); // For LRU
    this.compiledTemplates = new Map();
    this.hashCache = new Map(); // Template string -> hash
    
    // Performance metrics
    this._metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compilations: 0,
      totalCompileTime: 0,
      totalHashTime: 0,
      hashComputations: 0
    };
    
    // Crypto availability
    this.cryptoAvailable = typeof crypto !== 'undefined' && crypto.subtle;
  }
  
  /**
   * Get or create template from string
   */
  async get(templateString, options = {}) {
    const start = performance.now();
    
    // Get hash
    const hash = await this._getHash(templateString);
    
    // Check cache
    const cached = this.cache.get(hash);
    
    if (cached && !this._isExpired(cached)) {
      // Update access time
      cached.lastAccess = Date.now();
      this.accessOrder.delete(hash);
      this.accessOrder.set(hash, cached.lastAccess);
      
      this._metrics.hits++;
      
      return cached.template;
    }
    
    this._metrics.misses++;
    
    // Create new template
    const template = await this._createTemplate(templateString, options);
    
    // Store in cache
    this._store(hash, template, templateString);
    
    return template;
  }
  
  /**
   * Precompile a template
   */
  async precompile(templateString, name) {
    const hash = await this._getHash(templateString);
    const template = await this._createTemplate(templateString, { precompile: true });
    
    this._store(hash, template, templateString);
    
    if (name) {
      this.compiledTemplates.set(name, hash);
    }
    
    return hash;
  }
  
  /**
   * Get precompiled template by name
   */
  getPrecompiled(name) {
    const hash = this.compiledTemplates.get(name);
    if (!hash) return null;
    
    const cached = this.cache.get(hash);
    return cached ? cached.template : null;
  }
  
  /**
   * Batch precompile templates
   */
  async precompileAll(templates) {
    const promises = [];
    
    for (const [name, templateString] of Object.entries(templates)) {
      promises.push(this.precompile(templateString, name));
    }
    
    return Promise.all(promises);
  }
  
  /**
   * Create template element
   */
  async _createTemplate(templateString, options = {}) {
    const start = performance.now();
    
    // Create template element
    const template = document.createElement('template');
    
    // Process template string
    let processed = templateString;
    
    if (options.trim !== false) {
      processed = processed.trim();
    }
    
    if (this.enableCompression && options.compress !== false) {
      processed = this._compress(processed);
    }
    
    // Set content
    template.innerHTML = processed;
    
    // Precompile if enabled
    if (this.enablePrecompile || options.precompile) {
      this._precompileTemplate(template);
    }
    
    // Update metrics
    const compileTime = performance.now() - start;
    this._metrics.compilations++;
    this._metrics.totalCompileTime += compileTime;
    
    return template;
  }
  
  /**
   * Precompile template for faster cloning
   */
  _precompileTemplate(template) {
    // Force browser to parse the template
    const content = template.content;
    
    // Walk the tree to ensure full parsing
    const walker = document.createTreeWalker(
      content,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    
    while (walker.nextNode()) {
      // Access properties to warm up internal caches
      walker.currentNode.tagName;
      walker.currentNode.id;
      walker.currentNode.className;
    }
  }
  
  /**
   * Compress HTML string
   */
  _compress(html) {
    return html
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove whitespace between tags
      .replace(/>\s+</g, '><')
      // Collapse multiple spaces
      .replace(/\s+/g, ' ')
      // Remove whitespace around = in attributes
      .replace(/\s*=\s*/g, '=')
      .trim();
  }
  
  /**
   * Get hash of template string
   */
  async _getHash(str) {
    const hashStart = performance.now();
    
    // Check hash cache first
    if (this.hashCache.has(str)) {
      return this.hashCache.get(str);
    }
    
    let hash;
    
    if (this.cryptoAvailable) {
      // Use Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback to simple hash
      hash = this._simpleHash(str);
    }
    
    // Cache the hash
    this.hashCache.set(str, hash);
    
    // Update metrics
    const hashTime = performance.now() - hashStart;
    this._metrics.totalHashTime += hashTime;
    this._metrics.hashComputations++;
    
    return hash;
  }
  
  /**
   * Simple hash function fallback
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Store template in cache
   */
  _store(hash, template, originalString) {
    // Check capacity
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }
    
    const entry = {
      template,
      hash,
      created: Date.now(),
      lastAccess: Date.now(),
      size: originalString.length
    };
    
    this.cache.set(hash, entry);
    this.accessOrder.set(hash, entry.lastAccess);
  }
  
  /**
   * Check if cache entry is expired
   */
  _isExpired(entry) {
    if (this.maxAge === Infinity) return false;
    return Date.now() - entry.created > this.maxAge;
  }
  
  /**
   * Evict oldest entry (LRU)
   */
  _evictOldest() {
    let oldestHash = null;
    let oldestTime = Infinity;
    
    for (const [hash, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestHash = hash;
      }
    }
    
    if (oldestHash) {
      this.cache.delete(oldestHash);
      this.accessOrder.delete(oldestHash);
      this._metrics.evictions++;
    }
  }
  
  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.compiledTemplates.clear();
    this.hashCache.clear();
  }
  
  /**
   * Remove specific template
   */
  remove(templateString) {
    this._getHash(templateString).then(hash => {
      this.cache.delete(hash);
      this.accessOrder.delete(hash);
    });
  }
  
  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    const hitRate = this._metrics.hits + this._metrics.misses > 0
      ? this._metrics.hits / (this._metrics.hits + this._metrics.misses)
      : 0;
    
    return {
      ...this._metrics,
      hitRate,
      avgCompileTime: this._metrics.compilations > 0
        ? this._metrics.totalCompileTime / this._metrics.compilations
        : 0,
      avgHashTime: this._metrics.hashComputations > 0
        ? this._metrics.totalHashTime / this._metrics.hashComputations
        : 0,
      cacheSize: this.cache.size
    };
  }
  
  /**
   * Warm cache with templates
   */
  async warmup(templates) {
    const promises = [];
    
    for (const template of templates) {
      promises.push(this.get(template, { precompile: true }));
    }
    
    return Promise.all(promises);
  }
  
  /**
   * Create template factory
   */
  createFactory(templateString) {
    let cachedTemplate = null;
    
    return async () => {
      if (!cachedTemplate) {
        cachedTemplate = await this.get(templateString);
      }
      
      return cachedTemplate.content.cloneNode(true);
    };
  }
  
  /**
   * Template interpolation helper
   */
  interpolate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
}

// Create global template cache
export const templateCache = new TemplateCache({
  maxSize: 1000,
  maxAge: 3600000,
  compression: true,
  precompile: true
});

// Export convenience methods
export const getTemplate = templateCache.get.bind(templateCache);
export const precompileTemplate = templateCache.precompile.bind(templateCache);
export const createTemplateFactory = templateCache.createFactory.bind(templateCache);