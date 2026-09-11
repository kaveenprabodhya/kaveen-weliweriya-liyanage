/**
 * Small set of original, flat-vector icons used across the desktop, windows
 * and taskbar. Kept as inline SVG strings so they can be recoloured/reused
 * without extra network requests.
 */
const ICONS = {
  portfolio: '<img src="assets/portfolio-mark.svg" alt="" style="width:100%;height:100%">',
  computer: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="5" width="24" height="16" rx="1.5" fill="#c9d6e3" stroke="#4a5a6a" stroke-width="1"/>
      <rect x="6.5" y="7.5" width="19" height="10" fill="#2a4d7a"/>
      <rect x="8" y="9" width="12" height="1.6" fill="#8fc7ff"/>
      <rect x="8" y="11.4" width="9" height="1.4" fill="#5fa0e0"/>
      <rect x="12" y="21" width="8" height="2.4" fill="#9aa7b3"/>
      <rect x="8.5" y="23.4" width="15" height="2.6" rx="1" fill="#c9d6e3" stroke="#4a5a6a" stroke-width="0.8"/>
    </svg>`,

  folder: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10c0-1.1.9-2 2-2h6l2.4 2.6H26a2 2 0 0 1 2 2V23a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" fill="#ffd85e" stroke="#c99a1e" stroke-width="1"/>
      <path d="M4 12h24v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V12z" fill="#ffc72c" stroke="#c99a1e" stroke-width="1"/>
    </svg>`,

  recycleEmpty: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 11h10l-1 15a2 2 0 0 1-2 1.9h-4A2 2 0 0 1 12 26l-1-15z" fill="#e7ecf1" stroke="#5a6a78" stroke-width="1"/>
      <path d="M9.5 9.5h13l-.6 2h-11.8z" fill="#c3ccd4" stroke="#5a6a78" stroke-width="1"/>
      <rect x="13.5" y="6" width="5" height="2" rx="0.6" fill="#c3ccd4" stroke="#5a6a78" stroke-width="0.8"/>
      <path d="M14 14l.6 9M16 14v9M18 14l-.6 9" stroke="#5a6a78" stroke-width="1" fill="none"/>
    </svg>`,

  recycleFull: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 11h10l-1 15a2 2 0 0 1-2 1.9h-4A2 2 0 0 1 12 26l-1-15z" fill="#e7ecf1" stroke="#5a6a78" stroke-width="1"/>
      <path d="M9.5 9.5h13l-.6 2h-11.8z" fill="#c3ccd4" stroke="#5a6a78" stroke-width="1"/>
      <rect x="13.5" y="6" width="5" height="2" rx="0.6" fill="#c3ccd4" stroke="#5a6a78" stroke-width="0.8"/>
      <rect x="12.6" y="9.2" width="3.2" height="2.6" fill="#e7c469" transform="rotate(-8 14 10)"/>
      <rect x="16.6" y="8.7" width="3" height="2.8" fill="#e79a9a" transform="rotate(10 18 10)"/>
    </svg>`,

  doc: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 4h10l5 5v18a1.4 1.4 0 0 1-1.4 1.4H9A1.4 1.4 0 0 1 7.6 27V5.4A1.4 1.4 0 0 1 9 4z" fill="#ffffff" stroke="#7a8794" stroke-width="1"/>
      <path d="M19 4v5h5z" fill="#d8dfe6" stroke="#7a8794" stroke-width="1"/>
      <rect x="10.5" y="14" width="11" height="1.3" fill="#8b98a5"/>
      <rect x="10.5" y="17" width="11" height="1.3" fill="#8b98a5"/>
      <rect x="10.5" y="20" width="7" height="1.3" fill="#8b98a5"/>
    </svg>`,

  exe: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="20" height="20" rx="2" fill="#dfe6ee" stroke="#5a6a78" stroke-width="1"/>
      <circle cx="16" cy="16" r="6.4" fill="#f4b23f" stroke="#a86e12" stroke-width="1"/>
      <circle cx="16" cy="16" r="2.2" fill="#dfe6ee" stroke="#a86e12" stroke-width="0.8"/>
      <rect x="15.1" y="7.4" width="1.8" height="3" fill="#f4b23f"/>
      <rect x="15.1" y="21.6" width="1.8" height="3" fill="#f4b23f"/>
      <rect x="7.4" y="15.1" width="3" height="1.8" fill="#f4b23f"/>
      <rect x="21.6" y="15.1" width="3" height="1.8" fill="#f4b23f"/>
    </svg>`,

  envelope: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="24" height="17" rx="1.5" fill="#eaf1fb" stroke="#3a6ea5" stroke-width="1"/>
      <path d="M4.6 9L16 18l11.4-9" stroke="#3a6ea5" stroke-width="1.4" fill="none"/>
    </svg>`,

  globe: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="11" fill="#3d7fd6" stroke="#1c4c8f" stroke-width="1.2"/>
      <ellipse cx="16" cy="16" rx="4.2" ry="11" fill="none" stroke="#bcd8f5" stroke-width="1"/>
      <path d="M5 16h22M7 10h18M7 22h18" stroke="#bcd8f5" stroke-width="1"/>
      <path d="M16 5c3 3 3 19 0 22" stroke="#bcd8f5" stroke-width="1" fill="none"/>
    </svg>`,

  notepad: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="4" width="18" height="24" fill="#ffffff" stroke="#7a8794" stroke-width="1"/>
      <rect x="7" y="4" width="18" height="4" fill="#d94b4b"/>
      <rect x="10" y="12" width="12" height="1.2" fill="#9aa7b3"/>
      <rect x="10" y="15" width="12" height="1.2" fill="#9aa7b3"/>
      <rect x="10" y="18" width="8" height="1.2" fill="#9aa7b3"/>
    </svg>`,

  myDocs: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10c0-1.1.9-2 2-2h6l2.4 2.6H26a2 2 0 0 1 2 2V23a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" fill="#ffd85e" stroke="#c99a1e" stroke-width="1"/>
      <path d="M4 12h24v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V12z" fill="#ffc72c" stroke="#c99a1e" stroke-width="1"/>
      <rect x="12" y="14.5" width="9" height="8" fill="#ffffff" stroke="#7a8794" stroke-width="0.8"/>
      <rect x="13.4" y="16.5" width="6.2" height="1" fill="#9aa7b3"/>
      <rect x="13.4" y="18.4" width="6.2" height="1" fill="#9aa7b3"/>
    </svg>`,

  drive: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="11" width="24" height="12" rx="1.5" fill="#dfe6ee" stroke="#5a6a78" stroke-width="1"/>
      <rect x="4" y="11" width="24" height="4" fill="#c3ccd4"/>
      <circle cx="23" cy="19" r="1.6" fill="#4f9b2e"/>
    </svg>`,

  user: `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="user-bg" x1="0" x2="1">
          <stop offset="0%" stop-color="#b8761d"/>
          <stop offset="100%" stop-color="#7d430a"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="6" fill="#b8761d"/>
      <rect x="2" y="2" width="44" height="44" rx="5" fill="url(#user-bg)" stroke="#f3d7a1" stroke-width="1.2"/>
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#d7b06e" opacity="0.22"/>
      <path d="M11 35c2-6 7-9 13-9s11 3 13 9" fill="#6b3d06" opacity="0.75"/>
      <ellipse cx="24" cy="19" rx="7" ry="8.5" fill="#f0d497"/>
      <path d="M18 18c0-3.5 2.6-6.5 6-6.5s6 3 6 6.5-2.4 6.4-6 6.4-6-2.9-6-6.4z" fill="#f5d89a"/>
      <path d="M18 18c1.3-4.2 8.5-5.5 12.5-2.7 1.5 1.1 2.5 3 2.5 5.2 0 1.3-.3 2.7-1 3.5-2.8 3-10 3.4-13.9 1.3-.8-.5-1.1-1.2-1.1-2.6 0-1.8.3-3.4 1-4.7z" fill="#c98c2a" opacity="0.4"/>
      <path d="M15 35h18l-1.3 8H16.4z" fill="#e8c675"/>
      <path d="M18 14h12l2.2 5H15.8z" fill="#d3a14d"/>
      <path d="M17 12h14l1.5 2.2-1 1.4H16.5L15 14.2z" fill="#9d6220"/>
      <circle cx="20.8" cy="17.7" r="1.2" fill="#3a2203"/>
      <circle cx="27.2" cy="17.7" r="1.2" fill="#3a2203"/>
      <path d="M22 22.1c1.2 1.2 3.3 1.2 4.5 0" stroke="#7e460c" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M13 11L9 16M35 11l4 5M13 37l-5 2M35 37l5 2" stroke="#edca7c" stroke-width="1.2" opacity="0.8" fill="none"/>
    </svg>`,

  speaker: `
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8h3l4-3.4v10.8L6 12H3z" fill="currentColor"/>
      <path d="M13 7c1.4 1.6 1.4 5.4 0 7" stroke="currentColor" stroke-width="1.2" fill="none"/>
    </svg>`,

  speakerMuted: `
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8h3l4-3.4v10.8L6 12H3z" fill="currentColor"/>
      <path d="M13 7l5 6M18 7l-5 6" stroke="currentColor" stroke-width="1.3"/>
    </svg>`,

  flag: `
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2c3 3 3 5.5 0 8.5 4-3 6-3 8.5 0-2-3.5-2-6 0-8.5-3.5 2.5-6 2.5-8.5 0z" fill="#f4b23f"/>
      <path d="M11.5 2c3 3 3 5.5 0 8.5 4-3 6-3 8.5 0-2-3.5-2-6 0-8.5-3.5 2.5-6 2.5-8.5 0z" fill="#5db9e8"/>
      <path d="M2 11.5c3 3 3 5.5 0 8.5 4-3 6-3 8.5 0-2-3.5-2-6 0-8.5-3.5 2.5-6 2.5-8.5 0z" fill="#5aa93c"/>
      <path d="M11.5 11.5c3 3 3 5.5 0 8.5 4-3 6-3 8.5 0-2-3.5-2-6 0-8.5-3.5 2.5-6 2.5-8.5 0z" fill="#e05a5a"/>
    </svg>`,

  power: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" fill="#d94b4b" stroke="#7a1f1f" stroke-width="1"/>
      <path d="M16 8v8" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M11 11a8 8 0 1 0 10 0" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </svg>`,

  warning: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4l14 24H2z" fill="#ffd85e" stroke="#a87f10" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="14.7" y="12" width="2.6" height="9" fill="#3a2c00"/>
      <rect x="14.7" y="23" width="2.6" height="2.6" fill="#3a2c00"/>
    </svg>`,

  linkedinBadge: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#3b6fa0"/>
      <text x="16" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#fff">in</text>
    </svg>`,

  githubBadge: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#2b2f36"/>
      <circle cx="10" cy="21" r="2.2" fill="#fff"/>
      <circle cx="22" cy="21" r="2.2" fill="#fff"/>
      <circle cx="16" cy="11" r="2.2" fill="#fff"/>
      <path d="M10 21v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" stroke="#fff" stroke-width="1.4" fill="none"/>
    </svg>`,

  researchgateBadge: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#0f8a72"/>
      <text x="16" y="20.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#fff">RG</text>
    </svg>`,

  orcidBadge: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#3d6fd6"/>
      <text x="16" y="20.5" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="12" font-weight="700" fill="#fff">iD</text>
    </svg>`,

  logoff: `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="6" width="12" height="20" rx="1" fill="#5db9e8" stroke="#1c4c8f" stroke-width="1"/>
      <circle cx="16" cy="16" r="1.2" fill="#1c4c8f"/>
      <path d="M18 16h9m0 0l-3-3m3 3l-3 3" stroke="#1c4c8f" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  chevronLeft: `
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  chevronRight: `
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
};
