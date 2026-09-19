/* Application windows, desktop icons, start menu, context menus. */

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function iconHtml(svg) { return svg || ""; }

/* ---------- tiny audio blip (no external sound assets) ---------- */
let muted = false;
let audioCtx = null;
function playBeep(freq = 720, dur = 0.05) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) { /* audio not available — silently skip */ }
}

/* ---------- reusable pieces ---------- */

function explorerListHtml(items) {
  if (!items.length) {
    return `<p style="padding:14px;font-size:12px;color:#555">This folder is empty right now — check back soon.</p>`;
  }
  return `<div class="explorer-list">` + items.map((it, i) => `
    <div class="explorer-item" data-index="${i}" tabindex="0" role="button">
      <div class="icon-img">${iconHtml(ICONS[it.icon] || ICONS.doc)}</div>
      <span>${escapeHtml(it.name)}</span>
    </div>`).join("") + `</div>`;
}

function wireExplorerList(bodyEl, items, onActivate) {
  let lastTap = { i: -1, t: 0 };

  function activate(el) {
    const i = Number(el.dataset.index);
    // Opening a file/folder is an action, not a new Explorer history entry.
    // Clear the blue selection so Back is never perceived as having to
    // "undo" the selected file before it can navigate to the parent folder.
    bodyEl.querySelectorAll(".explorer-item").forEach((s) => s.classList.remove("selected"));
    lastTap = { i: -1, t: 0 };
    onActivate(items[i]);
  }

  bodyEl.querySelectorAll(".explorer-item").forEach((el) => {
    el.addEventListener("click", (event) => {
      bodyEl.querySelectorAll(".explorer-item").forEach((s) => s.classList.remove("selected"));
      el.classList.add("selected");

      if (window.matchMedia("(pointer: coarse)").matches) { activate(el); return; }
      const i = Number(el.dataset.index);
      const now = Date.now();
      // Keep double-tap support for touch, while letting the browser's native
      // dblclick event own mouse double-clicks so activation only fires once.
      if (event.detail < 2 && lastTap.i === i && now - lastTap.t < 450) activate(el);
      else lastTap = { i, t: now };
    });
    el.addEventListener("dblclick", () => activate(el));
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(el); }
    });
  });
}

function notepadContent(title, body) {
  // Notepad text is paragraph-based rather than a preformatted block.
  // Single source line breaks are treated as wrapping hints, while blank
  // lines still create paragraphs. This lets the copy genuinely reflow
  // when the Notepad window is resized or maximized.
  const paragraphs = String(body || "")
    .trim()
    .split(/\n\s*\n/)
    .map((block) => `<p>${escapeHtml(block).replace(/\s*\n\s*/g, " ")}</p>`)
    .join("");
  return `<div class="notepad-body" role="document">${paragraphs}</div>`;
}

function openDocViewer(title, body, link) {
  playBeep();
  WM.open({
    id: "doc-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    icon: ICONS.doc,
    width: 560, height: 440,
    ...anchorNear("explorer", 560, 440, 46, 58),
    content: `
      <div class="notepad-viewer${link ? " has-action" : ""}">
        ${notepadContent(title, body)}
        ${link ? `
          <div class="notepad-actionbar">
            <button id="open-link-btn">Open link</button>
          </div>` : ""}
      </div>`,
    onMount(bodyEl) {
      bodyEl.classList.add("notepad-host");
      const btn = bodyEl.querySelector("#open-link-btn");
      if (btn) btn.addEventListener("click", () => window.open(link, "_blank", "noopener"));
    },
  });
}

/* ---------- portfolio terminals ---------- */

function terminalPromptMarkup(drive) {
  return `
    <div class="terminal-exit-hint"><span class="term-hint-label">TIP</span> Type <span class="term-command">EXIT</span> + Enter, or press <span class="term-command">Ctrl+C</span>, to close this window.</div>
    <div class="terminal-live-history" aria-live="polite"></div>
    <div class="terminal-input-line">
      <span class="term-prompt">${drive}\\PORTFOLIO&gt;</span>
      <span class="terminal-command-entry" contenteditable="true" role="textbox" aria-label="Command prompt" spellcheck="false"></span>
    </div>`;
}

function wireExitOnlyTerminal(bodyEl, terminalId, drive) {
  const screen = bodyEl.querySelector(".terminal-screen");
  const editor = bodyEl.querySelector(".terminal-command-entry");
  const history = bodyEl.querySelector(".terminal-live-history");
  if (!screen || !editor || !history) return;

  const closeTerminal = () => WM.close(terminalId);

  function appendRejectedCommand(commandText) {
    const entry = document.createElement("div");
    entry.className = "terminal-history-entry";

    const commandLine = document.createElement("div");
    const prompt = document.createElement("span");
    prompt.className = "term-prompt";
    prompt.textContent = `${drive}\\PORTFOLIO>`;
    const command = document.createElement("span");
    command.className = "term-command";
    command.textContent = commandText;
    commandLine.append(prompt, command);

    const error = document.createElement("div");
    error.className = "terminal-error";
    error.textContent = `'${commandText}' is not recognized. Only EXIT and Ctrl+C are enabled.`;
    entry.append(commandLine, error);
    history.appendChild(entry);
    screen.scrollTop = screen.scrollHeight;
  }

  function readCommand() {
    return (editor.textContent || "").replace(/\u00a0/g, " ").trim();
  }

  function clearCommand() {
    editor.textContent = "";
  }

  editor.addEventListener("keydown", (event) => {
    if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      closeTerminal();
      return;
    }

    if (event.key !== "Enter") return;
    event.preventDefault();
    const typed = readCommand();
    clearCommand();

    if (typed.toLowerCase() === "exit") {
      closeTerminal();
      return;
    }

    if (typed) appendRejectedCommand(typed);
  });

  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const plain = (event.clipboardData || window.clipboardData).getData("text").replace(/[\r\n]+/g, " ");
    document.execCommand("insertText", false, plain);
  });

  screen.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".terminal-command-entry")) {
      requestAnimationFrame(() => editor.focus({ preventScroll: true }));
    }
  });

  // Keep a newly opened terminal positioned at the first line instead of
  // jumping to the editable prompt at the bottom. Keyboard input still goes
  // to the prompt, but the visitor starts by seeing the introduction/output.
  requestAnimationFrame(() => {
    editor.focus({ preventScroll: true });
    screen.scrollTop = 0;
    screen.scrollLeft = 0;
    requestAnimationFrame(() => {
      screen.scrollTop = 0;
      screen.scrollLeft = 0;
    });
  });
}

function terminalSkillRows() {
  return SITE.cv.skills.map((skill, index) => {
    const parts = String(skill).split(" — ");
    const label = parts.shift() || "Skill";
    const detail = parts.join(" — ") || "";
    return `
      <div class="terminal-record terminal-skill-record">
        <div><span class="term-index">[${String(index + 1).padStart(2, "0")}]</span> <span class="term-keyword">${escapeHtml(label.toUpperCase())}</span></div>
        <div class="term-indent"><span class="term-property">stack</span><span class="term-operator"> = </span><span class="term-value">${escapeHtml(detail)}</span></div>
      </div>`;
  }).join("");
}

