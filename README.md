# Kaveen Weliweriya Liyanage — portfolio

Single-page static portfolio. No blog, CMS, authentication, backend or runtime dependencies.

## Local development
Open `index.html` directly or run `npm run build` followed by `npm run preview` (port 8000). Run `npm test` to check local assets and section links. Node 22 is the configured target.

## Deployment
Cloudflare Workers static assets configuration retains the existing Worker name `me`. Build with `npm run build`, then deploy using the existing Cloudflare deployment workflow (or `npx wrangler deploy` with the appropriate account). For Cloudflare Pages instead, set output directory to `dist`. Verify the existing custom domain and deployment settings before publishing.

## Migration
Back up the old working tree or create an archive branch. Remove obsolete blog, admin, functions, worker, css, js, content, projects, docs, XP.CSS-LICENSE.txt, .npmrc and unused assets. Replace the root files, scripts, tests and workflow with this package. Keep your original `.git` folder; do not overwrite or delete it. Generated `dist` is ignored. Review changes before committing. The supplied CV is copied unchanged; review it before public deployment. MSc Distinction is included as confirmed by the site owner. No publication status has been assumed.

## Editing
All copy and projects are in `index.html`; styling is in `style.css`; mobile navigation and active section highlighting are in `script.js`.

## Profile photo
Save your portrait as `assets/profile.jpg` (a square JPEG is recommended). If the file is absent or cannot load, a neutral person icon appears automatically. No HTML changes are required. Rebuild and deploy after adding the photo.
