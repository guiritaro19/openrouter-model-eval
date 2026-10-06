# Local pilot

The user clarified that fast local experiments are the primary need. PostgreSQL and Supabase are removed from the pilot architecture. Results use ignored JSON files and exports use XLSX/JSON.

## What we built

Next.js/TypeScript interface, validated CSV/XLSX import and mapping, current catalog discovery, provider adapters, concurrent execution, normalized measurements, local history, versioned golden imports, case inspector and workbook export.

## Why it exists / NEW SKILL

Provider abstraction keeps the semantic task equivalent while allowing native chat and Decisions wire formats. Golden evaluation separates obtaining model outputs from measuring quality; you can import the answer key afterward without another model call. Reproducibility requires recording inputs, options, prices, model IDs, raw usage and versions, rather than showing a single unsupported accuracy number.

## Test it

Open http://127.0.0.1:3000. Use the fictional dataset, confirm the candidates, test the first case, inspect raw results, import the teaching golden answers, and download XLSX. `examples/requests.xlsx` and `examples/golden_dataset.xlsx` contain 100 fictional cases and rule-authored labels. You can change context and choices, then upload your own request/golden files.

The exported workbook contains inputs, long-form case/model results, model metrics, current golden answers and experiment configuration. The full JSON additionally retains raw API bodies and every golden version. Never publish exports containing private data.

## Current limits

Enum classification only; one active batch, up to 100 cases and four candidates. HTTP transient retries are bounded. Missing provider measurements remain unavailable. Local files preserve completed calls, but there is no durable automatic resumption. Semantic judges, LangGraph, Langfuse, routing and Pareto charts are future layers. The fictional labels are for learning, not independent benchmark ground truth.

## Run again

`npm run dev` starts development; `npm run build` followed by `npm start` runs the compiled application. Both bind to localhost. On Windows, `scripts/start-local.ps1` can start the compiled server in a hidden background process. Do not start a second instance while the current one is running.