function terminalAwardRows() {
  return SITE.cv.awards.map((award, index) => `
    <div class="terminal-record terminal-award-record">
      <div><span class="term-index">[${String(index + 1).padStart(2, "0")}]</span> <span class="term-keyword">${escapeHtml(award.name)}</span></div>
      <div class="term-indent"><span class="term-property">issuer</span><span class="term-operator"> : </span><span class="term-value">${escapeHtml(award.place)}</span></div>
      <div class="term-indent"><span class="term-property">date</span><span class="term-operator">   : </span><span class="term-value">${escapeHtml(award.period)}</span></div>
      <div class="term-indent"><span class="term-property">note</span><span class="term-operator">   : </span><span class="term-muted">${escapeHtml(award.note)}</span></div>
    </div>`).join("");
}

function openPortfolioTerminal(kind) {
  playBeep();

  const isSkills = kind === "skills";
  const drive = isSkills ? "C:" : "D:";
  const folder = isSkills ? "SKILLS" : "AWARDS";
  const command = isSkills ? "skills --profile kaveen --verbose" : "awards --list --details";
  const rows = isSkills ? terminalSkillRows() : terminalAwardRows();
  const summary = isSkills
    ? `${SITE.cv.skills.length} capability groups loaded successfully.`
    : `${SITE.cv.awards.length} academic distinctions found.`;
  const terminalId = `terminal-${kind}`;

  WM.open({
    id: terminalId,
    title: `${drive}\\${folder} - Command Prompt`,
    icon: ICONS.exe,
    width: 760, height: 470,
    ...anchorNear("explorer", 760, 470, 48, 54),
    content: `
      <div class="portfolio-terminal" role="region" aria-label="${escapeHtml(folder)} terminal">
        <div class="terminal-screen">
          <div class="terminal-banner">Microsoft Windows XP [Version 5.1.2600]</div>
          <div class="terminal-muted">(C) Copyright 1985-2001 Microsoft Corp.</div>
          <div class="terminal-spacer"></div>
          <div><span class="term-prompt">${drive}\\PORTFOLIO&gt;</span><span class="term-command">${escapeHtml(command)}</span></div>
          <div class="terminal-rule">${"─".repeat(64)}</div>
          ${rows}
          <div class="terminal-rule">${"─".repeat(64)}</div>
          <div><span class="term-status">SUCCESS</span> <span class="terminal-muted">${escapeHtml(summary)}</span></div>
          <div class="terminal-spacer"></div>
          ${terminalPromptMarkup(drive)}
        </div>
      </div>`,
    onMount(bodyEl) {
      bodyEl.classList.add("terminal-host");
      wireExitOnlyTerminal(bodyEl, terminalId, drive);
    },
  });
}

/* The welcome note is authored with hard line breaks, which used to be
   preserved verbatim — so the text kept its typed line lengths no matter how
   wide the window was. Paragraphs are re-joined here so they wrap to the
   window like the Skills / Awards terminals; indented blocks (the icon
   legend) keep their alignment. */
function terminalProseMarkup(text) {
  return String(text == null ? "" : text)
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+$/, ""))
    .filter((block) => block.trim() !== "")
    .map((block) => {
      const aligned = block.split("\n").some((line) => /^\s+\S/.test(line));
      if (aligned) {
        return `<div class="terminal-prose terminal-prose--fixed">${escapeHtml(block)}</div>`;
      }
      return `<p class="terminal-prose">${escapeHtml(block.replace(/\s*\n\s*/g, " "))}</p>`;
    })
    .join("");
}

function openWelcomeNote() {
  const taskbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--taskbar-h")) || 40;
  const width = Math.min(969.848, window.innerWidth - 16);
  const height = Math.min(716.365, window.innerHeight - taskbarHeight - 16);
  // Match the reference placement, keeping the window inside smaller desktops.
  const x = Math.max(8, Math.min(window.innerWidth * .123, window.innerWidth - width - 8));
  const y = Math.max(8, Math.min(window.innerHeight * .104, window.innerHeight - taskbarHeight - height - 8));
  const featured = [
    { page: "projects/affective-sonic-agents.html", image: "projects/assets/affective-h3-offset-vectors.png", outcome: "96 audio stimuli · 9,792 synthetic audience responses", detail: "Independent-judge alignment distance improved from 0.408 to 0.344 in the recorded computational evaluation." },
    { page: "projects/emotionally-resonant-branding.html", image: "assets/projects/reso-brand-logo.png", outcome: "191 participants · published research", detail: "An affective branding prototype evaluated through a human participant study." },
    { page: "projects/studentpulse.html", image: "projects/assets/studentpulse-confusion-matrix.png", outcome: "73.66% held-out accuracy", detail: "Academic-risk prediction evaluated on 6,519 unseen student records, with class-level analysis." },
  ].map((feature) => ({ ...SITE.projects.categories.flatMap(c => c.items).find(p => p.page === feature.page), ...feature }));
  WM.open({
    id: "welcome-note", title: "Start Here — Kaveen Desktop", icon: ICONS.portfolio,
    width, height, x, y,
    content: `<main class="start-here">
      <header><span class="start-eyebrow">Kaveen Desktop / Start Here</span>
        <h1>Hi, I’m Kaveen.</h1>
        <p>${escapeHtml(SITE.welcomeNote.body)}</p>
        <div class="start-actions"><a href="${escapeHtml(SITE.cv.file.href)}" target="_blank" rel="noopener">View CV</a><button type="button" id="welcome-contact">Contact</button><button type="button" id="welcome-projects">All projects</button></div>
      </header>
      <h2>Featured work</h2>
      <div class="featured-projects">${featured.map((item, i) => `<article class="featured-project">
        <img src="${item.image}" alt="${escapeHtml(item.name)} — project figure" loading="lazy">
        <h3>${escapeHtml(item.name)}</h3><strong>${item.outcome}</strong><p>${item.detail}</p>
        <div class="featured-actions"><button type="button" data-project="${i}">Read case study</button><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">GitHub</a></div>
      </article>`).join("")}</div>
    </main>`,
    onMount(body) {
      body.querySelector("#welcome-contact").addEventListener("click", openOutlookExpress);
      body.querySelector("#welcome-projects").addEventListener("click", () => openExplorer({ type: "projects" }));
      body.querySelectorAll("[data-project]").forEach(button => button.addEventListener("click", () => openProjectPage(featured[Number(button.dataset.project)])));
    },
  });
}

function anchorNear(nearId, width, height, dx, dy) {
  const rect = WM.getRect(nearId);
  if (!rect) return {};
  const taskbarH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--taskbar-h")) || 40;
  const x = Math.max(10, Math.min(rect.x + dx, window.innerWidth - width - 10));
  const y = Math.max(10, Math.min(rect.y + dy, window.innerHeight - taskbarH - height - 10));
  return { x, y };
}

function wireTabs(container) {
  const tabs = container.querySelectorAll('[role="tab"]');
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      container.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = true; });
      const panel = container.querySelector("#" + tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = false;
    });
  });
}

/* ---------- error / message dialogs ---------- */

