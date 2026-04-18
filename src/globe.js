import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { createRenderer } from "./renderer.js";
import { createControls } from "./controls.js";

function getISO(f) {
  return f.properties.ISO_A3 !== "-99"
    ? f.properties.ISO_A3
    : f.properties.ADM0_A3;
}

export function createGlobe(canvas, features, { onClick, onHover }) {
  const context = canvas.getContext("2d");

  const projection = d3.geoOrthographic().clipAngle(90);
  const path = d3.geoPath(projection, context);

  let width, height, scale;
  let rotation = [0, -20];
  let velocity = [0, 0];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    scale = height / 2.2;

    projection
      .translate([width / 2, height / 2])
      .scale(scale)
      .rotate(rotation);
  }

  const renderer = createRenderer({
    context,
    projection,
    path,
    features,
    getISO
  });

  const controls = createControls({
    canvas,
    projection,
    path,
    features,
    getISO,
    stateRefs: { rotation, velocity },
    onClick,
    onHover
  });

  function animate() {
    velocity[0] *= 0.92;
    velocity[1] *= 0.92;

    rotation[0] += velocity[0];
    rotation[1] += velocity[1];
    rotation[1] = Math.max(-90, Math.min(90, rotation[1]));

    projection.rotate(rotation);

    renderer.render({
      hovered: controls.getHovered(),
      rotation,
      scale,
      width,
      height
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
}