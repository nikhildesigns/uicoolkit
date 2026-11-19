"use client";

import { type ComponentPropsWithoutRef, type MutableRefObject, type ReactNode, type Ref, createContext, useContext } from "react";
import type { ColorValue, Hsv } from "./color-picker-color";

export type ColorPickerFormat = "hex" | "rgb" | "hsl";

/** Replaceable text, for example to translate. */
export type ColorPickerMessages = {
  mixed: string;
  open: (label: string) => string;
  area: string;
  areaValue: (saturation: number, brightness: number) => string;
  hue: string;
  opacity: string;
  formats: Record<ColorPickerFormat, string>;
  format: string;
  hex: string;
  channels: { r: string; g: string; b: string; h: string; s: string; l: string };
  eyedropper: string;
  swatches: string;
  recent: string;
  swatch: (hex: string, alpha: number) => string;
  invalidHex: string;
  range: (min: number, max: number) => string;
};

export const defaultMessages: ColorPickerMessages = {
  mixed: "Mixed",
  open: (label) => `Edit ${label}`,
  area: "Saturation and brightness",
  areaValue: (saturation, brightness) => `Saturation ${saturation}%, brightness ${brightness}%`,
  hue: "Hue",
  opacity: "Opacity",
  formats: { hex: "Hex", rgb: "RGB", hsl: "HSL" },
  format: "Colour format",
  hex: "Hex",
  channels: { r: "Red", g: "Green", b: "Blue", h: "Hue", s: "Saturation", l: "Lightness" },
  eyedropper: "Pick a colour from the screen",
  swatches: "Swatches",
  recent: "Recent",
  swatch: (hex, alpha) => `${hex.toUpperCase()}${alpha < 1 ? `, ${Math.round(alpha * 100)}% opacity` : ""}`,
  invalidHex: "Enter a hex colour such as FF5B1F.",
  range: (min, max) => `Enter ${min} to ${max}.`,
};

export type ColorPickerProps = Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> & {
  /** Names the colour, such as "Fill". Labels the swatch, inputs and picker. */
  label: string;
  /** The committed colour; null when a selection holds different colours. Your app owns it. */
  value: ColorValue | null;
  /** Called once per finished change: a released drag, a typed value, a swatch or the eyedropper. */
  onValueCommit: (value: ColorValue) => void;
  /** Live values while dragging the area or a slider, for previewing before the commit. */
  onValueChange?: (value: ColorValue) => void;
  /** Colours your app offers, such as the document's colours. Hex strings or colours with opacity. */
  swatches?: (string | ColorValue)[];
  /** The last colours chosen, newest first. Pass with onRecentChange to store them; otherwise the picker keeps them. */
  recent?: ColorValue[];
  onRecentChange?: (recent: ColorValue[]) => void;
  /** How many recent colours to keep. */
  recentLimit?: number;
  /** The format the value inputs show. */
  format?: ColorPickerFormat;
  defaultFormat?: ColorPickerFormat;
  onFormatChange?: (format: ColorPickerFormat) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** Opens the picker when it first renders, such as right after a fill becomes a colour. */
  defaultOpen?: boolean;
  /** Popover and slider transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where the picker is portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<ColorPickerMessages>;
};

export type ColorPickerContextValue = {
  label: string;
  /** The colour shown, live while dragging; null while mixed and untouched. */
  color: { hsv: Hsv; alpha: number } | null;
  hex: string | null;
  alpha: number | null;
  preview: (next: { hsv: Hsv; alpha: number }) => void;
  commit: (next: { hsv: Hsv; alpha: number }) => void;
  /** Ends a drag: commits what was previewed. */
  release: () => void;
  /** Where a mixed colour starts when someone begins editing it. */
  fallback: { hsv: Hsv; alpha: number };
  format: ColorPickerFormat;
  setFormat: (format: ColorPickerFormat) => void;
  swatches: ColorValue[];
  recent: ColorValue[];
  open: boolean;
  setOpen: (open: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  errorId: string;
  inputId: string;
  disabled: boolean;
  readOnly: boolean;
  editable: boolean;
  animated: boolean;
  container?: HTMLElement | null;
  messages: ColorPickerMessages;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  /** The row, which the picker opens against so it never covers it. */
  rootRef: MutableRefObject<HTMLDivElement | null>;
};

export const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

/** State of the nearest ColorPicker, for building custom parts. */
export function useColorPicker() {
  const context = useContext(ColorPickerContext);
  if (!context) throw new Error("ColorPicker parts must be rendered inside <ColorPicker>.");
  return context;
}

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}

export type ColorPickerChildren = { children?: ReactNode };
