"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef, useState } from "react";
import { NumberField, NumberFieldError, NumberFieldGroup, NumberFieldInput, NumberFieldScrubArea, NumberFieldUnit } from "@/components/ui/number-field";
import {
  type SplitNumberFieldContextValue,
  type SplitNumberFieldProps,
  type SplitNumberPart,
  type SplitNumberValue,
  SplitNumberFieldContext,
  defaultMessages,
  distinctValues,
  fittingLevel,
  keysOf,
  sharedValue,
  useSplitNumberField,
} from "./split-number-field-state";
import { cn } from "@/lib/utils";

/**
 * A number that splits into linked parts, such as padding into its sides or radius into its corners.
 * A merged part whose sides differ lists their values, such as "8, 20"; typing or dragging it sets everything it covers.
 * The layout is a two-column grid with the toggle at the end of the first row.
 */
export const SplitNumberField = forwardRef<HTMLDivElement, SplitNumberFieldProps>(function SplitNumberField(
  {
    label,
    preset,
    value,
    onValueCommit,
    onValueChange,
    level: levelProp,
    defaultLevel,
    onLevelChange,
    align = "start",
    messages: messagesProp,
    unit,
    min,
    max,
    step,
    largeStep,
    precision,
    format,
    parse,
    validate,
    sensitivity,
    disabled = false,
    readOnly,
    motion,
    className,
    ...props
  },
  ref,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  // Starts at the first level that shows the value without hiding a difference.
  const [levelState, setLevelState] = useState(() => defaultLevel ?? fittingLevel(preset, value));
  const level = Math.min(levelProp ?? levelState, preset.levels.length - 1);
  const apply = (part: SplitNumberPart, next: number): [SplitNumberValue, { changed: string[] }] => {
    const changed = keysOf(part);
    return [{ ...value, ...Object.fromEntries(changed.map((key) => [key, next])) }, { changed }];
  };
  const show = (item: number) => (format ? format(item) : String(item));

  /**
   * Reads a typed list onto the sides a part covers. As many values as it shows replace those values
   * wherever they appear ("12, 0" over 12, 12, 0, 0); as many as it covers go in order. One value
   * is left to the field.
   */
  const submitList = (part: SplitNumberPart, text: string): true | string | undefined => {
    const tokens = text.split(/[\s,]+/).filter(Boolean);
    if (tokens.length < 2) return undefined;
    const numbers = tokens.map((token) => Number((unit && token.endsWith(unit) ? token.slice(0, -unit.length) : token).replace(/−/g, "-")));
    if (numbers.some((item) => !Number.isFinite(item))) return undefined;
    if (numbers.some((item) => (min !== undefined && item < min) || (max !== undefined && item > max))) return messages.listRange(min, max);
    const keys = keysOf(part);
    const shown = distinctValues(value, keys);
    let next: Record<string, number>;
    if (shown && shown.length > 1 && numbers.length === shown.length) {
      next = Object.fromEntries(keys.map((key) => [key, numbers[shown.indexOf(value[key] as number)]]));
    } else if (numbers.length === keys.length) {
      next = Object.fromEntries(keys.map((key, index) => [key, numbers[index]]));
    } else {
      const counts = [...new Set([1, ...(shown && shown.length > 1 ? [shown.length] : []), keys.length])].sort((a, b) => a - b);
      return messages.listCount(counts);
    }
    const changed = keys.filter((key) => value[key] !== next[key]);
    if (changed.length) onValueCommit({ ...value, ...next }, { changed });
    return true;
  };

  const context: SplitNumberFieldContextValue = {
    label,
    preset,
    level,
    setLevel: (next) => {
      if (levelProp === undefined) setLevelState(next);
      onLevelChange?.(next);
    },
    parts: preset.levels[level],
    read: (part) => sharedValue(value, keysOf(part)),
    placeholder: (part) => {
      const values = distinctValues(value, keysOf(part));
      return values ? messages.values(values.map(show)) : messages.mixed;
    },
    editText: (part) => {
      const values = distinctValues(value, keysOf(part));
      return values && values.length > 1 ? messages.values(values.map(show)) : undefined;
    },
    submitList,
    preview: (part, next) => onValueChange?.(...apply(part, next)),
    commit: (part, next) => onValueCommit(...apply(part, next)),
    field: { unit, min, max, step, largeStep, precision, format, parse, validate, sensitivity, disabled, readOnly, motion },
    align,
    disabled,
    messages,
  };

  return (
    <SplitNumberFieldContext.Provider value={context}>
      <div
        ref={ref}
        role="group"
        aria-label={label}
        data-level={level}
        data-split={level === preset.levels.length - 1 || undefined}
        data-align={align}
        className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2", className)}
        {...props}
      />
    </SplitNumberFieldContext.Provider>
  );
});

