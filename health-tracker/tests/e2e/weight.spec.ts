import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';
import { mockApiResponse } from '../helpers/api.helper';

test.describe('Weight Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test('should display weight tracking page', async ({ page }) => {
    await mockApiResponse(page, '**/api/health/weight?limit=30', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: null,
      bloodSugar: null,
    });

    await page.goto('/weight');
    
    await expect(page.getByRole('heading', { name: /Weight Tracker/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Weight/i })).toBeVisible();
  });

  test('should add a new weight entry', async ({ page }) => {
    await mockApiResponse(page, '**/api/health/weight?limit=30', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: null,
      bloodSugar: null,
    });

    await mockApiResponse(page, '**/api/health/weight', {
      id: 'new-weight-id',
      userId: 'test-user-id',
      weight: 75.5,
      unit: 'kg',
      recordedAt: new Date().toISOString(),
      notes: 'Morning weight',
    });

    await page.goto('/weight');
    
    // Click add weight button
    await page.getByRole('button', { name: /Add Weight/i }).click();
    
    // Fill in weight form
    await page.getByLabel(/Weight/i).fill('75.5');
    await page.getByLabel(/Notes/i).fill('Morning weight');
    
    // Submit form
    await page.getByRole('button', { name: /Save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Weight recorded successfully/i)).toBeVisible();
  });

  test('should display weight history', async ({ page }) => {
    const weights = [
      {
        id: 'weight-1',
        userId: 'test-user-id',
        weight: 75.5,
        unit: 'kg',
        recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Morning weight',
      },
      {
        id: 'weight-2',
        userId: 'test-user-id',
        weight: 75.2,
        unit: 'kg',
        recordedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        notes: null,
      },
      {
        id: 'weight-3',
        userId: 'test-user-id',
        weight: 75.8,
        unit: 'kg',
        recordedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        notes: 'After vacation',
      },
    ];

    await mockApiResponse(page, '**/api/health/weight?limit=30', weights);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 75.5,
      height: 175,
      bloodPressure: null,
      bloodSugar: null,
    });

    await page.goto('/weight');
    
    // Should display weight entries
    await expect(page.getByText('75.5 kg')).toBeVisible();
    await expect(page.getByText('75.2 kg')).toBeVisible();
    await expect(page.getByText('75.8 kg')).toBeVisible();
    
    // Should display notes
    await expect(page.getByText('Morning weight')).toBeVisible();
    await expect(page.getByText('After vacation')).toBeVisible();
  });

  test('should display weight chart', async ({ page }) => {
    const weights = Array.from({ length: 10 }, (_, i) => ({
      id: `weight-${i}`,
      userId: 'test-user-id',
      weight: 75 + Math.random() * 2,
      unit: 'kg',
      recordedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      notes: null,
    }));

    await mockApiResponse(page, '**/api/health/weight?limit=30', weights);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: weights[0].weight,
      height: 175,
      bloodPressure: null,
      bloodSugar: null,
    });

    await page.goto('/weight');
    
    // Should display chart
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    
    // Should have chart elements
    await expect(page.locator('.recharts-line')).toBeVisible();
    await expect(page.locator('.recharts-cartesian-axis')).toBeVisible();
  });

  test('should delete a weight entry', async ({ page }) => {
    const weights = [
      {
        id: 'weight-to-delete',
        userId: 'test-user-id',
        weight: 75.5,
        unit: 'kg',
        recordedAt: new Date().toISOString(),
        notes: 'To be deleted',
      },
    ];

    await mockApiResponse(page, '**/api/health/weight?limit=30', weights);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 75.5,
      height: 175,
      bloodPressure: null,
      bloodSugar: null,
    });

    await mockApiResponse(page, '**/api/health/weight/weight-to-delete', {}, 200);

    await page.goto('/weight');
    
    // Find and click delete button
    await page.getByRole('button', { name: /Delete/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /Confirm/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Weight deleted successfully/i)).toBeVisible();
  });

  test('should show weight progress statistics', async ({ page }) => {
    const weights = [
      {
        id: 'weight-1',
        userId: 'test-user-id',
        weight: 75.5,
        unit: 'kg',
        recordedAt: new Date().toISOString(),
      },
      {
        id: 'weight-2',
        userId: 'test-user-id',
        weight: 76.0,
        unit: 'kg',
        recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'weight-3',
        userId: 'test-user-id',
        weight: 77.0,
        unit: 'kg',
        recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    await mockApiResponse(page, '**/api/health/weight?limit=30', weights);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 75.5,
      height: 175,
      bloodPressure: null,
      bloodSugar: null,
    });

    await page.goto('/weight');
    
    // Should show current weight
    await expect(page.getByText(/Current Weight/i)).toBeVisible();
    await expect(page.getByText('75.5 kg')).toBeVisible();
    
    // Should show weight change
    await expect(page.getByText(/Week Change/i)).toBeVisible();
    await expect(page.getByText(/-0.5 kg/i)).toBeVisible();
    
    // Should show BMI if height is available
    await expect(page.getByText(/BMI/i)).toBeVisible();
  });

  test('should switch between kg and lbs units', async ({ page }) => {
    await mockApiResponse(page, '**/api/health/weight?limit=30', [
      {
        id: 'weight-1',
        userId: 'test-user-id',
        weight: 75,
        unit: 'kg',
        recordedAt: new Date().toISOString(),
      },
    ]);
    
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 75,
      height: 175,
      bloodPressure: null,
      bloodSugar: null,
    });

    await page.goto('/weight');
    
    // Should show kg by default
    await expect(page.getByText('75 kg')).toBeVisible();
    
    // Find and click unit toggle
    await page.getByRole('button', { name: /lbs/i }).click();
    
    // Should convert and display in lbs (75 kg ≈ 165.3 lbs)
    await expect(page.getByText(/165/)).toBeVisible();
  });
});