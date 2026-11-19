"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { InspectorFieldSegments } from "./inspector-field-segments";
import { useInspectorField } from "./inspector-field-state";
import { cn } from "@/lib/utils";

type ToggleProps = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  /** The committed value. The application owns it. */
  checked: boolean;
  /** Called when the choice changes. */
  onCommit: (checked: boolean) => void;
  /** Class for the highlight that slides to the chosen side. */
  highlightClassName?: string;
  /** Class for each side. The chosen one has data-selected. */
  segmentClassName?: string;
  /** Class for the hover box that slides to the unchosen side. */
  hoverClassName?: string;
};

/**
 * A built-in boolean control: compact Off and On segments at the row's end, with a highlight that
 * slides between them. While locked, the selected segment carries the lock.
 * It is a radio group, so arrow keys move the choice. A mixed selection highlights neither side.
 */
export const InspectorFieldToggle = forwardRef<HTMLDivElement, ToggleProps>(function InspectorFieldToggle({ checked, onCommit, className, ...props }, ref) {
  const field = useInspectorField();
  return (
    <div className={cn("flex h-[var(--uicoolkit-field-height,2.5rem)] min-w-0 items-center justify-end gap-2", field.inside ? "pr-1 pl-2" : "pl-3")}>
      <InspectorFieldSegments
        ref={ref}
        value={checked}
        options={[
          { value: false, label: field.messages.off },
          { value: true, label: field.messages.on },
        ]}
        onCommit={onCommit}
        className={className}
        {...props}
      />
    </div>
  );
});
