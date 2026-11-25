import fs from 'node:fs';
const source=fs.readFileSync('docs/specifications/Cartobike-Login-QA-Report.md','utf8');
const inspection=JSON.parse(fs.readFileSync('reports/verification/inspection.json','utf8'));
if(inspection.error||inspection.locators.length!==20)throw new Error('Live verification is incomplete; do not generate tests.');
const skipped=new Set([35,40,41,42,43]);
const missingRules=new Set([14,32,34,36]);
const changes={
5:'Both close controls dismiss the language dialog without changing locale.',
6:'Selecting French changes the selected locale; it persists on refresh and within the same context. Restore English. Exact translations and new-browser persistence are not asserted.',
7:'An authorized active account signs in and displays its verified account-specific marker. Record the observed destination.',
8:'Enter from Password submits successfully, using the same authenticated result as the Log in button.',
9:'Recovery and registration reach their specified English routes. English home ends at / or /en. Each destination displays the independently observed page indicator.',
12:'Blank email shows This field is required in its field region; no focus rule is imposed.',
13:'Each documented malformed address is rejected using either native email validation or The e-mail address must be a valid email address. Sign-in remains open.',
15:'Leading and trailing email spaces are removed. Internal-space handling and approved submitting fixtures remain unavailable.',
16:'Password spaces are significant and preserved. Dedicated fixtures remain unavailable.',
17:'Email-only and case-insensitive matching. Internationalized/alias fixtures and rules remain unavailable.',
18:'No application-specific length thresholds are specified. No arbitrary boundaries are invented.',
19:'No application-specific length thresholds are specified. No arbitrary boundaries are invented.',
20:'An incorrect password shows Invalid email or password. No submission without approved fixture and attempt budget.',
21:'An unregistered email shows Invalid email or password. A confirmed-unregistered fixture and attempt budget are required.',
22:'Blocked accounts show You have been permanently banned for accessing your account. Please contact support. Unverified accounts show Your email is not verified. Click here To resend. Fixtures unavailable.',
26:'The real password is absent from observed navigation URLs/history transitions and visible text. Never attach the password or a revealing URL.',
27:'Authentication survives a refresh.',
28:'An authenticated visit to the English login route redirects to home (/ or /en).',
29:'Logout redirects to login. Revisiting the verified protected route as guest redirects to login.',
30:'After logout, Back may show public pages; a protected page must redirect to login, including after refresh.',
31:'After logout in one tab, refreshing another tab removes protected access and redirects to login.',
33:'Visible credential labels are associated with inputs; accessible names are E-mail and Password.',
37:'Chrome emulation at 440 x 763: no horizontal page overflow, unclipped form content, reachable controls and usable dialog/feedback. Human visual review is reported separately.',
38:'Run initial-state/render, blank validation, password masking, and actual valid-login scenarios in Chrome and Firefox; derive this case from actual baseline results.',
39:'Google identity must authenticate normally and reach Choose Your Profile Type. No provider credential/consent method is available.',
};
const sections=[...source.matchAll(/^### (LOGIN-(\d{3})) · ([^\r\n]+)\r?\n([\s\S]*?)(?=^### LOGIN-|^## 4\.|$(?![\s\S]))/gm)];
const field=(body,name)=>body.match(new RegExp(`\\*\\*${name}\\*\\* ([^\\r\\n]+)`))?.[1]?.trim()??'';
const catalog=sections.map(([,id,digits,title,body])=>{
 const n=Number(digits);let status='Ready for Automation';let reason='Requirements reviewed against current DOM; latest user decisions override original pending expectations.';
 if(skipped.has(n)){status='Out of Scope';reason='Explicitly excluded in the clarification file and approved implementation plan.';}
 else if(missingRules.has(n)){status='Blocked';reason=n===32?'Exact expiry policy and safe controlled-expiry method unavailable.':'Ambiguous product expectation; user approved blocking this case.';}
 else if(n>=15&&n<=22){status='Blocked';reason=[18,19].includes(n)?'No defined boundary thresholds or boundary fixtures.':'Dedicated fixtures and/or failed-attempt limits unavailable; user approved blocking missing fixtures.';}
 else if(n===39){status='Blocked';reason='Authorized Google sign-in method unavailable; no new consent or provider bypass permitted.';}
 return {id,title,category:field(body,'Category'),priority:field(body,'Priority'),preconditions:field(body,'Preconditions'),testData:field(body,'Test Data'),originalExpected:field(body,'Expected Result'),expected:changes[n]??field(body,'Expected Result'),locators:field(body,'Locator\\(s\\)'),steps:body.match(/\*\*Steps to Reproduce\*\*\s*([\s\S]*?)\*\*Expected Result\*\*/)?.[1].trim()??'',status,reason};
});
if(catalog.length!==43)throw new Error(`Expected 43 source cases; found ${catalog.length}`);
fs.writeFileSync('fixtures/case-catalog.json',JSON.stringify(catalog,null,2));
const clean=v=>String(v).replaceAll('|','\\|').replaceAll('\n',' ');
fs.writeFileSync('reports/verification/requirement-verification-matrix.md',`# Login requirement verification\n\nVerified ${inspection.timestamp}; Chrome ${inspection.browser}; 1425 x 847. Full source catalog retains original expected results separately from approved refinements.\n\n| Test Case ID | Test Case | Requirement Verified | Locator Verified | Automation Status | Remarks |\n|---|---|---|---|---|---|\n`+catalog.map(c=>`| ${c.id} | ${clean(c.title)} | ${c.status==='Ready for Automation'?'Yes; approved sources and conversation':'See blocker/scope'} | ${c.status==='Ready for Automation'?'Yes; live inspection (LOGIN-038 is derived coverage)':'Not execution eligible'} | ${c.status} | ${clean(c.reason)} |`).join('\n')+'\n');
fs.writeFileSync('reports/verification/locator-verification-report.md',`# Login locator verification\n\n${inspection.timestamp}; Chrome ${inspection.browser}; fresh guest context.\n\n| ID | Verified expression | Count | Visible | Enabled |\n|---|---|---:|---|---|\n`+inspection.locators.sort((a,b)=>a.id.localeCompare(b.id)).map(l=>`| ${l.id} | \`${l.expression}\` | ${l.count} | ${l.visible} | ${l.enabled??'N/A'} |`).join('\n')+`\n\nL18 uses the observed application-owned wrappers: \`.field-container:has(#login-email-field) p\` and \`.field-container:has(#login-password-field) p\`. No generated MUI class is used. Uniqueness is asserted in the respective tests.\n\nL19 is an empty, initially invisible notification surface; its existence is not a requirement that an error be visible initially. Both dialog close actions were observed to dismiss it. French changes Switch language to Langue. Radio names remain available inside the dialog.\n\nEmail and Password getByLabel queries each returned 0; both input labels arrays were empty. This remains a defect candidate until formal assertions and independent reproduction.\n\nAuthenticated marker and logout details are recorded separately in session-inspection.json. Destination page headings are observed readiness anchors, not new translation requirements.\n`);
console.log(JSON.stringify({reviewed:catalog.length,candidate:catalog.filter(c=>c.status==='Ready for Automation').length,blocked:catalog.filter(c=>c.status==='Blocked').length,outOfScope:catalog.filter(c=>c.status==='Out of Scope').length}));
