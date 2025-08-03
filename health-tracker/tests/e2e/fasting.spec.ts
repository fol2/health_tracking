import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';
import { mockApiResponse } from '../helpers/api.helper';

test.describe('Fasting Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test('should display fasting page correctly', async ({ page }) => {
    await page.goto('/fasting');
    
    await expect(page.getByRole('heading', { name: /Fasting Tracker/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Fasting/i })).toBeVisible();
  });

  test('should start a fasting session', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/start', {
      id: 'test-session-id',
      userId: 'test-user-id',
      startTime: new Date().toISOString(),
      targetHours: 16,
      status: 'active',
    });

    await mockApiResponse(page, '**/api/fasting/sessions/active', {
      id: 'test-session-id',
      userId: 'test-user-id',
      startTime: new Date().toISOString(),
      targetHours: 16,
      status: 'active',
    });

    await page.goto('/fasting');
    
    // Click start fasting
    await page.getByRole('button', { name: /Start Fasting/i }).click();
    
    // Should show timer
    await expect(page.getByText(/00:00:/)).toBeVisible();
    
    // Should show stop button
    await expect(page.getByRole('button', { name: /Stop Fasting/i })).toBeVisible();
  });

  test('should display active fasting session', async ({ page }) => {
    const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    await mockApiResponse(page, '**/api/fasting/sessions/active', {
      id: 'active-session-id',
      userId: 'test-user-id',
      startTime: startTime.toISOString(),
      targetHours: 16,
      status: 'active',
    });

    await page.goto('/fasting');
    
    // Should show timer with elapsed time
    await expect(page.getByText(/02:0/)).toBeVisible(); // At least 2 hours
    
    // Should show progress bar
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    
    // Should show target time
    await expect(page.getByText(/16 hours/i)).toBeVisible();
  });

  test('should stop a fasting session', async ({ page }) => {
    const startTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
    
    await mockApiResponse(page, '**/api/fasting/sessions/active', {
      id: 'active-session-id',
      userId: 'test-user-id',
      startTime: startTime.toISOString(),
      targetHours: 16,
      status: 'active',
    });

    await mockApiResponse(page, '**/api/fasting/sessions/active-session-id/end', {
      id: 'active-session-id',
      userId: 'test-user-id',
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      targetHours: 16,
      status: 'completed',
      duration: 4,
    });

    await page.goto('/fasting');
    
    // Click stop fasting
    await page.getByRole('button', { name: /Stop Fasting/i }).click();
    
    // Confirm in dialog
    await page.getByRole('button', { name: /Yes, stop fasting/i }).click();
    
    // Should show start button again
    await expect(page.getByRole('button', { name: /Start Fasting/i })).toBeVisible();
  });

  test('should display fasting history', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/sessions?limit=10', [
      {
        id: 'session-1',
        userId: 'test-user-id',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        targetHours: 16,
        status: 'completed',
        duration: 16,
      },
      {
        id: 'session-2',
        userId: 'test-user-id',
        startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        targetHours: 12,
        status: 'completed',
        duration: 12,
      },
    ]);

    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);

    await page.goto('/fasting');
    
    // Should show history section
    await expect(page.getByRole('heading', { name: /Recent Fasts/i })).toBeVisible();
    
    // Should show completed sessions
    await expect(page.getByText(/16 hours/)).toBeVisible();
    await expect(page.getByText(/12 hours/)).toBeVisible();
  });

  test('should display fasting statistics', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/stats', {
      totalSessions: 50,
      averageDuration: 14.5,
      longestFast: 24,
      currentStreak: 7,
      totalHours: 725,
      completionRate: 0.85,
    });

    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);

    await page.goto('/fasting');
    
    // Should show stats cards
    await expect(page.getByText(/Total Fasts/i)).toBeVisible();
    await expect(page.getByText('50')).toBeVisible();
    
    await expect(page.getByText(/Average Duration/i)).toBeVisible();
    await expect(page.getByText(/14.5/)).toBeVisible();
    
    await expect(page.getByText(/Current Streak/i)).toBeVisible();
    await expect(page.getByText('7')).toBeVisible();
  });

  test('should handle fasting timer updates', async ({ page }) => {
    const startTime = new Date();
    
    await mockApiResponse(page, '**/api/fasting/sessions/active', {
      id: 'active-session-id',
      userId: 'test-user-id',
      startTime: startTime.toISOString(),
      targetHours: 1,
      status: 'active',
    });

    await page.goto('/fasting');
    
    // Initial timer should show 00:00:xx
    const initialTimer = await page.getByText(/00:00:/).textContent();
    
    // Wait 2 seconds
    await page.waitForTimeout(2000);
    
    // Timer should have updated
    const updatedTimer = await page.getByText(/00:00:/).textContent();
    expect(updatedTimer).not.toBe(initialTimer);
  });
});