import {test} from '@playwright/test';
import {readFileSync} from 'node:fs';
const cases=JSON.parse(readFileSync(new URL('../../fixtures/case-catalog.json',import.meta.url),'utf8')) as {id:string;title:string;status:string;reason:string}[];
for(const record of cases.filter(c=>c.status!=='Ready for Automation')){
 test.skip(`${record.id}: ${record.title}`,{annotation:{type:record.status==='Out of Scope'?'out-of-scope':'blocked',description:record.reason}},async()=>{});
}
