"use client";

import { Toolbar } from "@base-ui/react/toolbar";
import { type ComponentPropsWithoutRef, type MouseEvent, type ReactNode, forwardRef, useCallback, useContext, useEffect, useRef } from "react";
import { CanvasToolbarTip } from "./canvas-toolbar-root";
import { CanvasToolbarToolsContext, useCanvasToolbar } from "./canvas-toolbar-state";
import { cn } from "@/lib/utils";

type ItemProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label"> & {
  /** Names the item, and shows in its tooltip. */
  label: string;
  icon?: ReactNode;
  /** The shortcut to show in the tooltip. */
  shortcut?: string;
  /** Why the item is disabled. It replaces the tooltip and is read by screen readers. */
  reason?: string;
  /** Shows the label beside the icon. */
  showLabel?: boolean;
  tooltipClassName?: string;
};

const Item = forwardRef<HTMLButtonElement, ItemProps & { selected?: boolean }>(function Item({ label, icon, shortcut, reason, showLabel, selected, disabled, tooltipClassName, className, ...props }, ref) {
  const explained = disabled ? reason : undefined;
  return (
    <CanvasToolbarTip label={explained ?? label} shortcut={disabled ? undefined : shortcut} className={tooltipClassName}>
      <Toolbar.Button
        ref={ref}
        disabled={disabled}
        aria-label={label}
        aria-description={explained}
        aria-keyshortcuts={disabled ? undefined : shortcut}
        data-canvas-toolbar-item=""
        data-selected={selected || undefined}
        className={cn(
          "relative z-10 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md text-[13px] text-muted-foreground outline-none transition-colors select-none pointer-coarse:h-11 [&_svg]:size-4 [&_svg]:shrink-0",
          showLabel ? "px-2.5" : "w-8 pointer-coarse:w-11",
          "hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground",
          // A tint of the primary colour stays visible in light and dark themes.
          "data-selected:bg-primary/10 data-selected:text-foreground",
          "aria-disabled:opacity-40 aria-disabled:hover:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {icon}
        {showLabel && label}
      </Toolbar.Button>
    </CanvasToolbarTip>
  );
});

export type CanvasToolbarButtonProps = ItemProps & {
  /** Keeps the button on, for a panel or setting that stays active. */
  pressed?: boolean;
};

/** An action, or a toggle when given `pressed`. It also works as a menu trigger. */
export const CanvasToolbarButton = forwardRef<HTMLButtonElement, CanvasToolbarButtonProps>(function CanvasToolbarButton({ pressed, ...props }, ref) {
  return <Item ref={ref} selected={pressed} aria-pressed={pressed} {...props} />;
});

export type CanvasToolbarToolsProps<V extends string = string> = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  /** The chosen tool, or null for none. Your app owns it. */
  value: V | null;
  onValueChange: (value: V | null) => void;
  /** Choosing the current tool again turns it off. */
  deselectable?: boolean;
  /** Listens for each tool's single-key shortcut while nobody is typing. */
  shortcuts?: boolean;
};

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** The tools, of which one is active at a time. Arrow keys move through the toolbar; Enter or Space chooses. */
export function CanvasToolbarTools<V extends string = string>({ value, onValueChange, deselectable = false, shortcuts = false, className, children, ...props }: CanvasToolbarToolsProps<V>) {
  const { orientation, disabled, messages } = useCanvasToolbar();
  const registered = useRef(new Map<string, { shortcut?: string; disabled: boolean }>());
  const latest = useRef(onValueChange);
  useEffect(() => {
    latest.current = onValueChange;
  });

  useEffect(() => {
    if (!shortcuts || disabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      for (const [tool, entry] of registered.current) {
        if (entry.disabled || entry.shortcut?.toLowerCase() !== event.key.toLowerCase()) continue;
        event.preventDefault();
        latest.current(tool as V);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, disabled]);

  const register = useCallback((tool: string, shortcut: string | undefined, toolDisabled: boolean) => {
    registered.current.set(tool, { shortcut, disabled: toolDisabled });
    return () => void registered.current.delete(tool);
  }, []);

  const context = {
    value,
    choose: (next: string) => onValueChange(next === value && deselectable ? null : (next as V)),
    register,
  };

  return (
    <CanvasToolbarToolsContext.Provider value={context}>
      <Toolbar.Group role="radiogroup" aria-label={messages.tools} className={cn("flex gap-0.5", orientation === "vertical" ? "flex-col items-center" : "items-center", className)} {...props}>
        {children}
      </Toolbar.Group>
    </CanvasToolbarToolsContext.Provider>
  );
}

export type CanvasToolbarToolProps = ItemProps & { value: string };

/** One tool in CanvasToolbarTools. */
export const CanvasToolbarTool = forwardRef<HTMLButtonElement, CanvasToolbarToolProps>(function CanvasToolbarTool({ value, shortcut, disabled = false, onClick, ...props }, ref) {
  const tools = useContext(CanvasToolbarToolsContext);
  if (!tools) throw new Error("CanvasToolbarTool must be rendered inside <CanvasToolbarTools>.");
  const { register } = tools;
  useEffect(() => register(value, shortcut, disabled), [register, value, shortcut, disabled]);
  const selected = tools.value === value;
  return (
    <Item
      ref={ref}
      role="radio"
      aria-checked={selected}
      selected={selected}
      shortcut={shortcut}
      disabled={disabled}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) tools.choose(value);
      }}
      {...props}
    />
  );
});

type PresetProps = Partial<CanvasToolbarToolProps>;

const pointerIcon = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
    <path d="M3.25 2.75 13 7.2 8.8 8.8 7.2 13Z" />
  </svg>
);

const handIcon = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.25 8V3.5a1 1 0 0 1 2 0V7m0-.25V2.75a1 1 0 0 1 2 0V7m0-3.25a1 1 0 0 1 2 0V7.5m0-2a1 1 0 0 1 2 0V9.5a4.75 4.75 0 0 1-4.75 4.75c-1.8 0-2.9-.65-3.8-2L2.6 9.6a1.05 1.05 0 0 1 1.65-1.3L5.25 9.4" />
  </svg>
);

/** The standard selection tool: V. */
export const CanvasToolbarPointer = forwardRef<HTMLButtonElement, PresetProps>(function CanvasToolbarPointer(props, ref) {
  const { messages } = useCanvasToolbar();
  return <CanvasToolbarTool ref={ref} value="pointer" label={messages.pointer} shortcut="V" icon={pointerIcon} {...props} />;
});

/** The standard panning tool: H. Pair it with Canvas Viewport's `panning`. */
export const CanvasToolbarHand = forwardRef<HTMLButtonElement, PresetProps>(function CanvasToolbarHand(props, ref) {
  const { messages } = useCanvasToolbar();
  return <CanvasToolbarTool ref={ref} value="hand" label={messages.hand} shortcut="H" icon={handIcon} {...props} />;
});
