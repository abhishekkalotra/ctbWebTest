import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import allure from 'allure-commandline';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(projectRoot);
const root = 'reports/allure-report';
const canonical = 'reports/bug-reports/login-bug-report.md';
const stampPattern = /^ctbBugReport_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.md$/;
if (!fs.existsSync(canonical)) throw new Error('Missing reviewed bug report. Run npm.cmd run qa:report before generating Allure.');
const execution = JSON.parse(fs.readFileSync('reports/execution-summary.json', 'utf8'));
const runId = createHash('sha256').update(execution.runStarted).digest('hex').slice(0, 16);
const history = path.join('reports/archive/bug-report-snapshots', runId);
fs.mkdirSync(history, {recursive: true});
if (fs.existsSync(root)) for (const name of fs.readdirSync(root).filter((name) => stampPattern.test(name))) {
  const target = path.join(history, name);
  const bytes = fs.readFileSync(path.join(root, name));
  if (fs.existsSync(target) && !bytes.equals(fs.readFileSync(target))) throw new Error(`Timestamped report collision: ${name}`);
  fs.writeFileSync(target, bytes);
}

function restoreExtras() {
  fs.mkdirSync(root, {recursive: true});
  for (const name of fs.readdirSync(history).filter((name) => stampPattern.test(name))) fs.copyFileSync(path.join(history, name), path.join(root, name));
  fs.copyFileSync('scripts/serve-report.mjs', path.join(root, 'open-report.mjs'));
  const batch = fs.readFileSync('Open-Allure-Report.bat', 'utf8').replace('%~dp0scripts\\serve-report.mjs', '%~dp0open-report.mjs');
  fs.writeFileSync(path.join(root, 'Open-Allure-Report.bat'), batch.replace(/\r?\n/g, '\r\n'));
}

let code;
try {
  code = await new Promise((resolve, reject) => {
    const child = allure(['generate', 'reports/allure-results', '--clean', '-o', root]);
    child.once('error', reject);
    child.once('exit', (status) => resolve(status ?? 1));
  });
} finally {restoreExtras();}
if (code !== 0) {process.exitCode = code;} else {
  const htmlFile = path.join(root, 'index.html');
  const html = fs.readFileSync(htmlFile, 'utf8');
  // Allure 2.46 adds optional remote analytics. Keep the local viewer self-contained.
  const offlineHtml = html.replace(/<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^"\n]*"[^>]*><\/script>\s*<script>\s*window\.dataLayer[\s\S]*?<\/script>/,
    '<!-- Optional analytics omitted for offline report viewing. -->');
  fs.writeFileSync(htmlFile, offlineHtml);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'})
    .formatToParts(new Date()).map(({type, value}) => [type, value]));
  const name = `ctbBugReport_${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}.md`;
  const sourceDirectory = path.dirname(path.resolve(canonical));
  // Resolve links from the canonical report's directory, then rebase them for the new location.
  const text = fs.readFileSync(canonical, 'utf8').replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, href) => {
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(href)) return match;
    const [file, fragment] = href.split('#');
    const relative = path.relative(path.resolve(root), path.resolve(sourceDirectory, file)).replaceAll('\\', '/');
    return `[${title}](${relative}${fragment ? '#' + fragment : ''})`;
  });
  const content = `<!-- Report generated in Asia/Kolkata; source execution is identified below. -->\n\n${text}`;
  const target = path.join(root, name);
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') !== content) throw new Error(`Timestamp collision: ${name}`);
  fs.writeFileSync(target, content);
  fs.writeFileSync(path.join(history, name), content);
  console.log(`Timestamped bug report: ${target}`);
}
