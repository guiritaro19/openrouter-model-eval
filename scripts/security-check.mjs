import { execFileSync } from 'node:child_process';
import { hasSecret } from './secret-patterns.mjs';
const git = args => execFileSync('git', args, {encoding:'utf8',maxBuffer:64*1024*1024});
let failed = false;
function inspect(label, content) { if (hasSecret(content)) { console.error('BLOCKED: suspected secret in ' + label + ' (value omitted)'); failed = true; } }
try {
  const names = git(['ls-files','-z']).split('\0').filter(Boolean);
  for (const name of names) {
    if (/^(?:.*\/)?\.env(?:$|\.)/.test(name) && name !== '.env.example') { console.error('BLOCKED: tracked env file'); failed = true; }
    inspect('index:' + name,git(['show',':' + name]));
  }
  for (const revision of git(['rev-list','--all']).trim().split('\n').filter(Boolean)) {
    const paths = git(['ls-tree','-r','--name-only',revision]).trim().split('\n').filter(Boolean);
    for (const name of paths) {
      if (/^(?:.*\/)?\.env(?:$|\.)/.test(name) && name !== '.env.example') { console.error('BLOCKED: env file in history'); failed = true; }
      inspect('history:' + revision.slice(0,8) + ':' + name,git(['show',revision+':'+name]));
    }
  }
  for (const name of ['.env','.env.local','.env.production.local']) {
    try { git(['check-ignore','--quiet',name]); } catch { console.error('BLOCKED: env ignore rule missing'); failed = true; }
  }
  if (failed) process.exitCode = 1;
  else console.log('Automated index/history scan passed. Before publishing, also review all tracked files for private datasets and unrecognized credentials.');
} catch { console.error('Security scan could not complete. Push must remain blocked.'); process.exitCode = 1; }
