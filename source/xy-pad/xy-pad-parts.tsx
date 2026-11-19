"use client";

import { type ComponentPropsWithoutRef, forwardRef, useImperativeHandle } from "react";
import { type XYPadAxis, axisOrigin, axisRatio, valueToRatio } from "./xy-pad-math";
import { useXYPad } from "./xy-pad-state";
import { cn } from "@/lib/utils";

/** The area you press and drag. It highlights while dragging and on keyboard focus. Its children sit on the point's travel area. */
export const XYPadSurface = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function XYPadSurface(
  { className, children, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, ...props },
  ref,
) {
  const { disabled, readOnly, dragging, trackRef, surfaceHandlers } = useXYPad();
  return (
    <div
      ref={ref}
      data-slot="xy-pad-surface"
      data-dragging={dragging ? "" : undefined}
      className={cn(
        "relative aspect-square w-full touch-none overflow-hidden rounded-md border border-input bg-muted/40 select-none",
        "data-dragging:border-primary data-dragging:bg-primary/5 has-[:focus-visible:not([data-pointer-focus])]:border-primary",
        disabled ? "cursor-not-allowed opacity-50" : !readOnly && "cursor-crosshair hover:border-muted-foreground/50",
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
      {/* Inset, so the point stays fully inside the surface at its limits. */}
      <div ref={trackRef} data-slot="xy-pad-track" className="absolute inset-2.5">
        {children ?? (
          <>
            <XYPadGrid />
            <XYPadOrigin />
            <XYPadThumb />
          </>
        )}
      </div>
    </div>
  );
});

type GridProps = ComponentPropsWithoutRef<"div"> & {
  /** How many equal cells run across each direction. */
  cells?: number;
};

/** Equal square cells across the whole surface. Lines sit only between cells, so none run along the edges. */
export const XYPadGrid = forwardRef<HTMLDivElement, GridProps>(function XYPadGrid({ cells = 6, className, ...props }, ref) {
  const stops = Array.from({ length: Math.max(cells - 1, 0) }, (_, index) => ((index + 1) / cells) * 100);
  return (
    <div ref={ref} aria-hidden data-slot="xy-pad-grid" className={cn("pointer-events-none absolute -inset-2.5 text-foreground/15", className)} {...props}>
      {stops.map((stop) => (
        <span key={`x${stop}`} data-slot="xy-pad-grid-line" className="absolute inset-y-0 w-px -translate-x-1/2 bg-current" style={{ left: `${stop}%` }} />
      ))}
      {stops.map((stop) => (
        <span key={`y${stop}`} data-slot="xy-pad-grid-line" className="absolute inset-x-0 h-px -translate-y-1/2 bg-current" style={{ top: `${stop}%` }} />
      ))}
    </div>
  );
});

/** The pad's visible name. Place it above the surface. Pass children to replace the text. */
export const XYPadLabel = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function XYPadLabel({ className, children, ...props }, ref) {
  const { label } = useXYPad();
  return (
    <span ref={ref} aria-hidden data-slot="xy-pad-label" className={cn("truncate text-sm leading-5 text-muted-foreground", className)} {...props}>
      {children ?? label}
    </span>
  );
});

const originRatio = (axis: XYPadAxis) => axisRatio(axisOrigin(axis), axis);

/** A small dot at zero, or at the middle of a range where zero is not inside it. */
export const XYPadOrigin = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function XYPadOrigin({ className, style, ...props }, ref) {
  const { xAxis, yAxis, yDirection } = useXYPad();
  const y = originRatio(yAxis);
  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="xy-pad-origin"
      className={cn("pointer-events-none absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground", className)}
      style={{ ...style, left: `${originRatio(xAxis) * 100}%`, top: `${(yDirection === "up" ? 1 - y : y) * 100}%` }}
      {...props}
    />
  );
});

const describe = (axis: XYPadAxis, value: number | null, mixed: string) => `${axis.label} ${value === null ? mixed : `${value}${axis.unit ? ` ${axis.unit}` : ""}`}`;

/** The solid point. It holds keyboard focus for the pad, and grows with a soft halo while dragging. */
export const XYPadThumb = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function XYPadThumb({ className, style, onKeyDown, onBlur, ...props }, ref) {
  const { value, xAxis, yAxis, yDirection, label, disabled, readOnly, dragging, pointerFocus, motion, messages, thumbRef, onThumbKeyDown, onThumbBlur } = useXYPad();
  useImperativeHandle(ref, () => thumbRef.current as HTMLDivElement);
  const ratio = valueToRatio(value, xAxis, yAxis, yDirection);
  const mixed = value.x === null || value.y === null;
  return (
    <div
      ref={thumbRef}
      role="slider"
      tabIndex={disabled ? undefined : 0}
      aria-label={label}
      aria-valuemin={xAxis.min}
      aria-valuemax={xAxis.max}
      aria-valuenow={value.x ?? undefined}
      aria-valuetext={messages.value(describe(xAxis, value.x, messages.mixed), describe(yAxis, value.y, messages.mixed))}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      data-slot="xy-pad-thumb"
      data-dragging={dragging ? "" : undefined}
      data-mixed={mixed ? "" : undefined}
      data-pointer-focus={pointerFocus ? "" : undefined}
      className={cn(
        "pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-sm outline-none data-mixed:bg-muted-foreground",
        "data-dragging:scale-125 data-dragging:ring-4 data-dragging:ring-primary/25 data-mixed:data-dragging:ring-muted-foreground/25",
        motion && "transition-[scale,box-shadow] duration-100 ease-out motion-reduce:transition-none",
        className,
      )}
      style={{ ...style, left: `${ratio.x * 100}%`, top: `${ratio.y * 100}%` }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) onThumbKeyDown(event);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        onThumbBlur();
      }}
      {...props}
    />
  );
});
