"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { InspectorFieldLock } from "./inspector-field-lock";
import { useInspectorField } from "./inspector-field-state";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  /** Whether it is on, or null when a selection differs. The application owns it. */
  checked: boolean | null;
  /** Called with the new state; a Mixed checkbox turns on. */
  onCommit: (checked: boolean) => void;
  /** Shortcut text shown after the label, such as "⌥C". Your app binds the key. */
  shortcut?: string;
  /** Class for the box itself. */
  boxClassName?: string;
};

/**
 * A built-in checkbox row, such as Clip content: the box first and the row's label beside it, across
 * the whole row, so it needs no InspectorFieldLabel. Mixed shows a dash; locked rows show the lock.
 */
export const InspectorFieldCheckbox = forwardRef<HTMLDivElement, CheckboxProps>(function InspectorFieldCheckbox(
  { checked, onCommit, shortcut, boxClassName, className, ...props },
  ref,
) {
  const field = useInspectorField();
  const mixed = field.mixed || checked === null;
  const blocked = !field.editable || field.pending;
  const off = field.disabled || field.locked || field.unavailable;
  return (
    <div
      ref={ref}
      data-slot="checkbox"
      className={cn(
        // It spans the label and control columns, in either label position.
        "col-span-2 col-start-1 flex h-[var(--uicoolkit-field-height,2.5rem)] min-w-0 items-center gap-2.5 [grid-area:1/1/2/3]!",
        field.inside && "px-3.5",
        off && "opacity-50",
        className,
      )}
      {...props}
    >
      <Checkbox.Root
        id={field.controlId}
        checked={!mixed && !!checked}
        indeterminate={mixed}
        disabled={off}
        readOnly={blocked}
        aria-labelledby={field.labelId}
        aria-describedby={field.describedBy}
        aria-keyshortcuts={shortcut}
        onCheckedChange={(next) => {
          if (blocked || off) return;
          onCommit(mixed ? true : next);
        }}
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[4px] border border-input bg-transparent text-primary-foreground shadow-xs outline-none transition-colors duration-150 motion-reduce:transition-none",
          "focus-visible:ring-1 focus-visible:ring-ring data-[checked]:border-primary data-[checked]:bg-primary data-[indeterminate]:border-primary data-[indeterminate]:bg-primary",
          boxClassName,
        )}
      >
        <Checkbox.Indicator className="flex data-[unchecked]:hidden">
          <svg aria-hidden viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
            {mixed ? <path d="M4 8h8" /> : <path d="m3.5 8.5 3 3 6-7" />}
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Root>
      {/* Clicking the text toggles the box, as with a native label. */}
      <span
        id={field.labelId}
        className="min-w-0 truncate text-foreground select-none"
        onClick={() => {
          if (!blocked && !off) onCommit(mixed ? true : !checked);
        }}
      >
        {field.label}
      </span>
      {shortcut && <kbd className="font-sans text-muted-foreground">{shortcut}</kbd>}
      <InspectorFieldLock className="ml-auto" />
    </div>
  );
});
