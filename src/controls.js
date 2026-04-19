import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function createControls({
  canvas,
  projection,
  path,
  features,
  getISO,
  stateRefs,
  onClick,
  onHover
}) {
  const { rotation, velocity } = stateRefs;

  let hovered = null;

  let isDragging = false;
  let last = null;
  let moved = false;

  // ✅ NEW: animation lock
  let isAnimating = false;

  // ✅ GET TOOLTIP ELEMENT
  const tooltip = document.getElementById("tooltip");

  // =========================
  // MOUSE DOWN
  // =========================
  canvas.addEventListener("mousedown", e => {
    if (isAnimating) return; // 🚫 block during animation

    isDragging = true;
    last = [e.clientX, e.clientY];
    moved = false;
  });

  // =========================
  // MOUSE UP
  // =========================
  window.addEventListener("mouseup", () => {
    isDragging = false;
    canvas.style.cursor = hovered ? "pointer" : "default";
  });

  // =========================
  // MOUSE MOVE
  // =========================
  window.addEventListener("mousemove", e => {
    const [x, y] = [e.clientX, e.clientY];

    // ===== DRAG ROTATION =====
    if (isDragging && !isAnimating) {
      const dx = x - last[0];
      const dy = y - last[1];

      if (dx !== 0 || dy !== 0) {
        moved = true;
      }

      velocity[0] = dx * 0.2;
      velocity[1] = -dy * 0.2;

      rotation[0] += velocity[0];
      rotation[1] += velocity[1];

      rotation[1] = Math.max(-90, Math.min(90, rotation[1]));

      projection.rotate(rotation);
      last = [x, y];
    }

    // ===== HOVER DETECTION =====
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    hovered = null;

    for (let f of features) {
      path.context().beginPath();
      path(f);

      if (path.context().isPointInPath(mx * dpr, my * dpr)) {
        hovered = f;
        break;
      }
    }

    // ===== TOOLTIP + CURSOR =====
    if (hovered && !isDragging && !isAnimating) {
      const name =
        hovered.properties.name ||
        hovered.properties.ADMIN ||
        hovered.id ||
        "Unknown";

      tooltip.style.left = x - 4 + "px";
      tooltip.style.top = y + 4 + "px";

      tooltip.textContent = name;
      tooltip.style.opacity = 1;

      canvas.style.cursor = "pointer";
    } else {
      tooltip.style.opacity = 0;
      canvas.style.cursor = "default";
    }

    onHover?.(hovered, e);
  });

  // =========================
  // ZOOM (SCROLL)
  // =========================
  canvas.addEventListener("wheel", e => {
    if (isAnimating) return; // 🚫 ignore scroll during animation

    e.preventDefault();

    let scale = projection.scale();

    scale += e.deltaY * -0.3;
    scale = Math.max(200, Math.min(600, scale));

    projection.scale(scale);
  });

  // =========================
  // CLICK (STRICT CLICK ONLY)
  // =========================
  canvas.addEventListener("click", () => {
    if (!hovered) return;
    if (moved) return;
    if (isAnimating) return;

    focusCountry(hovered);
    onClick?.(hovered);

    hovered = null;
    tooltip.style.opacity = 0;
    canvas.style.cursor = "default";
  });

  // =========================
  // FOCUS ANIMATION
  // =========================
  function focusCountry(feature) {
    if (isAnimating) return; // prevent stacking
    isAnimating = true;

    const [lon, lat] = d3.geoCentroid(feature);

    const target = [-lon, Math.max(-60, Math.min(60, -lat))];

    const start = [...rotation];
    const startScale = projection.scale();
    const targetScale = startScale * 1.3;

    const duration = 800;
    const startTime = performance.now();

    function animate(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t * (2 - t);

      rotation[0] = start[0] + (target[0] - start[0]) * ease;
      rotation[1] = start[1] + (target[1] - start[1]) * ease;

      const scale = startScale + (targetScale - startScale) * ease;

      projection.rotate(rotation).scale(scale);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        isAnimating = false; // ✅ unlock controls
      }
    }

    requestAnimationFrame(animate);
  }

  return {
    getHovered: () => hovered
  };
}