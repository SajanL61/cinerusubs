import { chromium, expect } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
});
const context = await browser.newContext({
  baseURL: 'http://localhost:4001',
  viewport: { width: 1440, height: 900 }
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

const routes = [
  { path: '/shop', title: 'Shop all' },
  { path: '/shop?category=t-shirts', title: 'T-Shirts', category: true },
  { path: '/shop?sale=true', title: 'Sale' },
  { path: '/shop?q=shirt', title: 'Search results', filtersOpen: true }
];
const checks = [];

for (const viewport of [
  { width: 1440, height: 900, name: 'desktop' },
  { width: 390, height: 844, name: 'mobile' }
]) {
  await page.setViewportSize(viewport);

  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('.shop-banner')).toHaveCount(0);
    await expect(page.locator('.shop-compact-head h1')).toHaveText(route.title);
    await page.locator('.product-grid,.shop-empty').first().waitFor();

    if (route.category) {
      await expect(page.locator('.shop-category-tabs [aria-current="page"]')).toHaveText(route.title);
      await expect(page.locator('.category-rail [aria-current="page"]')).toHaveText(route.title);
      await expect(page.locator('.category-rail [aria-current="page"]')).toHaveClass(/is-current/);
      const panel = page.locator('.shop-filter-panel');
      expect(await panel.evaluate(element => element.hasAttribute('open'))).toBe(false);
      await panel.locator('summary').click();
      await expect(page.locator('.shop-filter-body')).toBeVisible();
      await expect(page.locator('.active-filters')).toContainText(route.title);
      await panel.locator('summary').click();
      await expect(page.locator('.shop-filter-body')).toBeHidden();
    }
    if (route.filtersOpen) expect(await page.locator('.shop-filter-panel').evaluate(element => element.hasAttribute('open'))).toBe(true);

    const metrics = await page.evaluate(() => {
      const root = globalThis.document.documentElement;
      const header = globalThis.document.querySelector('.storefront-header')?.getBoundingClientRect();
      const compactHead = globalThis.document.querySelector('.shop-compact-head')?.getBoundingClientRect();
      const results = globalThis.document.querySelector('.product-grid,.shop-empty')?.getBoundingClientRect();
      return {
        overflow: root.scrollWidth - root.clientWidth,
        compactHeadHeight: compactHead?.height ?? 0,
        resultsTop: results?.top ?? 0,
        resultsGap: header && results ? results.top - header.bottom : 0,
        countText: globalThis.document.querySelector('.shop-count')?.textContent?.trim() ?? ''
      };
    });

    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.compactHeadHeight).toBeLessThanOrEqual(viewport.name === 'mobile' ? 70 : 80);
    const maximumGap = route.filtersOpen ? (viewport.name === 'mobile' ? 350 : 270) : (viewport.name === 'mobile' ? 200 : 190);
    const maximumTop = route.filtersOpen ? (viewport.name === 'mobile' ? 440 : 410) : (viewport.name === 'mobile' ? 300 : 330);
    expect(metrics.resultsGap).toBeLessThanOrEqual(maximumGap);
    expect(metrics.resultsTop).toBeLessThanOrEqual(maximumTop);
    expect(metrics.countText).not.toMatch(/1\s*pieces/i);
    checks.push({ viewport: viewport.name, route: route.path, ...metrics });
  }
}

const desktopScreenshot = path.join(os.tmpdir(), 'stylehub-shop-category-desktop.png');
const mobileScreenshot = path.join(os.tmpdir(), 'stylehub-shop-category-mobile.png');
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('/shop?category=t-shirts');
await page.locator('.product-grid,.shop-empty').first().waitFor();
await page.screenshot({ path: desktopScreenshot, fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('/shop?category=t-shirts');
await page.locator('.product-grid,.shop-empty').first().waitFor();
await page.screenshot({ path: mobileScreenshot, fullPage: true });

if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
process.stdout.write(`${JSON.stringify({ checks, screenshots: [desktopScreenshot, mobileScreenshot] }, null, 2)}\n`);
await browser.close();
