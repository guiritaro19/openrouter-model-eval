import { NextRequest, NextResponse } from 'next/server';
import { getCatalog, getPresets } from '@/lib/catalog';
import { assertLocal } from '@/lib/security';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
  try { assertLocal(request); const models=await getCatalog(); return NextResponse.json({models,presets:getPresets(models),configured:!!process.env.OPENROUTER_API_KEY,catalogFetchedAt:new Date().toISOString()}); }
  catch { return NextResponse.json({error:'Não foi possível carregar o catálogo. Confira a conexão e tente novamente.'},{status:503}); }
}
