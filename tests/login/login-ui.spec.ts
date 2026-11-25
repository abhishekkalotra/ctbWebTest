import {test,expect} from '../../fixtures/loginFixtures.js';
import {data} from '../../fixtures/testData.js';
import {config} from '../../config/env.js';

test.beforeEach(async({login})=>{await login.goto();});
test('LOGIN-001: Render the English sign-in page',async({login})=>{
 await expect(login.heading).toBeVisible();
 for(const control of [login.email,login.password,login.submit,login.toggle,login.recovery,login.registration,login.google,login.logo,login.language]){await expect(control).toHaveCount(1);await expect(control).toBeVisible();}
});
test('LOGIN-002: Verify initial input and submit states',async({login})=>{
 for(const field of [login.email,login.password]){await expect(field).toBeEmpty();await expect(field).toBeEnabled();}
 await expect(login.email).toHaveAttribute('placeholder','xx@domaine.com');await expect(login.password).toHaveAttribute('placeholder','Password');await expect(login.submit).toBeEnabled();
});
test('LOGIN-003: Verify language dialog and initial selection',async({login})=>{
 await login.openLanguages();await expect(login.dialog).toHaveCount(1);await expect(login.dialog.getByText('Choose Language',{exact:true})).toBeVisible();
 for(const name of data.languages)await expect(login.languageOption(name)).toHaveCount(1);
 await expect(login.languageOption('English')).toBeChecked();
});
test('LOGIN-004: Verify brand and account navigation link targets',async({login})=>{
 await expect(login.logo).toHaveAttribute('href','/en');await expect(login.recovery).toHaveAttribute('href','/en/forgot');await expect(login.registration).toHaveAttribute('href','/en/registration');
});
test('LOGIN-005: Both dialog close controls retain English',async({login})=>{
 await login.openLanguages();await login.dialog.locator('button[aria-label="Close"]').click();await expect(login.dialog).toBeHidden();
 await login.openLanguages();await expect(login.languageOption('English')).toBeChecked();await login.dialog.getByText('Close',{exact:true}).click();await expect(login.dialog).toBeHidden();
 await login.openLanguages();await expect(login.languageOption('English')).toBeChecked();
});
test('LOGIN-006: French persists after refresh and navigation; restore English',async({login,page})=>{
 await login.openLanguages();await login.chooseLanguage('Français');await expect(page).toHaveURL(/\/fr\/login$/);
 await page.reload({waitUntil:'load'});await login.openLanguages();await expect(login.languageOption('Français')).toBeChecked();await login.dialog.getByText('Fermé',{exact:true}).click();
 await login.logo.click();await expect(page).toHaveURL(/\/fr\/?$/);await page.goBack({waitUntil:'load'});
 await login.openLanguages();await expect(login.languageOption('Français')).toBeChecked();await login.chooseLanguage('English');await expect(page).toHaveURL(new URL(config.loginPath,config.baseURL).href);await expect(login.heading).toBeVisible();
});
for(const [name,path,heading] of [['recovery','/en/forgot','Reset your password'],['registration','/en/registration','Join CartoBike'],['home','/en','Find used and new cars']]){
 test(`LOGIN-009: ${name} link opens its intended landing page`,async({login,page})=>{
  await ({recovery:login.recovery,registration:login.registration,home:login.logo}[name]!).click();
  if(name==='home')await expect.poll(()=>new URL(page.url()).pathname).toMatch(/^\/(?:en\/?)?$/);else await expect(page).toHaveURL(new URL(path,config.baseURL).href);
  await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
 });
}
test('LOGIN-010: Both fields blank remain on sign-in with required feedback',async({login,page})=>{
 await login.submit.click();await expect(page).toHaveURL(new URL(config.loginPath,config.baseURL).href);await expect.poll(()=>page.getByText(data.requiredMessage,{exact:true}).count()).toBeGreaterThan(0);
});
test('LOGIN-011: Password omitted shows field-specific required feedback',async({login,page})=>{
 await login.fillEmail(data.syntheticEmail);await login.submit.click();await expect(login.passwordError).toHaveCount(1);await expect(login.passwordError).toHaveText(data.requiredMessage);await expect(page).toHaveURL(new URL(config.loginPath,config.baseURL).href);
});
test('LOGIN-012: Email omitted shows field-specific required feedback',async({login,page})=>{
 await login.fillPassword(data.syntheticPassword);await login.submit.click();await expect(login.emailError).toHaveCount(1);await expect(login.emailError).toHaveText(data.requiredMessage);await expect(page).toHaveURL(new URL(config.loginPath,config.baseURL).href);
});
for(const email of data.malformedEmails)test(`LOGIN-013: Reject malformed email ${email}`,async({login,page})=>{
 await login.fillEmail(email);await login.fillPassword(data.syntheticPassword);await login.submit.click();
 await expect.poll(async()=>await login.email.evaluate((n:HTMLInputElement)=>!n.validity.valid)||await login.emailError.textContent()===data.invalidEmailMessage).toBeTruthy();
 await expect(page).toHaveURL(new URL(config.loginPath,config.baseURL).href);
});
test('LOGIN-023: Password is masked by default',async({login})=>{await login.fillPassword(data.syntheticPassword);await expect(login.password).toHaveAttribute('type','password');});
test('LOGIN-024: Reveal and remask a synthetic password',async({login})=>{
 await login.fillPassword(data.syntheticPassword);await login.toggle.click();await expect(login.password).toHaveAttribute('type','text');await login.toggle.click();await expect(login.password).toHaveAttribute('type','password');
});
test('LOGIN-025: Login navigation uses HTTPS',async({page})=>{expect(new URL(page.url()).protocol).toBe('https:');});
test('LOGIN-033: Credential field labels have approved accessible names and associations',async({login,page})=>{
 await expect.soft(login.email).toHaveAccessibleName('E-mail',{timeout:2000});await expect.soft(login.password).toHaveAccessibleName('Password');
 expect.soft(await page.getByLabel('E-mail',{exact:true}).count()).toBe(1);expect.soft(await page.getByLabel('Password',{exact:true}).count()).toBe(1);
});
