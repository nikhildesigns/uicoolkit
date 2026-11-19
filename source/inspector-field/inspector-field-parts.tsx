"use client";

import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";
import { InspectorFieldLock } from "./inspector-field-lock";
import { box, useInspectorField } from "./inspector-field-state";
import { cn } from "@/lib/utils";

/** The property name, in the first column. Clicking it focuses a built-in control (data-slot="label"). */
export const InspectorFieldLabel = forwardRef<HTMLLabelElement, ComponentPropsWithoutRef<"label">>(function InspectorFieldLabel(
  { className, children, ...props },
  ref,
) {
  const { label, labelId, controlId } = useInspectorField();
  return (
    <label
      ref={ref}
      id={labelId}
      htmlFor={controlId}
      data-slot="label"
      className={cn("truncate text-xs text-muted-foreground select-none group-data-unavailable/inspector:opacity-60", className)}
      {...props}
    >
      {children ?? label}
    </label>
  );
});

/**
 * A read-only value. Shows the mixed placeholder, or a dash when there is no single value.
 * While unavailable it reads as a disabled field.
 */
export const InspectorFieldValue = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function InspectorFieldValue(
  { className, children, ...props },
  ref,
) {
  const { mixed, unavailable, messages, align, inside, controlId, labelId, describedBy } = useInspectorField();
  return (
    <span
      ref={ref}
      id={controlId}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-disabled={unavailable || undefined}
      data-unavailable={unavailable || undefined}
      className={cn(
        // Same 40px height as the editable controls, so rows line up.
        "flex h-[var(--uicoolkit-field-height,2.5rem)] min-w-0 items-center gap-1 truncate px-3 tabular-nums",
        align === "start" ? "justify-start text-start [&>[data-slot=lock]]:ml-auto" : "justify-end text-end",
        (mixed || unavailable) && "text-muted-foreground",
        // An unavailable property looks like a disabled field; the row draws the box when the label is inside.
        unavailable && (inside ? "cursor-not-allowed" : cn(box, "cursor-not-allowed opacity-50")),
        inside && "pr-3.5",
        className,
      )}
      {...props}
    >
      {unavailable ? (
        <>
          <span aria-hidden>—</span>
          <span className="sr-only">{messages.unavailable}</span>
        </>
      ) : mixed ? (
        messages.mixed
      ) : (
        children
      )}
      <InspectorFieldLock className="self-center" />
    </span>
  );
});

/** A unit after a read-only value, such as "px". */
export const InspectorFieldUnit = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function InspectorFieldUnit({ className, ...props }, ref) {
  return <span ref={ref} className={cn("text-xs opacity-60", className)} {...props} />;
});

/**
 * What a custom control needs from the field. Spread `props` onto it and give `describedBy` to its
 * input; while `locked`, show InspectorFieldLock in place of its own adjust buttons.
 */
export type InspectorFieldControlState = {
  props: { label: string; disabled: boolean; readOnly: boolean; placeholder?: string };
  describedBy: string | undefined;
  locked: boolean;
  /** Apply to the hosted control's value, for example `text-start` on a NumberFieldInput. */
  align: "start" | "end";
};

type ControlProps = {
  /** Renders another control, such as a NumberField, with the field's state applied. */
  children: (control: InspectorFieldControlState) => ReactNode;
  /** Shown instead while the property is unavailable. Defaults to the label and a dash. */
  unavailableFallback?: ReactNode;
};

/**
 * A slot for another control. It renders no element of its own, so a control with
 * `className="contents"` can place its own label in the first column (for example a
 * NumberFieldScrubArea, so dragging the label adjusts the value).
 */
export function InspectorFieldControl({ children, unavailableFallback }: ControlProps) {
  const field = useInspectorField();
  if (field.unavailable)
    return (
      unavailableFallback ?? (
        <>
          <InspectorFieldLabel />
          <InspectorFieldValue />
        </>
      )
    );
  return children({
    props: {
      label: field.label,
      disabled: field.disabled || field.locked,
      readOnly: field.readOnly || field.pending,
      placeholder: field.mixed ? field.messages.mixed : undefined,
    },
    describedBy: field.describedBy,
    locked: field.locked,
    align: field.align,
  });
}

/** Rejected values first, then why the field is locked or unavailable, then the hint. */
export const InspectorFieldMessage = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(function InspectorFieldMessage(
  { className, children, ...props },
  ref,
) {
  const { error, reason, hint, locked, unavailable, messageId, animated } = useInspectorField();
  const content = error ?? ((locked || unavailable) && reason ? reason : (children ?? hint));
  if (!content) return null;
  // A locked or unavailable property's reason shows on hover instead, but stays the field's description.
  const hoverOnly = !error && (locked || unavailable) && !!reason;
  return (
    <p
      ref={ref}
      id={messageId}
      data-slot="message"
      role={error ? "alert" : undefined}
      className={cn("px-2 text-xs text-muted-foreground", hoverOnly && "sr-only", error && "text-destructive", animated && error && "transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none", className)}
      {...props}
    >
      {content}
    </p>
  );
});
