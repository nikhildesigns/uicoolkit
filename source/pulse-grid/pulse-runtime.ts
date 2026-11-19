import { createPulseRenderer, type GridOptions } from "./pulse-renderer";

export function mountPulseGrid(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement;
  if (!host) return;
  let renderer = createPulseRenderer(canvas);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const theme = matchMedia("(prefers-color-scheme: dark)");
  let options: GridOptions;
  let inView = false;
  let frame = 0;
  let last = 0;
  let time = 0.85;
  let pointer: [number, number] = [-1, -1];
  const taps = new Float32Array(12).fill(-100);
  let nextTap = 0;
  const frozen = () => options.still || reduced.matches;
  const visible = () => inView && !document.hidden;
  const acceptsPointer = () => options?.interactive && visible() && !frozen();
  const clearPointer = () => { pointer = [-1, -1]; };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  const tick = (now: number) => {
    time += Math.min(50, now - last) * options.speed / 1000;
    last = now;
    renderer?.draw(options, false, time, pointer, taps);
    frame = requestAnimationFrame(tick);
  };
  const refresh = () => {
    stop();
    if (!renderer || !options || !visible()) return;
    renderer.resize();
    renderer.refreshPalette();
    if (!acceptsPointer()) { clearPointer(); taps.fill(-100); }
    renderer.draw(options, frozen(), time, pointer, taps);
    if (!frozen()) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const paletteChanged = () => {
    if (options && visible() && renderer?.refreshPalette() && frozen()) {
      renderer.draw(options, true, time, pointer, taps);
    }
  };
  const point = (event: PointerEvent): [number, number] | undefined => {
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    if (x >= 0 && y >= 0 && x < box.width && y < box.height) return [x, y];
  };
  const move = (event: PointerEvent) => {
    if (!acceptsPointer() || event.pointerType === "touch") return;
    pointer = point(event) ?? [-1, -1];
  };
  const down = (event: PointerEvent) => {
    if (!acceptsPointer() || event.button !== 0) return;
    const xy = point(event);
    if (!xy) return;
    taps.set([...xy, time], nextTap * 3);
    nextTap = (nextTap + 1) % 4;
  };
  const lost = (event: Event) => { event.preventDefault(); stop(); renderer = undefined; };
  const restored = () => { renderer = createPulseRenderer(canvas); refresh(); };
  const viewer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; clearPointer(); refresh(); });
  viewer.observe(canvas);
  const resize = new ResizeObserver(refresh);
  resize.observe(canvas);
  const colors = new MutationObserver(paletteChanged);
  for (let node: HTMLElement | null = canvas; node; node = node.parentElement) {
    colors.observe(node, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
  }
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerleave", clearPointer);
  host.addEventListener("pointerdown", down, { passive: true });
  document.addEventListener("visibilitychange", refresh);
  reduced.addEventListener("change", refresh);
  theme.addEventListener("change", paletteChanged);
  window.addEventListener("resize", refresh);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  return {
    update(next: GridOptions) { options = next; refresh(); },
    dispose() {
      stop();
      viewer.disconnect();
      resize.disconnect();
      colors.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", clearPointer);
      host.removeEventListener("pointerdown", down);
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
