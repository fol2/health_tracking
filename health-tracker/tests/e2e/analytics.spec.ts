import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';
import { mockApiResponse } from '../helpers/api.helper';

test.describe('Analytics & Reports', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test('should display analytics page', async ({ page }) => {
    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: {
        totalSessions: 50,
        averageDuration: 16.5,
        longestFast: 48,
        currentStreak: 7,
        totalHours: 825,
        completionRate: 0.85,
      },
      weight: {
        current: 75.5,
        starting: 80,
        lowest: 74.5,
        highest: 82,
        totalChange: -4.5,
        averageWeeklyChange: -0.3,
      },
      health: {
        latestBP: '120/80',
        latestBS: 95,
        avgBP: '122/81',
        avgBS: 98,
      },
    });

    await mockApiResponse(page, '**/api/analytics/fasting', {
      sessions: [],
      stats: {
        totalSessions: 50,
        averageDuration: 16.5,
        longestFast: 48,
        currentStreak: 7,
      },
    });

    await mockApiResponse(page, '**/api/analytics/weight', {
      records: [],
      stats: {
        current: 75.5,
        change30d: -1.5,
        change90d: -3.5,
      },
    });

    await mockApiResponse(page, '**/api/analytics/health', {
      bloodPressure: [],
      bloodSugar: [],
    });

    await page.goto('/analytics');
    
    await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Data/i })).toBeVisible();
  });

  test('should display summary cards', async ({ page }) => {
    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: {
        totalSessions: 100,
        averageDuration: 18.5,
        longestFast: 72,
        currentStreak: 14,
        totalHours: 1850,
        completionRate: 0.92,
      },
      weight: {
        current: 70.2,
        starting: 78.5,
        lowest: 69.8,
        highest: 79.0,
        totalChange: -8.3,
        averageWeeklyChange: -0.5,
      },
      health: {
        latestBP: '118/78',
        latestBS: 92,
        avgBP: '120/80',
        avgBS: 95,
      },
    });

    await page.goto('/analytics');
    
    // Fasting stats
    await expect(page.getByText('100')).toBeVisible(); // Total sessions
    await expect(page.getByText('18.5')).toBeVisible(); // Average duration
    await expect(page.getByText('14')).toBeVisible(); // Current streak
    await expect(page.getByText('92%')).toBeVisible(); // Completion rate
    
    // Weight stats
    await expect(page.getByText('70.2')).toBeVisible(); // Current weight
    await expect(page.getByText('-8.3')).toBeVisible(); // Total change
    
    // Health stats
    await expect(page.getByText('118/78')).toBeVisible(); // Latest BP
    await expect(page.getByText('92')).toBeVisible(); // Latest BS
  });

  test('should display fasting analytics charts', async ({ page }) => {
    const sessions = Array.from({ length: 30 }, (_, i) => ({
      id: `session-${i}`,
      userId: 'test-user-id',
      startTime: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
      targetHours: 16,
      status: 'completed',
      duration: 16 + Math.random() * 4,
    }));

    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: {
        totalSessions: 30,
        averageDuration: 17,
        longestFast: 20,
        currentStreak: 30,
        totalHours: 510,
        completionRate: 1.0,
      },
      weight: {},
      health: {},
    });

    await mockApiResponse(page, '**/api/analytics/fasting', {
      sessions,
      stats: {
        totalSessions: 30,
        averageDuration: 17,
        longestFast: 20,
        currentStreak: 30,
      },
    });

    await page.goto('/analytics');
    
    // Should display fasting duration chart
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    
    // Should have bar chart elements
    await expect(page.locator('.recharts-bar')).toBeVisible();
  });

  test('should display weight trend chart', async ({ page }) => {
    const weights = Array.from({ length: 90 }, (_, i) => ({
      id: `weight-${i}`,
      userId: 'test-user-id',
      weight: 80 - (i * 0.1) + Math.random() * 0.5,
      unit: 'kg',
      recordedAt: new Date(Date.now() - (90 - i) * 24 * 60 * 60 * 1000).toISOString(),
    }));

    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: {},
      weight: {
        current: 71.5,
        starting: 80,
        lowest: 71.0,
        highest: 80.5,
        totalChange: -8.5,
        averageWeeklyChange: -0.7,
      },
      health: {},
    });

    await mockApiResponse(page, '**/api/analytics/weight', {
      records: weights,
      stats: {
        current: 71.5,
        change30d: -3,
        change90d: -8.5,
      },
    });

    await page.goto('/analytics');
    
    // Navigate to weight analytics
    await page.getByRole('tab', { name: /Weight/i }).click();
    
    // Should display weight trend chart
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    
    // Should show trend line
    await expect(page.locator('.recharts-line')).toBeVisible();
  });

  test('should display health metrics trends', async ({ page }) => {
    const bpData = Array.from({ length: 30 }, (_, i) => ({
      id: `bp-${i}`,
      type: 'blood_pressure',
      value: {
        systolic: 120 + Math.floor(Math.random() * 10),
        diastolic: 80 + Math.floor(Math.random() * 5),
      },
      unit: 'mmHg',
      recordedAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const bsData = Array.from({ length: 30 }, (_, i) => ({
      id: `bs-${i}`,
      type: 'blood_sugar',
      value: 90 + Math.floor(Math.random() * 20),
      unit: 'mg/dL',
      recordedAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
    }));

    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: {},
      weight: {},
      health: {
        latestBP: '125/82',
        latestBS: 98,
        avgBP: '122/81',
        avgBS: 95,
      },
    });

    await mockApiResponse(page, '**/api/analytics/health', {
      bloodPressure: bpData,
      bloodSugar: bsData,
    });

    await page.goto('/analytics');
    
    // Navigate to health analytics
    await page.getByRole('tab', { name: /Health/i }).click();
    
    // Should display BP and BS charts
    const charts = await page.locator('.recharts-wrapper').count();
    expect(charts).toBeGreaterThanOrEqual(2);
  });

  test('should export data as CSV', async ({ page }) => {
    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: { totalSessions: 10 },
      weight: { current: 75 },
      health: {},
    });

    const downloadPromise = page.waitForEvent('download');
    
    await page.goto('/analytics');
    
    // Click export button
    await page.getByRole('button', { name: /Export Data/i }).click();
    
    // Select CSV format
    await page.getByRole('menuitem', { name: /Export as CSV/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should export data as JSON', async ({ page }) => {
    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: { totalSessions: 10 },
      weight: { current: 75 },
      health: {},
    });

    await mockApiResponse(page, '**/api/analytics/export?format=json', {
      fasting: [],
      weight: [],
      health: [],
      exportDate: new Date().toISOString(),
    });

    const downloadPromise = page.waitForEvent('download');
    
    await page.goto('/analytics');
    
    // Click export button
    await page.getByRole('button', { name: /Export Data/i }).click();
    
    // Select JSON format
    await page.getByRole('menuitem', { name: /Export as JSON/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should filter analytics by date range', async ({ page }) => {
    await mockApiResponse(page, '**/api/analytics/summary**', {
      fasting: { totalSessions: 5 },
      weight: { current: 75 },
      health: {},
    });

    await page.goto('/analytics');
    
    // Click date range selector
    await page.getByRole('button', { name: /Date Range/i }).click();
    
    // Select last 7 days
    await page.getByRole('menuitem', { name: /Last 7 days/i }).click();
    
    // Should update data
    await expect(page.getByText(/Showing data for last 7 days/i)).toBeVisible();
  });

  test('should show progress indicators', async ({ page }) => {
    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: {
        totalSessions: 100,
        averageDuration: 18,
        longestFast: 48,
        currentStreak: 30,
        totalHours: 1800,
        completionRate: 0.95,
      },
      weight: {
        current: 70,
        starting: 80,
        lowest: 69.5,
        highest: 82,
        totalChange: -10,
        averageWeeklyChange: -0.5,
        targetWeight: 68,
        progressToTarget: 0.8,
      },
      health: {
        latestBP: '118/78',
        latestBS: 90,
        avgBP: '120/80',
        avgBS: 95,
        bpTrend: 'improving',
        bsTrend: 'improving',
      },
    });

    await page.goto('/analytics');
    
    // Should show completion rate progress
    await expect(page.getByText('95%')).toBeVisible();
    
    // Should show weight progress to target
    await expect(page.getByText(/80% to target/i)).toBeVisible();
    
    // Should show health trend indicators
    await expect(page.getByText(/Improving/i)).toBeVisible();
  });

  test('should handle empty data gracefully', async ({ page }) => {
    await mockApiResponse(page, '**/api/analytics/summary', {
      fasting: {
        totalSessions: 0,
        averageDuration: 0,
        longestFast: 0,
        currentStreak: 0,
        totalHours: 0,
        completionRate: 0,
      },
      weight: {
        current: null,
        starting: null,
        lowest: null,
        highest: null,
        totalChange: 0,
        averageWeeklyChange: 0,
      },
      health: {
        latestBP: null,
        latestBS: null,
        avgBP: null,
        avgBS: null,
      },
    });

    await mockApiResponse(page, '**/api/analytics/fasting', {
      sessions: [],
      stats: {},
    });

    await mockApiResponse(page, '**/api/analytics/weight', {
      records: [],
      stats: {},
    });

    await mockApiResponse(page, '**/api/analytics/health', {
      bloodPressure: [],
      bloodSugar: [],
    });

    await page.goto('/analytics');
    
    // Should show empty state messages
    await expect(page.getByText(/No fasting data/i)).toBeVisible();
    await expect(page.getByText(/Start tracking/i)).toBeVisible();
  });
});