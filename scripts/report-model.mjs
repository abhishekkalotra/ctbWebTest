export function scenarioExecutions(report) {
  const records = [];
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const attempt = test.results?.at(-1);
        if (attempt) records.push({
          title: spec.title,
          project: test.projectName,
          status: attempt.status,
          durationMs: attempt.duration,
          retry: attempt.retry,
        });
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites ?? []) visit(suite);
  return records;
}

export function performanceMetrics(report, telemetry = []) {
  const scenarios = scenarioExecutions(report);
  const executed = scenarios.filter((test) => test.status !== 'skipped');
  const slowest = [...executed].sort((a, b) => b.durationMs - a.durationMs)[0];
  return {
    started: report.stats.startTime,
    wallDurationMs: report.stats.duration,
    discovered: scenarios.length,
    executed: executed.length,
    passed: executed.filter((test) => test.status === 'passed').length,
    failed: executed.filter((test) => test.status !== 'passed').length,
    skipped: scenarios.length - executed.length,
    averageDurationMs: executed.length ? executed.reduce((sum, test) => sum + test.durationMs, 0) / executed.length : null,
    slowest: slowest ?? null,
    browserLaunches: telemetry.filter((event) => event.event === 'browser-launch').length,
    loginInteractions: telemetry.filter((event) => event.event === 'login').length,
    browsers: [...new Set(telemetry.filter((event) => event.event === 'browser-launch').map((event) => `${event.project}: ${event.browser}`))],
    automaticRetries: executed.reduce((sum, test) => sum + (test.retry ?? 0), 0),
    workload: scenarios.map((test) => `${test.project}|${test.title}`).sort(),
  };
}

export function selectCurrentResults(entries, report) {
  const expected = new Set(scenarioExecutions(report).map((test) => `${test.project}|${test.title}`));
  const matching = [], unrelated = [];
  for (const entry of entries) {
    const project = entry.result.labels?.find((label) => label.name === 'parentSuite')?.value;
    (expected.has(`${project}|${entry.result.name}`) ? matching : unrelated).push(entry);
  }
  return {matching, unrelated};
}

export function reviewedDecision(result, decisions) {
  if (!['failed', 'broken'].includes(result.status)) return undefined;
  return decisions.find((decision) => decision.resultUuid === result.uuid
    && decision.caseId === result.name.match(/LOGIN-\d{3}/)?.[0]
    && decision.reviewedAt && decision.evidence?.length);
}

export function resultAttachments(result) {
  return [...(result.attachments ?? []), ...(result.steps ?? []).flatMap(resultAttachments)];
}
