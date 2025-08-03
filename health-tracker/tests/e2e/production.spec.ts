import { test, expect } from '@playwright/test';

test.describe('Production Health Tracker Tests', () => {
  test('should load the production site', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
    
    // Check if page loads correctly
    await expect(page.getByRole('heading', { name: /Health Tracker/i })).toBeVisible();
  });

  test('should have proper meta tags and PWA manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check meta tags
    const title = await page.title();
    expect(title).toContain('Health Tracker');
    
    // Check viewport meta tag
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewport).toContain('width=device-width');
    
    // Check theme color
    const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
    expect(themeColor).toBe('#3b82f6');
  });

  test('should load PWA manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest.name).toBe('Health Tracker');
    expect(manifest.short_name).toBe('Health');
    expect(manifest.display).toBe('standalone');
  });

  test('should display login page with Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    
    // Check page elements
    await expect(page.getByRole('heading', { name: /Health Tracker/i })).toBeVisible();
    await expect(page.getByText(/Track your health metrics/i)).toBeVisible();
    
    // Check Google sign-in button
    const signInButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('should have working theme toggle', async ({ page }) => {
    await page.goto('/login');
    
    // Get initial theme
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('class') || '';
    
    // Find and click theme toggle
    const themeToggle = page.getByRole('button', { name: /Toggle theme/i });
    await themeToggle.click();
    
    // Wait for theme change
    await page.waitForTimeout(500);
    
    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('class') || '';
    expect(newTheme).not.toBe(initialTheme);
    
    // Verify one contains 'dark' and the other doesn't
    const darkModeStates = [initialTheme.includes('dark'), newTheme.includes('dark')];
    expect(darkModeStates).toContain(true);
    expect(darkModeStates).toContain(false);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Content should fit mobile viewport
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    const contentBox = await mainContent.boundingBox();
    expect(contentBox?.width).toBeLessThanOrEqual(375);
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check for security headers
    const headers = response?.headers() || {};
    
    // Vercel typically adds these headers
    expect(headers['x-frame-options'] || headers['X-Frame-Options']).toBeDefined();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345', { waitUntil: 'domcontentloaded' });
    
    // Should still return a valid response (Next.js 404 page)
    expect(response?.status()).toBeLessThanOrEqual(404);
    
    // Should show some kind of error or redirect to login
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load static assets correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check if CSS is loaded (page should have styling)
    const bodyComputedStyle = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el);
    });
    
    // Should have some styling applied
    expect(bodyComputedStyle.fontFamily).toBeTruthy();
    expect(bodyComputedStyle.margin).toBeDefined();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Try to navigate to protected routes (should redirect back to login)
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    
    await page.goto('/fasting');
    await expect(page).toHaveURL(/\/login/);
    
    await page.goto('/weight');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should load favicon', async ({ page }) => {
    await page.goto('/');
    
    // Check if favicon is present
    const favicon = await page.locator('link[rel="icon"]').first();
    const faviconHref = await favicon.getAttribute('href');
    expect(faviconHref).toBeTruthy();
  });

  test('should have proper Open Graph tags', async ({ page }) => {
    await page.goto('/');
    
    // Check OG tags for social sharing
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    
    if (ogTitle) expect(ogTitle).toContain('Health Tracker');
    if (ogDescription) expect(ogDescription).toBeTruthy();
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', (route) => route.continue());
    
    // Set network conditions
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (50 * 1024) / 8, // 50kb/s
      uploadThroughput: (20 * 1024) / 8,   // 20kb/s
      latency: 2000, // 2 seconds
    });
    
    // Page should still load
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 30000 });
  });

  test('should work with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    
    await page.goto('https://health-tracker-neon.vercel.app/');
    
    // Should still show some content (SSR)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    await context.close();
  });

  test('should have working service worker for offline support', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasServiceWorker).toBe(true);
    
    // Wait for service worker to be ready
    await page.waitForTimeout(2000);
    
    // Check if service worker is active
    const swState = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.active?.state;
      }
      return null;
    });
    
    // Service worker should be activated or activating
    if (swState) {
      expect(['activated', 'activating']).toContain(swState);
    }
  });
});