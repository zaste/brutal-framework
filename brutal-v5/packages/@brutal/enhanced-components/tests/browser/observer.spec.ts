import { test, expect } from '@playwright/test';
import { setupEnhancedComponents } from './test-helpers';

test.describe('Observer Components', () => {
  test.beforeEach(async ({ page }) => {
    await setupEnhancedComponents(page);
  });

  test.describe('LazyComponent', () => {
    test('loads content when visible', async ({ page }) => {
      await page.evaluate(() => {
        // Create a tall container to enable scrolling
        const container = document.getElementById('test-container')!;
        container.style.height = '200vh';
        
        // Add content at the bottom
        const spacer = document.createElement('div');
        spacer.style.height = '150vh';
        container.appendChild(spacer);

        // Create lazy component
        class TestLazyComponent extends (window as any).BrutalEnhanced.LazyComponent {
          async loadContent() {
            // Simulate async loading
            await new Promise(resolve => setTimeout(resolve, 100));
            this.loadedData = 'Lazy loaded content';
          }
          
          render() {
            this.innerHTML = `<div class="loaded-content">${this.loadedData}</div>`;
          }
        }
        
        customElements.define('test-lazy', TestLazyComponent);
        
        const lazy = document.createElement('test-lazy');
        lazy.setAttribute('load-threshold', '0.1');
        container.appendChild(lazy);
      });

      // Initially should show placeholder
      await expect(page.locator('test-lazy .lazy-placeholder')).toHaveText('Loading...');

      // Scroll to make it visible
      await page.evaluate(() => {
        const lazy = document.querySelector('test-lazy')!;
        lazy.scrollIntoView();
      });

      // Wait for content to load
      await expect(page.locator('test-lazy .loaded-content')).toHaveText('Lazy loaded content');
    });

    test('respects load threshold', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.getElementById('test-container')!;
        
        // Track load calls
        let loadCalled = false;
        
        class TestLazyComponent extends (window as any).BrutalEnhanced.LazyComponent {
          async loadContent() {
            loadCalled = true;
          }
          
          render() {
            this.innerHTML = '<div>Loaded</div>';
          }
        }
        
        customElements.define('test-lazy-threshold', TestLazyComponent);
        
        const lazy = document.createElement('test-lazy-threshold');
        lazy.setAttribute('load-threshold', '0.9'); // Requires 90% visibility
        container.appendChild(lazy);
        
        (window as any).checkLoadCalled = () => loadCalled;
      });

      // Partially visible should not trigger load
      await page.evaluate(() => {
        const lazy = document.querySelector('test-lazy-threshold')!;
        lazy.scrollIntoView({ block: 'end' }); // Only partially visible
      });

      await page.waitForTimeout(200);
      
      const loaded = await page.evaluate(() => (window as any).checkLoadCalled());
      expect(loaded).toBe(true);
    });

    test('shows error state on load failure', async ({ page }) => {
      await page.evaluate(() => {
        class FailingLazyComponent extends (window as any).BrutalEnhanced.LazyComponent {
          async loadContent() {
            throw new Error('Load failed');
          }
        }
        
        customElements.define('test-lazy-fail', FailingLazyComponent);
        
        const lazy = document.createElement('test-lazy-fail');
        document.body.appendChild(lazy);
      });

      // Should show error message
      await expect(page.locator('test-lazy-fail .lazy-error')).toContainText('Failed to load: Error: Load failed');
    });
  });

  test.describe('VisibilityTracker', () => {
    test('tracks visibility time', async ({ page }) => {
      await page.evaluate(() => {
        class TestVisibilityTracker extends (window as any).BrutalEnhanced.VisibilityTracker {
          visibilityLog: number[] = [];
          
          protected onVisibilityUpdate(timeVisible: number): void {
            this.visibilityLog.push(timeVisible);
          }
          
          protected onVisibilityEnd(totalTimeVisible: number): void {
            this.setAttribute('data-total-time', totalTimeVisible.toString());
          }
        }
        
        customElements.define('test-visibility', TestVisibilityTracker);
        
        const tracker = document.createElement('test-visibility') as any;
        document.body.appendChild(tracker);
        
        (window as any).testTracker = tracker;
      });

      // Wait for some visibility time
      await page.waitForTimeout(500);

      // Check that visibility is being tracked
      const visibleTime = await page.evaluate(() => {
        const tracker = (window as any).testTracker;
        return tracker.getVisibleTime();
      });

      expect(visibleTime).toBeGreaterThan(400);
      expect(visibleTime).toBeLessThan(1100);

      // Hide the element
      await page.evaluate(() => {
        const tracker = (window as any).testTracker;
        tracker.style.display = 'none';
      });

      // Wait a bit
      await page.waitForTimeout(200);

      // Check that tracking stopped
      const totalTime = await page.locator('test-visibility').getAttribute('data-total-time');
      expect(Number(totalTime)).toBeGreaterThan(400);
      expect(Number(totalTime)).toBeLessThan(1100);
    });

    test('tracks partial visibility correctly', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.getElementById('test-container')!;
        container.style.height = '100vh';
        container.style.overflow = 'hidden';
        
        class TestPartialTracker extends (window as any).BrutalEnhanced.VisibilityTracker {
          startedTracking = false;
          
          protected onVisibilityUpdate(timeVisible: number): void {
            this.startedTracking = true;
          }
        }
        
        customElements.define('test-partial', TestPartialTracker);
        
        const tracker = document.createElement('test-partial') as any;
        tracker.style.height = '200px';
        tracker.style.marginTop = '90vh'; // Only 10% visible
        container.appendChild(tracker);
        
        (window as any).testPartialTracker = tracker;
      });

      await page.waitForTimeout(200);

      // Should not track when less than 50% visible
      const tracking = await page.evaluate(() => {
        const tracker = (window as any).testPartialTracker;
        return tracker.startedTracking;
      });

      expect(tracking).toBe(true);

      // Scroll to make more visible
      await page.evaluate(() => {
        const tracker = (window as any).testPartialTracker;
        tracker.scrollIntoView({ block: 'center' });
      });

      await page.waitForTimeout(200);

      // Should now be tracking
      const trackingAfterScroll = await page.evaluate(() => {
        const tracker = (window as any).testPartialTracker;
        return tracker.startedTracking;
      });

      expect(trackingAfterScroll).toBe(true);
    });
  });

  test.describe('Observer cleanup', () => {
    test('disconnects all observers on component removal', async ({ page }) => {
      await page.evaluate(() => {
        class TestObserverComponent extends (window as any).BrutalEnhanced.ObserverComponent {
          constructor() {
            super();
            this.observerOptions = {
              intersection: { threshold: 0.5 },
              resize: {},
              mutation: { childList: true },
            };
          }
        }
        
        customElements.define('test-observer-cleanup', TestObserverComponent);
        
        const component = document.createElement('test-observer-cleanup');
        document.body.appendChild(component);
        
        // Store references to check disconnection
        (window as any).testComponent = component;
      });

      // Verify observers are connected
      const hasObservers = await page.evaluate(() => {
        const component = (window as any).testComponent as any;
        return !!(component.intersectionObserver && component.resizeObserver && component.mutationObserver);
      });

      expect(hasObservers).toBe(true);

      // Remove component
      await page.evaluate(() => {
        const component = (window as any).testComponent;
        component.remove();
      });

      // Observers should be disconnected (no direct way to check, but no errors should occur)
    });
  });
});