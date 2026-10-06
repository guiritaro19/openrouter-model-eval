import Papa from 'papaparse';
import { readSheet } from 'read-excel-file/node';
import type { Row } from './types';

export function tableToRows(table: unknown[][]): {columns: string[]; rows: Row[]} {
  if (table.length < 2) throw new Error('A planilha precisa de cabeçalho e pelo menos um caso.');
  const columns = table[0].map(value => String(value ?? '').trim());
  if (columns.some(c => !c) || new Set(columns).size !== columns.length) throw new Error('Colunas vazias ou duplicadas no cabeçalho.');
  if (columns.some(c => ['__proto__','constructor','prototype'].includes(c))) throw new Error('Nome de coluna reservado.');
  const populated = table.slice(1).filter(row => row.some(v => v != null && String(v).trim() !== ''));
  if (!populated.length || populated.length > 100) throw new Error('O piloto aceita entre 1 e 100 linhas.');
  const rows = populated.map(row => {
    if (row.length > columns.length) throw new Error('Linha com mais campos que o cabeçalho.');
    return Object.fromEntries(columns.map((column, i) => [column, String(row[i] ?? '')]));
  });
  return {columns, rows};
}

export async function parseSpreadsheet(buffer: Buffer, filename: string) {
  if (buffer.length > 2_000_000) throw new Error('Arquivo maior que 2 MB.');
  if (/\.csv$/i.test(filename)) {
    const parsed = Papa.parse<string[]>(buffer.toString('utf8').replace(/^\uFEFF/, ''), {skipEmptyLines: 'greedy'});
    if (parsed.errors.length) throw new Error('CSV inválido: confira delimitadores e aspas.');
    return tableToRows(parsed.data);
  }
  if (/\.xlsx$/i.test(filename)) return tableToRows(await readSheet(buffer));
  throw new Error('Use CSV ou XLSX.');
}

export function validateMapping(rows: Row[], idColumn: string, inputColumns: string[]) {
  const ids = new Set<string>();
  for (const row of rows) {
    const id = row[idColumn]?.trim();
    if (!id) throw new Error('Todo caso precisa de um ID preenchido.');
    if (ids.has(id)) throw new Error('IDs duplicados: ' + id);
    ids.add(id);
    if (inputColumns.some(c => !Object.hasOwn(row, c))) throw new Error('Coluna de entrada inexistente.');
  }
  if (!inputColumns.length || inputColumns.includes(idColumn)) throw new Error('Selecione ao menos uma coluna de entrada diferente do ID.');
}

export function matchGolden(rows: Row[], idColumn: string, expectedColumn: string, caseIds: string[], choices: string[]) {
  const answers: Record<string,string> = Object.create(null);
  const notes: Record<string,string> = Object.create(null);
  const known = new Set(caseIds);
  for (const row of rows) {
    const id = row[idColumn]?.trim(); const expected = row[expectedColumn]?.trim();
    if (!id || !known.has(id)) throw new Error('Gabarito contém ID vazio ou ausente do experimento.');
    if (Object.hasOwn(answers,id)) throw new Error('ID duplicado no gabarito: ' + id);
    if (!expected || !choices.includes(expected)) throw new Error('Resposta fora das opções permitidas: ' + id);
    answers[id] = expected; notes[id] = row.notes ?? '';
  }
  if (!Object.keys(answers).length) throw new Error('Gabarito vazio.');
  return {answers, notes};
}
