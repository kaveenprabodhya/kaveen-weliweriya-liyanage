# Connect publishing once

The site uses Cloudflare Workers, Decap CMS with GitHub authentication, and Giscus comments. There are no separate visitor accounts. Reading is public; commenting uses GitHub; the editor requires write permission on the portfolio repository.

## 1. Connect Cloudflare Workers

Use the existing `me` Worker connected to the GitHub repository `kaveenprabodhya/kaveen-weliweriya-liyanage`.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm test && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | Repository root (leave blank) |
| Node version | 22 (also recorded in `.node-version`) |

`wrangler.jsonc` sets the assets directory to `dist` and the entry point to `worker/index.js`, which routes GitHub sign-in to the existing handlers in `functions/api/auth/`. Do not set the assets directory to `.`: that would upload the repository and dependencies.

Disable builds for non-production branches so editorial drafts do not receive public deployments. The configuration disables preview URLs, and the build rejects Cloudflare branches other than `main`. Decap previews remain available inside the editor.

The first deploy can complete before sign-in is configured. Save the production address shown under **Domains → Worker URL**:

`https://me.kaveen-prabodhya-99.workers.dev`

Use this exact HTTPS origin for the OAuth settings below. A custom domain is optional. If you change the production domain later, update both `SITE_URL` and the GitHub OAuth app URLs.

## 2. Create a GitHub OAuth app for the editor

In GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App**:

- Application name: `Kaveen Desktop Editor`
- Homepage URL: `https://me.kaveen-prabodhya-99.workers.dev`
- Authorization callback URL: `https://me.kaveen-prabodhya-99.workers.dev/api/auth/callback`

Register the app and generate a client secret. In **Cloudflare → your Worker → Settings → Variables and Secrets**, add these for **Production**:

| Name | Value |
| --- | --- |
| `SITE_URL` | Your exact site origin, e.g. `https://me.kaveen-prabodhya-99.workers.dev` (no path) |
| `GITHUB_CLIENT_ID` | The OAuth app’s client ID |
| `GITHUB_CLIENT_SECRET` | The OAuth app’s client secret, stored as a Secret |

Redeploy after saving. Never place the client secret in GitHub files, an HTML page, or a chat message. If the domain changes, update both the GitHub callback and `SITE_URL`.

The proxy requests GitHub’s `public_repo` scope, verifies write permission on this repository, and returns the token only to the editor window on the configured origin. OAuth app scopes are account-wide, not repository-scoped: GitHub’s authorization screen describes the grant. Cookies validate state and PKCE protects the code exchange. The CMS uses the token to commit content; visitors commenting through Giscus do not pass through this editor sign-in.

## 3. Enable Giscus

The repository is public and GitHub Discussions is enabled. `blog/comments.json` already contains its repository ID and the **Announcements** category ID.

Install the Giscus GitHub App at **https://github.com/apps/giscus**, granting access to **only** `kaveen-weliweriya-liyanage`. This installation needs your GitHub account confirmation; knowing the category IDs alone does not install the app.

Each published article has its own comment thread mapped to `blog/article-slug`, so `/index.html` versus trailing-slash URLs use the same discussion. The Announcements category limits direct discussion creation while the Giscus app can create article threads. Readers sign in with GitHub to comment/react; manage moderation in the repository’s Discussions tab. Turn off an individual article’s **Allow comments** switch to hide its widget; existing discussions remain in GitHub.

No example article or comment is published by this setup. Verify posting on your first real article after installing the app. Repository collaborators with write access can use Decap; do not grant repository write access merely to let someone comment.

## 4. Write and publish

Visit `https://me.kaveen-prabodhya-99.workers.dev/admin/` directly in a browser tab and choose **Login with GitHub**.

1. Open **Blog articles → New Article**.
2. Enter your title, summary, publication date, tags, optional cover and its description.
3. Write your article; drag images into the Markdown editor. Files stay in `blog/article-slug/assets/`.
4. Save a draft. The editorial workflow keeps it on a Git branch until you publish.
5. Use the editor preview. Mark the article ready and publish it through the workflow.
6. Publishing updates `main`; Cloudflare builds the article, refreshes the listing, and deploys automatically.

Future-dated entries are excluded until a build on/after their date. They are **not** a timed scheduler: publish with today’s date for immediate publication, or trigger a Cloudflare rebuild on the intended date.

To edit or delete an article, open it in the CMS and publish the change. The next clean build updates/removes its public page. Keep slugs stable after publishing so existing links and discussion mappings remain valid.

## Local preview

```sh
npm ci
npm test
npm run build
npm run preview
```

Open `http://localhost:8000`. `/admin/` loads the editor from the local bundle in `dist/`. When previewing the source folder, it falls back to the same pinned Decap release on jsDelivr with an integrity check. GitHub login still requires the deployed HTTPS Worker and configured OAuth app. Opening source `index.html` directly still previews the desktop; it does not generate blog posts.

`dist/`, dependencies, and local secrets are ignored by Git. Only publish `dist/`, never the repository folder or `node_modules/`. The article template and unpublished Markdown are not copied to the public build. The repository is public, so commits and draft branches themselves are readable on GitHub; drafts are not confidential storage.

## Checks and troubleshooting

- Build fails: inspect Cloudflare’s build log. Invalid dates, missing required fields, missing cover files, and covers without descriptions fail with the article slug.
- Editor cannot load: use `npm run build` and `npm run preview`, or allow jsDelivr for a source-folder preview. In `wrangler.jsonc`, the assets directory must be `dist`, not the repository root.
- Editor sign-in reports “not configured”: check the three Production variables, the exact domain, and redeploy.
- Sign-in completes but editor does not open: use `/admin/` in its own tab, allow the sign-in popup, and confirm repository write access.
- Comments do not load: confirm the Giscus app is installed on this repository and Discussions remains enabled; ad blockers may block the widget.
- Free plan limits still apply to builds and the small authentication function. Static articles remain readable independently of GitHub sign-in availability.

Sources: [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/), [Decap GitHub/OAuth](https://decapcms.org/docs/backends-overview/), [Decap article folders](https://decapcms.org/docs/collection-folder/), [Giscus](https://giscus.app/).

## Dependency maintenance

The CMS bundle is pinned in `package-lock.json` and served locally in built deployments. Source previews can fall back to an exact-version, integrity-checked jsDelivr URL; no unversioned CDN script is used. The current upstream Decap dependency tree has npm audit advisories in legacy `trim` (regular-expression denial of service) and `uuid` (buffer handling). They are editor-side dependencies, not used by the OAuth handler or article builder. Treat this as an outstanding upstream maintenance item; review Decap releases and rerun `npm audit` and the editor browser check when updating. The Markdown renderer, sanitizer and YAML parser had no audit findings in this setup check. No automatic major-version overrides were applied to the editor’s bundled code.
