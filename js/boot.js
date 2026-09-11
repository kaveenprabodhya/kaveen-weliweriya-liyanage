const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


const VISIT_KEY = "kaveen-desktop-visited";
let visitedThisSession = false;
function hasVisitedDesktop() {
  try { return visitedThisSession || localStorage.getItem(VISIT_KEY) === "true"; }
  catch (_) { return visitedThisSession; }
}
function rememberDesktopVisit() {
  visitedThisSession = true;
  try { localStorage.setItem(VISIT_KEY, "true"); } catch (_) { /* Storage is optional. */ }
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
  if (hasVisitedDesktop()) { showDesktopImmediately(); return; }
  document.getElementById("login-welcome").textContent = "Welcome, Guest";
  playBeep(660, 0.06);
  revealDesktop(true);
}

function runBootSequence() {
  const boot = document.getElementById("boot-screen");
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
