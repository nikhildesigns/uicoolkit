"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactElement, type ReactNode, createContext, forwardRef, useContext } from "react";
import { cn } from "@/lib/utils";

/** Replaceable text, for example to translate. */
export type BrowserBarMessages = { label: string; back: string; forward: string; reload: string; address: string };

const defaultMessages: BrowserBarMessages = { label: "Browser controls", back: "Back", forward: "Forward", reload: "Reload", address: "Address" };

export type BrowserBarProps = ComponentPropsWithoutRef<"div"> & {
  /** "standalone" is a complete rounded bar; "attached" joins the top of the content below it. */
  variant?: "standalone" | "attached";
  disabled?: boolean;
  /** Stroke transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where tooltips are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<BrowserBarMessages>;
};

type BrowserBarContextValue = { disabled: boolean; container?: HTMLElement | null; messages: BrowserBarMessages };

const BrowserBarContext = createContext<BrowserBarContextValue | null>(null);

/** The bar's settings, for building custom parts. */
export function useBrowserBar() {
  const context = useContext(BrowserBarContext);
  if (!context) throw new Error("BrowserBar parts must be rendered inside <BrowserBar>.");
  return context;
}

/**
 * Browser controls in one row. As the bar narrows, the action label, Forward and Back drop away
 * in that order, and at its smallest it becomes a floating bar. Set --browser-stroke to change its outline.
 */
export const BrowserBar = forwardRef<HTMLDivElement, BrowserBarProps>(function BrowserBar(
  { variant = "standalone", disabled = false, motion = true, container, messages: messagesProp, className, children, ...props },
  ref,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  return (
    <BrowserBarContext.Provider value={{ disabled, container, messages }}>
      <Tooltip.Provider delay={400}>
        {/* The outer element is the size container, so the row inside can respond to the bar's width. */}
        <div ref={ref} role="group" aria-label={messages.label} aria-disabled={disabled || undefined} data-slot="browser-bar" data-variant={variant} className={cn("@container/browser min-w-0", className)} {...props}>
          <div
            data-slot="browser-bar-row"
            className={cn(
              "flex h-9 min-w-0 items-center gap-0.5 pointer-coarse:min-h-12 bg-background px-1.5 text-xs text-foreground [--browser-line:var(--browser-stroke,var(--border))]",
              // An inside stroke, so the fill spans the full width and an attached bar lines up with the content below.
              variant === "attached"
                ? "rounded-t-lg shadow-[inset_0_1px_0_var(--browser-line),inset_1px_0_0_var(--browser-line),inset_-1px_0_0_var(--browser-line)]"
                : "rounded-lg shadow-[inset_0_0_0_1px_var(--browser-line)]",
              // In the smallest space the bar lifts into a floating control, whichever variant it is.
              "@max-[240px]/browser:h-10 @max-[240px]/browser:rounded-xl @max-[240px]/browser:bg-popover @max-[240px]/browser:px-1 @max-[240px]/browser:shadow-[inset_0_0_0_1px_var(--browser-line),0_8px_24px_-8px_rgb(0_0_0/0.4)]",
              motion && "transition-shadow duration-150 motion-reduce:transition-none",
            )}
          >
            {children}
          </div>
        </div>
      </Tooltip.Provider>
    </BrowserBarContext.Provider>
  );
});

/** A name and shortcut shown above a control. */
export function BrowserBarTip({ label, shortcut, children }: { label: ReactNode; shortcut?: string; children: ReactElement<Record<string, unknown>> }) {
  const { container } = useBrowserBar();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal container={container ?? undefined}>
        <Tooltip.Positioner side="top" sideOffset={6} className="z-50">
          <Tooltip.Popup className="flex items-center gap-2 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow-md">
            <span>{label}</span>
            {shortcut && <kbd className="font-sans text-background/60">{shortcut}</kbd>}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