function openErrorDialog(title, message) {
  playBeep(220, 0.09);
  WM.open({
    id: "err-" + Date.now(),
    title,
    icon: ICONS.warning,
    width: 360, height: 190,
    resizable: false,
    content: `
      <div class="dialog-body">
        <div class="dialog-error">
          <div class="icon-img">${ICONS.warning}</div>
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="dialog-actions"><button id="err-ok">OK</button></div>
      </div>`,
    onMount(bodyEl, winEl) {
      bodyEl.querySelector("#err-ok").addEventListener("click", () => WM.close(winEl.id.replace("win-", "")));
    },
  });
}

/* ---------- My Computer / System Properties (CV) ---------- */

function openProperties() {
  playBeep();
  const cv = SITE.cv;
  WM.open({
    id: "system-properties",
    title: "System Properties",
    icon: ICONS.computer,
    width: 440, height: 400,
    resizable: false,
    content: `
      <section class="tabs" style="height:100%;display:flex;flex-direction:column">
        <menu role="tablist" aria-label="Portfolio profile">
          <button role="tab" aria-selected="true" aria-controls="tab-overview">Overview</button>
          <button role="tab" aria-controls="tab-research">Research</button>
          <button role="tab" aria-controls="tab-toolkit">Toolkit</button>
          <button role="tab" aria-controls="tab-connect">Connect</button>
        </menu>
        <article role="tabpanel" id="tab-overview" style="flex:1;overflow:auto">
          <div class="props-header">
            <div class="icon-img">${ICONS.computer}</div>
            <div>
              <h2>${escapeHtml(SITE.person.name)}</h2>
              <p>${escapeHtml(cv.general.headline)}</p>
            </div>
          </div>
          <ul class="props-list">
            <li><strong>Focus:</strong> ${escapeHtml(SITE.person.tagline)}</li>
            <li><strong>Based in:</strong> ${escapeHtml(cv.general.computer)}</li>
            <li><strong>Current chapter:</strong> ${escapeHtml(cv.general.extra)}</li>
          </ul>
        </article>
        <article role="tabpanel" hidden id="tab-research" style="flex:1;overflow:auto">
          <ul class="props-list">
            ${SITE.research.items.map((item) => `<li><strong>${escapeHtml(item.name)}</strong><br><span style="color:#666;font-size:11px">${escapeHtml(item.summary.split("\n")[0])}</span></li>`).join("")}
          </ul>
        </article>
        <article role="tabpanel" hidden id="tab-toolkit" style="flex:1;overflow:auto">
          <ul class="props-list">${cv.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
        </article>
        <article role="tabpanel" hidden id="tab-connect" style="flex:1;overflow:auto">
          <ul class="props-list">
            <li><strong>Email:</strong> ${escapeHtml(SITE.contact.email)}</li>
            ${SITE.contact.links.map((link) => `<li><strong>${escapeHtml(link.label)}:</strong> <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">Open profile</a></li>`).join("")}
          </ul>
        </article>
      </section>
      <div class="field-row" style="justify-content:flex-end;padding:8px 6px 4px">
        <button id="props-ok">OK</button>
        <button id="props-cancel">Cancel</button>
        <button disabled>Apply</button>
      </div>`,
    onMount(bodyEl, winEl) {
      wireTabs(bodyEl);
      const id = "system-properties";
      bodyEl.querySelector("#props-ok").addEventListener("click", () => WM.close(id));
      bodyEl.querySelector("#props-cancel").addEventListener("click", () => WM.close(id));
    },
  });
}

/* ---------- Explorer: My Documents / Research / Publications / Projects ---------- */
/* One reusable window that navigates in place — like real Windows
   Explorer — with working Back/Forward toolbar buttons and per-window
   history, instead of stacking a fresh window for every folder. */

function explorerLocationMeta(loc) {
  switch (loc.type) {
    case "computer": return { title: "My Computer", icon: ICONS.computer };
    case "my-documents": return { title: "My Documents", icon: ICONS.myDocs };
    case "research": return { title: "Research", icon: ICONS.folder };
    case "publications": return { title: "Publications", icon: ICONS.folder };
    case "work-experience": return { title: "Work Experience", icon: ICONS.folder };
    case "projects": return { title: "Projects", icon: ICONS.myDocs };
    case "cv": return { title: "CV", icon: ICONS.folder };
    default: return { title: "Explorer", icon: ICONS.myDocs };
  }
}

function explorerItemCount(count) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

/* Renders `loc` into listEl and wires it up; returns the status-bar text. */
function explorerRenderLocation(loc, listEl, nav) {
  if (loc.type === "computer") {
    const items = [
      { icon: "myDocs", name: "My Documents", go: { type: "my-documents" } },
      { icon: "drive", name: "Local Disk (C:) — Skills" },
      { icon: "drive", name: "Local Disk (D:) — Awards" },
    ];
    listEl.innerHTML = explorerListHtml(items);
    wireExplorerList(listEl, items, (item) => {
      if (item.go) return nav.go(item.go);
      if (item.name.includes("Skills")) return openPortfolioTerminal("skills");
      return openPortfolioTerminal("awards");
    });
    return explorerItemCount(items.length);
  }

  if (loc.type === "my-documents") {
    const items = [
      { icon: "folder", name: "Research", go: { type: "research" } },
      { icon: "folder", name: "Publications", go: { type: "publications" } },
      { icon: "folder", name: "Work Experience", go: { type: "work-experience" } },
      { icon: "folder", name: "Projects", go: { type: "projects" } },
      { icon: "folder", name: "CV", go: { type: "cv" } },
    ];
    listEl.innerHTML = explorerListHtml(items);
    wireExplorerList(listEl, items, (item) => nav.go(item.go));
    return explorerItemCount(items.length);
  }

  if (loc.type === "cv") {
    const items = [{ icon: "doc", name: SITE.cv.file.name }];
    listEl.innerHTML = explorerListHtml(items);
    wireExplorerList(listEl, items, () => openCvViewer());
    const el = listEl.querySelector(".explorer-item");
    if (el) {
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        listEl.querySelectorAll(".explorer-item").forEach((s) => s.classList.remove("selected"));
        el.classList.add("selected");
        showContextMenu(e.clientX, e.clientY, [
          { label: "Open", onClick: openCvViewer },
          { label: "Download", onClick: downloadCv },
        ]);
      });
    }
    return explorerItemCount(1);
  }

  if (loc.type === "research") {
    listEl.innerHTML = explorerListHtml(SITE.research.items);
    wireExplorerList(listEl, SITE.research.items, (item) => openDocViewer(item.name, item.summary, item.link));
    return explorerItemCount(SITE.research.items.length);
  }

  if (loc.type === "publications") {
    const items = SITE.publications.items;
    if (!items.length) {
      listEl.innerHTML = `<div class="empty-folder-state"><div class="icon-img">${iconHtml(ICONS.folder)}</div><strong>No publications yet</strong><span>Scholarly outputs will appear here.</span></div>`;
      return explorerItemCount(0);
    }

    listEl.innerHTML = `<div class="publication-catalog">
      <header class="publication-catalog-header">
        <div>
          <span class="publication-eyebrow">SCHOLARLY OUTPUT</span>
          <h2>Publications</h2>
          <p>Peer-reviewed research, with the contribution and supporting artefacts visible at a glance.</p>
        </div>
        <span class="publication-count">${items.length} ${items.length === 1 ? "paper" : "papers"}</span>
      </header>
      <div class="publication-grid">${items.map((item, index) => `
        <article class="publication-card" data-publication-index="${index}" tabindex="0">
          <div class="publication-card-topline">
            <span class="publication-type">${escapeHtml(item.type || "Publication")}</span>
            <span class="publication-year">${escapeHtml(item.year || "")}</span>
          </div>
          <h3>${escapeHtml(item.title || item.name)}</h3>
          <p class="publication-authors">${escapeHtml(item.authors || "")}</p>
          <p class="publication-venue">${escapeHtml(item.venue || "")}</p>
          <p class="publication-contribution">${escapeHtml(item.contribution || "")}</p>
          ${item.metrics?.length ? `<div class="publication-metrics">${item.metrics.map(metric => `<span>${escapeHtml(metric)}</span>`).join("")}</div>` : ""}
          <div class="publication-actions">
            ${item.link ? `<button type="button" data-action="paper">Open paper ↗</button>` : ""}
            ${item.code ? `<button type="button" data-action="code">Code ↗</button>` : ""}
            ${item.doi ? `<span class="publication-doi">DOI ${escapeHtml(item.doi)}</span>` : ""}
          </div>
        </article>`).join("")}
      </div>
    </div>`;

    listEl.querySelectorAll(".publication-card").forEach((card) => {
      const item = items[Number(card.dataset.publicationIndex)];
      const openPaper = () => item.link && window.open(item.link, "_blank", "noopener");
      card.addEventListener("dblclick", openPaper);
      card.addEventListener("keydown", (event) => { if (event.key === "Enter") openPaper(); });
      card.querySelector('[data-action="paper"]')?.addEventListener("click", (event) => { event.stopPropagation(); openPaper(); });
      card.querySelector('[data-action="code"]')?.addEventListener("click", (event) => { event.stopPropagation(); window.open(item.code, "_blank", "noopener"); });
    });
    return `${items.length} scholarly ${items.length === 1 ? "publication" : "publications"}`;
  }

  if (loc.type === "work-experience") {
    const items = SITE.workExperience?.items || [];
    if (!items.length) {
      listEl.innerHTML = `<div class="empty-folder-state"><div class="icon-img">${iconHtml(ICONS.folder)}</div><strong>No entries yet</strong><span>Work experience will be added here when ready.</span></div>`;
      return explorerItemCount(0);
    }
    listEl.innerHTML = explorerListHtml(items);
    return explorerItemCount(items.length);
  }

  if (loc.type === "projects") {
    const categories = SITE.projects.categories;
    const items = categories.flatMap((category) => category.items);
    listEl.innerHTML = `<div class="project-catalog">
      <header class="project-catalog-header">
        <div>
          <span class="project-catalog-eyebrow">PROJECT ARCHIVE</span>
          <h2>Projects</h2>
          <p>Select a project, then double-click to read the full case study.</p>
        </div>
        <span class="project-catalog-count">${items.length} projects</span>
      </header>
      ${categories.map((category) => `
      <section class="project-category">
        <h3>${escapeHtml(category.name)} <span>${category.items.length}</span></h3>
        <div class="explorer-list">${category.items.map((item) => `
          <div class="explorer-item project-card-item" data-project-index="${items.indexOf(item)}" tabindex="0" title="Double-click to open the full case study" aria-label="${escapeHtml(item.name)}. Double-click to open the full case study">
            <div class="icon-img">${iconHtml(ICONS[item.icon] || ICONS.doc)}</div>
            <div class="project-card-copy">
              <span class="project-card-title">${escapeHtml(item.name)}</span>
              <small>${escapeHtml(item.summary)}</small>
            </div>
          </div>`).join("")}</div>
      </section>`).join("")}</div>`;
    listEl.querySelectorAll(".explorer-item").forEach((el) => {
      const activate = () => openProjectPage(items[Number(el.dataset.projectIndex)]);
      el.addEventListener("click", () => {
        listEl.querySelectorAll(".explorer-item").forEach((entry) => entry.classList.remove("selected"));
        el.classList.add("selected");
      });
      el.addEventListener("dblclick", activate);
      el.addEventListener("keydown", (event) => { if (event.key === "Enter") activate(); });
    });
    return `${items.length} curated projects in ${categories.length} categories`;
  }

  return "";
}

let explorerNav = null; // set once the (single-instance) explorer window is mounted

function openCvViewer() {
  playBeep();
  WM.open({
    id: "cv-viewer",
    title: SITE.cv.file.name,
    icon: ICONS.doc,
    width: 760, height: 560,
    ...anchorNear("explorer", 760, 560, 46, 58),
    content: `<iframe class="webpage-frame" src="${escapeHtml(SITE.cv.file.href)}" title="${escapeHtml(SITE.person.name)} CV"></iframe>`,
  });
}

function downloadCv() {
  playBeep();
  const a = document.createElement("a");
  a.href = SITE.cv.file.href;
  a.download = SITE.cv.file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* The shell hierarchy, child -> parent. My Computer is the root. */
const EXPLORER_PARENTS = {
  "my-documents": "computer",
  "research": "my-documents",
  "publications": "my-documents",
  "work-experience": "my-documents",
  "projects": "my-documents",
  "cv": "my-documents",
};

function initialExplorerHistory(loc) {
  // Shortcuts such as Start > Research open deep in the tree, so seed the
  // whole chain of parents behind them. Back then walks Research ->
  // My Documents -> My Computer instead of stopping one level up.
  const chain = [loc];
  let parent = EXPLORER_PARENTS[loc.type];
  while (parent) {
    chain.unshift({ type: parent });
    parent = EXPLORER_PARENTS[parent];
  }
  return chain;
}

function openExplorer(loc) {
  playBeep();
  if (WM.isOpen("explorer") && explorerNav) {
    explorerNav.go(loc);
    WM.focus("explorer");
    return;
  }

  const stack = initialExplorerHistory(loc);
  let index = stack.length - 1;

  WM.open({
    id: "explorer",
    title: explorerLocationMeta(loc).title,
    icon: explorerLocationMeta(loc).icon,
    x: 235, y: 82,
    width: 760, height: 470,
    // Open at a custom desktop size so it resembles the file explorer window
    // in the reference mockup rather than filling the full screen.
    maximized: false,
    statusBar: " ",
    content: `
      <div class="explorer-toolbar">
        <button id="exp-back" class="explorer-nav-btn" aria-label="Back" aria-disabled="${index <= 0 ? "true" : "false"}" ${index <= 0 ? "disabled" : ""}>${ICONS.chevronLeft}</button>
        <button id="exp-forward" class="explorer-nav-btn" aria-label="Forward" aria-disabled="true" disabled>${ICONS.chevronRight}</button>
      </div>
      <div id="exp-list" class="explorer-body"></div>`,
    onMount(bodyEl, winEl) {
      const backBtn = bodyEl.querySelector("#exp-back");
      const fwdBtn = bodyEl.querySelector("#exp-forward");
      const listEl = bodyEl.querySelector("#exp-list");

      const nav = {
        go(l) {
          const current = stack[index];
          // Re-opening the location already displayed (for example by
          // double-clicking the My Computer desktop icon) must not create a
          // duplicate history entry. Without this guard Back appears active
          // even though there is nowhere to go.
          if (current && current.type === l.type) {
            render();
            return;
          }
          stack.splice(index + 1);
          stack.push(l);
          index = stack.length - 1;
          render();
        },
      };
      explorerNav = nav;

      function render() {
        const loc2 = stack[index];
        const meta = explorerLocationMeta(loc2);
        WM.setTitle("explorer", meta.title);
        WM.setStatus("explorer", explorerRenderLocation(loc2, listEl, nav));
        // Back is enabled only when there is a genuine previous location.
        // At My Computer on first open, index is 0, so it is disabled.
        backBtn.disabled = index <= 0;
        backBtn.setAttribute("aria-disabled", index <= 0 ? "true" : "false");
        fwdBtn.disabled = index >= stack.length - 1;
      }

      backBtn.addEventListener("click", () => { if (index > 0) { index--; render(); } });
      fwdBtn.addEventListener("click", () => { if (index < stack.length - 1) { index++; render(); } });

      render();
    },
    onClose() { explorerNav = null; },
  });
}

function openProjectPage(item) {
  playBeep();
  WM.open({
    id: "project-page-" + item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: item.name + " - Internet Explorer",
    icon: ICONS.globe,
    width: 760, height: 560,
    ...anchorNear("explorer", 760, 560, 46, 58),
    content: `<iframe class="webpage-frame" src="${escapeHtml(item.page)}" title="${escapeHtml(item.name)}"></iframe>`,
  });
}

/* ---------- Internet Explorer (blog) ---------- */

function openInternetExplorer() {
  playBeep();
  const homeUrl = SITE.blog.url || "blog/index.html";
  WM.open({
    id: "ie",
    title: "Kaveen Research Notes - Microsoft Internet Explorer",
    icon: ICONS.globe,
    width: 860, height: 620,
    maximized: true,
    content: `
      <div class="ie-browser-shell">
        <div class="ie-browser-toolbar" aria-label="Internet Explorer navigation">
          <button id="ie-back" class="ie-nav-button" title="Back" aria-label="Back">${ICONS.chevronLeft}</button>
          <button id="ie-forward" class="ie-nav-button" title="Forward" aria-label="Forward">${ICONS.chevronRight}</button>
          <button id="ie-home" class="ie-home-button" title="Research Notes home" aria-label="Home"><svg class="ie-action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/></svg><span class="ie-action-label">Home</span></button>
          <button id="ie-refresh" class="ie-home-button" title="Refresh current page" aria-label="Refresh"><svg class="ie-action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 4v6h-6M20 10a8 8 0 1 0 0 6"/></svg><span class="ie-action-label">Refresh</span></button>
          <span class="ie-toolbar-title">Kaveen Research Notes</span>
        </div>
        <div class="ie-browser-status">
          <span>Research notes · Applied AI · Engineering foundations</span>
          <span id="ie-page-status">Local portfolio page</span>
        </div>
        <iframe id="ie-blog-frame" class="ie-blog-frame" src="${escapeHtml(homeUrl)}" title="${escapeHtml(SITE.person.shortName)} blog"></iframe>
      </div>`,
    onMount(bodyEl) {
      bodyEl.classList.add("ie-browser-host");
      const frame = bodyEl.querySelector("#ie-blog-frame");
      const status = bodyEl.querySelector("#ie-page-status");
      // Iframe history belongs to the browser tab. Keep toolbar history local.
      const entries = [new URL(homeUrl, document.baseURI).href];
      let cursor = 0;
      const back = bodyEl.querySelector("#ie-back");
      const forward = bodyEl.querySelector("#ie-forward");
      const updateButtons = () => {
        back.disabled = cursor === 0;
        forward.disabled = cursor === entries.length - 1;
      };
      const showPage = () => {
        updateButtons();
        status.textContent = "Loading…";
        frame.contentWindow.location.replace(entries[cursor]);
      };
      const navigate = url => {
        if (url === entries[cursor]) return;
        entries.splice(cursor + 1);
        entries.push(url);
        cursor++;
        showPage();
      };
      updateButtons();
      bodyEl.querySelector("#ie-home").addEventListener("click", () => navigate(entries[0]));
      bodyEl.querySelector("#ie-refresh").addEventListener("click", showPage);
      back.addEventListener("click", () => {
        if (cursor > 0) { cursor--; showPage(); }
      });
      forward.addEventListener("click", () => {
        if (cursor < entries.length - 1) { cursor++; showPage(); }
      });
      frame.addEventListener("load", () => {
        try {
          const doc = frame.contentDocument;
          status.textContent = doc.title || "Research Notes";
          doc.addEventListener("click", event => {
            const link = event.target.closest("a[href]");
            if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute("download")) return;
            const url = new URL(link.href, doc.baseURI);
            if (url.origin !== window.location.origin || !url.pathname.startsWith(new URL(homeUrl, document.baseURI).pathname.replace(/[^/]*$/, ""))) return;
            if (link.target && link.target !== "_self") return;
            event.preventDefault();
            navigate(url.href);
          });
        } catch (_) {
          status.textContent = "Research Notes";
        }
      });
    },
  });
}

/* ---------- Outlook Express (contact) ---------- */

function copyPlainText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
    } catch (error) { reject(error); }
    field.remove();
  });
}

function openOutlookExpress() {
  playBeep();
  const email = SITE.contact.email || "";
  WM.open({
    id: "outlook",
    title: "New Message - Outlook Express",
    icon: ICONS.envelope,
    width: 500, height: 410,
    content: `
      <div class="oe-compose">
        <div class="oe-compose-banner">
          <span class="icon-img">${ICONS.envelope}</span>
          <div><strong>Contact Kaveen</strong><small>Compose an email using your own mail application.</small></div>
        </div>
        <div class="field-row oe-field-row">
          <label for="oe-to" class="contact-field-label">To:</label>
          <input id="oe-to" type="text" value="${escapeHtml(email)}" readonly>
          <button id="oe-copy-address" type="button">Copy address</button>
        </div>
        <div class="field-row oe-field-row">
          <label for="oe-subject" class="contact-field-label">Subject:</label>
          <input id="oe-subject" type="text" value="Portfolio enquiry">
        </div>
        <textarea id="oe-body" class="oe-message-body" placeholder="Write your message..."></textarea>
        <div id="oe-status" class="oe-status" aria-live="polite">Nothing is sent from this website. The button below opens your configured email application.</div>
        <div class="dialog-actions oe-actions">
          <button id="oe-copy-message" type="button">Copy message</button>
          <button id="oe-open-mail" type="button">Open mail app</button>
        </div>
      </div>`,
    onMount(bodyEl) {
      const status = bodyEl.querySelector("#oe-status");
      const subjectEl = bodyEl.querySelector("#oe-subject");
      const messageEl = bodyEl.querySelector("#oe-body");
      const setStatus = (text) => { status.textContent = text; };

      bodyEl.querySelector("#oe-copy-address").addEventListener("click", async () => {
        if (!email) { setStatus("No email address is configured."); return; }
        try { await copyPlainText(email); setStatus("Email address copied to clipboard."); }
        catch (_) { setStatus(`Email: ${email}`); }
      });

      bodyEl.querySelector("#oe-copy-message").addEventListener("click", async () => {
        const subject = subjectEl.value.trim();
        const message = messageEl.value.trim();
        const text = `To: ${email}\nSubject: ${subject}\n\n${message}`;
        try { await copyPlainText(text); setStatus("Message copied to clipboard."); }
        catch (_) { setStatus("Copy was blocked by the browser. You can still select the message manually."); }
      });

      bodyEl.querySelector("#oe-open-mail").addEventListener("click", () => {
        if (!email) { setStatus("No email address is configured."); return; }
        const subject = encodeURIComponent(subjectEl.value || "");
        const message = encodeURIComponent(messageEl.value || "");
        window.location.href = `mailto:${email}?subject=${subject}&body=${message}`;
        setStatus("Requested your default mail application. If nothing opens, use Copy address instead.");
      });
    },
  });
}

/* ---------- Run dialog ---------- */

function openRun() {
  playBeep();
  WM.open({
    id: "run",
    title: "Run",
    icon: ICONS.exe,
    width: 400, height: 190,
    resizable: false,
    content: `
      <div class="dialog-body">
        <p style="margin:0">Open a portfolio program or location.</p>
        <div class="dialog-row">
          <label for="run-input">Open:</label>
          <input id="run-input" type="text" autocomplete="off" placeholder="explorer">
        </div>
        <div class="run-examples">Working commands: explorer, iexplore, outlook, research, publications, projects, experience, about</div>
        <div class="dialog-actions">
          <button id="run-ok">OK</button>
          <button id="run-cancel">Cancel</button>
        </div>
      </div>`,
    onMount(bodyEl) {
      const input = bodyEl.querySelector("#run-input");
      input.focus();
      const run = () => {
        const cmd = input.value.trim().toLowerCase();
        if (!cmd) return;
        const map = {
          "iexplore": openInternetExplorer,
          "iexplore.exe": openInternetExplorer,
          "internet explorer": openInternetExplorer,
          "msimn": openOutlookExpress,
          "msimn.exe": openOutlookExpress,
          "outlook": openOutlookExpress,
          "outlook express": openOutlookExpress,
          "explorer": () => openExplorer({ type: "computer" }),
          "explorer.exe": () => openExplorer({ type: "computer" }),
          "research": () => openExplorer({ type: "research" }),
          "publications": () => openExplorer({ type: "publications" }),
          "projects": () => openExplorer({ type: "projects" }),
          "experience": () => openExplorer({ type: "work-experience" }),
          "work experience": () => openExplorer({ type: "work-experience" }),
          "about": openProperties,
          "whoami": openProperties,
        };
        const action = map[cmd];
        WM.close("run");
        if (action) action();
        else openErrorDialog("Run", `Windows cannot find '${cmd}'. Try one of the commands shown in the Run window.`);
      };
      bodyEl.querySelector("#run-ok").addEventListener("click", run);
      bodyEl.querySelector("#run-cancel").addEventListener("click", () => WM.close("run"));
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    },
  });
}

function openCommandPrompt() {
  playBeep();
  const terminalId = "cmd";
  const drive = "C:";
  WM.open({
    id: terminalId,
    title: "C:\\WINDOWS\\system32\\cmd.exe",
    icon: ICONS.exe,
    x: 235, y: 82,
    width: 760, height: 470,
    content: `
      <div class="portfolio-terminal" role="region" aria-label="Command Prompt">
        <div class="terminal-screen">
          <div class="terminal-banner">Microsoft Windows XP [Version 5.1.2600]</div>
          <div class="terminal-muted">(C) Copyright 1985-2001 Microsoft Corp.</div>
          <div class="terminal-spacer"></div>
          <div><span class="term-prompt">C:\\&gt;</span><span class="term-command">whoami</span></div>
          <div class="term-value">${escapeHtml(SITE.person.name)}</div>
          <div class="terminal-spacer"></div>
          ${terminalPromptMarkup(drive)}
        </div>
      </div>`,
    onMount(bodyEl) {
      bodyEl.classList.add("terminal-host");
      wireExitOnlyTerminal(bodyEl, terminalId, drive);
    },
  });
}

/* ---------- shutdown / log off ---------- */

function openShutdownDialog() {
  playBeep();
  WM.open({
    id: "shutdown",
    title: "Turn off computer",
    icon: ICONS.power,
    width: 360, height: 190,
    resizable: false,
    content: `
      <div class="shutdown-options">
        <button class="shutdown-option" id="sd-standby"><div class="icon-img">${ICONS.notepad}</div>Stand By</button>
        <button class="shutdown-option" id="sd-off"><div class="icon-img">${ICONS.power}</div>Turn Off</button>
        <button class="shutdown-option" id="sd-restart"><div class="icon-img">${ICONS.logoff}</div>Restart</button>
      </div>
      <div class="shutdown-cancel-row"><button id="sd-cancel">Cancel</button></div>`,
    onMount(bodyEl) {
      bodyEl.querySelector("#sd-cancel").addEventListener("click", () => WM.close("shutdown"));
      bodyEl.querySelector("#sd-standby").addEventListener("click", () => {
        WM.close("shutdown");
        const d = document.getElementById("desktop");
        d.style.transition = "opacity .5s";
        d.style.opacity = "0.15";
        setTimeout(() => { d.style.opacity = "1"; }, 1100);
      });
      bodyEl.querySelector("#sd-off").addEventListener("click", () => {
        WM.close("shutdown");
        doShutdown(false);
      });
      bodyEl.querySelector("#sd-restart").addEventListener("click", () => {
        WM.close("shutdown");
        doShutdown(true);
      });
    },
  });
}

function doShutdown(restart) {
  const desktop = document.getElementById("desktop");
  const taskbar = document.getElementById("taskbar");
  desktop.style.transition = "opacity .8s";
  taskbar.style.transition = "opacity .8s";
  desktop.style.opacity = "0";
  taskbar.style.opacity = "0";
  setTimeout(() => {
    desktop.classList.add("hidden");
    taskbar.classList.add("hidden");
    const screen = document.getElementById("shutdown-screen");
    screen.classList.remove("hidden");
    if (restart) {
      screen.innerHTML = `Restarting…`;
      setTimeout(startPoweredOnSession, 1200);
    } else {
      screen.innerHTML = `Windows is shutting down…`;
      setTimeout(() => {
        screen.innerHTML = `It's now safe to turn off your computer.<br><small>(click anywhere, or press any key, to turn back on)</small>`;
        const wake = () => {
          screen.removeEventListener("click", wake);
          window.removeEventListener("keydown", wake);
          startPoweredOnSession();
        };
        screen.addEventListener("click", wake, { once: true });
        window.addEventListener("keydown", wake, { once: true });
      }, 1300);
    }
  }, 800);
}

