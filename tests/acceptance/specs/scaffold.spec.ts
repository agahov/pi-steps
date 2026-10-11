import { expect, test } from '@playwright/test';

test('starts the empty Match-3 application without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Match-3', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('World created. No archetypes or systems configured.');
  expect(errors).toEqual([]);
});
