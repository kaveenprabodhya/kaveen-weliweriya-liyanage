# Write from your browser

After the one-time setup in [docs/PUBLISHING.md](../docs/PUBLISHING.md), open your site’s `/admin/` page and sign in with GitHub. Create an article, upload images, save a draft, preview, and publish. Cloudflare updates the site automatically. Do not edit the blog listing or `SITE.blog.posts` manually.

The public blog remains empty until you publish your own writing.

```text
blog/
  index.html                 listing layout, filled by the build
  style.css                  article and listing styles
  comments.json              public Giscus configuration (not a secret)
  template.html              optional writing prompts, not deployed
  your-article-slug/
    index.md                 article metadata and Markdown, managed by Decap
    assets/                  that article’s images and files
```

The build creates `dist/blog/your-article-slug/index.html` and copies that article’s assets. Existing shared logos, CV and project assets keep their current paths.

For manual Markdown editing, use this structure in `blog/your-article-slug/index.md`:

```markdown
---
title: "Your article title"
description: "Your short summary"
date: "2026-09-11"
tags: ["Research"]
comments: true
---

Write your introduction here.

## What I explored

Write in your own words.

## What I learned

Share your observations and limitations.

![Describe your figure](assets/your-image.png)
```

Use your actual publication date. A future date requires a later rebuild; this is not automatic scheduling. For a cover add `cover: assets/cover.jpg` and `cover_alt: "A description"`. Store the file alongside the article. The builder validates metadata and sanitizes rendered Markdown. Arbitrary scripts and embedded HTML widgets are intentionally removed.

Use `npm run build` then `npm run preview` to inspect the generated site locally. Comments require installation of the Giscus app and a live connection to GitHub. Drafts are not on the public site, but this public repository and its branches are readable; do not write confidential material there.
