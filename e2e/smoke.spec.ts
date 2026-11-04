import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

async function savedCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('sketchroom:scene:v1');
    return raw === null ? 0 : JSON.parse(raw).elements.length;
  });
}

test('each tool draws a shape with the mouse, a reload keeps them, PNG export downloads a file, nothing leaves 127.0.0.1', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  page.on('websocket', (socket) => urls.push(socket.url()));

  await page.goto('/');
  const board = page.getByTestId('board');
  await expect(board).toBeVisible();
  await expect(page.getByTestId('empty-hint')).toBeVisible();
  const box = (await board.boundingBox())!;

  async function dragOnBoard(points: [number, number][]) {
    const [[x0, y0], ...rest] = points;
    await page.mouse.move(box.x + x0, box.y + y0);
    await page.mouse.down();
    for (const [x, y] of rest) await page.mouse.move(box.x + x, box.y + y, { steps: 5 });
    await page.mouse.up();
  }

  const drags: [string, string, [number, number][]][] = [
    ['Rectangle', 'rect', [[40, 40], [160, 110]]],
    ['Diamond', 'diamond', [[200, 40], [320, 110]]],
    ['Ellipse', 'ellipse', [[360, 40], [480, 110]]],
    ['Arrow', 'arrow', [[40, 180], [160, 250]]],
    ['Line', 'line', [[200, 180], [320, 250]]],
    ['Freehand', 'polyline', [[360, 180], [400, 230], [440, 190], [480, 250]]],
  ];
  for (const [label, type, points] of drags) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await dragOnBoard(points);
    await expect(board.locator(`[data-type="${type}"] path`).first()).toBeVisible();
  }

  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.mouse.click(box.x + 40, box.y + 320);
  const input = page.getByTestId('text-input');
  await input.fill('Hello board');
  await input.press('Enter');
  await expect(board.locator('[data-type="text"] text')).toHaveText('Hello board');

  const types = ['rect', 'diamond', 'ellipse', 'arrow', 'line', 'polyline', 'text'];
  await expect(board.locator('[data-id]')).toHaveCount(7);
  await expect(page.getByTestId('empty-hint')).toHaveCount(0);

  // autosave writes 300 ms after the last change
  await expect.poll(() => savedCount(page)).toBe(7);
  await page.reload();
  await expect(board.locator('[data-id]')).toHaveCount(7);
  for (const type of types) {
    await expect(board.locator(`[data-type="${type}"]`), type).toHaveCount(1);
  }
  await expect(board.locator('[data-type="text"] text')).toHaveText('Hello board');

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const png = readFileSync(await download.path());
  expect(png.length).toBeGreaterThan(PNG_SIGNATURE.length);
  expect([...png.subarray(0, PNG_SIGNATURE.length)]).toEqual(PNG_SIGNATURE);

  // the bundled handwriting font is served by the app itself
  await expect.poll(() => urls.some((url) => /caveat-latin-400-normal\.woff2?$/.test(url))).toBe(true);
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    expect(url).toMatch(/^((http|ws):\/\/127\.0\.0\.1:4321\/|blob:http:\/\/127\.0\.0\.1:4321\/|data:)/);
  }
});
