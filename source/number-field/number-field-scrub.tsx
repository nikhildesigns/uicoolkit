"use client";

import { type ComponentPropsWithoutRef, type PointerEvent, forwardRef, useEffect, useRef } from "react";
import { useNumberField } from "./number-field-state";
import { cn } from "@/lib/utils";

/** Pointer travel before a press becomes a drag, so a click or tap still works. */
const threshold = 3;

type Gesture = { pointerId: number; x: number; width: number; start: number | null; moved: boolean };

/**
 * Turns a horizontal drag on an element into live values and one commit on release.
 * `valueAt` maps the start value and pointer travel to the next value. A press without
 * movement calls `onTap`. Escape or a cancelled pointer restores the committed value.
 */
export function usePointerAdjust({ valueAt, onTap }: { valueAt: (start: number, dx: number, width: number, event: PointerEvent<HTMLElement>) => number; onTap?: () => void }) {
  const field = useNumberField();
  const gesture = useRef<Gesture | null>(null);
  const cancelDrag = field.cancelDrag;

  useEffect(() => {
    if (!field.dragging) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !gesture.current) return;
      event.preventDefault();
      event.stopPropagation();
      gesture.current = null;
      cancelDrag();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [field.dragging, cancelDrag]);

  const finish = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.moved) {
      if (cancelled) field.cancelDrag();
      else field.endDrag();
    } else if (!cancelled) onTap?.();
  };

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || field.disabled || field.readOnly || field.draft !== null) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const width = event.currentTarget.getBoundingClientRect().width;
      gesture.current = { pointerId: event.pointerId, x: event.clientX, width, start: field.adjustFrom, moved: false };
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const current = gesture.current;
      if (!current || current.pointerId !== event.pointerId || current.start === null) return;
      const dx = event.clientX - current.x;
      if (!current.moved) {
        if (Math.abs(dx) < threshold) return;
        current.moved = true;
        field.beginDrag();
      }
      field.dragTo(valueAt(current.start, dx, current.width, event));
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => finish(event, false),
    // Fired when the browser takes over, such as a vertical scroll on touch.
    onPointerCancel: (event: PointerEvent<HTMLElement>) => finish(event, true),
  };
}

/**
 * Drag left or right over this area to adjust the value, usually around the label.
 * Each `sensitivity` pixels is one step; hold Shift for large steps. A click focuses the input.
 */
export const NumberFieldScrubArea = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function NumberFieldScrubArea(
  { className, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...props },
  ref,
) {
  const field = useNumberField();
  const adjust = usePointerAdjust({
    valueAt: (start, dx, _width, event) => start + Math.round(dx / field.sensitivity) * (event.shiftKey ? field.largeStep : field.step),
    onTap: () => field.inputRef.current?.focus(),
  });
  const locked = field.disabled || field.readOnly || field.adjustFrom === null;
  return (
    <span
      ref={ref}
      data-slot="scrub"
      data-dragging={field.dragging || undefined}
      className={cn("inline-flex touch-pan-y items-center select-none", !locked && "cursor-ew-resize", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) adjust.onPointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        adjust.onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        adjust.onPointerUp(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        adjust.onPointerCancel(event);
      }}
      {...props}
    />
  );
});
