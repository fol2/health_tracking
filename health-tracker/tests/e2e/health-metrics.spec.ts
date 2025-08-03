import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';
import { mockApiResponse } from '../helpers/api.helper';

test.describe('Health Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test('should display health metrics page', async ({ page }) => {
    await mockApiResponse(page, '**/api/health/metrics/blood_pressure', []);
    await mockApiResponse(page, '**/api/health/metrics/blood_sugar', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: null,
      bloodSugar: null,
    });

    await page.goto('/health');
    
    await expect(page.getByRole('heading', { name: /Health Metrics/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Blood Pressure/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Blood Sugar/i })).toBeVisible();
  });

  test('should add blood pressure reading', async ({ page }) => {
    await mockApiResponse(page, '**/api/health/metrics/blood_pressure', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: null,
      bloodSugar: null,
    });

    await mockApiResponse(page, '**/api/health/metrics', {
      id: 'new-bp-id',
      userId: 'test-user-id',
      type: 'blood_pressure',
      value: { systolic: 120, diastolic: 80 },
      unit: 'mmHg',
      recordedAt: new Date().toISOString(),
    });

    await page.goto('/health');
    
    // Click blood pressure tab
    await page.getByRole('tab', { name: /Blood Pressure/i }).click();
    
    // Click add button
    await page.getByRole('button', { name: /Add Reading/i }).click();
    
    // Fill in form
    await page.getByLabel(/Systolic/i).fill('120');
    await page.getByLabel(/Diastolic/i).fill('80');
    
    // Submit
    await page.getByRole('button', { name: /Save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Blood pressure recorded/i)).toBeVisible();
  });

  test('should add blood sugar reading', async ({ page }) => {
    await mockApiResponse(page, '**/api/health/metrics/blood_sugar', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: null,
      bloodSugar: null,
    });

    await mockApiResponse(page, '**/api/health/metrics', {
      id: 'new-bs-id',
      userId: 'test-user-id',
      type: 'blood_sugar',
      value: 95,
      unit: 'mg/dL',
      recordedAt: new Date().toISOString(),
      notes: 'Fasting',
    });

    await page.goto('/health');
    
    // Click blood sugar tab
    await page.getByRole('tab', { name: /Blood Sugar/i }).click();
    
    // Click add button
    await page.getByRole('button', { name: /Add Reading/i }).click();
    
    // Fill in form
    await page.getByLabel(/Blood Sugar/i).fill('95');
    await page.getByLabel(/Notes/i).fill('Fasting');
    
    // Submit
    await page.getByRole('button', { name: /Save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Blood sugar recorded/i)).toBeVisible();
  });

  test('should display blood pressure history', async ({ page }) => {
    const bpReadings = [
      {
        id: 'bp-1',
        userId: 'test-user-id',
        type: 'blood_pressure',
        value: { systolic: 120, diastolic: 80 },
        unit: 'mmHg',
        recordedAt: new Date().toISOString(),
      },
      {
        id: 'bp-2',
        userId: 'test-user-id',
        type: 'blood_pressure',
        value: { systolic: 125, diastolic: 82 },
        unit: 'mmHg',
        recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    await mockApiResponse(page, '**/api/health/metrics/blood_pressure', bpReadings);
    await mockApiResponse(page, '**/api/health/metrics/blood_sugar', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: '120/80',
      bloodSugar: null,
    });

    await page.goto('/health');
    
    // Click blood pressure tab
    await page.getByRole('tab', { name: /Blood Pressure/i }).click();
    
    // Should display readings
    await expect(page.getByText('120/80 mmHg')).toBeVisible();
    await expect(page.getByText('125/82 mmHg')).toBeVisible();
  });

  test('should display blood sugar history with status indicators', async ({ page }) => {
    const bsReadings = [
      {
        id: 'bs-1',
        userId: 'test-user-id',
        type: 'blood_sugar',
        value: 95,
        unit: 'mg/dL',
        recordedAt: new Date().toISOString(),
        notes: 'Fasting - Normal',
      },
      {
        id: 'bs-2',
        userId: 'test-user-id',
        type: 'blood_sugar',
        value: 145,
        unit: 'mg/dL',
        recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        notes: 'After meal',
      },
      {
        id: 'bs-3',
        userId: 'test-user-id',
        type: 'blood_sugar',
        value: 210,
        unit: 'mg/dL',
        recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        notes: 'High reading',
      },
    ];

    await mockApiResponse(page, '**/api/health/metrics/blood_pressure', []);
    await mockApiResponse(page, '**/api/health/metrics/blood_sugar', bsReadings);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: null,
      bloodSugar: 95,
    });

    await page.goto('/health');
    
    // Click blood sugar tab
    await page.getByRole('tab', { name: /Blood Sugar/i }).click();
    
    // Should display readings
    await expect(page.getByText('95 mg/dL')).toBeVisible();
    await expect(page.getByText('145 mg/dL')).toBeVisible();
    await expect(page.getByText('210 mg/dL')).toBeVisible();
    
    // Should show notes
    await expect(page.getByText('Fasting - Normal')).toBeVisible();
    await expect(page.getByText('After meal')).toBeVisible();
    await expect(page.getByText('High reading')).toBeVisible();
  });

  test('should display health metrics charts', async ({ page }) => {
    const bpReadings = Array.from({ length: 7 }, (_, i) => ({
      id: `bp-${i}`,
      userId: 'test-user-id',
      type: 'blood_pressure',
      value: {
        systolic: 120 + Math.floor(Math.random() * 10),
        diastolic: 80 + Math.floor(Math.random() * 5),
      },
      unit: 'mmHg',
      recordedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }));

    await mockApiResponse(page, '**/api/health/metrics/blood_pressure', bpReadings);
    await mockApiResponse(page, '**/api/health/metrics/blood_sugar', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: '120/80',
      bloodSugar: null,
    });

    await page.goto('/health');
    
    // Click blood pressure tab
    await page.getByRole('tab', { name: /Blood Pressure/i }).click();
    
    // Should display chart
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    
    // Should have multiple lines (systolic and diastolic)
    const lines = await page.locator('.recharts-line').count();
    expect(lines).toBe(2);
  });

  test('should handle metric deletion', async ({ page }) => {
    const bpReadings = [
      {
        id: 'bp-to-delete',
        userId: 'test-user-id',
        type: 'blood_pressure',
        value: { systolic: 120, diastolic: 80 },
        unit: 'mmHg',
        recordedAt: new Date().toISOString(),
      },
    ];

    await mockApiResponse(page, '**/api/health/metrics/blood_pressure', bpReadings);
    await mockApiResponse(page, '**/api/health/metrics/blood_sugar', []);
    await mockApiResponse(page, '**/api/health/latest', {
      weight: null,
      height: null,
      bloodPressure: '120/80',
      bloodSugar: null,
    });

    await mockApiResponse(page, '**/api/health/metrics/bp-to-delete', {}, 200);

    await page.goto('/health');
    
    // Click blood pressure tab
    await page.getByRole('tab', { name: /Blood Pressure/i }).click();
    
    // Find and click delete button
    await page.getByRole('button', { name: /Delete/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /Confirm/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Metric deleted/i)).toBeVisible();
  });

  test('should show health status indicators', async ({ page }) => {
    await mockApiResponse(page, '**/api/health/metrics/blood_pressure', [
      {
        id: 'bp-1',
        userId: 'test-user-id',
        type: 'blood_pressure',
        value: { systolic: 118, diastolic: 78 },
        unit: 'mmHg',
        recordedAt: new Date().toISOString(),
      },
    ]);
    
    await mockApiResponse(page, '**/api/health/metrics/blood_sugar', [
      {
        id: 'bs-1',
        userId: 'test-user-id',
        type: 'blood_sugar',
        value: 92,
        unit: 'mg/dL',
        recordedAt: new Date().toISOString(),
      },
    ]);
    
    await mockApiResponse(page, '**/api/health/latest', {
      weight: 72,
      height: 175,
      bloodPressure: '118/78',
      bloodSugar: 92,
    });

    await page.goto('/health');
    
    // Should show normal indicators
    await expect(page.getByText(/Normal/i)).toBeVisible();
    
    // Should show latest values
    await expect(page.getByText('118/78')).toBeVisible();
    await expect(page.getByText('92')).toBeVisible();
  });
});