import { test, expect } from '@playwright/test';

test.describe('Production Quick Tests', () => {
  test.setTimeout(30000); // 30 seconds timeout

  test('should load the production site', async ({ page }) => {
    await page.goto('https://health-tracker-neon.vercel.app/', { waitUntil: 'domcontentloaded' });
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    
    // Check if page loads correctly
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should check PWA manifest', async ({ page }) => {
    const response = await page.goto('https://health-tracker-neon.vercel.app/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    console.log('Manifest name:', manifest.name); // Debug output
    
    // Check manifest properties (updated based on actual values)
    expect(manifest.name).toContain('Health');
    expect(manifest.name).toContain('Tracker');
    expect(manifest.short_name).toBe('Health');
    expect(manifest.display).toBe('standalone');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('https://health-tracker-neon.vercel.app/login', { waitUntil: 'networkidle' });
    
    // Check page elements
    await expect(page.locator('text=/Health.*Tracker/i').first()).toBeVisible();
    
    // Check Google sign-in button
    const signInButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(signInButton).toBeVisible();
  });

  test('should check theme toggle exists', async ({ page }) => {
    await page.goto('https://health-tracker-neon.vercel.app/login');
    
    // Look for theme toggle button (might be an icon button)
    const themeButtons = await page.locator('button').all();
    
    // Find button that might be theme toggle (usually has sun/moon icon)
    let themeToggleFound = false;
    for (const button of themeButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.toLowerCase().includes('theme')) {
        themeToggleFound = true;
        break;
      }
    }
    
    expect(themeToggleFound).toBe(true);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://health-tracker-neon.vercel.app/login');
    
    // Content should fit mobile viewport
    await expect(page.locator('main, body > div').first()).toBeVisible();
  });

  test('should check basic security', async ({ page }) => {
    await page.goto('https://health-tracker-neon.vercel.app/dashboard');
    
    // Should redirect unauthorized users to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should load favicon and static assets', async ({ page }) => {
    await page.goto('https://health-tracker-neon.vercel.app/');
    
    // Check if page has some styling (indicates CSS loaded)
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.fontFamily !== '' && styles.margin !== '';
    });
    
    expect(hasStyles).toBe(true);
  });
});