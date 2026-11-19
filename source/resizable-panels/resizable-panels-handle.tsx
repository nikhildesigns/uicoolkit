"use client";

import { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, forwardRef, useCallback, useEffect, useRef } from "react";
import { useResizablePanel } from "./resizable-panels-root";
import { clampSize, useIsomorphicLayoutEffect, useResizablePanels } from "./resizable-panels-state";
import { cn } from "@/lib/utils";

type HandleProps = ComponentPropsWithoutRef<"div"> & {
  /** The panel edge the handle sits on: its end (right or bottom) or its start (left or top). */
  side?: "start" | "end";
  /** Pixels moved by an arrow key. */
  step?: number;
  /** Pixels moved by an arrow key with Shift held. */
  largeStep?: number;
};

type Drag = { id: number; start: number; size: number; last: number; element: HTMLDivElement };

/** The draggable edge of a panel. Arrow keys resize it, Home and End go to its limits, and Escape cancels a drag. */
export const ResizableHandle = forwardRef<HTMLDivElement, HandleProps>(function ResizableHandle(
  { side = "end", step = 10, largeStep = 50, className, children, onKeyDown, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, ...props },
  ref,
) {
  const group = useResizablePanels();
  const panel = useResizablePanel();
  const horizontal = group.direction === "horizontal";
  const fixed = panel.max <= panel.min;
  const disabled = group.disabled || panel.collapsed;
  const drag = useRef<Drag | null>(null);
  const latest = useRef(panel);
  useIsomorphicLayoutEffect(() => {
    latest.current = panel;
  });

  /** Whether moving right or down grows the panel. Right-to-left rows mirror the start and end edges. */
  const direction = (element: Element) => (side === "end" ? 1 : -1) * (horizontal && getComputedStyle(element).direction === "rtl" ? -1 : 1);
  const point = (event: PointerEvent) => (horizontal ? event.clientX : event.clientY);

  const finish = useCallback((cancel: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    if (cancel) latest.current.setSize(active.size);
    else if (active.last !== active.size) latest.current.commit(active.last);
    latest.current.setResizing(false);
    if (active.element.hasPointerCapture?.(active.id)) active.element.releasePointerCapture(active.id);
  }, []);

  useEffect(() => {
    if (!panel.resizing) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      finish(true);
    };
    const onBlur = () => finish(true);
    const cursor = document.body.style.cursor;
    document.body.style.cursor = horizontal ? "col-resize" : "row-resize";
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", onBlur);
    return () => {
      document.body.style.cursor = cursor;
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [panel.resizing, horizontal, finish]);

  useEffect(() => () => finish(true), [finish]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;
    const amount = event.shiftKey ? largeStep : step;
    const keys: Record<string, number> = horizontal ? { ArrowLeft: -amount, ArrowRight: amount } : { ArrowUp: -amount, ArrowDown: amount };
    let next: number;
    if (event.key === "Home") next = panel.min;
    else if (event.key === "End") {
      if (!Number.isFinite(panel.max)) return;
      next = panel.max;
    } else if (keys[event.key] !== undefined) next = clampSize(panel.size + keys[event.key] * direction(event.currentTarget), panel.min, panel.max);
    else return;
    event.preventDefault();
    if (next === panel.size) return;
    panel.setSize(next);
    panel.commit(next);
  };

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={disabled ? undefined : 0}
      aria-label="Resize panel"
      aria-controls={panel.panelId}
      // The line runs across the direction panels are laid out in.
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-valuenow={panel.size}
      aria-valuemin={panel.min}
      aria-valuemax={Number.isFinite(panel.max) ? panel.max : undefined}
      aria-disabled={disabled || undefined}
      data-slot="resizable-handle"
      data-side={side}
      data-resizing={panel.resizing || undefined}
      hidden={panel.collapsed}
      className={cn(
        "group/handle absolute z-20 touch-none outline-none select-none",
        horizontal ? "inset-y-0 w-2 pointer-coarse:w-8" : "inset-x-0 h-2 pointer-coarse:h-8",
        !disabled && !fixed && (horizontal ? "cursor-col-resize" : "cursor-row-resize"),
        horizontal && (side === "end" ? "end-0 translate-x-1/2 rtl:-translate-x-1/2" : "start-0 -translate-x-1/2 rtl:translate-x-1/2"),
        !horizontal && (side === "end" ? "bottom-0 translate-y-1/2" : "top-0 -translate-y-1/2"),
        className,
      )}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || event.button !== 0 || disabled || fixed || drag.current) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.pointerType !== "touch") event.currentTarget.focus({ preventScroll: true });
        drag.current = { id: event.pointerId, start: point(event), size: panel.size, last: panel.size, element: event.currentTarget };
        // Touch already has implicit capture on the pressed handle.
        if (event.pointerType !== "touch") event.currentTarget.setPointerCapture?.(event.pointerId);
        panel.setResizing(true);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const active = drag.current;
        if (!active || active.id !== event.pointerId) return;
        const next = clampSize(active.size + (point(event) - active.start) * direction(event.currentTarget), panel.min, panel.max);
        if (next === active.last) return;
        active.last = next;
        panel.setSize(next);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (drag.current?.id === event.pointerId) finish(false);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (drag.current?.id === event.pointerId) finish(true);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        finish(true);
      }}
      {...props}
    >
      {children ?? (
        <span
          aria-hidden
          data-slot="resizable-line"
          className={cn(
            "pointer-events-none absolute bg-border transition-colors group-hover/handle:bg-ring group-focus-visible/handle:bg-foreground group-data-resizing/handle:bg-foreground group-aria-disabled/handle:bg-border motion-reduce:transition-none",
            horizontal ? "inset-y-0 left-1/2 w-px -translate-x-1/2" : "inset-x-0 top-1/2 h-px -translate-y-1/2",
          )}
        />
      )}
    </div>
  );
});
