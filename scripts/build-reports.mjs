import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import dotenv from 'dotenv';
import {performanceMetrics, reviewedDecision, resultAttachments, selectCurrentResults} from './report-model.mjs';

dotenv.config({quiet: true});
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const catalog = read('fixtures/case-catalog.json');
const bugCatalog = read('config/bug-catalog.json');
const latest = read('reports/execution-results.json');
const metadata = fs.existsSync('reports/run-metadata.json') ? read('reports/run-metadata.json') : {};
const decisions = fs.existsSync('reports/investigation/triage-decisions.json')
  ? read('reports/investigation/triage-decisions.json').decisions : [];
const directory = 'reports/allure-results';
const project = (result) => result.labels?.find((label) => label.name === 'parentSuite')?.value ?? 'unknown';
const caseId = (result) => result.name.match(/LOGIN-\d{3}/)?.[0];
const scenarioKey = (result) => `${project(result)}|${result.name}`;
const loadResults = (root) => fs.existsSync(root) ? fs.readdirSync(root)
  .filter((name) => name.endsWith('-result.json'))
  .map((file) => ({file, directory: root, result: read(path.join(root, file))})) : [];
const selected = selectCurrentResults(loadResults(directory), latest);
for (const entry of selected.unrelated) {
  const archive = path.resolve('reports/archive/unrelated-results', entry.result.uuid);
  const allowed = path.resolve('reports/archive/unrelated-results') + path.sep;
  if (!archive.startsWith(allowed)) throw new Error('Unsafe unrelated-result archive path');
  fs.mkdirSync(archive, {recursive: true});
  for (const attachment of resultAttachments(entry.result)) {
    const source = path.resolve(directory, attachment.source);
    if (!source.startsWith(path.resolve(directory) + path.sep)) throw new Error('Unsafe attachment path');
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(archive, path.basename(attachment.source)));
  }
  fs.renameSync(path.join(directory, entry.file), path.join(archive, entry.file));
}
const results = selected.matching;
if (!results.length) throw new Error('No actual current-run Allure results found. Execute the suite first.');
const started = Date.parse(latest.stats.startTime);
if (results.some(({result}) => result.start < started)) {
  throw new Error('Current Allure directory mixes earlier attempts. Use test:login to archive reports before execution.');
}
const archiveRoots = fs.readdirSync('reports/runs', {withFileTypes: true})
  .filter((entry) => entry.isDirectory()).map((entry) => path.join('reports/runs', entry.name));
