import { test, expect } from '@playwright/test';
import { setupEnhancedComponents } from './test-helpers';

test.describe('Portal Component', () => {
  test.beforeEach(async ({ page }) => {
    await setupEnhancedComponents(page);
  });

  test('renders content in target element', async ({ page }) => {
    await page.evaluate(() => {
      const portal = document.createElement('brutal-portal');
      portal.setAttribute('target', '#modal');
      portal.innerHTML = '<div class="portal-content">Hello Portal</div>';
      document.body.appendChild(portal);
    });

    // Check that content appears in the modal
    await expect(page.locator('#modal .portal-content')).toHaveText('Hello Portal');
    
    // Check that original portal element exists but has no visible content
    const portalElement = page.locator('brutal-portal');
    await expect(portalElement).toBeAttached();
    await expect(portalElement.locator('.portal-content')).toHaveCount(1);
  });

  test('creates target element if it does not exist', async ({ page }) => {
    await page.evaluate(() => {
      const portal = document.createElement('brutal-portal');
      portal.setAttribute('target', '#new-target');
      portal.innerHTML = '<span>Dynamic Target</span>';
      document.body.appendChild(portal);
    });

    // Check that new target was created
    await expect(page.locator('#new-target')).toBeAttached();
    await expect(page.locator('#new-target span')).toHaveText('Dynamic Target');
  });

  test('updates content when portal content changes', async ({ page }) => {
    await page.evaluate(() => {
      const portal = document.createElement('brutal-portal');
      portal.setAttribute('target', '#modal');
      portal.innerHTML = '<div>Initial Content</div>';
      document.body.appendChild(portal);
      
      // Store reference globally for next step
      (window as any).testPortal = portal;
    });

    // Verify initial content
    await expect(page.locator('#modal div:not([data-portal])')).toHaveText('Initial Content');

    // Update content
    await page.evaluate(() => {
      const portal = (window as any).testPortal;
      portal.innerHTML = '<div>Updated Content</div>';
    });

    // Verify updated content
    await expect(page.locator('#modal div:not([data-portal])')).toHaveText('Updated Content');
  });

  test('cleans up content on disconnect', async ({ page }) => {
    await page.evaluate(() => {
      const portal = document.createElement('brutal-portal');
      portal.setAttribute('target', '#modal');
      portal.setAttribute('cleanup', 'true');
      portal.innerHTML = '<div>Cleanup Test</div>';
      document.body.appendChild(portal);
      
      (window as any).testPortal = portal;
    });

    // Verify content exists
    await expect(page.locator('#modal div:not([data-portal])')).toHaveText('Cleanup Test');

    // Remove portal
    await page.evaluate(() => {
      const portal = (window as any).testPortal;
      portal.remove();
    });

    // Verify content was cleaned up
    await expect(page.locator('#modal div:not([data-portal])')).toHaveCount(0);
  });

  test('supports dynamic target changes', async ({ page }) => {
    await page.evaluate(() => {
      // Create two targets
      const target1 = document.createElement('div');
      target1.id = 'target1';
      document.body.appendChild(target1);

      const target2 = document.createElement('div');
      target2.id = 'target2';
      document.body.appendChild(target2);

      // Create portal
      const portal = document.createElement('brutal-portal');
      portal.setAttribute('target', '#target1');
      portal.innerHTML = '<div>Moving Content</div>';
      document.body.appendChild(portal);
      
      (window as any).testPortal = portal;
    });

    // Verify initial placement
    await expect(page.locator('#target1 div:not([data-portal])')).toHaveText('Moving Content');
    await expect(page.locator('#target2 div:not([data-portal])')).toHaveCount(0);

    // Change target
    await page.evaluate(() => {
      const portal = (window as any).testPortal as any;
      portal.setTarget('#target2');
    });

    // Verify content moved
    await expect(page.locator('#target1 div:not([data-portal])')).toHaveCount(0);
    await expect(page.locator('#target2 div:not([data-portal])')).toHaveText('Moving Content');
  });

  test('handles multiple portals to same target', async ({ page }) => {
    await page.evaluate(() => {
      const portal1 = document.createElement('brutal-portal');
      portal1.setAttribute('target', '#modal');
      portal1.innerHTML = '<div class="portal1">Portal 1</div>';
      document.body.appendChild(portal1);

      const portal2 = document.createElement('brutal-portal');
      portal2.setAttribute('target', '#modal');
      portal2.innerHTML = '<div class="portal2">Portal 2</div>';
      document.body.appendChild(portal2);
    });

    // Both should be in the modal
    await expect(page.locator('#modal .portal1')).toHaveText('Portal 1');
    await expect(page.locator('#modal .portal2')).toHaveText('Portal 2');
  });

  test('preserves attributes except portal-specific ones', async ({ page }) => {
    await page.evaluate(() => {
      const portal = document.createElement('brutal-portal');
      portal.setAttribute('target', '#modal');
      portal.setAttribute('class', 'custom-class');
      portal.setAttribute('data-test', 'value');
      portal.innerHTML = '<div>Attribute Test</div>';
      document.body.appendChild(portal);
    });

    // Check that portal content has the attributes
    const portalContent = page.locator('#modal [data-portal]');
    await expect(portalContent).toHaveClass(/custom-class/);
    await expect(portalContent).toHaveAttribute('data-test', 'value');
    
    // Portal-specific attributes should not be copied
    await expect(portalContent).not.toHaveAttribute('target');
  });
});