import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getCatalog } from './catalog';
import { validateMapping } from './dataset';
import { normalizedTask, PROMPT_VERSION, runModel } from './adapter';
import { saveExperiment } from './store';
import type { Experiment } from './types';
export const configSchema=z.object({name:z.string().min(1).max(100),context:z.string().min(1).max(10000),task:z.string().min(1).max(2000),choices:z.record(z.string().min(1).max(50),z.string().min(1).max(1000)).refine(c=>Object.keys(c).length>=2&&Object.keys(c).length<=20,'Use entre 2 e 20 opções.'),rows:z.array(z.record(z.string(),z.string().max(10000))).min(1).max(100),idColumn:z.string().min(1),inputColumns:z.array(z.string()).min(1),modelIds:z.array(z.string()).min(1).max(4)});
let busy=false;
export function reserveExecution() { if(busy) throw new Error('Um experimento já está em execução.'); busy=true; return ()=>{busy=false;}; }
export async function createExperiment(config:z.infer<typeof configSchema>):Promise<Experiment> {
  validateMapping(config.rows,config.idColumn,config.inputColumns);
  if(new Set(config.modelIds).size!==config.modelIds.length) throw new Error('Modelos duplicados.');
  const catalog=await getCatalog(); const models=config.modelIds.map(id=>{const model=catalog.find(m=>m.id===id); if(!model) throw new Error('Modelo ausente do catálogo atual.'); return model;});
  const rows=config.rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,k===config.idColumn?v.trim():v])));
  return {id:randomUUID(),name:config.name,createdAt:new Date().toISOString(),completedAt:null,status:'running',context:config.context,task:config.task,choices:config.choices,rows,idColumn:config.idColumn,inputColumns:config.inputColumns,datasetVersion:createHash('sha256').update(JSON.stringify({rows,idColumn:config.idColumn,inputColumns:config.inputColumns})).digest('hex'),promptVersion:PROMPT_VERSION,models,runs:[],goldenVersions:[],persistence:'local-json'};
}
export async function execute(experiment:Experiment,emit:(event:unknown)=>void) {
  await saveExperiment(experiment); emit({type:'start',experiment});
  const jobs=experiment.rows.flatMap(row=>experiment.models.map(model=>({row,model})));
  let cursor=0; let persistence=Promise.resolve();
  try {
    const workers=Array.from({length:Math.min(4,jobs.length)},async()=>{
      while(cursor<jobs.length) {
        const {row,model}=jobs[cursor++];
        const input=Object.fromEntries(experiment.inputColumns.map(column=>[column,row[column]]));
        const run=await runModel(model,row[experiment.idColumn],normalizedTask(experiment.context,experiment.task,input,experiment.choices));
        experiment.runs.push(run);
        persistence=persistence.then(()=>saveExperiment(experiment)); await persistence;
        emit({type:'result',run});
      }
    });
    const settled=await Promise.allSettled(workers); await persistence;
    if(settled.some(r=>r.status==='rejected')) throw new Error('Falha de persistência: execução incompleta.');
    experiment.status='completed'; experiment.completedAt=new Date().toISOString(); await saveExperiment(experiment); emit({type:'complete',experiment});
  } catch { experiment.status='interrupted'; experiment.completedAt=new Date().toISOString(); await saveExperiment(experiment); emit({type:'error',message:'Execução interrompida. Os resultados já salvos permanecem no histórico.'}); }
}
