import { defineConfig, devices } from '@playwright/test';
import { config } from './config/env.js';
export default defineConfig({
 testDir:'./tests',fullyParallel:true,forbidOnly:Boolean(process.env.CI),retries:0,workers:config.workers,
 timeout:config.testTimeout,expect:{timeout:config.timeout},
 reporter:[['list'],['allure-playwright',{resultsDir:'reports/allure-results',detail:false,environmentInfo:{environment:config.environment,baseURL:config.baseURL,os:process.platform}}],['html',{open:'never',outputFolder:'reports/playwright-report'}],['json',{outputFile:'reports/execution-results.json'}]],
 outputDir:'reports/test-results',
 use:{baseURL:config.baseURL,headless:config.headless,actionTimeout:config.timeout,navigationTimeout:config.navigationTimeout,screenshot:'only-on-failure',video:'retain-on-failure',trace:'retain-on-failure'},
 projects:[
  ...(config.browsers.includes('chromium')?[{name:'chromium',testIgnore:'**/login-mobile.spec.ts',use:{...devices['Desktop Chrome'],channel:'chrome',viewport:{width:1425,height:847}}}]:[]),
  ...(config.browsers.includes('firefox')?[{name:'firefox',testIgnore:'**/login-mobile.spec.ts',use:{...devices['Desktop Firefox'],viewport:{width:1425,height:847}}}]:[]),
  ...(config.browsers.includes('chromium')?[{name:'chromium-mobile',testMatch:'**/login-mobile.spec.ts',use:{...devices['Desktop Chrome'],channel:'chrome',viewport:devices['iPhone 16 Pro Max'].viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true}}]:[]),
 ],
});
