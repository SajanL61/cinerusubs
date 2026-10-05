import { chromium, expect } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const password = process.argv[2];
if (!password) throw new Error('Temporary demo password argument is required');

const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const context = await browser.newContext({ baseURL:'http://localhost:4001', viewport:{ width:1440, height:900 } });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

await page.goto('/admin/login');
await page.locator('input[name="email"]').fill('owner@demo.local');
await page.locator('input[name="password"]').fill(password);
await page.getByRole('button', { name:/Sign in/ }).click();
await expect(page).toHaveURL(/\/admin$/);

const routes = ['/admin','/admin/products','/admin/products/new','/admin/inventory','/admin/orders','/admin/transactions','/admin/content'];
const results = [];

for (const viewport of [{ width:1440, height:900, name:'desktop' }, { width:1180, height:800, name:'compact' }, { width:390, height:844, name:'mobile' }]) {
  await page.setViewportSize(viewport);
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('.admin-shell')).toBeVisible();
    if (route === '/admin/products/new') {
      await page.getByRole('button', { name:/Add .*variant/ }).click();
      await page.getByRole('button', { name:/Add .*variant/ }).click();
      const bounds = await page.evaluate(() => {
        const form = globalThis.document.querySelector('.product-form')?.getBoundingClientRect();
        const controls = [...globalThis.document.querySelectorAll('.variant-editor input,.variant-editor button')].map(element => element.getBoundingClientRect());
        return { formRight:form?.right || 0, formLeft:form?.left || 0, controls:controls.map(rect => ({ left:rect.left, right:rect.right, width:rect.width })) };
      });
      expect(bounds.controls.every(control => control.left >= bounds.formLeft - 1 && control.right <= bounds.formRight + 1 && control.width > 0)).toBe(true);
    }
    const metrics = await page.evaluate(() => {
      const root = globalThis.document.documentElement;
      const heading = globalThis.document.querySelector('.admin-head h1');
      const label = globalThis.document.querySelector('.admin-shell label');
      const metric = globalThis.document.querySelector('.operations-metric-grid strong,.inventory-metrics strong,.transaction-metrics strong,.metric-grid strong');
      return {
        overflow:root.scrollWidth - root.clientWidth,
        headingFont:heading ? Number.parseFloat(globalThis.getComputedStyle(heading).fontSize) : 0,
        labelFont:label ? Number.parseFloat(globalThis.getComputedStyle(label).fontSize) : 0,
        metricFont:metric ? Number.parseFloat(globalThis.getComputedStyle(metric).fontSize) : 0
      };
    });
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.headingFont).toBeLessThanOrEqual(viewport.name === 'mobile' ? 21 : 24);
    if (metrics.labelFont) expect(metrics.labelFont).toBeLessThanOrEqual(10);
    if (metrics.metricFont) expect(metrics.metricFont).toBeLessThanOrEqual(18);
    results.push({ viewport:viewport.name, route, ...metrics });
  }
}

await page.setViewportSize({ width:1440, height:900 });
await page.goto('/admin/products/new');
await page.getByRole('button', { name:/Add .*variant/ }).click();
await page.screenshot({ path:path.join(os.tmpdir(), 'stylehub-admin-product-editor.png'), fullPage:true });
await page.goto('/admin');
await page.screenshot({ path:path.join(os.tmpdir(), 'stylehub-admin-dashboard-compact.png'), fullPage:true });
await page.setViewportSize({ width:390, height:844 });
await page.goto('/admin/products/new');
await page.getByRole('button', { name:/Add .*variant/ }).click();
await page.locator('.product-form-section').scrollIntoViewIfNeeded();
await page.screenshot({ path:path.join(os.tmpdir(), 'stylehub-admin-product-mobile.png') });

if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
process.stdout.write(`${JSON.stringify({ checks:results.length, routes:routes.length, viewports:3, screenshots:[path.join(os.tmpdir(), 'stylehub-admin-product-editor.png'),path.join(os.tmpdir(), 'stylehub-admin-dashboard-compact.png'),path.join(os.tmpdir(), 'stylehub-admin-product-mobile.png')] }, null, 2)}\n`);
await browser.close();
