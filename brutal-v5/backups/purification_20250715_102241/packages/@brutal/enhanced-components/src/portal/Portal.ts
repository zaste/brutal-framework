/**
 * Portal component for rendering outside the DOM hierarchy
 * 
 * @deprecated Use withPortal enhancer for new code
 */

import { BrutalComponent } from '@brutal/components';
import { withPortal } from './portal-enhancer.js';
import { createEnhancedComponent } from '../compose.js';

export interface PortalOptions {
  /** Target container selector or element */
  target?: string | HTMLElement;
  /** Whether to append or replace content */
  append?: boolean;
  /** Clean up on disconnect */
  cleanup?: boolean;
}

/**
 * Portal component that renders content to a different DOM location
 */
export class Portal extends BrutalComponent {
  private targetElement?: HTMLElement;
  private portalContent?: HTMLElement;
  private observer?: MutationObserver;
  
  /** Portal options */
  options: PortalOptions = {
    target: document.body,
    append: true,
    cleanup: true
  };

  protected init(): void {
    // Get options from attributes
    const targetAttr = this.getAttribute('target');
    if (targetAttr) {
      this.options.target = targetAttr;
    }
    
    const appendAttr = this.getAttribute('append');
    if (appendAttr !== null) {
      this.options.append = appendAttr !== 'false';
    }
    
    const cleanupAttr = this.getAttribute('cleanup');
    if (cleanupAttr !== null) {
      this.options.cleanup = cleanupAttr !== 'false';
    }
    
    this.setupPortal();
  }

  private setupPortal(): void {
    // Find target element
    this.targetElement = this.resolveTarget();
    
    if (!this.targetElement) {
      console.error('Portal target not found:', this.options.target);
      return;
    }
    
    // Create portal content container
    this.portalContent = document.createElement('div');
    this.portalContent.setAttribute('data-portal', this.id || 'true');
    
    // Set up mutation observer to sync content
    this.observer = new MutationObserver(() => {
      this.syncContent();
    });
    
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
    
    // Initial render
    this.render();
  }

  private resolveTarget(): HTMLElement {
    const { target } = this.options;
    
    if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (element instanceof HTMLElement) {
        return element;
      }
      // If not found, create element with that ID
      if (target.startsWith('#')) {
        const id = target.slice(1);
        const newElement = document.createElement('div');
        newElement.id = id;
        document.body.appendChild(newElement);
        return newElement;
      }
    } else if (target instanceof HTMLElement) {
      return target;
    }
    
    return document.body;
  }

  private syncContent(): void {
    if (!this.portalContent) return;
    
    // Clear existing content
    this.portalContent.innerHTML = '';
    
    // Clone and append all child nodes
    Array.from(this.childNodes).forEach(node => {
      const clone = node.cloneNode(true);
      this.portalContent!.appendChild(clone);
    });
    
    // Copy attributes except portal-specific ones
    Array.from(this.attributes).forEach(attr => {
      if (!['target', 'append', 'cleanup', 'id'].includes(attr.name)) {
        this.portalContent!.setAttribute(attr.name, attr.value);
      }
    });
  }

  protected render(): void {
    if (!this.targetElement || !this.portalContent) return;
    
    this.syncContent();
    
    if (this.options.append) {
      this.targetElement.appendChild(this.portalContent);
    } else {
      this.targetElement.innerHTML = '';
      this.targetElement.appendChild(this.portalContent);
    }
  }

  disconnectedCallback(): void {
    // Clean up observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clean up portal content
    if (this.options.cleanup && this.portalContent && this.portalContent.parentNode) {
      this.portalContent.parentNode.removeChild(this.portalContent);
    }
    
    super.disconnectedCallback?.();
  }

  /**
   * Update portal target dynamically
   */
  setTarget(newTarget: string | HTMLElement): void {
    // Remove from old target
    if (this.portalContent && this.portalContent.parentNode) {
      this.portalContent.parentNode.removeChild(this.portalContent);
    }
    
    // Update target
    this.options.target = newTarget;
    this.targetElement = this.resolveTarget();
    
    // Re-render to new target
    this.render();
  }

  /**
   * Get the portal content element
   */
  getPortalElement(): HTMLElement | undefined {
    return this.portalContent;
  }
}

/**
 * Create a portal programmatically
 */
export function createPortal(
  content: Node | string,
  options: PortalOptions = {}
): Portal {
  const portal = new Portal();
  Object.assign(portal.options, options);
  
  if (typeof content === 'string') {
    portal.innerHTML = content;
  } else {
    portal.appendChild(content);
  }
  
  // Initialize portal
  (portal as any).init();
  
  return portal;
}

/**
 * React-style portal hook for BRUTAL components
 */
export function usePortal(
  component: BrutalComponent,
  options: PortalOptions = {}
): {
  portal: Portal;
  render: (content: Node | string) => void;
  destroy: () => void;
} {
  const portal = new Portal();
  Object.assign(portal.options, options);
  
  // Auto-cleanup when component disconnects
  const originalDisconnected = component.disconnectedCallback?.bind(component);
  component.disconnectedCallback = () => {
    portal.disconnectedCallback();
    originalDisconnected?.();
  };
  
  return {
    portal,
    render: (content: Node | string) => {
      portal.innerHTML = '';
      if (typeof content === 'string') {
        portal.innerHTML = content;
      } else {
        portal.appendChild(content);
      }
      if (!portal.parentNode) {
        (portal as any).init();
      }
    },
    destroy: () => {
      portal.disconnectedCallback();
    }
  };
}