import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const BG = "https://unpkg.com/three-globe/example/img/night-sky.png";

export const themes = {
  dark: {
    name: "dark",

    globe: {
      sphere: ["#30415d", "#143651", "#030924"],
      atmosphere: ["rgba(0,150,255,0)", "rgba(0,150,255,0.2)", "rgba(0,120,255,0.6)"],
      countryDefault: "#e6e6e6",
      countrySelected: "#00cc66",
      stroke: "#000000",
      stars: BG
    },

    ui: {
      background: "#020617",
      panel: "rgba(15,23,42,0.55)",
      accent: "#22c55e",
      text: "#ffffff"
    }
  },
};