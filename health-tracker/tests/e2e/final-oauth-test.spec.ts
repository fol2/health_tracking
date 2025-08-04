import { test, expect } from '@playwright/test';

test.describe('Final OAuth Test', () => {
  test('verify OAuth is working', async ({ page }) => {
    console.log('\n=== Testing OAuth after fixes ===\n');
    
    // Navigate to the app
    await page.goto('https://health-tracker-neon.vercel.app');
    
    // Click Sign In
    await page.getByRole('link', { name: /Sign In/i }).click();
    
    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Click Google login button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();
    
    // Click and check redirect
    const [response] = await Promise.all([
      page.waitForNavigation({ url: /accounts\.google\.com|error/ }),
      googleButton.click()
    ]);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    if (finalUrl.includes('accounts.google.com') && !finalUrl.includes('error')) {
      console.log('✅ SUCCESS! OAuth is working correctly!');
      console.log('The app successfully redirected to Google login page.');
      expect(finalUrl).toContain('accounts.google.com');
      expect(finalUrl).not.toContain('error');
    } else if (finalUrl.includes('error')) {
      console.log('❌ FAILED! Still getting OAuth error');
      const errorParams = new URL(finalUrl).searchParams;
      console.log('Error details:', Object.fromEntries(errorParams));
      throw new Error('OAuth still not working');
    }
  });
});