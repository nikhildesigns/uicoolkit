"use client";

import { type ComponentPropsWithoutRef, forwardRef, useRef, useEffect, type KeyboardEvent, type TouchEvent as ReactTouchEvent, type MouseEvent as ReactMouseEvent } from "react";
import { useContextMenuContext, cornerOf, suspendTextSelection, synthetic, isKeyboardEvent } from "./context-menu-state";
import { ContextMenu as Base } from "@base-ui/react/context-menu";
import { cn } from "@/lib/utils";

export type ContextMenuTargetProps = ComponentPropsWithoutRef<"div">;

/** The area that opens the menu on right click, long press, the menu key or Shift+F10. */
export const ContextMenuTarget = forwardRef<HTMLDivElement, ContextMenuTargetProps>(function ContextMenuTarget(
  { className, onKeyDown, onContextMenuCapture, onTouchStart, onTouchEnd, onTouchCancel, ...props },
  ref,
) {
  const { open, disabled, targetRef, openAt } = useContextMenuContext("ContextMenuTarget");
  const restoreSelection = useRef<(() => void) | null>(null);
  const endTouch = () => {
    restoreSelection.current?.();
    restoreSelection.current = null;
    // If the press opened the menu, clear any selection it started before selection was suspended.
    if (open) window.getSelection()?.removeAllRanges();
  };
  useEffect(() => () => restoreSelection.current?.(), []);

  const openFromKeyboard = () => {
    const focused = document.activeElement;
    const anchor = focused && targetRef.current?.contains(focused) ? focused : targetRef.current;
    if (!anchor) return;
    const { x, y } = cornerOf(anchor);
    openAt(x, y, true);
  };

  return (
    <Base.Trigger
      ref={(node) => {
        targetRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-disabled={disabled ? "" : undefined}
      className={cn("outline-none", className)}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (disabled || event.defaultPrevented) return;
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          openFromKeyboard();
        }
      }}
      onTouchStart={(event: ReactTouchEvent<HTMLDivElement>) => {
        onTouchStart?.(event);
        if (!disabled && !restoreSelection.current) restoreSelection.current = suspendTextSelection();
      }}
      onTouchEnd={(event: ReactTouchEvent<HTMLDivElement>) => {
        onTouchEnd?.(event);
        if (restoreSelection.current) endTouch();
      }}
      onTouchCancel={(event: ReactTouchEvent<HTMLDivElement>) => {
        onTouchCancel?.(event);
        if (restoreSelection.current) endTouch();
      }}
      onContextMenuCapture={(event: ReactMouseEvent<HTMLDivElement>) => {
        onContextMenuCapture?.(event);
        // Browsers anchor keyboard-raised menus at the page corner; reopen at the focused element instead.
        if (disabled || synthetic.has(event.nativeEvent) || !isKeyboardEvent(event.nativeEvent)) return;
        event.preventDefault();
        event.stopPropagation();
        openFromKeyboard();
      }}
      {...props}
    />
  );
});

export type ContextMenuButtonProps = ComponentPropsWithoutRef<"button">;

/** A visible button with the same actions, for touch, keyboard and discoverability. */
export const ContextMenuButton = forwardRef<HTMLButtonElement, ContextMenuButtonProps>(function ContextMenuButton(
  { className, children, onClick, onPointerDown, "aria-label": ariaLabel = "More actions", ...props },
  ref,
) {
  const { open, disabled, openAt } = useContextMenuContext("ContextMenuButton");
  // The press that dismisses an open menu should not reopen it.
  const wasOpen = useRef(false);

  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={children ? undefined : ariaLabel}
      disabled={disabled}
      data-state={open ? "open" : "closed"}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        className,
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        wasOpen.current = open;
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || wasOpen.current) {
          wasOpen.current = false;
          return;
        }
        const { x, y } = cornerOf(event.currentTarget);
        // detail is 0 when Enter or Space pressed the button.
        openAt(x, y + 4, event.detail === 0);
      }}
      {...props}
    >
      {children ?? (
        <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="size-4">
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="13" cy="8" r="1.5" />
        </svg>
      )}
    </button>
  );
});
