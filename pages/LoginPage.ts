import type { Page, Locator } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { config, credentials } from '../config/env.js';

export class LoginPage {
 readonly email:Locator;readonly password:Locator;readonly submit:Locator;
 readonly toggle:Locator;readonly recovery:Locator;readonly registration:Locator;
 readonly google:Locator;readonly logo:Locator;readonly language:Locator;
 readonly heading:Locator;readonly dialog:Locator;
 readonly emailError:Locator;readonly passwordError:Locator;
 constructor(readonly page:Page){
  this.email=page.getByPlaceholder('xx@domaine.com',{exact:true});
  this.password=page.getByPlaceholder('Password',{exact:true});
  this.submit=page.getByRole('button',{name:'Log in',exact:true});
  this.toggle=page.getByRole('button',{name:'toggle password visibility',exact:true});
  this.recovery=page.getByRole('link',{name:'Forgot password?',exact:true});
  this.registration=page.getByRole('link',{name:'Sign up here',exact:true});
  this.google=page.getByRole('button',{name:'Google logo Google',exact:true});
  this.logo=page.getByRole('link',{name:'CartoBike Logo',exact:true});
  this.language=page.getByRole('button',{name:/^(Switch language|Langue)$/});
  this.heading=page.getByRole('heading',{name:'Sign in',exact:true});
  this.dialog=page.getByRole('dialog');
  this.emailError=page.locator('.field-container:has(#login-email-field) p');
  this.passwordError=page.locator('.field-container:has(#login-password-field) p');
 }
 async goto():Promise<void>{await this.page.goto(config.loginPath,{waitUntil:'load'});await this.heading.waitFor();}
 async fillEmail(value:string):Promise<void>{await this.email.fill(value);}
 async fillPassword(value:string):Promise<void>{await this.password.fill(value);}
 async openLanguages():Promise<void>{await this.language.click();await this.dialog.waitFor();}
 languageOption(name:string):Locator{return this.dialog.getByRole('radio',{name,exact:true});}
 async chooseLanguage(name:string):Promise<void>{await this.dialog.getByRole('button',{name:`${name} ${name} ${name}`,exact:true}).click();}
 accountMarker():Locator{return this.page.getByRole('img',{name:config.accountName,exact:true});}
 async login(method:'click'|'enter'='click'):Promise<void>{
  const {email,password}=credentials();
  mkdirSync('reports',{recursive:true});
  appendFileSync('reports/telemetry.jsonl',JSON.stringify({event:'login',at:new Date().toISOString()})+'\n');
  await this.fillEmail(email);await this.fillPassword(password);
  if(method==='enter')await this.password.press('Enter');else await this.submit.click();
  await this.accountMarker().waitFor({timeout:config.navigationTimeout});
 }
 async logout():Promise<void>{await this.accountMarker().click();await this.page.getByText('Log out',{exact:true}).click();}
}
