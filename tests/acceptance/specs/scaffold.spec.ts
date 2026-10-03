import { expect, test } from '@playwright/test';

test('built application starts and handles a setup action', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: String(testInfo.project.metadata.title), exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Scaffold ready');
  await page.getByRole('button', { name: 'Check setup' }).click();
  await expect(page.getByRole('status')).toHaveText('Setup checked');
  expect(errors).toEqual([]);
});
