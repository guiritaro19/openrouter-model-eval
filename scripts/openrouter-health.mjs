const authenticated = process.argv.includes('--auth');
const key = process.env.OPENROUTER_API_KEY;
if (authenticated && !key) { console.error('AUTH NOT TESTED: OPENROUTER_API_KEY is empty.'); process.exit(2); }
try {
  const response = await fetch(authenticated ? 'https://openrouter.ai/api/v1/key' : 'https://openrouter.ai/api/v1/models?output_modalities=all', {
    headers: authenticated ? { Authorization: 'Bearer ' + key } : {}, signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const body = await response.json();
  if (!authenticated && !Array.isArray(body.data)) throw new Error('Invalid catalog response');
  console.log(JSON.stringify({ check: authenticated ? 'authentication' : 'public_catalog', status: 'PASS', checkedAt: new Date().toISOString(), ...(authenticated ? {} : { models: body.data.length, decisionModels: body.data.filter(m => m.architecture?.output_modalities?.includes('decisions')).length }), benchmark: 'NOT MEASURED YET' }));
} catch { console.error('Health check failed; response and credentials omitted.'); process.exit(1); }
