import {test,expect} from '../../fixtures/loginFixtures.js';
import {LoginPage} from '../../pages/LoginPage.js';
import {config,credentials} from '../../config/env.js';

credentials();
test.use({trace:'off',video:'off',screenshot:'off'});
test.beforeEach(async({},info)=>{info.setTimeout(config.navigationTimeout+config.testTimeout);});
test('LOGIN-007: Valid account signs in using Log in', {tag:'@sensitive'},async({login})=>{
 await login.goto();await login.login();await expect(login.accountMarker()).toBeVisible();
});
test('LOGIN-008: Valid account signs in using Enter', {tag:'@sensitive'},async({login})=>{
 await login.goto();await login.login('enter');await expect(login.accountMarker()).toBeVisible();
});
test('LOGIN-026: Password is absent from observed URLs, history transitions, and visible text',{tag:'@sensitive'},async({login,page})=>{
 const {password}=credentials();const urls:string[]=[];page.on('framenavigated',frame=>{if(frame===page.mainFrame())urls.push(frame.url());});
 await login.goto();await login.login();
 expect(urls.some(url=>url.includes(password)||url.includes(encodeURIComponent(password))),'A credential was exposed in a navigation URL; value withheld').toBe(false);
 expect(await page.locator('body').evaluate((n,s)=>(n as HTMLElement).innerText.includes(s),password),'A credential was exposed as visible text; value withheld').toBe(false);
});
test('LOGIN-027: Refresh preserves authenticated access',{tag:'@sensitive'},async({sessionPage})=>{
 const login=new LoginPage(sessionPage);await sessionPage.goto(config.protectedPath,{waitUntil:'load'});await expect(login.accountMarker()).toBeVisible();await sessionPage.reload({waitUntil:'load'});await expect(login.accountMarker()).toBeVisible();await expect.poll(()=>new URL(sessionPage.url()).pathname).toBe(config.protectedPath);
});
test('LOGIN-028: Authenticated login route redirects to home',{tag:'@sensitive'},async({sessionPage})=>{
 await sessionPage.goto(config.loginPath,{waitUntil:'load'});await expect.poll(()=>new URL(sessionPage.url()).pathname).toMatch(/^\/(?:en\/?)?$/);await expect(new LoginPage(sessionPage).accountMarker()).toBeVisible();
});
test('LOGIN-029: Logout redirects to login and protects the account route',{tag:'@sensitive'},async({login,page})=>{
 await login.goto();await login.login();await login.logout();await expect.poll(()=>new URL(page.url()).pathname).toBe(config.loginPath);
 await page.goto(config.protectedPath,{waitUntil:'load'});await expect.poll(()=>new URL(page.url()).pathname).toBe(config.loginPath);await expect(login.heading).toBeVisible();
});
test('LOGIN-030: Browser Back after logout cannot retain protected access',{tag:'@sensitive'},async({login,page})=>{
 await login.goto();await login.login();await login.logout();await expect.poll(()=>new URL(page.url()).pathname).toBe(config.loginPath);await page.goBack({waitUntil:'load'});
 if(new URL(page.url()).pathname===config.protectedPath)await expect.poll(()=>new URL(page.url()).pathname).toBe(config.loginPath);
 await page.reload({waitUntil:'load'});expect(new URL(page.url()).pathname.startsWith('/en/dashboard/'),'Protected dashboard remained after signed-out history refresh').toBe(false);await expect(login.accountMarker()).toHaveCount(0);
});
test('LOGIN-031: Logout removes access from another tab after refresh',{tag:'@sensitive'},async({login,page,context})=>{
 await login.goto();await login.login();const other=await context.newPage();
 try{await other.goto(config.protectedPath,{waitUntil:'load'});await expect(new LoginPage(other).accountMarker()).toBeVisible();await login.logout();await expect.poll(()=>new URL(page.url()).pathname).toBe(config.loginPath);await other.reload({waitUntil:'load'});await expect.poll(()=>new URL(other.url()).pathname).toBe(config.loginPath);}
 finally{await other.close();}
});
