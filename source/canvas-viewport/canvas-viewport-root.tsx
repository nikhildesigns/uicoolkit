"use client";

import { type KeyboardEvent, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { type CanvasPoint, type CanvasTransform, clampZoom, defaultMaxZoom, defaultMinZoom, fitRects, zoomAt } from "./canvas-viewport-math";
import { useCanvasGestures } from "./canvas-viewport-gestures";
import { type CanvasViewportContextValue, type CanvasViewportProps, CanvasViewportContext, defaultMessages, noPanSelector } from "./canvas-viewport-state";
import { cn } from "@/lib/utils";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const initialTransform: CanvasTransform = { panX: 0, panY: 0, zoom: 1 };
const keyPan = 40;
const keyZoom = 1.25;

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * An infinite canvas. The wheel or trackpad pans; pinch or Cmd/Ctrl + wheel zooms around the pointer;
 * the hand tool, Space or the middle button drag it. Put content in CanvasWorld and screen-space UI in CanvasOverlay.
 */
export const CanvasViewport = forwardRef<HTMLDivElement, CanvasViewportProps>(function CanvasViewport(
  {
    transform: transformProp,
    defaultTransform = initialTransform,
    onTransformChange,
    panning = false,
    onPanningChange,
    minZoom = defaultMinZoom,
    maxZoom = defaultMaxZoom,
    disabled = false,
    messages: messagesProp,
    className,
    children,
    onKeyDown,
    onPointerDownCapture,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onPointerEnter,
    onPointerLeave,
    ...props
  },
  ref,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  const limits = { minZoom, maxZoom };
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);
  const [inner, setInner] = useState(defaultTransform);
  const transform = transformProp ?? inner;
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const hovered = useRef(false);
  // Several wheel or pointer events can arrive between renders, so each builds on the last.
  const latest = useRef({ transform, onTransformChange, controlled: transformProp !== undefined, limits });
  useIsomorphicLayoutEffect(() => {
    latest.current = { transform, onTransformChange, controlled: transformProp !== undefined, limits };
  });

  const apply = (next: CanvasTransform) => {
    const { transform: current, controlled, onTransformChange: change } = latest.current;
    if (next.panX === current.panX && next.panY === current.panY && next.zoom === current.zoom) return;
    latest.current.transform = next;
    if (!controlled) setInner(next);
    change?.(next);
  };
  const read = () => latest.current.transform;
  const centre = (): CanvasPoint => ({ x: (root.current?.clientWidth ?? 0) / 2, y: (root.current?.clientHeight ?? 0) / 2 });
  const announce = (zoom: number) => setAnnouncement(messages.zoom(Math.round(zoom * 100)));
  const zoomTo = (zoom: number, point = centre()) => {
    apply(zoomAt(read(), zoom, point, latest.current.limits));
    announce(clampZoom(zoom, latest.current.limits));
  };

  const canPanWithoutDrag = !disabled && (panning || spaceHeld);
  const gestures = useCanvasGestures({ rootRef: root, canPan: canPanWithoutDrag, disabled, read, apply, limits });
  const canPan = canPanWithoutDrag || gestures.dragging;
  const ownsPointer = !disabled && (panning || gestures.dragging);

  useEffect(() => {
    const element = root.current;
    if (!element || disabled) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
      const current = latest.current.transform;
      if (event.ctrlKey || event.metaKey) {
        const bounds = element.getBoundingClientRect();
        apply(zoomAt(current, current.zoom * Math.exp(-event.deltaY * scale * 0.01), { x: event.clientX - bounds.left, y: event.clientY - bounds.top }, latest.current.limits));
      } else {
        apply({ ...current, panX: current.panX - event.deltaX * scale, panY: current.panY - event.deltaY * scale });
      }
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
    // apply reads everything it needs from refs.
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;
    const down = (event: globalThis.KeyboardEvent) => {
      if (event.code !== "Space" || isTyping(event.target)) return;
      // Only the canvas under the pointer or holding focus responds, so several can share a page.
      if (!hovered.current && !root.current?.contains(document.activeElement)) return;
      setSpaceHeld(true);
      if (!(event.target instanceof Element && event.target.closest(noPanSelector))) event.preventDefault();
    };
    const up = (event: globalThis.KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);
    // Capture, so a focused control that stops the key cannot hide it.
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", blur);
      setSpaceHeld(false);
    };
  }, [disabled]);

  const reported = useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (reported.current === ownsPointer) return;
    reported.current = ownsPointer;
    onPanningChange?.(ownsPointer);
  }, [ownsPointer, onPanningChange]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || event.target !== event.currentTarget) return;
    const step = event.shiftKey ? keyPan * 4 : keyPan;
    const current = read();
    const pans: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const pan = pans[event.key];
    if (pan) apply({ ...current, panX: current.panX + pan[0], panY: current.panY + pan[1] });
    else if (event.key === "+" || event.key === "=") zoomTo(current.zoom * keyZoom);
    else if (event.key === "-") zoomTo(current.zoom / keyZoom);
    else if (event.key === "0") zoomTo(1);
    else return;
    event.preventDefault();
  };

  const context: CanvasViewportContextValue = {
    transform,
    setTransform: apply,
    zoomTo,
    zoomBy: (factor, point) => zoomTo(read().zoom * factor, point),
    fit: (rects, options) => {
      const size = { width: root.current?.clientWidth ?? 0, height: root.current?.clientHeight ?? 0 };
      const next = fitRects(rects, size, { ...latest.current.limits, ...options });
      apply(next);
      announce(next.zoom);
    },
    canPan,
    dragging: gestures.dragging,
    disabled,
    messages,
  };

  return (
    <CanvasViewportContext.Provider value={context}>
      <div
        ref={root}
        role="group"
        aria-label={messages.label}
        aria-roledescription={messages.roleDescription}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? undefined : 0}
        data-slot="canvas-viewport"
        data-panning={canPan || undefined}
        data-dragging={gestures.dragging || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "relative isolate touch-none overflow-hidden bg-muted outline-none select-none",
          canPan && (gestures.dragging ? "cursor-grabbing" : "cursor-grab"),
          className,
        )}
        {...props}
        onKeyDown={handleKeyDown}
        onPointerEnter={(event) => {
          hovered.current = true;
          onPointerEnter?.(event);
        }}
        onPointerLeave={(event) => {
          hovered.current = false;
          onPointerLeave?.(event);
        }}
        onPointerDownCapture={(event) => {
          onPointerDownCapture?.(event);
          gestures.onPointerDownCapture(event);
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          gestures.onPointerMove(event);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          gestures.onPointerEnd(event);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          gestures.onPointerEnd(event);
        }}
        onLostPointerCapture={(event) => {
          onLostPointerCapture?.(event);
          // Pinching can move implicit touch capture from a child to this viewport.
          if (event.target === event.currentTarget) gestures.onPointerEnd(event);
        }}
      >
        {children}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </CanvasViewportContext.Provider>
  );
});
