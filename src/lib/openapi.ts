import { z } from "zod";
import { configSchema } from "./engine";

const ref = (name: string) => ({ $ref: "#/components/schemas/" + name });
const nullableNumber = { type: "number", nullable: true, example: null };
const nullableString = { type: "string", nullable: true, example: null };
const json = (schema: object) => ({ "application/json": { schema } });
const error = (description: string) => ({
  description,
  content: json(ref("Error")),
});
const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Experiment UUID returned by a run or the history endpoint.",
  schema: { type: "string", format: "uuid" },
};
const row = { type: "object", additionalProperties: { type: "string" } };
// The request contract is derived from the same Zod schema used by the runner.
const experimentInput = z.toJSONSchema(configSchema, {
  target: "openapi-3.0",
  io: "input",
});

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "OpenRouter Model Evaluation Kit — Local API",
    version: "0.1.0",
    description:
      "Local-only classification experiments. Keys remain in the backend .env.local. No bearer key is needed in this UI. POST /api/experiments makes real model calls and can consume OpenRouter credits. Schema examples are not measured benchmark results. See the usage guide above for the end-to-end workflow.",
  },
  servers: [{ url: "/", description: "This local application" }],
  tags: [
    {
      name: "Models",
      description: "Discover current text and decision candidates.",
    },
    {
      name: "Datasets",
      description:
        "Parse a request or golden spreadsheet before mapping columns.",
    },
    {
      name: "Experiments",
      description: "Run, reopen and export experiments stored in local files.",
    },
    {
      name: "Golden evaluation",
      description: "Append a golden version without new candidate calls.",
    },
    {
      name: "Documentation",
      description: "Machine-readable OpenAPI specification.",
    },
  ],
  paths: {
    "/api/models": {
      get: {
        tags: ["Models"],
        operationId: "listModels",
        summary: "Get live compatible models and initial candidates",
        description:
          "Text-input models with text or decision output, current pricing, supported capabilities and discovered presets. configured checks key presence, not a new authenticated inference.",
        responses: {
          "200": {
            description: "Catalog and candidate presets.",
            content: json({
              type: "object",
              required: ["models", "presets", "configured", "catalogFetchedAt"],
              properties: {
                models: { type: "array", items: ref("CatalogModel") },
                presets: { type: "array", items: { type: "string" } },
                configured: { type: "boolean" },
                catalogFetchedAt: {
                  type: "string",
                  format: "date-time",
                  description:
                    "Response timestamp; the server can reuse its catalog cache for five minutes.",
                },
              },
            }),
          },
          "503": error("Catalog or local-access check failed."),
        },
      },
    },
    "/api/datasets": {
      post: {
        tags: ["Datasets"],
        operationId: "parseDataset",
        summary: "Import CSV or XLSX for preview and column mapping",
        description:
          "Maximum 2 MB and 100 populated rows. CSV IDs stay strings. XLSX reads its first worksheet; use text cells for leading-zero IDs. This parses a preview and makes no model calls.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "A .csv or .xlsx request/golden file.",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Columns and string-valued row records.",
            content: json({
              type: "object",
              required: ["columns", "rows"],
              properties: {
                columns: { type: "array", items: { type: "string" } },
                rows: { type: "array", items: row, minItems: 1, maxItems: 100 },
              },
            }),
          },
          "400": error(
            "Invalid file, duplicated header, empty dataset or local-access failure.",
          ),
        },
      },
    },
    "/api/experiments": {
      get: {
        tags: ["Experiments"],
        operationId: "listExperiments",
        summary: "List local experiment history",
        responses: {
          "200": {
            description: "Most recent experiment first.",
            content: json({
              type: "array",
              items: {
                type: "object",
                required: [
                  "id",
                  "name",
                  "createdAt",
                  "status",
                  "completed",
                  "total",
                ],
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  status: {
                    type: "string",
                    enum: ["running", "completed", "interrupted"],
                  },
                  completed: {
                    type: "integer",
                    description:
                      "Completed model/case calls, including invalid/error results.",
                  },
                  total: { type: "integer", description: "Cases × models." },
                },
              },
            }),
          },
          "500": error("History could not be read."),
        },
      },
      post: {
        tags: ["Experiments"],
        operationId: "runExperiment",
        summary: "Start a real multi-model experiment",
        description:
          "PAID INFERENCE: this starts actual OpenRouter calls. Replace modelIds with compatible IDs from GET /api/models; never enter API keys here. Up to 100 cases, four candidates and four concurrent calls. One active batch per server process. Returns newline-delimited JSON, not one JSON document. Events are start (experiment), result (run), complete (experiment) and error (message). Browser disconnection does not intentionally cancel the backend; saved calls remain recoverable. The response includes raw redacted metadata. Swagger is an inspection tool; the workbench is the easier way to observe progress.",
        requestBody: {
          required: true,
          content: json({
            ...experimentInput,
            example: {
              name: "One-case classification test",
              context:
                "Fictional teaching task: prioritize enterprise demo requests.",
              task: "Classify this lead.",
              choices: {
                P1: "Enterprise buyer requesting a demo.",
                IGNORE: "No commercial fit.",
              },
              rows: [
                {
                  id: "001",
                  company: "Fictional Acme",
                  signal: "Demo requested",
                },
              ],
              idColumn: "id",
              inputColumns: ["company", "signal"],
              modelIds: ["REPLACE_WITH_A_LIVE_CATALOG_MODEL_ID"],
            },
          }),
        },
        responses: {
          "200": {
            description:
              "Streaming NDJSON events. A valid HTTP response may still contain individual provider errors; inspect each run.status.",
            content: {
              "application/x-ndjson": {
                schema: {
                  type: "string",
                  description:
                    "One JSON event per line. See StreamEvent schemas.",
                  "x-event-schema": ref("StreamEvent"),
                },
              },
            },
          },
          "400": error(
            "Invalid configuration, missing key, unknown model, duplicate IDs, another active batch or local-access failure.",
          ),
        },
      },
    },
    "/api/experiments/{id}": {
      get: {
        tags: ["Experiments"],
        operationId: "getExperiment",
        summary: "Reopen the complete saved experiment",
        parameters: [idParameter],
        responses: {
          "200": {
            description: "Configuration, runs and all golden versions.",
            content: json(ref("Experiment")),
          },
          "404": error(
            "Experiment is unavailable or the request failed local-access validation.",
          ),
        },
      },
    },
    "/api/experiments/{id}/golden": {
      post: {
        tags: ["Golden evaluation"],
        operationId: "appendGoldenVersion",
        summary: "Import a new golden version after execution",
        parameters: [idParameter],
        description:
          "Match by ID, not spreadsheet order. Expected answers must exactly match allowed choices. Partial coverage is allowed and displayed. Unknown or duplicate IDs fail. Existing golden versions are preserved. This operation makes no new model calls.",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["rows", "idColumn", "expectedColumn"],
            properties: {
              rows: { type: "array", minItems: 1, maxItems: 100, items: row },
              idColumn: { type: "string" },
              expectedColumn: { type: "string" },
            },
            example: {
              rows: [
                {
                  id: "001",
                  expected: "P1",
                  notes:
                    "Fictional teaching label; review before using as benchmark evidence.",
                },
              ],
              idColumn: "id",
              expectedColumn: "expected",
            },
          }),
        },
        responses: {
          "200": {
            description: "Saved experiment with the appended golden version.",
            content: json(ref("Experiment")),
          },
          "400": error(
            "Running experiment, invalid mapping, missing/duplicate case ID, invalid expected answer or local-access failure.",
          ),
        },
      },
    },
    "/api/experiments/{id}/export": {
      get: {
        tags: ["Experiments"],
        operationId: "exportWorkbook",
        summary: "Download results and golden comparison as XLSX",
        parameters: [idParameter],
        description:
          "Inputs, Model results, Comparison, Golden and Experiment worksheets. Empty measurement cells mean unavailable, not zero. Full raw metadata and golden history are available in the JSON experiment. No inference calls.",
        responses: {
          "200": {
            description: "Downloadable workbook.",
            content: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                { schema: { type: "string", format: "binary" } },
            },
          },
          "500": error("Workbook could not be exported."),
        },
      },
    },
    "/api/openapi": {
      get: {
        tags: ["Documentation"],
        operationId: "getOpenApi",
        summary: "Download this OpenAPI specification",
        responses: {
          "200": {
            description: "OpenAPI 3.0.3 JSON.",
            content: json({ type: "object" }),
          },
          "403": error("Non-local request."),
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: { error: { type: "string" } },
      },
      CatalogModel: {
        type: "object",
        required: [
          "id",
          "name",
          "author",
          "contextLength",
          "kind",
          "structured",
          "pricing",
          "capabilities",
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          author: {
            type: "string",
            description:
              "Model author namespace; not necessarily the serving provider.",
          },
          contextLength: {
            ...nullableNumber,
            description: "Token context limit, when returned.",
          },
          kind: { type: "string", enum: ["chat", "decision"] },
          structured: { type: "boolean" },
          pricing: {
            type: "object",
            additionalProperties: { type: "string" },
            description:
              "Live catalog pricing in USD per token unless its field specifies another unit. Negative price sentinels are not actual prices.",
          },
          capabilities: { type: "array", items: { type: "string" } },
        },
      },
      Run: {
        type: "object",
        properties: {
          caseId: { type: "string" },
          model: { type: "string" },
          resolvedModel: nullableString,
          provider: nullableString,
          requestId: nullableString,
          answer: nullableString,
          confidence: {
            ...nullableNumber,
            minimum: 0,
            maximum: 1,
            description:
              "Only returned typed-decision confidence; generative confidence stays null.",
          },
          probabilities: {
            type: "object",
            nullable: true,
            additionalProperties: { type: "number" },
          },
          inputTokens: nullableNumber,
          outputTokens: nullableNumber,
          totalTokens: nullableNumber,
          cachedTokens: nullableNumber,
          reasoningTokens: nullableNumber,
          costUsd: nullableNumber,
          costSource: {
            type: "string",
            enum: ["reported", "estimated", "unavailable"],
          },
          latencyMs: {
            type: "number",
            description:
              "Backend elapsed time including retries and backoff; not TTFT.",
          },
          startedAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time" },
          attempts: { type: "integer" },
          status: { type: "string", enum: ["success", "invalid", "error"] },
          error: nullableString,
          normalizedInput: { type: "object" },
          promptVersion: { type: "string" },
          pricingSnapshot: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          rawRequest: { type: "object" },
          rawResponse: { type: "object", nullable: true },
        },
      },
      GoldenVersion: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          answers: { type: "object", additionalProperties: { type: "string" } },
          notes: { type: "object", additionalProperties: { type: "string" } },
        },
      },
      Experiment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
          status: {
            type: "string",
            enum: ["running", "completed", "interrupted"],
          },
          context: { type: "string" },
          task: { type: "string" },
          choices: { type: "object", additionalProperties: { type: "string" } },
          rows: { type: "array", items: row },
          idColumn: { type: "string" },
          inputColumns: { type: "array", items: { type: "string" } },
          datasetVersion: {
            type: "string",
            description: "SHA-256 of input rows and mapping.",
          },
          promptVersion: { type: "string" },
          models: { type: "array", items: ref("CatalogModel") },
          runs: { type: "array", items: ref("Run") },
          goldenVersions: { type: "array", items: ref("GoldenVersion") },
          persistence: { type: "string", enum: ["local-json"] },
        },
      },
      StreamEvent: {
        oneOf: [
          {
            type: "object",
            properties: {
              type: { type: "string", enum: ["start", "complete"] },
              experiment: ref("Experiment"),
            },
          },
          {
            type: "object",
            properties: {
              type: { type: "string", enum: ["result"] },
              run: ref("Run"),
            },
          },
          {
            type: "object",
            properties: {
              type: { type: "string", enum: ["error"] },
              message: { type: "string" },
            },
          },
        ],
      },
    },
  },
};
