"use client";

import { type KeyboardEvent, type MouseEvent, type PointerEvent, forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { type ResizeHandleName, type ResizeOptions, type ResizeRect, cornerHandles, handleAxes, resizeRect, resolveHandles, sameRect } from "./resize-handles-math";
import { ResizeHandleTarget, handleCursor } from "./resize-handles-parts";
import { type Drag, type ResizeDetail, type ResizeHandlesProps, type ResizeTransform, ResizeHandlesContext, defaultMessages, toRectPoint, useIsomorphicLayoutEffect } from "./resize-handles-state";
import { cn } from "@/lib/utils";

const identity: ResizeTransform = { panX: 0, panY: 0, zoom: 1 };
/** Below this on-screen size, edge handles would crowd the corners. */
const compactSize = 40;
const arrowKeys: Record<string, readonly [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** An outline with resize handles around a rect. Your app owns the rect and receives live and committed sizes. */
export const ResizeHandles = forwardRef<HTMLDivElement, ResizeHandlesProps>(function ResizeHandles(
  {
    rect,
    onRectChange,
    onRectCommit,
    onResizingChange,
    transform = identity,
    handles = "all",
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    aspectRatio,
    step = 1,
    snap,
    disabled = false,
    renderHandle,
    handleClassName,
    messages: messageOverrides,
    className,
    style,
    children,
    onBlur,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    ...props
  },
  ref,
) {
  const messages = useMemo(() => ({ ...defaultMessages, ...messageOverrides }), [messageOverrides]);
  const instructionsId = useId();
  const [activeHandle, setActiveHandle] = useState<ResizeHandleName | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // Focus from a drag can still count as keyboard focus in the browser, so it is tracked separately.
  const [pointerFocus, setPointerFocus] = useState(false);
  const drag = useRef<Drag | null>(null);
  const options: ResizeOptions = { minWidth, minHeight, maxWidth, maxHeight, aspectRatio, step, snap };
  const latest = useRef({ options, transform, messages, onRectChange, onRectCommit, onResizingChange });
  useIsomorphicLayoutEffect(() => {
    latest.current = { options, transform, messages, onRectChange, onRectCommit, onResizingChange };
  });

  const announce = (next: ResizeRect) => setAnnouncement(latest.current.messages.size(Math.round(next.width), Math.round(next.height)));

  const update = useCallback((active: Drag) => {
    const { options: current, transform: view, onRectChange: change } = latest.current;
    const point = toRectPoint(active.client, active.root, view);
    const ratio = active.start.width > 0 && active.start.height > 0 ? active.start.width / active.start.height : undefined;
    const next = resizeRect(active.start, active.handle, { x: point.x - active.origin.x, y: point.y - active.origin.y }, { ...current, aspectRatio: current.aspectRatio ?? (active.shift ? ratio : undefined), fromCenter: active.alt });
    if (sameRect(next, active.last)) return;
    active.last = next;
    change(next, { handle: active.handle, source: "pointer" });
  }, []);

  const finish = useCallback((cancel: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    const detail: ResizeDetail = { handle: active.handle, source: "pointer" };
    const changed = !sameRect(active.last, active.start);
    if (changed && cancel) latest.current.onRectChange(active.start, detail);
    if (changed && !cancel) {
      latest.current.onRectCommit?.(active.last, detail);
      setAnnouncement(latest.current.messages.size(Math.round(active.last.width), Math.round(active.last.height)));
    }
    setActiveHandle(null);
    latest.current.onResizingChange?.(false);
    if (active.element.hasPointerCapture?.(active.id)) active.element.releasePointerCapture(active.id);
  }, []);

  useEffect(() => {
    if (!activeHandle) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      const active = drag.current;
      if (!active) return;
      if (event.key === "Escape" && event.type === "keydown") {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      } else if (event.key === "Shift" || event.key === "Alt") {
        // Pressing or releasing a modifier applies at once, without waiting for the pointer to move.
        active.shift = event.shiftKey;
        active.alt = event.altKey;
        update(active);
      }
    };
    const onBlur = () => finish(true);
    // A handle your app removes mid-drag can no longer report the release, so the window ends the drag.
    const onPointerEnd = (event: globalThis.PointerEvent) => {
      if (drag.current?.id === event.pointerId) finish(event.type === "pointercancel");
    };
    const cursor = document.body.style.cursor;
    document.body.style.cursor = handleCursor[activeHandle];
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      document.body.style.cursor = cursor;
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [activeHandle, finish, update]);

  useEffect(() => () => finish(true), [finish]);

  const enabled = disabled ? [] : resolveHandles(handles);
  const screen = { x: rect.x * transform.zoom + transform.panX, y: rect.y * transform.zoom + transform.panY, width: rect.width * transform.zoom, height: rect.height * transform.zoom };
  const corners = enabled.filter((handle) => cornerHandles.includes(handle));
  // The handle being dragged always stays, because removing it would end the pointer capture.
  const visible = Math.min(screen.width, screen.height) < compactSize && corners.length > 0 ? enabled.filter((handle) => corners.includes(handle) || handle === activeHandle) : enabled;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget || drag.current) return;
    const direction = arrowKeys[event.key];
    if (!direction) return;
    // An axis no handle can change stays fixed, and the key is left for the canvas.
    if (!enabled.some((handle) => handleAxes[handle].some((axis, index) => axis !== 0 && direction[index] !== 0))) return;
    event.preventDefault();
    event.stopPropagation();
    setPointerFocus(false);
    const amount = (step > 0 ? step : 1) * (event.shiftKey ? 10 : 1);
    const next = resizeRect(rect, "se", { x: direction[0] * amount, y: direction[1] * amount }, options);
    if (sameRect(next, rect)) return;
    const detail: ResizeDetail = { handle: "se", source: "keyboard" };
    onRectChange(next, detail);
    onRectCommit?.(next, detail);
    announce(next);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    const element = (event.target as Element).closest<HTMLElement>("[data-handle]");
    const handle = element?.dataset.handle as ResizeHandleName | undefined;
    if (event.defaultPrevented || event.button !== 0 || !element || !handle || drag.current) return;
    event.preventDefault();
    event.stopPropagation();
    const root = event.currentTarget;
    setPointerFocus(true);
    root.focus({ preventScroll: true });
    const client = { x: event.clientX, y: event.clientY };
    drag.current = { id: event.pointerId, handle, start: rect, last: rect, origin: toRectPoint(client, root, transform), client, shift: event.shiftKey, alt: event.altKey, element, root };
    try {
      element.setPointerCapture?.(event.pointerId);
    } catch {
      // The pointer may already have ended; the window listener still finishes the drag.
    }
    setActiveHandle(handle);
    onResizingChange?.(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    active.client = { x: event.clientX, y: event.clientY };
    active.shift = event.shiftKey;
    active.alt = event.altKey;
    update(active);
  };

  // The click that ends a drag must not reach the canvas, where it would clear the selection.
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if ((event.target as Element).closest("[data-handle]")) event.stopPropagation();
  };

  return (
    <ResizeHandlesContext.Provider value={{ rect, resizing: activeHandle !== null, messages }}>
      <div
        ref={ref}
        role="group"
        aria-label={messages.label}
        aria-describedby={enabled.length > 0 ? instructionsId : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={enabled.length > 0 ? 0 : undefined}
        data-slot="resize-handles"
        data-resizing={activeHandle ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-pointer-focus={pointerFocus ? "" : undefined}
        className={cn("group/resize pointer-events-none absolute outline-none", className)}
        style={{ ...style, left: screen.x, top: screen.y, width: screen.width, height: screen.height }}
        onBlur={(event) => {
          onBlur?.(event);
          setPointerFocus(false);
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
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
          if (drag.current?.id === event.pointerId) finish(true);
        }}
        {...props}
      >
        <span aria-hidden data-slot="resize-handles-outline" className="pointer-events-none absolute inset-0 border border-primary" />
        {visible.map((handle) => (
          <ResizeHandleTarget key={handle} name={handle} className={handleClassName} edgeMark={corners.length === 0}>
            {renderHandle?.(handle)}
          </ResizeHandleTarget>
        ))}
        {children}
        <span id={instructionsId} hidden>
          {messages.instructions}
        </span>
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </div>
    </ResizeHandlesContext.Provider>
  );
});
