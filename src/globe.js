import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { state } from "./state.js";

// ✅ FIX: consistent ISO everywhere
function getISO(f) {
  return f.properties.ISO_A3 !== "-99"
    ? f.properties.ISO_A3
    : f.properties.ADM0_A3;
}

export function createGlobe(canvas, features, { onClick, onHover }) {
  const context = canvas.getContext("2d");
  const tooltip = document.getElementById("tooltip");

  let width, height, scale;

  const starImg = new Image();
  starImg.src = "https://unpkg.com/three-globe/example/img/night-sky.png";

  const projection = d3.geoOrthographic().clipAngle(90);
  const path = d3.geoPath(projection, context);

  let rotation = [0, -20];
  let velocity = [0, 0];
  const friction = 0.92;

  let hovered = null;
  let isAnimating = false;

  let isDragging = false;
  let last = null;
  let dragDistance = 0;
  const DRAG_THRESHOLD = 5;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    scale = height / 2.2;

    projection
      .translate([width / 2, height / 2])
      .scale(scale)
      .rotate(rotation);
  }

  function drawStarSky() {
    if (!starImg.complete) return;

    const imgW = starImg.width;
    const imgH = starImg.height;

    context.save();

    let offsetX = rotation[0] % imgW;
    if (offsetX < 0) offsetX += imgW;

    let offsetY = rotation[1] * 0.6;
    offsetY = Math.max(-imgH / 3, Math.min(imgH / 3, offsetY));

    context.translate(-offsetX, -offsetY);

    for (let x = -imgW; x < width + imgW; x += imgW) {
      context.drawImage(starImg, x, -imgH, imgW, height + imgH * 2);
    }

    context.restore();
  }

  // 🌍 Shaded sphere
  function drawSphere() {
    const gradient = context.createLinearGradient(
      0,
      height / 2 - scale,
      0,
      height / 2 + scale
    );

    gradient.addColorStop(0, "#1e293b");
    gradient.addColorStop(0.5, "#0b1e2d");
    gradient.addColorStop(1, "#020617");

    context.beginPath();
    path({ type: "Sphere" });
    context.fillStyle = gradient;
    context.fill();
  }

  // ✨ NEW: atmosphere glow
  function drawAtmosphere() {
    const cx = width / 2;
    const cy = height / 2;

    const atmosphereRadius = scale * 1.08;

    const lightOffsetX = scale * 0.25; // directional light

    const gradient = context.createRadialGradient(
      cx + lightOffsetX,
      cy,
      scale * 0.75,
      cx,
      cy,
      atmosphereRadius
    );

    gradient.addColorStop(0, "rgba(0,150,255,0)");
    gradient.addColorStop(0.7, "rgba(0,150,255,0.15)");
    gradient.addColorStop(0.85, "rgba(0,180,255,0.3)");
    gradient.addColorStop(1, "rgba(0,120,255,0.55)");

    context.save();

    context.beginPath();
    context.arc(cx, cy, atmosphereRadius, 0, Math.PI * 2);

    context.fillStyle = gradient;

    // glow magic
    context.globalCompositeOperation = "lighter";
    context.filter = "blur(10px)";

    context.fill();

    context.restore();
  }

  function getColor(iso) {
    if (!state.selectedISO) return "#e5e7eb";

    if (iso === state.selectedISO) return "#00cc66";

    const value = state.partners.get(iso);
    if (!value) return "#e5e7eb";

    const intensity = Math.min(value / 30, 1);
    const gb = Math.floor(255 * (1 - intensity));

    return `rgb(255, ${gb}, ${gb})`;
  }

  function drawHoveredCountry(f) {
    context.save();

    context.shadowBlur = 25;
    context.shadowColor = "rgba(0,255,150,0.7)";

    context.beginPath();
    path(f);

    context.fillStyle = "#00cc66";
    context.globalAlpha = 0.95;
    context.fill();

    context.strokeStyle = "#000";
    context.lineWidth = 1;
    context.stroke();

    context.restore();
  }

  function focusCountry(feature) {
    if (isAnimating) return;

    const [lon, lat] = d3.geoCentroid(feature);

    velocity = [0, 0];

    const target = [-lon, Math.max(-60, Math.min(60, -lat))];

    const start = [...rotation];
    const startScale = scale;
    const targetScale = height / 1.8;

    const duration = 800;
    const startTime = performance.now();

    isAnimating = true;

    function animateFocus(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t * (2 - t);

      rotation[0] = start[0] + (target[0] - start[0]) * ease;
      rotation[1] = start[1] + (target[1] - start[1]) * ease;

      scale = startScale + (targetScale - startScale) * ease;

      projection.rotate(rotation).scale(scale);

      if (t < 1) {
        requestAnimationFrame(animateFocus);
      } else {
        isAnimating = false;
      }
    }

    requestAnimationFrame(animateFocus);
  }

  function render() {
    context.clearRect(0, 0, width, height);

    drawStarSky();
    drawSphere();
    drawAtmosphere(); // ✨ added here

    for (let f of features) {
      if (f === hovered) continue;

      context.beginPath();
      path(f);

      const iso = getISO(f);
      context.fillStyle = getColor(iso);

      context.fill();

      context.strokeStyle = "#111";
      context.lineWidth = 0.5;
      context.stroke();
    }

    if (hovered) drawHoveredCountry(hovered);
  }

  canvas.addEventListener("mousedown", e => {
    if (isAnimating) return;

    isDragging = true;
    last = [e.clientX, e.clientY];
    dragDistance = 0;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  window.addEventListener("mousemove", e => {
    if (isAnimating) return;

    const [x, y] = [e.clientX, e.clientY];

    if (isDragging) {
      const dx = x - last[0];
      const dy = y - last[1];

      dragDistance += Math.sqrt(dx * dx + dy * dy);

      velocity = [dx * 0.2, -dy * 0.2];

      rotation[0] += velocity[0];
      rotation[1] += velocity[1];
      rotation[1] = Math.max(-90, Math.min(90, rotation[1]));

      projection.rotate(rotation);
      last = [x, y];
    }

    const [mx, my] = d3.pointer(e, canvas);
    hovered = null;

    for (let f of features) {
      context.beginPath();
      path(f);
      if (context.isPointInPath(mx, my)) {
        hovered = f;
        break;
      }
    }

    if (tooltip) {
      if (hovered) {
        tooltip.textContent = hovered.properties.ADMIN || "Unknown";
        tooltip.style.left = `${x + 12}px`;
        tooltip.style.top = `${y + 12}px`;
        tooltip.style.opacity = 1;
        canvas.style.cursor = "pointer";
      } else {
        tooltip.style.opacity = 0;
        canvas.style.cursor = "default";
      }
    }

    onHover?.(hovered);
  });

  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    scale += e.deltaY * -0.3;
    scale = Math.max(150, Math.min(600, scale));
    projection.scale(scale);
  });

  canvas.addEventListener("click", e => {
    if (isAnimating) return;
    if (dragDistance > DRAG_THRESHOLD) return;

    const [x, y] = d3.pointer(e);

    for (let f of features) {
      context.beginPath();
      path(f);
      if (context.isPointInPath(x, y)) {
        focusCountry(f);
        onClick?.(f);
        if (tooltip) tooltip.style.opacity = 0;
        break;
      }
    }
  });

  function animate() {
    if (!isDragging && !isAnimating) {
      velocity[0] *= friction;
      velocity[1] *= friction;

      rotation[0] += velocity[0];
      rotation[1] += velocity[1];
      rotation[1] = Math.max(-90, Math.min(90, rotation[1]));

      projection.rotate(rotation);
    }

    render();
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
}