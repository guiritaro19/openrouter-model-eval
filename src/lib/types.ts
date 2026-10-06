export type Row = Record<string, string>;
export type CatalogModel = {
  id: string; name: string; author: string; contextLength: number | null;
  kind: 'chat' | 'decision'; structured: boolean;
  pricing: Record<string, string>; capabilities: string[];
};
export type Run = {
  caseId: string; model: string; resolvedModel: string | null; provider: string | null;
  requestId: string | null; answer: string | null; confidence: number | null;
  probabilities: Record<string, number> | null;
  inputTokens: number | null; outputTokens: number | null; totalTokens: number | null;
  cachedTokens: number | null; reasoningTokens: number | null;
  costUsd: number | null; costSource: 'reported' | 'estimated' | 'unavailable';
  latencyMs: number; startedAt: string; completedAt: string; attempts: number;
  status: 'success' | 'invalid' | 'error'; error: string | null;
  normalizedInput: unknown; promptVersion: string; pricingSnapshot: Record<string, string>;
  rawRequest: unknown; rawResponse: unknown;
};
export type GoldenVersion = { id: string; createdAt: string; answers: Record<string, string>; notes: Record<string, string> };
export type Experiment = {
  id: string; name: string; createdAt: string; completedAt: string | null;
  status: 'running' | 'completed' | 'interrupted'; context: string; task: string;
  choices: Record<string, string>; rows: Row[]; idColumn: string; inputColumns: string[];
  datasetVersion: string; promptVersion: string; models: CatalogModel[];
  runs: Run[]; goldenVersions: GoldenVersion[]; persistence: 'local-json';
};
export type Metric = {
  model: string; completed: number; success: number; errors: number; invalid: number;
  scored: number; correct: number; accuracy: number | null; coverage: number | null;
  avgLatency: number | null; p50: number | null; p95: number | null; p99: number | null;
  tokens: number | null; cost: number | null; costComplete: boolean;
  costPerCorrect: number | null; tokensPerCorrect: number | null;
};
