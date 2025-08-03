import { Page } from '@playwright/test';

export async function mockApiResponse(page: Page, urlPattern: string | RegExp, response: any, status = 200) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

export async function waitForApiCall(page: Page, urlPattern: string | RegExp) {
  return page.waitForRequest(urlPattern);
}

export async function interceptApiCall(page: Page, urlPattern: string | RegExp, handler: (request: any) => void) {
  page.on('request', (request) => {
    if (typeof urlPattern === 'string' ? request.url().includes(urlPattern) : urlPattern.test(request.url())) {
      handler(request);
    }
  });
}