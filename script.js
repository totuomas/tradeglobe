import { state } from "./src/state.js";
import { checkApiStatus, fetchTradePartners, fetchTradeSectors } from "./src/api.js";
import {
  renderPartnersChart,
  renderSectorChart,
  createStatusBar,
  setStatus,
  showLoading,
  showError
} from "./src/ui.js";
import { initGlobe, processFeatures } from "./src/globe.js";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

// ===== DOM =====
const infoPanel = document.getElementById("info-panel");
const countryNameEl = document.getElementById("country-name");
const partnersChart = document.getElementById("partners-chart");
const sectorsChart = document.getElementById("sectors-chart");
const sectorsCard = document.getElementById("sectors-card");

const globeContainer = document.getElementById("globe-container");

const sectorsBtn = document.getElementById("sectors-btn");
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

  // 🔁 re-fetch if country already selected
  if (state.lastClicked) {
    loadPartners(state.lastClicked);
  }
}

exportsBtn.onclick = () => setMode("exports");
importsBtn.onclick = () => setMode("imports");

// ===== LOAD PARTNERS (reusable) =====
async function loadPartners(polygon) {
  const iso = polygon.properties.ISO_A3;

  showLoading(partnersChart);
  sectorsCard.style.display = "none";
  state.showingSectors = false;
  sectorsBtn.textContent = "Show sector breakdown";

  if (state.currentRequest) state.currentRequest.abort();

  const controller = new AbortController();
  state.currentRequest = controller;

  try {
    const data = await fetchTradePartners(
      iso,
      state.tradeMode,
      controller.signal
    );

    // store clean data
    state.partnerData = data;

    // map for globe coloring
    state.tradePartners = {};
    data.forEach(p => {
      if (p.value > 0.05) {
        state.tradePartners[p.country] = p.value;
      }
    });

    renderPartnersChart(partnersChart, data);

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
  if (!state.lastClicked) return;

  const iso = state.lastClicked.properties.ISO_A3;

  // 🔁 toggle OFF (hide sectors)
  if (state.showingSectors) {
    sectorsCard.style.display = "none";
    state.showingSectors = false;
    sectorsBtn.textContent = "Show sector breakdown";
    return;
  }

  showLoading(sectorsChart);

  if (state.currentRequest) state.currentRequest.abort();

  const controller = new AbortController();
  state.currentRequest = controller;

  try {
    const data = await fetchTradeSectors(
      iso,
      state.tradeMode,
      controller.signal
    );

    state.sectors = data;
    state.showingSectors = true;

    // show card
    sectorsCard.style.display = "block";

    // render chart
    renderSectorChart(sectorsChart, data);

    sectorsBtn.textContent = "Hide sector breakdown";

  } catch (err) {
    if (err.name === "AbortError") return;
    showError(sectorsChart);
  }
};

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

        if (!state.apiOnline) {
          countryNameEl.textContent = "API Offline";
          showError(partnersChart, "Start server to load data");
          return;
        }

        state.lastClicked = polygon;

        countryNameEl.textContent = polygon.properties.ADMIN;

        // show button
        sectorsBtn.style.display = "block";

        await loadPartners(polygon);
      },

      // ===== RESET =====
      onReset(world) {
        state.tradePartners = {};
        state.lastClicked = null;
        state.sectors = null;
        state.showingSectors = false;

        countryNameEl.textContent = "Select a country";

        partnersChart.innerHTML = "";
        sectorsChart.innerHTML = "";
        sectorsCard.style.display = "none";
        sectorsBtn.style.display = "none";

        world.polygonCapColor(world.polygonCapColor());
        world.pointOfView({ altitude: 2.5 }, 1000);
      }
    });

    state.world = world;

  })
  .catch(err => {
    console.error("Failed to load GeoJSON:", err);
  });