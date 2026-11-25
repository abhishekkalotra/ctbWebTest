import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createReportServer, startReport} from './serve-report.mjs';

const statistic = {total: 0, passed: 0, failed: 0, skipped: 0};
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctb launcher test '));
  fs.mkdirSync(path.join(root, 'widgets'));
  fs.writeFileSync(path.join(root, 'index.html'), '<html><title>Launcher unit fixture</title></html>');
  fs.writeFileSync(path.join(root, 'widgets/summary.json'), JSON.stringify({statistic}));
  t.after(() => {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(root, {recursive: true, force: true});
  });
  return root;
}
async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server.address().port;
}
async function close(server) {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}
async function freePort() {
  const socket = net.createServer();
  const port = await listen(socket);
  await close(socket);
  return port;
}

test('serves report data and reuses only the matching report server', async (t) => {
  const root = fixture(t);
  const port = await freePort();
  const first = await startReport({root, port});
  t.after(() => close(first.server));
  assert.equal(first.reused, false);
  const response = await fetch(`${first.url}/widgets/summary.json`);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.deepEqual((await response.json()).statistic, statistic);
  assert.equal((await startReport({root, port})).reused, true);
  await assert.rejects(startReport({root: fixture(t), port}), /already used by another service or report/);
});

test('rejects an unrelated service without stopping it', async (t) => {
  const root = fixture(t);
  const other = http.createServer((request, response) => response.end('{}'));
  const port = await listen(other);
  t.after(() => close(other));
  await assert.rejects(startReport({root, port}), /already used/);
  assert.equal((await fetch(`http://127.0.0.1:${port}`)).status, 200);
});

test('reports missing data and invalid ports before serving', async (t) => {
  const root = fixture(t);
  for (const port of [-1, 0, 65536, NaN]) await assert.rejects(startReport({root, port}), /REPORT_PORT/);
  fs.unlinkSync(path.join(root, 'widgets/summary.json'));
  await assert.rejects(startReport({root, port: 8765}), /Generated Allure report is missing/);
});

test('rejects traversal, malformed URLs and absent assets; supports HEAD', async (t) => {
  const root = fixture(t);
  const server = createReportServer(root);
  const port = await listen(server);
  t.after(() => close(server));
  const request = (pathname) => new Promise((resolve, reject) => {
    http.get({hostname: '127.0.0.1', port, path: pathname}, (response) => {response.resume(); resolve(response.statusCode);}).on('error', reject);
  });
  assert.equal(await request('/%2e%2e%5csecret'), 403);
  assert.equal(await request('/%ZZ'), 400);
  assert.equal(await request('/missing.json'), 404);
  const head = await fetch(`http://127.0.0.1:${port}`, {method: 'HEAD'});
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('Windows batch shows missing-report and missing-Node errors from a different working directory', {skip: process.platform !== 'win32'}, async (t) => {
  const root = fixture(t);
  const folder = path.join(root, 'launcher with spaces');
  fs.mkdirSync(path.join(folder, 'scripts'), {recursive: true});
  fs.copyFileSync('Open-Allure-Report.bat', path.join(folder, 'Open-Allure-Report.bat'));
  fs.copyFileSync('scripts/serve-report.mjs', path.join(folder, 'scripts/serve-report.mjs'));
  async function run(env = process.env) {
    return new Promise((resolve, reject) => {
      const batch = path.join(folder, 'Open-Allure-Report.bat');
      const child = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `""${batch}""`],
        {cwd: os.tmpdir(), env, windowsHide: true, windowsVerbatimArguments: true});
      let output = '';
      child.stdout.on('data', (bytes) => output += bytes);
      child.stderr.on('data', (bytes) => output += bytes);
      child.once('error', reject);
      child.stdin.end('\r\n');
      child.once('exit', (code) => resolve({code, output}));
    });
  }
  const missingReport = await run();
  assert.equal(missingReport.code, 1, missingReport.output);
  assert.match(missingReport.output, /Generated Allure report is missing/);
  const missingNode = await run({...process.env, PATH: folder, Path: folder});
  assert.equal(missingNode.code, 1, missingNode.output);
  assert.match(missingNode.output, /Node.js is required/);
});
