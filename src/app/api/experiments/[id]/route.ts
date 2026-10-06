import { NextRequest, NextResponse } from 'next/server';
import { assertLocal } from '@/lib/security';
import { loadExperiment } from '@/lib/store';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try{assertLocal(request);return NextResponse.json(await loadExperiment((await params).id));}
  catch{return NextResponse.json({error:'Experimento não encontrado.'},{status:404});}
}
