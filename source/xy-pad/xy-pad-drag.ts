"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { type XYPadAxis, type XYPadDirection, type XYPadRatio, type XYPadValue, changedAxes, ratioToValue, sameValue } from "./xy-pad-math";
import { type XYPadDetail, useIsomorphicLayoutEffect } from "./xy-pad-state";

type Options = {
  value: XYPadValue;
  xAxis: XYPadAxis;
  yAxis: XYPadAxis;
  yDirection: XYPadDirection;
  enabled: boolean;
  trackRef: { current: HTMLDivElement | null };
  thumbRef: { current: HTMLDivElement | null };
  setLive: (value: XYPadValue | null) => void;
  onValueChange?: (value: XYPadValue, detail: XYPadDetail) => void;
  onValueCommit: (value: XYPadValue, detail: XYPadDetail) => void;
};

type Drag = {
  id: number;
  start: XYPadValue;
  last: XYPadValue;
  origin: XYPadRatio;
  client: { x: number; y: number };
  shift: boolean;
  element: HTMLElement;
};

const unit = (value: number) => Math.min(Math.max(value, 0), 1);

/** Press to move the point, drag to keep moving it, Shift to stay on one axis and Escape to cancel. */
export function useXYPadDrag(options: Options) {
  const [dragging, setDragging] = useState(false);
  const [pointerFocus, setPointerFocus] = useState(false);
  const drag = useRef<Drag | null>(null);
  const latest = useRef(options);
  useIsomorphicLayoutEffect(() => {
    latest.current = options;
  });

  const ratioAt = useCallback((client: Drag["client"]): XYPadRatio => {
    const box = latest.current.trackRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 0, y: 0 };
    return { x: unit((client.x - box.left) / box.width), y: unit((client.y - box.top) / box.height) };
  }, []);

  const update = useCallback(
    (active: Drag) => {
      const { xAxis, yAxis, yDirection, setLive, onValueChange, trackRef } = latest.current;
      const ratio = ratioAt(active.client);
      if (active.shift) {
        const box = trackRef.current?.getBoundingClientRect();
        const across = Math.abs(ratio.x - active.origin.x) * (box?.width ?? 1);
        const along = Math.abs(ratio.y - active.origin.y) * (box?.height ?? 1);
        if (across >= along) ratio.y = active.origin.y;
        else ratio.x = active.origin.x;
      }
      const next = ratioToValue(ratio, xAxis, yAxis, yDirection);
      if (sameValue(next, active.last)) return;
      active.last = next;
      setLive(next);
      onValueChange?.(next, { axes: changedAxes(active.start, next), source: "pointer" });
    },
    [ratioAt],
  );

  const finish = useCallback((cancel: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    const { setLive, onValueChange, onValueCommit } = latest.current;
    const axes = changedAxes(active.start, active.last);
    if (axes.length > 0 && cancel) onValueChange?.(active.start, { axes, source: "pointer" });
    if (axes.length > 0 && !cancel) onValueCommit(active.last, { axes, source: "pointer" });
    setLive(null);
    setDragging(false);
    if (active.element.hasPointerCapture?.(active.id)) active.element.releasePointerCapture(active.id);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onKey = (event: KeyboardEvent) => {
      const active = drag.current;
      if (!active) return;
      if (event.key === "Escape" && event.type === "keydown") {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      } else if (event.key === "Shift") {
        active.shift = event.shiftKey;
        update(active);
      }
    };
    const onBlur = () => finish(true);
    const onPointerEnd = (event: globalThis.PointerEvent) => {
      if (drag.current?.id === event.pointerId) finish(event.type === "pointercancel");
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [dragging, finish, update]);

  useEffect(() => () => finish(true), [finish]);

  const surfaceHandlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || event.button !== 0 || !options.enabled || drag.current) return;
      event.preventDefault();
      const client = { x: event.clientX, y: event.clientY };
      const active: Drag = { id: event.pointerId, start: options.value, last: options.value, origin: ratioAt(client), client, shift: event.shiftKey, element: event.currentTarget };
      drag.current = active;
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        // The pointer may already have ended; the window listener still finishes the drag.
      }
      setPointerFocus(true);
      options.thumbRef.current?.focus({ preventScroll: true });
      setDragging(true);
      update(active);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const active = drag.current;
      if (!active || active.id !== event.pointerId) return;
      active.client = { x: event.clientX, y: event.clientY };
      active.shift = event.shiftKey;
      update(active);
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

  return { dragging, pointerFocus, setPointerFocus, surfaceHandlers, isDragging: () => drag.current !== null };
}
