"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { type ResizeHandleName, cornerHandles } from "./resize-handles-math";
import { useResizeHandles } from "./resize-handles-state";
import { cn } from "@/lib/utils";

const placement: Record<ResizeHandleName, string> = {
  nw: "top-0 left-0 cursor-nwse-resize",
  ne: "top-0 left-full cursor-nesw-resize",
  se: "top-full left-full cursor-nwse-resize",
  sw: "top-full left-0 cursor-nesw-resize",
  n: "top-0 inset-x-2 h-2 -translate-y-1/2 cursor-ns-resize pointer-coarse:inset-x-3.5 pointer-coarse:h-4",
  s: "top-full inset-x-2 h-2 -translate-y-1/2 cursor-ns-resize pointer-coarse:inset-x-3.5 pointer-coarse:h-4",
  e: "left-full inset-y-2 w-2 -translate-x-1/2 cursor-ew-resize pointer-coarse:inset-y-3.5 pointer-coarse:w-4",
  w: "left-0 inset-y-2 w-2 -translate-x-1/2 cursor-ew-resize pointer-coarse:inset-y-3.5 pointer-coarse:w-4",
};

export const handleCursor: Record<ResizeHandleName, string> = { nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize" };

type HandleProps = {
  name: ResizeHandleName;
  className?: string;
  /** Shows a mark on an edge handle, for selections without corners. */
  edgeMark?: boolean;
  children?: ReactNode;
};

// Solid while idle so the outline never shows through a mark. Marks sit on canvas content rather than app
// chrome, so they default to white as in design tools; set --resize-handle-fill to change it. Accent while acting.
const markFill = "border border-primary bg-[var(--resize-handle-fill,#fff)] group-[:focus-visible:not([data-pointer-focus])]/resize:bg-primary group-data-resizing/resize:bg-primary";

/** One pointer target. Keyboard users resize through the root, so handles stay out of the tab order. Marks fill on keyboard focus and while resizing. */
export function ResizeHandleTarget({ name, className, edgeMark = false, children }: HandleProps) {
  const corner = cornerHandles.includes(name);
  const horizontal = name === "n" || name === "s";
  return (
    <div
      aria-hidden
      data-slot="resize-handle"
      data-handle={name}
      data-canvas-no-pan=""
      className={cn(
        "pointer-events-auto absolute z-10 touch-none select-none",
        corner && "grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center pointer-coarse:size-7",
        placement[name],
        className,
      )}
    >
      {children ??
        (corner ? (
          <span data-slot="resize-handle-mark" className={cn("size-1.5 pointer-coarse:size-2.5", markFill)} />
        ) : edgeMark ? (
          <span
            data-slot="resize-handle-mark"
            className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", markFill, horizontal ? "h-1.5 w-4 pointer-coarse:h-2.5 pointer-coarse:w-6" : "h-4 w-1.5 pointer-coarse:h-6 pointer-coarse:w-2.5")}
          />
        ) : null)}
    </div>
  );
}

type LabelProps = ComponentPropsWithoutRef<"span">;

/** The live size, below the outline. Pass children to replace the text. */
export const ResizeHandlesLabel = forwardRef<HTMLSpanElement, LabelProps>(function ResizeHandlesLabel({ className, children, ...props }, ref) {
  const { rect, messages } = useResizeHandles();
  return (
    <span
      ref={ref}
      data-slot="resize-handles-label"
      className={cn("absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] leading-3 font-medium whitespace-nowrap text-primary-foreground tabular-nums", className)}
      {...props}
    >
      {children ?? messages.size(Math.round(rect.width), Math.round(rect.height))}
    </span>
  );
});
