"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { useScreenFrame } from "./screen-frame-state";
import { cn } from "@/lib/utils";

export type ScreenFramePreviewState = "ready" | "loading" | "error";

type PreviewProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  /** The screen's thumbnail, such as an image the host renders. */
  children?: ReactNode;
  /** Shows a placeholder while the thumbnail loads, or a message when it cannot. */
  state?: ScreenFramePreviewState;
  /** Width divided by height. Defaults to a phone screen. */
  aspectRatio?: number;
};

/**
 * The screen's preview, which is also the selection target: click, Enter or Space selects
 * (holding Cmd/Ctrl or Shift is reported to the host), and F2 starts renaming.
 */
export const ScreenFramePreview = forwardRef<HTMLButtonElement, PreviewProps>(function ScreenFramePreview(
  { children, state = "ready", aspectRatio = 9 / 19.5, className, style, onClick, onKeyDown, ...props },
  ref,
) {
  const frame = useScreenFrame();
  return (
    <button
      ref={ref}
      type="button"
      aria-label={frame.messages.select(frame.name)}
      aria-pressed={frame.selected}
      aria-busy={state === "loading" || undefined}
      disabled={frame.disabled}
      data-state={state}
      className={cn(
        // Square corners by default, like a frame on a canvas; round them with className.
        "relative block w-full overflow-hidden rounded-none border border-border bg-muted text-left outline-none focus-visible:border-ring",
        // The selected ring sits outside the border so the thumbnail is not covered.
        "group-data-selected/frame:border-primary group-data-selected/frame:ring-2 group-data-selected/frame:ring-primary/25",
        frame.animated && "transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        className,
      )}
      style={{ aspectRatio, ...style }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) frame.select({ additive: event.metaKey || event.ctrlKey, range: event.shiftKey });
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "F2" || !frame.canRename) return;
        event.preventDefault();
        frame.setRenaming(true);
      }}
      {...props}
    >
      {state === "ready" && <span className="absolute inset-0 [&>img]:size-full [&>img]:object-cover [&>img]:object-top">{children}</span>}
      {state === "loading" && (
        <span className="absolute inset-0 animate-pulse bg-foreground/5 motion-reduce:animate-none">
          <span className="sr-only">{frame.messages.loading}</span>
        </span>
      )}
      {state === "error" && (
        <span className="absolute inset-0 grid place-content-center justify-items-center gap-2 p-3 text-center text-xs text-muted-foreground">
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
            <path d="m3.5 15 4.5-4.5 4 4 2.5-2.5 6 6M15 9.5h.01" />
          </svg>
          {frame.messages.error}
        </span>
      )}
    </button>
  );
});
