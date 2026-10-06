# Phase 0 — engineering foundation

## What we built
A local Git-ready project with empty environment templates, ignore rules, credential scanning, a real public catalog health script and a reproducible Postman collection. No benchmark results were generated.

## Why / NEW SKILL
API inspection establishes the real provider contract before adapters are written. Security scanning separates credentials from public source. In an interview, explain public reachability versus authentication versus successful paid inference, and why decision models use typed questions rather than generated JSON.

## Documentation verified on 2026-10-05
- Catalog: https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties
- Decisions: https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request
- Structured outputs: https://openrouter.ai/docs/guides/features/structured-outputs
- Generation usage: https://openrouter.ai/docs/api/api-reference/generations/get-request-&-usage-metadata-for-a-generation
- Key check: https://openrouter.ai/docs/api/api-reference/api-keys/get-current-api-key

The Decisions OpenAPI was fetched directly from the official Markdown page. POST /api/alpha/decisions accepts model, state and a named questions object; choice questions contain type, instructions and criteria. The response exposes answers and usage. This alpha contract must be rechecked before Phase 2. GET /api/v1/models?output_modalities=all includes decision models, unlike the default text catalog. Model author namespace is not necessarily the actual serving provider.

## Evidence and pending work
The live public catalog was reachable during setup and returned 648 entries including 13 decisions models. This is a catalog observation, not a benchmark or a permanent model count. The user configured OPENROUTER_API_KEY in ignored .env.local. Authenticated health passed on 2026-10-05 (America/Sao_Paulo), without printing credentials or making inference calls. Inference remains NOT MEASURED YET. No connected Postman tool/config reference was found. GitHub CLI is unavailable and exposed GitHub tools do not provide repository creation. Public repository creation/push is pending.

## Publish on GitHub
In the project folder, set your Git identity if missing. Use your own name/email; none are invented by the project.

```powershell
git config user.name "YOUR NAME"
git config user.email "YOUR EMAIL"
# Already initialized on main; for a fresh copy only:
# git init -b main
git add .
node scripts/security-check.mjs
git commit -m "chore: initialize model evaluation lab"
git branch -M main
```

Create an empty public repository named openrouter-model-eval in your GitHub account, without an initial README/license/gitignore. Then replace YOUR_GITHUB_USERNAME below:

```powershell
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/openrouter-model-eval.git
git add .
node scripts/security-check.mjs
git status --short
# Review all tracked files for private datasets and unrecognized credentials.
git push -u origin main
```

Alternatively, once GitHub CLI is installed and authenticated:
```powershell
gh auth login
node scripts/security-check.mjs
gh repo create openrouter-model-eval --public --source . --remote origin --push --description "Open-source model evaluation lab for benchmarking LLMs and decision models across accuracy, latency, tokens and inference cost."
```

## Scope
No MCP implementation is claimed: the collection is the permitted fallback. No license is chosen yet; choose an open-source license before presenting the repository as an open-source template. Next.js and database setup start in Phase 1. Never label a public catalog check as a successful three-model experiment.
