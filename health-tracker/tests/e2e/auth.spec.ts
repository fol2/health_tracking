import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should display login page with Google sign-in button', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: /Health Tracker/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
  });

  test('should show login page elements correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Health Tracker/i })).toBeVisible();
    
    // Check description text
    await expect(page.getByText(/Track your health metrics/i)).toBeVisible();
    
    // Check Google sign-in button
    const signInButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('should handle dark mode toggle on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /Toggle theme/i });
    
    // Check initial state
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('class');
    
    // Toggle theme
    await themeToggle.click();
    
    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should redirect to profile setup for new users', async ({ page }) => {
    // Mock auth session with hasProfile: false
    await page.addInitScript(() => {
      window.sessionStorage.setItem('next-auth.session-token', 'mock-session-token');
      window.fetch = new Proxy(window.fetch, {
        apply: async (target, thisArg, args) => {
          const [url] = args;
          if (typeof url === 'string' && url.includes('/api/auth/session')) {
            return new Response(JSON.stringify({
              user: {
                id: 'new-user-id',
                email: 'newuser@example.com',
                name: 'New User',
                hasProfile: false,
              },
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return Reflect.apply(target, thisArg, args);
        },
      });
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL('/profile/setup');
  });

  test('should allow authenticated users to access dashboard', async ({ page }) => {
    // Mock auth session with hasProfile: true
    await page.addInitScript(() => {
      window.sessionStorage.setItem('next-auth.session-token', 'mock-session-token');
      window.fetch = new Proxy(window.fetch, {
        apply: async (target, thisArg, args) => {
          const [url] = args;
          if (typeof url === 'string' && url.includes('/api/auth/session')) {
            return new Response(JSON.stringify({
              user: {
                id: 'existing-user-id',
                email: 'user@example.com',
                name: 'Existing User',
                hasProfile: true,
              },
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return Reflect.apply(target, thisArg, args);
        },
      });
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });
});