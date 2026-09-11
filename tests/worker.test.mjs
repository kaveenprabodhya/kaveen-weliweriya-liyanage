import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

test('Worker serves assets and routes auth requests to the existing handlers', async () => {
  const env = { ASSETS: { fetch: async () => new Response('asset') } };
  const request = (path, method = 'GET') => new Request(`https://portfolio.example${path}`, { method });
  assert.equal(await (await worker.fetch(request('/admin/'), env)).text(), 'asset');
  for (const path of ['/api/auth', '/api/auth/', '/api/auth/callback']) {
    const response = await worker.fetch(request(path), env);
    assert.equal(response.status, 503);
    assert.match(await response.text(), /not configured/);
  }
  assert.equal((await worker.fetch(request('/api/missing'), env)).status, 404);
  const response = await worker.fetch(request('/api/auth', 'POST'), env);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET');
});
