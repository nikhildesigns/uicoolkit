"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef, useState } from "react";
import { BrowserBarTip, useBrowserBar } from "./browser-bar-root";
import { cn } from "@/lib/utils";

const control = "shrink-0 rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-3.5";

type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label"> & {
  /** Names the button, and shows in its tooltip. */
  label: string;
  icon: ReactNode;
  shortcut?: string;
};

/** An icon button for the bar. */
export const BrowserBarButton = forwardRef<HTMLButtonElement, ButtonProps>(function BrowserBarButton({ label, icon, shortcut, disabled, className, ...props }, ref) {
  const bar = useBrowserBar();
  return (
    <BrowserBarTip label={label} shortcut={shortcut}>
      <button ref={ref} type="button" aria-label={label} aria-keyshortcuts={shortcut} disabled={disabled || bar.disabled} className={cn("inline-flex size-7 items-center justify-center", control, className)} {...props}>
        {icon}
      </button>
    </BrowserBarTip>
  );
});

type PresetProps = Omit<ButtonProps, "label" | "icon"> & { label?: string; icon?: ReactNode };

const glyph = (path: string) => (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

export const BrowserBarBack = forwardRef<HTMLButtonElement, PresetProps>(function BrowserBarBack({ className, ...props }, ref) {
  const { messages } = useBrowserBar();
  return <BrowserBarButton ref={ref} label={messages.back} icon={glyph("M9.5 3.5 5 8l4.5 4.5")} className={cn("@max-[240px]/browser:hidden", className)} {...props} />;
});

export const BrowserBarForward = forwardRef<HTMLButtonElement, PresetProps>(function BrowserBarForward({ className, ...props }, ref) {
  const { messages } = useBrowserBar();
  return <BrowserBarButton ref={ref} label={messages.forward} icon={glyph("M6.5 3.5 11 8l-4.5 4.5")} className={cn("@max-[300px]/browser:hidden", className)} {...props} />;
});

export const BrowserBarReload = forwardRef<HTMLButtonElement, PresetProps>(function BrowserBarReload(props, ref) {
  const { messages } = useBrowserBar();
  return <BrowserBarButton ref={ref} label={messages.reload} icon={glyph("M13 8a5 5 0 1 1-1.5-3.55M13 2.5v3h-3")} {...props} />;
});

type AddressProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onSubmit"> & {
  /** The page's current address. Your app owns it. */
  value: string;
  /** Called with a changed address when Enter is pressed. */
  onValueCommit?: (address: string) => void;
  /** Class for the form around the input. */
  formClassName?: string;
};

/** The address field: Enter opens what was typed; Escape or leaving the field restores the current address. */
export const BrowserBarAddress = forwardRef<HTMLInputElement, AddressProps>(function BrowserBarAddress(
  { value, onValueCommit, formClassName, disabled, className, onChange, onFocus, onBlur, onKeyDown, onContextMenu, ...props },
  ref,
) {
  const bar = useBrowserBar();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <form
      className={cn("min-w-0 flex-1", formClassName)}
      onSubmit={(event) => {
        event.preventDefault();
        const address = (draft ?? value).trim();
        setDraft(null);
        if (address && address !== value) onValueCommit?.(address);
      }}
    >
      <input
        ref={ref}
        aria-label={bar.messages.address}
        value={draft ?? value}
        disabled={disabled || bar.disabled}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        inputMode="url"
        enterKeyHint="go"
        className={cn(
          "h-7 w-full min-w-0 truncate rounded-md border border-transparent bg-transparent px-2 text-xs text-muted-foreground outline-none transition-colors hover:bg-accent focus:border-ring focus:bg-transparent focus:text-foreground disabled:pointer-events-none disabled:opacity-50 pointer-coarse:h-11 pointer-coarse:text-base",
          className,
        )}
        onChange={(event) => {
          onChange?.(event);
          setDraft(event.target.value);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          const view = event.currentTarget.ownerDocument.defaultView;
          // Keep native caret placement and keyboard handling on touch browsers.
          if (!event.defaultPrevented && !view?.matchMedia?.("(pointer: coarse)").matches) event.currentTarget.select();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setDraft(null);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape") return;
          // Stop here so an enclosing canvas or dialog does not also react.
          event.stopPropagation();
          setDraft(null);
          event.currentTarget.blur();
        }}
        // The field keeps the browser's own cut, copy and paste menu inside a custom context menu.
        onContextMenu={(event) => {
          onContextMenu?.(event);
          event.stopPropagation();
        }}
        {...props}
      />
    </form>
  );
});

type ActionProps = ComponentPropsWithoutRef<"button"> & {
  icon?: ReactNode;
  /** Shows the action as on, such as while a page is running. Change its label to name what pressing it will do. */
  active?: boolean;
  /** Names the action in its tooltip. Defaults to its label. */
  tooltip?: ReactNode;
  shortcut?: string;
};

/** A filled button at the end of the bar, such as Run and Stop. In a narrow bar only its icon shows. */
export const BrowserBarAction = forwardRef<HTMLButtonElement, ActionProps>(function BrowserBarAction({ icon, active = false, tooltip, shortcut, disabled, className, children, ...props }, ref) {
  const bar = useBrowserBar();
  return (
    <BrowserBarTip label={tooltip ?? children} shortcut={shortcut}>
      <button
        ref={ref}
        type="button"
        aria-keyshortcuts={shortcut}
        disabled={disabled || bar.disabled}
        data-active={active || undefined}
        className={cn(
          "inline-flex h-7 min-w-7 shrink-0 items-center justify-center gap-1.5 rounded-md bg-foreground/5 px-2 text-xs font-medium text-foreground outline-none transition-colors @max-[360px]/browser:px-0 [&_svg]:size-3.5",
          "hover:bg-foreground/10 focus-visible:bg-foreground/10 disabled:pointer-events-none disabled:opacity-35",
          "data-active:bg-foreground/10 data-active:hover:bg-foreground/15 data-active:focus-visible:bg-foreground/15",
          className,
        )}
        {...props}
      >
        {icon}
        <span className="@max-[360px]/browser:sr-only">{children}</span>
      </button>
    </BrowserBarTip>
  );
});
