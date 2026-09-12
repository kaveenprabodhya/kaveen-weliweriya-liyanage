import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('Blog toolbar history stays inside the frame and drops forward entries after branching', async () => {
  const source = await readFile(new URL('../js/apps.js', import.meta.url), 'utf8');
  const start = source.indexOf('      // Iframe history');
  const end = source.indexOf('\n    },\n  });', start);
  const controls = new Map();
  const control = id => {
    if (!controls.has(id)) controls.set(id, { addEventListener(type, handler) { this[type] = handler; } });
    return controls.get(id);
  };
  const visits = [];
  const doc = { title: 'Blog', baseURI: 'https://example.com/blog/index.html', addEventListener(type, handler) { this[type] = handler; } };
  const frame = { contentDocument: doc, contentWindow: { location: { replace(url) { visits.push(url); } } }, addEventListener(type, handler) { this[type] = handler; } };
  vm.runInNewContext(source.slice(start, end), {
    URL, homeUrl: 'blog/index.html', document: { baseURI: 'https://example.com/' },
    window: { location: { origin: 'https://example.com' } },
    bodyEl: { querySelector: control }, frame, status: {},
  });
  frame.load();
  const clickLink = page => doc.click({ button: 0, target: { closest: () => ({ href: `https://example.com/blog/${page}`, hasAttribute: () => false }) }, preventDefault() {} });
  assert.equal(control('#ie-back').disabled, true);
  control('#ie-back').click();
  assert.equal(visits.length, 0);
  clickLink('first/index.html');
  control('#ie-back').click();
  assert.equal(visits.at(-1), doc.baseURI);
  assert.equal(control('#ie-forward').disabled, false);
  control('#ie-forward').click();
  assert.match(visits.at(-1), /first/);
  control('#ie-back').click();
  clickLink('second/index.html');
  assert.equal(control('#ie-forward').disabled, true);
  control('#ie-forward').click();
  assert.match(visits.at(-1), /second/);
});
