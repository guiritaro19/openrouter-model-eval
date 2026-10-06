import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Experiment } from "./types";
import { redact } from "./security";
const folder = path.join(process.cwd(), "results");
function filename(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid experiment.");
  return path.join(folder, id + ".json");
}
export async function saveExperiment(experiment: Experiment) {
  await mkdir(folder, { recursive: true });
  const target = filename(experiment.id);
  const temp = target + "." + randomUUID() + ".tmp";
  await writeFile(temp, JSON.stringify(redact(experiment), null, 2), {
    mode: 0o600,
  });
  await rename(temp, target);
}
export async function loadExperiment(id: string): Promise<Experiment> {
  return JSON.parse(await readFile(filename(id), "utf8"));
}
export async function listExperiments() {
  await mkdir(folder, { recursive: true });
  const names = (await readdir(folder)).filter((n) =>
    /^[0-9a-f-]{36}\.json$/.test(n),
  );
  const all = await Promise.all(
    names.map((n) => loadExperiment(n.slice(0, -5))),
  );
  return all
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((e) => ({
      id: e.id,
      name: e.name,
      createdAt: e.createdAt,
      status: e.status,
      completed: e.runs.length,
      total: e.rows.length * e.models.length,
    }));
}
