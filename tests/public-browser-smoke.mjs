import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4001';
const artifactDir = path.resolve('.artifacts');
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
});
const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

for (const route of ['/', '/movies', '/tv', '/subtitles', '/discover', '/about', '/contact', '/takedown']) {
  const response = await page.goto(route, { waitUntil: 'networkidle' });
  expect(response?.status(), `${route} should respond successfully`).toBe(200);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} should not overflow`).toBe(true);
}

await page.goto('/');
await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
await page.locator('.search-trigger').click();
await page.waitForTimeout(300);
if (await page.locator('.search-overlay').count() === 0) throw new Error(`Search did not open: ${JSON.stringify({ pageErrors, consoleErrors })}`);
await expect(page.locator('.search-overlay')).toBeVisible();
await page.getByRole('textbox', { name: 'Search' }).fill('Sintel');
await expect(page.getByText('Sintel', { exact: true }).first()).toBeVisible();
await page.keyboard.press('Escape');
await page.screenshot({ path: path.join(artifactDir, 'home-desktop.png'), fullPage: true });

await page.goto('/movies/sintel-2010');
await expect(page.getByRole('heading', { level: 1, name: 'Sintel' })).toBeVisible();
await expect(page.getByText('Full media is not available from CineruSubs')).toBeVisible();
await expect(page.getByRole('heading', { name: 'Subtitles' })).toBeVisible();
await page.screenshot({ path: path.join(artifactDir, 'movie-desktop.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('/', { waitUntil: 'networkidle' });
await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
await page.screenshot({ path: path.join(artifactDir, 'home-mobile.png'), fullPage: true });

if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
process.stdout.write(`${JSON.stringify({ routes: 8, search: true, movieDetail: true, desktopOverflow: false, mobileOverflow: false }, null, 2)}\n`);
await browser.close();
