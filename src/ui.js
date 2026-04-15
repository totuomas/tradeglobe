// ===== STATUS BAR =====
export function createStatusBar(infoPanel) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "space-between";
  container.style.marginBottom = "8px";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "6px";

  const dot = document.createElement("div");
  dot.style.width = "8px";
  dot.style.height = "8px";
  dot.style.borderRadius = "50%";
  dot.style.background = "orange";

  const text = document.createElement("div");
  text.textContent = "Connecting...";
  text.style.fontSize = "12px";

  const btn = document.createElement("button");
  btn.textContent = "↻";
  btn.style.background = "transparent";
  btn.style.border = "1px solid rgba(255,255,255,0.3)";
  btn.style.color = "white";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "12px";
  btn.style.padding = "2px 6px";

  left.appendChild(dot);
  left.appendChild(text);
  container.appendChild(left);
  container.appendChild(btn);

  infoPanel.prepend(container);

  return { dot, text, btn };
}

export function setStatus(textEl, dotEl, text, color) {
  textEl.textContent = text;
  dotEl.style.background = color;
}

// ===== GENERIC BAR CHART =====
function createBarRow(labelText, value, color = "#00cc66") {
  const row = document.createElement("div");
  row.style.marginBottom = "8px";

  const label = document.createElement("div");
  label.textContent = `${labelText} — ${value.toFixed(1)}%`;
  label.style.fontSize = "12px";
  label.style.marginBottom = "2px";

  const barBg = document.createElement("div");
  barBg.style.width = "100%";
  barBg.style.height = "10px";
  barBg.style.background = "#333";
  barBg.style.borderRadius = "5px";

  const bar = document.createElement("div");
  bar.style.width = `${value}%`;
  bar.style.height = "100%";
  bar.style.background = color;
  bar.style.borderRadius = "5px";

  barBg.appendChild(bar);

  row.appendChild(label);
  row.appendChild(barBg);

  return row;
}

// ===== PARTNERS CHART =====
export function renderPartnersChart(container, data, isoToName = {}) {
  container.innerHTML = "";

  // ✅ SHOW EMPTY (0%) BARS INSTEAD OF "NO DATA"
  if (!data || data.length === 0) {
    for (let i = 0; i < 10; i++) {
      const row = createBarRow("—", 0, "#4dabf7");
      container.appendChild(row);
    }
    return;
  }

  data.slice(0, 10).forEach(p => {
    const name = isoToName[p.country] || p.country;
    const row = createBarRow(name, p.value, "#4dabf7");
    container.appendChild(row);
  });
}

export function renderSectorChart(container, data) {
  container.innerHTML = "";

  const sectorOrder = [
    "manufacturing",
    "chemicals",
    "raw_materials",
    "agriculture",
    "other"
  ];

  const labels = {
    manufacturing: "Manufacturing",
    chemicals: "Chemicals",
    raw_materials: "Raw Materials",
    agriculture: "Agriculture",
    other: "Other"
  };

  // create lookup from API data
  const dataMap = {};
  if (data) {
    data.forEach(s => {
      dataMap[s.sector] = s.value;
    });
  }

  // render ALWAYS in fixed order
  sectorOrder.forEach(sector => {
    const value = dataMap[sector] || 0;
    const label = labels[sector] || sector;

    const row = createBarRow(label, value, "#00cc66");
    container.appendChild(row);
  });
}

// ===== HELPERS =====
export function showLoading(container) {
  container.innerHTML = "<div style='opacity:0.6'>Loading...</div>";
}

export function showError(container, message = "⚠️ Data unavailable") {
  container.innerHTML = `<div style='color:#ff6b6b'>${message}</div>`;
}