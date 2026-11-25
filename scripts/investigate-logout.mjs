import fs from 'node:fs';
import dotenv from 'dotenv';
import {firefox} from '@playwright/test';

dotenv.config({quiet: true});
const browser = await firefox.launch();
const context = await browser.newContext({viewport: {width: 1425, height: 847}});
const page = await context.newPage();
const report = {timestamp: new Date().toISOString(), browser: browser.version(), attempts: 1, events: []};
const started = Date.now();
const event = (data) => report.events.push({elapsedMs: Date.now() - started, ...data});
page.on('request', (request) => {
  const url = new URL(request.url());
  if (/logout/i.test(url.pathname)) event({type: 'logout-request', method: request.method(), path: url.pathname});
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (/logout/i.test(url.pathname)) event({type: 'logout-response', status: response.status(), path: url.pathname});
});
page.on('framenavigated', (frame) => {if (frame === page.mainFrame()) event({type: 'navigation', path: new URL(frame.url()).pathname});});
try {
  await page.goto(new URL(process.env.LOGIN_PATH, process.env.BASE_URL).href, {waitUntil: 'load'});
  await page.getByPlaceholder('xx@domaine.com', {exact: true}).fill(process.env.LOGIN_EMAIL);
  await page.getByPlaceholder('Password', {exact: true}).fill(process.env.LOGIN_PASSWORD);
  await page.getByRole('button', {name: 'Log in', exact: true}).click();
  await page.getByRole('img', {name: process.env.AUTH_ACCOUNT_NAME, exact: true}).waitFor();
  await page.getByRole('img', {name: process.env.AUTH_ACCOUNT_NAME, exact: true}).click();
  const logout = page.getByText('Log out', {exact: true});
  await logout.waitFor();
  report.beforeClick = {count: await logout.count(), visible: await logout.isVisible(), enabled: await logout.isEnabled(),
    reactClickHandler: await logout.evaluate((node) => Object.keys(node).some((key) => key.startsWith('__reactProps$') && typeof node[key]?.onClick === 'function'))};
  await logout.click();
  event({type: 'logout-click-returned'});
  await page.waitForURL((url) => url.pathname === process.env.LOGIN_PATH, {timeout: 10000});
  report.outcome = 'Redirected to login after one click';
} catch (error) {
  report.outcome = 'Single independent attempt did not meet the logout requirement';
  let message = error.message;
  for (const secret of [process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD]) message = message.replaceAll(secret, '[REDACTED]');
  report.error = message;
} finally {
  report.finalPath = new URL(page.url()).pathname;
  await context.close();
  await browser.close();
}
fs.writeFileSync('reports/investigation/logout-independent.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
