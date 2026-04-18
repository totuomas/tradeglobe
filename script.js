import { createGlobe } from "./src/globe.js";
import { fetchTradePartners, checkApiStatus } from "./src/api.js";
import { state } from "./src/state.js";
import { updateApiStatus } from "./src/ui.js";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/samsol38/3dglobesearch/refs/heads/main/public/data/countries_v2.geojson";

const canvas = document.getElementById("globe");

// helper: consistent ISO
function getISO(f) {
  return f.properties.ISO_A3 !== "-99"
    ? f.properties.ISO_A3
    : f.properties.ADM0_A3;
}

/* =========================
   API STATUS HANDLING
========================= */

async function checkAndUpdateStatus() {
  // show checking state (optional)
  updateApiStatus(false, true);

  const online = await checkApiStatus();
  updateApiStatus(online);
}

// run once on load
checkAndUpdateStatus();

// retry button
const retryBtn = document.getElementById("retry-btn");
if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    checkAndUpdateStatus();
  });
}

/* =========================
   LOAD GLOBE DATA
========================= */

fetch(GEOJSON_URL)
  .then(res => res.json())
  .then(data => {

    createGlobe(canvas, data.features, {

      onClick: async (country) => {
        const iso = getISO(country);

        state.selectedISO = iso;
        state.partners.clear();

        try {
          const partners = await fetchTradePartners(iso, "export");

          // support both iso and country keys
          partners.forEach(p => {
            const key = p.iso || p.country;
            if (key) state.partners.set(key, p.value);
          });

        } catch (err) {
          console.error("Trade fetch failed:", err);
        }
      }

    });

  })
  .catch(err => console.error("GeoJSON load failed:", err));