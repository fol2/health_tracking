import { Page } from '@playwright/test';

export async function mockAuthSession(page: Page, user = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  hasProfile: true,
}) {
  await page.addInitScript((user) => {
    // Mock NextAuth session in browser context
    window.sessionStorage.setItem('next-auth.session-token', 'mock-session-token');
    // Mock fetch for session endpoint
    window.fetch = new Proxy(window.fetch, {
      apply: async (target, thisArg, args) => {
        const [url] = args;
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return new Response(JSON.stringify({
            user,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return Reflect.apply(target, thisArg, args);
      },
    });
  }, user);
}

export async function loginUser(page: Page, email: string, password?: string) {
  await page.goto('/login');
  // For Google OAuth mock, we'll need to mock the OAuth flow
  // For now, we'll use the mock session approach
  await mockAuthSession(page, {
    id: 'real-user-id',
    email,
    name: email.split('@')[0],
    hasProfile: true,
  });
  await page.goto('/dashboard');
}

export async function logoutUser(page: Page) {
  await page.goto('/api/auth/signout');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('/login');
}