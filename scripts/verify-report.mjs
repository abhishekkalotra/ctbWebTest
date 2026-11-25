import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {resultAttachments} from './report-model.mjs';

const port = process.env.REPORT_PORT ?? '8765';
const root = 'reports/allure-report';
const summary = JSON.parse(fs.readFileSync('reports/execution-summary.json', 'utf8'));
const statistic = JSON.parse(fs.readFileSync(`${root}/widgets/summary.json`, 'utf8')).statistic;
for (const [status, count] of Object.entries(summary.latestScenarioOutcomes)) {
  if (statistic[status] !== count) throw new Error('Allure HTML statistics disagree with actual current-run results.');
}
const report = {timestamp: new Date().toISOString(), statistic, missingAttachments: [],
  failedRequests: [], httpErrors: [], browserErrors: [], missingBugReportLinks: []};
const browser = await chromium.launch({channel: 'chrome'});
try {
  const page = await browser.newPage({viewport: {width: 1425, height: 900}});
  page.on('requestfailed', (request) => report.failedRequests.push({path: new URL(request.url()).pathname, error: request.failure()?.errorText}));
  page.on('response', (response) => {if (response.status() >= 400) report.httpErrors.push({path: new URL(response.url()).pathname, status: response.status()});});
  page.on('pageerror', (error) => report.browserErrors.push(error.message));
  page.on('console', (message) => {if (message.type() === 'error') report.browserErrors.push(message.text());});
  const summaryLoaded = page.waitForResponse((response) => new URL(response.url()).pathname === '/widgets/summary.json' && response.ok());
  const response = await page.goto(`http://127.0.0.1:${port}`, {waitUntil: 'load'});
  const loadedStatistic = (await (await summaryLoaded).json()).statistic;
  if (JSON.stringify(loadedStatistic) !== JSON.stringify(statistic)) throw new Error('The browser loaded different report counts.');
  await page.getByText('Overview', {exact: true}).waitFor();
  await page.getByText('test cases', {exact: true}).waitFor();
  if (await page.getByText('Failed to fetch', {exact: true}).count()) throw new Error('Allure displayed Failed to fetch.');
  report.httpStatus = response.status();
  report.title = await page.title();
  report.snapshot = await page.locator('body').ariaSnapshot();
  await page.screenshot({path: 'reports/allure-overview.png'});
  report.rawAttachmentReferences = 0;
  for (const file of fs.readdirSync('reports/allure-results').filter((name) => name.endsWith('-result.json'))) {
    const result = JSON.parse(fs.readFileSync(`reports/allure-results/${file}`, 'utf8'));
    for (const attachment of resultAttachments(result)) {
      report.rawAttachmentReferences++;
      const target = path.join('reports/allure-results', attachment.source);
      if (!fs.existsSync(target)) report.missingAttachments.push(target);
    }
  }
  // Allure 2 renames attachments when generating HTML. Verify the generated
  // model's references rather than assuming raw UUID filenames are preserved.
  const generatedAttachments = (value) => {
    if (!value || typeof value !== 'object') return [];
    return [...(Array.isArray(value.attachments) ? value.attachments : []),
      ...Object.entries(value).filter(([key]) => key !== 'attachments')
        .flatMap(([, child]) => Array.isArray(child) ? child.flatMap(generatedAttachments) : generatedAttachments(child))];
  };
  const generated = new Map();
  for (const file of fs.readdirSync(`${root}/data/test-cases`).filter((name) => name.endsWith('.json'))) {
    for (const attachment of generatedAttachments(JSON.parse(fs.readFileSync(`${root}/data/test-cases/${file}`, 'utf8')))) {
      generated.set(attachment.source, attachment);
    }
  }
  report.generatedAttachmentReferences = generated.size;
  for (const attachment of generated.values()) {
    const target = path.join(root, 'data/attachments', attachment.source);
    if (!fs.existsSync(target)) {report.missingAttachments.push(target); continue;}
    const response = await page.request.get(`http://127.0.0.1:${port}/data/attachments/${encodeURIComponent(attachment.source)}`);
    if (!response.ok()) report.missingAttachments.push(target + ` (HTTP ${response.status()})`);
  }
  report.timestampedBugReports = fs.readdirSync(root).filter((name) => /^ctbBugReport_.*\.md$/.test(name));
  if (!report.timestampedBugReports.length) throw new Error('Timestamped bug report is missing.');
  for (const name of report.timestampedBugReports) {
    const file = path.join(root, name);
    const served = await page.request.get(`http://127.0.0.1:${port}/${encodeURIComponent(name)}`);
    if (!served.ok()) throw new Error('Timestamped bug report is not accessible through the server.');
    for (const [, , href] of fs.readFileSync(file, 'utf8').matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
      if (/^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(href)) continue;
      const target = path.resolve(path.dirname(file), href.split('#')[0]);
      if (!fs.existsSync(target)) report.missingBugReportLinks.push({report: name, href});
    }
  }
  const samples = JSON.parse(fs.readFileSync('reports/investigation/video-sample-review.json', 'utf8'));
  report.videoReview = {method: samples.method, videos: samples.samples.length,
    decodedFrames: samples.samples.reduce((sum, video) => sum + video.samples.length, 0),
    failedDecodes: samples.samples.filter((video) => video.error).length};
  if (report.missingAttachments.length) throw new Error('Some current-run attachments are missing.');
  if (report.missingBugReportLinks.length) throw new Error('Some timestamped bug-report evidence links are missing.');
  if (report.failedRequests.length || report.httpErrors.length || report.browserErrors.length) throw new Error('The report browser encountered request or script errors.');
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {await browser.close();}
fs.writeFileSync('reports/report-verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({...report, snapshot: undefined}));
