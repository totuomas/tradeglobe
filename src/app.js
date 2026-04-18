import { initTheme } from "./themeManager.js";
import { initStatus } from "./statusController.js";
import { initTrade } from "./tradeController.js";
import { initGlobe } from "./globeController.js";

export function initApp() {
  initTheme();
  initStatus();
  initTrade();
  initGlobe();
}