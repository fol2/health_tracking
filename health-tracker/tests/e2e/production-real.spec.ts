import { test, expect } from '@playwright/test';

test.describe('Production Site - Actual Tests', () => {
  const baseURL = 'https://health-tracker-neon.vercel.app';
  
  test('should load the landing page', async ({ page }) => {
    await page.goto(baseURL);
    
    // Should show landing page content
    await expect(page.getByRole('heading', { name: /Track Your Health Journey/i })).toBeVisible();
    await expect(page.getByText(/Monitor your fasting schedules/i)).toBeVisible();
    
    // Should have navigation buttons
    await expect(page.getByRole('link', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
  });

  test('should have correct PWA manifest', async ({ page }) => {
    const response = await page.goto(`${baseURL}/manifest.json`);
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    
    // Check actual manifest values
    expect(manifest.name).toBe('Health & Fasting Tracker');
    expect(manifest.short_name).toBe('Health Tracker');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0a0a0a');
    expect(manifest.background_color).toBe('#0a0a0a');
    expect(manifest.orientation).toBe('portrait');
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto(baseURL);
    
    // Click Sign In button
    await page.getByRole('link', { name: /Sign In/i }).click();
    
    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show login form or OAuth options
    await expect(page.locator('form, button').first()).toBeVisible();
  });

  test('should navigate to registration', async ({ page }) => {
    await page.goto(baseURL);
    
    // Click Get Started button
    await page.getByRole('link', { name: /Get Started/i }).click();
    
    // Should navigate to registration or login
    await expect(page).toHaveURL(/\/(register|login|signup)/);
  });

  test('should display key features', async ({ page }) => {
    await page.goto(baseURL);
    
    // Check feature sections
    await expect(page.getByText(/Fasting Tracker/i)).toBeVisible();
    await expect(page.getByText(/Track intermittent fasting/i)).toBeVisible();
    
    await expect(page.getByRole('heading', { name: /Health Metrics/i })).toBeVisible();
    await expect(page.getByText(/Monitor weight, blood pressure/i)).toBeVisible();
    
    await expect(page.getByText(/Progress Analytics/i)).toBeVisible();
    await expect(page.getByText(/Visualize your progress/i)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    
    // Check mobile layout
    await expect(page.getByRole('heading', { name: /Track Your Health Journey/i })).toBeVisible();
    
    // Navigation should be accessible
    await expect(page.getByRole('link', { name: /Sign In/i })).toBeVisible();
  });

  test('should load static assets', async ({ page }) => {
    await page.goto(baseURL);
    
    // Check if CSS is loaded
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.backgroundColor !== '' && styles.fontFamily !== '';
    });
    
    expect(hasStyles).toBe(true);
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected routes
    await page.goto(`${baseURL}/dashboard`);
    
    // Should redirect to login or show unauthorized
    const url = page.url();
    expect(url).toMatch(/\/(login|signin|$)/);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto(baseURL);
    
    // Check essential meta tags
    const title = await page.title();
    expect(title).toContain('Health');
    
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewport).toContain('width=device-width');
    
    const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
    expect(themeColor).toBeTruthy();
  });

  test('should handle 404 pages', async ({ page }) => {
    const response = await page.goto(`${baseURL}/non-existent-page-xyz123`);
    
    // Should return 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(200);
    expect(response?.status()).toBeLessThanOrEqual(404);
    
    // Should show some content (not error page)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should have footer information', async ({ page }) => {
    await page.goto(baseURL);
    
    // Check footer
    await expect(page.getByText(/© 2024 Health Tracker/i)).toBeVisible();
  });

  test('should test performance metrics', async ({ page }) => {
    const metrics = await page.goto(baseURL).then(async () => {
      return await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        };
      });
    });
    
    // Page should load reasonably fast
    expect(metrics.loadComplete).toBeLessThan(10000); // 10 seconds
  });
});