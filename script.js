import { state } from "./src/state.js";
import { checkApiStatus, fetchTradePartners, fetchTradeSectors } from "./src/api.js";
import { renderPartnersChart, renderSectorChart, createStatusBar, setStatus, showLoading, showError } from "./src/ui.js";
import { initGlobe, processFeatures } from "./src/globe.js";

const GEOJSON_URL = 
"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

// ===== DOM =====
const infoPanel = document.getElementById("info-panel");
const countryNameEl = document.getElementById("country-name");
const partnersChart = document.getElementById("partners-chart");
const sectorsChart = document.getElementById("sectors-chart");

const globeContainer = document.getElementById("globe-container");

const sectorsBtn = document.getElementById("sectors-toggle");
const exportsBtn = document.getElementById("exports-btn");
const importsBtn = document.getElementById("imports-btn");

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

// ===== MODE TOGGLE =====
function setMode(mode) {
  state.tradeMode = mode;

  exportsBtn.classList.toggle("active", mode === "exports");
  importsBtn.classList.toggle("active", mode === "imports");

  document.querySelector("#header p").textContent =
    mode === "exports"
      ? "Click a country to see its export partners"
      : "Click a country to see its import partners";

  if (state.lastClicked) {
    loadPartners(state.lastClicked);
  }
}

exportsBtn.onclick = () => setMode("exports");
importsBtn.onclick = () => setMode("imports");

// ===== LOAD PARTNERS =====
async function loadPartners(polygon) {
  const iso = polygon.properties.ISO_A3 !== "-99"
    ? polygon.properties.ISO_A3
    : polygon.properties.ADM0_A3;

  showLoading(partnersChart);

  if (state.currentRequest) state.currentRequest.abort();

  const controller = new AbortController();
  state.currentRequest = controller;

  try {
    const data = await fetchTradePartners(
      iso,
      state.tradeMode,
      controller.signal
    );

    state.partnerData = data;

    // map for globe coloring
    state.tradePartners = {};
    data.forEach(p => {
      if (p.value > 0.05) {
        state.tradePartners[p.country] = p.value;
      }
    });

    renderPartnersChart(partnersChart, data, state.isoToName);

    if (state.world) {
      state.world.polygonCapColor(state.world.polygonCapColor());
    }

  } catch (err) {
    if (err.name === "AbortError") return;
    showError(partnersChart);
  }
}

// ===== SECTOR BUTTON =====
sectorsBtn.onclick = async () => {
  // 🔁 toggle state
  state.showingSectors = !state.showingSectors;

  // update button text
  sectorsBtn.textContent = state.showingSectors
    ? "Hide sector breakdown"
    : "Show sector breakdown";

  // ❌ if turning OFF → reset to empty bars
  if (!state.showingSectors) {
    renderSectorChart(sectorsChart, []);
    return;
  }

  // ✅ if turning ON and country selected → fetch
  if (state.lastClicked) {
    const iso = state.lastClicked.properties.ISO_A3;

    showLoading(sectorsChart);

    try {
      const data = await fetchTradeSectors(iso, state.tradeMode);
      renderSectorChart(sectorsChart, data);
    } catch {
      showError(sectorsChart);
    }
  }
};

// ===== LOAD GLOBE =====
fetch(GEOJSON_URL)
  .then(res => res.json())
  .then(countries => {

    const features = processFeatures(countries);

    // 🌍 ISO → NAME MAP (FIXED)
    const isoToName = {};
    features.forEach(f => {
      const iso = f.properties.ISO_A3 !== "-99"
        ? f.properties.ISO_A3
        : f.properties.ADM0_A3;

      isoToName[iso] = f.properties.ADMIN;
    });
    state.isoToName = isoToName;

    // ✅ INITIAL EMPTY CHARTS (0% bars)
    renderPartnersChart(partnersChart, [], isoToName);
    renderSectorChart(sectorsChart, []);

    const world = initGlobe({
      container: globeContainer,
      features,
      state,

      // ===== COUNTRY CLICK =====
      async onCountryClick(polygon, world) {

        if (!state.apiOnline) {
          countryNameEl.textContent = "API Offline";
          showError(partnersChart, "Start server to load data");
          return;
        }

        state.lastClicked = polygon;

        countryNameEl.textContent = polygon.properties.ADMIN;

        await loadPartners(polygon);

        // ✅ if toggle is ON → also load sectors
        if (state.showingSectors) {
          const iso = polygon.properties.ISO_A3;

          showLoading(sectorsChart);

          try {
            const data = await fetchTradeSectors(iso, state.tradeMode);
            renderSectorChart(sectorsChart, data);
          } catch {
            showError(sectorsChart);
          }
        } else {
          // keep empty bars if OFF
          renderSectorChart(sectorsChart, []);
        }
      },

      // ===== RESET =====
      onReset(world) {
        state.tradePartners = {};
        state.lastClicked = null;
        state.sectors = null;

        // ✅ reset toggle state
        state.showingSectors = false;
        sectorsBtn.textContent = "Show sector breakdown";

        countryNameEl.textContent = "Select a country";

        // ✅ RESET TO ZERO BARS
        renderPartnersChart(partnersChart, [], state.isoToName);
        renderSectorChart(sectorsChart, []);

        world.polygonCapColor(world.polygonCapColor());
        world.pointOfView({ altitude: 2.5 }, 1000);
      }
    })

    state.world = world;

  })
  .catch(err => {
    console.error("Failed to load GeoJSON:", err);
  });