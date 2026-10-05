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
const imageWarnings = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('console', (message) => { const value=message.text(); if (message.type() === 'error') consoleErrors.push(value); if (/invalid "position"|Largest Contentful Paint/.test(value)) imageWarnings.push(value); });

const routes = ['/', '/movies', '/tv', '/tv/open-cinema-sessions', '/tv/open-cinema-sessions/season-1/episode-1', '/subtitles', '/discover', '/genres', '/languages', '/about', '/contact', '/takedown', '/login', '/register'];
for (const route of routes) {
  const response = await page.goto(route, { waitUntil: 'networkidle' });
  expect(response?.status(), `${route} should respond successfully`).toBe(200);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.site-footer')).toBeVisible();
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

await page.goto('/admin');
await expect(page).toHaveURL(/\/login\?returnTo=%2Fadmin/);

const viewports = [360, 390, 430, 768, 1024, 1366, 1440, 1920];
for (const width of viewports) {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
  for (const route of ['/']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${route} at ${width}px should respond`).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} at ${width}px should not overflow`).toBe(true);
  }
  if (width < 700) await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
  else await expect(page.locator('.mobile-bottom-nav')).toBeHidden();
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('/', { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(artifactDir, 'home-mobile.png'), fullPage: true });

if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
if (imageWarnings.length) throw new Error(`Image optimization warnings: ${imageWarnings.join(' | ')}`);
const result = { routes: routes.length, viewports, search: true, movieDetail: true, tvDetail: true, episodeDetail: true, auth: true, adminProtection: true, overflow: false, consoleErrors: 0 };
await fs.writeFile(path.join(artifactDir, 'browser-result.json'), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
process.exit(0);
