import { test, expect } from '@playwright/test';

test.describe('OAuth Login Test', () => {
  const baseURL = 'https://health-tracker-neon.vercel.app';
  
  test('check OAuth configuration and login flow', async ({ page }) => {
    console.log('\n=== Starting OAuth Test ===\n');
    
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Check if login page loads correctly
    const loginPageTitle = await page.title();
    console.log('Login page title:', loginPageTitle);
    
    // Find Google login button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    const buttonExists = await googleButton.isVisible();
    console.log('Google login button found:', buttonExists);
    
    if (buttonExists) {
      // Get the OAuth URL that will be called
      const [oauthRequest] = await Promise.all([
        page.waitForRequest(request => 
          request.url().includes('accounts.google.com') || 
          request.url().includes('/api/auth/signin/google') ||
          request.url().includes('/api/auth/providers')
        ),
        googleButton.click()
      ]);
      
      console.log('\n=== OAuth Request Details ===');
      console.log('OAuth URL:', oauthRequest.url());
      console.log('Method:', oauthRequest.method());
      
      // Check if we get redirected to Google
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log('Current URL after click:', currentUrl);
      
      // Check for OAuth error parameters
      if (currentUrl.includes('error')) {
        const url = new URL(currentUrl);
        console.log('\n=== OAuth Error Found ===');
        console.log('Error params:', url.searchParams.toString());
        
        // Try to get error details from page
        const errorText = await page.textContent('body');
        console.log('Page content:', errorText?.substring(0, 500));
      }
      
      // Check response headers and status
      const response = await page.goto(currentUrl);
      if (response) {
        console.log('\n=== Response Details ===');
        console.log('Status:', response.status());
        console.log('Status text:', response.statusText());
      }
    }
  });
  
  test('check API auth endpoints', async ({ page }) => {
    console.log('\n=== Checking Auth API Endpoints ===\n');
    
    // Check providers endpoint
    const providersResponse = await page.goto(`${baseURL}/api/auth/providers`);
    if (providersResponse && providersResponse.ok()) {
      const providers = await providersResponse.json();
      console.log('Available providers:', JSON.stringify(providers, null, 2));
    } else {
      console.log('Providers endpoint status:', providersResponse?.status());
    }
    
    // Check CSRF token endpoint
    const csrfResponse = await page.goto(`${baseURL}/api/auth/csrf`);
    if (csrfResponse && csrfResponse.ok()) {
      const csrf = await csrfResponse.json();
      console.log('CSRF token available:', !!csrf.csrfToken);
    }
    
    // Check session endpoint
    const sessionResponse = await page.goto(`${baseURL}/api/auth/session`);
    if (sessionResponse && sessionResponse.ok()) {
      const session = await sessionResponse.json();
      console.log('Session status:', session);
    }
  });
  
  test('verify OAuth redirect URIs', async ({ page }) => {
    console.log('\n=== Verifying OAuth Configuration ===\n');
    
    // Navigate to login and intercept OAuth request
    await page.goto(`${baseURL}/login`);
    
    // Set up request interception
    page.on('request', request => {
      if (request.url().includes('accounts.google.com/oauth')) {
        const url = new URL(request.url());
        console.log('\n=== Google OAuth Request Parameters ===');
        console.log('Client ID:', url.searchParams.get('client_id'));
        console.log('Redirect URI:', url.searchParams.get('redirect_uri'));
        console.log('Response Type:', url.searchParams.get('response_type'));
        console.log('Scope:', url.searchParams.get('scope'));
      }
    });
    
    // Try to click Google button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    if (await googleButton.isVisible()) {
      await googleButton.click({ force: true });
      await page.waitForTimeout(3000);
    }
  });
});