"use client";

import { type KeyboardEvent, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { useVersionComparison } from "./version-comparison-state";

const clampRatio = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 1000) / 1000;

/** The Swipe mode divider. Drag it or use the arrow keys. Escape cancels a drag. */
export function VersionComparisonDivider({ stageRef }: { stageRef: { current: HTMLDivElement | null } }) {
  const { divider, disabled, messages, setDivider, onDividerChange, onDividerCommit } = useVersionComparison();
  const stop = useRef<(() => void) | null>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => () => stop.current?.(), []);

  const show = (next: number) => {
    setDivider(next);
    onDividerChange?.(next);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0 || stop.current) return;
    event.currentTarget.dataset.pointerFocus = "";
    const pointerId = event.pointerId;
    const start = divider;
    let last = divider;
    const at = (clientX: number) => {
      const rect = stageRef.current?.getBoundingClientRect();
      return rect?.width ? clampRatio((clientX - rect.left) / rect.width) : last;
    };
    const listening = new AbortController();
    const { signal } = listening;
    const end = () => {
      listening.abort();
      stop.current = null;
      setDragging(false);
    };
    const cancel = () => {
      show(start);
      end();
    };
    window.addEventListener("pointermove", (next) => {
      if (next.pointerId !== pointerId) return;
      last = at(next.clientX);
      show(last);
    }, { signal });
    window.addEventListener("pointerup", (next) => {
      if (next.pointerId !== pointerId) return;
      if (last !== start) onDividerCommit?.(last);
      end();
    }, { signal });
    window.addEventListener("pointercancel", (next) => {
      if (next.pointerId === pointerId) cancel();
    }, { signal });
    window.addEventListener("blur", cancel, { signal });
    window.addEventListener("keydown", (next) => {
      if (next.key !== "Escape") return;
      next.preventDefault();
      next.stopPropagation();
      cancel();
    }, { signal, capture: true });
    stop.current = () => listening.abort();
    setDragging(true);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 0.1 : 0.01;
    const targets: Record<string, number> = { ArrowLeft: divider - amount, ArrowDown: divider - amount, ArrowRight: divider + amount, ArrowUp: divider + amount, Home: 0, End: 1 };
    const target = targets[event.key];
    if (disabled || target === undefined) return;
    event.preventDefault();
    const next = clampRatio(target);
    if (next === divider) return;
    show(next);
    onDividerCommit?.(next);
  };

  return (
    <>
      <span aria-hidden data-slot="version-comparison-divider-line" className="pointer-events-none absolute inset-y-0 z-[2] w-0.5 -translate-x-1/2 bg-primary" style={{ left: `${divider * 100}%` }} />
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={messages.divider}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(divider * 100)}
        aria-valuetext={`${Math.round(divider * 100)}%`}
        aria-disabled={disabled || undefined}
        data-slot="version-comparison-divider"
        data-dragging={dragging ? "" : undefined}
        className="group/divider absolute inset-y-0 z-[2] grid w-11 -translate-x-1/2 cursor-ew-resize touch-none place-items-center outline-none aria-disabled:cursor-default"
        // At either edge the handle bleeds off the stage with the line, so only half shows.
        style={{ left: `${divider * 100}%` }}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          delete event.currentTarget.dataset.pointerFocus;
        }}
      >
        <span aria-hidden className="relative grid size-7 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-data-dragging/divider:scale-110 group-focus-visible/divider:not-group-data-pointer-focus/divider:ring-2 group-focus-visible/divider:not-group-data-pointer-focus/divider:ring-ring motion-reduce:transition-none">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4.5 2.5 8 6 11.5M10 4.5 13.5 8 10 11.5" />
          </svg>
        </span>
      </div>
    </>
  );
}
