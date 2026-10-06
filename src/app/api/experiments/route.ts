import { NextRequest, NextResponse } from 'next/server';
import { configSchema, createExperiment, execute, reserveExecution } from '@/lib/engine';
import { assertLocal, redact } from '@/lib/security';
import { listExperiments } from '@/lib/store';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  try { assertLocal(request); return NextResponse.json(await listExperiments()); }
  catch { return NextResponse.json({error:'Não foi possível ler o histórico local.'},{status:500}); }
}
export async function POST(request:NextRequest) {
  let release:(()=>void)|undefined;
  try {
    assertLocal(request);
    if(!process.env.OPENROUTER_API_KEY) throw new Error('Configure OPENROUTER_API_KEY no .env.local e reinicie o servidor.');
    if(Number(request.headers.get('content-length')??0)>2_100_000) throw new Error('Configuração muito grande.');
    const config=configSchema.parse(await request.json());
    release=reserveExecution(); const experiment=await createExperiment(config);
    const encoder=new TextEncoder();
    const stream=new ReadableStream({start(controller) {
      const emit=(event:unknown)=>{try{controller.enqueue(encoder.encode(JSON.stringify(redact(event))+'\n'));}catch{/* disconnected browser; persistence continues */}};
      void execute(experiment,emit).finally(()=>{release?.();try{controller.close();}catch{}});
    }});
    return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  } catch(e) { release?.(); return NextResponse.json({error:e instanceof Error&&e.name!=='ZodError'?redact(e.message):'Configuração inválida. Confira IDs, entradas e opções.'},{status:400}); }
}
