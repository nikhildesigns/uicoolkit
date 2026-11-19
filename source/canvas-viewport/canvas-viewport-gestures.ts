"use client";

import { type PointerEvent as ReactPointerEvent, type RefObject, useRef, useState } from "react";
import { type CanvasPoint, type CanvasTransform, zoomAt } from "./canvas-viewport-math";
import { noPanSelector } from "./canvas-viewport-state";

type Options = {
  rootRef: RefObject<HTMLDivElement | null>;
  canPan: boolean;
  disabled: boolean;
  read: () => CanvasTransform;
  apply: (transform: CanvasTransform) => void;
  limits: { minZoom: number; maxZoom: number };
};

const capture = (element: Element, id: number) => {
  try {
    element.setPointerCapture?.(id);
  } catch {
    // The pointer may already have ended.
  }
};

const distance = (a: CanvasPoint, b: CanvasPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** Drag to pan with a mouse, pen or finger, and pinch with two fingers. */
export function useCanvasGestures({ rootRef, canPan, disabled, read, apply, limits }: Options) {
  const pointers = useRef(new Map<number, CanvasPoint>());
  const gesture = useRef<"pan" | "pinch" | null>(null);
  const [dragging, setDragging] = useState(false);

  const begin = (kind: "pan" | "pinch", element: Element) => {
    gesture.current = kind;
    for (const id of pointers.current.keys()) capture(element, id);
    setDragging(true);
  };

  const onPointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    // A portalled popup keeps its React ancestry but owns its pointer actions.
    if (disabled || !event.currentTarget.contains(target)) return;
    const control = !!target.closest(noPanSelector);
    const point = { x: event.clientX, y: event.clientY };
    if (event.pointerType === "touch") {
      if (control && pointers.current.size === 0) return;
      pointers.current.set(event.pointerId, point);
      if (pointers.current.size === 2) begin("pinch", event.currentTarget);
      else if (pointers.current.size === 1 && canPan) begin("pan", event.currentTarget);
      return;
    }
    if (control || !(event.button === 1 || (event.button === 0 && canPan))) return;
    event.preventDefault();
    pointers.current.set(event.pointerId, point);
    begin("pan", event.currentTarget);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    const other = [...pointers.current].find(([id]) => id !== event.pointerId)?.[1];
    pointers.current.set(event.pointerId, next);
    const current = read();
    if (gesture.current === "pan") {
      apply({ ...current, panX: current.panX + next.x - previous.x, panY: current.panY + next.y - previous.y });
    } else if (gesture.current === "pinch" && other) {
      const bounds = rootRef.current?.getBoundingClientRect();
      const before = distance(previous, other);
      if (!bounds || before === 0) return;
      // The fingers' midpoint stays put while zooming, and moving it pans.
      const middle = { x: (next.x + other.x) / 2 - bounds.left, y: (next.y + other.y) / 2 - bounds.top };
      const zoomed = zoomAt(current, current.zoom * (distance(next, other) / before), middle, limits);
      apply({ ...zoomed, panX: zoomed.panX + (next.x - previous.x) / 2, panY: zoomed.panY + (next.y - previous.y) / 2 });
    }
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    // Lifting one finger ends the gesture; the other does nothing until it lifts too.
    gesture.current = null;
    setDragging(false);
  };

  return { dragging, onPointerDownCapture, onPointerMove, onPointerEnd };
}
