import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ownDirectory = path.dirname(fileURLToPath(import.meta.url));
const mime = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webm': 'video/webm', '.zip': 'application/zip',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8'};

export function reportIdentity(root) {
  const canonical = fs.realpathSync(root);
  return createHash('sha256').update(process.platform === 'win32' ? canonical.toLowerCase() : canonical).digest('hex');
}

function readSummary(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'widgets/summary.json'), 'utf8'));
}

function validateReport(root) {
  if (!fs.existsSync(path.join(root, 'index.html')) || !fs.existsSync(path.join(root, 'widgets/summary.json'))) {
    throw new Error('Generated Allure report is missing. In the project, run npm.cmd run allure:generate. For a downloaded report, extract the entire ZIP first.');
  }
  if (!Number.isInteger(readSummary(root).statistic?.total)) throw new Error('Allure summary is invalid. Regenerate the report.');
}

export function createReportServer(root) {
  const identity = reportIdentity(root);
  return http.createServer((request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {response.writeHead(405).end(); return;}
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      if (pathname === '/__ctb_report_health') {
        response.writeHead(200, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'});
        response.end(JSON.stringify({application: 'cartobike-allure-viewer', identity, statistic: readSummary(root).statistic}));
        return;
      }
      const file = path.resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) {response.writeHead(403).end(); return;}
      const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {response.writeHead(404).end(); return;}
      const realTarget = fs.realpathSync(target);
      const realRoot = fs.realpathSync(root);
      if (!realTarget.startsWith(realRoot + path.sep)) {response.writeHead(403).end(); return;}
      response.writeHead(200, {'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'});
      if (request.method === 'HEAD') {response.end(); return;}
      fs.createReadStream(target).on('error', () => response.destroy()).pipe(response);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 503).end('Unable to read report data. Regenerate the report or extract the entire ZIP.');
    }
  });
}

async function openBrowser(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'ignore', windowsHide: true});
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error('The default browser could not be opened. Use the displayed URL.')));
  });
}

export async function startReport({root, port, open = false}) {
  root = path.resolve(root);
  validateReport(root);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('REPORT_PORT must be a whole number between 1 and 65535.');
  const url = `http://127.0.0.1:${port}`;
  const server = createReportServer(root);
  let reused = false;
  try {
    await new Promise((resolve, reject) => {server.once('error', reject); server.listen(port, '127.0.0.1', resolve);});
  } catch (error) {
    if (error.code !== 'EADDRINUSE') throw error;
    try {
      const response = await fetch(`${url}/__ctb_report_health`, {signal: AbortSignal.timeout(3000)});
      const health = await response.json();
      if (!response.ok || health.application !== 'cartobike-allure-viewer' || health.identity !== reportIdentity(root) ||
          JSON.stringify(health.statistic) !== JSON.stringify(readSummary(root).statistic)) throw new Error('Different report');
      reused = true;
    } catch {
      throw new Error(`Port ${port} is already used by another service or report. Close that service or set REPORT_PORT to another port. No process was stopped.`);
    }
  }
  try {
    const response = await fetch(`${url}/widgets/summary.json`, {signal: AbortSignal.timeout(3000)});
    const summary = await response.json();
    if (!response.ok || JSON.stringify(summary.statistic) !== JSON.stringify(readSummary(root).statistic)) throw new Error('Report data could not be loaded.');
    console.log(`Allure report: ${url}\n${reused ? 'Reusing the server already serving this report.' : 'Keep this window open. Closing it stops the report server.'}`);
    if (open) {
      try {await openBrowser(url);} catch (error) {console.error(error.message); console.error(`Open ${url} in your browser.`);}
    }
    return {server: reused ? null : server, reused, url};
  } catch (error) {
    if (!reused) server.close();
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fs.existsSync(path.join(ownDirectory, 'index.html')) ? ownDirectory : path.resolve(ownDirectory, '../reports/allure-report');
  try {await startReport({root, port: Number(process.env.REPORT_PORT ?? 8765), open: process.argv.includes('--open')});}
  catch (error) {console.error(`Cannot open Allure report: ${error.message}`); process.exitCode = 1;}
}
