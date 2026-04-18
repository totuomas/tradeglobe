import { createGlobe } from "./globe.js";
import { state } from "./state.js";
import { fetchTradePartners } from "./api.js";
import { updateTradePanel } from "./ui.js";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/samsol38/3dglobesearch/refs/heads/main/public/data/countries_v2.geojson";

function getISO(f) {
  return f.properties.ISO_A3 !== "-99"
    ? f.properties.ISO_A3
    : f.properties.ADM0_A3;
}

export function initGlobe() {
  const canvas = document.getElementById("globe");

  fetch(GEOJSON_URL)
    .then(res => res.json())
    .then(data => {

      createGlobe(canvas, data.features, {

        onClick: async (country) => {
          const iso = getISO(country);
          const name = country.properties.ADMIN;

          state.selectedISO = iso;
          state.partners.clear();

          updateTradePanel(name, null, { loading: true });

          try {
            const partners = await fetchTradePartners(iso, state.mode);

            partners.forEach(p => {
              const key = p.iso || p.country;
              if (key) state.partners.set(key, p.value);
            });

            updateTradePanel(name, partners);

          } catch {
            updateTradePanel(name, null, { error: true });
          }
        }

      });

    })
    .catch(err => console.error("GeoJSON load failed:", err));
}