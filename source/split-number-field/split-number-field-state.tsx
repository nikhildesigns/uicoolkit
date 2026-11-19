"use client";

import { type ComponentPropsWithoutRef, type ReactNode, createContext, useContext } from "react";
import type { NumberFieldProps } from "@/components/ui/number-field";

/** One editable value: a side, a corner, or a merged group of them. */
export type SplitNumberPart = {
  key: string;
  /** Read after the field's label, such as "top" in "Padding top". */
  label: string;
  icon?: ReactNode;
  /** The finest parts this one sets. Omit on the finest level, where a part covers itself. */
  covers?: string[];
};

/**
 * How a value splits. Each level is a set of parts, from merged to fully split; the last level's
 * keys are what your app stores. The toggle moves to the next level and wraps back to the first.
 */
export type SplitNumberPreset = {
  levels: SplitNumberPart[][];
  /** Names the toggle, such as "Individual sides". */
  toggleLabel: string;
  toggleIcon?: ReactNode;
};

/** Every finest part's value; null where a selection holds different values. */
export type SplitNumberValue = Record<string, number | null>;

/** What a change touched: the finest parts that received the new value. */
export type SplitNumberChange = { changed: string[] };

export type SplitNumberFieldMessages = {
  /** Shown when a part covers a value that differs across a selection, so its values are unknown. */
  mixed: string;
  /** Shown in a merged part whose sides differ: each different value once, in order, such as "8, 20". */
  values: (values: string[]) => string;
  part: (label: string, part: string) => string;
  /** Rejects a typed list whose length fits neither the shown values nor the sides it covers. */
  listCount: (counts: number[]) => string;
  /** Rejects a typed list with a value outside the limits. */
  listRange: (min: number | undefined, max: number | undefined) => string;
};

export const defaultMessages: SplitNumberFieldMessages = {
  mixed: "Mixed",
  values: (values) => values.join(", "),
  part: (label, part) => `${label} ${part}`,
  listCount: (counts) => `Enter ${counts.length === 1 ? counts[0] : `${counts.slice(0, -1).join(", ")} or ${counts[counts.length - 1]}`} values.`,
  listRange: (min, max) => (min !== undefined && max !== undefined ? `Enter values from ${min} to ${max}.` : min !== undefined ? `Enter values of ${min} or more.` : `Enter values of ${max} or less.`),
};

type Passed = Pick<NumberFieldProps, "unit" | "min" | "max" | "step" | "largeStep" | "precision" | "format" | "parse" | "validate" | "sensitivity" | "disabled" | "readOnly" | "motion">;

export type SplitNumberFieldProps = Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> &
  Passed & {
    /** Names the whole value, such as "Padding". Each part reads as the label and its part. */
    label: string;
    preset: SplitNumberPreset;
    /** Every finest part's value. Your app owns it. */
    value: SplitNumberValue;
    /** Called once per finished edit with every part and the parts it changed, so a selection can apply only those. */
    onValueCommit: (value: SplitNumberValue, change: SplitNumberChange) => void;
    /** Live values while dragging a part, for previewing on your canvas. */
    onValueChange?: (value: SplitNumberValue, change: SplitNumberChange) => void;
    /** Which level shows, as an index into the preset's levels. Leave it out to let the field choose. */
    level?: number;
    /** The level to start at. Defaults to the first one that can show the value without hiding a difference. */
    defaultLevel?: number;
    onLevelChange?: (level: number) => void;
    /** Where values sit in each part: after the icon, or at the end beside the unit. Matches Inspector Field's align. */
    align?: "start" | "end";
    messages?: Partial<SplitNumberFieldMessages>;
  };

export type SplitNumberFieldContextValue = {
  label: string;
  preset: SplitNumberPreset;
  level: number;
  setLevel: (level: number) => void;
  parts: SplitNumberPart[];
  /** The value a part shows: shared by everything it covers, or null when they differ. */
  read: (part: SplitNumberPart) => number | null;
  /** What a part shows in place of a value: its different values, or Mixed for a selection. */
  placeholder: (part: SplitNumberPart) => string;
  /** The list a merged part's typing starts from, when its sides differ. */
  editText: (part: SplitNumberPart) => string | undefined;
  /** Applies typed text that is a list, such as "8, 20"; see SplitNumberFieldParts. */
  submitList: (part: SplitNumberPart, text: string) => true | string | undefined;
  preview: (part: SplitNumberPart, value: number) => void;
  commit: (part: SplitNumberPart, value: number) => void;
  field: Passed;
  align: "start" | "end";
  disabled: boolean;
  messages: SplitNumberFieldMessages;
};

export const SplitNumberFieldContext = createContext<SplitNumberFieldContextValue | null>(null);

/** State of the nearest SplitNumberField, for custom parts. */
export function useSplitNumberField() {
  const context = useContext(SplitNumberFieldContext);
  if (!context) throw new Error("Split Number Field parts must be used inside <SplitNumberField>.");
  return context;
}

/** The finest keys a part sets. */
export const keysOf = (part: SplitNumberPart) => part.covers ?? [part.key];

/** The shared value of some keys, or null when they differ or any is mixed. */
export function sharedValue(value: SplitNumberValue, keys: string[]) {
  const first = value[keys[0]] ?? null;
  return keys.every((key) => (value[key] ?? null) === first) ? first : null;
}

/** The different values a part covers, each once and in order; null when any is unknown across a selection. */
export function distinctValues(value: SplitNumberValue, keys: string[]) {
  const values = keys.map((key) => value[key] ?? null);
  if (values.some((item) => item === null)) return null;
  return [...new Set(values as number[])];
}

/** The first level whose parts each cover equal values, so merging hides no difference. */
export function fittingLevel(preset: SplitNumberPreset, value: SplitNumberValue) {
  const index = preset.levels.findIndex((parts) => parts.every((part) => keysOf(part).every((key) => (value[key] ?? null) === (value[keysOf(part)[0]] ?? null))));
  return index < 0 ? preset.levels.length - 1 : index;
}
