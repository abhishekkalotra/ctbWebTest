import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const targets=['allure-results','allure-report','test-results','playwright-report','execution-results.json','telemetry.jsonl','run-metadata.json'];
const report=path.resolve(root,'reports'),archive=path.resolve(report,'runs',stamp);
if(!archive.startsWith(report+path.sep))throw new Error('Unsafe archive path');
fs.mkdirSync(archive,{recursive:true});
// Archive the complete previous review set. Older timestamps can be genuine
// executions from a targeted rerun, so they must not be relabeled as discovery.
for(const name of targets){const from=path.resolve(report,name);if(!from.startsWith(report+path.sep))throw new Error('Unsafe report target');if(fs.existsSync(from))fs.renameSync(from,path.join(archive,name));}
const started=new Date().toISOString();
const command=[path.resolve('node_modules/@playwright/test/cli.js'),'test','tests/login',...process.argv.slice(2)];
const result=spawnSync(process.execPath,command,{stdio:'inherit',env:process.env});
fs.writeFileSync('reports/run-metadata.json',JSON.stringify({started,finished:new Date().toISOString(),exitCode:result.status,automaticRetries:0,arguments:process.argv.slice(2),runKind:process.argv.length===2?'full-suite':'filtered',previousRun:archive,reason:process.env.QA_RUN_REASON??'Requested login suite execution'},null,2));
process.exitCode=result.status??1;
