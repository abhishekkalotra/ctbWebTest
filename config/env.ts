import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({path:fileURLToPath(new URL('../.env',import.meta.url)),quiet:true});
function required(name:string):string {
 const value=process.env[name]?.trim();
 if(!value)throw new Error(`Configuration error: ${name} is required. Set it in .env or the process environment.`);
 return value;
}
function positiveInteger(name:string,fallback:number):number {
 const value=Number(process.env[name]??fallback);
 if(!Number.isInteger(value)||value<=0)throw new Error(`Configuration error: ${name} must be a positive integer.`);
 return value;
}
const parsed=new URL(required('BASE_URL'));
if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('Configuration error: BASE_URL must be an HTTP(S) URL without credentials, query, or fragment.');
const selected=(process.env.BROWSER??'chromium,firefox').split(',').map(v=>v.trim());
if(selected.some(v=>!['chromium','firefox'].includes(v)))throw new Error('Configuration error: BROWSER accepts chromium,firefox (comma-separated).');
if(!['true','false'].includes(process.env.HEADLESS??'true'))throw new Error('Configuration error: HEADLESS must be true or false.');
export const config={baseURL:parsed.href,loginPath:process.env.LOGIN_PATH??'/en/login',protectedPath:process.env.PROTECTED_PATH??'',accountName:process.env.AUTH_ACCOUNT_NAME??'',environment:required('TEST_ENV'),timeout:positiveInteger('DEFAULT_TIMEOUT',10000),navigationTimeout:positiveInteger('NAVIGATION_TIMEOUT',30000),testTimeout:positiveInteger('TEST_TIMEOUT',30000),workers:positiveInteger('WORKERS',1),headless:process.env.HEADLESS!=='false',browsers:selected};
export function credentials():{email:string;password:string}{
 const email=required('LOGIN_EMAIL');const password=process.env.LOGIN_PASSWORD;
 if(!password)throw new Error('Configuration error: LOGIN_PASSWORD is required.');
 if(!config.accountName||!config.protectedPath)throw new Error('Configuration error: AUTH_ACCOUNT_NAME and PROTECTED_PATH must be populated from live verification.');
 return {email,password};
}