type PartsProps = {
  /** Class for each part's box, input, icon and error. */
  groupClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  errorClassName?: string;
  /** Replace a part's contents inside its Number Field; receives the part. */
  children?: (part: SplitNumberPart) => ReactNode;
};

/**
 * The current level's parts, each a Number Field labelled by its icon: drag the icon or the number,
 * type, or step with the arrow keys. They fill two columns, so four parts form a 2×2 grid.
 */
export function SplitNumberFieldParts({ groupClassName, inputClassName, iconClassName, errorClassName, children }: PartsProps) {
  const split = useSplitNumberField();
  const single = split.parts.length === 1;
  return split.parts.map((part, index) => (
    <NumberField
      key={part.key}
      {...split.field}
      label={split.messages.part(split.label, part.label)}
      placeholder={split.placeholder(part)}
      editText={split.editText(part)}
      submitText={(text) => split.submitList(part, text)}
      value={split.read(part)}
      onValueChange={(next) => split.preview(part, next)}
      onValueCommit={(next) => split.commit(part, next)}
      data-part={part.key}
      // Parts keep to the first two columns; the toggle owns the third column of the first row.
      className={cn("min-w-0 flex-nowrap", single ? "col-span-2 col-start-1" : index % 2 === 0 ? "col-start-1" : "col-start-2", "flex-col items-stretch gap-1")}
    >
      {children ? (
        children(part)
      ) : (
        <>
          {/* The part stacks its box over its error, so the box must not shrink to its content. */}
          <NumberFieldGroup className={cn("flex-none", groupClassName)}>
            <NumberFieldScrubArea className={cn("pl-2 text-muted-foreground", iconClassName)}>{part.icon}</NumberFieldScrubArea>
            <NumberFieldInput className={cn(split.align === "start" && "pl-1.5 text-left", inputClassName)} />
            <NumberFieldUnit />
          </NumberFieldGroup>
          <NumberFieldError className={errorClassName} />
        </>
      )}
    </NumberField>
  ));
}

/** Moves to the next level, wrapping back to the first. Pressed while fully split. */
export const SplitNumberFieldToggle = forwardRef<HTMLButtonElement, Omit<ComponentPropsWithoutRef<"button">, "children">>(function SplitNumberFieldToggle(
  { className, onClick, ...props },
  ref,
) {
  const split = useSplitNumberField();
  const last = split.preset.levels.length - 1;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={split.preset.toggleLabel}
      aria-pressed={split.level === last}
      disabled={split.disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) split.setLevel(split.level === last ? 0 : split.level + 1);
      }}
      className={cn(
        "col-start-3 row-start-1 grid h-[var(--uicoolkit-field-height,2.5rem)] w-10 border border-[color:var(--uicoolkit-field-icon-border,transparent)] bg-[var(--uicoolkit-field-icon-bg,transparent)] place-items-center rounded-md text-muted-foreground outline-none transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50",
        "aria-pressed:bg-primary/10 aria-pressed:text-foreground",
        className,
      )}
      {...props}
    >
      {split.preset.toggleIcon}
    </button>
  );
});
