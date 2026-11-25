import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceMetrics, reviewedDecision, selectCurrentResults} from './report-model.mjs';

test('a new failure cannot inherit a historical bug decision', () => {
  const result = {uuid: 'new-attempt', name: 'LOGIN-033: Unit fixture only', status: 'failed'};
  assert.equal(reviewedDecision(result, [{resultUuid: 'old-attempt', caseId: 'LOGIN-033', reviewedAt: 'unit-test', evidence: ['unit-only']}]), undefined);
  assert.equal(reviewedDecision(result, []), undefined);
});

test('passing results cannot be classified as a confirmed failure', () => {
  const decision = {resultUuid: 'unit', caseId: 'LOGIN-033', reviewedAt: 'unit-test', evidence: ['unit-only']};
  assert.equal(reviewedDecision({uuid: 'unit', name: 'LOGIN-033: Unit fixture only', status: 'passed'}, [decision]), undefined);
});

test('performance excludes skipped scenarios and preserves measured failures', () => {
  const report = {stats: {startTime: 'unit-test', duration: 900}, suites: [{specs: [
    {title: 'unit pass', tests: [{projectName: 'unit-browser', results: [{status: 'passed', duration: 100, retry: 0}]}]},
    {title: 'unit failure', tests: [{projectName: 'unit-browser', results: [{status: 'failed', duration: 300, retry: 0}]}]},
    {title: 'unit skip', tests: [{projectName: 'unit-browser', results: [{status: 'skipped', duration: 0, retry: 0}]}]},
  ]}]};
  const metrics = performanceMetrics(report, [{event: 'browser-launch', project: 'unit-browser', browser: 'unit-version'}, {event: 'login'}]);
  assert.equal(metrics.discovered, 3);
  assert.equal(metrics.executed, 2);
  assert.equal(metrics.failed, 1);
  assert.equal(metrics.averageDurationMs, 200);
  assert.equal(metrics.slowest.title, 'unit failure');
  assert.equal(metrics.wallDurationMs, 900);
  assert.equal(metrics.browserLaunches, 1);
  assert.equal(metrics.loginInteractions, 1);
});

test('an unrelated result cannot inflate the current login execution totals', () => {
  const report = {suites: [{specs: [{title: 'unit selected scenario', tests: [{projectName: 'unit-browser', results: [{status: 'passed'}]}]}]}]};
  const entry = (name) => ({result: {name, labels: [{name: 'parentSuite', value: 'unit-browser'}]}});
  const selected = selectCurrentResults([entry('unit selected scenario'), entry('unit unrelated scenario')], report);
  assert.equal(selected.matching.length, 1);
  assert.equal(selected.unrelated.length, 1);
});
