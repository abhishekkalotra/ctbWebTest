import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {writeZip,readZip} from './zip-utils.mjs';
dotenv.config({quiet:true});
const secrets=[process.env.LOGIN_PASSWORD,process.env.LOGIN_EMAIL].filter(Boolean);
function filesAt(root){if(!fs.existsSync(root))return [];return fs.statSync(root).isDirectory()?fs.readdirSync(root).flatMap(name=>filesAt(path.join(root,name))):[root.replaceAll('\\','/')];}
function verify(name,data){
 if(/(^|\/)(?:\.env|\.auth)(?:\/|$)/.test(name))throw new Error('Protected file in archive manifest');
 if(name.endsWith('.zip')){for(const e of readZip(data))verify(name+'/'+e.name,e.data);return;}
 for(const secret of secrets)if(data.includes(Buffer.from(secret)))throw new Error('Known credential found; archive withheld: '+name);
 if(/\.(json|jsonl|network|trace|md|txt|html|js|ts)$/i.test(name)&&/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(data.toString('utf8')))throw new Error('Possible JWT found; archive withheld: '+name);
}
const automation=[...['tests','pages','fixtures','config','scripts','docs'].flatMap(filesAt),...['package.json','package-lock.json','playwright.config.ts','tsconfig.json','.env.example','.gitignore','README.md','Open-Allure-Report.bat']];
const reportFiles=filesAt('reports').filter(f=>!f.startsWith('reports/archive/')&&!f.startsWith('reports/package-')&&!f.endsWith('packaging-manifest.json')&&!/^reports\/runs\/[^/]+\/(?:allure-report|playwright-report|test-results)\//.test(f));
const bugFiles=reportFiles.filter(f=>f.startsWith('reports/bug-reports/')||/^reports\/allure-report\/ctbBugReport_.*\.md$/.test(f)||f.startsWith('reports/allure-results/')||f.startsWith('reports/investigation/')||f.includes('execution-summary')||f.includes('sanitization-summary'));
const packages=[['login-playwright-automation.zip',automation],['login-allure-report.zip',reportFiles],['login-bug-reports.zip',bugFiles],['login-complete-qa-package.zip',[...automation,...reportFiles]]];
fs.mkdirSync('deliverables',{recursive:true});const manifest=[];
for(const [name,files] of packages){
 const entries=[...new Set(files)].map(file=>({name:file,data:fs.readFileSync(file)}));for(const entry of entries)verify(entry.name,entry.data);
 const data=writeZip(entries);const reopened=readZip(data);if(reopened.length!==entries.length)throw new Error('Archive count mismatch');
 const target=path.join('deliverables',name);if(fs.existsSync(target)){const backup=path.resolve('reports/archive/packages',new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(backup,{recursive:true});fs.renameSync(target,path.join(backup,name));}
 fs.writeFileSync(target,data);manifest.push({name,bytes:data.length,entries:reopened.length,readable:true,secretsScanPassed:true});
}
fs.writeFileSync('reports/packaging-manifest.json',JSON.stringify({timestamp:new Date().toISOString(),packages:manifest},null,2));console.log(JSON.stringify(manifest,null,2));
