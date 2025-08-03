import { test, expect } from '@playwright/test';
import { mockAuthSession } from '../helpers/auth.helper';
import { mockApiResponse } from '../helpers/api.helper';

test.describe('Schedule Management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  test('should display schedule page', async ({ page }) => {
    await mockApiResponse(page, '**/api/schedule/fasts', []);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);

    await page.goto('/schedule');
    
    await expect(page.getByRole('heading', { name: /Schedule/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /New Schedule/i })).toBeVisible();
  });

  test('should create a one-time scheduled fast', async ({ page }) => {
    await mockApiResponse(page, '**/api/schedule/fasts', []);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);
    
    await mockApiResponse(page, '**/api/schedule/fasts', {
      id: 'new-schedule-id',
      userId: 'test-user-id',
      name: 'Weekend Fast',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      targetHours: 24,
      isRecurring: false,
      recurringPattern: null,
      isActive: true,
      reminders: {
        start: true,
        beforeEnd: true,
      },
    });

    await page.goto('/schedule');
    
    // Click new schedule button
    await page.getByRole('button', { name: /New Schedule/i }).click();
    
    // Fill in form
    await page.getByLabel(/Name/i).fill('Weekend Fast');
    await page.getByLabel(/Target Hours/i).fill('24');
    
    // Set date/time (simplified for test)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await page.getByLabel(/Start Date/i).fill(tomorrow.toISOString().split('T')[0]);
    await page.getByLabel(/Start Time/i).fill('08:00');
    
    // Enable reminders
    await page.getByLabel(/Reminder at start/i).check();
    await page.getByLabel(/Reminder before end/i).check();
    
    // Submit
    await page.getByRole('button', { name: /Save Schedule/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Schedule created/i)).toBeVisible();
  });

  test('should create a recurring scheduled fast', async ({ page }) => {
    await mockApiResponse(page, '**/api/schedule/fasts', []);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);
    
    await mockApiResponse(page, '**/api/schedule/fasts', {
      id: 'recurring-schedule-id',
      userId: 'test-user-id',
      name: 'Daily 16:8',
      startTime: new Date().toISOString(),
      targetHours: 16,
      isRecurring: true,
      recurringPattern: {
        frequency: 'daily',
        interval: 1,
        daysOfWeek: [],
        endDate: null,
      },
      isActive: true,
      reminders: {
        start: true,
        beforeEnd: false,
      },
    });

    await page.goto('/schedule');
    
    // Click new schedule button
    await page.getByRole('button', { name: /New Schedule/i }).click();
    
    // Fill in form
    await page.getByLabel(/Name/i).fill('Daily 16:8');
    await page.getByLabel(/Target Hours/i).fill('16');
    
    // Enable recurring
    await page.getByLabel(/Recurring/i).check();
    
    // Select daily frequency
    await page.getByLabel(/Frequency/i).selectOption('daily');
    
    // Set start time
    await page.getByLabel(/Start Time/i).fill('20:00');
    
    // Submit
    await page.getByRole('button', { name: /Save Schedule/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Schedule created/i)).toBeVisible();
  });

  test('should display scheduled fasts', async ({ page }) => {
    const schedules = [
      {
        id: 'schedule-1',
        userId: 'test-user-id',
        name: 'Morning Fast',
        startTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        targetHours: 16,
        isRecurring: false,
        recurringPattern: null,
        isActive: true,
        reminders: { start: true, beforeEnd: true },
      },
      {
        id: 'schedule-2',
        userId: 'test-user-id',
        name: 'Weekly 24h',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        targetHours: 24,
        isRecurring: true,
        recurringPattern: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1], // Monday
          endDate: null,
        },
        isActive: true,
        reminders: { start: true, beforeEnd: false },
      },
    ];

    await mockApiResponse(page, '**/api/schedule/fasts', schedules);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', schedules);

    await page.goto('/schedule');
    
    // Should display scheduled fasts
    await expect(page.getByText('Morning Fast')).toBeVisible();
    await expect(page.getByText('16 hours')).toBeVisible();
    
    await expect(page.getByText('Weekly 24h')).toBeVisible();
    await expect(page.getByText('24 hours')).toBeVisible();
    
    // Should show recurring indicator
    await expect(page.getByText(/Weekly/i)).toBeVisible();
  });

  test('should toggle schedule active status', async ({ page }) => {
    const schedule = {
      id: 'toggle-schedule-id',
      userId: 'test-user-id',
      name: 'Test Schedule',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      targetHours: 16,
      isRecurring: false,
      recurringPattern: null,
      isActive: true,
      reminders: { start: true, beforeEnd: false },
    };

    await mockApiResponse(page, '**/api/schedule/fasts', [schedule]);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', [schedule]);
    
    await mockApiResponse(page, '**/api/schedule/fasts/toggle-schedule-id', {
      ...schedule,
      isActive: false,
    });

    await page.goto('/schedule');
    
    // Find and click toggle switch
    await page.getByRole('switch').click();
    
    // Should show success message
    await expect(page.getByText(/Schedule updated/i)).toBeVisible();
  });

  test('should delete a scheduled fast', async ({ page }) => {
    const schedule = {
      id: 'delete-schedule-id',
      userId: 'test-user-id',
      name: 'To Delete',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      targetHours: 16,
      isRecurring: false,
      recurringPattern: null,
      isActive: true,
      reminders: { start: false, beforeEnd: false },
    };

    await mockApiResponse(page, '**/api/schedule/fasts', [schedule]);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', [schedule]);
    
    await mockApiResponse(page, '**/api/schedule/fasts/delete-schedule-id', {}, 200);

    await page.goto('/schedule');
    
    // Find and click delete button
    await page.getByRole('button', { name: /Delete/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /Confirm/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Schedule deleted/i)).toBeVisible();
  });

  test('should display calendar view with scheduled fasts', async ({ page }) => {
    const today = new Date();
    const schedules = [
      {
        id: 'today-schedule',
        userId: 'test-user-id',
        name: 'Today Fast',
        startTime: today.toISOString(),
        targetHours: 16,
        isRecurring: false,
        recurringPattern: null,
        isActive: true,
        reminders: { start: true, beforeEnd: false },
      },
      {
        id: 'future-schedule',
        userId: 'test-user-id',
        name: 'Future Fast',
        startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        targetHours: 24,
        isRecurring: false,
        recurringPattern: null,
        isActive: true,
        reminders: { start: true, beforeEnd: true },
      },
    ];

    await mockApiResponse(page, '**/api/schedule/fasts', schedules);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', schedules);

    await page.goto('/schedule');
    
    // Should show calendar
    await expect(page.locator('.calendar-container')).toBeVisible();
    
    // Should highlight dates with scheduled fasts
    const todayDate = today.getDate().toString();
    const todayCell = page.locator(`[aria-label*="${todayDate}"]`).first();
    await expect(todayCell).toHaveClass(/has-event/);
  });

  test('should show upcoming fasts notification', async ({ page }) => {
    const upcomingFast = {
      id: 'upcoming-fast-id',
      userId: 'test-user-id',
      name: 'Starting Soon',
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      targetHours: 16,
      isRecurring: false,
      recurringPattern: null,
      isActive: true,
      reminders: { start: true, beforeEnd: false },
    };

    await mockApiResponse(page, '**/api/schedule/fasts', [upcomingFast]);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', [upcomingFast]);

    await page.goto('/schedule');
    
    // Should show upcoming fast alert
    await expect(page.getByText(/Starting Soon/i)).toBeVisible();
    await expect(page.getByText(/starts in/i)).toBeVisible();
  });

  test('should handle auto-start for scheduled fasts', async ({ page }) => {
    const autoStartFast = {
      id: 'auto-start-id',
      userId: 'test-user-id',
      name: 'Auto Start Fast',
      startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      targetHours: 16,
      isRecurring: false,
      recurringPattern: null,
      isActive: true,
      reminders: { start: true, beforeEnd: false },
      autoStart: true,
    };

    await mockApiResponse(page, '**/api/schedule/fasts', [autoStartFast]);
    await mockApiResponse(page, '**/api/schedule/fasts/upcoming', []);
    
    await mockApiResponse(page, '**/api/fasting/start', {
      id: 'auto-started-session',
      userId: 'test-user-id',
      startTime: autoStartFast.startTime,
      targetHours: 16,
      status: 'active',
      scheduledFastId: 'auto-start-id',
    });

    await page.goto('/schedule');
    
    // Wait for auto-start to trigger
    await page.waitForTimeout(1000);
    
    // Should show notification about auto-started fast
    await expect(page.getByText(/Auto Start Fast has started/i)).toBeVisible();
  });
});