import type { Experiment, Metric, Run } from "./types";
export function percentile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  return (
    sorted[low] + (sorted[Math.ceil(position)] - sorted[low]) * (position - low)
  );
}
function completeSum(values: (number | null)[]) {
  return values.length && values.every((v) => v !== null)
    ? values.reduce<number>((a, b) => a + (b ?? 0), 0)
    : null;
}
export function metrics(experiment: Experiment): Metric[] {
  const golden = experiment.goldenVersions.at(-1)?.answers;
  return experiment.models.map((model) => {
    const runs = experiment.runs.filter((r) => r.model === model.id);
    const scored = golden
      ? runs.filter((r) => Object.hasOwn(golden, r.caseId))
      : [];
    const correct = scored.filter(
      (r) => r.status === "success" && r.answer === golden?.[r.caseId],
    ).length;
    const latencies = runs.map((r) => r.latencyMs);
    const cost = completeSum(runs.map((r) => r.costUsd));
    const tokens = completeSum(runs.map((r) => r.totalTokens));
    return {
      model: model.id,
      completed: runs.length,
      success: runs.filter((r) => r.status === "success").length,
      errors: runs.filter((r) => r.status === "error").length,
      invalid: runs.filter((r) => r.status === "invalid").length,
      scored: scored.length,
      correct,
      accuracy: scored.length ? correct / scored.length : null,
      coverage: golden
        ? Object.keys(golden).length / experiment.rows.length
        : null,
      avgLatency: latencies.length
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : null,
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
      tokens,
      cost,
      costComplete: cost !== null,
      costPerCorrect: correct && cost !== null ? cost / correct : null,
      tokensPerCorrect: correct && tokens !== null ? tokens / correct : null,
    };
  });
}
export function agreement(runs: Run[]): number | null {
  const byCase = new Map<string, Run[]>();
  for (const run of runs)
    byCase.set(run.caseId, [...(byCase.get(run.caseId) ?? []), run]);
  let pairs = 0,
    same = 0;
  for (const group of byCase.values())
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].status !== "success" || group[j].status !== "success")
          continue;
        pairs++;
        if (group[i].answer === group[j].answer) same++;
      }
  return pairs ? same / pairs : null;
}
