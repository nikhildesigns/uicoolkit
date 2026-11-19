"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createFlameRenderer } from "./flame-renderer";
import type { FlamePreset } from "./flame-shader";
import styles from "./burning-text.module.css";

type Props = {
  textRef: RefObject<HTMLElement | null>;
  text: string;
  preset: FlamePreset;
  still: boolean;
  speed: number;
  color: string;
};

export function FlameCanvas({ textRef, text, preset, still, speed, color }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const options = useRef({ preset, still, speed });
  const invalidate = useRef<() => void>(undefined);

  useEffect(() => {
    options.current = { preset, still, speed };
    invalidate.current?.();
  }, [preset, still, speed, text, color]);

  useEffect(() => {
    const canvas = ref.current;
    const word = textRef.current;
    if (!canvas || !word) return;
    let renderer = createFlameRenderer(canvas, word);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    let inView = false;
    let forceMask = true;
    let frame = 0;
    let time = 3;
    let last = 0;

    const animate = (now: number) => {
      time += Math.min(now - last, 50) / 1000 * options.current.speed;
      last = now;
      renderer?.draw(time);
      frame = requestAnimationFrame(animate);
    };
    const sync = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (!renderer || !inView || document.hidden) return;
      if (renderer.update(forceMask, options.current.preset)) {
        renderer.draw(time);
        canvas.dataset.ready = "";
      }
      forceMask = false;
      if (!reduced.matches && !options.current.still) {
        last = performance.now();
        frame = requestAnimationFrame(animate);
      }
    };
    const fontsChanged = () => { forceMask = true; sync(); };
    const lost = (event: Event) => {
      event.preventDefault();
      renderer = undefined;
      delete canvas.dataset.ready;
      sync();
    };
    const restored = () => {
      renderer = createFlameRenderer(canvas, word);
      fontsChanged();
    };
    invalidate.current = sync;
    const resize = new ResizeObserver(sync);
    resize.observe(word);
    resize.observe(canvas);
    const theme = new MutationObserver(sync);
    for (let node = canvas.parentElement; node; node = node.parentElement) {
      theme.observe(node, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    }
    const viewer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    viewer.observe(canvas);
    document.fonts?.addEventListener("loadingdone", fontsChanged);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", sync);
    reduced.addEventListener("change", sync);
    scheme.addEventListener("change", sync);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      invalidate.current = undefined;
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
      viewer.disconnect();
      document.fonts?.removeEventListener("loadingdone", fontsChanged);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", sync);
      reduced.removeEventListener("change", sync);
      scheme.removeEventListener("change", sync);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      renderer?.dispose();
      delete canvas.dataset.ready;
    };
  }, [textRef]);

  return <canvas ref={ref} aria-hidden className={styles.canvas} />;
}
