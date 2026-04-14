import { state } from "./src/state.js";
import { checkApiStatus, fetchTradePartners } from "./src/api.js";
import { createStatusBar, setStatus, updateList, showLoading, showError } from "./src/ui.js";
import { initGlobe, processFeatures } from "./src/globe.js";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

// ===== DOM =====
const infoPanel = document.getElementById("info-panel");
const countryNameEl = document.getElementById("country-name");
const partnerListEl = document.getElementById("partner-list");
const globeContainer = document.getElementById("globe-container");

// ===== STATUS BAR =====
const { dot, text, btn } = createStatusBar(infoPanel);

// ===== API STATUS =====
async function checkApi() {
  setStatus(text, dot, "Connecting...", "orange");

  state.apiOnline = await checkApiStatus();

  if (state.apiOnline) {
    setStatus(text, dot, "API Online", "limegreen");
  } else {
    setStatus(text, dot, "API Offline", "red");
  }
}

btn.onclick = checkApi;
checkApi();

// ===== LOAD GLOBE =====
fetch(GEOJSON_URL)
  .then(res => res.json())
  .then(countries => {

    const features = processFeatures(countries);

    const world = initGlobe({
      container: globeContainer,
      features,
      state,

      // ===== COUNTRY CLICK =====
      async onCountryClick(polygon, world) {

        // API offline guard
        if (!state.apiOnline) {
          countryNameEl.textContent = "API Offline";
          showError(partnerListEl, "Start server to load data");
          return;
        }

        const iso = polygon.properties.ISO_A3;

        // update state
        state.lastClicked = polygon;

        // UI update
        countryNameEl.textContent = polygon.properties.ADMIN;
        showLoading(partnerListEl);

        // cancel previous request
        if (state.currentRequest) {
          state.currentRequest.abort();
        }

        const controller = new AbortController();
        state.currentRequest = controller;

        try {
          const data = await fetchTradePartners(iso, controller.signal);

          // rebuild trade partner map
          state.tradePartners = {};

          data.forEach(p => {
            if (p.value > 0.05) {
              state.tradePartners[p.country] = p.value;
            }
          });

          // update UI
          updateList(partnerListEl, data);

          // refresh globe colors
          world.polygonCapColor(world.polygonCapColor());

        } catch (err) {
          if (err.name === "AbortError") return;

          console.error(err);

          state.apiOnline = false;
          setStatus(text, dot, "API Offline", "red");

          showError(partnerListEl);
        }
      },

      // ===== RESET (CLICK EMPTY GLOBE) =====
      onReset(world) {
        state.tradePartners = {};
        state.lastClicked = null;

        countryNameEl.textContent = "Select a country";
        partnerListEl.innerHTML = "";

        world.polygonCapColor(world.polygonCapColor());
        world.pointOfView({ altitude: 2.5 }, 1000);
      }
    });

  })
  .catch(err => {
    console.error("Failed to load GeoJSON:", err);
  });