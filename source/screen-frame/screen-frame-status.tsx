"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { useScreenFrame } from "./screen-frame-state";
import { cn } from "@/lib/utils";

export type ScreenFrameTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneColor: Record<ScreenFrameTone, string> = {
  neutral: "text-muted-foreground",
  info: "text-sky-600 dark:text-sky-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

/** One icon per tone; pass children to use your own. */
const toneIcon: Record<ScreenFrameTone, ReactNode> = {
  neutral: <circle cx="8" cy="8" r="5.5" strokeDasharray="2.2 2.2" />,
  info: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5.25V8l1.75 1.25" />
    </>
  ),
  success: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m5.75 8.1 1.5 1.5 3-3.1" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2.75 13.75 13H2.25Z" />
      <path d="M8 6.75v2.5M8 11.25h.01" />
    </>
  ),
  danger: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m6.25 6.25 3.5 3.5m0-3.5-3.5 3.5" />
    </>
  ),
};

type StatusProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** The status's full name, such as "In review". Shown in a tooltip on hover and read by screen readers. */
  label: string;
  tone?: ScreenFrameTone;
  /** Always shown. By default the status appears while the frame is hovered or focused (and when selected on touch screens). */
  persistent?: boolean;
  /** Replace the tone's icon. */
  children?: ReactNode;
  /** Class for the tooltip. */
  tooltipClassName?: string;
};

/** A status icon at the right edge of the header. Its name shows in a tooltip on hover. */
export const ScreenFrameStatus = forwardRef<HTMLSpanElement, StatusProps>(function ScreenFrameStatus(
  { label, tone = "neutral", persistent = false, children, className, tooltipClassName, ...props },
  ref,
) {
  const frame = useScreenFrame();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <span
            ref={ref}
            role="img"
            aria-label={label}
            data-tone={tone}
            data-persistent={persistent || undefined}
            className={cn(
              "ml-auto inline-flex size-6 shrink-0 items-center justify-center",
              toneColor[tone],
              !persistent &&
                "opacity-0 group-hover/frame:opacity-100 group-focus-within/frame:opacity-100 pointer-coarse:group-data-selected/frame:opacity-100",
              frame.animated && "transition-opacity duration-150 motion-reduce:transition-none",
              className,
            )}
            {...props}
          />
        }
      >
        {children ?? (
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            {toneIcon[tone]}
          </svg>
        )}
      </Tooltip.Trigger>
      <Tooltip.Portal container={frame.container ?? undefined}>
        <Tooltip.Positioner side="top" sideOffset={6} className="z-50">
          <Tooltip.Popup
            className={cn(
              "rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md",
              frame.animated &&
                "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
              tooltipClassName,
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
