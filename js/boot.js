const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


const VISIT_KEY = "kaveen-desktop-visited";
const VISIT_DURATION_MS = 48 * 60 * 60 * 1000;
let visitExpiresAt = 0;
function hasVisitedDesktop() {
  const now = Date.now();
  try {
    const stored = localStorage.getItem(VISIT_KEY);
    const expiresAt = Number(stored);
    if (Number.isFinite(expiresAt) && expiresAt > now && expiresAt <= now + VISIT_DURATION_MS) {
      visitExpiresAt = expiresAt;
      return true;
    }
    // Old permanent markers and expired/invalid values must show boot again.
    if (stored !== null) localStorage.removeItem(VISIT_KEY);
  } catch (_) { /* Fall back to memory when storage is unavailable. */ }
  return visitExpiresAt > now;
}
function rememberDesktopVisit() {
  // Revisits and manual sign-ins do not extend the original 48-hour window.
  if (hasVisitedDesktop()) return;
  visitExpiresAt = Date.now() + VISIT_DURATION_MS;
  try { localStorage.setItem(VISIT_KEY, String(visitExpiresAt)); } catch (_) { /* Storage is optional. */ }
}
function showDesktopImmediately() {
  document.getElementById("boot-screen").classList.add("hidden");
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("login-welcome").classList.remove("show");
  for (const id of ["desktop", "taskbar"]) {
    const element = document.getElementById(id);
    element.classList.remove("hidden");
    element.style.opacity = "1";
  }
  document.querySelector("#icons .icon")?.focus({ preventScroll: true });
}

function showLoginScreen() {
  const login = document.getElementById("login-screen");
  const loginPanel = document.getElementById("login-panel");
  const welcome = document.getElementById("login-welcome");

  // revealDesktop() fades the account tile out during sign-in. Reset that
  // state every time the logon screen is shown again after Log Off.
  welcome.classList.remove("show");
  welcome.textContent = "Welcome";
  loginPanel.disabled = false;
  loginPanel.style.opacity = "1";
  loginPanel.style.pointerEvents = "auto";

  login.classList.remove("hidden");
  login.style.opacity = "0";
  requestAnimationFrame(() => {
    login.style.opacity = "1";
    loginPanel.focus();
  });
}

function revealDesktop(withWelcomeNote) {
  const login = document.getElementById("login-screen");
  const welcome = document.getElementById("login-welcome");
  const loginPanel = document.getElementById("login-panel");
  loginPanel.disabled = true;
  loginPanel.style.opacity = "0";
  loginPanel.style.pointerEvents = "none";
  setTimeout(() => {
    welcome.classList.add("show");
    setTimeout(() => {
      login.style.opacity = "0";
      setTimeout(() => {
        login.classList.add("hidden");
        welcome.classList.remove("show");
        document.getElementById("desktop").classList.remove("hidden");
        document.getElementById("desktop").style.opacity = "1";
        document.getElementById("taskbar").classList.remove("hidden");
        document.getElementById("taskbar").style.opacity = "1";
        rememberDesktopVisit();
        if (withWelcomeNote) setTimeout(openWelcomeNote, reduceMotion() ? 0 : 100);
      }, reduceMotion() ? 0 : 500);
    }, reduceMotion() ? 0 : 500);
  }, reduceMotion() ? 0 : 250);
}

function loginNow() {
  const returningVisitor = hasVisitedDesktop();
  document.getElementById("login-welcome").textContent = "Welcome, Guest";
  playBeep(660, 0.06);
  revealDesktop(!returningVisitor);
}

function runBootSequence() {
  const boot = document.getElementById("boot-screen");
  boot.classList.remove("hidden");
  boot.style.opacity = "1";
  setTimeout(() => {
    boot.style.opacity = "0";
    setTimeout(() => {
      boot.classList.add("hidden");
      showLoginScreen();
    }, reduceMotion() ? 0 : 500);
  }, reduceMotion() ? 0 : 1200);
}

document.addEventListener("DOMContentLoaded", () => {
  applySavedWallpaper();
  renderDesktopIcons();
  wireDesktopContextMenu();
  initStartMenu();
  initTray();

  document.getElementById("start-button").addEventListener("click", toggleStartMenu);

  const loginPanel = document.getElementById("login-panel");
  loginPanel.addEventListener("click", loginNow);
  document.querySelector(".login-footer__button").addEventListener("click", () => {
    document.getElementById("login-screen").classList.add("hidden");
    doShutdown(false);
  });

  if (hasVisitedDesktop()) showDesktopImmediately();
  else runBootSequence();
});
