import { createContourRenderer } from "./contour-renderer";

type Options = { density: number; still: boolean; speed: number; interactive: boolean };

export function mountContourField(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement;
  if (!host) return;
  let renderer = createContourRenderer(canvas);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const theme = matchMedia("(prefers-color-scheme: dark)");
  let options: Options;
  let inView = false;
  let frame = 0;
  let last = 0;
  let time = 6;
  // Normalized coordinates keep the frozen pointer influence stable on resize.
  const pointer = { x: -1, y: -1, targetX: -1, targetY: -1 };
  const frozen = () => options.still || reduced.matches;
  const visible = () => inView && !document.hidden;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  const draw = () => renderer?.draw(time, options.density, pointer.x, pointer.y);
  const tick = (now: number) => {
    time += Math.min(50, now - last) * options.speed / 1000;
    last = now;
    if (pointer.x < 0 || pointer.targetX < 0) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
    } else {
      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;
    }
    draw();
    frame = requestAnimationFrame(tick);
  };
  const refresh = () => {
    stop();
    if (!renderer || !options || !visible()) return;
    renderer.resize();
    renderer.refreshPalette();
    draw();
    if (!frozen()) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const paletteChanged = () => {
    if (options && visible() && renderer?.refreshPalette() && frozen()) draw();
  };
  const leave = () => { pointer.targetX = pointer.targetY = -1; };
  const move = (event: PointerEvent) => {
    if (!options?.interactive || frozen() || !visible() || event.pointerType === "touch") return;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height || event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom) { leave(); return; }
    pointer.targetX = (event.clientX - box.left) / box.width;
    pointer.targetY = 1 - (event.clientY - box.top) / box.height;
  };
  const lost = (event: Event) => { event.preventDefault(); stop(); renderer = undefined; };
  const restored = () => { renderer = createContourRenderer(canvas); refresh(); };
  const viewer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; refresh(); });
  viewer.observe(canvas);
  const resize = new ResizeObserver(refresh);
  resize.observe(canvas);
  const colors = new MutationObserver(paletteChanged);
  for (let node: HTMLElement | null = canvas; node; node = node.parentElement) {
    colors.observe(node, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
  }
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", refresh);
  reduced.addEventListener("change", refresh);
  theme.addEventListener("change", paletteChanged);
  window.addEventListener("resize", refresh);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  return {
    update(next: Options) {
      options = next;
      if (!next.interactive) { leave(); pointer.x = pointer.y = -1; }
      refresh();
    },
    dispose() {
      stop();
      viewer.disconnect();
      resize.disconnect();
      colors.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", refresh);
      reduced.removeEventListener("change", refresh);
      theme.removeEventListener("change", paletteChanged);
      window.removeEventListener("resize", refresh);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      renderer?.dispose();
    },
  };
}
