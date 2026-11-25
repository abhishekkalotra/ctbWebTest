import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {readZip,writeZip} from './zip-utils.mjs';
dotenv.config({quiet:true});
const secrets=[process.env.LOGIN_PASSWORD,process.env.LOGIN_EMAIL].filter(Boolean);
let modified=0,checked=0;
function textSafe(text){for(const secret of secrets)text=text.replaceAll(secret,'[REDACTED]');return text.replace(/Bearer\s+[^\s"\\]+/gi,'Bearer [REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED TOKEN]');}
function scrub(value,key=''){
 if(/^(?:cookies|storageState|localStorage|sessionStorage)$/i.test(key))return [];
 if(/^(?:authorization|cookie|set-cookie|password|access_token|refresh_token|id_token)$/i.test(key))return '[REDACTED]';
 if(Array.isArray(value))return value.map(v=>scrub(v));
 if(value&&typeof value==='object'){
  if(typeof value.name==='string'&&/^(?:authorization|cookie|set-cookie|x-xsrf-token|x-csrf-token)$/i.test(value.name)&&'value'in value)return {...value,value:'[REDACTED]'};
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,scrub(v,k)]));
 }
 if(typeof value==='string'){
  let result=textSafe(value);
  if(/^https?:\/\//.test(result)){try{const url=new URL(result);url.search='';url.hash='';result=url.href;}catch{}}
  return result;
 }
 return value;
}
function sanitizeBuffer(name,data){
 checked++;
 if(name.endsWith('.zip'))return writeZip(readZip(data).map(e=>({name:e.name,data:sanitizeBuffer(e.name,e.data)})));
 if(/\.(json|jsonl|network|trace|md|txt|log|html|js|css|map|xml|properties)$/i.test(name)){
  let text=data.toString('utf8');
  if(/\.(trace|network)$/i.test(name))text=text.split('\n').map(line=>{if(!line.trim())return line;try{return JSON.stringify(scrub(JSON.parse(line)));}catch{return textSafe(line);}}).join('\n');
  else text=textSafe(text);
  const result=Buffer.from(text);if(!result.equals(data))modified++;
  return result;
 }
 return data;
}
function walk(directory){if(!fs.existsSync(directory))return;for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else{const data=fs.readFileSync(file),safe=sanitizeBuffer(file,data);if(!safe.equals(data))fs.writeFileSync(file,safe);}}}
// Never rewrite the protected .env or historical input documents.
for(const directory of ['reports/allure-results','reports/test-results','reports/playwright-report','reports/runs'])walk(directory);
for(const file of ['reports/execution-results.json','reports/telemetry.jsonl'])if(fs.existsSync(file))fs.writeFileSync(file,sanitizeBuffer(file,fs.readFileSync(file)));
fs.writeFileSync('reports/sanitization-summary.json',JSON.stringify({timestamp:new Date().toISOString(),checked,modified,policy:'Known credentials redacted from text; trace cookies, storage, authorization headers, URL queries and bearer/JWT values removed. Credential-bearing traces/videos disabled at capture.'},null,2));
console.log(JSON.stringify({checked,modified}));
