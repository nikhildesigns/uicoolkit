"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { usePointerAdjust } from "./number-field-scrub";
import { handleTypingKeys, mergeRefs, useNumberField } from "./number-field-state";
import { cn } from "@/lib/utils";

/** The visible label. Clicking it focuses the input. */
export const NumberFieldLabel = forwardRef<HTMLLabelElement, ComponentPropsWithoutRef<"label">>(function NumberFieldLabel(
  { className, children, ...props },
  ref,
) {
  const { label, labelId, inputId } = useNumberField();
  return (
    <label ref={ref} id={labelId} htmlFor={inputId} data-slot="label" className={cn("text-xs text-muted-foreground select-none", className)} {...props}>
      {children ?? label}
    </label>
  );
});

/**
 * The field's box: holds the input, unit and stepper, and shows focus and invalid states
 * for all of them. Pressing anywhere in it focuses the input.
 */
export const NumberFieldGroup = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function NumberFieldGroup(
  { className, onMouseDown, ...props },
  ref,
) {
  const { inputRef, stepperLayout } = useNumberField();
  return (
    <div
      ref={ref}
      data-slot="group"
      data-layout={stepperLayout}
      className={cn(
        "group/numeric flex h-[var(--uicoolkit-field-height,2.5rem)] min-w-0 flex-1 items-stretch overflow-hidden rounded-md border border-[color:var(--uicoolkit-field-border,var(--input))] bg-[var(--uicoolkit-field-bg,transparent)] shadow-[var(--uicoolkit-field-shadow,0_1px_2px_0_rgb(0_0_0/0.05))] focus-within:border-ring has-[input:disabled]:opacity-50 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
        className,
      )}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        const target = event.target as HTMLElement;
        if (event.defaultPrevented || target.closest("input, button")) return;
        event.preventDefault();
        inputRef.current?.focus();
      }}
      {...props}
    />
  );
});

type InputProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "type"> & {
  /**
   * Drag left or right over the number to adjust it, as over the label (the default). A click without
   * moving still starts typing; while typing, the pointer selects text as usual. Set false to turn it off.
   */
  scrub?: boolean;
};

/** A text input that behaves as a spin button: type and press Enter, or step with the arrow keys. Place it in NumberFieldGroup. */
export const NumberFieldInput = forwardRef<HTMLInputElement, InputProps>(function NumberFieldInput(
  { className, onChange, onKeyDown, onFocus, onBlur, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onMouseDown, scrub = true, ...props },
  ref,
) {
  const field = useNumberField();
  const adjust = usePointerAdjust({
    valueAt: (start, dx, _width, event) => start + Math.round(dx / field.sensitivity) * (event.shiftKey ? field.largeStep : field.step),
    onTap: () => field.inputRef.current?.focus(),
  });
  const unitShown = !!field.unit && !(field.display === null && field.draft === null);
  // Only an idle number is a drag handle; once focused, the input edits text.
  const idle = (target: EventTarget) => scrub && !field.disabled && !field.readOnly && document.activeElement !== target;
  return (
    <input
      ref={mergeRefs(ref, field.inputRef)}
      id={field.inputId}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      role="spinbutton"
      aria-label={field.label}
      aria-valuenow={field.display ?? undefined}
      aria-valuemin={field.min}
      aria-valuemax={field.max}
      aria-valuetext={field.valueText}
      aria-invalid={field.error ? true : undefined}
      aria-describedby={field.error ? field.errorId : undefined}
      disabled={field.disabled}
      readOnly={field.readOnly}
      placeholder={field.placeholder}
      className={cn(
        // Numbers line up on the right, next to their unit; the group draws the box.
        "w-full min-w-0 flex-1 bg-transparent pl-2 text-right text-sm tabular-nums outline-none placeholder:text-muted-foreground",
        // A shown unit supplies the gap before the stepper; without one ("Mixed", or no unit) the input keeps the same gap.
        unitShown ? "pr-1" : "pr-2",
        scrub && !field.disabled && !field.readOnly && field.adjustFrom !== null && "touch-pan-y not-focus:cursor-ew-resize",
        className,
      )}
      {...props}
      value={field.draft ?? field.text}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        // Keep an idle number from taking focus or selecting text on press; a tap focuses it on release.
        if (!event.defaultPrevented && event.button === 0 && idle(event.currentTarget)) event.preventDefault();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || !idle(event.currentTarget)) return;
        if (event.pointerType === "mouse") event.preventDefault();
        adjust.onPointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        adjust.onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        adjust.onPointerUp(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        adjust.onPointerCancel(event);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        const input = event.currentTarget;
        // An empty value can still stand for something to edit, such as a merged field's list.
        if (field.draft === null && field.display === null && field.editText && !field.readOnly) {
          field.setDraft(field.editText);
          // Focus updates render before microtasks run, so this selects the prefilled text before any typing.
          queueMicrotask(() => input.select());
        } else input.select();
      }}
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented) field.setDraft(event.target.value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) handleTypingKeys(event, field);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        // An invalid draft stays in the field with its message until it is fixed or reverted.
        field.submitDraft();
      }}
    />
  );
});

/** The unit after the value. Hidden from assistive technology, which reads it in the value text. */
export const NumberFieldUnit = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function NumberFieldUnit(
  { className, children, ...props },
  ref,
) {
  const { unit, display, draft } = useNumberField();
  // A placeholder such as "Mixed" reads on its own.
  if ((!unit && !children) || (display === null && draft === null)) return null;
  return (
    <span ref={ref} aria-hidden className={cn("flex items-center pr-2 text-xs text-muted-foreground select-none", className)} {...props}>
      {children ?? unit}
    </span>
  );
});

/** The validation message for a rejected typed value. */
export const NumberFieldError = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(function NumberFieldError(
  { className, children, ...props },
  ref,
) {
  const { error, errorId } = useNumberField();
  if (!error) return null;
  return (
    <p ref={ref} id={errorId} data-slot="error" role="alert" className={cn("basis-full text-xs text-destructive", className)} {...props}>
      {children ?? error}
    </p>
  );
});
