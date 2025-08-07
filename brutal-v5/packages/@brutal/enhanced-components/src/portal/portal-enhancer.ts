/**
 * Portal enhancer using composition pattern
 */

import type { BrutalComponent } from '@brutal/components';
import type { ComponentEnhancer } from '../compose.js';

/**
 * Enhancer that adds portal capabilities
 */
export function withPortal(defaultTarget = 'body'): ComponentEnhancer {
  return (Component: typeof BrutalComponent) => {
    return class extends Component {
      private targetElement?: Element;
      private portalContent?: DocumentFragment;
      private observer?: MutationObserver;

      protected init(): void {
        this.setupPortal();
        this.observeChanges();
      }

      private setupPortal(): void {
        const targetSelector = this.getAttribute('target') || defaultTarget;
        this.targetElement = document.querySelector(targetSelector) || document.body;
        
        if (!this.targetElement && targetSelector !== 'body') {
          // Create target if it doesn't exist
          const newTarget = document.createElement('div');
          newTarget.id = targetSelector.replace('#', '');
          document.body.appendChild(newTarget);
          this.targetElement = newTarget;
        }

        this.updatePortalContent();
      }

      private observeChanges(): void {
        this.observer = new MutationObserver(() => {
          this.updatePortalContent();
        });

        this.observer.observe(this, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['target']
        });
      }

      private updatePortalContent(): void {
        // Create new content
        const fragment = document.createDocumentFragment();
        
        // Clone and move children
        Array.from(this.childNodes).forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(true) as Element;
            // Preserve attributes except portal-specific ones
            Array.from(this.attributes).forEach(attr => {
              if (!['target', 'portal'].includes(attr.name)) {
                clone.setAttribute(attr.name, attr.value);
              }
            });
            clone.setAttribute('data-portal', 'true');
            fragment.appendChild(clone);
          } else {
            fragment.appendChild(node.cloneNode(true));
          }
        });

        // Clear old content and add new
        if (this.targetElement) {
          // Remove previous portal content
          this.targetElement.querySelectorAll('[data-portal="true"]').forEach(el => {
            if (el.getAttribute('data-portal-id') === this.id) {
              el.remove();
            }
          });

          // Add portal ID to track content
          fragment.childNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              (node as Element).setAttribute('data-portal-id', this.id || '');
            }
          });

          this.targetElement.appendChild(fragment);
        }

        this.portalContent = fragment;
      }

      disconnectedCallback(): void {
        // Clean up portal content
        if (this.targetElement) {
          this.targetElement.querySelectorAll('[data-portal="true"]').forEach(el => {
            if (el.getAttribute('data-portal-id') === this.id) {
              el.remove();
            }
          });
        }

        this.observer?.disconnect();
        super.disconnectedCallback?.();
      }

      // Override to handle attribute changes
      attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (name === 'target' && oldValue !== newValue) {
          this.setupPortal();
        }
        super.attributeChangedCallback?.(name, oldValue, newValue);
      }

      static get observedAttributes(): string[] {
        return ['target', ...(super.observedAttributes || [])];
      }
    };
  };
}