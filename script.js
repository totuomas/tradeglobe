import { createGlobe } from "./src/globe.js";
import { fetchTradePartners, checkApiStatus } from "./src/api.js";
import { state } from "./src/state.js";
import { updateApiStatus, updateTradePanel } from "./src/ui.js";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/samsol38/3dglobesearch/refs/heads/main/public/data/countries_v2.geojson";

const canvas = document.getElementById("globe");

/* =========================
   HELPERS
========================= */
function getISO(f) {
  return f.properties.ISO_A3 !== "-99"
    ? f.properties.ISO_A3
    : f.properties.ADM0_A3;
}

/* =========================
   API STATUS
========================= */
async function checkAndUpdateStatus() {
  updateApiStatus(false);
  const online = await checkApiStatus();
  updateApiStatus(online);
}

// run once
checkAndUpdateStatus();

// retry button
document.getElementById("retry-btn")?.addEventListener(
  "click",
  checkAndUpdateStatus
);

/* =========================
   MODE TOGGLE (Exports / Imports)
========================= */
const toggleButtons = document.querySelectorAll("#mode-toggle button");

toggleButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const mode = btn.dataset.mode;

    if (mode === state.mode) return;

    state.mode = mode;

    // update UI
    toggleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // no country selected yet
    if (!state.selectedISO) return;

    const iso = state.selectedISO;

    const currentName =
      document.getElementById("country-name").textContent.split(" • ")[0];
    // show loading
    updateTradePanel(null, null, { loading: true });

    try {
      const partners = await fetchTradePartners(iso, mode);

      state.partners.clear();
      partners.forEach(p => {
        const key = p.iso || p.country;
        if (key) state.partners.set(key, p.value);
      });

      updateTradePanel(currentName, partners);

    } catch (err) {
      console.error("Toggle fetch failed:", err);
      updateTradePanel(null, null, { error: true });
    }
  });
});

/* =========================
   LOAD GLOBE
========================= */
fetch(GEOJSON_URL)
  .then(res => res.json())
  .then(data => {

    createGlobe(canvas, data.features, {

      onClick: async (country) => {
        const iso = getISO(country);
        const name = country.properties.ADMIN;

        state.selectedISO = iso;
        state.partners.clear();

        // show loading immediately
        updateTradePanel(name, null, { loading: true });

        try {
          const partners = await fetchTradePartners(iso, state.mode);

          partners.forEach(p => {
            const key = p.iso || p.country;
            if (key) state.partners.set(key, p.value);
          });

          updateTradePanel(name, partners);

        } catch (err) {
          console.error("Trade fetch failed:", err);
          updateTradePanel(name, null, { error: true });
        }
      }

    });

  })
  .catch(err => console.error("GeoJSON load failed:", err));