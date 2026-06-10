/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Theme (light / dark / system)
   Load in <head> before paint when possible.
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var STORAGE_KEY = "gg-theme";
  var MODES = ["light", "dark", "system"];

  function resolveTheme(mode) {
    if (mode === "light" || mode === "dark") return mode;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getStoredMode() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return MODES.indexOf(stored) >= 0 ? stored : "system";
    } catch (e) {
      return "system";
    }
  }

  function applyTheme(mode) {
    var resolved = resolveTheme(mode);
    var root = document.documentElement;
    root.setAttribute("data-theme", mode);
    root.setAttribute("data-theme-resolved", resolved);
    root.style.colorScheme = resolved;
  }

  function saveTheme(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      /* ignore */
    }
  }

  function iconSun() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  }

  function iconMoon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  function iconSystem() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
  }

  function updateToggleIcon(mode) {
    var btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    if (mode === "light") btn.innerHTML = iconSun();
    else if (mode === "dark") btn.innerHTML = iconMoon();
    else btn.innerHTML = iconSystem();
  }

  function updateMenuState(mode) {
    document.querySelectorAll(".theme-switcher-option").forEach(function (opt) {
      var active = opt.getAttribute("data-theme-value") === mode;
      opt.classList.toggle("is-active", active);
      opt.setAttribute("aria-checked", active ? "true" : "false");
    });
  }

  function setTheme(mode) {
    if (MODES.indexOf(mode) < 0) return;
    saveTheme(mode);
    applyTheme(mode);
    updateToggleIcon(mode);
    updateMenuState(mode);
  }

  function buildThemeSwitcher() {
    if (document.getElementById("theme-switcher")) return;

    var nav = document.querySelector(".header-actions");
    if (!nav) return;

    var wrap = document.createElement("div");
    wrap.className = "theme-switcher";
    wrap.id = "theme-switcher";
    wrap.innerHTML =
      '<button type="button" class="icon-btn theme-switcher-btn" id="theme-toggle-btn" aria-label="Theme" aria-haspopup="true" aria-expanded="false" aria-controls="theme-switcher-menu">' +
      iconSystem() +
      "</button>" +
      '<div class="theme-switcher-menu" id="theme-switcher-menu" role="menu" aria-label="Choose theme" hidden>' +
      '<button type="button" class="theme-switcher-option" role="menuitemradio" data-theme-value="light" aria-checked="false">' +
      iconSun() + "<span>Light</span></button>" +
      '<button type="button" class="theme-switcher-option" role="menuitemradio" data-theme-value="dark" aria-checked="false">' +
      iconMoon() + "<span>Dark</span></button>" +
      '<button type="button" class="theme-switcher-option" role="menuitemradio" data-theme-value="system" aria-checked="false">' +
      iconSystem() + "<span>System</span></button>" +
      "</div>";

    var wishlist = nav.querySelector('a[aria-label="Wishlist"]');
    if (wishlist) nav.insertBefore(wrap, wishlist);
    else nav.appendChild(wrap);

    var btn = wrap.querySelector("#theme-toggle-btn");
    var menu = wrap.querySelector("#theme-switcher-menu");

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !menu.hidden;
      menu.hidden = open;
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });

    wrap.querySelectorAll(".theme-switcher-option").forEach(function (opt) {
      opt.addEventListener("click", function () {
        setTheme(opt.getAttribute("data-theme-value"));
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  function init() {
    var mode = getStoredMode();
    applyTheme(mode);
    buildThemeSwitcher();
    updateToggleIcon(mode);
    updateMenuState(mode);

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (getStoredMode() === "system") applyTheme("system");
    });
  }

  /* Apply immediately to reduce flash */
  applyTheme(getStoredMode());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GrandGestureTheme = { setTheme: setTheme, getTheme: getStoredMode };
})();
