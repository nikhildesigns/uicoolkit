"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { type CanvasRect, toScreenRect } from "./canvas-viewport-math";
import { useCanvasViewport } from "./canvas-viewport-state";
import { cn } from "@/lib/utils";

/** Holds content positioned in canvas units. It moves and scales with the canvas. */
export const CanvasWorld = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function CanvasWorld({ className, style, ...props }, ref) {
  const { transform, canPan } = useCanvasViewport();
  return (
    <div
      ref={ref}
      data-slot="canvas-world"
      data-canvas-content=""
      className={cn("absolute top-0 left-0 origin-top-left", canPan && "pointer-events-none", className)}
      style={{ ...style, transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.zoom})` }}
      {...props}
    />
  );
});

/** Screen-space content above the canvas. It ignores the pointer; give controls inside `pointer-events-auto`. */
export const CanvasOverlay = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function CanvasOverlay({ className, ...props }, ref) {
  return <div ref={ref} data-slot="canvas-overlay" className={cn("pointer-events-none absolute inset-0", className)} {...props} />;
});

type SelectionProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /** The selected area, in canvas units. */
  rect: CanvasRect;
  /** Shown above the outline, such as the selection's name. */
  title?: ReactNode;
  /** Shown below the outline, such as its size. */
  label?: ReactNode;
  /** Shows the corner marks. They are decorative; resizing belongs to your app. */
  corners?: boolean;
};

// Centres the 6px marks on the outline's corners.
const cornerPositions = ["-top-[3px] -left-[3px]", "-top-[3px] -right-[3px]", "-bottom-[3px] -left-[3px]", "-bottom-[3px] -right-[3px]"];

/** A selection outline in screen space, so its line and corners keep their size at any zoom. Place it in CanvasOverlay. */
export const CanvasSelection = forwardRef<HTMLDivElement, SelectionProps>(function CanvasSelection({ rect, title, label, corners = true, className, style, ...props }, ref) {
  const { transform } = useCanvasViewport();
  const screen = toScreenRect(rect, transform);
  return (
    <div ref={ref} data-slot="canvas-selection" className={cn("absolute border border-primary", className)} style={{ ...style, left: screen.x, top: screen.y, width: screen.width, height: screen.height }} {...props}>
      {title != null && <span className="absolute -top-5 left-0 max-w-full truncate text-[11px] leading-4 text-primary">{title}</span>}
      {corners && cornerPositions.map((position) => <span key={position} aria-hidden className={cn("absolute size-1.5 border border-primary bg-[var(--canvas-selection-fill,#fff)]", position)} />)}
      {label != null && (
        <span className="absolute top-full left-1/2 mt-1.5 -translate-x-1/2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] leading-3 font-medium whitespace-nowrap text-primary-foreground tabular-nums">{label}</span>
      )}
    </div>
  );
});

type EmptyProps = ComponentPropsWithoutRef<"div"> & {
  /** Replace the icon above the text. */
  icon?: ReactNode;
};

/** Centred in the canvas when your app has nothing to show: an icon with short text below it. */
export const CanvasViewportEmpty = forwardRef<HTMLDivElement, EmptyProps>(function CanvasViewportEmpty({ icon, className, children, ...props }, ref) {
  const { messages } = useCanvasViewport();
  return (
    <div ref={ref} role="status" className={cn("pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 text-center text-sm text-muted-foreground", className)} {...props}>
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-muted [&_svg]:size-5">
        {icon ?? (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M13 3h2.5A1.5 1.5 0 0 1 17 4.5V7M17 13v2.5a1.5 1.5 0 0 1-1.5 1.5H13M7 17H4.5A1.5 1.5 0 0 1 3 15.5V13" />
          </svg>
        )}
      </span>
      <p className="max-w-52 text-balance">{children ?? messages.empty}</p>
    </div>
  );
});
