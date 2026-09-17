import { REPORT } from './report-template.js';

const step=(id,index,fields,register=null)=>({id,title:REPORT.sections[index],fields,register});
export const REPORT_STEPS = [
  step('purpose',0,['goal','questions','scope','method']),
  step('summary',1,['summary']),
  step('entities',2,['entitiesIntro'],'entities'),
  step('findings',3,['findingsIntro'],'findings'),
  step('relations',4,['relationsIntro'],'relations'),
  step('events',5,['chronologyIntro'],'events'),
  step('hypotheses',6,['hypothesesIntro'],'hypotheses'),
  step('conclusions',7,['conclusions','limitations','nextSteps']),
  {id:'custom-chapters',title:'Własne rozdziały',fields:[]},
  step('sources',8,['sourcesIntro'],'sources'),
  step('materials',9,['materialsIntro'],'materials'),
  step('closing',10,['closingIntro','review']),
];
export function adjacentSteps(id) {
  const i=REPORT_STEPS.findIndex(s=>s.id===id);
  return i<0 ? {} : {previous:REPORT_STEPS[i-1],next:REPORT_STEPS[i+1]};
}
