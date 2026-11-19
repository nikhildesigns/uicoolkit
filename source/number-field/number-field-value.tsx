"use client";

import { type ComponentPropsWithoutRef, forwardRef, useEffect, useRef } from "react";
import { handleTypingKeys, mergeRefs, useNumberField } from "./number-field-state";
import { cn } from "@/lib/utils";

type ValueProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** Class for the input shown while typing. */
  inputClassName?: string;
};

/** The formatted value and unit. Becomes an input while typing. */
export const NumberFieldValue = forwardRef<HTMLSpanElement, ValueProps>(function NumberFieldValue({ className, inputClassName, ...props }, ref) {
  const field = useNumberField();
  const input = useRef<HTMLInputElement | null>(null);
  const typing = field.draft !== null;
  const wasTyping = useRef(false);
  const sliderRef = field.sliderRef;

  useEffect(() => {
    if (typing) {
      input.current?.focus();
      input.current?.select();
    } else if (wasTyping.current && (!document.activeElement || document.activeElement === document.body)) {
      // The input unmounted with focus after Enter, Escape or a step; give it back to the slider.
      sliderRef.current?.focus();
    }
    wasTyping.current = typing;
  }, [typing, sliderRef]);

  return (
    <span ref={ref} data-slot="value" className={cn("flex min-w-0 items-baseline gap-1 tabular-nums", className)} {...props}>
      {typing ? (
        <input
          ref={mergeRefs(input, field.inputRef)}
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
          className={cn("w-16 min-w-0 bg-transparent text-right text-sm tabular-nums outline-none", inputClassName)}
          value={field.draft ?? ""}
          onChange={(event) => field.setDraft(event.target.value)}
          onKeyDown={(event) => handleTypingKeys(event, field)}
          onBlur={() => field.submitDraft()}
        />
      ) : (
        <span>{field.text || <span className="text-muted-foreground">{field.placeholder}</span>}</span>
      )}
      {/* Dimmed from the value's own colour so it stays readable over any fill. */}
      {field.unit && (typing || field.text) && <span aria-hidden className="text-xs opacity-60">{field.unit}</span>}
    </span>
  );
});
