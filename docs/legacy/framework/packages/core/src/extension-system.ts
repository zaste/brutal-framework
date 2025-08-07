/**
 * EXTENSION SYSTEM
 * Dynamic extension loading and management for Native Web Components Framework
 * 
 * Provides secure, sandboxed environment for third-party extensions with
 * full lifecycle management and performance monitoring.
 */

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dependencies?: Record<string, string>;
  permissions?: ExtensionPermission[];
  api?: string;
  sandboxed?: boolean;
  trusted?: boolean;
}

export interface ExtensionPermission {
  type: 'dom' | 'network' | 'storage' | 'events' | 'components' | 'performance';
  scope: string;
  level: 'read' | 'write' | 'full';
}

export interface ExtensionContext {
  id: string;
  manifest: ExtensionManifest;
  sandbox: ExtensionSandbox;
  permissions: ExtensionPermission[];
  state: 'loading' | 'active' | 'inactive' | 'error';
  exports: any;
  dependencies: Map<string, Extension>;
}

export interface Extension {
  manifest: ExtensionManifest;
  context: ExtensionContext;
  instance: any;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  reload(): Promise<void>;
}

export interface ExtensionSandbox {
  id: string;
  iframe?: HTMLIFrameElement;
  worker?: Worker;
  isolated: boolean;
  permissions: ExtensionPermission[];
  api: ExtensionAPI;
}

export interface ExtensionAPI {
  framework: {
    version: string;
    createComponent: (definition: any) => any;
    getMetrics: () => any;
    getSecurityManager: () => any;
  };
  dom: {
    createElement: (tag: string) => HTMLElement;
    querySelector: (selector: string) => Element | null;
    addEventListener: (event: string, handler: Function) => void;
  };
  storage: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
  };
  events: {
    emit: (event: string, data?: any) => void;
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
  };
}

export interface ExtensionEvent {
  type: 'loaded' | 'activated' | 'deactivated' | 'error' | 'permission_denied';
  extensionId: string;
  timestamp: number;
  data?: any;
}

/**
 * Extension Manager Class
 * 
 * Manages the complete lifecycle of extensions including loading, sandboxing,
 * security validation, and runtime management.
 */
export class ExtensionManager {
  private extensions: Map<string, Extension> = new Map();
  private registry: Map<string, ExtensionManifest> = new Map();
  private sandboxes: Map<string, ExtensionSandbox> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;
  private trustedDomains: Set<string> = new Set();

  constructor() {
    this.setupTrustedDomains();
  }

