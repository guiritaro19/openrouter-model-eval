import test from 'node:test';
import assert from 'node:assert/strict';
import { hasSecret } from '../scripts/secret-patterns.mjs';
test('detects provider credentials without printing values',()=>assert.equal(hasSecret('sk-or-v1-'+'x'.repeat(32)),true));
test('detects database passwords',()=>assert.equal(hasSecret('postgresql://' + 'user:' + 'password' + '@localhost/db'),true));
test('allows empty templates and Postman references',()=>assert.equal(hasSecret('OPENROUTER_API_KEY=\nOPENAI_API_KEY=\n{{OPENROUTER_API_KEY}}'),false));
test('detects populated assignments',()=>assert.equal(hasSecret('LANGFUSE_SECRET_KEY='+ 'x'.repeat(24)),true));
