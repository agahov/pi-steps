import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function expectWorldPosition(page: Page, x: number, y: number) {
  // Browser pointer coordinates can be quantized at fractional layout offsets.
  await expect.poll(async () => {
    const text = await page.getByRole('status').textContent();
    const values = text?.match(/^A: \(([^,]+), ([^)]+)\)$/);
    return values ? Math.max(Math.abs(Number(values[1]) - x), Math.abs(Number(values[2]) - y)) : Infinity;
  }).toBeLessThan(0.01);
}

// Inspect browser-composited canvas pixels, not Events or a production test hook.
async function sampleScene(canvas: Locator, points: { x: number; y: number }[]) {
  const screenshot = await canvas.screenshot();
  return canvas.evaluate(async (element, { image, points }) => {
    const bytes = Uint8Array.from(atob(image), char => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const sample = document.createElement('canvas');
    sample.width = bitmap.width;
    sample.height = bitmap.height;
    const context = sample.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    const bounds = element.getBoundingClientRect();
    const colors = points.map(point => [...context.getImageData(
      Math.round(point.x * bitmap.width / bounds.width),
      Math.round(point.y * bitmap.height / bounds.height), 1, 1,
    ).data].slice(0, 3));
    bitmap.close();
    return colors;
  }, { image: screenshot.toString('base64'), points });
}

const objectColor = [56, 189, 248];
const backgroundColor = [24, 33, 47];

for (const source of ['UI', 'Pixi'] as const) {
  test(`moves the actual scene through ${source} input`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    // Default body margin is 8px; the scene starts at x=8 and is 800 CSS pixels wide.
    await page.setViewportSize({ width: 816, height: 1000 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Bootstrap prototype', exact: true })).toBeVisible();
    const button = page.getByRole('button', { name: 'Move A to (30, 40)', exact: true });
    await expect(button).toBeEnabled();
    await expect(page.getByRole('status')).toHaveText('A: (10, 20)');
    const canvas = page.getByTestId('scene').locator('canvas');
    await expect.poll(() => sampleScene(canvas, [{ x: 80, y: 160 }])).toEqual([objectColor]);
    if (source === 'UI') await button.click();
    else await canvas.click({ position: { x: 240, y: 320 } });
    await expectWorldPosition(page, 30, 40);
    await expect.poll(() => sampleScene(canvas, [{ x: 240, y: 320 }, { x: 80, y: 160 }]))
      .toEqual([objectColor, backgroundColor]);
    expect(errors).toEqual([]);
  });
}

test('resize changes Camera projection without changing World Coordinates', async ({ page }) => {
  await page.setViewportSize({ width: 816, height: 1000 });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Move A to (30, 40)', exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  const canvas = page.getByTestId('scene').locator('canvas');
  for (const { width, height, x, y, offset } of [
    { width: 816, height: 1000, x: 240, y: 320, offset: 12 },
    { width: 1216, height: 1000, x: 360, y: 480, offset: 18 },
    { width: 616, height: 1200, x: 180, y: 240, offset: 9 },
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole('status')).toHaveText('A: (30, 40)');
    await expect.poll(() => sampleScene(canvas, [
      { x, y }, { x: x + offset, y }, { x, y: y + offset },
      { x: x + offset * 2, y }, { x, y: y + offset * 2 },
    ])).toEqual([objectColor, objectColor, objectColor, backgroundColor, backgroundColor]);
  }
  // Input remains the inverse of the resized Camera.
  await canvas.click({ position: { x: 180, y: 240 } });
  await expectWorldPosition(page, 30, 40);
});