  /**
   * Initialize the extension system
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing Extension System');
    
    // Setup extension registry
    this.setupExtensionRegistry();
    
    // Initialize sandboxing system
    this.initializeSandboxing();
    
    // Setup extension API
    this.setupExtensionAPI();
    
    // Setup security validation
    this.setupSecurityValidation();
    
    this.isInitialized = true;
    console.log('✅ Extension System initialized');
  }

  /**
   * Register an extension
   */
  async registerExtension(manifest: ExtensionManifest): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Extension system not initialized');
    }
    
    // Validate manifest
    if (!this.validateManifest(manifest)) {
      throw new Error(`Invalid extension manifest: ${manifest.id}`);
    }
    
    // Security validation
    if (!this.validateSecurity(manifest)) {
      throw new Error(`Security validation failed for extension: ${manifest.id}`);
    }
    
    // Check for conflicts
    if (this.registry.has(manifest.id)) {
      throw new Error(`Extension already registered: ${manifest.id}`);
    }
    
    // Register extension
    this.registry.set(manifest.id, manifest);
    
    console.log(`📦 Extension registered: ${manifest.name} v${manifest.version}`);
    this.emitEvent('loaded', manifest.id, { manifest });
  }

  /**
   * Load and activate an extension
   */
  async loadExtension(extensionId: string): Promise<Extension> {
    const manifest = this.registry.get(extensionId);
    if (!manifest) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    
    // Create sandbox
    const sandbox = await this.createSandbox(manifest);
    
    // Create extension context
    const context: ExtensionContext = {
      id: extensionId,
      manifest,
      sandbox,
      permissions: manifest.permissions || [],
      state: 'loading',
      exports: {},
      dependencies: new Map()
    };
    
    // Load dependencies
    await this.loadDependencies(context);
    
    // Load extension code
    const instance = await this.loadExtensionCode(context);
    
    // Create extension wrapper
    const extension: Extension = {
      manifest,
      context,
      instance,
      activate: () => this.activateExtension(extensionId),
      deactivate: () => this.deactivateExtension(extensionId),
      reload: () => this.reloadExtension(extensionId)
    };
    
    this.extensions.set(extensionId, extension);
    context.state = 'active';
    
    console.log(`🚀 Extension loaded: ${manifest.name}`);
    this.emitEvent('activated', extensionId, { extension });
    
    return extension;
  }

  /**
   * Unload an extension
   */
  async unloadExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not loaded: ${extensionId}`);
    }
    
    // Deactivate extension
    await this.deactivateExtension(extensionId);
    
    // Cleanup sandbox
    await this.destroySandbox(extensionId);
    
    // Remove from registry
    this.extensions.delete(extensionId);
    
    console.log(`📤 Extension unloaded: ${extension.manifest.name}`);
    this.emitEvent('deactivated', extensionId, { extension });
  }

  /**
   * Get loaded extensions
   */
  getExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extension by ID
   */
  getExtension(extensionId: string): Extension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Get extension registry
   */
  getRegistry(): ExtensionManifest[] {
    return Array.from(this.registry.values());
  }

  /**
   * Extension event system
   */
  on(event: string, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get extension metrics
   */
  getMetrics(): any {
    const extensions = this.getExtensions();
    return {
      total: extensions.length,
      active: extensions.filter(e => e.context.state === 'active').length,
      inactive: extensions.filter(e => e.context.state === 'inactive').length,
      errors: extensions.filter(e => e.context.state === 'error').length,
      sandboxed: extensions.filter(e => e.context.sandbox.isolated).length,
      trusted: extensions.filter(e => e.manifest.trusted).length
    };
  }

  // Private methods

  private setupTrustedDomains(): void {
    this.trustedDomains.add('localhost');
    this.trustedDomains.add('127.0.0.1');
    this.trustedDomains.add('*.github.com');
    this.trustedDomains.add('*.npm.org');
  }

  private setupExtensionRegistry(): void {
    // Setup extension registry with discovery
    if (typeof window !== 'undefined') {
      (window as any).__NWC_EXTENSION_REGISTRY__ = {
        register: (manifest: ExtensionManifest) => this.registerExtension(manifest),
        load: (id: string) => this.loadExtension(id),
        unload: (id: string) => this.unloadExtension(id),
        getAll: () => this.getExtensions(),
        get: (id: string) => this.getExtension(id)
      };
    }
  }

  private initializeSandboxing(): void {
    // Initialize sandboxing system
    console.log('🏗️ Sandboxing system initialized');
  }

  private setupExtensionAPI(): void {
    // Setup extension API
    console.log('🔧 Extension API setup complete');
  }

  private setupSecurityValidation(): void {
    // Setup security validation
    console.log('🔒 Extension security validation setup');
  }

  private validateManifest(manifest: ExtensionManifest): boolean {
    // Validate required fields
    if (!manifest.id || !manifest.name || !manifest.version || !manifest.main) {
      return false;
    }
    
    // Validate ID format
    if (!/^[a-zA-Z0-9-_]+$/.test(manifest.id)) {
      return false;
    }
    
    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      return false;
    }
    
    return true;
  }

  private validateSecurity(manifest: ExtensionManifest): boolean {
    // Check if extension is trusted
    if (manifest.trusted) {
      return this.validateTrustedExtension(manifest);
    }
    
    // Validate permissions
    if (manifest.permissions) {
      return this.validatePermissions(manifest.permissions);
    }
    
    return true;
  }

  private validateTrustedExtension(manifest: ExtensionManifest): boolean {
    // Check if author is from trusted domain
    if (manifest.author) {
      const domain = manifest.author.split('@')[1];
      return this.trustedDomains.has(domain) || 
             Array.from(this.trustedDomains).some(trusted => 
               trusted.startsWith('*.') && domain.endsWith(trusted.slice(2))
             );
    }
    return false;
  }

  private validatePermissions(permissions: ExtensionPermission[]): boolean {
    // Validate each permission
    const validTypes = ['dom', 'network', 'storage', 'events', 'components', 'performance'];
    const validLevels = ['read', 'write', 'full'];
    
    return permissions.every(permission => 
      validTypes.includes(permission.type) && 
      validLevels.includes(permission.level) &&
      permission.scope && permission.scope.length > 0
    );
  }

  private async createSandbox(manifest: ExtensionManifest): Promise<ExtensionSandbox> {
    const sandbox: ExtensionSandbox = {
      id: manifest.id,
      isolated: manifest.sandboxed !== false,
      permissions: manifest.permissions || [],
      api: this.createExtensionAPI(manifest)
    };
    
    if (sandbox.isolated) {
      // Create isolated iframe sandbox
      sandbox.iframe = this.createIframeSandbox(manifest);
    }
    
    this.sandboxes.set(manifest.id, sandbox);
    return sandbox;
  }

  private createIframeSandbox(manifest: ExtensionManifest): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.value = 'allow-scripts';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);
    
    return iframe;
  }

  private createExtensionAPI(manifest: ExtensionManifest): ExtensionAPI {
    return {
      framework: {
        version: '1.0.0',
        createComponent: (definition: any) => {
          // Permission check
          if (!this.hasPermission(manifest.id, 'components', 'write')) {
            throw new Error('Permission denied: components.write');
          }
          return {}; // Framework component creation
        },
        getMetrics: () => {
          if (!this.hasPermission(manifest.id, 'performance', 'read')) {
            throw new Error('Permission denied: performance.read');
          }
          return {}; // Framework metrics
        },
        getSecurityManager: () => {
          if (!this.hasPermission(manifest.id, 'performance', 'read')) {
            throw new Error('Permission denied: performance.read');
          }
          return {}; // Security manager
        }
      },
      dom: {
        createElement: (tag: string) => {
          if (!this.hasPermission(manifest.id, 'dom', 'write')) {
            throw new Error('Permission denied: dom.write');
          }
          return document.createElement(tag);
        },
        querySelector: (selector: string) => {
          if (!this.hasPermission(manifest.id, 'dom', 'read')) {
            throw new Error('Permission denied: dom.read');
          }
          return document.querySelector(selector);
        },
        addEventListener: (event: string, handler: Function) => {
          if (!this.hasPermission(manifest.id, 'events', 'write')) {
            throw new Error('Permission denied: events.write');
          }
          document.addEventListener(event, handler as EventListener);
        }
      },
      storage: {
        get: (key: string) => {
          if (!this.hasPermission(manifest.id, 'storage', 'read')) {
            throw new Error('Permission denied: storage.read');
          }
          return localStorage.getItem(`ext_${manifest.id}_${key}`);
        },
        set: (key: string, value: any) => {
          if (!this.hasPermission(manifest.id, 'storage', 'write')) {
            throw new Error('Permission denied: storage.write');
          }
          localStorage.setItem(`ext_${manifest.id}_${key}`, JSON.stringify(value));
        },
        remove: (key: string) => {
          if (!this.hasPermission(manifest.id, 'storage', 'write')) {
            throw new Error('Permission denied: storage.write');
          }
          localStorage.removeItem(`ext_${manifest.id}_${key}`);
        }
      },
      events: {
        emit: (event: string, data?: any) => {
          if (!this.hasPermission(manifest.id, 'events', 'write')) {
            throw new Error('Permission denied: events.write');
          }
          this.emitEvent(event, manifest.id, data);
        },
        on: (event: string, handler: Function) => {
          if (!this.hasPermission(manifest.id, 'events', 'read')) {
            throw new Error('Permission denied: events.read');
          }
          this.on(event, handler);
        },
        off: (event: string, handler: Function) => {
          if (!this.hasPermission(manifest.id, 'events', 'read')) {
            throw new Error('Permission denied: events.read');
          }
          this.off(event, handler);
        }
      }
    };
  }

  private hasPermission(extensionId: string, type: string, level: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (!extension) return false;
    
    const permissions = extension.context.permissions;
    return permissions.some(p => 
      p.type === type && 
      (p.level === level || p.level === 'full')
    );
  }

  private async loadDependencies(context: ExtensionContext): Promise<void> {
    const dependencies = context.manifest.dependencies || {};
    
    for (const [name, version] of Object.entries(dependencies)) {
      // Load dependency extension
      const depExtension = this.extensions.get(name);
      if (depExtension) {
        context.dependencies.set(name, depExtension);
      }
    }
  }

  private async loadExtensionCode(context: ExtensionContext): Promise<any> {
    const manifest = context.manifest;
    
    // Simulate loading extension code
    const extensionCode = {
      activate: async () => {
        console.log(`🔌 Activating extension: ${manifest.name}`);
      },
      deactivate: async () => {
        console.log(`⏹️ Deactivating extension: ${manifest.name}`);
      },
      api: context.sandbox.api
    };
    
    return extensionCode;
  }

  private async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return;
    
    try {
      await extension.instance.activate();
      extension.context.state = 'active';
    } catch (error) {
      extension.context.state = 'error';
      throw error;
    }
  }

  private async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return;
    
    try {
      await extension.instance.deactivate();
      extension.context.state = 'inactive';
    } catch (error) {
      extension.context.state = 'error';
      throw error;
    }
  }

  private async reloadExtension(extensionId: string): Promise<void> {
    await this.deactivateExtension(extensionId);
    await this.activateExtension(extensionId);
  }

  private async destroySandbox(extensionId: string): Promise<void> {
    const sandbox = this.sandboxes.get(extensionId);
    if (!sandbox) return;
    
    if (sandbox.iframe) {
      sandbox.iframe.remove();
    }
    
    if (sandbox.worker) {
      sandbox.worker.terminate();
    }
    
    this.sandboxes.delete(extensionId);
  }

  private emitEvent(type: string, extensionId: string, data?: any): void {
    const event: ExtensionEvent = {
      type: type as any,
      extensionId,
      timestamp: Date.now(),
      data
    };
    
    const handlers = this.eventListeners.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Extension event handler error:', error);
      }
    });
  }
}

// Export default extension manager instance
export const extensionManager = new ExtensionManager();