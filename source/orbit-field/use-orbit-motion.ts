"use client";

import { useEffect, useRef } from "react";

export function useOrbitMotion(still: boolean, speed: number, interactive: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const seconds = useRef(0);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let feedback: Animation[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let frame = 0;
    let last = 0;
    const running = () => visible && !still && !reduced.matches && !document.hidden;
    const tick = (now: number) => {
      const elapsed = Math.max(0, Math.min(now - last, 64)) / 1000;
      last = now;
      seconds.current += elapsed * speed;
      host.style.setProperty("--orbit-seconds", String(seconds.current));
      frame = requestAnimationFrame(tick);
    };
    const stopFeedback = () => {
      feedback.forEach(animation => animation.cancel());
      feedback = [];
    };
    const sync = () => {
      stopFeedback();
      cancelAnimationFrame(frame);
      if (running()) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const hover = (event: PointerEvent) => {
      if (!running() || !interactive || event.pointerType === "touch") return;
      stopFeedback();
      if (host.querySelector("[data-orbit-icon]")) return;
      const frames = [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }];
      for (const dot of host.querySelectorAll("[data-orbit-accent]")) {
        if (dot.animate) feedback.push(dot.animate(frames, { duration: 420, easing: "ease-in-out" }));
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(host);
    host.addEventListener("pointerenter", hover);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointerenter", hover);
      stopFeedback();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [still, speed, interactive]);
  return ref;
}
