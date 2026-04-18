// ui.js

export function updateApiStatus(isOnline) {
  const dot = document.getElementById("status-dot");
  const text = document.getElementById("status-text");

  if (!dot || !text) return;

  if (isOnline) {
    dot.style.background = "#00ff88";
    text.textContent = "API Online";
  } else {
    dot.style.background = "#ff4d4d";
    text.textContent = "API Offline";
  }
}