function startPoweredOnSession() {
  WM.closeAll();
  closeStartMenu();
  document.getElementById("shutdown-screen").classList.add("hidden");
  runBootSequence();
}

function performLogOff() {
  playBeep();
  WM.closeAll();
  document.getElementById("desktop").classList.add("hidden");
  document.getElementById("taskbar").classList.add("hidden");
  document.getElementById("start-menu").classList.add("hidden");
  showLoginScreen();
}

/* ---------- context menu ---------- */

function showContextMenu(x, y, items) {
  closeContextMenu();
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.id = "active-context-menu";
  items.forEach((it) => {
    if (it.sep) {
      const sep = document.createElement("div");
      sep.className = "context-menu__sep";
      menu.appendChild(sep);
      return;
    }
    const row = document.createElement("div");
    row.className = "context-menu__item";
    row.textContent = it.label;
    row.addEventListener("click", () => { closeContextMenu(); it.onClick(); });
    menu.appendChild(row);
  });
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left = Math.min(x, window.innerWidth - rect.width - 4) + "px";
  menu.style.top = Math.min(y, window.innerHeight - rect.height - 4) + "px";
  setTimeout(() => document.addEventListener("click", closeContextMenu, { once: true }), 0);
}
function closeContextMenu() {
  const m = document.getElementById("active-context-menu");
  if (m) m.remove();
}

