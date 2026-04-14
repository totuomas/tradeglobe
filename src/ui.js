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

export function updateList(listEl, data) {
  listEl.innerHTML = "";

  if (!data || data.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No data available";
    listEl.appendChild(li);
    return;
  }

  data.slice(0, 10).forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.country} — ${p.value.toFixed(2)}%`;
    listEl.appendChild(li);
  });
}

export function showLoading(listEl) {
  listEl.innerHTML = "<li style='opacity:0.6'>Loading...</li>";
}

export function showError(listEl, message = "⚠️ Data unavailable") {
  listEl.innerHTML = `<li style='color:#ff6b6b'>${message}</li>`;
}