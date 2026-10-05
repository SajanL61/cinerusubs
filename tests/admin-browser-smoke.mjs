import { chromium, expect } from '@playwright/test';
import process from 'node:process';

const password=process.argv[2];
if(!password)throw new Error('Temporary demo password argument is required');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({baseURL:'http://localhost:4001',viewport:{width:1440,height:1050}});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));

await page.goto('/admin/login');
await page.locator('input[name="email"]').fill('owner@demo.local');
await page.locator('input[name="password"]').fill(password);
await page.getByRole('button',{name:'Sign in'}).click();
await expect(page).toHaveURL(/\/admin$/);
await expect(page.getByRole('heading',{name:'Dashboard'})).toBeVisible();
await expect(page.getByText('Verified payment receipts',{exact:true})).toBeVisible();

await page.goto('/admin/inventory');
await expect(page.getByRole('heading',{name:'Inventory'})).toBeVisible();
await expect(page.getByText('60 SKUs')).toBeVisible();
const firstRow=page.locator('.inventory-table tbody tr').first();
await expect(firstRow).toBeVisible();
const before=Number((await firstRow.locator('td').nth(2).innerText()).trim());
const firstSku=(await firstRow.locator('td').nth(1).locator('strong').innerText()).trim();
await firstRow.getByRole('button',{name:'Stock'}).click();
await expect(page.getByRole('dialog',{name:'Stock action'})).toBeVisible();
await page.locator('.admin-modal input[name="quantity"]').fill('4');
await page.locator('.admin-modal textarea[name="reason"]').fill('Browser verification stock receipt');
await page.getByRole('button',{name:'Receive stock',exact:true}).last().click();
await expect(page.getByRole('dialog',{name:'Stock action'})).toBeHidden();
await expect(firstRow.locator('td').nth(2)).toHaveText(String(before+4));

await firstRow.getByRole('button',{name:'View movements'}).click();
await expect(page.getByRole('heading',{name:'Stock history'})).toBeVisible();
await expect(page.locator('.reservation-audit')).toContainText('Active reservations');
await expect(page.getByText('Browser verification stock receipt',{exact:true}).first()).toBeVisible();
await page.locator('.movement-drawer .modal-head > button').click();

await firstRow.getByRole('button',{name:'Price'}).click();
await page.locator('.admin-modal input[name="price"]').fill('3190');
await page.locator('.admin-modal input[name="costPrice"]').fill('1700');
await page.locator('.admin-modal input[name="threshold"]').fill('4');
await page.getByRole('button',{name:'Save pricing'}).click();
await expect(page.locator('.admin-modal')).toBeHidden();
await expect(firstRow.locator('td').nth(8)).toContainText('3,190');

await page.goto('/products/demo-classic-t-shirt');
await page.getByRole('button',{name:'Forest',exact:true}).click();
await page.getByRole('button',{name:'S',exact:true}).click();
await page.getByRole('button',{name:'Buy now'}).click();
await expect(page).toHaveURL(/\/checkout$/);
await page.locator('input[name="name"]').fill('Browser Test Customer');
await page.locator('input[name="mobile"]').fill('0771234567');
await page.locator('input[name="line1"]').fill('Development test address');
await page.locator('input[name="district"]').fill('Colombo');
await page.locator('input[name="city"]').fill('Colombo');
await page.locator('input[name="paymentMethod"][value="cod"]').check();
await page.getByRole('button',{name:'Place order'}).click();
await expect(page.getByRole('heading',{name:'Thank you for your order.'})).toBeVisible();
const confirmation=await page.locator('.confirmation').innerText();
const orderNumber=confirmation.match(/CS-[A-Z0-9-]+/)?.[0];
if(!orderNumber)throw new Error('Order number was not present in the confirmed checkout');

await page.goto('/admin/transactions');
await expect(page.getByRole('heading',{name:'Transactions'})).toBeVisible();
await expect(page.getByText(orderNumber,{exact:true})).toBeVisible();
await expect(page.getByText('Outstanding COD',{exact:true})).toBeVisible();
await page.getByRole('button',{name:'Record COD'}).click();
await expect(page.getByRole('dialog',{name:'Record verified payment'})).toBeVisible();
await page.locator('.payment-modal input[name="reference"]').fill('COURIER-SMOKE-001');
await page.getByRole('button',{name:'Confirm COD receipt'}).click();
await expect(page.getByRole('dialog',{name:'Record verified payment'})).toBeHidden();
await page.getByRole('button',{name:'Payment receipts'}).click();
await expect(page.getByText('COURIER-SMOKE-001',{exact:true})).toBeVisible();
await page.goto('/admin/inventory');
const inventorySearch=page.getByPlaceholder('Search product, SKU, category, colour or size');
await inventorySearch.fill('DEMO-1-FO-S');
const reservedRow=page.locator('.inventory-table tbody tr').first();
await expect(reservedRow).toBeVisible();
await expect(reservedRow.locator('td').nth(3)).toHaveText('1');
await reservedRow.getByRole('button',{name:'View movements'}).click();
await expect(page.getByText(orderNumber,{exact:true})).toBeVisible();
await page.locator('.movement-drawer .modal-head > button').click();

await page.setViewportSize({width:390,height:844});
await page.goto('/admin/inventory');
await page.getByRole('button',{name:'Toggle admin navigation'}).click();
await expect(page.getByRole('link',{name:'Transactions'})).toBeVisible();

if(pageErrors.length)throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
process.stdout.write(`${JSON.stringify({dashboard:true,skuCount:60,receivedSku:firstSku,receivedFrom:before,receivedTo:before+4,priceUpdated:319000,orderNumber,reservationVerified:true,paymentRecorded:true,mobileMenu:true},null,2)}\n`);
await browser.close();
