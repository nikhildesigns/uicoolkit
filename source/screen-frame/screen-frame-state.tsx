"use client";

import { type ComponentPropsWithoutRef, type ReactNode, createContext, useContext } from "react";

/** How a selection click should combine with the host's current selection. */
export type ScreenFrameSelectDetails = {
  /** Cmd or Ctrl was held: add or remove this screen, keeping the rest. */
  additive: boolean;
  /** Shift was held: extend the selection to this screen. */
  range: boolean;
};

/** Replaceable text for names and actions. Functions receive the screen's name. */
export type ScreenFrameMessages = {
  nameLabel: string;
  select: (name: string) => string;
  rename: string;
  loading: string;
  error: string;
};

export const defaultMessages: ScreenFrameMessages = {
  nameLabel: "Screen name",
  select: (name) => `Select ${name}`,
  rename: "Rename",
  loading: "Loading preview",
  error: "Preview unavailable",
};

export type ScreenFrameProps = Omit<ComponentPropsWithoutRef<"div">, "onSelect"> & {
  /** The screen's committed name. The application owns it. */
  name: string;
  /** Persist a new name. Enables rename by double click, F2 or the menu; return a promise to show pending. */
  onRename?: (name: string) => void | Promise<unknown>;
  /** Return a message to reject a new name. */
  validate?: (name: string) => string | null | undefined;
  /** Whether the host currently has this screen selected. */
  selected?: boolean;
  /** Called on click, Enter or Space with the modifier keys held, so the host decides the selection. */
  onSelect?: (details: ScreenFrameSelectDetails) => void;
  /** Extra menu items (Context Menu items), shown after Rename. The menu opens on right click, long press, the menu key or Shift+F10. */
  actions?: ReactNode;
  disabled?: boolean;
  /** Selection, menu and rename transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where the menu and status tooltips are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<ScreenFrameMessages>;
};

export type ScreenFrameContextValue = {
  name: string;
  selected: boolean;
  disabled: boolean;
  animated: boolean;
  renaming: boolean;
  canRename: boolean;
  nameId: string;
  messages: ScreenFrameMessages;
  container?: HTMLElement | null;
  onRename?: (name: string) => void | Promise<unknown>;
  validate?: (name: string) => string | null | undefined;
  setRenaming: (renaming: boolean) => void;
  select: (details: ScreenFrameSelectDetails) => void;
};

export const ScreenFrameContext = createContext<ScreenFrameContextValue | null>(null);

/** State of the nearest ScreenFrame, for building custom parts. */
export function useScreenFrame() {
  const context = useContext(ScreenFrameContext);
  if (!context) throw new Error("ScreenFrame parts must be rendered inside <ScreenFrame>.");
  return context;
}
