import type { Row } from './types';
export const demoContext='We sell enterprise revenue automation software. Strong ICPs are B2B companies with more than 200 employees, with contacts in Revenue Operations, Sales Operations or commercial leadership. Prioritize active demo requests. Students, competitors and spam are not prospects. Existing customers needing support must be reviewed by a person.';
export const demoTask='Classify the commercial priority of this lead using the allowed output definitions.';
export const demoChoices={P1:'Strong ICP, commercial leadership and active demo/pricing evaluation.',P2:'Strong ICP and commercial leadership, but only early interest.',NURTURE:'Potential commercial fit but small company or non-buying role.',IGNORE:'Student, competitor, spam, or clearly no commercial fit.',HUMAN_REVIEW:'Missing critical data or existing customer seeking support.'};
const profiles=[
  ['SaaS','500','VP RevOps','Demo requested','Evaluating enterprise automation','P1'],
  ['Fintech','1200','CRO','Pricing visit','Active CPQ evaluation','P1'],
  ['Manufacturing','800','Sales Operations Director','Newsletter','Learning about revenue automation','P2'],
  ['SaaS','35','Founder','Webinar','Early research for a small team','NURTURE'],
  ['Education','15','Student','Newsletter','Academic research only','IGNORE'],
  ['Software','600','Competitor researcher','Pricing visit','Competitor evaluating our positioning','IGNORE'],
  ['Consulting','12','Consultant','Webinar','Research for future small business clients','NURTURE'],
  ['SaaS','650','Existing customer','Support request','Needs support for an existing contract','HUMAN_REVIEW'],
  ['Unknown','1','Spam sender','Unsolicited message','Bulk unrelated advertising','IGNORE'],
  ['','','Unknown','Demo requested','Company size and buyer role missing','HUMAN_REVIEW'],
];
export const demoRows:Row[]=Array.from({length:100},(_,i)=>{const p=profiles[i%profiles.length];return {id:String(i+1).padStart(3,'0'),company:'Fictional Company '+String(i+1).padStart(3,'0'),industry:p[0],employees:p[1],role:p[2],signal:p[3],description:p[4]};});
export const demoGolden:Row[]=demoRows.map((r,i)=>({id:r.id,expected:profiles[i%profiles.length][5],notes:'Fictional, rule-authored teaching label. Review before treating as benchmark truth.'}));
export const demoColumns=Object.keys(demoRows[0]);
