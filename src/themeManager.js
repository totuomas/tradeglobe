import { state } from "./state.js";
import { themes } from "./theme.js";

export function initTheme() {

  function applyUITheme(theme) {
    document.body.style.background = theme.ui.background;

    document.querySelectorAll(".glass").forEach(el => {
      el.style.background = theme.ui.panel;
    });

    document.documentElement.style.setProperty("--accent", theme.ui.accent);
  }

  function setTheme(name) {
    const next = themes[name];
    if (!next) return;

    state.theme = next;
    applyUITheme(next);

    localStorage.setItem("theme", name);
  }

  const saved = localStorage.getItem("theme");
  if (saved && themes[saved]) {
    state.theme = themes[saved];
  }

  applyUITheme(state.theme);

  document.querySelectorAll("[data-theme]").forEach(btn => {
    btn.addEventListener("click", () => {
      setTheme(btn.dataset.theme);
    });
  });
}