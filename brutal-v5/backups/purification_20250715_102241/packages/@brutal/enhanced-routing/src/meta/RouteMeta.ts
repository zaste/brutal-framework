/**
 * Route metadata management
 */

export interface MetaData {
  title?: string;
  description?: string;
  keywords?: string[];
  requiresAuth?: boolean;
  roles?: string[];
  [key: string]: any;
}

export class RouteMeta {
  private static metadata: Map<string, MetaData> = new Map();
  private static defaultMeta: MetaData = {};

  static setDefaultMeta(meta: MetaData): void {
    this.defaultMeta = { ...meta };
  }

  static setRouteMeta(path: string, meta: MetaData): void {
    this.metadata.set(path, { ...this.defaultMeta, ...meta });
  }

  static getRouteMeta(path: string): MetaData {
    return this.metadata.get(path) || { ...this.defaultMeta };
  }

  static updateRouteMeta(path: string, updates: Partial<MetaData>): void {
    const current = this.getRouteMeta(path);
    this.metadata.set(path, { ...current, ...updates });
  }

  static hasRouteMeta(path: string): boolean {
    return this.metadata.has(path);
  }

  static clearRouteMeta(path: string): void {
    this.metadata.delete(path);
  }

  static clearAllMeta(): void {
    this.metadata.clear();
  }

  static applyMetaToDom(meta: MetaData): void {
    // Update document title
    if (meta.title) {
      document.title = meta.title;
    }

    // Update meta description
    if (meta.description) {
      this.updateMetaTag('description', meta.description);
    }

    // Update meta keywords
    if (meta.keywords && meta.keywords.length > 0) {
      this.updateMetaTag('keywords', meta.keywords.join(', '));
    }

    // Emit custom event for other meta handlers
    window.dispatchEvent(new CustomEvent('route:meta:updated', {
      detail: meta
    }));
  }

  private static updateMetaTag(name: string, content: string): void {
    let metaTag = document.querySelector(`meta[name="${name}"]`);
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', name);
      document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
  }
}

// Helper functions for easier usage
export function setRouteMeta(path: string, meta: MetaData): void {
  RouteMeta.setRouteMeta(path, meta);
}

export function getRouteMeta(path: string): MetaData {
  return RouteMeta.getRouteMeta(path);
}