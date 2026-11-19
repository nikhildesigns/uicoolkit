"use client";

import { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, createContext, useContext, useEffect, useLayoutEffect } from "react";
import type { XYPadAxis, XYPadAxisName, XYPadDirection, XYPadValue } from "./xy-pad-math";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Replaceable text, for example to translate. */
export type XYPadMessages = {
  mixed: string;
  /** Read with the point, from each axis's name and value. */
  value: (x: string, y: string) => string;
};

export const defaultMessages: XYPadMessages = {
  mixed: "Mixed",
  value: (x, y) => `${x}, ${y}`,
};

/** What changed, and whether it came from the pad, the keyboard or a field. */
export type XYPadDetail = { axes: XYPadAxisName[]; source: "pointer" | "keyboard" | "field" };

export type XYPadProps = Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> & {
  /** The committed value. Your app owns it. */
  value: XYPadValue;
  /** Called once per finished drag, key press or field edit, for saving and undo. */
  onValueCommit: (value: XYPadValue, detail: XYPadDetail) => void;
  /** Called with live values, and with the starting value when a drag is cancelled. */
  onValueChange?: (value: XYPadValue, detail: XYPadDetail) => void;
  xAxis: XYPadAxis;
  yAxis: XYPadAxis;
  /** Which way larger Y values run on the surface. */
  yDirection?: XYPadDirection;
  /** Accessible name of the pad, such as "Shadow offset". */
  label: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** The point's press transition. Reduced motion is always honored. */
  motion?: boolean;
  messages?: Partial<XYPadMessages>;
};

export type XYPadContextValue = {
  /** The live value while editing, otherwise the committed value. */
  value: XYPadValue;
  committed: XYPadValue;
  xAxis: XYPadAxis;
  yAxis: XYPadAxis;
  yDirection: XYPadDirection;
  label: string;
  disabled: boolean;
  readOnly: boolean;
  dragging: boolean;
  pointerFocus: boolean;
  motion: boolean;
  messages: XYPadMessages;
  trackRef: { current: HTMLDivElement | null };
  thumbRef: { current: HTMLDivElement | null };
  surfaceHandlers: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => void;
  };
  onThumbKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onThumbBlur: () => void;
  previewAxis: (axis: XYPadAxisName, value: number) => void;
  commitAxis: (axis: XYPadAxisName, value: number) => void;
};

export const XYPadContext = createContext<XYPadContextValue | null>(null);

/** The value, axes and state of the nearest XYPad, for custom parts. */
export function useXYPad() {
  const context = useContext(XYPadContext);
  if (!context) throw new Error("XY Pad parts must be rendered inside <XYPad>.");
  return context;
}
