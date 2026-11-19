"use client";

import { type ComponentPropsWithoutRef, type KeyboardEvent, type MutableRefObject, type Ref, createContext, useContext } from "react";

/**
 * Replaceable text for validation and the step buttons. In `tooLow` and `tooHigh`, `{min}` and
 * `{max}` are replaced with the formatted limit and its unit.
 */
export type NumberFieldMessages = {
  invalid: string;
  tooLow: string;
  tooHigh: string;
  increment: string;
  decrement: string;
  /** The keyword menu's option for a plain number. */
  fixed: string;
  /** Names the keyword menu, such as "Gap mode". */
  mode: (label: string) => string;
};

export const defaultMessages: NumberFieldMessages = {
  invalid: "Enter a number.",
  tooLow: "Enter {min} or more.",
  tooHigh: "Enter {max} or less.",
  increment: "Increase",
  decrement: "Decrease",
  fixed: "Fixed",
  mode: (label) => `${label} mode`,
};

/**
 * A named value the field can hold instead of a number, such as Auto or Hug. Give `resolved`
 * when the keyword stands for a size your app worked out (Hug's 560); the field then shows that
 * number with the keyword beside it, and adjusting it starts from there.
 */
export type NumberFieldKeyword<K extends string = string> = { value: K; label: string; resolved?: number | null };

/**
 * Where the step buttons go. "stacked" puts small up/down arrows at the end of the field;
 * "split" puts larger − and + buttons on either side for fingers. "auto" picks split on
 * touch screens (a coarse pointer) and stacked otherwise, decided in CSS so it never flashes.
 */
export type NumberFieldStepperLayout = "auto" | "stacked" | "split";

/** Only `keywords` decides K, so a field without keywords keeps a plain number value. */
export type NumberFieldProps<K extends string = never> = Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> & {
  /** The committed value: a number, one of your keywords, or null when there is none (for example a mixed selection). The application owns it. */
  value: number | NoInfer<K> | null;
  /** Called once per finished change: a typed value, a step, the end of a drag, or a keyword. */
  onValueCommit: (value: number | NoInfer<K>) => void;
  /** Called with every change, including live values while dragging, and with the committed value when a drag is cancelled. */
  onValueChange?: (value: number | NoInfer<K>) => void;
  /** Named values the field can hold instead of a number, offered in NumberFieldKeywordMenu and accepted when typed. */
  keywords?: readonly NumberFieldKeyword<K>[];
  /** Where stepping or dragging starts from a keyword with no resolved number. Defaults to min, or 0. */
  keywordFallback?: number;
  /** Where NumberFieldKeywordMenu is portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  /**
   * Handle typed text before the field reads it as a number, such as a list like "8, 20". Return true
   * when you applied it, a message to reject it, or nothing to let the field read it as usual.
   */
  submitText?: (text: string) => true | string | null | undefined | void;
  /** When the value is empty, the text typing starts from, such as the list a merged field stands for. */
  editText?: string;
  /** Accessible name of the field, such as "Width". */
  label: string;
  /** Limits. Typed values outside them are rejected with a message; stepping and dragging stop at them. */
  min?: number;
  max?: number;
  step?: number;
  /** Used with Shift and Page Up/Down. Defaults to ten steps. */
  largeStep?: number;
  /** Decimal places kept and shown. Defaults to the decimals of `step`. */
  precision?: number;
  /** Shown after the value and read with it, such as "px" or "%". */
  unit?: string;
  format?: (value: number) => string;
  /** Turn typed text into a number; return NaN to reject it. */
  parse?: (text: string) => number;
  /** Return a message to reject a typed value. */
  validate?: (value: number) => string | null | undefined;
  /** Shown when `value` is null, such as "Mixed". */
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** Pointer travel in pixels per step when dragging a scrub area. */
  sensitivity?: number;
  /** Fill and press transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where NumberFieldStepper puts its buttons. Defaults to "auto". */
  stepperLayout?: NumberFieldStepperLayout;
  messages?: Partial<NumberFieldMessages>;
};

export type NumberFieldContextValue = {
  label: string;
  /** The committed number, or null when the value is a keyword or there is none. */
  value: number | null;
  /** The keyword the field holds, if any. */
  keyword: NumberFieldKeyword | null;
  keywords: readonly NumberFieldKeyword[];
  /** Where an adjustment starts: the shown number, or for a keyword without one, the fallback. Null when Mixed. */
  adjustFrom: number | null;
  /** Commits a keyword by its value, or a plain number (Fixed) when null. */
  setKeyword: (keyword: string | null) => void;
  container?: HTMLElement | null;
  editText?: string;
  /** The live value while dragging, otherwise the committed value. */
  display: number | null;
  /** `display` formatted, or "" when there is none. */
  text: string;
  valueText: string | undefined;
  unit?: string;
  min?: number;
  max?: number;
  step: number;
  largeStep: number;
  sensitivity: number;
  placeholder?: string;
  disabled: boolean;
  readOnly: boolean;
  animated: boolean;
  stepperLayout: NumberFieldStepperLayout;
  dragging: boolean;
  /** Typed text not yet committed, or null. */
  draft: string | null;
  error: string | null;
  messages: NumberFieldMessages;
  inputId: string;
  labelId: string;
  errorId: string;
  inputRef: MutableRefObject<HTMLInputElement | null>;
  sliderRef: MutableRefObject<HTMLDivElement | null>;
  setDraft: (text: string) => void;
  beginTyping: () => void;
  /** Commits the draft. Returns false and keeps it when it is invalid. */
  submitDraft: () => boolean;
  cancelDraft: () => void;
  stepBy: (steps: number, large?: boolean) => void;
  commit: (value: number) => void;
  /** Starts a drag; returns the value it starts from, or null when there is none to adjust. */
  beginDrag: () => number | null;
  dragTo: (value: number) => void;
  endDrag: () => void;
  cancelDrag: () => void;
};

export const NumberFieldContext = createContext<NumberFieldContextValue | null>(null);

/** State and actions of the nearest NumberField, for building custom parts. */
export function useNumberField() {
  const context = useContext(NumberFieldContext);
  if (!context) throw new Error("NumberField parts must be rendered inside <NumberField>.");
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

export function decimalsOf(step: number) {
  const [mantissa, exponent] = String(step).split("e-");
  return (mantissa.split(".")[1]?.length ?? 0) + Number(exponent ?? 0);
}

/** Keys shared by every typed input: Enter commits, Escape reverts, arrows step. */
export function handleTypingKeys(event: KeyboardEvent<HTMLInputElement>, field: NumberFieldContextValue) {
  if (event.key === "Enter") {
    // Enter confirms an input-method composition instead of committing.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    field.submitDraft();
  } else if (event.key === "Escape" && field.draft !== null) {
    // Stop here so an enclosing sheet or popover stays open.
    event.preventDefault();
    event.stopPropagation();
    field.cancelDraft();
  } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    field.stepBy(event.key === "ArrowUp" ? 1 : -1, event.shiftKey);
  } else if (event.key === "PageUp" || event.key === "PageDown") {
    event.preventDefault();
    field.stepBy(event.key === "PageUp" ? 1 : -1, true);
  }
}
