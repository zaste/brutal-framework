import { Page } from '@playwright/test';

export async function setupEnhancedComponents(page: Page) {
  await page.goto('/test.html');
  
  // Wait for modules to load
  await page.waitForFunction(() => window.BrutalEnhanced !== undefined);
  
  // Register all custom elements
  await page.evaluate(() => {
    const { Portal, LazyComponent, VisibilityTracker, ObserverComponent, AsyncComponent } = (window as any).BrutalEnhanced;
    
    // Register components if not already registered
    if (!customElements.get('brutal-portal')) {
      customElements.define('brutal-portal', Portal);
    }
    if (!customElements.get('brutal-lazy')) {
      customElements.define('brutal-lazy', LazyComponent);
    }
    if (!customElements.get('brutal-visibility')) {
      customElements.define('brutal-visibility', VisibilityTracker);
    }
    if (!customElements.get('brutal-observer')) {
      customElements.define('brutal-observer', ObserverComponent);
    }
    if (!customElements.get('brutal-async')) {
      customElements.define('brutal-async', AsyncComponent);
    }
    
    console.log('Enhanced components registered');
  });
}