"use client";

import { type KeyboardEvent, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { itemEdges, roundTime, snapDelta, type TimelineItem } from "./animation-timeline-math";
import { type AnimationTimelineZoomValue, useIsomorphicLayoutEffect } from "./animation-timeline-state";

type ScrubOptions = {
  time: number;
  duration: number;
  items: TimelineItem[];
  snap: boolean;
  snapInterval: number;
  step: number;
  largeStep: number;
  pixelsPerSecond: number;
  disabled: boolean;
  laneRef: { current: HTMLDivElement | null };
  setLive: (time: number | null) => void;
  onSeek?: (time: number) => void;
  onSeekCommit: (time: number) => void;
};

const clampTime = (time: number, duration: number) => roundTime(Math.min(duration, Math.max(0, time)));

/** Click or drag the ruler to move the playhead. Escape returns it to where it started. */
export function useTimelineScrub(options: ScrubOptions) {
  const latest = useRef(options);
  useIsomorphicLayoutEffect(() => {
    latest.current = options;
  });
  const stopRef = useRef<(() => void) | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const timeFrom = (event: { clientX: number; altKey: boolean }) => {
    const { laneRef, pixelsPerSecond, duration, items, snap, snapInterval } = latest.current;
    const left = laneRef.current?.getBoundingClientRect().left ?? 0;
    const raw = (event.clientX - left) / pixelsPerSecond;
    const found = snap && !event.altKey ? snapDelta([raw], [0, duration, ...items.flatMap(itemEdges)], snapInterval, 6 / pixelsPerSecond) : null;
    return clampTime(raw + (found?.delta ?? 0), duration);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const { disabled, time: start } = latest.current;
    if (disabled || event.button !== 0 || stopRef.current) return;
    const pointerId = event.pointerId;
    let last = timeFrom(event);
    const show = (next: number) => {
      last = next;
      latest.current.setLive(next);
      latest.current.onSeek?.(next);
    };
    const end = () => {
      stopRef.current?.();
      stopRef.current = null;
      setScrubbing(false);
      latest.current.setLive(null);
    };
    const cancel = () => {
      latest.current.onSeek?.(start);
      end();
    };
    const onMove = (next: PointerEvent) => {
      if (next.pointerId === pointerId) show(timeFrom(next));
    };
    const onUp = (next: PointerEvent) => {
      if (next.pointerId !== pointerId) return;
      latest.current.onSeekCommit(last);
      end();
    };
    const onCancel = (next: PointerEvent) => {
      if (next.pointerId === pointerId) cancel();
    };
    const onKey = (next: globalThis.KeyboardEvent) => {
      if (next.key !== "Escape") return;
      next.preventDefault();
      next.stopPropagation();
      cancel();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", cancel);
    stopRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", cancel);
    };
    setScrubbing(true);
    show(last);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { disabled, time, duration, step, largeStep, onSeek, onSeekCommit } = latest.current;
    const amount = event.shiftKey ? largeStep : step;
    const targets: Record<string, number> = { ArrowLeft: time - amount, ArrowDown: time - amount, ArrowRight: time + amount, ArrowUp: time + amount, PageDown: time - largeStep, PageUp: time + largeStep, Home: 0, End: duration };
    const target = targets[event.key];
    if (disabled || target === undefined) return;
    event.preventDefault();
    const next = clampTime(target, duration);
    if (next === time) return;
    onSeek?.(next);
    onSeekCommit(next);
  };

  useEffect(() => () => stopRef.current?.(), []);

  return { scrubbing, handlers: { onPointerDown, onKeyDown } };
}

type ZoomOptions = {
  initial: AnimationTimelineZoomValue;
  max: number;
  duration: number;
  basePixels: number;
  hasTracks: boolean;
  scrollerRef: { current: HTMLDivElement | null };
  namesRef: { current: HTMLDivElement | null };
  laneRef: { current: HTMLDivElement | null };
};

/** Fit shows the whole timeline. A percent zooms in from Fit and keeps one moment in place: the pointer's with Ctrl or Cmd + scroll, otherwise the view's center. */
export function useTimelineZoom({ initial, max, duration, basePixels, hasTracks, scrollerRef, namesRef, laneRef }: ZoomOptions) {
  const [zoom, setZoomState] = useState(initial);
  const [fitWidth, setFitWidth] = useState(0);
  const fitPixels = fitWidth > 0 && duration > 0 ? fitWidth / duration : basePixels;
  const pixelsPerSecond = zoom === "fit" ? fitPixels : (fitPixels * zoom) / 100;
  const latest = useRef({ zoom, pixelsPerSecond, fitPixels, max });
  const pending = useRef<{ time: number; offset: number } | null>(null);
  useIsomorphicLayoutEffect(() => {
    latest.current = { zoom, pixelsPerSecond, fitPixels, max };
    const scroller = scrollerRef.current;
    if (!pending.current || !scroller) return;
    scroller.scrollLeft = (namesRef.current?.offsetWidth ?? 0) + pending.current.time * pixelsPerSecond - pending.current.offset;
    pending.current = null;
  });

  // Fit follows the space available, so it holds at every screen size.
  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const measure = () => setFitWidth(Math.max(0, Math.floor(scroller.clientWidth - (namesRef.current?.offsetWidth ?? 0))));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [hasTracks, scrollerRef, namesRef]);

  const zoomTo = (requested: AnimationTimelineZoomValue, clientX?: number) => {
    const current = latest.current;
    if (requested === "fit" || requested <= 100) {
      pending.current = null;
      setZoomState("fit");
      return;
    }
    const next = Math.round(Math.min(current.max, requested));
    if (next === current.zoom) return;
    const scroller = scrollerRef.current;
    const lane = laneRef.current;
    if (scroller && lane) {
      const box = scroller.getBoundingClientRect();
      const names = namesRef.current?.offsetWidth ?? 0;
      const anchor = clientX ?? box.left + names + (box.width - names) / 2;
      pending.current = { time: (anchor - lane.getBoundingClientRect().left) / current.pixelsPerSecond, offset: anchor - box.left };
    }
    setZoomState(next);
  };
  const zoomRef = useRef(zoomTo);
  useIsomorphicLayoutEffect(() => {
    zoomRef.current = zoomTo;
  });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const { pixelsPerSecond: shown, fitPixels: fit } = latest.current;
      zoomRef.current((shown / fit) * 100 * Math.exp(-event.deltaY * 0.002), event.clientX);
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [hasTracks, scrollerRef]);

  return { zoom, pixelsPerSecond, setZoom: zoomTo };
}
