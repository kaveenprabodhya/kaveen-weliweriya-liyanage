import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm, access, readdir, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { build, readArticle, articleHtml, commentsMarkup } from '../scripts/build.mjs';
import { onRequestGet as authorize } from '../functions/api/auth/index.js';
import { onRequestGet as callback } from '../functions/api/auth/callback.js';

const markdown = (title, date = '2026-01-01', extra = '') => `---\ntitle: "${title}"\ndescription: "An actual article summary"\ndate: "${date}"\n${extra}---\n## My findings\n\nWritten by the author.\n`;
const config = { repo: 'owner/comments', repoId: 'R_example', category: 'Announcements', categoryId: 'DIC_example' };
const env = { SITE_URL: 'https://portfolio.pages.dev', GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret' };

test('Markdown is escaped and sanitized; comments use stable article identities', () => {
  const a = readArticle(markdown('<img src=x onerror=alert(1)>') + '<script>alert(1)</script>\n<img src="x" onerror="alert(1)">\n[unsafe](javascript:alert(1))', 'my-post');
  const html = articleHtml(a, config);
  assert.ok(html.includes('&lt;img'));
  assert.ok(!a.body.includes('<script'));
  assert.ok(!a.body.includes('onerror'));
  assert.ok(!/href=["']javascript:/i.test(a.body));
  assert.ok(html.includes('data-term="blog/my-post"'));
  assert.equal(commentsMarkup({ ...a, comments: false }, config), '');
  assert.equal(commentsMarkup(a, { repoId: '', categoryId: '' }), '');
});

test('Invalid article metadata fails the build clearly', () => {
  assert.throws(() => readArticle(markdown('Title'), '../escape'), /slug/);
  assert.throws(() => readArticle(markdown('Title', '2026-02-30'), 'post'), /real YYYY/);
  assert.throws(() => readArticle(markdown('Title', '2026-01-01', 'cover: ../../secret\n'), 'post'), /assets folder/);
  assert.throws(() => readArticle(markdown('Title', '2026-01-01', 'cover: assets/image.jpg\n'), 'post'), /description/);
});

test('Build lists published posts, copies their images, excludes drafts, rebuilds cleanly', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kaveen-build-'));
  try {
    for (const name of ['index.html', 'css', 'js', 'assets', 'content', 'projects', 'admin', 'XP.CSS-LICENSE.txt']) await cp(name, path.join(root, name), { recursive: true });
    await mkdir(path.join(root, 'blog'));
    for (const name of ['index.html', 'style.css', 'comments.json']) await cp(`blog/${name}`, path.join(root, 'blog', name));
    await symlink(path.resolve('node_modules'), path.join(root, 'node_modules'), 'dir');
    for (const [slug, date, extra] of [['old-post', '2026-01-01', ''], ['new-post', '2026-02-01', ''], ['draft-post', '2026-01-01', 'draft: true\n'], ['future-post', '2099-01-01', '']]) {
      await mkdir(path.join(root, 'blog', slug, 'assets'), { recursive: true });
      await writeFile(path.join(root, 'blog', slug, 'index.md'), markdown(slug, date, extra));
      await writeFile(path.join(root, 'blog', slug, 'assets', 'image.txt'), 'article asset');
    }
    await writeFile(path.join(root, '.env'), 'secret');
    const articles = await build({ root, today: '2026-09-11', branch: 'main' });
    assert.deepEqual(articles.map(a => a.slug), ['new-post', 'old-post']);
    const listing = await readFile(path.join(root, 'dist/blog/index.html'), 'utf8');
    assert.ok(listing.indexOf('new-post/index.html') < listing.indexOf('old-post/index.html'));
    await access(path.join(root, 'dist/blog/new-post/assets/image.txt'));
    for (const file of ['.env', 'blog/draft-post', 'blog/future-post', 'blog/new-post/index.md', 'blog/template.html']) await assert.rejects(access(path.join(root, 'dist', file)));
    await rm(path.join(root, 'blog/new-post'), { recursive: true });
    await build({ root, today: '2026-09-11', branch: 'main' });
    await assert.rejects(access(path.join(root, 'dist/blog/new-post')));
    await assert.rejects(build({ root, branch: 'cms/articles/draft' }), /Draft branches/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('OAuth authorization uses secure cookies, random state and PKCE', async () => {
  const result = await authorize({ request: new Request(`${env.SITE_URL}/api/auth`), env });
  assert.equal(result.status, 302);
  const url = new URL(result.headers.get('Location'));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('scope'), 'public_repo');
  assert.match(result.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Lax/);
  const missing = await authorize({ request: new Request(`${env.SITE_URL}/api/auth`), env: {} });
  assert.equal(missing.status, 503);
  const preview = await authorize({ request: new Request('https://untrusted.pages.dev/api/auth'), env });
  assert.equal(preview.status, 503);
});

const state = 'a'.repeat(64), verifier = 'b'.repeat(64);
const request = (suffix = `?state=${state}&code=test-code`, cookie = `__Host-kd-state=${state}; __Host-kd-verifier=${verifier}`) => new Request(`${env.SITE_URL}/api/auth/callback${suffix}`, { headers: { Cookie: cookie } });

test('OAuth rejects forged state without exchanging a code', async () => {
  const result = await callback({ request: request('?state=wrong&code=test-code'), env });
  assert.equal(result.status, 400);
});

test('OAuth cancellation clears the state cookies', async () => {
  const result = await callback({ request: request(`?state=${state}&error=access_denied`), env });
  assert.equal(result.status, 400);
  assert.match(result.headers.get('Set-Cookie'), /Max-Age=0/);
});

test('OAuth permits repository authors and sends tokens only to the exact CMS opener', async () => {
  const original = globalThis.fetch;
  try {
    let count = 0;
    globalThis.fetch = async (url, options) => {
      count++;
      if (count === 1) {
        assert.equal(JSON.parse(options.body).code_verifier, verifier);
        return Response.json({ access_token: 'test-access-token' });
      }
      assert.equal(url, 'https://api.github.com/repos/kaveenprabodhya/kaveen-weliweriya-liyanage');
      return Response.json({ permissions: { push: true } });
    };
    const result = await callback({ request: request(), env });
    assert.equal(result.status, 200);
    const html = await result.text();
    assert.ok(html.includes('event.origin !== origin'));
    assert.ok(html.includes('event.source !== window.opener'));
    assert.ok(html.includes('authorization:github:success:'));
    assert.ok(!html.includes('test-secret'));
    assert.match(result.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
    count = 0;
    globalThis.fetch = async () => ++count === 1 ? Response.json({ access_token: 'visitor-token' }) : Response.json({ permissions: { push: false } });
    const denied = await callback({ request: request(), env });
    assert.equal(denied.status, 403);
    assert.ok(!(await denied.text()).includes('visitor-token'));
  } finally { globalThis.fetch = original; }
});
