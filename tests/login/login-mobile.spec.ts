import {test,expect} from '../../fixtures/loginFixtures.js';
import {data} from '../../fixtures/testData.js';
test('LOGIN-037: iPhone-size Chrome emulation keeps form, feedback, and dialog usable',async({login,page},info)=>{
 info.annotations.push({type:'limitation',description:'440 x 763 Chrome emulation; typography and visual appearance still require human review. This is not real-device Safari coverage.'});
 await login.goto();
 const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
 expect(await overflow(),'Page has horizontal overflow').toBe(false);
 for(const control of [login.email,login.password,login.submit,login.recovery,login.registration,login.language]){await expect(control).toBeVisible();await control.scrollIntoViewIfNeeded();await expect(control).toBeInViewport();const box=await control.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(441);}
 await login.submit.click();await expect(login.emailError).toHaveText(data.requiredMessage);await login.emailError.scrollIntoViewIfNeeded();await expect(login.emailError).toBeInViewport();
 await login.openLanguages();await expect(login.dialog).toBeVisible();expect(await overflow()).toBe(false);
 for(const name of data.languages){const option=login.languageOption(name);await option.scrollIntoViewIfNeeded();await expect(option).toBeInViewport();}
 await login.dialog.locator('button[aria-label="Close"]').click();await expect(login.dialog).toBeHidden();
});
