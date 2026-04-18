import { state } from "./state.js";
import { fetchTradePartners } from "./api.js";
import { updateTradePanel } from "./ui.js";

export function initTrade() {
  const buttons = document.querySelectorAll("#mode-toggle button");

  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const mode = btn.dataset.mode;

      if (mode === state.mode) return;

      state.mode = mode;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      if (!state.selectedISO) return;

      const iso = state.selectedISO;

      const name =
        document.getElementById("country-name").textContent.split(" • ")[0];

      updateTradePanel(null, null, { loading: true });

      try {
        const partners = await fetchTradePartners(iso, mode);

        state.partners.clear();
        partners.forEach(p => {
          const key = p.iso || p.country;
          if (key) state.partners.set(key, p.value);
        });

        updateTradePanel(name, partners);

      } catch {
        updateTradePanel(null, null, { error: true });
      }
    });
  });
}