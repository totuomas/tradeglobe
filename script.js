import { createGlobe } from "./src/globe.js";
import { fetchTradePartners } from "./src/api.js";
import { state } from "./src/state.js";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/samsol38/3dglobesearch/refs/heads/main/public/data/countries_v2.geojson";

const canvas = document.getElementById("globe");

// helper: consistent ISO
function getISO(f) {
  return f.properties.ISO_A3 !== "-99"
    ? f.properties.ISO_A3
    : f.properties.ADM0_A3;
}

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

          // 🔥 key fix: support both iso and country
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