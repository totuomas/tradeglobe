import { state } from "./state.js";

/* =========================
   FORMAT
========================= */
function formatPercent(value) {
  if (value >= 10) return Math.round(value) + "%";
  if (value >= 1) return value.toFixed(1) + "%";
  return value.toFixed(2) + "%";
}

/* =========================
   API STATUS
========================= */
export function updateApiStatus(isOnline) {
  const dot = document.getElementById("status-dot");
  const text = document.getElementById("status-text");

  if (!dot || !text) return;

  dot.style.background = isOnline ? "#22c55e" : "#ef4444";
  text.textContent = isOnline ? "API Online" : "API Offline";
}

/* =========================
   TRADE PANEL
========================= */
export function updateTradePanel(countryName, partners, options = {}) {
  const container = document.getElementById("trade-content");
  const title = document.getElementById("country-name");

  if (!container || !title) return;

  const modeLabel = state.mode === "export" ? "Exports" : "Imports";

  title.textContent = countryName
    ? `${countryName} • ${modeLabel}`
    : "Select a country";

  /* =========================
     LOADING
  ========================= */
  if (options.loading) {
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <span>Loading trade data...</span>
      </div>
    `;
    return;
  }

  /* =========================
     ERROR
  ========================= */
  if (options.error) {
    container.innerHTML = `<p class="placeholder">Failed to load data</p>`;
    return;
  }

  /* =========================
     EMPTY
  ========================= */
  if (!partners || partners.length === 0) {
    container.innerHTML = `<p class="placeholder">No data</p>`;
    return;
  }

  /* =========================
     SORT + TOP N
  ========================= */
  const sorted = [...partners].sort((a, b) => b.value - a.value);

  const TOP_N = 7;
  const top = sorted.slice(0, TOP_N);

  const maxValue = top[0]?.value || 1;

  /* =========================
     BUILD ROWS
  ========================= */
  const rows = top.map(p => {
    const width = (p.value / maxValue) * 100;

    return `
      <div class="trade-row" data-iso="${p.iso || p.country}">
        <div class="trade-label">
          <span>${p.name || p.iso || p.country}</span>
          <span>${formatPercent(p.value)}</span>
        </div>
        <div class="trade-bar">
          <div class="trade-fill" data-width="${width}%"></div>
        </div>
      </div>
    `;
  });

  /* =========================
     RENDER
  ========================= */
  container.innerHTML = rows.join("");

  /* =========================
     ANIMATE BARS
  ========================= */
  requestAnimationFrame(() => {
    const fills = container.querySelectorAll(".trade-fill");

    fills.forEach((el, i) => {
      setTimeout(() => {
        el.style.width = el.dataset.width;
      }, i * 40); // stagger animation
    });
  });
}