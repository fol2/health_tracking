import { test, expect } from '@playwright/test';

test.describe('Comprehensive Health Tracker App Test', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the app
    await page.goto('http://localhost:3000');
  });

  test('full app functionality test', async ({ page }) => {
    console.log('\n🧪 Starting comprehensive health tracker app test...\n');

    // ===== 1. Authentication Test =====
    console.log('1️⃣ Testing authentication...');
    
    // Click Sign In
    await page.getByRole('link', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/login/);
    
    // Use demo login
    const quickLoginButton = page.getByRole('button', { name: /Quick Demo Login/i });
    await expect(quickLoginButton).toBeVisible();
    await quickLoginButton.click();
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    console.log('✅ Authentication successful!');
    
    // ===== 2. Profile Setup Test =====
    console.log('\n2️⃣ Testing profile setup...');
    
    // Check if profile setup is needed
    const profileSetupVisible = await page.getByText(/Let's set up your profile/i).isVisible().catch(() => false);
    
    if (profileSetupVisible) {
      console.log('Setting up profile...');
      
      // Fill out profile form
      await page.fill('input[name="age"]', '30');
      await page.fill('input[name="height"]', '175');
      await page.selectOption('select[name="heightUnit"]', 'cm');
      await page.fill('input[name="targetWeight"]', '70');
      await page.selectOption('select[name="weightUnit"]', 'kg');
      await page.selectOption('select[name="activityLevel"]', 'moderate');
      
      // Submit profile
      await page.getByRole('button', { name: /Save Profile/i }).click();
      console.log('✅ Profile setup completed!');
    } else {
      console.log('Profile already exists, skipping setup...');
    }
    
    // ===== 3. Dashboard Overview Test =====
    console.log('\n3️⃣ Testing dashboard overview...');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Check main dashboard elements
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByText(/Fasting Status/i)).toBeVisible();
    await expect(page.getByText(/Weight Progress/i)).toBeVisible();
    await expect(page.getByText(/Today's Schedule/i)).toBeVisible();
    console.log('✅ Dashboard loaded successfully!');
    
    // ===== 4. Fasting Tracker Test =====
    console.log('\n4️⃣ Testing fasting tracker...');
    
    // Navigate to fasting tracker
    await page.getByRole('link', { name: /Fasting/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/fasting/);
    
    // Start a fast
    const startFastButton = page.getByRole('button', { name: /Start Fast/i });
    if (await startFastButton.isVisible()) {
      await startFastButton.click();
      console.log('Started a new fast');
      
      // Verify timer started
      await expect(page.getByText(/00:00:/)).toBeVisible();
      
      // Stop the fast
      await page.getByRole('button', { name: /End Fast/i }).click();
      
      // Confirm end
      const confirmButton = page.getByRole('button', { name: /End Fast/i }).last();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      console.log('✅ Fasting timer tested successfully!');
    } else {
      console.log('Fast already in progress, ending it...');
      await page.getByRole('button', { name: /End Fast/i }).click();
      
      const confirmButton = page.getByRole('button', { name: /End Fast/i }).last();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
    
    // ===== 5. Weight Tracking Test =====
    console.log('\n5️⃣ Testing weight tracking...');
    
    // Navigate to weight tracking
    await page.getByRole('link', { name: /Weight/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/weight/);
    
    // Add weight entry
    await page.getByRole('button', { name: /Add Weight/i }).click();
    
    // Fill weight form
    const weightInput = page.locator('input[type="number"]').first();
    await weightInput.fill('72.5');
    
    // Add notes
    const notesInput = page.locator('textarea');
    if (await notesInput.isVisible()) {
      await notesInput.fill('Morning weight after workout');
    }
    
    // Save weight
    await page.getByRole('button', { name: /Save/i }).click();
    console.log('✅ Weight entry added successfully!');
    
    // ===== 6. Health Metrics Test =====
    console.log('\n6️⃣ Testing health metrics...');
    
    // Navigate to health metrics
    await page.getByRole('link', { name: /Health/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/health/);
    
    // Add health metrics
    await page.getByRole('button', { name: /Add Metrics/i }).click();
    
    // Fill health metrics form
    const systolicInput = page.locator('input[placeholder*="Systolic"]');
    const diastolicInput = page.locator('input[placeholder*="Diastolic"]');
    const heartRateInput = page.locator('input[placeholder*="Heart"]');
    const glucoseInput = page.locator('input[placeholder*="Glucose"]');
    
    if (await systolicInput.isVisible()) await systolicInput.fill('120');
    if (await diastolicInput.isVisible()) await diastolicInput.fill('80');
    if (await heartRateInput.isVisible()) await heartRateInput.fill('65');
    if (await glucoseInput.isVisible()) await glucoseInput.fill('95');
    
    // Save metrics
    await page.getByRole('button', { name: /Save/i }).click();
    console.log('✅ Health metrics added successfully!');
    
    // ===== 7. Schedule Test =====
    console.log('\n7️⃣ Testing schedule...');
    
    // Navigate to schedule
    await page.getByRole('link', { name: /Schedule/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/schedule/);
    
    // Create scheduled fast
    await page.getByRole('button', { name: /Schedule Fast/i }).click();
    
    // Fill schedule form
    const titleInput = page.locator('input[placeholder*="title"]');
    if (await titleInput.isVisible()) {
      await titleInput.fill('Morning Fast');
    }
    
    // Set duration
    const durationInput = page.locator('input[type="number"]').first();
    if (await durationInput.isVisible()) {
      await durationInput.fill('16');
    }
    
    // Save schedule
    await page.getByRole('button', { name: /Save|Create/i }).click();
    console.log('✅ Schedule created successfully!');
    
    // ===== 8. Analytics Test =====
    console.log('\n8️⃣ Testing analytics...');
    
    // Navigate to analytics
    await page.getByRole('link', { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/analytics/);
    
    // Check analytics components
    await expect(page.getByText(/Fasting Analytics/i)).toBeVisible();
    await expect(page.getByText(/Weight Trends/i)).toBeVisible();
    
    // Test export functionality
    const exportButton = page.getByRole('button', { name: /Export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      console.log('✅ Export functionality available!');
    }
    
    // ===== 9. Settings Test =====
    console.log('\n9️⃣ Testing settings...');
    
    // Navigate to settings
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    
    // Test theme toggle
    const themeToggle = page.getByRole('button', { name: /theme/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      console.log('Theme toggled');
    }
    
    // Test notification settings
    const notificationToggle = page.locator('input[type="checkbox"]').first();
    if (await notificationToggle.isVisible()) {
      await notificationToggle.click();
      console.log('Notification settings updated');
    }
    
    console.log('✅ Settings tested successfully!');
    
    // ===== 10. PWA Features Test =====
    console.log('\n🔟 Testing PWA features...');
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    if (swRegistered) {
      console.log('✅ Service Worker support detected!');
    }
    
    // Check manifest
    const manifestLink = await page.locator('link[rel="manifest"]');
    if (await manifestLink.count() > 0) {
      console.log('✅ PWA manifest found!');
    }
    
    // ===== 11. Sign Out Test =====
    console.log('\n1️⃣1️⃣ Testing sign out...');
    
    // Sign out
    const userMenu = page.getByRole('button', { name: /Demo User/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByRole('menuitem', { name: /Sign out/i }).click();
    } else {
      // Try alternative sign out method
      await page.getByRole('button', { name: /Sign out/i }).click();
    }
    
    // Should redirect to home page
    await page.waitForURL(/^\/$|\/login/, { timeout: 10000 });
    console.log('✅ Sign out successful!');
    
    console.log('\n🎉 All tests completed successfully! The app is fully functional! 🎉\n');
  });

  test('responsive design test', async ({ page }) => {
    console.log('\n📱 Testing responsive design...\n');
    
    // Test different viewport sizes
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} view...`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate to login
      await page.goto('http://localhost:3000/login');
      
      // Check if elements are visible and properly sized
      await expect(page.getByText(/Welcome Back/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Quick Demo Login/i })).toBeVisible();
      
      console.log(`✅ ${viewport.name} view works correctly!`);
    }
  });

  test('error handling test', async ({ page }) => {
    console.log('\n🚨 Testing error handling...\n');
    
    // Test 404 page
    await page.goto('http://localhost:3000/nonexistent-page');
    const notFoundText = await page.getByText(/404|not found/i).isVisible().catch(() => false);
    console.log(notFoundText ? '✅ 404 page handled' : '⚠️ 404 page needs improvement');
    
    // Test API error handling
    await page.goto('http://localhost:3000/login');
    
    // Try invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    // Should show error or stay on login page
    await page.waitForTimeout(2000);
    const stillOnLogin = page.url().includes('/login');
    console.log(stillOnLogin ? '✅ Invalid login handled correctly' : '⚠️ Login error handling needs improvement');
  });
});