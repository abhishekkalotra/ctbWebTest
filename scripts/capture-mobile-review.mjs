import fs from 'node:fs';
import dotenv from 'dotenv';
import {chromium} from '@playwright/test';

dotenv.config({quiet: true});
const browser = await chromium.launch({channel: 'chrome'});
const context = await browser.newContext({viewport: {width: 440, height: 763}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
const page = await context.newPage();
const root = 'reports/investigation/mobile-visual';
fs.mkdirSync(root, {recursive: true});
const report = {timestamp: new Date().toISOString(), browser: browser.version(), viewport: {width: 440, height: 763}, screenshots: []};
try {
  await page.goto(new URL(process.env.LOGIN_PATH, process.env.BASE_URL).href, {waitUntil: 'load'});
  await page.getByRole('heading', {name: 'Sign in', exact: true}).waitFor();
  await page.screenshot({path: `${root}/initial.png`, fullPage: true});
  report.screenshots.push('initial.png');
  await page.getByRole('button', {name: 'Log in', exact: true}).click();
  await page.getByText('This field is required', {exact: true}).waitFor();
  await page.screenshot({path: `${root}/validation.png`, fullPage: true});
  report.screenshots.push('validation.png');
  await page.getByRole('button', {name: 'Switch language', exact: true}).click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({path: `${root}/language-dialog.png`});
  report.screenshots.push('language-dialog.png');
  report.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  report.visibleIconClose = await page.getByRole('dialog').locator('button[aria-label="Close"]').isVisible();
} finally {
  await context.close();
  await browser.close();
}
fs.writeFileSync(`${root}/capture-metadata.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
