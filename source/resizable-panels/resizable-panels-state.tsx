"use client";

import { type ComponentPropsWithoutRef, createContext, useContext, useEffect, useLayoutEffect } from "react";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ResizablePanelsDirection = "horizontal" | "vertical";

export type ResizablePanelsProps = ComponentPropsWithoutRef<"div"> & {
  /** "horizontal" places panels side by side; "vertical" stacks them. */
  direction?: ResizablePanelsDirection;
  /** The space, in pixels, always left for the panel that fills. */
  minFillSize?: number;
  /** Turns off every handle. */
  disabled?: boolean;
  /** The collapse transition. Reduced motion is always honored. */
  motion?: boolean;
};

export type ResizablePanelProps = ComponentPropsWithoutRef<"div"> & {
  /** The panel's size in pixels, when your app owns it. Leave out both sizes for a panel that fills the remaining space. */
  size?: number;
  /** The starting size in pixels, when the panel keeps its own size. */
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  /** Hides the panel and keeps its size for when it returns. */
  collapsed?: boolean;
  /** Called with live sizes while resizing. */
  onSizeChange?: (size: number) => void;
  /** Called once per finished drag or key press, for saving. */
  onSizeCommit?: (size: number) => void;
  /** Reports when a drag starts and ends. */
  onResizingChange?: (resizing: boolean) => void;
};

export type ResizablePanelsContextValue = {
  direction: ResizablePanelsDirection;
  minFillSize: number;
  disabled: boolean;
  animated: boolean;
};

export const ResizablePanelsContext = createContext<ResizablePanelsContextValue | null>(null);

export function useResizablePanels() {
  const context = useContext(ResizablePanelsContext);
  if (!context) throw new Error("ResizablePanel must be rendered inside <ResizablePanels>.");
  return context;
}

export type ResizablePanelContextValue = {
  panelId: string;
  size: number;
  min: number;
  max: number;
  collapsed: boolean;
  resizing: boolean;
  setSize: (size: number) => void;
  commit: (size: number) => void;
  setResizing: (resizing: boolean) => void;
};

export const ResizablePanelContext = createContext<ResizablePanelContextValue | null>(null);

export const clampSize = (size: number, min: number, max: number) => Math.round(Math.max(min, Math.min(Math.max(min, max), size)));

/** The most a panel can take: the group's size minus its sized neighbours and the space kept for the filling panel. */
export function availableSize(panel: HTMLElement, root: HTMLElement, direction: ResizablePanelsDirection, minFillSize: number) {
  const total = direction === "horizontal" ? root.clientWidth : root.clientHeight;
  if (total <= 0) return Infinity;
  const others = [...root.children].filter((child): child is HTMLElement => child !== panel && child instanceof HTMLElement && child.hasAttribute("data-sized"));
  return total - minFillSize - others.reduce((sum, child) => sum + (direction === "horizontal" ? child.offsetWidth : child.offsetHeight), 0);
}
