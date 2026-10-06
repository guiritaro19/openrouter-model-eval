# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Leo uses this local tool for fast model experiments and to learn AI Evaluation Engineering. The public repository can be reused by other developers.

## Product Purpose

Compare candidate models on the same task and input cases, then evaluate their outputs against an independently imported golden dataset. Success means inspectable real outputs, timing, usage, cost and a downloadable comparison.

## Operating Context

Runs locally at http://127.0.0.1:3000/. Upload CSV/XLSX, map columns, define context and choices, select models, execute, inspect, export and import golden answers afterward. The user confirmed these existing flows must be preserved during the redesign.

## Capabilities and Constraints

Next.js and TypeScript. OpenRouter is the common provider for generative and decision models. Up to 100 cases and four selected candidates; enum classification. Results persist in local JSON files, excluded from Git. No PostgreSQL, Supabase or Docker. XLSX/JSON export and versioned golden answers are implemented. Judges, LangGraph, Langfuse and semantic evaluation are not implemented.

## Brand Commitments

Keep the project name OpenRouter Model Evaluation Kit. The user requests a white background, restrained blue details, varied font weights, and a more organic minimal interface with Bauhaus/constructivist structural influence. Keep the geometric logo shape, in black/gray shades. All project interface, validation messages and documentation must be in English.

## Evidence on Hand

100 fictional GTM input cases and teaching golden labels are in examples/. Small live smoke tests exist only in ignored local results. They are not evidence of a representative benchmark. Never fabricate model performance, confidence, token counts or costs.

## Product Principles

- Same semantic task across providers; native API formats may differ.
- Keep obtaining answers separate from comparing them to golden data.
- Preserve raw evidence and historical versions.
- Missing measurements stay unavailable, never invented or silently zeroed.
- Credentials stay in the ignored backend environment.
