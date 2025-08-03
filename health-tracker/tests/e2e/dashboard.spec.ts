import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';
import { mockApiResponse } from '../helpers/api.helper';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test('should display dashboard with all sections', async ({ page }) => {
    // Mock all dashboard data
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/fasting/stats', {
      totalSessions: 25,
      averageDuration: 16.5,
      longestFast: 36,
      currentStreak: 5,
    });
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 75.2,
      height: 175,
      bloodPressure: '120/80',
      bloodSugar: 95,
    });
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', [
      {
        id: 'upcoming-1',
        name: 'Evening Fast',
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        targetHours: 16,
      },
    ]);

    await page.goto('/dashboard');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    
    // Check quick action cards
    await expect(page.getByText(/Start Fasting/i)).toBeVisible();
    await expect(page.getByText(/Log Weight/i)).toBeVisible();
    await expect(page.getByText(/Add Health Metric/i)).toBeVisible();
    await expect(page.getByText(/Schedule Fast/i)).toBeVisible();
  });

  test('should navigate to fasting page from quick action', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/fasting/stats', {});
    await mockApiResponse(page, '**/api/health/latest', {});
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/dashboard');
    
    // Click fasting quick action
    await page.locator('[href="/fasting"]').first().click();
    
    // Should navigate to fasting page
    await expect(page).toHaveURL('/fasting');
    await expect(page.getByRole('heading', { name: /Fasting Tracker/i })).toBeVisible();
  });

  test('should display active fasting session on dashboard', async ({ page }) => {
    const startTime = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
    
    await mockApiResponse(page, '**/api/fasting/sessions/active', {
      id: 'active-session',
      userId: 'test-user-id',
      startTime: startTime.toISOString(),
      targetHours: 16,
      status: 'active',
    });
    await mockApiResponse(page, '**/api/fasting/stats', {
      totalSessions: 10,
      averageDuration: 16,
      currentStreak: 3,
    });
    await mockApiResponse(page, '**/api/health/latest', {});
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/dashboard');
    
    // Should show active fasting status
    await expect(page.getByText(/Fasting in Progress/i)).toBeVisible();
    await expect(page.getByText(/08:/)).toBeVisible(); // At least 8 hours elapsed
    await expect(page.getByText(/50%/)).toBeVisible(); // Progress percentage
  });

  test('should display latest health metrics', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/fasting/stats', {});
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 72.5,
      height: 170,
      bloodPressure: '118/78',
      bloodSugar: 92,
    });
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/dashboard');
    
    // Should display health metrics
    await expect(page.getByText('72.5 kg')).toBeVisible();
    await expect(page.getByText('118/78')).toBeVisible();
    await expect(page.getByText('92')).toBeVisible();
    
    // Should calculate and display BMI
    await expect(page.getByText(/BMI/i)).toBeVisible();
    await expect(page.getByText(/25.1/)).toBeVisible(); // BMI calculation
  });

  test('should display upcoming scheduled fasts', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/fasting/stats', {});
    await mockApiResponse(page, '**/api/health/latest', {});
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', [
      {
        id: 'schedule-1',
        name: 'Morning Fast',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        targetHours: 16,
      },
      {
        id: 'schedule-2',
        name: 'Weekend Fast',
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        targetHours: 24,
      },
    ]);

    await page.goto('/dashboard');
    
    // Should show upcoming fasts section
    await expect(page.getByText(/Upcoming Fasts/i)).toBeVisible();
    
    // Should display scheduled fasts
    await expect(page.getByText('Morning Fast')).toBeVisible();
    await expect(page.getByText(/in 2 hours/i)).toBeVisible();
    
    await expect(page.getByText('Weekend Fast')).toBeVisible();
    await expect(page.getByText(/in 2 days/i)).toBeVisible();
  });

  test('should display fasting statistics summary', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/fasting/stats', {
      totalSessions: 50,
      averageDuration: 18.5,
      longestFast: 48,
      currentStreak: 12,
      totalHours: 925,
      completionRate: 0.88,
    });
    await mockApiResponse(page, '**/api/health/latest', {});
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/dashboard');
    
    // Should display fasting stats
    await expect(page.getByText(/Fasting Stats/i)).toBeVisible();
    await expect(page.getByText('50')).toBeVisible(); // Total sessions
    await expect(page.getByText('18.5')).toBeVisible(); // Average duration
    await expect(page.getByText('12')).toBeVisible(); // Current streak
    await expect(page.getByText('88%')).toBeVisible(); // Completion rate
  });

  test('should handle empty data states', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/fasting/stats', {
      totalSessions: 0,
      averageDuration: 0,
      currentStreak: 0,
    });
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: null,
      bloodSugar: null,
    });
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/dashboard');
    
    // Should show empty state messages
    await expect(page.getByText(/No active fast/i)).toBeVisible();
    await expect(page.getByText(/No weight data/i)).toBeVisible();
    await expect(page.getByText(/No upcoming fasts/i)).toBeVisible();
    
    // Should still show quick actions
    await expect(page.getByText(/Start Fasting/i)).toBeVisible();
    await expect(page.getByText(/Log Weight/i)).toBeVisible();
  });

  test('should refresh data on demand', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/fasting/stats', async (route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalSessions: callCount * 10,
          averageDuration: 16,
          currentStreak: callCount,
        }),
      });
    });

    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/health/latest', {});
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/dashboard');
    
    // Initial load should show 10 sessions
    await expect(page.getByText('10')).toBeVisible();
    
    // Find and click refresh button
    await page.getByRole('button', { name: /Refresh/i }).click();
    
    // Should update to show 20 sessions
    await expect(page.getByText('20')).toBeVisible();
  });

  test('should show quick insights', async ({ page }) => {
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 404);
    await mockApiResponse(page, '**/api/fasting/stats', {
      totalSessions: 30,
      averageDuration: 16,
      longestFast: 24,
      currentStreak: 7,
      weeklyAverage: 5,
      monthlyTrend: 'increasing',
    });
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 75,
      height: 175,
      bloodPressure: '120/80',
      bloodSugar: 95,
      weightTrend: 'decreasing',
    });
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/dashboard');
    
    // Should show insights section
    await expect(page.getByText(/Quick Insights/i)).toBeVisible();
    
    // Should show trends
    await expect(page.getByText(/on a 7-day streak/i)).toBeVisible();
    await expect(page.getByText(/Weight trending down/i)).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock all endpoints to return errors
    await mockApiResponse(page, '**/api/fasting/sessions/active', null, 500);
    await mockApiResponse(page, '**/api/fasting/stats', null, 500);
    await mockApiResponse(page, '**/api/health/latest', null, 500);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', null, 500);

    await page.goto('/dashboard');
    
    // Should still display dashboard
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    
    // Should show error states
    await expect(page.getByText(/Unable to load/i)).toBeVisible();
    
    // Quick actions should still be available
    await expect(page.getByText(/Start Fasting/i)).toBeVisible();
  });
});