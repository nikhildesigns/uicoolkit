"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { type EasingCurveHandle, type EasingCurveRange, type EasingCurveValue, handlePoint, moveHandle, ratioToX, ratioToY, sameCurve, xToRatio, yToRatio } from "./easing-curve-editor-math";
import { type EasingCurveDetail, useIsomorphicLayoutEffect } from "./easing-curve-editor-state";

type Options = {
  value: EasingCurveValue;
  range: EasingCurveRange;
  step: number;
  enabled: boolean;
  trackRef: { current: HTMLDivElement | null };
  handleRefs: { current: (HTMLDivElement | null)[] };
  setLive: (value: EasingCurveValue | null) => void;
  onValueChange?: (value: EasingCurveValue, detail: EasingCurveDetail) => void;
  onValueCommit: (value: EasingCurveValue, detail: EasingCurveDetail) => void;
};

type Drag = {
  id: number;
  handle: EasingCurveHandle;
  start: EasingCurveValue;
  last: EasingCurveValue;
  element: HTMLElement;
  /** How far the press landed from the handle's center, so grabbing it never makes it jump. */
  offsetX: number;
  offsetY: number;
};

const unit = (value: number) => Math.min(Math.max(value, 0), 1);

/** Press a handle and drag to move it. Escape cancels. Presses elsewhere on the surface do nothing. */
export function useEasingCurveDrag(options: Options) {
  const [activeHandle, setActiveHandle] = useState<EasingCurveHandle | null>(null);
  const [pointerFocus, setPointerFocus] = useState(false);
  const drag = useRef<Drag | null>(null);
  const latest = useRef(options);
  useIsomorphicLayoutEffect(() => {
    latest.current = options;
  });

  const ratioAt = useCallback((clientX: number, clientY: number) => {
    const box = latest.current.trackRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 0, y: 0 };
    return { x: unit((clientX - box.left) / box.width), y: unit((clientY - box.top) / box.height) };
  }, []);

  const update = useCallback(
    (active: Drag, clientX: number, clientY: number) => {
      const { range, step, setLive, onValueChange } = latest.current;
      const ratio = ratioAt(clientX, clientY);
      const next = moveHandle(active.start, active.handle, { x: ratioToX(unit(ratio.x - active.offsetX)), y: ratioToY(unit(ratio.y - active.offsetY), range) }, range, step);
      if (sameCurve(next, active.last)) return;
      active.last = next;
      setLive(next);
      onValueChange?.(next, { handle: active.handle, source: "pointer" });
    },
    [ratioAt],
  );

  const finish = useCallback((cancel: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    const { setLive, onValueChange, onValueCommit } = latest.current;
    const detail: EasingCurveDetail = { handle: active.handle, source: "pointer" };
    const changed = !sameCurve(active.start, active.last);
    if (changed && cancel) onValueChange?.(active.start, detail);
    if (changed && !cancel) onValueCommit(active.last, detail);
    setLive(null);
    setActiveHandle(null);
    if (active.element.hasPointerCapture?.(active.id)) active.element.releasePointerCapture(active.id);
  }, []);

  useEffect(() => {
    if (activeHandle === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      finish(true);
    };
    const onBlur = () => finish(true);
    const onPointerEnd = (event: globalThis.PointerEvent) => {
      if (drag.current?.id === event.pointerId) finish(event.type === "pointercancel");
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [activeHandle, finish]);

  useEffect(() => () => finish(true), [finish]);

  const surfaceHandlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || event.button !== 0 || !options.enabled || drag.current) return;
      const target = event.target as Node;
      if (!options.handleRefs.current.some((element) => element?.contains(target))) return;
      event.preventDefault();
      const ratio = ratioAt(event.clientX, event.clientY);
      const offset = (handle: EasingCurveHandle) => {
        const point = handlePoint(options.value, handle);
        return { x: ratio.x - xToRatio(point.x), y: ratio.y - yToRatio(point.y, options.range) };
      };
      // Grab areas can overlap when handles sit close together, so the nearer handle wins.
      const distance = (handle: EasingCurveHandle) => Math.hypot(offset(handle).x, offset(handle).y);
      const handle: EasingCurveHandle = distance(1) < distance(0) ? 1 : 0;
      const grab = offset(handle);
      const active: Drag = { id: event.pointerId, handle, start: options.value, last: options.value, element: event.currentTarget, offsetX: grab.x, offsetY: grab.y };
      drag.current = active;
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        // The pointer may already have ended; the window listener still finishes the drag.
      }
      setPointerFocus(true);
      options.handleRefs.current[handle]?.focus({ preventScroll: true });
      setActiveHandle(handle);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const active = drag.current;
      if (active?.id === event.pointerId) update(active, event.clientX, event.clientY);
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      if (drag.current?.id === event.pointerId) finish(false);
    },
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => {
      if (drag.current?.id === event.pointerId) finish(true);
    },
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (drag.current?.id === event.pointerId) finish(true);
    },
  };

  return { activeHandle, pointerFocus, setPointerFocus, surfaceHandlers, isDragging: () => drag.current !== null };
}
