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

  // ✅ GET TOOLTIP ELEMENT
  const tooltip = document.getElementById("tooltip");

  // =========================
  // MOUSE DOWN
  // =========================
  canvas.addEventListener("mousedown", e => {
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
    if (isDragging) {
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
    const [mx, my] = d3.pointer(e, canvas);
    hovered = null;

    for (let f of features) {
      path.context().beginPath();
      path(f);
      if (path.context().isPointInPath(mx, my)) {
        hovered = f;
        break;
      }
    }

    // ===== TOOLTIP + CURSOR =====
    if (hovered && !isDragging) {
      const name =
        hovered.properties.name ||
        hovered.properties.ADMIN ||
        hovered.id || // fallback
        "Unknown";

      // position
      tooltip.style.left = x - 4 + "px";
      tooltip.style.top = y + 4 + "px";

      // content
      tooltip.textContent = name;

      // show
      tooltip.style.opacity = 1;

      canvas.style.cursor = "pointer";
    } else {
      tooltip.style.opacity = 0;
      canvas.style.cursor = "default";
    }

    // optional external hook
    onHover?.(hovered, e);
  });

  // =========================
  // ZOOM
  // =========================
  canvas.addEventListener("wheel", e => {
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

      if (t < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  return {
    getHovered: () => hovered
  };
}