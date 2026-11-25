import fs from 'node:fs';
import dotenv from 'dotenv';
import { chromium } from '@playwright/test';

dotenv.config({quiet:true});
const base=process.env.BASE_URL;
if(!base)throw new Error('BASE_URL is required');
const secrets=[process.env.LOGIN_PASSWORD,process.env.LOGIN_EMAIL].filter(Boolean);
const safe=value=>secrets.reduce((s,v)=>s.replaceAll(v,'[REDACTED]'),String(value)).replace(/([?&](?:token|code|password|session)[^=]*=)[^&\s"]+/gi,'$1[REDACTED]');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1425,height:847}});
const page=await context.newPage();
const report={timestamp:new Date().toISOString(),browser:browser.version(),viewport:{width:1425,height:847},locators:[]};
const login=()=>page.goto(new URL(process.env.LOGIN_PATH,base).href,{waitUntil:'load',timeout:30000});
const role=(r,n)=>page.getByRole(r,{name:n,exact:true});
async function inspect(id,expression,locator){
 const count=await locator.count();
 report.locators.push({id,expression,count,visible:count===1?await locator.isVisible():null,enabled:count===1?await locator.isEnabled():null});
}
try{
 await login();await role('heading','Sign in').waitFor();
 const entries=[['L01',"getByRole('textbox', { name: 'xx@domaine.com', exact: true })",role('textbox','xx@domaine.com')],['L02',"getByPlaceholder('Password', { exact: true })",page.getByPlaceholder('Password',{exact:true})],...[
 ['L03','button','Log in'],['L04','button','toggle password visibility'],['L05','link','Forgot password?'],['L06','link','Sign up here'],['L07','button','Google logo Google'],['L08','link','CartoBike Logo'],['L09','button','Switch language'],['L19','region','Notifications Alt+T'],['L20','heading','Sign in']
 ].map(([id,r,n])=>[id,`getByRole('${r}', { name: '${n}', exact: true })`,role(r,n)])];
 for(const entry of entries)await inspect(...entry);
 report.fields=await page.locator('input').evaluateAll(ns=>ns.map(n=>({id:n.id,type:n.type,placeholder:n.placeholder,labels:[...(n.labels??[])].map(l=>l.textContent),ariaInvalid:n.getAttribute('aria-invalid'),describedBy:n.getAttribute('aria-describedby'),wrapper:n.parentElement.parentElement.outerHTML})));
 report.labelCounts={email:await page.getByLabel('E-mail',{exact:true}).count(),password:await page.getByLabel('Password',{exact:true}).count()};
 await role('button','Switch language').click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();
 await inspect('L10',"getByRole('dialog')",dialog);
 report.dialog=await dialog.ariaSnapshot();
 for(const [i,name] of ['English','Deutsch','Français','Nederlands','Español'].entries()){
  await inspect(`L${11+i}`,`dialog.getByRole('button', { name: '${name} ${name} ${name}', exact: true })`,dialog.getByRole('button',{name:`${name} ${name} ${name}`,exact:true}));
 }
 await inspect('L16',"dialog.locator('button[aria-label=\"Close\"]')",dialog.locator('button[aria-label="Close"]'));
 await inspect('L17',"dialog.getByText('Close', { exact: true })",dialog.getByText('Close',{exact:true}));
 report.closeMarkup=await dialog.getByRole('button',{name:'Close',exact:true}).evaluateAll(ns=>ns.map(n=>n.outerHTML));
 await dialog.locator('button[aria-label="Close"]').click();
 report.iconCloseDismissed=await dialog.isHidden();
 await role('button','Switch language').click();await dialog.getByText('Close',{exact:true}).click();
 report.textCloseDismissed=await dialog.isHidden();
 await role('button','Log in').click();
 report.blankSnapshot=await page.locator('main').ariaSnapshot();
 report.validationMarkup=await page.locator('form').evaluate(n=>n.outerHTML);
 const required=page.getByText('This field is required',{exact:true});
 report.locators.push({id:'L18',expression:"field-specific verified error paragraphs; see fieldErrorSelectors",count:await required.count(),visible:await required.count()>0,enabled:null});
 await login();await page.getByPlaceholder('xx@domaine.com',{exact:true}).fill('qa@example.invalid');await role('button','Log in').click();
 report.passwordOmitted=await page.locator('form').evaluate(n=>n.outerHTML);
 await login();await page.getByPlaceholder('Password',{exact:true}).fill('SyntheticOnly123');await role('button','Log in').click();
 report.emailOmitted=await page.locator('main').ariaSnapshot();
 await login();await page.getByPlaceholder('xx@domaine.com',{exact:true}).fill('not-an-email');await page.getByPlaceholder('Password',{exact:true}).fill('SyntheticOnly123');await role('button','Log in').click();
 report.malformed={invalid:await page.getByPlaceholder('xx@domaine.com',{exact:true}).evaluate(n=>!n.validity.valid),snapshot:await page.locator('main').ariaSnapshot()};
 await login();await role('button','Switch language').click();await dialog.getByRole('radio',{name:'Français',exact:true}).click();
 await page.waitForURL(u=>u.pathname.startsWith('/fr/'));
 report.french={path:new URL(page.url()).pathname,snapshot:await page.locator('main').ariaSnapshot()};
 await page.reload({waitUntil:'load'});await role('button','Langue').waitFor();
 report.frenchAfterReload={path:new URL(page.url()).pathname,language:await page.locator('html').getAttribute('lang')};
 for(const [name,path] of [['recovery','/en/forgot'],['registration','/en/registration'],['home','/en']]){
  await page.goto(new URL(path,base).href,{waitUntil:'load'});
  report[name]={path:new URL(page.url()).pathname,headings:await page.getByRole('heading').allTextContents()};
 }
 await context.close();
 const authContext=await browser.newContext({viewport:{width:1425,height:847}});
 const auth=await authContext.newPage();
 await auth.goto(new URL(process.env.LOGIN_PATH,base).href,{waitUntil:'load'});
 await auth.getByPlaceholder('xx@domaine.com',{exact:true}).fill(process.env.LOGIN_EMAIL);
 await auth.getByPlaceholder('Password',{exact:true}).fill(process.env.LOGIN_PASSWORD);
 await auth.getByRole('button',{name:'Log in',exact:true}).click();
 await auth.waitForURL(u=>u.pathname!==process.env.LOGIN_PATH,{timeout:15000});
 report.auth={path:new URL(auth.url()).pathname,snapshot:safe(await auth.locator('body').ariaSnapshot())};
 fs.writeFileSync('reports/verification/inspection.json',safe(JSON.stringify(report,null,2)));
 console.log(JSON.stringify({locators:report.locators,recovery:report.recovery,registration:report.registration,home:report.home,auth:report.auth},null,2));
 await authContext.close();
}catch(e){report.error=safe(e.message);fs.writeFileSync('reports/verification/inspection.json',safe(JSON.stringify(report,null,2)));console.log(safe(JSON.stringify(report,null,2)));process.exitCode=1;}
finally{await browser.close();}
