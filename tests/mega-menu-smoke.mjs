import { chromium, expect } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
});
const context = await browser.newContext({ baseURL:'http://localhost:4001', viewport:{ width:1440, height:900 } });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

const results = [];
for (const viewport of [
  { name:'desktop', width:1440, height:900 },
  { name:'compact', width:1024, height:768 }
]) {
  await page.setViewportSize(viewport);
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  const trigger = page.locator('.category-rail .category-trigger').filter({ hasText:'T-Shirts' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator('.mega-menu')).toBeVisible();
  await expect(page.locator('.mega-menu-head strong')).toHaveText('T-Shirts');
  await expect(page.getByRole('heading', { name:'Available colours' })).toBeVisible();
  await expect(page.locator('.mega-options')).toContainText('Forest');
  await expect(page.locator('.mega-options')).toContainText('Cream');
  await expect(page.locator('.mega-options')).toContainText('Black');
  await expect(page.locator('.mega-feature')).toContainText('T-Shirts');
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    const root = globalThis.document.documentElement;
    const rail = globalThis.document.querySelector('.category-rail')?.getBoundingClientRect();
    const menu = globalThis.document.querySelector('.mega-menu')?.getBoundingClientRect();
    const grid = globalThis.document.querySelector('.mega-menu-grid')?.getBoundingClientRect();
    return {
      overflow: root.scrollWidth - root.clientWidth,
      railBottom: rail?.bottom || 0,
      menuTop: menu?.top || 0,
      menuRight: menu?.right || 0,
      gridRight: grid?.right || 0
    };
  });
  expect(metrics.overflow).toBeLessThanOrEqual(1);
  expect(Math.abs(metrics.menuTop - metrics.railBottom)).toBeLessThanOrEqual(3);
  expect(metrics.gridRight).toBeLessThanOrEqual(metrics.menuRight + 1);
  results.push({ viewport:viewport.name, ...metrics });

  await page.keyboard.press('Escape');
  await expect(page.locator('.mega-menu')).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.locator('.mega-backdrop')).toBeVisible();
  await page.locator('.mega-backdrop').click({ position:{ x:4, y:4 } });
  await expect(page.locator('.mega-menu')).toBeHidden();
}

const desktopScreenshot = path.join(os.tmpdir(), 'stylehub-mega-menu-desktop.png');
await page.setViewportSize({ width:1440, height:900 });
await page.goto('/');
await page.locator('.category-rail .category-trigger').filter({ hasText:'Dresses' }).click();
await expect(page.getByRole('heading', { name:'Available colours' })).toBeVisible();
await page.waitForTimeout(300);
await page.screenshot({ path:desktopScreenshot });

const mobileScreenshot = path.join(os.tmpdir(), 'stylehub-mega-menu-mobile.png');
await page.setViewportSize({ width:390, height:844 });
await page.goto('/');
await expect(page.locator('.category-rail')).toBeHidden();
await page.getByRole('button', { name:'Open navigation' }).click();
await expect(page.locator('#mobile-navigation')).toBeVisible();
const mobileCategory = page.locator('.drawer-category').filter({ hasText:'T-Shirts' });
await mobileCategory.locator('summary').click();
await expect(mobileCategory.getByRole('link', { name:'View all' })).toBeVisible();
const mobileOverflow = await page.evaluate(() => globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth);
expect(mobileOverflow).toBeLessThanOrEqual(1);
await page.screenshot({ path:mobileScreenshot });

if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
process.stdout.write(`${JSON.stringify({ results, screenshots:[desktopScreenshot,mobileScreenshot] }, null, 2)}\n`);
await browser.close();
