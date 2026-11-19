"use client";

import { Popover } from "@base-ui/react/popover";
import { type ChangeEvent, type ComponentPropsWithoutRef, type FocusEvent, type KeyboardEvent, forwardRef, useRef, useState } from "react";
import { clamp, hexToHsv, parseHex } from "./color-picker-color";
import { mergeRefs, useColorPicker } from "./color-picker-state";
import { cn } from "@/lib/utils";

/** A checkerboard under the colour, so opacity shows. */
export const checkerboard = "bg-[repeating-conic-gradient(#d4d4d4_0%_25%,#ffffff_0%_50%)] bg-[length:8px_8px]";

/** A colour chip over the checkerboard; the top half shows full opacity, the rest the real opacity. */
export function ColorChip({ hex, alpha, className }: { hex: string | null; alpha: number | null; className?: string }) {
  return (
    <span aria-hidden className={cn("relative block overflow-hidden", checkerboard, className)}>
      {hex && <span className="absolute inset-0" style={{ background: hex, opacity: alpha ?? 1 }} />}
      {/* Mixed shows a diagonal stroke instead of a colour. */}
      {!hex && <span className="absolute inset-0 bg-background bg-[linear-gradient(to_top_right,transparent_calc(50%-0.75px),var(--muted-foreground)_50%,transparent_calc(50%+0.75px))]" />}
    </span>
  );
}

/** The swatch that opens the picker. It shows the current colour, or a slash while mixed. */
export const ColorPickerTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function ColorPickerTrigger({ className, ...props }, ref) {
  const picker = useColorPicker();
  const valueText = picker.hex ? picker.messages.swatch(picker.hex, picker.alpha ?? 1) : picker.messages.mixed;
  return (
    <Popover.Trigger
      ref={mergeRefs(ref, picker.triggerRef)}
      disabled={picker.disabled}
      aria-label={`${picker.messages.open(picker.label)}, ${valueText}`}
      className={cn(
        "grid size-[calc(var(--uicoolkit-field-height,2.5rem)*0.6)] shrink-0 place-items-center overflow-hidden rounded-[5px] ring-1 ring-border outline-none focus-visible:ring-ring disabled:opacity-50 data-[popup-open]:ring-ring",
        className,
      )}
      {...props}
    >
      <ColorChip hex={picker.hex} alpha={picker.alpha} className="size-full" />
    </Popover.Trigger>
  );
});

type FieldOptions = {
  /** The text shown when not typing. */
  text: string;
  /** Applies typed text; returns an error message to reject it. */
  apply: (text: string) => string | null;
};

/** Typing commits on Enter or leaving the field and reverts on Escape; a rejected value stays to fix. */
function useTextField({ text, apply }: FieldOptions) {
  const picker = useColorPicker();
  const [draft, setDraftState] = useState<string | null>(null);
  // Mirrors the draft so the blur that follows Enter or Escape cannot apply it again.
  const draftRef = useRef<string | null>(null);
  const setDraft = (next: string | null) => {
    draftRef.current = next;
    setDraftState(next);
  };
  const submit = () => {
    const typed = draftRef.current;
    if (typed === null) return;
    if (typed === text) {
      setDraft(null);
      picker.setError(null);
      return;
    }
    const error = apply(typed);
    picker.setError(error);
    if (!error) setDraft(null);
  };
  return {
    value: draft ?? text,
    "aria-invalid": draft !== null && picker.error ? true : undefined,
    onFocus: (event: FocusEvent<HTMLInputElement>) => event.currentTarget.select(),
    onChange: (event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
    onBlur: submit,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        submit();
      } else if (event.key === "Escape" && draftRef.current !== null) {
        event.preventDefault();
        event.stopPropagation();
        setDraft(null);
        picker.setError(null);
      }
    },
  };
}

// No box of its own: the field around it shows focus, so typing never adds a filled rectangle.
export const inputBox =
  "h-7 min-w-0 rounded-sm bg-transparent px-1 text-sm tabular-nums outline-none placeholder:text-muted-foreground aria-invalid:text-destructive disabled:opacity-50";

/**
 * The field's box. Pressing anywhere in it except the swatch focuses the hex value and selects it,
 * so the whole field reads as one input; the swatch still opens the picker.
 */
export const ColorPickerField = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function ColorPickerField({ className, onMouseDown, ...props }, ref) {
  const picker = useColorPicker();
  return (
    <div
      ref={ref}
      data-slot="field"
      className={cn("flex min-w-0 items-center", !picker.disabled && "cursor-text", className)}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        if (event.defaultPrevented || picker.disabled || (event.target as HTMLElement).closest("button, input")) return;
        // Keep focus from landing on the box itself, then hand it to the hex value.
        event.preventDefault();
        const input = document.getElementById(picker.inputId) as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }}
      {...props}
    />
  );
});

