import { checkApiStatus } from "./api.js";
import { updateApiStatus } from "./ui.js";

export function initStatus() {

  async function checkAndUpdate() {
    updateApiStatus(false);
    const online = await checkApiStatus();
    updateApiStatus(online);
  }

  checkAndUpdate();

  document.getElementById("retry-btn")?.addEventListener(
    "click",
    checkAndUpdate
  );
}