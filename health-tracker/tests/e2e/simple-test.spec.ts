import { test, expect } from '@playwright/test';

test('simple demo login test', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('Page error:', error));
  
  try {
    // Navigate to login page directly
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/login-page.png' });
    console.log('Login page loaded');
    
    // Check if we're in demo mode
    const quickLoginButton = await page.getByRole('button', { name: /Quick Demo Login/i }).isVisible();
    console.log('Quick login button visible:', quickLoginButton);
    
    if (quickLoginButton) {
      // Click the quick demo login
      console.log('Clicking Quick Demo Login...');
      await page.getByRole('button', { name: /Quick Demo Login/i }).click();
      
      // Wait for navigation or error
      await page.waitForTimeout(5000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('Current URL after login attempt:', currentUrl);
      
      // Take screenshot after login attempt
      await page.screenshot({ path: 'test-results/after-login.png' });
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Successfully logged in!');
      } else if (currentUrl.includes('/error')) {
        console.log('❌ Login error - redirected to error page');
      } else {
        console.log('⚠️ Still on login page');
      }
    } else {
      console.log('Demo mode not enabled - no Quick Demo Login button found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test-results/error-state.png' });
  }
});