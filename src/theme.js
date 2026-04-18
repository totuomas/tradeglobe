import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const BG = "https://unpkg.com/three-globe/example/img/night-sky.png";

export const themes = {
  dark: {
    name: "dark",

    globe: {
      sphere: ["#30415d", "#143651", "#030924"],
      atmosphere: ["rgba(0,150,255,0)", "rgba(0,150,255,0.2)", "rgba(0,120,255,0.6)"],
      countryDefault: "#989898",
      countrySelected: "#00cc66",
      stroke: "#111",
      dataScale: d3.interpolateLab("#2b0a0a", "#ff6b6b"),
      stars: BG
    },

    ui: {
      background: "#020617",
      panel: "rgba(15,23,42,0.55)",
      accent: "#22c55e",
      text: "#ffffff"
    }
  },

  light: {
    name: "light",

    globe: {
      // soft daylight earth tones
      sphere: ["#e2e8f0", "#cbd5f5", "#94a3b8"],

      // subtle atmosphere (much lighter than dark)
      atmosphere: [
        "rgba(0,0,0,0)",
        "rgba(59,130,246,0.08)",
        "rgba(59,130,246,0.2)"
      ],

      countryDefault: "#d1d5db",
      countrySelected: "#2563eb",

      // light background → use white stroke
      stroke: "#ffffff",

      // nice clean blue gradient for data
      dataScale: d3.interpolateBlues,

      // no stars in light mode
      stars: null
    },

    ui: {
      background: "#f1f5f9", // soft gray instead of pure white
      panel: "rgba(255,255,255,0.7)",
      accent: "#2563eb", // modern blue
      text: "#0f172a"
    }
  }
};