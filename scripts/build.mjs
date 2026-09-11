import { cp, mkdir, readdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { parse } from 'yaml';
import sanitizeHtml from 'sanitize-html';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const exists = async p => { try { await stat(p); return true; } catch { return false; } };
export function readArticle(source, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid article slug: ${slug}`);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${slug}: expected YAML front matter`);
  const meta = parse(match[1]);
  if (!meta || typeof meta !== 'object') throw new Error(`${slug}: invalid metadata`);
  for (const key of ['title', 'description', 'date']) {
    if (typeof meta[key] !== 'string' || !meta[key].trim()) throw new Error(`${slug}: ${key} is required`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || !Number.isFinite(Date.parse(meta.date)) || new Date(meta.date).toISOString().slice(0, 10) !== meta.date) throw new Error(`${slug}: date must be a real YYYY-MM-DD date`);
  if (meta.tags != null && (!Array.isArray(meta.tags) || meta.tags.some(tag => typeof tag !== 'string'))) throw new Error(`${slug}: tags must be a list of strings`);
  if (meta.cover && (!/^assets\/[a-zA-Z0-9_./ -]+$/.test(meta.cover) || meta.cover.split('/').includes('..'))) throw new Error(`${slug}: cover must be in this article's assets folder`);
  if (meta.cover && !meta.cover_alt?.trim()) throw new Error(`${slug}: add a description for the cover image`);
  const body = sanitizeHtml(marked.parse(match[2]), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'figure', 'figcaption'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title', 'width', 'height', 'loading'], code: ['class'] },
    allowedSchemes: ['https', 'http', 'mailto'], allowProtocolRelative: false,
    transformTags: { img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }) },
  });
  return { ...meta, slug, tags: meta.tags || [], body, comments: meta.comments !== false };
}
export function commentsMarkup(article, config) {
  if (!article.comments || !config.repoId || !config.categoryId) return '';
  const attrs = { repo: config.repo, 'repo-id': config.repoId, category: config.category,
    'category-id': config.categoryId, mapping: 'specific', term: `blog/${article.slug}`,
    strict: '1', 'reactions-enabled': '1', 'emit-metadata': '0', 'input-position': 'top', theme: 'light', lang: 'en', loading: 'lazy' };
  return `<section class="article-comments" aria-label="Comments"><h2>Discussion</h2><p>Sign in with GitHub to comment. Comments and reactions are stored in GitHub Discussions.</p><div class="giscus"></div><script src="https://giscus.app/client.js" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${escapeHtml(v)}"`).join(' ')} crossorigin="anonymous" async></script></section>`;
}
export function articleHtml(article, config) {
  const e = escapeHtml;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(article.title)} — Kaveen Desktop</title><meta name="description" content="${e(article.description)}"><link rel="stylesheet" href="../style.css"><link rel="icon" href="../../assets/portfolio-mark.svg" type="image/svg+xml"></head><body><main class="article-shell"><nav class="article-nav"><a href="../index.html">← All writing</a><span>Kaveen Desktop</span></nav><article><header class="article-header"><span class="eyebrow">${article.tags.map(e).join(' · ')}</span><h1>${e(article.title)}</h1><p class="article-dek">${e(article.description)}</p><div class="article-meta"><span>Kaveen Weliweriya Liyanage</span><time datetime="${e(article.date)}">${e(article.date)}</time></div></header>${article.cover ? `<figure><img class="article-cover" src="${e(article.cover)}" alt="${e(article.cover_alt)}"></figure>` : ''}<div class="article-body">${article.body}</div></article>${commentsMarkup(article, config)}<footer class="article-end"><a href="../index.html">← All writing</a></footer></main></body></html>`;
}
export async function build({ root = process.cwd(), output = path.join(root, 'dist'), today = new Date().toISOString().slice(0, 10), branch = process.env.CF_PAGES_BRANCH } = {}) {
  if (branch && branch !== 'main') throw new Error('Only main is published. Draft branches must not deploy publicly.');
  if (path.resolve(output) === path.resolve(root) || !path.resolve(output).startsWith(path.resolve(root) + path.sep)) throw new Error('Build output must be a subfolder of the project.');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const name of ['index.html', 'css', 'js', 'assets', 'content', 'projects', 'admin', 'XP.CSS-LICENSE.txt']) {
    await cp(path.join(root, name), path.join(output, name), { recursive: true, filter: p => !p.endsWith('.md') && !p.endsWith('.map') });
  }
  await mkdir(path.join(output, 'blog'), { recursive: true });
  await cp(path.join(root, 'blog/style.css'), path.join(output, 'blog/style.css'));
  const config = JSON.parse(await readFile(path.join(root, 'blog/comments.json'), 'utf8'));
  if (!!config.repoId !== !!config.categoryId) throw new Error('Configure both Giscus repoId and categoryId, or leave both empty.');
  const articles = [];
  for (const entry of await readdir(path.join(root, 'blog'), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const folder = path.join(root, 'blog', entry.name);
    const file = path.join(folder, 'index.md');
    if (!await exists(file)) continue;
    const article = readArticle(await readFile(file, 'utf8'), entry.name);
    if (article.draft === true || article.date > today) continue;
    if (article.cover && !await exists(path.join(folder, article.cover))) throw new Error(`${entry.name}: cover image is missing`);
    const target = path.join(output, 'blog', entry.name);
    await mkdir(target, { recursive: true });
    if (await exists(path.join(folder, 'assets'))) await cp(path.join(folder, 'assets'), path.join(target, 'assets'), { recursive: true });
    await writeFile(path.join(target, 'index.html'), articleHtml(article, config));
    articles.push(article);
  }
  articles.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  let index = await readFile(path.join(root, 'blog/index.html'), 'utf8');
  const listing = articles.length ? `<section id="writing"><div class="section-head"><h2>Latest writing</h2><span>${articles.length} ${articles.length === 1 ? 'article' : 'articles'}</span></div>${articles.map(a => `<a class="featured" href="${a.slug}/index.html"><time class="post-date" datetime="${a.date}">${a.date}</time><div><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.description)}</p></div><span class="read-arrow" aria-hidden="true">→</span></a>`).join('')}</section>` : '<p>No articles yet.</p>';
  if (!index.includes('<!-- BLOG_POSTS -->')) throw new Error('Blog index is missing the BLOG_POSTS marker');
  index = index.replace('<!-- BLOG_POSTS -->', listing);
  await writeFile(path.join(output, 'blog/index.html'), index);
  // Keep the desktop data in sync without editing the source content file.
  const dataFile = path.join(output, 'content/data.js');
  await writeFile(dataFile, (await readFile(dataFile, 'utf8')) + '\nSITE.blog.posts = ' + JSON.stringify(articles.map(a => ({ title: a.title, date: a.date, url: `blog/${a.slug}/index.html`, tags: a.tags }))) + ';\n');
  // Copy the pinned CMS bundle and lazy-loaded chunks, excluding duplicate bundles/maps.
  const bundle = path.join(root, 'node_modules/decap-cms/dist');
  for (const name of await readdir(bundle)) {
    if (name.endsWith('.decap-cms.js') || ['decap-cms.js', 'decap-cms.js.LICENSE.txt', 'cms.css'].includes(name) || name.endsWith('.wasm')) await cp(path.join(bundle, name), path.join(output, 'admin', name));
  }
  await writeFile(path.join(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/auth', '/api/auth/*'], exclude: [] }));
  await writeFile(path.join(output, '_headers'), '/admin/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n  X-Frame-Options: DENY\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
  await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /admin/\nDisallow: /api/\n');
  console.log(`Built ${articles.length} published article(s) into ${output}. Giscus ${config.repoId ? 'configured' : 'awaiting repository/category IDs'}.`);
  return articles;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