const uniqueHistory = new Map();
for (const root of archiveRoots) for (const entry of loadResults(path.join(root, 'allure-results'))) {
  uniqueHistory.set(entry.result.uuid, entry);
}
const history = [...uniqueHistory.values()];
const telemetry = (root) => {
  const file = path.join(root, 'telemetry.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
};
const currentMetrics = performanceMetrics(latest, telemetry('reports'));
const historicalRuns = archiveRoots.filter((root) => fs.existsSync(path.join(root, 'execution-results.json')))
  .map((root) => ({root, report: read(path.join(root, 'execution-results.json'))}))
  .sort((a, b) => Date.parse(a.report.stats.startTime) - Date.parse(b.report.stats.startTime));
const baselineRun = historicalRuns.find(({report}) => {
  const metrics = performanceMetrics(report);
  return metrics.workload.join('\n') === currentMetrics.workload.join('\n');
});
const before = baselineRun ? performanceMetrics(baselineRun.report, telemetry(baselineRun.root)) : null;
const baselineIds = ['LOGIN-001', 'LOGIN-002', 'LOGIN-007', 'LOGIN-010', 'LOGIN-023'];
const baselineEntries = baselineIds.flatMap((id) => ['chromium', 'firefox'].map((browser) =>
  results.find(({result}) => caseId(result) === id && project(result) === browser)));
const browserCoverage = baselineEntries.some((entry) => !entry) ? 'Not Executed'
  : baselineEntries.every(({result}) => result.status === 'passed') ? 'Passed' : 'Failed';
const caseResults = catalog.map((record) => {
  const scenarios = results.filter(({result}) => caseId(result) === record.id);
  const execution = record.status === 'Blocked' ? 'Blocked'
    : record.status === 'Out of Scope' ? 'Skipped'
    : record.id === 'LOGIN-038' ? browserCoverage
    : !scenarios.length ? 'Not Executed'
    : scenarios.some(({result}) => ['failed', 'broken'].includes(result.status)) ? 'Failed'
    : scenarios.every(({result}) => result.status === 'passed') ? 'Passed' : 'Not Executed';
  return {...record, execution};
});
const reviewed = results.map((entry) => ({...entry, decision: reviewedDecision(entry.result, decisions)}));
const confirmed = reviewed.filter(({decision}) => decision?.classification === 'Confirmed Application Bug');
const bugs = bugCatalog.filter((bug) => confirmed.some(({result, decision}) => decision.bugId === bug.id && caseId(result) === bug.caseId));
const unreviewed = reviewed.filter(({result, decision}) => ['failed', 'broken'].includes(result.status) && !decision);
const nonApplicationFailures = reviewed.filter(({result, decision}) => ['failed', 'broken'].includes(result.status)
  && decision?.classification !== 'Confirmed Application Bug');
const count = (status) => caseResults.filter((record) => record.execution === status).length;
const timestamp = new Date().toISOString();
const label = (result, name, value) => {
  result.labels = (result.labels ?? []).filter((existing) => existing.name !== name);
  result.labels.push({name, value});
};
const attach = (result, name, content, type = 'text/markdown') => {
  result.attachments = (result.attachments ?? []).filter((existing) => existing.name !== name);
  const source = `${randomUUID()}-attachment.${type === 'application/json' ? 'json' : 'md'}`;
  fs.writeFileSync(path.join(directory, source), content);
  result.attachments.push({name, source, type});
};
for (const {result} of reviewed) {
  const record = catalog.find((entry) => entry.id === caseId(result));
  if (!record) continue;
  label(result, 'epic', 'Authentication');
  label(result, 'feature', 'Login');
  label(result, 'story', record.category);
  label(result, 'testCaseId', record.id);
  label(result, 'environment', process.env.TEST_ENV ?? 'Unspecified');
  result.description = `${record.id}: ${record.title}\n\nExpected: ${record.expected}\n\nSource steps:\n${record.steps}\n\nScope: ${record.status}. ${record.reason}`;
  if (baselineIds.includes(record.id)) {
    label(result, 'coverageCaseId', 'LOGIN-038');
    result.description += '\n\nContributes actual baseline evidence to derived case LOGIN-038.';
  }
  const previous = history.filter((entry) => scenarioKey(entry.result) === scenarioKey(result) && entry.result.uuid !== result.uuid);
  if (previous.length) attach(result, 'Prior execution history', JSON.stringify(previous.map((entry) => ({
    started: new Date(entry.result.start).toISOString(), status: entry.result.status,
    error: entry.result.statusDetails?.message, source: entry.directory,
  })), null, 2), 'application/json');
  const decision = reviewedDecision(result, decisions);
  if (decision) {
    label(result, 'failureClassification', decision.classification);
    attach(result, 'Reviewed failure investigation', JSON.stringify(decision, null, 2), 'application/json');
  }
}

const reports = [];
const reportRoot = 'reports/bug-reports';
fs.mkdirSync(reportRoot, {recursive: true});
for (const bug of bugs) {
  const affected = confirmed.filter(({decision}) => decision.bugId === bug.id);
  const record = catalog.find((entry) => entry.id === bug.caseId);
  const attempted = results.filter(({result}) => caseId(result) === bug.caseId && result.status !== 'skipped');
  const environment = affected.map(({result}) => `${project(result)}: ${result.parameters?.find((parameter) => parameter.name === 'Browser')?.value ?? 'version not captured'}`);
  const text = `## ${bug.id}: ${bug.title}\n\n**Module:** Authentication — Login  \n**Related Test Case:** ${bug.caseId}  \n**Status:** Open — reproduced in the current run  \n**Severity:** ${bug.severity}  \n**Priority:** ${bug.priority}\n\n**Environment:** ${process.env.TEST_ENV}; ${process.env.BASE_URL}; Windows ${os.release()}; 1425 × 847 CSS pixels. ${environment.join('; ')}. Application build identifier unavailable.\n\n**Execution timestamps (UTC):** ${affected.map(({result}) => new Date(result.start).toISOString()).join(', ')}.\n\n**Preconditions:** ${record.preconditions}\n\n**Test data:** ${bug.caseId === 'LOGIN-028' ? 'LOGIN_EMAIL and LOGIN_PASSWORD references only. Credential values withheld.' : 'Fresh guest context; no credentials.'}\n\n**Description:** ${affected.map(({decision}) => decision.actual).join(' ')}\n\n**Steps to reproduce:**\n\n${record.steps}\n\n**Expected:** ${record.expected}\n\n**Actual:** ${affected.map(({decision}) => decision.actual).join(' ')}\n\n**Reproducibility:** ${affected.length}/${attempted.length} current-run browser scenarios reproduced the reviewed mismatch. Historical attempts remain separately archived and are not added to this ratio.\n\n**Failure details:**\n\n${affected.map(({result, decision}) => `### ${project(result)}\n\nInvestigation: ${decision.reason}\n\n\`\`\`text\n${result.statusDetails?.message ?? ''}\n${result.statusDetails?.trace ?? ''}\n\`\`\`\n\n${resultAttachments(result).map((attachment) => `- [${attachment.name}](../allure-results/${attachment.source})`).join('\n')}`).join('\n\n')}\n\n**Impact:** ${bug.impact}\n\n**Evidence limitations:** ${bug.caseId === 'LOGIN-028' ? 'Credential-bearing traces and video were intentionally disabled. Masked screenshots and sanitized diagnostic logs document the failure.' : 'Failure screenshots, original videos, sanitized traces and DOM evidence are retained. Video samples are reviewed separately; no screen-reader announcement claim is made.'}\n\n**Notes:** No application code was changed. Product expectations and assertions were preserved. The bug status is based on the reviewed execution UUIDs in triage-decisions.json, never on a test name alone.\n`;
  fs.writeFileSync(path.join(reportRoot, `${bug.id}.md`), text);
  reports.push(text);
  for (const {result} of affected) {
    label(result, 'bugId', bug.id);
    result.description += `\n\nQA REVIEW\nConfirmed application bug: ${bug.id}. ${bug.title}`;
    result.statusDetails.message = `[${bug.id}] ${result.statusDetails.message.replace(/^\[BUG-LOGIN-\d+\] /, '')}`;
    const embedded = text.replace(/\[([^\]]+)\]\(\.\.\/allure-results\/[^)]+\)/g,
      '$1 (use the corresponding attachment on this Allure test result)');
    attach(result, `${bug.id} — detailed bug report`, embedded);
  }
}
for (const {file, result} of results) {
  for (const attachment of resultAttachments(result)) {
    if (!fs.existsSync(path.join(directory, attachment.source))) throw new Error(`Missing attachment for ${result.name}: ${attachment.source}`);
  }
  fs.writeFileSync(path.join(directory, file), JSON.stringify(result, null, 2));
}
const issueText = `## Automation issues\n\nThree initial locator issues were corrected: French Close uses Fermé; logout requires its verified text locator because of an aria-hidden ancestor; mobile uses the visible icon Close control. Repeated deterministic accessibility waits were shortened while preserving every assertion. Earlier failures and the explicit correction run remain archived.\n\n## Environment issues\n\nThe network-restricted sandbox denied application access. Authorized outside-sandbox execution reached the development application.\n\n## Blocked tests and missing requirements\n\n${caseResults.filter((record) => record.execution === 'Blocked').map((record) => `- ${record.id}: ${record.reason}`).join('\n')}\n\n## Unconfirmed or intermittent failures\n\n${nonApplicationFailures.length ? nonApplicationFailures.map(({result, decision}) => `### ${project(result)} ${caseId(result)}\n\n**Classification:** ${decision?.classification ?? 'Unreviewed'}\n\n**Actual:** ${decision?.actual ?? result.statusDetails?.message}\n\n**Investigation:** ${decision?.reason ?? 'Investigation required.'}\n\n${(decision?.evidence ?? []).map((file) => `- [Evidence](../../${file})`).join('\n')}\n\nThe original scenario remains failed. An independent passing check does not replace its outcome or establish a fixed defect.`).join('\n\n') : 'No unconfirmed failure remains in this execution.'}\n\n## Visual and platform limitations\n\nAI visual review of emulated screenshots is recorded separately. Human sign-off, real-device Safari testing and real screen-reader announcements have not been performed. No verdict is made for the blocked keyboard requirements.\n`;
fs.writeFileSync(path.join(reportRoot, 'login-bug-report.md'), `# Login bug report\n\nCurrent execution started ${latest.stats.startTime}.\n\n| Bug ID | Bug title | Test Case ID | Severity | Priority | Status | Evidence |\n|---|---|---|---|---|---|---|\n${bugs.map((bug) => `| ${bug.id} | ${bug.title} | ${bug.caseId} | ${bug.severity} | ${bug.priority} | Open | [Details](${bug.id}.md) |`).join('\n')}\n\n${reports.length ? reports.join('\n\n') : 'No confirmed application bugs were identified during this execution. New failures require investigation; historical bugs are not thereby marked fixed.'}\n\n${issueText}`);

