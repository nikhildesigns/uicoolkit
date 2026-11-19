"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { cloneElement, forwardRef, useId, useRef, useState } from "react";
import { type InspectorFieldContextValue, type InspectorFieldProps, InspectorFieldContext, defaultMessages, mergeRefs } from "./inspector-field-state";
import { cn } from "@/lib/utils";

/**
 * One property row: the label and the control (with a lock inside it when locked), with an optional
 * message below. Columns line up across rows; set `--inspector-label-width` to change the label column.
 * Why a property is locked or unavailable shows in a tooltip while the row is hovered.
 */
export const InspectorField = forwardRef<HTMLDivElement, InspectorFieldProps>(function InspectorField(
  {
    label,
    mixed = false,
    readOnly = false,
    locked = false,
    unavailable = false,
    reason,
    disabled = false,
    pending = false,
    hint,
    motion = true,
    align = "end",
    labelPosition = "outside",
    messages: messagesProp,
    tooltipClassName,
    className,
    children,
    ...props
  },
  ref,
) {
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const messages = { ...defaultMessages, ...messagesProp };
  const editable = !readOnly && !locked && !unavailable && !disabled;
  const showsReason = (locked || unavailable) && !!reason;
  // Locked and unavailable reasons show on hover rather than taking space below the row.
  const hoverReason = showsReason;
  const hasMessage = !!error || showsReason || !!hint;

  const context: InspectorFieldContextValue = {
    label,
    mixed,
    readOnly,
    locked,
    unavailable,
    disabled,
    pending,
    editable,
    reason,
    hint,
    animated: motion,
    align,
    inside: labelPosition === "inside",
    messages,
    error,
    setError,
    describedBy: hasMessage ? `${id}-message` : undefined,
    labelId: `${id}-label`,
    controlId: `${id}-control`,
    messageId: `${id}-message`,
    rootRef,
  };

  const row = (
      <div
        ref={mergeRefs(ref, rootRef)}
        data-align={align}
        data-label-position={labelPosition}
        data-mixed={mixed || undefined}
        data-readonly={readOnly || undefined}
        data-locked={locked || undefined}
        data-unavailable={unavailable || undefined}
        data-disabled={disabled || undefined}
        data-pending={pending || undefined}
        data-invalid={error ? true : undefined}
        // With the label inside, the row is the field's box: hosted menus open under all of it.
        data-menu-anchor={labelPosition === "inside" || undefined}
        aria-busy={pending || undefined}
        className={cn(
          // Two columns: label and control, with messages under the control.
          // Parts find their place by data-slot: direct children, or one level down inside a hosted
          // control that uses className="contents" (its scrub area or error).
          "group/inspector grid grid-cols-[var(--inspector-label-width,6rem)_minmax(0,1fr)] items-center gap-x-2 text-sm [grid-template-areas:'label_control'_'._error'_'._message']",
          "[&>[data-slot=label]]:[grid-area:label] [&>*>[data-slot=scrub]]:[grid-area:label]",
          // A hosted Number Field slider takes the control column at the row's height.
          "[&>*>[data-slot=slider]]:h-[var(--uicoolkit-field-height,2.5rem)] [&>*>[data-slot=slider]]:[grid-area:control]",
          "[&>*>[data-slot=error]]:mt-1 [&>*>[data-slot=error]]:[grid-area:error] [&>[data-slot=message]]:mt-1 [&>[data-slot=message]]:[grid-area:message]",
          labelPosition === "inside" && [
            // One box around the whole first row, drawn behind the label and control. Messages sit below it.
            "isolate grid-cols-[auto_minmax(0,1fr)] gap-x-0 [grid-template-areas:'label_control'_'error_error'_'message_message']",
            "before:-z-10 before:h-[var(--uicoolkit-field-height,2.5rem)] before:rounded-md before:border before:border-[color:var(--uicoolkit-field-border,var(--input))] before:bg-[var(--uicoolkit-field-bg,transparent)] before:shadow-[var(--uicoolkit-field-shadow,0_1px_2px_0_rgb(0_0_0/0.05))] before:[grid-area:1/1/2/3]",
            "has-focus-visible:before:border-ring has-data-[popup-open]:before:border-ring",
            "has-[[aria-invalid=true]]:before:border-destructive data-disabled:before:opacity-50 data-unavailable:before:opacity-50",
            // The box fills the first row, so controls are placed explicitly instead of auto-placed after it.
            "[&>:not([data-slot=label],[data-slot=message])]:[grid-area:control] [&>*>[data-slot=group]]:[grid-area:control]",
            "[&>[data-slot=label]]:pr-2 [&>[data-slot=label]]:pl-3.5 [&>*>[data-slot=scrub]]:h-[var(--uicoolkit-field-height,2.5rem)] [&>*>[data-slot=scrub]]:pr-2 [&>*>[data-slot=scrub]]:pl-3.5",
            // A hosted control's own box gives way to the row's.
            "[&>*>[data-slot=group]]:border-transparent! [&>*>[data-slot=group]]:bg-transparent! [&>*>[data-slot=group]]:shadow-none! [&>*>[data-slot=group]]:ring-0!",
            // A slider is already a box with its label inside, so it becomes the whole row.
            "has-[>*>[data-slot=slider]]:before:hidden [&>*>[data-slot=slider]]:[grid-area:1/1/2/3]",
          ],
          className,
        )}
        {...props}
      />
  );
  return (
    <InspectorFieldContext.Provider value={context}>
      {hoverReason ? (
        <Tooltip.Root>
          <Tooltip.Trigger render={row}>{children}</Tooltip.Trigger>
          <Tooltip.Portal container={rootRef}>
            <Tooltip.Positioner side="top" align="end" sideOffset={6} positionMethod="fixed" className="z-50">
              <Tooltip.Popup
                className={cn(
                  "max-w-60 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md",
                  motion &&
                    "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
                  tooltipClassName,
                )}
              >
                {reason}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ) : (
        cloneElement(row, undefined, children)
      )}
    </InspectorFieldContext.Provider>
  );
});
