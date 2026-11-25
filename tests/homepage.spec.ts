import { test, expect } from '@playwright/test';

test('public homepage loads with a title and visible content', async ({ page }) => {
  const response = await page.goto('./', { waitUntil: 'domcontentloaded' });

  expect(response, 'Homepage navigation should return an HTTP response').not.toBeNull();
  expect(response!.ok(), 'Homepage should return a successful HTTP status').toBeTruthy();
  await expect(page).toHaveTitle(/\S/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).toHaveText(/\S/);
});
