window.CMS_MANUAL_INIT = true;
// randomUUID is unavailable in some HTTP preview contexts, even when Web Crypto
// random bytes are supported. Keep native implementations; never use Math.random.
if (window.crypto && typeof window.crypto.randomUUID !== 'function' &&
    typeof window.crypto.getRandomValues === 'function') {
  window.crypto.randomUUID = () => {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
    return [hex.slice(0, 4).join(''), hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''), hex.slice(8, 10).join(''), hex.slice(10).join('')].join('-');
  };
}
// Resolve assets from this script, including when the site lives under a subpath.
const adminBase = new URL('.', document.currentScript.src);
const editorStatus = document.getElementById('editor-status');
const cmsVersion = '3.16.0';
const cmsIntegrity = 'sha384-WFBlw1ZGvgE9W2ia0r2gJPu3HOVweIpoHCGmlm3f/9J2OURAjzuJ/lV55gUd4By4';

function loadEditorBundle(src, integrity) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    if (integrity) { script.integrity = integrity; script.crossOrigin = 'anonymous'; }
    script.onload = () => window.CMS ? resolve() : reject(new Error('Missing CMS bundle'));
    script.onerror = () => { script.remove(); reject(new Error('Could not load CMS bundle')); };
    document.head.appendChild(script);
  });
}

async function startEditor() {
  if (window.location.protocol === 'file:') {
    editorStatus.textContent = 'Open the editor through a local web server or your hosted site. For a local preview, run npm run build followed by npm run preview, then open http://localhost:8000/admin/.';
    return;
  }
  try {
    try {
      await loadEditorBundle(new URL('decap-cms.js', adminBase).href);
    } catch (_) {
      // Source-folder previews have no copied bundle. Use the exact same verified release.
      editorStatus.textContent = 'Loading the blog editor…';
      await loadEditorBundle(`https://cdn.jsdelivr.net/npm/decap-cms@${cmsVersion}/dist/decap-cms.js`, cmsIntegrity);
    }
    window.CMS.init({ config: { backend: { base_url: window.location.origin } } });
    window.CMS.registerPreviewStyle(new URL('../blog/style.css', adminBase).href);
    window.CMS.registerPreviewTemplate('articles', ({ entry, widgetFor }) => {
      const h = window.h;
      return h('main', { className: 'article-shell' },
        h('header', { className: 'article-header' },
          h('h1', {}, entry.getIn(['data', 'title']) || 'Untitled'),
          h('p', { className: 'article-dek' }, entry.getIn(['data', 'description']) || '')),
        h('div', { className: 'article-body' }, widgetFor('body')));
    });
    editorStatus.remove();
  } catch (_) {
    editorStatus.textContent = 'The editor could not load from this site or the backup CDN. Check your internet connection or content blocker and reload. For an offline local bundle, run npm ci, npm run build, then npm run preview.';
  }
}
startEditor();
