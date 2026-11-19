"use client";

import { type ReactElement, type RefAttributes, forwardRef, useId, useRef, useState } from "react";
import { type NumberFieldContextValue, type NumberFieldProps, NumberFieldContext, decimalsOf, defaultMessages } from "./number-field-state";
import { cn } from "@/lib/utils";

const NumberFieldRoot = forwardRef<HTMLDivElement, NumberFieldProps<string>>(function NumberField(
  {
    value,
    onValueCommit,
    onValueChange,
    label,
    min,
    max,
    step = 1,
    largeStep = step * 10,
    precision = decimalsOf(step),
    unit,
    format,
    parse,
    validate,
    placeholder,
    disabled = false,
    readOnly = false,
    sensitivity = 4,
    motion = true,
    stepperLayout = "auto",
    keywords = [],
    keywordFallback,
    container,
    submitText,
    editText,
    messages: messagesProp,
    className,
    ...props
  },
  ref,
) {
  const [preview, setPreview] = useState<number | null>(null);
  const [draft, setDraftValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Pointer events can arrive faster than renders, so the drag reads its latest value here.
  const live = useRef<number | null>(null);
  // Mirrors the draft so a blur that follows Enter, Escape or a step cannot commit it twice.
  const draftRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const messages = { ...defaultMessages, ...messagesProp };
  const locked = disabled || readOnly;

  const normalize = (next: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(next.toFixed(precision))));
  const formatValue = (next: number) => (format ? format(next) : next.toFixed(precision));
  const parseText = (text: string) => {
    if (parse) return parse(text);
    let cleaned = text.trim().replace(/−/g, "-");
    if (unit && cleaned.endsWith(unit)) cleaned = cleaned.slice(0, -unit.length).trim();
    return cleaned === "" ? NaN : Number(cleaned);
  };

  const setDraftState = (next: string | null) => {
    draftRef.current = next;
    setDraftValue(next);
  };

  // A keyword stands in for the number; one with a resolved size still shows that size.
  const number = typeof value === "number" ? value : null;
  const keyword = typeof value === "string" ? (keywords.find((item) => item.value === value) ?? null) : null;
  const display = preview ?? number ?? keyword?.resolved ?? null;
  const text = display !== null ? formatValue(display) : keyword ? keyword.label : "";
  const adjustFrom = display ?? (keyword ? (keywordFallback ?? min ?? 0) : null);
  const keywordFor = (typed: string) => {
    const name = typed.trim().toLowerCase();
    return keywords.find((item) => item.label.toLowerCase() === name || item.value.toLowerCase() === name) ?? null;
  };

  const commit = (next: number) => {
    const normalized = normalize(next);
    live.current = null;
    setPreview(null);
    if (normalized === value) return;
    onValueChange?.(normalized);
    onValueCommit(normalized);
  };

  const commitKeyword = (next: string) => {
    live.current = null;
    setPreview(null);
    if (next === value) return;
    onValueChange?.(next);
    onValueCommit(next);
  };

  const cancelDraft = () => {
    setDraftState(null);
    setError(null);
  };

  const submitDraft = () => {
    const draft = draftRef.current;
    if (draft === null) return true;
    // Clearing the text reverts rather than committing an empty value.
    if (draft.trim() === "") {
      cancelDraft();
      return true;
    }
    // The host reads its own forms first, such as a list of values.
    const handled = submitText?.(draft);
    if (handled === true) {
      cancelDraft();
      return true;
    }
    if (typeof handled === "string") {
      setError(handled);
      return false;
    }
    // A keyword's name selects it, such as "auto".
    const typedKeyword = keywordFor(draft);
    if (typedKeyword) {
      cancelDraft();
      commitKeyword(typedKeyword.value);
      return true;
    }
    const parsed = parseText(draft);
    if (!Number.isFinite(parsed)) {
      setError(messages.invalid);
      return false;
    }
    // Typed values outside the limits are rejected rather than silently clamped.
    const rounded = Number(parsed.toFixed(precision));
    // Symbol units such as % and ° attach to the number; word units such as px take a space.
    const withUnit = (limit: number) => (!unit ? formatValue(limit) : /^[%°′″]$/.test(unit) ? `${formatValue(limit)}${unit}` : `${formatValue(limit)} ${unit}`);
    if (min !== undefined && rounded < min) {
      setError(messages.tooLow.replace("{min}", withUnit(min)));
      return false;
    }
    if (max !== undefined && rounded > max) {
      setError(messages.tooHigh.replace("{max}", withUnit(max)));
      return false;
    }
    const normalized = normalize(rounded);
    const message = validate?.(normalized);
    if (message) {
      setError(message);
      return false;
    }
    cancelDraft();
    commit(normalized);
    return true;
  };

  const stepBy = (steps: number, large = false) => {
    if (locked) return;
    const typed = draftRef.current === null ? NaN : parseText(draftRef.current);
    // Stepping a keyword turns it into a number, from its resolved size or the fallback.
    const base = Number.isFinite(typed) ? typed : adjustFrom;
    // A mixed value has no common base to step from; typing sets one.
    if (base === null) return;
    cancelDraft();
    commit(base + steps * (large ? largeStep : step));
  };

  const cancelDrag = () => {
    live.current = null;
    setPreview(null);
    setDragging(false);
    if (value !== null) onValueChange?.(value);
  };

  const context: NumberFieldContextValue = {
    label,
    value: number,
    keyword,
    keywords,
    adjustFrom,
    setKeyword: (next) => {
      if (locked) return;
      cancelDraft();
      if (next !== null) commitKeyword(next);
      else if (adjustFrom !== null) commit(adjustFrom);
    },
    container,
    editText,
    display,
    text,
    valueText:
      display === null
        ? (keyword?.label ?? placeholder)
        : `${unit ? `${text} ${unit}` : text}${keyword ? `, ${keyword.label}` : ""}`,
    unit,
    min,
    max,
    step,
    largeStep,
    sensitivity,
    placeholder,
    disabled,
    readOnly,
    animated: motion,
    stepperLayout,
    dragging,
    draft,
    error,
    messages,
    inputId: `${id}-input`,
    labelId: `${id}-label`,
    errorId: `${id}-error`,
    inputRef,
    sliderRef,
    setDraft: (next) => {
      setDraftState(next);
      if (error) setError(null);
    },
    beginTyping: () => !locked && setDraftState(text),
    submitDraft,
    cancelDraft,
    stepBy,
    commit: (next) => !locked && commit(next),
    beginDrag: () => {
      if (locked || adjustFrom === null) return null;
      cancelDraft();
      setDragging(true);
      return adjustFrom;
    },
    dragTo: (next) => {
      const normalized = normalize(next);
      if (normalized === live.current) return;
      live.current = normalized;
      setPreview(normalized);
      onValueChange?.(normalized);
    },
    endDrag: () => {
      setDragging(false);
      if (live.current === null) return;
      commit(live.current);
    },
    cancelDrag,
  };

  return (
    <NumberFieldContext.Provider value={context}>
      <div
        ref={ref}
        data-dragging={dragging || undefined}
        data-typing={draft !== null || undefined}
        data-invalid={error ? true : undefined}
        data-empty={display === null || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}
        {...props}
      />
    </NumberFieldContext.Provider>
  );
});

/**
 * A number your app owns, typed, stepped or dragged. With `keywords`, it can also hold a named value
 * such as Auto or Hug; the value's type then widens to include them.
 */
export const NumberField = NumberFieldRoot as <K extends string = never>(props: NumberFieldProps<K> & RefAttributes<HTMLDivElement>) => ReactElement | null;
