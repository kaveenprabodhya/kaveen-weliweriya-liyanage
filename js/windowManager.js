/**
 * Minimal window manager for the desktop. No dependencies — plain
 * Pointer Events so the same code drives mouse, pen and touch.
 */
const WM = (() => {
  const layer = document.getElementById("windows-layer");
  const taskbarWindows = document.getElementById("taskbar-windows");

  const MIN_W = 260, MIN_H = 150;
  const windows = new Map(); // id -> state
  let zTop = 100;
  let cascade = 0;

  function isMobile() { return window.innerWidth <= 720; }

  function iconSpan(iconSvg, cls) {
    const span = document.createElement("span");
    span.className = cls || "icon-img";
    span.innerHTML = iconSvg || "";
    return span;
  }

  function defaultRect(width, height) {
    if (isMobile()) {
      return { x: 6, y: 6, w: window.innerWidth - 12, h: window.innerHeight - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--taskbar-h")) - 20 };
    }
    const x = 60 + (cascade % 8) * 26;
    const y = 40 + (cascade % 8) * 24;
    cascade++;
    return { x, y, w: width, h: height };
  }

  function updateResponsiveText(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width || parseFloat(el.style.width) || 0;
    if (!width) return;

    // Window-relative scaling. This is applied explicitly during resize,
    // maximize, restore and taskbar restore, with ResizeObserver as a backup.
    const notepadScale = Math.max(0.83, Math.min(1.50, width / 560));
    const terminalScale = Math.max(0.84, Math.min(1.22, width / 650));
    el.style.setProperty("--notepad-font-size", `${(12 * notepadScale).toFixed(2)}px`);
    el.style.setProperty("--notepad-line-height", `${(1.55 + (notepadScale - 1) * 0.10).toFixed(2)}`);
    el.style.setProperty("--terminal-font-size", `${(13 * terminalScale).toFixed(2)}px`);
  }

  function scheduleResponsiveText(el) {
    updateResponsiveText(el);
    requestAnimationFrame(() => updateResponsiveText(el));
  }

  function setActive(id) {
    windows.forEach((w, wid) => {
      const active = wid === id;
      w.el.classList.toggle("inactive", !active);
      if (w.taskbarBtn) w.taskbarBtn.classList.toggle("active", active && !w.minimized);
    });
  }

  function focus(id) {
    const w = windows.get(id);
    if (!w) return;
    zTop += 1;
    w.el.style.zIndex = zTop;
    setActive(id);
  }

  function bringToFrontAndShow(id) {
    const w = windows.get(id);
    if (!w) return;
    w.minimized = false;
    w.el.classList.remove("hidden");
    scheduleResponsiveText(w.el);
    focus(id);
    w.el.focus({ preventScroll: true });
  }

  function minimize(id) {
    const w = windows.get(id);
    if (!w) return;
    w.minimized = true;
    w.el.classList.add("hidden");
    if (w.taskbarBtn) { w.taskbarBtn.classList.remove("active"); w.taskbarBtn.focus(); }
  }

  function toggleMaximize(id) {
    const w = windows.get(id);
    if (!w || !w.resizable) return;
    if (!w.maximized) {
      w.restoreRect = { x: w.x, y: w.y, w: w.w, h: w.h };
      w.maximized = true;
      w.el.classList.add("maximized");
      const btn = w.el.querySelector('[aria-label="Maximize"]');
      if (btn) btn.setAttribute("aria-label", "Restore");
    } else {
      w.maximized = false;
      w.el.classList.remove("maximized");
      applyRect(w, w.restoreRect.x, w.restoreRect.y, w.restoreRect.w, w.restoreRect.h);
      const btn = w.el.querySelector('[aria-label="Restore"]');
      if (btn) btn.setAttribute("aria-label", "Maximize");
    }
    scheduleResponsiveText(w.el);
    focus(id);
  }

  function closeWin(id) {
    const w = windows.get(id);
    if (!w) return;
    if (w.textResizeObserver) w.textResizeObserver.disconnect();
    w.el.remove();
    if (w.taskbarBtn) w.taskbarBtn.remove();
    windows.delete(id);
    if (typeof w.onClose === "function") w.onClose();
    if (w.opener && w.opener.isConnected && w.opener.getClientRects().length) w.opener.focus();
    else document.getElementById("start-button").focus();
  }

  function applyRect(w, x, y, width, height) {
    w.x = x; w.y = y; w.w = width; w.h = height;
    w.el.style.left = x + "px";
    w.el.style.top = y + "px";
    w.el.style.width = width + "px";
    w.el.style.height = height + "px";
    updateResponsiveText(w.el);
  }

  function makeDraggable(w) {
    const bar = w.el.querySelector(".title-bar");
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".title-bar-controls")) return;
      if (w.maximized || isMobile()) return;
      focus(w.id);
      const startX = e.clientX, startY = e.clientY;
      const origX = w.x, origY = w.y;
      bar.setPointerCapture(e.pointerId);
      function move(ev) {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        applyRect(w, origX + dx, Math.max(0, origY + dy), w.w, w.h);
      }
      function up() {
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
      }
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
    });
    bar.addEventListener("dblclick", (e) => {
      if (e.target.closest(".title-bar-controls")) return;
      toggleMaximize(w.id);
    });
  }

  function makeResizable(w) {
    const dirs = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
    dirs.forEach((dir) => {
      const h = document.createElement("div");
      h.className = "resize-handle " + dir;
      w.el.appendChild(h);
      h.addEventListener("pointerdown", (e) => {
        if (w.maximized || isMobile()) return;
        e.stopPropagation();
        focus(w.id);
        const startX = e.clientX, startY = e.clientY;
        const orig = { x: w.x, y: w.y, w: w.w, h: w.h };
        h.setPointerCapture(e.pointerId);
        function move(ev) {
          const dx = ev.clientX - startX, dy = ev.clientY - startY;
          let { x, y, w: width, h: height } = orig;
          if (dir.includes("e")) width = Math.max(MIN_W, orig.w + dx);
          if (dir.includes("s")) height = Math.max(MIN_H, orig.h + dy);
          if (dir.includes("w")) { width = Math.max(MIN_W, orig.w - dx); x = orig.x + (orig.w - width); }
          if (dir.includes("n")) { height = Math.max(MIN_H, orig.h - dy); y = orig.y + (orig.h - height); }
          applyRect(w, x, y, width, height);
        }
        function up() {
          h.removeEventListener("pointermove", move);
          h.removeEventListener("pointerup", up);
        }
        h.addEventListener("pointermove", move);
        h.addEventListener("pointerup", up);
      });
    });
  }

  function open(cfg) {
    // Single-instance apps: re-focus instead of duplicating.
    if (windows.has(cfg.id)) {
      bringToFrontAndShow(cfg.id);
      return cfg.id;
    }

    const rect = (cfg.x != null && cfg.y != null && !isMobile())
      ? { x: cfg.x, y: cfg.y, w: cfg.width || 460, h: cfg.height || 320 }
      : defaultRect(cfg.width || 460, cfg.height || 320);
    const resizable = cfg.resizable !== false;

    const el = document.createElement("div");
    const opener = document.activeElement;
    el.tabIndex = -1;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", cfg.title || "Untitled");
    el.id = "win-" + cfg.id;
    el.className = "window os-window";
    el.style.width = rect.w + "px";
    el.style.height = rect.h + "px";
    el.style.left = rect.x + "px";
    el.style.top = rect.y + "px";

    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";
    const titleText = document.createElement("div");
    titleText.className = "title-bar-text";
    titleText.append(cfg.title || "Untitled");
    const controls = document.createElement("div");
    controls.className = "title-bar-controls";
    const minBtn = document.createElement("button");
    minBtn.setAttribute("aria-label", "Minimize");
    const maxBtn = document.createElement("button");
    maxBtn.setAttribute("aria-label", "Maximize");
    if (!resizable) maxBtn.disabled = true;
    const closeBtn = document.createElement("button");
    closeBtn.setAttribute("aria-label", "Close");
    controls.append(minBtn, maxBtn, closeBtn);
    titleBar.append(titleText, controls);

    const body = document.createElement("div");
    body.className = "window-body";
    if (typeof cfg.content === "string") body.innerHTML = cfg.content;
    else if (cfg.content instanceof Node) body.appendChild(cfg.content);

    el.append(titleBar, body);

    if (cfg.statusBar) {
      const sb = document.createElement("div");
      sb.className = "status-bar";
      const field = document.createElement("div");
      field.className = "status-bar-field";
      field.textContent = cfg.statusBar;
      sb.appendChild(field);
      el.appendChild(sb);
    }

    layer.appendChild(el);

    const taskbarBtn = document.createElement("button");
    taskbarBtn.className = "taskbar-btn";
    taskbarBtn.append(iconSpan(cfg.icon, "icon-img"));
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = cfg.title || "Untitled";
    taskbarBtn.appendChild(label);
    taskbarWindows.appendChild(taskbarBtn);

    const w = {
      id: cfg.id, el, taskbarBtn, resizable, opener,
      x: rect.x, y: rect.y, w: rect.w, h: rect.h,
      minimized: false, maximized: false,
      onClose: cfg.onClose,
      textResizeObserver: null,
    };
    windows.set(cfg.id, w);

    // Keep text-heavy apps readable as a window is resized, maximized,
    // restored from the taskbar, or moved onto a smaller screen.  The
    // observer measures the actual rendered window, so maximized CSS sizes
    // are handled too (not just the stored restore rectangle).
    if (typeof ResizeObserver !== "undefined") {
      w.textResizeObserver = new ResizeObserver(() => {
        updateResponsiveText(el);
      });
      w.textResizeObserver.observe(el);
    }

    minBtn.addEventListener("click", () => minimize(cfg.id));
    maxBtn.addEventListener("click", () => toggleMaximize(cfg.id));
    closeBtn.addEventListener("click", () => closeWin(cfg.id));
    el.addEventListener("pointerdown", () => focus(cfg.id));
    el.addEventListener("focusin", () => focus(cfg.id));
    taskbarBtn.addEventListener("click", () => {
      const win = windows.get(cfg.id);
      const isFront = parseInt(win.el.style.zIndex || 0) === zTop && !win.minimized;
      if (isFront) minimize(cfg.id);
      else bringToFrontAndShow(cfg.id);
    });

    makeDraggable(w);
    if (resizable) makeResizable(w);

    if (isMobile() && resizable) {
      // Start mobile windows maximized — easier than fiddly dragging on a phone.
      w.restoreRect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
    }

    if (typeof cfg.onMount === "function") cfg.onMount(body, el);
    scheduleResponsiveText(el);

    focus(cfg.id);
    if (cfg.maximized) toggleMaximize(cfg.id);
    el.focus({ preventScroll: true });
    return cfg.id;
  }

  function closeAll() {
    Array.from(windows.keys()).forEach(closeWin);
  }

  function isOpen(id) { return windows.has(id); }

  function isMaximized(id) {
    const w = windows.get(id);
    return !!w && w.maximized;
  }

  function setTitle(id, title) {
    const w = windows.get(id);
    if (!w) return;
    const titleEl = w.el.querySelector(".title-bar-text");
    if (titleEl) titleEl.textContent = title;
    if (w.taskbarBtn) {
      const label = w.taskbarBtn.querySelector(".label");
      if (label) label.textContent = title;
    }
  }

  function setStatus(id, text) {
    const w = windows.get(id);
    if (!w) return;
    const field = w.el.querySelector(".status-bar-field");
    if (field) field.textContent = text;
  }

  function getRect(id) {
    const w = windows.get(id);
    return w ? { x: w.x, y: w.y, w: w.w, h: w.h } : null;
  }

  return {
    open, close: closeWin, minimize, toggleMaximize, focus: bringToFrontAndShow,
    closeAll, isOpen, isMaximized, setTitle, setStatus, getRect,
  };
})();
