"use client";

import { type ComponentPropsWithoutRef, type ReactNode, createContext, useContext, useEffect, useLayoutEffect } from "react";
import type { ResizeHandleName, ResizeLimits, ResizePoint, ResizeRect, ResizeSnap } from "./resize-handles-math";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Replaceable text, for example to translate. */
export type ResizeHandlesMessages = {
  label: string;
  instructions: string;
  size: (width: number, height: number) => string;
};

export const defaultMessages: ResizeHandlesMessages = {
  label: "Resize selection",
  instructions: "Arrow keys change the size. Hold Shift for larger steps.",
  size: (width, height) => `${width} × ${height}`,
};

/** Where the rect's coordinates sit on screen. It has the same shape as Canvas Viewport's transform. */
export type ResizeTransform = { panX: number; panY: number; zoom: number };

/** A drag in progress. */
export type Drag = {
  id: number;
  handle: ResizeHandleName;
  start: ResizeRect;
  last: ResizeRect;
  origin: ResizePoint;
  client: ResizePoint;
  shift: boolean;
  alt: boolean;
  element: HTMLElement;
  root: HTMLElement;
};

/** A client point in the rect's units, so panning or zooming during a drag keeps the handle under the pointer. */
export function toRectPoint(client: ResizePoint, root: HTMLElement, { panX, panY, zoom }: ResizeTransform): ResizePoint {
  const parent = (root.offsetParent ?? root.parentElement) as HTMLElement | null;
  const box = parent?.getBoundingClientRect();
  const left = (box?.left ?? 0) + (parent?.clientLeft ?? 0);
  const top = (box?.top ?? 0) + (parent?.clientTop ?? 0);
  return { x: (client.x - left - panX) / zoom, y: (client.y - top - panY) / zoom };
}

/** How a resize happened: the handle used, and whether it came from the pointer or the keyboard. */
export type ResizeDetail = { handle: ResizeHandleName; source: "pointer" | "keyboard" };

export type ResizeHandlesProps = ComponentPropsWithoutRef<"div"> &
  ResizeLimits & {
    /** The object's position and size. Your app owns it. */
    rect: ResizeRect;
    /** Called with live rects while resizing, and with the starting rect when a drag is cancelled. */
    onRectChange: (rect: ResizeRect, detail: ResizeDetail) => void;
    /** Called once per finished drag or key press, for saving and undo. */
    onRectCommit?: (rect: ResizeRect, detail: ResizeDetail) => void;
    /** Reports when a drag starts and ends. */
    onResizingChange?: (resizing: boolean) => void;
    /** Maps the rect to the screen. Pass Canvas Viewport's transform on a canvas. */
    transform?: ResizeTransform;
    /** Which handles to show. */
    handles?: "all" | "corners" | "edges" | ResizeHandleName[];
    /** Locks width divided by height. Without it, Shift keeps the starting proportions. */
    aspectRatio?: number;
    /** Places dragged edges on multiples of this value. Arrow keys move by it, and by ten times it with Shift. */
    step?: number;
    /** Moves dragged edges, for example to your alignment guides. */
    snap?: ResizeSnap;
    /** Keeps the outline and turns off resizing. */
    disabled?: boolean;
    /** Replaces the visible mark of a corner or edge handle. */
    renderHandle?: (handle: ResizeHandleName) => ReactNode;
    handleClassName?: string;
    messages?: Partial<ResizeHandlesMessages>;
  };

export type ResizeHandlesContextValue = {
  rect: ResizeRect;
  resizing: boolean;
  messages: ResizeHandlesMessages;
};

export const ResizeHandlesContext = createContext<ResizeHandlesContextValue | null>(null);

/** The current rect and text of the nearest ResizeHandles, for custom parts. */
export function useResizeHandles() {
  const context = useContext(ResizeHandlesContext);
  if (!context) throw new Error("Resize handle parts must be rendered inside <ResizeHandles>.");
  return context;
}
