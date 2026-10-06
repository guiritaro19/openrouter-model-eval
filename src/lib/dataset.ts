import Papa from "papaparse";
import { readSheet } from "read-excel-file/node";
import type { Row } from "./types";

export function tableToRows(table: unknown[][]): {
  columns: string[];
  rows: Row[];
} {
  if (table.length < 2)
    throw new Error("The spreadsheet needs a header and at least one case.");
  const columns = table[0].map((value) => String(value ?? "").trim());
  if (columns.some((c) => !c) || new Set(columns).size !== columns.length)
    throw new Error("Empty or duplicate header columns.");
  if (
    columns.some((c) => ["__proto__", "constructor", "prototype"].includes(c))
  )
    throw new Error("Reserved column name.");
  const populated = table
    .slice(1)
    .filter((row) => row.some((v) => v != null && String(v).trim() !== ""));
  if (!populated.length || populated.length > 100)
    throw new Error("The pilot accepts between 1 and 100 rows.");
  const rows = populated.map((row) => {
    if (row.length > columns.length)
      throw new Error("A row has more fields than the header.");
    return Object.fromEntries(
      columns.map((column, i) => [column, String(row[i] ?? "")]),
    );
  });
  return { columns, rows };
}

export async function parseSpreadsheet(buffer: Buffer, filename: string) {
  if (buffer.length > 2_000_000) throw new Error("File exceeds 2 MB.");
  if (/\.csv$/i.test(filename)) {
    const parsed = Papa.parse<string[]>(
      buffer.toString("utf8").replace(/^\uFEFF/, ""),
      { skipEmptyLines: "greedy" },
    );
    if (parsed.errors.length)
      throw new Error("Invalid CSV: check delimiters and quotes.");
    return tableToRows(parsed.data);
  }
  if (/\.xlsx$/i.test(filename)) return tableToRows(await readSheet(buffer));
  throw new Error("Use CSV or XLSX.");
}

export function validateMapping(
  rows: Row[],
  idColumn: string,
  inputColumns: string[],
) {
  const ids = new Set<string>();
  for (const row of rows) {
    const id = row[idColumn]?.trim();
    if (!id) throw new Error("Every case needs a nonempty ID.");
    if (ids.has(id)) throw new Error("Duplicate IDs: " + id);
    ids.add(id);
    if (inputColumns.some((c) => !Object.hasOwn(row, c)))
      throw new Error("Input column does not exist.");
  }
  if (!inputColumns.length || inputColumns.includes(idColumn))
    throw new Error("Select at least one input column other than the ID.");
}

export function matchGolden(
  rows: Row[],
  idColumn: string,
  expectedColumn: string,
  caseIds: string[],
  choices: string[],
) {
  const answers: Record<string, string> = Object.create(null);
  const notes: Record<string, string> = Object.create(null);
  const known = new Set(caseIds);
  for (const row of rows) {
    const id = row[idColumn]?.trim();
    const expected = row[expectedColumn]?.trim();
    if (!id || !known.has(id))
      throw new Error(
        "Golden dataset contains an empty or unknown experiment ID.",
      );
    if (Object.hasOwn(answers, id))
      throw new Error("Duplicate golden ID: " + id);
    if (!expected || !choices.includes(expected))
      throw new Error("Answer is outside the allowed choices: " + id);
    answers[id] = expected;
    notes[id] = row.notes ?? "";
  }
  if (!Object.keys(answers).length) throw new Error("Empty golden dataset.");
  return { answers, notes };
}