const metrics = [
  ['Total execution time', 'wallDurationMs', 'ms'], ['Average executed-test duration', 'averageDurationMs', 'ms'],
  ['Slowest test duration', null, 'ms'], ['Browser launches', 'browserLaunches', ''],
  ['Login interactions', 'loginInteractions', ''], ['Failed scenarios', 'failed', ''],
  ['Automatic retries', 'automaticRetries', ''],
];
const value = (run, key) => !run ? 'Unavailable' : key ? Math.round(run[key]) : Math.round(run.slowest?.durationMs ?? 0);
const performanceTable = `| Performance metric | Before: full initial run | After: current full run |\n|---|---:|---:|\n${metrics.map(([name, key, unit]) => `| ${name} | ${value(before, key)} ${unit} | ${value(currentMetrics, key)} ${unit} |`).join('\n')}`;
const statuses = results.reduce((totals, {result}) => (totals[result.status] = (totals[result.status] ?? 0) + 1, totals), {});
const summary = {
  timestamp, runStarted: latest.stats.startTime, sourceCases: catalog.length,
  automatedDirectCases: catalog.filter((record) => record.status === 'Ready for Automation' && record.id !== 'LOGIN-038').length,
  derivedCoverageCases: 1, executedSourceCases: count('Passed') + count('Failed'),
  passedSourceCases: count('Passed'), failedSourceCases: count('Failed'),
  blockedSourceCases: count('Blocked'), outOfScopeSourceCases: count('Skipped'), notExecutedSourceCases: count('Not Executed'),
  confirmedBugs: bugs.length, automationIssuesCorrected: 3, unconfirmedFailures: nonApplicationFailures.length, unreviewedFailures: unreviewed.length,
  latestScenarioOutcomes: statuses, currentRun: currentMetrics,
  beforeOptimization: before, benchmarkWorkloadMatches: Boolean(before), automaticRetries: currentMetrics.automaticRetries,
  caseResults,
};
fs.writeFileSync('reports/execution-summary.json', JSON.stringify(summary, null, 2));
fs.writeFileSync('reports/performance-comparison.json', JSON.stringify({timestamp, before, after: currentMetrics, sameScenarioWorkload: Boolean(before)}, null, 2));
fs.writeFileSync('reports/execution-summary.md', `# Login execution summary\n\nCurrent run started ${latest.stats.startTime}; generated ${timestamp}. Timestamps are UTC; local timezone Asia/Kolkata (UTC+05:30).\n\n| Metric | Count |\n|---|---:|\n| Source test cases | ${catalog.length} |\n| Automated standalone cases | ${summary.automatedDirectCases} |\n| Derived browser-coverage case | 1 |\n| Executed source cases, including derived coverage | ${summary.executedSourceCases} |\n| Passed source cases | ${count('Passed')} |\n| Failed source cases | ${count('Failed')} |\n| Blocked source cases | ${count('Blocked')} |\n| Explicitly out-of-scope source cases | ${count('Skipped')} |\n| Not executed source cases | ${count('Not Executed')} |\n| Confirmed application bugs | ${bugs.length} |\n| Unconfirmed/intermittent failed scenarios | ${nonApplicationFailures.length} |\n| Unreviewed failed scenarios | ${unreviewed.length} |\n\nCurrent browser/parameter scenario outcomes: ${JSON.stringify(statuses)}. These are separate from unique source cases. Current outcomes come exclusively from this execution; historical attempts are attached for review and never substituted for current missing or failing results. Run purpose: ${metadata.reason ?? 'Requested execution'}.\n\n## Coverage\n\n${currentMetrics.browsers.join('; ')}. Desktop 1425 × 847; mobile Chrome emulation 440 × 763. LOGIN-038 derives from actual Chrome/Firefox render, initial-state, valid-login, blank-validation and masking checks: ${browserCoverage}. Original videos and traces are retained only where secret safety permits. No negative-account submissions, account-data changes, Google consent, API contract tests, expiry simulation, real-device Safari or screen-reader tests were performed.\n\nFailed source IDs: ${caseResults.filter((record) => record.execution === 'Failed').map((record) => record.id).join(', ') || 'None'}. Confirmed bug IDs: ${bugs.map((bug) => bug.id).join(', ') || 'None'}.\n\n## Full-suite performance comparison\n\n${performanceTable}\n\n${before ? `Both executions cover the same ${currentMetrics.discovered} named browser/parameter scenarios, with ${currentMetrics.executed} executed and ${currentMetrics.skipped} skipped in the current run. Initial baseline: ${before.started}. Current benchmark: ${currentMetrics.started}. The baseline includes the original locator timeouts; the current run uses corrected locators and shorter deterministic accessibility checks. Separate dates and network/server load prevent attributing the entire timing difference to code changes.` : 'No historical run with the same named browser/parameter workload was found; no speedup claim is made.'}\n\nSlowest current test: ${currentMetrics.slowest?.project} ${currentMetrics.slowest?.title} (${currentMetrics.slowest?.durationMs} ms). Retry-derived flaky outcomes reported by the runner: ${latest.stats.flaky}; no automatic retry was enabled. Separately investigated intermittent/unconfirmed failures: ${nonApplicationFailures.length}. Manual historical reruns are recorded separately.\n\n## Source-case results\n\n| ID | Result | Scenario |\n|---|---|---|\n${caseResults.map((record) => `| ${record.id} | ${record.execution} | ${record.title} |`).join('\n')}\n\n## Recommendations and remaining limits\n\nAddress reproduced bugs, supply missing fixture/requirement rules, and obtain human or real-device sign-off where required. The AI visual review and video-frame findings are under reports/investigation/. Credential exposure checks cover observed navigation/history transitions, not unrestricted browser-history enumeration.\n`);
fs.writeFileSync(path.join(directory, 'categories.json'), JSON.stringify([
  {name: 'Confirmed application bugs', matchedStatuses: ['failed'], messageRegex: '.*\\[BUG-LOGIN-.*'},
  {name: 'Unconfirmed or automation/environment failure', matchedStatuses: ['failed', 'broken']},
], null, 2));
console.log(JSON.stringify({...summary, caseResults: undefined, currentRun: {...currentMetrics, workload: undefined}, beforeOptimization: before ? {...before, workload: undefined} : null}, null, 2));
