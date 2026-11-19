"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { type EasingCurveHandle, type EasingCurveRange, curvePath, defaultRange, easingPath, handlePoint, xToRatio, yToRatio } from "./easing-curve-editor-math";
import { useEasingCurveEditor } from "./easing-curve-editor-state";
import { cn } from "@/lib/utils";

const surfaceClass = "relative aspect-square w-full rounded-md border border-input bg-muted/40";
const percent = (ratio: number) => `${ratio * 100}%`;

/** The editor's visible name. Place it above the surface. Pass children to replace the text. */
export const EasingCurveLabel = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function EasingCurveLabel({ className, children, ...props }, ref) {
  const { label } = useEasingCurveEditor();
  return (
    <span ref={ref} aria-hidden data-slot="easing-curve-label" className={cn("truncate text-sm leading-5 text-muted-foreground", className)} {...props}>
      {children ?? label}
    </span>
  );
});

type GridProps = ComponentPropsWithoutRef<"div"> & {
  /** How many equal cells run across each direction. */
  cells?: number;
};

/** Equal square cells. Lines sit only between cells, so none run along the edges. */
export const EasingCurveGrid = forwardRef<HTMLDivElement, GridProps>(function EasingCurveGrid({ cells = 6, className, ...props }, ref) {
  const stops = Array.from({ length: Math.max(cells - 1, 0) }, (_, index) => (index + 1) / cells);
  return (
    <div ref={ref} aria-hidden data-slot="easing-curve-grid" className={cn("pointer-events-none absolute inset-0 text-foreground/15", className)} {...props}>
      {stops.map((stop) => (
        <span key={`x${stop}`} data-slot="easing-curve-grid-line" className="absolute inset-y-0 w-px -translate-x-1/2 bg-current" style={{ left: percent(stop) }} />
      ))}
      {stops.map((stop) => (
        <span key={`y${stop}`} data-slot="easing-curve-grid-line" className="absolute inset-x-0 h-px -translate-y-1/2 bg-current" style={{ top: percent(stop) }} />
      ))}
    </div>
  );
});

const svgClass = "pointer-events-none absolute inset-0 size-full overflow-visible";
const stroke = { fill: "none", vectorEffect: "non-scaling-stroke" } as const;

/** The curve, with thin lines from its start and end to the handles. */
export const EasingCurveLine = forwardRef<SVGSVGElement, ComponentPropsWithoutRef<"svg">>(function EasingCurveLine({ className, ...props }, ref) {
  const { value, range, mixed } = useEasingCurveEditor();
  const position = (x: number, y: number) => ({ x: xToRatio(x) * 100, y: yToRatio(y, range) * 100 });
  const start = position(0, 0);
  const end = position(1, 1);
  const first = position(value[0], value[1]);
  const second = position(value[2], value[3]);
  return (
    <svg ref={ref} aria-hidden data-slot="easing-curve-line" viewBox="0 0 100 100" preserveAspectRatio="none" className={cn(svgClass, mixed && "opacity-40", className)} {...props}>
      <line {...stroke} data-slot="easing-curve-arm" x1={start.x} y1={start.y} x2={first.x} y2={first.y} className="stroke-muted-foreground/70" strokeWidth={1} />
      <line {...stroke} data-slot="easing-curve-arm" x1={end.x} y1={end.y} x2={second.x} y2={second.y} className="stroke-muted-foreground/70" strokeWidth={1} />
      <path {...stroke} data-slot="easing-curve-path" d={curvePath(value, range)} className="stroke-foreground" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
});

type HandleProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  handle: EasingCurveHandle;
};

/** One solid handle. It holds keyboard focus for its point and grows with a soft halo while dragged. */
export const EasingCurveHandlePoint = forwardRef<HTMLDivElement, HandleProps>(function EasingCurveHandlePoint({ handle, className, style, onKeyDown, onBlur, ...props }, ref) {
  const { value, range, disabled, readOnly, motion, activeHandle, pointerFocus, messages, handleRefs, onHandleKeyDown, onHandleBlur } = useEasingCurveEditor();
  const point = handlePoint(value, handle);
  return (
    <div
      ref={(element) => {
        handleRefs.current[handle] = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      role="slider"
      tabIndex={disabled ? undefined : 0}
      aria-label={messages.handle(handle + 1)}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={point.x}
      aria-valuetext={messages.point(point.x, point.y)}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      data-slot="easing-curve-handle"
      data-active={activeHandle === handle ? "" : undefined}
      data-pointer-focus={pointerFocus ? "" : undefined}
      className={cn(
        "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-sm outline-none",
        // The grab area is larger than the dot, and larger again for touch.
        disabled || readOnly ? "pointer-events-none" : "cursor-grab touch-none after:absolute after:-inset-1.5 after:rounded-full pointer-coarse:after:-inset-3.5",
        "data-active:scale-125 data-active:ring-4 data-active:ring-primary/25 [&:focus-visible:not([data-pointer-focus])]:ring-2 [&:focus-visible:not([data-pointer-focus])]:ring-primary/40",
        motion && "transition-[scale,box-shadow] duration-100 ease-out motion-reduce:transition-none",
        className,
      )}
      style={{ ...style, left: percent(xToRatio(point.x)), top: percent(yToRatio(point.y, range)) }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) onHandleKeyDown(event, handle);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        onHandleBlur();
      }}
      {...props}
    />
  );
});

/** The square that holds the curve. Drag its handles to edit. It highlights while dragging and on keyboard focus. */
export const EasingCurveSurface = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function EasingCurveSurface(
  { className, children, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, ...props },
  ref,
) {
  const { disabled, activeHandle, trackRef, surfaceHandlers } = useEasingCurveEditor();
  return (
    <div
      ref={ref}
      data-slot="easing-curve-surface"
      data-dragging={activeHandle !== null ? "" : undefined}
      className={cn(
        surfaceClass,
        "select-none data-dragging:cursor-grabbing data-dragging:border-primary data-dragging:bg-primary/5 has-[[data-slot=easing-curve-handle]:focus-visible:not([data-pointer-focus])]:border-primary",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        surfaceHandlers.onPointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        surfaceHandlers.onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        surfaceHandlers.onPointerUp(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        surfaceHandlers.onPointerCancel(event);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        surfaceHandlers.onLostPointerCapture(event);
      }}
      {...props}
    >
      <div ref={trackRef} data-slot="easing-curve-track" className="absolute inset-0">
        {children ?? (
          <>
            <EasingCurveGrid />
            <EasingCurveLine />
            <EasingCurveHandlePoint handle={0} />
            <EasingCurveHandlePoint handle={1} />
          </>
        )}
      </div>
    </div>
  );
});

type GraphProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Maps time from 0 to 1 to progress, such as a spring your app calculates. */
  easing: (time: number) => number;
  /** Accessible description of the curve. */
  label: string;
  /** The lowest and highest progress shown. Widen it for springs that overshoot further. */
  range?: EasingCurveRange;
  samples?: number;
};

/** A read-only graph of any easing function. It needs no editor around it. */
export const EasingCurveGraph = forwardRef<HTMLDivElement, GraphProps>(function EasingCurveGraph({ easing, label, range = defaultRange, samples, className, ...props }, ref) {
  return (
    <div ref={ref} role="img" aria-label={label} data-slot="easing-curve-graph" className={cn(surfaceClass, "w-60 max-w-full", className)} {...props}>
      <EasingCurveGrid />
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className={svgClass}>
        <path {...stroke} data-slot="easing-curve-path" d={easingPath(easing, range, samples)} className="stroke-foreground" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
});
