import type { CatalogModel } from "./types";
let cache: { expires: number; models: CatalogModel[] } | null = null;
export async function getCatalog(): Promise<CatalogModel[]> {
  if (cache && cache.expires > Date.now()) return cache.models;
  const response = await fetch(
    "https://openrouter.ai/api/v1/models?output_modalities=all",
    { signal: AbortSignal.timeout(20000), cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(
      "OpenRouter catalog unavailable (HTTP " + response.status + ").",
    );
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error("Invalid catalog format.");
  const models: CatalogModel[] = payload.data
    .filter(
      (m: any) =>
        m.architecture?.input_modalities?.includes("text") &&
        m.architecture?.output_modalities?.some((v: string) =>
          ["text", "decisions"].includes(v),
        ),
    )
    .map((m: any) => ({
      id: m.id,
      name: m.name,
      author: m.id.split("/")[0],
      contextLength: m.context_length ?? null,
      kind: m.architecture.output_modalities.includes("decisions")
        ? "decision"
        : "chat",
      structured:
        m.supported_parameters?.includes("structured_outputs") ?? false,
      pricing: m.pricing ?? {},
      capabilities: m.supported_parameters ?? [],
    }));
  cache = { expires: Date.now() + 300000, models };
  return models;
}
export function getPresets(models: CatalogModel[]) {
  const cheap = models
    .filter(
      (m) =>
        m.kind === "chat" &&
        m.structured &&
        !m.id.includes(":batch") &&
        !m.id.startsWith("~") &&
        Number(m.pricing.prompt) >= 0 &&
        Number(m.pricing.completion) >= 0,
    )
    .sort(
      (a, b) =>
        Number(a.pricing.prompt) +
        Number(a.pricing.completion) -
        (Number(b.pricing.prompt) + Number(b.pricing.completion)),
    );
  return [
    ...[
      models.find(
        (m) =>
          m.kind === "decision" &&
          m.author === "typesafe" &&
          /jev/i.test(m.id) &&
          !m.id.includes("router"),
      ),
      cheap.find((m) => m.author === "openai"),
      cheap.find((m) =>
        ["qwen", "deepseek", "mistralai", "google"].includes(m.author),
      ) ?? cheap.find((m) => !["openai", "typesafe"].includes(m.author)),
    ].filter((m): m is CatalogModel => !!m),
  ].map((m) => m.id);
}
