"use client";

import { type MutableRefObject, createContext, useContext, type ReactNode, useState, useRef } from "react";
import { ContextMenu as Base } from "@base-ui/react/context-menu";

export type ContextMenuContextValue = {
  open: boolean;
  disabled: boolean;
  animated: boolean;
  targetRef: MutableRefObject<HTMLDivElement | null>;
  /** Opens the menu at a point, through the same path as a right click. */
  openAt: (x: number, y: number, fromKeyboard: boolean) => void;
  focusFirstRef: MutableRefObject<boolean>;
};

export const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function useContextMenuContext(part: string) {
  const context = useContext(ContextMenuContext);
  if (!context) throw new Error(`<${part}> must be used inside <ContextMenu>.`);
  return context;
}

/** Events we dispatch ourselves, so the keyboard handling below leaves them alone. */
export const synthetic = new WeakSet<Event>();

/**
 * Turns off text selection on the page while a finger holds the target, so a long
 * press opens the menu instead of also selecting nearby text (iOS starts both).
 * Returns a function that restores the previous setting.
 */
export function suspendTextSelection() {
  const style = document.documentElement.style;
  const previous = [style.userSelect, style.webkitUserSelect];
  style.userSelect = "none";
  style.webkitUserSelect = "none";
  return () => {
    [style.userSelect, style.webkitUserSelect] = previous;
  };
}

/** Bottom-left corner of an element: where a keyboard- or button-opened menu appears. */
export const cornerOf = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom };
};

/** A contextmenu event the browser raised for the menu key or Shift+F10 rather than a pointer. */
export const isKeyboardEvent = (event: MouseEvent) => {
  const pointerType = (event as PointerEvent).pointerType;
  return pointerType === "" || (pointerType === undefined && event.button !== 2 && event.clientX === 0 && event.clientY === 0);
};

export type ContextMenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Leaves the browser's own menu in place and disables the button. */
  disabled?: boolean;
  /** Open and close transitions. Reduced motion is always honored. */
  motion?: boolean;
  children?: ReactNode;
};

export function ContextMenu({ open: openProp, defaultOpen = false, onOpenChange, disabled = false, motion = true, children }: ContextMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const targetRef = useRef<HTMLDivElement | null>(null);
  const focusFirstRef = useRef(false);

  const openAt = (x: number, y: number, fromKeyboard: boolean) => {
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 });
    synthetic.add(event);
    focusFirstRef.current = fromKeyboard;
    targetRef.current?.dispatchEvent(event);
  };

  return (
    <ContextMenuContext.Provider value={{ open, disabled, animated: motion, targetRef, openAt, focusFirstRef }}>
      <Base.Root
        open={open}
        disabled={disabled}
        onOpenChange={(next) => {
          if (openProp === undefined) setUncontrolledOpen(next);
          onOpenChange?.(next);
        }}
      >
        {children}
      </Base.Root>
    </ContextMenuContext.Provider>
  );
}
