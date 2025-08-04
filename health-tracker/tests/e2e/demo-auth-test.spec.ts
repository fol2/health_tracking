import { test, expect } from '@playwright/test';

test('demo authentication and basic functionality', async ({ page }) => {
  console.log('\n🧪 Testing demo authentication...\n');
  
  // Go to home page
  await page.goto('http://localhost:3000');
  
  // Click Sign In
  await page.getByRole('link', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/login/);
  
  // Check if demo login is available
  const quickLoginButton = page.getByRole('button', { name: /Quick Demo Login/i });
  await expect(quickLoginButton).toBeVisible();
  
  // Click quick demo login
  await quickLoginButton.click();
  
  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  console.log('✅ Demo authentication successful!');
  
  // Check if we're on dashboard
  await expect(page).toHaveURL(/\/dashboard/);
  
  // Take screenshot of dashboard
  await page.screenshot({ path: 'test-results/dashboard.png' });
  
  console.log('✅ Successfully logged in with demo account!');
});