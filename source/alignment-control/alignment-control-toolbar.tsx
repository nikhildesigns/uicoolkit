"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef, useEffect, useRef, useState } from "react";
import {
  type AlignmentAction,
  type AlignmentControlContextValue,
  type AlignmentControlProps,
  AlignmentControlContext,
  defaultMessages,
  mergeRefs,
  minimumFor,
  useAlignmentControl,
} from "./alignment-control-state";
import { cn } from "@/lib/utils";

const actionSelector = "[data-align-action]";

/**
 * Align and distribute buttons for the selected layers, as one toolbar: arrow keys move between
 * the buttons and Tab leaves it. The control reports the action; your app moves the layers.
 */
export const AlignmentControl = forwardRef<HTMLDivElement, AlignmentControlProps>(function AlignmentControl(
  { selectionCount, onAlign, shortcuts = {}, disabled = false, motion = true, messages: messagesProp, className, onKeyDown, children, ...props },
  ref,
) {
  const messages = { ...defaultMessages, ...messagesProp, actions: { ...defaultMessages.actions, ...messagesProp?.actions } };
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<AlignmentAction | null>(null);

  // Give the tab stop to the first button until one is focused, and again if that button goes away.
  useEffect(() => {
    const buttons = [...(rootRef.current?.querySelectorAll<HTMLElement>(actionSelector) ?? [])];
    if (buttons.some((button) => button.dataset.alignAction === active)) return;
    const first = buttons[0]?.dataset.alignAction as AlignmentAction | undefined;
    if (first) setActive(first);
  }, [active, children]);

  const context: AlignmentControlContextValue = {
    selectionCount,
    align: (action) => {
      if (disabled || selectionCount < minimumFor(action)) return;
      onAlign(action, { target: selectionCount === 1 ? "parent" : "selection" });
    },
    shortcuts,
    disabled,
    animated: motion,
    messages,
    active,
    setActive,
    rootRef,
  };

  return (
    <AlignmentControlContext.Provider value={context}>
      <Tooltip.Provider delay={400}>
        <div
          ref={mergeRefs(ref, rootRef)}
          role="toolbar"
          aria-label={messages.toolbar}
          aria-disabled={disabled || undefined}
          data-disabled={disabled || undefined}
          className={cn("flex flex-wrap items-center gap-1.5", className)}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>(actionSelector)].filter((button) => !button.hasAttribute("disabled"));
            const index = buttons.indexOf(document.activeElement as HTMLElement);
            if (index < 0) return;
            const next =
              event.key === "ArrowRight" || event.key === "ArrowDown"
                ? buttons[(index + 1) % buttons.length]
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? buttons[(index - 1 + buttons.length) % buttons.length]
                  : event.key === "Home"
                    ? buttons[0]
                    : event.key === "End"
                      ? buttons[buttons.length - 1]
                      : null;
            if (!next) return;
            event.preventDefault();
            next.focus();
          }}
          {...props}
        >
          {children}
        </div>
      </Tooltip.Provider>
    </AlignmentControlContext.Provider>
  );
});

/** A boxed set of buttons, such as the horizontal aligns. */
export const AlignmentControlGroup = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function AlignmentControlGroup({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="group"
      className={cn("flex h-8 items-center gap-0.5 rounded-md border border-input bg-muted p-0.5 dark:bg-input/40", className)}
      {...props}
    />
  );
});

// Each icon is a guide line with two layers against it, drawn on a 16-unit grid.
const bar = (x: number, y: number, width: number, height: number) => <rect x={x} y={y} width={width} height={height} rx={1} fill="currentColor" />;
const line = (x1: number, y1: number, x2: number, y2: number) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />;
const glyphs: Record<AlignmentAction, ReactNode> = {
  left: [line(2, 2, 2, 14), bar(4.5, 4, 8, 3), bar(4.5, 9, 5, 3)],
  center: [line(8, 2, 8, 14), bar(3, 4, 10, 3), bar(5, 9, 6, 3)],
  right: [line(14, 2, 14, 14), bar(3.5, 4, 8, 3), bar(6.5, 9, 5, 3)],
  top: [line(2, 2, 14, 2), bar(4, 4.5, 3, 8), bar(9, 4.5, 3, 5)],
  middle: [line(2, 8, 14, 8), bar(4, 3, 3, 10), bar(9, 5, 3, 6)],
  bottom: [line(2, 14, 14, 14), bar(4, 3.5, 3, 8), bar(9, 6.5, 3, 5)],
  "distribute-horizontal": [line(2, 2, 2, 14), line(14, 2, 14, 14), bar(6.5, 4, 3, 8)],
  "distribute-vertical": [line(2, 2, 14, 2), line(2, 14, 14, 14), bar(4, 6.5, 8, 3)],
};

/** The icon for an action, for menus or custom buttons. */
export function AlignmentIcon({ action, className }: { action: AlignmentAction; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("size-4 shrink-0", className)}>
      {Array.isArray(glyphs[action]) ? (glyphs[action] as ReactNode[]).map((part, index) => <g key={index}>{part}</g>) : glyphs[action]}
    </svg>
  );
}

type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  action: AlignmentAction;
  /** Class for the tooltip. */
  tooltipClassName?: string;
};

/**
 * One action. It stays focusable when the selection is too small for it, and its tooltip says what it needs.
 */
export const AlignmentControlButton = forwardRef<HTMLButtonElement, ButtonProps>(function AlignmentControlButton(
  { action, tooltipClassName, className, onClick, onFocus, ...props },
  ref,
) {
  const control = useAlignmentControl();
  const minimum = minimumFor(action);
  const unavailable = control.selectionCount < minimum;
  const label = control.messages.actions[action];
  const shortcut = control.shortcuts[action];
  const button = (
    <button
      ref={ref}
      type="button"
      data-align-action={action}
      aria-label={label}
      aria-keyshortcuts={shortcut}
      aria-disabled={unavailable || undefined}
      disabled={control.disabled}
      tabIndex={control.active === action ? 0 : -1}
      onFocus={(event) => {
        onFocus?.(event);
        control.setActive(action);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) control.align(action);
      }}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none transition-[color,background-color,box-shadow,transform] select-none",
        "hover:bg-background hover:text-foreground hover:shadow-xs active:scale-95 focus-visible:bg-foreground/10 focus-visible:text-foreground",
        "aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground aria-disabled:hover:shadow-none aria-disabled:active:scale-100",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <AlignmentIcon action={action} />
    </button>
  );
  if (control.disabled) return button;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={button} />
      <Tooltip.Portal container={control.rootRef}>
        <Tooltip.Positioner side="top" sideOffset={6} positionMethod="fixed" className="z-50">
          <Tooltip.Popup
            className={cn(
              "flex items-center gap-2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md",
              control.animated &&
                "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
              tooltipClassName,
            )}
          >
            <span>{unavailable ? `${label} · ${control.messages.needs(minimum)}` : label}</span>
            {shortcut && !unavailable && <kbd className="font-sans text-background/60">{shortcut}</kbd>}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
