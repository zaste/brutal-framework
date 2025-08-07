import { test, expect } from '@playwright/test';
import { setupEnhancedComponents } from './test-helpers';

test.describe('Debug Enhanced Components', () => {
  test('check components are loaded', async ({ page }) => {
    await setupEnhancedComponents(page);
    
    // Check what's available on window
    const components = await page.evaluate(() => {
      const enhanced = (window as any).BrutalEnhanced;
      return {
        hasEnhanced: !!enhanced,
        keys: enhanced ? Object.keys(enhanced) : [],
        hasAsyncComponent: enhanced ? !!enhanced.AsyncComponent : false,
        asyncComponentType: enhanced?.AsyncComponent ? typeof enhanced.AsyncComponent : 'undefined',
        isClass: enhanced?.AsyncComponent ? enhanced.AsyncComponent.toString().includes('class') : false
      };
    });
    
    console.log('Components loaded:', components);
    
    // Try to create a simple async component
    await page.evaluate(() => {
      // Simple test component
      class TestComponent extends (window as any).BrutalEnhanced.AsyncComponent {
        async loadData() {
          return { message: 'Test' };
        }
        
        renderContent(data: any) {
          return `<div class="test-content">${data.message}</div>`;
        }
      }
      
      customElements.define('test-debug', TestComponent);
      
      const el = document.createElement('test-debug');
      document.body.appendChild(el);
    });
    
    // Wait a bit
    await page.waitForTimeout(100);
    
    // Check the element
    const elementHTML = await page.locator('test-debug').innerHTML();
    console.log('Element HTML:', elementHTML);
    
    expect(components.hasEnhanced).toBe(true);
    expect(components.hasAsyncComponent).toBe(true);
  });
});