/* ---------- desktop icons ---------- */

const DESKTOP_ICONS = [
  { id: "start-here", label: "Start Here", icon: ICONS.portfolio, onOpen: openWelcomeNote },
  { id: "my-computer", label: "My Computer", icon: ICONS.computer, onOpen: () => openExplorer({ type: "computer" }), extra: [{ label: "Properties", onClick: openProperties }] },
  { id: "ie", label: "Internet Explorer", icon: ICONS.globe, onOpen: openInternetExplorer },
  { id: "outlook", label: "Outlook Express", icon: ICONS.envelope, onOpen: openOutlookExpress },
];

function renderDesktopIcons() {
  const container = document.getElementById("icons");
  container.innerHTML = ""; // safe to call again — see refreshDesktop()
  let lastTap = { id: null, t: 0 };
  DESKTOP_ICONS.forEach((cfg) => {
    const el = document.createElement("div");
    el.className = "icon";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", cfg.label);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); cfg.onOpen(); }
    });
    el.innerHTML = `<div class="icon-img">${iconHtml(cfg.icon)}</div><div class="icon-label">${escapeHtml(cfg.label)}</div>`;
    el.addEventListener("click", (event) => {
      document.querySelectorAll("#icons .icon").forEach((s) => s.classList.remove("selected"));
      el.classList.add("selected");
      if (window.matchMedia("(pointer: coarse)").matches) { cfg.onOpen(); return; }
      const now = Date.now();
      // A mouse double-click already fires a native `dblclick` event. Do not
      // also treat its second `click` as a touch-style double tap, otherwise
      // My Computer opens twice and creates a fake duplicate history entry.
      if (event.detail < 2 && lastTap.id === cfg.id && now - lastTap.t < 450) {
        cfg.onOpen();
        lastTap = { id: null, t: 0 };
      } else {
        lastTap = { id: cfg.id, t: now };
      }
    });
    el.addEventListener("dblclick", () => {
      lastTap = { id: null, t: 0 };
      cfg.onOpen();
    });
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll("#icons .icon").forEach((s) => s.classList.remove("selected"));
      el.classList.add("selected");
      const items = [{ label: "Open", onClick: cfg.onOpen }];
      if (cfg.extra) items.push({ sep: true }, ...cfg.extra);
      showContextMenu(e.clientX, e.clientY, items);
    });
    container.appendChild(el);
  });
}

