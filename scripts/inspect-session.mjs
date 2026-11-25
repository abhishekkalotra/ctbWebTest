import {chromium} from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
dotenv.config({quiet:true});
const browser=await chromium.launch({channel:'chrome'});
const context=await browser.newContext();const page=await context.newPage();
const report={timestamp:new Date().toISOString()};
try{
 await page.goto(new URL(process.env.LOGIN_PATH,process.env.BASE_URL).href,{waitUntil:'load'});
 await page.getByPlaceholder('xx@domaine.com',{exact:true}).fill(process.env.LOGIN_EMAIL);
 await page.getByPlaceholder('Password',{exact:true}).fill(process.env.LOGIN_PASSWORD);
 await page.getByRole('button',{name:'Log in',exact:true}).click();
 await page.getByRole('navigation',{name:'Dashboard menu',exact:true}).waitFor();
 const avatar=page.getByRole('img',{name:process.env.AUTH_ACCOUNT_NAME,exact:true});
 report.accountMarker={count:await avatar.count(),visible:await avatar.isVisible()};
 report.avatarMarkup=await avatar.evaluate(n=>n.parentElement.outerHTML);
 await avatar.click();
 report.openMenu=await page.locator('body').ariaSnapshot();
 report.logoutCount=await page.getByText('Logout',{exact:true}).count();
 report.logoutAltCount=await page.getByText('Log out',{exact:true}).count();
 report.logoutLinks=await page.locator('a,button,[role="menuitem"]').evaluateAll(ns=>ns.filter(n=>/log.?out|sign.?out/i.test(n.textContent??'')).map(n=>({tag:n.tagName,role:n.getAttribute('role'),text:n.textContent,href:n.getAttribute('href')})));
 const logout=page.getByText('Log out',{exact:true});report.logoutVisible=await logout.isVisible();report.logoutEnabled=await logout.isEnabled();
 report.logoutAncestors=await logout.evaluate(n=>{const result=[];for(let p=n;p;p=p.parentElement)result.push({tag:p.tagName,ariaHidden:p.getAttribute('aria-hidden'),role:p.getAttribute('role')});return result;});
 await logout.click();await page.waitForURL(u=>u.pathname===process.env.LOGIN_PATH,{timeout:15000});report.logoutPath=new URL(page.url()).pathname;
}catch(e){report.error=e.message;}
finally{await context.close();await browser.close();}
let output=JSON.stringify(report,null,2);for(const v of [process.env.LOGIN_EMAIL,process.env.LOGIN_PASSWORD])output=output.replaceAll(v,'[REDACTED]');fs.writeFileSync('reports/verification/session-inspection.json',output);console.log(output);
