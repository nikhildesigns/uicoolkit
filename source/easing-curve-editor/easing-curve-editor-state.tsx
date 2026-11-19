"use client";

import { type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, createContext, useContext, useEffect, useLayoutEffect } from "react";
import type { EasingCurveHandle, EasingCurvePreset, EasingCurveRange, EasingCurveValue } from "./easing-curve-editor-math";

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Replaceable text, for example to translate. */
export type EasingCurveMessages = {
  preset: string;
  custom: string;
  ease: string;
  duration: string;
  mixed: string;
  /** Shown when typed text is not a usable curve. */
  invalidCurve: (minY: number, maxY: number) => string;
  /** Names a handle: 1 or 2. */
  handle: (number: number) => string;
  /** Read with a handle. */
  point: (x: number, y: number) => string;
};

export const defaultMessages: EasingCurveMessages = {
  preset: "Preset",
  custom: "Custom",
  ease: "Ease",
  duration: "Duration",
  mixed: "Mixed",
  invalidCurve: (minY, maxY) => `Enter x1, y1, x2, y2. X is 0 to 1; Y is ${minY} to ${maxY}.`,
  handle: (number) => `Handle ${number}`,
  point: (x, y) => `Time ${x}, progress ${y}`,
};

/** What changed: the handle, if one, and where the change came from. */
export type EasingCurveDetail = { handle: EasingCurveHandle | null; source: "pointer" | "keyboard" | "field" | "preset" };

export type EasingCurveDurationRange = { min: number; max: number; step: number; unit?: string };

export const defaultDurationRange: EasingCurveDurationRange = { min: 0, max: 2, step: 0.01, unit: "s" };

export type EasingCurveEditorProps = Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue" | "onDurationChange"> & {
  /** The committed curve: [x1, y1, x2, y2]. Your app owns it. */
  value: EasingCurveValue;
  /** Called once per finished drag, key press, field edit or preset, for saving and undo. */
  onValueCommit: (value: EasingCurveValue, detail: EasingCurveDetail) => void;
  /** Called with live curves, and with the starting curve when a drag is cancelled. */
  onValueChange?: (value: EasingCurveValue, detail: EasingCurveDetail) => void;
  /** Accessible and visible name, such as "Timing". */
  label: string;
  /** The lowest and highest progress handles can reach. */
  range?: EasingCurveRange;
  /** The value handles move in steps of. Shift moves ten steps. */
  step?: number;
  presets?: EasingCurvePreset[];
  /** How long the transition runs. Passing it shows the Duration field. Your app owns it. */
  duration?: number;
  /** Called with live durations while dragging the slider. */
  onDurationChange?: (duration: number) => void;
  /** Called once per finished duration change. */
  onDurationCommit?: (duration: number) => void;
  /** The Duration slider's limits, step and unit. */
  durationRange?: EasingCurveDurationRange;
  /** Where the preset menu is portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  /** The selection holds different curves. Fields show Mixed, `value` is where editing starts, and the first edit commits. */
  mixed?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** The handles' press transition. Reduced motion is always honored. */
  motion?: boolean;
  messages?: Partial<EasingCurveMessages>;
};

export type EasingCurveContextValue = {
  /** The live curve while editing, otherwise the committed curve. */
  value: EasingCurveValue;
  label: string;
  range: EasingCurveRange;
  step: number;
  presets: EasingCurvePreset[];
  duration?: number;
  durationRange: EasingCurveDurationRange;
  onDurationChange?: (duration: number) => void;
  onDurationCommit?: (duration: number) => void;
  container?: HTMLElement | null;
  mixed: boolean;
  disabled: boolean;
  readOnly: boolean;
  motion: boolean;
  activeHandle: EasingCurveHandle | null;
  pointerFocus: boolean;
  messages: EasingCurveMessages;
  trackRef: { current: HTMLDivElement | null };
  handleRefs: { current: (HTMLDivElement | null)[] };
  surfaceHandlers: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => void;
  };
  onHandleKeyDown: (event: KeyboardEvent<HTMLDivElement>, handle: EasingCurveHandle) => void;
  onHandleBlur: () => void;
  commitCurve: (curve: EasingCurveValue, source: "field" | "preset") => void;
};

export const EasingCurveContext = createContext<EasingCurveContextValue | null>(null);

/** The curve and state of the nearest EasingCurveEditor, for custom parts. */
export function useEasingCurveEditor() {
  const context = useContext(EasingCurveContext);
  if (!context) throw new Error("Easing curve parts must be rendered inside <EasingCurveEditor>.");
  return context;
}
