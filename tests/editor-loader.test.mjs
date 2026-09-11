import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
const source = await readFile(new URL('../admin/init.js', import.meta.url), 'utf8');
async function preview({ failedLoads = 0, protocol = 'https:', nativeUUID } = {}) {
  const urls = [], scripts = [];
  let initialized = false, style;
  const status = { textContent: '', remove() { this.removed = true; } };
  const window = { crypto: { getRandomValues: bytes => webcrypto.getRandomValues(bytes), randomUUID: nativeUUID }, location: { origin: 'https://example.com', protocol } };
  const document = {
    currentScript: { src: 'https://example.com/portfolio/admin/init.js' },
    getElementById: () => status,
    createElement: () => ({ remove() {} }),
    head: { appendChild(script) {
      urls.push(script.src); scripts.push(script);
      if (urls.length <= failedLoads) queueMicrotask(() => script.onerror());
      else {
        window.CMS = { init() { initialized = true; }, registerPreviewStyle(url) { style = url; }, registerPreviewTemplate() {} };
        queueMicrotask(() => script.onload());
      }
    } },
  };
  vm.runInNewContext(source, { window, document, URL, Promise });
  await new Promise(resolve => setImmediate(resolve));
  return { urls, scripts, status, initialized, style, crypto: window.crypto };
}
test('built editor uses its relative local bundle without contacting a CDN', async () => {
  const result = await preview();
  assert.deepEqual(result.urls, ['https://example.com/portfolio/admin/decap-cms.js']);
  assert.equal(result.style, 'https://example.com/portfolio/blog/style.css');
  assert.equal(result.initialized, true);
});
test('source preview falls back to the pinned, integrity-checked CDN bundle', async () => {
  const result = await preview({ failedLoads: 1 });
  assert.match(result.urls[1], /decap-cms@3\.16\.0\/dist\/decap-cms.js$/);
  const digest = createHash('sha384').update(await readFile('node_modules/decap-cms/dist/decap-cms.js')).digest('base64');
  assert.equal(result.scripts[1].integrity, `sha384-${digest}`);
  assert.equal(result.initialized, true);
});
test('unavailable bundles and file previews show actionable messages', async () => {
  const offline = await preview({ failedLoads: 2 });
  assert.equal(offline.initialized, false);
  assert.match(offline.status.textContent, /backup CDN/);
  const file = await preview({ protocol: 'file:' });
  assert.equal(file.urls.length, 0);
  assert.match(file.status.textContent, /local web server/);
});

test('HTTP previews get cryptographic UUID v4 support before CMS initialization', async () => {
  const result = await preview({ protocol: 'http:' });
  const ids = Array.from({ length: 100 }, () => result.crypto.randomUUID());
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(new Set(ids).size, 100);
  assert.equal(result.initialized, true);
});
test('native browser UUID generation is preserved', async () => {
  const nativeUUID = () => 'native-uuid';
  const result = await preview({ nativeUUID });
  assert.equal(result.crypto.randomUUID, nativeUUID);
});
