import {test as base,expect,type Page,type BrowserContext} from '@playwright/test';
import * as allure from 'allure-js-commons';
import {appendFileSync,readFileSync,mkdirSync} from 'node:fs';
import {LoginPage} from '../pages/LoginPage.js';
import {config} from '../config/env.js';

export interface CaseRecord{id:string;title:string;category:string;priority:string;expected:string;originalExpected:string;steps:string;status:string;reason:string;preconditions:string;testData:string;locators:string;}
export const catalog:CaseRecord[]=JSON.parse(readFileSync(new URL('./case-catalog.json',import.meta.url),'utf8')) as CaseRecord[];
export function sanitize(value:string):string{
 let text=value;
 for(const secret of [process.env.LOGIN_PASSWORD,process.env.LOGIN_EMAIL].filter((v):v is string=>Boolean(v)))text=text.replaceAll(secret,'[REDACTED]');
 return text.replace(/Bearer\s+[^\s"']+/gi,'Bearer [REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED TOKEN]').replace(/([?&](?:token|code|password|session)[^=]*=)[^&\s"']+/gi,'$1[REDACTED]');
}
type State=Awaited<ReturnType<BrowserContext['storageState']>>;
export const test=base.extend<{login:LoginPage;diagnostics:void;sessionPage:Page},{sessionState:State;browserTelemetry:void}>({
 login:async({page},use)=>{await use(new LoginPage(page));},
 browserTelemetry:[async({browser},use,info)=>{
  mkdirSync('reports',{recursive:true});appendFileSync('reports/telemetry.jsonl',JSON.stringify({event:'browser-launch',project:info.project.name,browser:browser.version(),worker:info.workerIndex,at:new Date().toISOString()})+'\n');await use();
 },{scope:'worker',auto:true}],
 sessionState:[async({browser},use)=>{
  const context=await browser.newContext({baseURL:config.baseURL});
  let state:State;
  try{const login=new LoginPage(await context.newPage());await login.goto();await login.login();state=await context.storageState();}
  catch(error){throw new Error(sanitize(error instanceof Error?error.message:String(error)));}
  finally{await context.close();}
  await use(state);
 },{scope:'worker'}],
 sessionPage:async({page,sessionState},use)=>{
  await page.context().addCookies(sessionState.cookies);
  await page.addInitScript(origins=>{for(const origin of origins)if(location.origin===origin.origin)for(const entry of origin.localStorage)localStorage.setItem(entry.name,entry.value);},sessionState.origins);
  await use(page);
 },
 diagnostics:[async({page,browser},use,info)=>{
  const id=info.title.match(/LOGIN-\d{3}/)?.[0];const record=catalog.find(c=>c.id===id);
  const sensitive=info.tags.includes('@sensitive');const logs:string[]=[];
  if(record){
   await allure.epic('Authentication');await allure.feature('Login');await allure.story(record.category);
   await allure.label('testCaseId',record.id);await allure.severity(record.priority==='Critical'?'critical':record.priority==='High'?'normal':'minor');
   await allure.description(`${record.id}: ${record.title}\n\nExpected: ${record.expected}\n\nSource steps:\n${record.steps}\n\nData reference: ${sensitive?'LOGIN_EMAIL and LOGIN_PASSWORD (values withheld)':record.testData}`);
  }
  await allure.parameter('Environment',config.environment);await allure.parameter('Browser',`${info.project.name}: ${browser.version()}`);await allure.parameter('Viewport',JSON.stringify(page.viewportSize()));
  page.on('console',message=>{if(message.type()==='error')logs.push('Console error: '+sanitize(message.text()).slice(0,500));});
  page.on('pageerror',error=>logs.push('Page error: '+sanitize(error.message).slice(0,500)));
  page.on('response',response=>{if(response.status()>=400){const url=new URL(response.url());logs.push(`HTTP ${response.status()} ${sanitize(url.origin+url.pathname)}`);}});
  page.on('requestfailed',request=>{const url=new URL(request.url());logs.push(`Request failed: ${sanitize(url.origin+url.pathname)}`);});
  try{await use();}
  finally{
   for(const error of info.errors){if(error.message)error.message=sanitize(error.message);if(error.stack)error.stack=sanitize(error.stack);}
   if(info.status!==info.expectedStatus){
    await info.attach('sanitized-diagnostics',{body:Buffer.from(JSON.stringify({timestamp:new Date().toISOString(),browser:browser.version(),viewport:page.viewportSize(),errors:info.errors.map(e=>sanitize(e.message??'')),logs},null,2)),contentType:'application/json'});
    if(sensitive&&!page.isClosed()){
     const password=process.env.LOGIN_PASSWORD??'';
     const exposed=password?await page.locator('body').evaluate((n,s)=>(n as HTMLElement).innerText.includes(s),password).catch(()=>true):true;
     if(!exposed){
      try{await info.attach('masked-failure-screenshot',{body:await page.screenshot({fullPage:true,mask:[page.locator('input,textarea')]}),contentType:'image/png'});}catch{await info.attach('screenshot-unavailable',{body:Buffer.from('Page unavailable before safe capture.'),contentType:'text/plain'});}
     }else await info.attach('screenshot-withheld',{body:Buffer.from('Screenshot withheld because visible secret safety could not be established.'),contentType:'text/plain'});
    }
   }
   if(sensitive){
    await info.attach('evidence-policy',{body:Buffer.from('Automatic trace, video, screenshot, and detailed action recording disabled for credential-bearing scenarios. Safe masked failure screenshots and sanitized diagnostics are used. Video safety cannot be guaranteed across redirects; no credential-bearing video is retained.'),contentType:'text/plain'});
    if(!page.isClosed()){
     await page.locator('input,textarea').evaluateAll(ns=>ns.forEach(n=>{(n as HTMLInputElement).value='';n.removeAttribute('value');})).catch(()=>{});
     await page.close();
    }
   }
  }
 },{auto:true}],
});
export {expect};
