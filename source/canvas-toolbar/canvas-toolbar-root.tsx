"use client";

import { Toolbar } from "@base-ui/react/toolbar";
import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactElement, type ReactNode, forwardRef, useState } from "react";
import { type CanvasToolbarProps, CanvasToolbarContext, defaultMessages, useCanvasToolbar } from "./canvas-toolbar-state";
import { cn } from "@/lib/utils";

type HoverBox = { x: number; y: number; width: number; height: number; slide: boolean };

/** A design tool's toolbar: one box of tools and actions, and one tab stop with arrow keys between its items. */
export const CanvasToolbar = forwardRef<HTMLDivElement, CanvasToolbarProps>(function CanvasToolbar(
  { orientation = "horizontal", variant = "floating", disabled = false, motion = true, container, messages: messagesProp, className, children, onPointerOver, onPointerLeave, ...props },
  ref,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  const vertical = orientation === "vertical";
  const [hover, setHover] = useState<HoverBox | null>(null);

  // One soft box follows the pointer between items and skips any that already show as chosen.
  const trackHover: NonNullable<CanvasToolbarProps["onPointerOver"]> = (event) => {
    onPointerOver?.(event);
    if (event.pointerType === "touch") return;
    const item = (event.target as Element).closest<HTMLElement>("[data-canvas-toolbar-item]");
    if (!item || item.hasAttribute("data-selected") || item.getAttribute("aria-disabled") === "true") return setHover(null);
    setHover((current) => ({ x: item.offsetLeft, y: item.offsetTop, width: item.offsetWidth, height: item.offsetHeight, slide: !!current }));
  };

  return (
    <CanvasToolbarContext.Provider value={{ orientation, disabled, animated: motion, container, messages }}>
      <Tooltip.Provider delay={400}>
        <Toolbar.Root
          ref={ref}
          aria-label={messages.label}
          orientation={orientation}
          disabled={disabled}
          data-slot="canvas-toolbar"
          data-variant={variant}
          className={cn(
            "relative isolate inline-flex w-fit gap-0.5 text-popover-foreground [scrollbar-width:none]",
            vertical ? "max-h-full flex-col items-center overflow-y-auto" : "max-w-full items-center overflow-x-auto",
            variant === "floating" && "rounded-xl border border-border bg-popover p-1 shadow-lg",
            disabled && "opacity-60",
            className,
          )}
          onPointerOver={trackHover}
          onPointerLeave={(event) => {
            onPointerLeave?.(event);
            setHover(null);
          }}
          {...props}
        >
          {hover && (
            <span
              aria-hidden
              data-slot="canvas-toolbar-hover"
              className={cn("pointer-events-none absolute top-0 left-0 rounded-md bg-accent", motion && hover.slide && "transition-[transform,width,height] duration-150 ease-out motion-reduce:transition-none")}
              style={{ width: hover.width, height: hover.height, transform: `translate(${hover.x}px, ${hover.y}px)` }}
            />
          )}
          {children}
        </Toolbar.Root>
      </Tooltip.Provider>
    </CanvasToolbarContext.Provider>
  );
});

/** A thin line between sets of items. */
export const CanvasToolbarSeparator = forwardRef<HTMLDivElement, Omit<ComponentPropsWithoutRef<typeof Toolbar.Separator>, "className" | "render"> & { className?: string }>(function CanvasToolbarSeparator(
  { className, ...props },
  ref,
) {
  const { orientation } = useCanvasToolbar();
  return <Toolbar.Separator ref={ref} className={cn("shrink-0 bg-border", orientation === "vertical" ? "my-1 h-px w-5" : "mx-0.5 h-5 w-px", className)} {...props} />;
});

type TipProps = {
  label: ReactNode;
  shortcut?: string;
  className?: string;
  children: ReactElement<Record<string, unknown>>;
};

/** A name and shortcut that open away from the toolbar: above a dock, beside a rail. */
export function CanvasToolbarTip({ label, shortcut, className, children }: TipProps) {
  const { orientation, container, animated } = useCanvasToolbar();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal container={container ?? undefined}>
        <Tooltip.Positioner side={orientation === "vertical" ? "right" : "top"} sideOffset={8} className="z-50">
          <Tooltip.Popup
            className={cn(
              "flex items-center gap-2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md",
              animated && "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
              className,
            )}
          >
            <span>{label}</span>
            {shortcut && <kbd className="font-sans text-background/60">{shortcut}</kbd>}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
