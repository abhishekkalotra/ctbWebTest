import fs from 'node:fs';
import dotenv from 'dotenv';
import {chromium} from '@playwright/test';
dotenv.config({quiet:true});
const browser=await chromium.launch({channel:'chrome'});const report={timestamp:new Date().toISOString(),browser:browser.version(),checks:[]};
const context=await browser.newContext({viewport:{width:1425,height:847}});const page=await context.newPage();
fs.mkdirSync('reports/investigation',{recursive:true});
try{
 await page.goto(new URL(process.env.LOGIN_PATH,process.env.BASE_URL).href,{waitUntil:'load'});
 const email=page.getByPlaceholder('xx@domaine.com',{exact:true}),password=page.getByPlaceholder('Password',{exact:true});
 report.checks.push({caseId:'LOGIN-033',expected:'Associated labels and accessible names E-mail / Password',actual:{emailLabelMatches:await page.getByLabel('E-mail',{exact:true}).count(),passwordLabelMatches:await page.getByLabel('Password',{exact:true}).count(),emailLabelCount:await email.evaluate(n=>n.labels.length),passwordLabelCount:await password.evaluate(n=>n.labels.length)},screenshot:'labels-independent.png'});
 await page.screenshot({path:'reports/investigation/labels-independent.png'});
 await email.fill(process.env.LOGIN_EMAIL);await password.fill(process.env.LOGIN_PASSWORD);await page.getByRole('button',{name:'Log in',exact:true}).click();
 await page.getByRole('img',{name:process.env.AUTH_ACCOUNT_NAME,exact:true}).waitFor();
 await page.goto(new URL(process.env.LOGIN_PATH,process.env.BASE_URL).href,{waitUntil:'load'});
 await page.waitForURL(u=>u.pathname!==process.env.LOGIN_PATH);await page.getByRole('img',{name:process.env.AUTH_ACCOUNT_NAME,exact:true}).waitFor();
 const exposed=await page.locator('body').evaluate((n,s)=>n.innerText.includes(s),process.env.LOGIN_PASSWORD);
 report.checks.push({caseId:'LOGIN-028',expected:'English home / or /en',actualPath:new URL(page.url()).pathname,signedInMarkerVisible:true,screenshot:exposed?'Withheld to protect secrets':'authenticated-redirect-independent.png'});
 if(!exposed)await page.screenshot({path:'reports/investigation/authenticated-redirect-independent.png',mask:[page.locator('input,textarea')]});
}catch(error){report.error=error.message;process.exitCode=1;}
finally{await context.close();await browser.close();}
let output=JSON.stringify(report,null,2);for(const value of [process.env.LOGIN_EMAIL,process.env.LOGIN_PASSWORD].filter(Boolean))output=output.replaceAll(value,'[REDACTED]');fs.writeFileSync('reports/investigation/independent-reproduction.json',output);console.log(output);