/* XP's desktop Refresh: the icons blank for a moment and repaint one after
   another. Available from the desktop context menu, so
   the intercepted browser reload still feels like something happened. */
const DESKTOP_REPAINT_STEP = 55; // ms between icons

let desktopRefreshTimer = null;

function refreshDesktop() {
  const desktop = document.getElementById("desktop");
  const icons = document.getElementById("icons");
  if (!desktop || !icons || desktop.classList.contains("hidden")) return;

  clearTimeout(desktopRefreshTimer);
  icons.classList.remove("icons-repaint");
  icons.classList.add("icons-blank");

  desktopRefreshTimer = setTimeout(() => {
    renderDesktopIcons(); // a real repaint, so selection is cleared too
    icons.classList.remove("icons-blank");
    icons.classList.add("icons-repaint");
    const tiles = Array.from(icons.children);
    tiles.forEach((el, i) => { el.style.animationDelay = (i * DESKTOP_REPAINT_STEP) + "ms"; });

    desktopRefreshTimer = setTimeout(() => {
      icons.classList.remove("icons-repaint");
      tiles.forEach((el) => { el.style.animationDelay = ""; });
      desktopRefreshTimer = null;
    }, tiles.length * DESKTOP_REPAINT_STEP + 320);
  }, 110);
}

