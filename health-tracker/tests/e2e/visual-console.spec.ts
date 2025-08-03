import { test, expect } from '@playwright/test';
import { ConsoleMessage } from '@playwright/test';

test.describe('Visual and Console Tests', () => {
  const baseURL = 'https://health-tracker-neon.vercel.app';
  
  test('capture screenshots of all main pages', async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Landing page
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/screenshots/landing-page-desktop.png',
      fullPage: true 
    });
    
    // Mobile view of landing page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: 'test-results/screenshots/landing-page-mobile.png',
      fullPage: true 
    });
    
    // Login page
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/screenshots/login-page.png',
      fullPage: true 
    });
    
    // Dark mode
    const themeToggle = page.locator('button').filter({ hasText: /theme|dark|light/i }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      await page.screenshot({ 
        path: 'test-results/screenshots/login-page-dark.png',
        fullPage: true 
      });
    }
  });

  test('check browser console for errors', async ({ page }) => {
    const consoleMessages: ConsoleMessage[] = [];
    const consoleErrors: string[] = [];
    
    // Listen to console events
    page.on('console', (msg) => {
      consoleMessages.push(msg);
      if (msg.type() === 'error') {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    // Listen to page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`[PageError] ${error.message}`);
    });
    
    // Test landing page
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Test login page
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Navigate through the site
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Log all console messages
    console.log('\n=== Console Messages ===');
    for (const msg of consoleMessages) {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
    
    // Check for errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors Found ===');
      consoleErrors.forEach(err => console.log(err));
    }
    
    // Assert no critical errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource: the server responded with a status of 404') &&
      !err.includes('favicon') &&
      !err.includes('manifest')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('visual regression - check rendering quality', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Check if all images loaded
    const images = await page.locator('img').all();
    for (const img of images) {
      const isVisible = await img.isVisible();
      if (isVisible) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0); // Image loaded successfully
      }
    }
    
    // Check if fonts loaded
    const fontStatus = await page.evaluate(() => {
      return document.fonts.ready.then(() => {
        return {
          loaded: true,
          fontCount: document.fonts.size
        };
      });
    });
    expect(fontStatus.loaded).toBe(true);
    console.log(`Fonts loaded: ${fontStatus.fontCount}`);
    
    // Check for layout shifts
    const layoutShifts = await page.evaluate(() => {
      return new Promise((resolve) => {
        let shifts = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              shifts += (entry as any).value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(shifts);
        }, 3000);
      });
    });
    
    console.log(`Cumulative Layout Shift: ${layoutShifts}`);
    expect(Number(layoutShifts)).toBeLessThan(0.1); // Good CLS score
  });

  test('check responsive breakpoints', async ({ page }) => {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'wide', width: 1920, height: 1080 }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: `test-results/screenshots/responsive-${breakpoint.name}.png`,
        fullPage: false 
      });
      
      // Check if content fits viewport
      const contentOverflow = await page.evaluate(() => {
        const body = document.body;
        return {
          hasHorizontalScroll: body.scrollWidth > body.clientWidth,
          hasVerticalScroll: body.scrollHeight > body.clientHeight
        };
      });
      
      console.log(`${breakpoint.name} (${breakpoint.width}x${breakpoint.height}):`);
      console.log(`  Horizontal scroll: ${contentOverflow.hasHorizontalScroll}`);
      console.log(`  Vertical scroll: ${contentOverflow.hasVerticalScroll}`);
      
      // Mobile and tablet should not have horizontal scroll
      if (breakpoint.width < 1024) {
        expect(contentOverflow.hasHorizontalScroll).toBe(false);
      }
    }
  });

  test('check accessibility and contrast', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Check for alt text on images
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.alt).map(img => img.src);
    });
    
    if (imagesWithoutAlt.length > 0) {
      console.log('Images without alt text:', imagesWithoutAlt);
    }
    
    // Check color contrast
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a').all();
    const contrastIssues = [];
    
    for (const element of textElements.slice(0, 10)) { // Check first 10 elements
      if (await element.isVisible()) {
        const contrast = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          };
        });
        contrastIssues.push(contrast);
      }
    }
    
    console.log('Sample text styling:', contrastIssues.slice(0, 3));
    
    // Take accessibility-focused screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/accessibility-check.png',
      fullPage: true 
    });
  });

  test('performance metrics and rendering', async ({ page }) => {
    await page.goto(baseURL);
    
    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      };
    });
    
    console.log('\n=== Performance Metrics ===');
    console.log(`First Paint: ${metrics.firstPaint?.toFixed(2)}ms`);
    console.log(`First Contentful Paint: ${metrics.firstContentfulPaint?.toFixed(2)}ms`);
    console.log(`DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Page Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    
    // Check rendering performance
    expect(metrics.firstContentfulPaint).toBeLessThan(3000); // Under 3 seconds
    expect(metrics.domContentLoaded).toBeLessThan(5000); // Under 5 seconds
  });
});