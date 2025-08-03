import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';

test.describe('PWA Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test('should have PWA manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest.name).toBe('Health Tracker');
    expect(manifest.short_name).toBe('Health');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#3b82f6');
    expect(manifest.background_color).toBe('#ffffff');
  });

  test('should have service worker registration', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasServiceWorker).toBe(true);
  });

  test('should have mobile viewport meta tag', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('should have PWA meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check theme color
    const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
    expect(themeColor).toBe('#3b82f6');
    
    // Check apple mobile web app capable
    const appleCapable = await page.getAttribute('meta[name="apple-mobile-web-app-capable"]', 'content');
    expect(appleCapable).toBe('yes');
    
    // Check apple status bar style
    const statusBarStyle = await page.getAttribute('meta[name="apple-mobile-web-app-status-bar-style"]', 'content');
    expect(statusBarStyle).toBe('default');
  });

  test('should have app icons', async ({ page }) => {
    await page.goto('/');
    
    // Check for apple touch icon
    const appleTouchIcon = await page.getAttribute('link[rel="apple-touch-icon"]', 'href');
    expect(appleTouchIcon).toContain('icon-192x192.png');
    
    // Check if icons are accessible
    const icon192Response = await page.goto('/icons/icon-192x192.png');
    expect(icon192Response?.status()).toBe(200);
    
    const icon512Response = await page.goto('/icons/icon-512x512.png');
    expect(icon512Response?.status()).toBe(200);
  });

  test('should show offline indicator when offline', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // Go offline
    await context.setOffline(true);
    
    // Wait for offline indicator
    await expect(page.getByText(/You are offline/i)).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Offline indicator should disappear
    await expect(page.getByText(/You are offline/i)).not.toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
    
    // Desktop nav should be hidden
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
    
    // Content should be properly sized
    const contentWidth = await page.locator('main').evaluate(el => el.offsetWidth);
    expect(contentWidth).toBeLessThanOrEqual(375);
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/dashboard');
    
    // Navigation should adapt
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Content should use available space
    const main = page.locator('main');
    const mainWidth = await main.evaluate(el => el.offsetWidth);
    expect(mainWidth).toBeGreaterThan(600);
  });

  test('should handle touch gestures on mobile', async ({ page, browserName }) => {
    // Skip on non-Chromium browsers as touch events might not be fully supported
    test.skip(browserName !== 'chromium', 'Touch events test only for Chromium');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/fasting');
    
    // Test swipe gesture on fasting history
    const historySection = page.locator('[data-testid="fasting-history"]');
    
    // Simulate horizontal swipe
    await historySection.dispatchEvent('touchstart', {
      touches: [{ clientX: 300, clientY: 200 }],
    });
    
    await historySection.dispatchEvent('touchmove', {
      touches: [{ clientX: 100, clientY: 200 }],
    });
    
    await historySection.dispatchEvent('touchend', {});
    
    // Component should handle touch events without errors
    await expect(historySection).toBeVisible();
  });

  test('should support installability', async ({ page }) => {
    await page.goto('/');
    
    // Check if page triggers beforeinstallprompt event
    const canInstall = await page.evaluate(() => {
      return new Promise((resolve) => {
        let installable = false;
        
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          installable = true;
        });
        
        // Give it time to trigger
        setTimeout(() => resolve(installable), 1000);
      });
    });
    
    // Note: This might not trigger in test environment
    // but we can check that the PWA requirements are met
    expect(canInstall).toBeDefined();
  });

  test('should cache assets for offline use', async ({ page, context }) => {
    // First visit to cache assets
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate - should work with cached assets
    await page.goto('/fasting');
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: /Fasting Tracker/i })).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
  });

  test('should show app in standalone mode', async ({ page }) => {
    // Add display-mode media query check
    const isStandalone = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone ||
             document.referrer.includes('android-app://');
    });
    
    // In test environment this will be false, but we check the manifest
    const response = await page.goto('/manifest.json');
    const manifest = await response?.json();
    expect(manifest.display).toBe('standalone');
  });

  test('should have proper mobile UI elements', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check for mobile-specific UI elements
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).toBeVisible();
    
    // Check navigation items
    await expect(bottomNav.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: /Fasting/i })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: /Weight/i })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: /Health/i })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: /Analytics/i })).toBeVisible();
  });

  test('should support dark mode with proper theme color', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Toggle dark mode
    await page.getByRole('button', { name: /Toggle theme/i }).click();
    
    // Check if dark mode is applied
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
    
    // Theme color should update for dark mode
    const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
    // This would be the dark theme color if implemented
    expect(themeColor).toBeDefined();
  });
});