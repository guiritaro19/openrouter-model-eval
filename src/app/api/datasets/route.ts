import { NextRequest, NextResponse } from 'next/server';
import { assertLocal } from '@/lib/security';
import { parseSpreadsheet } from '@/lib/dataset';
export const runtime='nodejs';
export async function POST(request:NextRequest) {
  try {
    assertLocal(request);
    if(Number(request.headers.get('content-length')??0)>2_100_000) throw new Error('Arquivo maior que 2 MB.');
    const form=await request.formData(); const file=form.get('file');
    if(!(file instanceof File)) throw new Error('Selecione um arquivo.');
    return NextResponse.json(await parseSpreadsheet(Buffer.from(await file.arrayBuffer()),file.name));
  } catch(e) { return NextResponse.json({error:e instanceof Error?e.message:'Falha ao importar arquivo.'},{status:400}); }
}
