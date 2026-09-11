import test from 'node:test';
import assert from 'node:assert/strict';
import { configurationError, settings } from '../functions/api/auth/index.js';

test('OAuth diagnostics identify configuration errors without revealing values', () => {
  const request = new Request('https://portfolio.example/api/auth');
  const env = { SITE_URL: 'https://portfolio.example', GITHUB_CLIENT_ID: 'private-id', GITHUB_CLIENT_SECRET: 'private-secret' };
  assert.equal(configurationError(env, request), null);
  assert.equal(settings(env, request).origin, 'https://portfolio.example');
  assert.match(configurationError({ ...env, GITHUB_CLIENT_SECRET: '' }, request), /missing runtime variable\(s\): GITHUB_CLIENT_SECRET/);
  for (const site of ['invalid', 'http://portfolio.example', 'https://other.example']) {
    const invalid = { ...env, SITE_URL: site };
    const error = configurationError(invalid, request);
    assert.match(error, /SITE_URL/);
    assert.ok(!error.includes(env.GITHUB_CLIENT_ID));
    assert.ok(!error.includes(env.GITHUB_CLIENT_SECRET));
    assert.equal(settings(invalid, request), null);
  }
});
