"use client";

import { type ComponentPropsWithoutRef, createContext, useContext } from "react";
import { Toolbar } from "@base-ui/react/toolbar";

/** Replaceable text, for example to translate. */
export type CanvasToolbarMessages = { label: string; tools: string; pointer: string; hand: string };

export const defaultMessages: CanvasToolbarMessages = { label: "Canvas tools", tools: "Tools", pointer: "Pointer", hand: "Hand" };

export type CanvasToolbarProps = Omit<ComponentPropsWithoutRef<typeof Toolbar.Root>, "className" | "render" | "orientation"> & {
  className?: string;
  orientation?: "horizontal" | "vertical";
  /** "floating" is a raised box in either orientation; "plain" has no box, for placing inside your own container. */
  variant?: "floating" | "plain";
  /** The sliding hover box and tooltip transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where tooltips are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<CanvasToolbarMessages>;
};

export type CanvasToolbarContextValue = {
  orientation: "horizontal" | "vertical";
  disabled: boolean;
  animated: boolean;
  container?: HTMLElement | null;
  messages: CanvasToolbarMessages;
};

export const CanvasToolbarContext = createContext<CanvasToolbarContextValue | null>(null);

export function useCanvasToolbar() {
  const context = useContext(CanvasToolbarContext);
  if (!context) throw new Error("CanvasToolbar parts must be rendered inside <CanvasToolbar>.");
  return context;
}

export type CanvasToolbarToolsContextValue = {
  value: string | null;
  choose: (value: string) => void;
  /** Lets a tool offer its keyboard shortcut; returns how to withdraw it. */
  register: (value: string, shortcut: string | undefined, disabled: boolean) => () => void;
};

export const CanvasToolbarToolsContext = createContext<CanvasToolbarToolsContextValue | null>(null);
