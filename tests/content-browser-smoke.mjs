import { chromium, expect } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const password = process.argv[2];
if (!password) throw new Error('Temporary demo password argument is required');

const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const context = await browser.newContext({ baseURL:'http://localhost:4001', viewport:{ width:1440, height:1000 } });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

const contentPages = {
  about:'Our story', contact:'Contact us', delivery:'Delivery information', returns:'Returns and exchanges',
  'size-guide':'Size guide', faq:'Frequently asked questions', privacy:'Privacy notice', terms:'Terms and conditions'
};

for (const [route, title] of Object.entries(contentPages)) {
  const response = await page.goto(`/${route}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name:title, level:1 })).toBeVisible();
  await expect(page.locator('.content-body')).not.toBeEmpty();
  await expect(page.locator('footer')).toBeVisible();
}

await page.goto('/contact');
await page.locator('input[name="name"]').fill('Content Test Customer');
await page.locator('input[name="email"]').fill('content-test@example.com');
await page.locator('textarea[name="message"]').fill('Please help me choose the correct size for the classic T-shirt.');
await page.getByRole('button', { name:'Send enquiry' }).click();
await expect(page.getByText('Your enquiry has been received by the store team.')).toBeVisible();

await page.goto('/about');
await page.waitForTimeout(550);
await page.screenshot({ path:path.join(os.tmpdir(), 'stylehub-content-desktop.png'), fullPage:true });
expect(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.window.innerWidth)).toBe(true);

await page.goto('/admin/login');
await page.locator('input[name="email"]').fill('owner@demo.local');
await page.locator('input[name="password"]').fill(password);
await page.getByRole('button', { name:/Sign in/ }).click();
await expect(page).toHaveURL(/\/admin$/);
await page.goto('/admin/content');
await expect(page.getByRole('heading', { name:'Website content' })).toBeVisible();
await expect(page.locator('.content-doc-list nav button')).toHaveCount(8);
await page.screenshot({ path:path.join(os.tmpdir(), 'stylehub-content-admin.png'), fullPage:true });
const bodyField = page.locator('.content-body-field textarea');
const originalBody = await bodyField.inputValue();
const verificationLine = 'Browser verification confirms that owner publishing works.';
await bodyField.fill(`${originalBody}\n\n${verificationLine}`);
await page.getByRole('button', { name:'Publish changes' }).click();
await expect(page.getByText('Changes are live on the storefront.')).toBeVisible();
await page.goto('/about');
await expect(page.getByText(verificationLine)).toBeVisible();
await page.goto('/admin/content');
await bodyField.fill(originalBody);
await page.getByRole('button', { name:'Publish changes' }).click();
await expect(page.getByText('Changes are live on the storefront.')).toBeVisible();

await page.setViewportSize({ width:390, height:844 });
await page.goto('/faq');
await expect(page.getByRole('heading', { name:'Frequently asked questions', level:1 })).toBeVisible();
await expect(page.locator('.content-side-nav')).toBeVisible();
await page.waitForTimeout(550);
await page.screenshot({ path:path.join(os.tmpdir(), 'stylehub-content-mobile.png'), fullPage:true });
expect(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.window.innerWidth)).toBe(true);

if (pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
process.stdout.write(`${JSON.stringify({ pages:Object.keys(contentPages).length, contactSubmitted:true, adminEditor:true, publishVerified:true, desktopOverflow:false, mobileOverflow:false, screenshots:[path.join(os.tmpdir(), 'stylehub-content-desktop.png'), path.join(os.tmpdir(), 'stylehub-content-admin.png'), path.join(os.tmpdir(), 'stylehub-content-mobile.png')] }, null, 2)}\n`);
await browser.close();
