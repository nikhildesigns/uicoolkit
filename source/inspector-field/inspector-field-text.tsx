"use client";

import { type ComponentPropsWithoutRef, forwardRef, useRef, useState } from "react";
import { InspectorFieldLock } from "./inspector-field-lock";
import { InspectorFieldValue } from "./inspector-field-parts";
import { box, insideControl, useInspectorField } from "./inspector-field-state";
import { cn } from "@/lib/utils";

/** "boxed" is a field like Number Field's; "ghost" reads as plain text until hovered or focused. */
export type InspectorFieldTextVariant = "boxed" | "ghost";

type TextProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange"> & {
  variant?: InspectorFieldTextVariant;
  /** The committed text. The application owns it. */
  value: string;
  /** Called once per finished edit, with text that changed and passed `validate`. */
  onCommit: (value: string) => void;
  /** Return a message to reject the text; it stays in the field for fixing. */
  validate?: (value: string) => string | null | undefined;
};

/**
 * A built-in text control for the second column. Enter or leaving the field commits,
 * Escape reverts. With a mixed selection it starts empty and typing applies to every item.
 */
export const InspectorFieldText = forwardRef<HTMLInputElement, TextProps>(function InspectorFieldText(
  { value, onCommit, validate, variant = "boxed", className, placeholder, onKeyDown, onBlur, onFocus, ...props },
  ref,
) {
  const field = useInspectorField();
  const [draft, setDraftState] = useState<string | null>(null);
  // Mirrors the draft so the blur that follows Enter or Escape cannot commit it again.
  const draftRef = useRef<string | null>(null);
  const setDraft = (next: string | null) => {
    draftRef.current = next;
    setDraftState(next);
  };

  if (field.unavailable) return <InspectorFieldValue />;

  const revert = () => {
    setDraft(null);
    field.setError(null);
  };

  const submit = () => {
    const text = draftRef.current;
    if (text === null) return;
    if (!field.mixed && text === value) return revert();
    const message = validate?.(text);
    if (message) return field.setError(message);
    revert();
    onCommit(text);
  };

  return (
    <div className="relative min-w-0">
      <InspectorFieldLock className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
      <input
        ref={ref}
        id={field.controlId}
        type="text"
        autoComplete="off"
        aria-describedby={field.describedBy}
        aria-invalid={field.error ? true : undefined}
        disabled={field.disabled || field.locked}
        readOnly={!field.editable || field.pending}
        placeholder={field.mixed ? field.messages.mixed : placeholder}
        data-variant={variant}
        data-locked={field.locked || undefined}
        className={cn(
          box,
          "px-3 placeholder:text-muted-foreground data-locked:pr-9 group-data-pending/inspector:animate-pulse aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          field.align === "start" ? "text-start" : "text-end",
          variant === "ghost" && "border-transparent shadow-none hover:bg-accent/60 focus-visible:bg-transparent read-only:hover:bg-transparent",
          field.inside && insideControl,
          className,
        )}
        {...props}
        value={draft ?? (field.mixed ? "" : value)}
        onFocus={(event) => {
          onFocus?.(event);
          event.currentTarget.select();
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          if (field.error) field.setError(null);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) {
            event.preventDefault();
            submit();
          } else if (event.key === "Escape" && draftRef.current !== null) {
            // Stop here so an enclosing sheet or popover stays open.
            event.preventDefault();
            event.stopPropagation();
            revert();
          }
        }}
        onBlur={(event) => {
          onBlur?.(event);
          submit();
        }}
      />
    </div>
  );
});
