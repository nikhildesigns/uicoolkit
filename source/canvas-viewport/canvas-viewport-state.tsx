"use client";

import { type ComponentPropsWithoutRef, createContext, useContext } from "react";
import type { CanvasFitOptions, CanvasPoint, CanvasRect, CanvasTransform } from "./canvas-viewport-math";

/** Replaceable text, for example to translate. */
export type CanvasViewportMessages = {
  label: string;
  roleDescription: string;
  empty: string;
  zoom: (percent: number) => string;
};

export const defaultMessages: CanvasViewportMessages = {
  label: "Canvas",
  roleDescription: "canvas",
  empty: "Nothing on the canvas yet.",
  zoom: (percent) => `Zoom ${percent}%`,
};

export type CanvasViewportProps = ComponentPropsWithoutRef<"div"> & {
  /** Where the canvas sits, when your app owns it. */
  transform?: CanvasTransform;
  /** Where the canvas starts when your app does not own it. */
  defaultTransform?: CanvasTransform;
  onTransformChange?: (transform: CanvasTransform) => void;
  /** Drag anywhere to pan, as with a hand tool. Space or the middle button pan at any time. */
  panning?: boolean;
  /** Reports whether the canvas owns the pointer: the hand tool, or a pan in progress. Holding Space alone does not count. */
  onPanningChange?: (panning: boolean) => void;
  minZoom?: number;
  maxZoom?: number;
  /** Turns off panning and zooming. */
  disabled?: boolean;
  messages?: Partial<CanvasViewportMessages>;
};

export type CanvasViewportContextValue = {
  transform: CanvasTransform;
  setTransform: (transform: CanvasTransform) => void;
  /** Zooms to a level, around a screen point or the viewport's centre. */
  zoomTo: (zoom: number, point?: CanvasPoint) => void;
  /** Multiplies the zoom, around a screen point or the viewport's centre. */
  zoomBy: (factor: number, point?: CanvasPoint) => void;
  /** Shows every rect, given in canvas units. */
  fit: (rects: CanvasRect[], options?: CanvasFitOptions) => void;
  /** Dragging would pan right now. */
  canPan: boolean;
  dragging: boolean;
  disabled: boolean;
  messages: CanvasViewportMessages;
};

export const CanvasViewportContext = createContext<CanvasViewportContextValue | null>(null);

/** State and actions of the nearest CanvasViewport, for zoom controls and custom parts. */
export function useCanvasViewport() {
  const context = useContext(CanvasViewportContext);
  if (!context) throw new Error("Canvas parts must be rendered inside <CanvasViewport>.");
  return context;
}

/** Pressing these never starts a pan, so controls on the canvas keep working. */
export const noPanSelector = 'button, input, textarea, select, a[href], [contenteditable="true"], [data-canvas-no-pan]';
