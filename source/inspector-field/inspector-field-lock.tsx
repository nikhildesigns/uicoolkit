"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { useInspectorField } from "./inspector-field-state";
import { cn } from "@/lib/utils";

/**
 * A lock inside a control while the property is locked; nothing otherwise. Built-in controls place
 * it themselves (after a text or select value, on the toggle's selected segment). In a hosted
 * control, show it in place of its adjust buttons, such as a Number Field's stepper.
 */
export const InspectorFieldLock = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function InspectorFieldLock(
  { className, children, ...props },
  ref,
) {
  const field = useInspectorField();
  if (!field.locked) return null;
  return (
    <span
      ref={ref}
      role="img"
      data-slot="lock"
      aria-label={field.messages.locked}
      title={field.reason}
      className={cn("inline-flex size-4 shrink-0 items-center justify-center self-center text-muted-foreground", className)}
      {...props}
    >
      {children ?? (
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </svg>
      )}
    </span>
  );
});
