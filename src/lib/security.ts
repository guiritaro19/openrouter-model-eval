import type { NextRequest } from 'next/server';
export function assertLocal(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  if (!/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host)) throw new Error('O piloto aceita apenas acesso local.');
  const origin = request.headers.get('origin');
  if (origin && origin !== 'http://'+host) throw new Error('Origem não permitida.');
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new Error('Origem não permitida.');
}
export function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    let clean = value;
    for (const key of ['OPENROUTER_API_KEY','OPENAI_API_KEY','LANGFUSE_SECRET_KEY','QDRANT_API_KEY','DATABASE_URL']) {
      const secret = process.env[key]; if (secret) clean = clean.split(secret).join('[REDACTED]');
    }
    return clean.replace(/sk-(?:or-v1-|proj-)?[\w-]{20,}|gh[pousr]_[\w]{20,}|github_pat_[\w]{20,}/g,'[REDACTED]');
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,/^(authorization|api[_-]?key|secret[_-]?key)$/i.test(key)?'[REDACTED]':redact(v)]));
  return value;
}
