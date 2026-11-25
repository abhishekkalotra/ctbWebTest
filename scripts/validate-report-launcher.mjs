// Windows integration checks against the existing report, never the live application.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import {reportIdentity} from './serve-report.mjs';

if (process.platform !== 'win32') throw new Error('Batch integration checks require Windows.');
const project = process.cwd();
const root = path.resolve('reports/allure-report');
const port = Number(process.env.LAUNCHER_TEST_PORT ?? 18766);
const result = {timestamp: new Date().toISOString(), checks: []};
const copy = path.resolve('reports/archive/launcher-checks', new Date().toISOString().replace(/[:.]/g, '-'), 'report with spaces');
fs.cpSync(root, copy, {recursive: true});
function launch(batch, reportPort) {
  const child = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `""${batch}""`],
    {cwd: os.tmpdir(), env: {...process.env, REPORT_PORT: String(reportPort)}, windowsHide: true, windowsVerbatimArguments: true});
  const item = {child, output: ''};
  child.stdout.on('data', (bytes) => item.output += bytes);
  child.stderr.on('data', (bytes) => item.output += bytes);
  child.stdin.end('\r\n');
  item.exited = new Promise((resolve, reject) => {child.once('error', reject); child.once('exit', (code) => resolve(code));});
  return item;
}
async function exited(item) {
  const code = await Promise.race([item.exited, delay(15000, undefined, {ref: false}).then(() => {throw new Error('Batch did not finish in time: ' + item.output);})]);
  if (code !== 0) throw new Error('Batch failed: ' + item.output);
  if (!item.output.includes('Reusing the server')) throw new Error('Expected verified reuse: ' + item.output);
}

let running;
try {
  const baseline = JSON.parse(fs.readFileSync('reports/investigation/report-update-baseline.json', 'utf8'));
  for (const [file, expected] of Object.entries(baseline)) {
    if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== expected) throw new Error('Execution source changed: ' + file);
  }
  result.checks.push({name: 'Original results, classifications and canonical reports unchanged', files: Object.keys(baseline).length, passed: true});
  const stamps = fs.readdirSync(root).filter((name) => /^ctbBugReport_.*\.md$/.test(name));
  if (stamps.length < 2) throw new Error('Expected timestamped reports preserved through repeated generation.');
  result.checks.push({name: 'Timestamped reports preserved after repeated --clean generation', reports: stamps, passed: true});
  await exited(launch(path.join(project, 'Open-Allure-Report.bat'), Number(process.env.REPORT_PORT ?? 8765)));
  result.checks.push({name: 'Project batch opens/reuses report from a different working directory', passed: true});
  running = launch(path.join(copy, 'Open-Allure-Report.bat'), port);
  const url = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (running.child.exitCode !== null) throw new Error('Portable launcher exited: ' + running.output);
    try {
      const response = await fetch(url + '/__ctb_report_health', {signal: AbortSignal.timeout(500)});
      if (response.ok && (await response.json()).identity === reportIdentity(copy)) {ready = true; break;}
    } catch {}
    await delay(100);
  }
  if (!ready) throw new Error('Portable report server did not become ready: ' + running.output);
  result.checks.push({name: 'Portable batch starts from a path containing spaces without installed npm dependencies', passed: true});
  await exited(launch(path.join(copy, 'Open-Allure-Report.bat'), port));
  result.checks.push({name: 'Repeated portable batch opening reuses the matching server', passed: true});
  const browser = await chromium.launch({channel: 'chrome'});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('requestfailed', (request) => errors.push(request.failure()?.errorText));
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.getByText('test cases', {exact: true}).waitFor();
    if (await page.getByText('Failed to fetch', {exact: true}).count()) throw new Error('Portable report displayed a fetch error.');
    if (errors.length) throw new Error('Portable report browser errors: ' + errors.join('; '));
    result.checks.push({name: 'Portable report renders actual results without fetch/script errors', passed: true});
  } finally {await browser.close();}
} catch (error) {
  result.error = error.message;
  process.exitCode = 1;
} finally {
  // Only terminate the process tree launched by this integration check.
  if (running && running.child.exitCode === null) {
    const stopped = spawnSync('taskkill.exe', ['/PID', String(running.child.pid), '/T', '/F'], {windowsHide: true, encoding: 'utf8'});
    result.testServerStopped = stopped.status === 0;
    if (!result.testServerStopped) {
      result.cleanupError = stopped.stderr || stopped.error?.message || stopped.stdout;
      process.exitCode = 1;
    }
  }
  fs.writeFileSync('reports/investigation/launcher-validation.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
