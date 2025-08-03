import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test.describe('Button Component', () => {
    test('should render different button variants', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Primary button
      const primaryButton = page.getByRole('button', { name: /Start Fasting/i }).first();
      await expect(primaryButton).toBeVisible();
      await expect(primaryButton).toHaveClass(/bg-primary/);
      
      // Secondary/outline button
      const secondaryButton = page.getByRole('button', { name: /View All/i }).first();
      if (await secondaryButton.isVisible()) {
        await expect(secondaryButton).toHaveClass(/border/);
      }
    });

    test('should handle button loading states', async ({ page }) => {
      await page.goto('/fasting');
      
      // Click start fasting button
      const button = page.getByRole('button', { name: /Start Fasting/i });
      await button.click();
      
      // Button should show loading state
      await expect(button).toBeDisabled();
      await expect(page.locator('.animate-spin')).toBeVisible();
    });
  });

  test.describe('Card Component', () => {
    test('should render card with proper styling', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Find card components
      const cards = page.locator('[class*="rounded-lg"][class*="border"]');
      await expect(cards.first()).toBeVisible();
      
      // Check card has proper shadow and border
      const cardClass = await cards.first().getAttribute('class');
      expect(cardClass).toContain('border');
      expect(cardClass).toContain('rounded-lg');
    });
  });

  test.describe('Dialog Component', () => {
    test('should open and close dialog', async ({ page }) => {
      await page.goto('/weight');
      
      // Open dialog
      await page.getByRole('button', { name: /Add Weight/i }).click();
      
      // Dialog should be visible
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Close dialog
      await page.getByRole('button', { name: /Cancel/i }).click();
      
      // Dialog should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should trap focus within dialog', async ({ page }) => {
      await page.goto('/weight');
      
      // Open dialog
      await page.getByRole('button', { name: /Add Weight/i }).click();
      
      // Tab through focusable elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Focus should still be within dialog
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'TEXTAREA']).toContain(focusedElement);
    });
  });

  test.describe('Form Components', () => {
    test('should display form validation errors', async ({ page }) => {
      await page.goto('/weight');
      
      // Open weight form
      await page.getByRole('button', { name: /Add Weight/i }).click();
      
      // Try to submit empty form
      await page.getByRole('button', { name: /Save/i }).click();
      
      // Should show validation error
      await expect(page.getByText(/required/i)).toBeVisible();
    });

    test('should handle form input interactions', async ({ page }) => {
      await page.goto('/health');
      
      // Click add reading button
      await page.getByRole('button', { name: /Add Reading/i }).click();
      
      // Test input focus states
      const input = page.getByLabel(/Systolic/i);
      await input.focus();
      
      // Input should have focus styling
      const inputClass = await input.getAttribute('class');
      expect(inputClass).toContain('focus:');
    });
  });

  test.describe('Tabs Component', () => {
    test('should switch between tabs', async ({ page }) => {
      await page.goto('/health');
      
      // Click blood pressure tab
      await page.getByRole('tab', { name: /Blood Pressure/i }).click();
      await expect(page.getByRole('tabpanel')).toContainText(/Blood Pressure/i);
      
      // Click blood sugar tab
      await page.getByRole('tab', { name: /Blood Sugar/i }).click();
      await expect(page.getByRole('tabpanel')).toContainText(/Blood Sugar/i);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/health');
      
      // Focus first tab
      await page.getByRole('tab', { name: /Blood Pressure/i }).focus();
      
      // Press arrow key to navigate
      await page.keyboard.press('ArrowRight');
      
      // Second tab should be focused
      const focusedTab = await page.evaluate(() => document.activeElement?.textContent);
      expect(focusedTab).toContain('Blood Sugar');
    });
  });

  test.describe('Select Component', () => {
    test('should open select dropdown', async ({ page }) => {
      await page.goto('/schedule');
      
      // Click new schedule
      await page.getByRole('button', { name: /New Schedule/i }).click();
      
      // Click frequency select
      const select = page.getByLabel(/Frequency/i);
      await select.click();
      
      // Options should be visible
      await expect(page.getByRole('option', { name: /Daily/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /Weekly/i })).toBeVisible();
    });
  });

  test.describe('Progress Component', () => {
    test('should display progress bar', async ({ page }) => {
      await page.goto('/fasting');
      
      // Mock active session
      await page.route('**/api/fasting/sessions/active', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-session',
            startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            targetHours: 16,
            status: 'active',
          }),
        });
      });
      
      await page.reload();
      
      // Progress bar should be visible
      await expect(page.locator('[role="progressbar"]')).toBeVisible();
      
      // Should show 50% progress (8 hours of 16)
      await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '50');
    });
  });

  test.describe('Toast Notifications', () => {
    test('should show success toast', async ({ page }) => {
      await page.goto('/weight');
      
      // Trigger success action
      await page.route('**/api/health/weight', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test', weight: 75 }),
        });
      });
      
      await page.getByRole('button', { name: /Add Weight/i }).click();
      await page.getByLabel(/Weight/i).fill('75');
      await page.getByRole('button', { name: /Save/i }).click();
      
      // Success toast should appear
      await expect(page.getByText(/recorded successfully/i)).toBeVisible();
    });

    test('should show error toast', async ({ page }) => {
      await page.goto('/weight');
      
      // Trigger error
      await page.route('**/api/health/weight', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });
      
      await page.getByRole('button', { name: /Add Weight/i }).click();
      await page.getByLabel(/Weight/i).fill('75');
      await page.getByRole('button', { name: /Save/i }).click();
      
      // Error toast should appear
      await expect(page.getByText(/error/i)).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show skeleton loaders', async ({ page }) => {
      // Delay API response to see loading state
      await page.route('**/api/fasting/stats', async (route) => {
        await page.waitForTimeout(1000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      });
      
      await page.goto('/dashboard');
      
      // Skeleton loaders should be visible
      await expect(page.locator('.animate-pulse').first()).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // Mobile navigation should be visible
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
      
      // Cards should stack vertically
      const cards = await page.locator('.grid').first().getAttribute('class');
      expect(cards).toContain('grid-cols-1');
    });

    test('should adapt layout for desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/dashboard');
      
      // Desktop navigation should be visible
      await expect(page.locator('nav').first()).toBeVisible();
      
      // Cards should be in grid
      const cards = await page.locator('.grid').first().getAttribute('class');
      expect(cards).toMatch(/grid-cols-[234]/);
    });
  });

  test.describe('Dark Mode', () => {
    test('should toggle dark mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Get initial theme
      const initialTheme = await page.locator('html').getAttribute('class');
      
      // Toggle theme
      await page.getByRole('button', { name: /Toggle theme/i }).click();
      
      // Theme should change
      const newTheme = await page.locator('html').getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
      
      // Dark mode classes should be applied
      if (newTheme?.includes('dark')) {
        await expect(page.locator('body')).toHaveClass(/dark:bg-/);
      }
    });
  });
});