/** The colour's name in the row, such as "Fill". It labels the hex input; clicking it focuses the input. */
export const ColorPickerLabel = forwardRef<HTMLLabelElement, ComponentPropsWithoutRef<"label">>(function ColorPickerLabel({ className, children, ...props }, ref) {
  const picker = useColorPicker();
  return (
    <label ref={ref} htmlFor={picker.inputId} className={cn("truncate text-xs text-muted-foreground select-none", className)} {...props}>
      {children ?? picker.label}
    </label>
  );
});

/** The colour as six hex digits after a fixed "#". Accepts three or six digits, with or without "#". */
export const ColorPickerHexInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(function ColorPickerHexInput({ className, id, ...props }, ref) {
  const picker = useColorPicker();
  const field = useTextField({
    text: picker.hex ? picker.hex.slice(1).toUpperCase() : "",
    apply: (typed) => {
      const hex = parseHex(typed);
      if (!hex) return picker.messages.invalidHex;
      picker.commit({ hsv: hexToHsv(hex), alpha: picker.alpha ?? 1 });
      return null;
    },
  });
  return (
    <span className={cn("flex min-w-0 items-center", className)}>
      {/* Shown, not typed: a pasted "#" is accepted too. */}
      {picker.hex && (
        <span aria-hidden className="text-sm text-muted-foreground select-none">
          #
        </span>
      )}
      <input
        ref={ref}
        id={id ?? picker.inputId}
        type="text"
        spellCheck={false}
        autoComplete="off"
        aria-label={`${picker.label} ${picker.messages.hex}`}
        aria-describedby={picker.error ? picker.errorId : undefined}
        placeholder={picker.messages.mixed}
        disabled={picker.disabled}
        readOnly={!picker.editable}
        maxLength={7}
        // Sized to its digits, so the "#" sits right against them wherever the input is placed.
        className={cn(inputBox, "min-w-[6ch] pl-0 uppercase [field-sizing:content]")}
        {...field}
        {...props}
      />
    </span>
  );
});

type NumberInputProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "min" | "max"> & {
  /** The whole number shown, or null while mixed. */
  value: number | null;
  min: number;
  max: number;
  /** Applies a whole number inside the range. */
  onApply: (value: number) => void;
  /** Shown after the number, such as "%". */
  suffix?: string;
};

/** A whole-number channel, such as red or opacity. Arrow keys step by 1, with Shift by 10. */
export const ColorPickerNumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function ColorPickerNumberInput(
  { value, min, max, onApply, suffix, className, onKeyDown, ...props },
  ref,
) {
  const picker = useColorPicker();
  const field = useTextField({
    text: value === null ? "" : String(value),
    apply: (typed) => {
      const number = Number(typed.trim().replace(/%$/, ""));
      if (typed.trim() === "" || !Number.isFinite(number) || number < min || number > max) return picker.messages.range(min, max);
      onApply(Math.round(number));
      return null;
    },
  });
  return (
    <span className={cn("flex min-w-0 items-center", className)}>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-describedby={picker.error ? picker.errorId : undefined}
        placeholder={value === null ? picker.messages.mixed : undefined}
        disabled={picker.disabled}
        readOnly={!picker.editable}
        className={cn(inputBox, "w-full text-right")}
        {...field}
        {...props}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          field.onKeyDown(event);
          if (event.defaultPrevented || !picker.editable || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
          event.preventDefault();
          const step = (event.shiftKey ? 10 : 1) * (event.key === "ArrowUp" ? 1 : -1);
          onApply(clamp((value ?? min) + step, min, max));
        }}
      />
      {suffix && <span aria-hidden className="pl-0.5 text-xs text-muted-foreground">{suffix}</span>}
    </span>
  );
});

/** Opacity as a percentage, beside the hex value in the row and in the picker. */
export const ColorPickerAlphaInput = forwardRef<HTMLInputElement, Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "min" | "max">>(function ColorPickerAlphaInput({ className, ...props }, ref) {
  const picker = useColorPicker();
  return (
    <ColorPickerNumberInput
      ref={ref}
      aria-label={`${picker.label} ${picker.messages.opacity}`}
      value={picker.alpha === null ? null : Math.round(picker.alpha * 100)}
      min={0}
      max={100}
      suffix="%"
      onApply={(percent) => picker.commit({ hsv: picker.fallback.hsv, alpha: percent / 100 })}
      className={cn("w-12", className)}
      {...props}
    />
  );
});

/** Why a typed value was rejected. It stays in the field to fix. */
export const ColorPickerError = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(function ColorPickerError({ className, ...props }, ref) {
  const { error, errorId } = useColorPicker();
  if (!error) return null;
  return <p ref={ref} id={errorId} role="alert" className={cn("basis-full pt-1 text-xs text-destructive", className)} {...props}>{error}</p>;
});
