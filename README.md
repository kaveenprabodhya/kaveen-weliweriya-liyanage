# Kaveen Desktop — XP-inspired portfolio

A portfolio site presented as a Windows XP desktop: boot screen, login,
draggable/resizable windows, Start menu, taskbar, the works. Static
site with a small blog build step and a browser-based editor.

## Structure

```
index.html               entry point — links everything below
css/xp.css                vendored widget styling (MIT, botoxparty/XP.css)
css/theme.css              desktop, taskbar, start menu, window manager — everything custom
content/data.js            profile, project catalogue, blog metadata and contact details
js/icons.js                inline SVG icon set
js/windowManager.js         drag / resize / minimize / maximize / focus / close
js/apps.js                  the actual "apps" (My Computer, CV, folders, IE, Outlook, etc.)
js/boot.js                  boot -> login -> desktop sequencing
assets/wallpaper.jpg        desktop background (your uploaded photo)
assets/wallpaper.svg        original vector wallpaper, unused but kept as an alternative
projects/*.html             curated standalone case-study pages, opened from the Projects
                            folder inside the portfolio window. Each page includes architecture,
                            evidence, technology-logo strips and source links; shared styling
                            lives in projects/style.css.
blog/index.html             empty blog landing page, ready for your own writing
blog/template.html          unpublished article scaffold (see blog/README.md)
blog/style.css              blog/article typography and responsive layout
blog/article-slug/          Markdown articles (index.md) and their own assets/
admin/                     Decap editor and collection configuration
functions/api/auth/        GitHub OAuth handlers used by the Cloudflare Worker
scripts/build.mjs          static site and blog generator
docs/PUBLISHING.md         one-time setup and publishing guide
```


## Curated project catalogue

The Projects folder intentionally showcases only the strongest repositories rather than
mirroring the whole GitHub account. Related repositories are combined into one case study
where they represent one product/system (for example PSPIMS frontend + backend, and
SpendWise iOS + API). Tutorial/practice repositories remain on GitHub but are not presented
as portfolio case studies.

Technology marks on the case-study pages are loaded from the jsDelivr Devicon CDN (and,
where needed, Simple Icons) with text labels retained underneath them.

## Editing content

Core shell content — the CV summary, research entries, publications,
project catalogue, blog launcher and contact links — comes from **`content/data.js`**.
Project case studies live in **`projects/`**. Blog articles are stored as
Markdown under **`blog/article-slug/index.md`**. Publish through **`/admin/`**; the build
generates article HTML and updates the listing automatically.

## Running locally

For desktop-only source previews, serve the repository locally. To include generated
articles and the editor, build the site first, then run:

```sh
cd kaveen-weliweriya-liyanage
npx --yes http-server@latest -p 8000 -a 127.0.0.1 -c-1
# open http://127.0.0.1:8000
```

To preview the built site through the Cloudflare Worker locally:

```sh
npm run build
npx wrangler dev
```

## Publishing and hosting

Use **Cloudflare Workers with GitHub integration**. The project now has a build step for browser-based blog publishing:

```sh
npm ci
npm test
npm run build
npm run preview
```

Deploy output: `dist`. Cloudflare build command: `npm test && npm run build`. Deploy command: `npx wrangler deploy`. Publish branch: `main`.

Follow [the one-time connection guide](docs/PUBLISHING.md) to connect Cloudflare, set up GitHub sign-in for `/admin/`, and install Giscus. After setup, writing and publishing happen in the editor; no manual reupload is needed.

## Credits / licensing notes

- `css/xp.css` and the three vendored `.woff`/`.woff2` fonts are from
  the [XP.css](https://github.com/botoxparty/XP.css) project, MIT
  licensed — see `XP.CSS-LICENSE.txt`.
- The wallpaper, icons, and all other code are original, built for
  this project.
- Body text uses the `Tahoma` font stack via the visitor's own OS if
  installed (not embedded/distributed), falling back to Verdana/Arial.


## Portfolio presentation

- Guest login opens **Start Here**, with three featured projects, View CV and Contact. Edit the introduction in `content/data.js`; featured selections and summaries are in `openWelcomeNote()` in `js/apps.js`.
- `assets/portfolio-mark.svg` is the shared K with superscript PT mark, used by the boot screen, login, Start menu, taskbar and favicon.
- Projects lead with problem, contribution, result and a documented design takeaway. See `projects/README.md` for adding your own reflections.
- Windows fill the available screen below 720px; touch users can open desktop and Explorer icons with a single tap. Enter/Space opens desktop items; Escape dismisses the Start menu.
- Browser reload shortcuts are left intact. Reduced-motion preferences disable CSS animations/transitions and bypass boot/login animation delays.
- The blog has no published articles. Follow `blog/README.md` to write and publish your own.


Shared local logos and favicons live in root `assets/`. The CV PDF lives in `assets/cv/` and its link is configured in `SITE.cv.file.href`. Each blog article’s source lives in `blog/article-slug/index.md`, with its own images and files in `blog/article-slug/assets/`. Use `/admin/` to write articles; `blog/README.md` explains the Markdown source format. Project logos live in `assets/projects/`.


Returning visitors on the same browser skip boot/login and the automatic Start Here window after their first completed Guest entry. This preference uses local storage, not an authenticated account; clearing site data or using another browser shows the first-visit flow again. Start Here remains available on the desktop and Start menu. If storage is unavailable, the current tab still remembers entry until reloaded.

Blog article HTML and the listing are generated by `scripts/build.mjs`. Do not edit `dist/` or maintain article listings manually. See [docs/PUBLISHING.md](docs/PUBLISHING.md).