function wireDesktopContextMenu() {
  document.getElementById("desktop").addEventListener("contextmenu", (e) => {
    if (e.target.closest(".icon") || e.target.closest(".os-window")) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: "Refresh", onClick: refreshDesktop },
      { sep: true },
      { label: "Properties", onClick: openDisplayProperties },
    ]);
  });
}

/* ---------- Display Properties (desktop background — actually functional) ---------- */

const WALLPAPER_OPTIONS = [
  { id: "photo", label: "Warwick hills (photo)", src: "assets/wallpaper.jpg" },
  { id: "vector", label: "Kaveen hills (vector)", src: "assets/wallpaper.svg" },
];
const WALLPAPER_POSITIONS = [
  { id: "cover", label: "Stretch" },
  { id: "center", label: "Center" },
  { id: "tile", label: "Tile" },
];
const WALLPAPER_STORE_KEY = "kwl-wallpaper";

function readSavedWallpaper() {
  try {
    const raw = localStorage.getItem(WALLPAPER_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (WALLPAPER_OPTIONS.some((w) => w.id === parsed.wallpaper) && WALLPAPER_POSITIONS.some((p) => p.id === parsed.position)) {
      return parsed;
    }
  } catch (e) { /* ignore malformed or blocked storage */ }
  return null;
}

function saveWallpaper(wallpaperId, positionId) {
  try { localStorage.setItem(WALLPAPER_STORE_KEY, JSON.stringify({ wallpaper: wallpaperId, position: positionId })); }
  catch (e) { /* storage unavailable — the change still applies for this visit */ }
}

function applyWallpaper(wallpaperId, positionId) {
  const opt = WALLPAPER_OPTIONS.find((w) => w.id === wallpaperId) || WALLPAPER_OPTIONS[0];
  const desktop = document.getElementById("desktop");
  desktop.style.backgroundImage = `url('${opt.src}')`;
  if (positionId === "tile") {
    desktop.style.backgroundSize = "auto";
    desktop.style.backgroundRepeat = "repeat";
    desktop.style.backgroundPosition = "top left";
  } else if (positionId === "center") {
    desktop.style.backgroundSize = "auto";
    desktop.style.backgroundRepeat = "no-repeat";
    desktop.style.backgroundPosition = "center";
  } else {
    desktop.style.backgroundSize = "cover";
    desktop.style.backgroundRepeat = "no-repeat";
    desktop.style.backgroundPosition = "center bottom";
  }
}

function applySavedWallpaper() {
  const saved = readSavedWallpaper();
  if (saved) applyWallpaper(saved.wallpaper, saved.position);
}

function openDisplayProperties() {
  playBeep();
  const current = readSavedWallpaper() || { wallpaper: "photo", position: "cover" };
  const selected = { ...current };

  WM.open({
    id: "display-properties",
    title: "Display Properties",
    icon: ICONS.computer,
    width: 420, height: 400,
    resizable: false,
    content: `
      <div class="dialog-body display-props">
        <div class="display-preview"><div class="display-preview__screen" id="dp-screen"></div></div>
        <div class="field-row-stacked">
          <label>Background</label>
          <div class="wallpaper-grid" id="dp-wallpaper-grid">
            ${WALLPAPER_OPTIONS.map((w) => `
              <button type="button" class="wallpaper-option" data-id="${w.id}" title="${escapeHtml(w.label)}">
                <span class="wallpaper-swatch" style="background-image:url('${w.src}')"></span>
                <span>${escapeHtml(w.label)}</span>
              </button>`).join("")}
          </div>
        </div>
        <div class="field-row">
          <label for="dp-position">Position</label>
          <select id="dp-position">
            ${WALLPAPER_POSITIONS.map((p) => `<option value="${p.id}">${escapeHtml(p.label)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="field-row" style="justify-content:flex-end;padding:8px 6px 4px">
        <button id="dp-ok">OK</button>
        <button id="dp-cancel">Cancel</button>
      </div>`,
    onMount(bodyEl) {
      const screen = bodyEl.querySelector("#dp-screen");
      const grid = bodyEl.querySelector("#dp-wallpaper-grid");
      const positionSelect = bodyEl.querySelector("#dp-position");

      function paint() {
        const opt = WALLPAPER_OPTIONS.find((w) => w.id === selected.wallpaper) || WALLPAPER_OPTIONS[0];
        screen.style.backgroundImage = `url('${opt.src}')`;
        screen.style.backgroundSize = selected.position === "cover" ? "cover" : "auto";
        screen.style.backgroundRepeat = selected.position === "tile" ? "repeat" : "no-repeat";
        screen.style.backgroundPosition = "center";
        grid.querySelectorAll(".wallpaper-option").forEach((el) => el.classList.toggle("active", el.dataset.id === selected.wallpaper));
        applyWallpaper(selected.wallpaper, selected.position); // live-preview on the real desktop too
      }

      grid.querySelectorAll(".wallpaper-option").forEach((el) => {
        el.addEventListener("click", () => { selected.wallpaper = el.dataset.id; paint(); });
      });
      positionSelect.value = selected.position;
      positionSelect.addEventListener("change", () => { selected.position = positionSelect.value; paint(); });

      bodyEl.querySelector("#dp-ok").addEventListener("click", () => {
        saveWallpaper(selected.wallpaper, selected.position);
        WM.close("display-properties");
      });
      bodyEl.querySelector("#dp-cancel").addEventListener("click", () => {
        applyWallpaper(current.wallpaper, current.position); // revert the live preview
        WM.close("display-properties");
      });

      paint();
    },
  });
}

/* ---------- start menu ---------- */

function buildStartMenuItem(icon, label, onClick) {
  const row = document.createElement("div");
  row.className = "start-menu__item";
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); row.click(); }
  });
  row.innerHTML = `<span class="icon-img">${iconHtml(icon)}</span><span>${escapeHtml(label)}</span>`;
  row.addEventListener("click", () => { closeStartMenu(); onClick(); });
  return row;
}

function initStartMenu() {
  const menu = document.getElementById("start-menu");
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeStartMenu(); document.getElementById("start-button").focus(); }
  });
  const left = menu.querySelector(".start-menu__col--left");
  const right = menu.querySelector(".start-menu__col--right");
  menu.querySelector(".start-menu__header .icon-img").innerHTML = ICONS.portfolio;
  menu.querySelector(".start-menu__header > span:last-child").textContent = "Kaveen Desktop";

  [
    [ICONS.globe, "Internet Explorer", openInternetExplorer],
    [ICONS.envelope, "Outlook Express", openOutlookExpress],
  ].forEach(([icon, label, fn]) => left.appendChild(buildStartMenuItem(icon, label, fn)));
  left.appendChild(Object.assign(document.createElement("div"), { className: "start-menu__divider" }));
  [
    [ICONS.portfolio, "Start Here", openWelcomeNote],
  ].forEach(([icon, label, fn]) => left.appendChild(buildStartMenuItem(icon, label, fn)));
  left.appendChild(Object.assign(document.createElement("div"), { className: "start-menu__divider" }));
  left.appendChild(buildStartMenuItem(ICONS.exe, "Run...", openRun));

  [
    [ICONS.folder, "Research", () => openExplorer({ type: "research" })],
    [ICONS.folder, "Publications", () => openExplorer({ type: "publications" })],
    [ICONS.folder, "Work Experience", () => openExplorer({ type: "work-experience" })],
    [ICONS.folder, "Projects", () => openExplorer({ type: "projects" })],
  ].forEach(([icon, label, fn]) => right.appendChild(buildStartMenuItem(icon, label, fn)));
  right.appendChild(Object.assign(document.createElement("div"), { className: "start-menu__divider" }));

  const socialIcons = { LinkedIn: ICONS.linkedinBadge, GitHub: ICONS.githubBadge, ResearchGate: ICONS.researchgateBadge, ORCID: ICONS.orcidBadge };
  SITE.contact.links.forEach((l) => {
    right.appendChild(buildStartMenuItem(socialIcons[l.label] || ICONS.doc, l.label, () => window.open(l.url, "_blank", "noopener")));
  });

  document.querySelector("#start-logoff .icon-img").innerHTML = ICONS.logoff;
  document.querySelector("#start-turnoff .icon-img").innerHTML = ICONS.power;
  document.getElementById("start-logoff").addEventListener("click", () => {
    closeStartMenu();
    performLogOff();
  });
  document.getElementById("start-turnoff").addEventListener("click", () => { closeStartMenu(); openShutdownDialog(); });
}

function toggleStartMenu() {
  const menu = document.getElementById("start-menu");
  const btn = document.getElementById("start-button");
  const willOpen = menu.classList.contains("hidden");
  btn.setAttribute("aria-expanded", String(willOpen));
  menu.classList.toggle("hidden", !willOpen);
  btn.classList.toggle("active", willOpen);
  if (willOpen) {
    menu.querySelector(".start-menu__item").focus();
    playBeep(880, 0.04);
    setTimeout(() => document.addEventListener("click", onOutsideStartMenu), 0);
  }
}
function closeStartMenu() {
  document.getElementById("start-menu").classList.add("hidden");
  document.getElementById("start-button").classList.remove("active");
  document.getElementById("start-button").setAttribute("aria-expanded", "false");
}
function onOutsideStartMenu(e) {
  const menu = document.getElementById("start-menu");
  const btn = document.getElementById("start-button");
  if (!menu.contains(e.target) && !btn.contains(e.target)) closeStartMenu();
  else document.addEventListener("click", onOutsideStartMenu, { once: true });
}

/* ---------- clock + tray ---------- */

function tickClock() {
  const el = document.getElementById("clock");
  const now = new Date();
  el.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  el.title = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function initTray() {
  tickClock();
  setInterval(tickClock, 15000);
  const muteBtn = document.getElementById("tray-mute");
  muteBtn.innerHTML = ICONS.speaker;
  muteBtn.addEventListener("click", () => {
    muted = !muted;
    muteBtn.innerHTML = muted ? ICONS.speakerMuted : ICONS.speaker;
    if (!muted) playBeep(880, 0.04);
  });
}
