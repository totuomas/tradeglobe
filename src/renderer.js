import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { state } from "./state.js";

const starCache = new Map();

function getStarImage(src) {
  if (!src) return null;

  if (!starCache.has(src)) {
    const img = new Image();
    img.src = src;
    starCache.set(src, img);
  }

  return starCache.get(src);
}

export function createRenderer({ context, projection, path, features, getISO }) {

  function theme() {
    return state.theme.globe;
  }

  function getColor(iso) { 
    const t = theme();
    if (      !state.selectedISO) return t.countryDefault;
    if (iso == state.selectedISO) return t.countrySelected;
    if (iso != state.selectedISO) {
      const p = state.partners.get(iso);
      const intensity = Math.max(0.08, Math.min(1, Math.sqrt(p / 20)));
      const gb = Math.floor(255 * (1 - intensity));
      return `rgb(255, ${gb}, ${gb})`;
    }
  }

  function drawStars(width, height, rotation) {
    const t = theme();
    const img = getStarImage(t.stars);

    if (!img || !img.complete) return;

    const imgW = img.width;
    const imgH = img.height;

    context.save();

    let offsetX = rotation[0] % imgW;
    if (offsetX < 0) offsetX += imgW;

    context.translate(-offsetX, 0);

    for (let x = -imgW; x < width + imgW; x += imgW) {
      context.drawImage(img, x, 0, imgW, height);
    }

    context.restore();
  }

  function drawSphere(width, height, scale) {
    const t = theme();

    const gradient = context.createLinearGradient(
      0,
      height / 2 - scale,
      0,
      height / 2 + scale
    );

    gradient.addColorStop(0, t.sphere[0]);
    gradient.addColorStop(0.5, t.sphere[1]);
    gradient.addColorStop(1, t.sphere[2]);

    context.beginPath();
    path({ type: "Sphere" });
    context.fillStyle = gradient;
    context.fill();
  }

  function drawAtmosphere(
    width,
    height,
    scale,
    {
        innerRatio = 0.5,   // where the glow starts
        outerRatio = 0.9,   // how far it extends
        blur = 8,           // softness
        opacity = 1,        // overall strength
        composite = "lighter"
    } = {}
    ) {
    const t = theme();

    const cx = width / 2;
    const cy = height / 2;

    const innerRadius = scale * innerRatio;
    const outerRadius = scale * outerRatio;

    const gradient = context.createRadialGradient(
        cx, cy, innerRadius,
        cx, cy, outerRadius
    );

    gradient.addColorStop(0, t.atmosphere[0]);
    gradient.addColorStop(0.7, t.atmosphere[1]);
    gradient.addColorStop(1, t.atmosphere[2]);

    context.save();
    context.beginPath();
    context.arc(cx, cy, outerRadius, 0, Math.PI * 2);

    context.fillStyle = gradient;
    context.globalCompositeOperation = composite;
    context.globalAlpha = opacity;
    context.filter = `blur(${blur}px)`;

    context.fill();
    context.restore();
  }

  function drawCountries(hovered) {
    const t = theme();

    for (let f of features) {
      if (f === hovered) continue;

      context.beginPath();
      path(f);

      const iso = getISO(f);

      context.fillStyle = getColor(iso);
      context.fill();

      context.strokeStyle = t.stroke;
      context.lineWidth = 1.0;
      context.stroke();
    }
  }

  function drawHovered(f) {
    if (!f) return;

    const t = theme();

    context.save();

    context.shadowBlur = 20;
    context.shadowColor = t.countrySelected;

    context.beginPath();
    path(f);

    context.fillStyle = t.countrySelected;
    context.globalAlpha = 0.95;
    context.fill();

    context.restore();
  }

  function render({ hovered, rotation, scale, width, height }) {
    context.clearRect(0, 0, width, height);

    drawStars(width, height, rotation);
    drawSphere(width, height, scale);
    // drawAtmosphere(width, height, scale);
    drawCountries(hovered);
    drawHovered(hovered);
  }

  return { render };
}