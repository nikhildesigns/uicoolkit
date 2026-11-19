"use client";

import { type ComponentPropsWithoutRef, type MutableRefObject, type Ref, createContext, useContext } from "react";

/** Replaceable text for the field's states and the built-in toggle. */
export type InspectorFieldMessages = {
  mixed: string;
  unavailable: string;
  locked: string;
  off: string;
  on: string;
  /** The search field's placeholder in a searchable select. */
  search: string;
  /** Shown in a searchable select when nothing matches. */
  noResults: string;
};

export const defaultMessages: InspectorFieldMessages = {
  mixed: "Mixed",
  unavailable: "Not available",
  locked: "Locked",
  off: "Off",
  on: "On",
  search: "Search",
  noResults: "Nothing matches.",
};

/** The shared box for built-in controls, matching Number Field's 40px field. */
export const box =
  "h-[var(--uicoolkit-field-height,2.5rem)] w-full min-w-0 rounded-md border border-[color:var(--uicoolkit-field-border,var(--input))] bg-[var(--uicoolkit-field-bg,transparent)] text-sm shadow-[var(--uicoolkit-field-shadow,0_1px_2px_0_rgb(0_0_0/0.05))] outline-none focus-visible:border-ring disabled:opacity-50 data-[disabled]:opacity-50";

export type InspectorFieldProps = ComponentPropsWithoutRef<"div"> & {
  /** Name of the property, such as "Width". Labels the control. */
  label: string;
  /** The selection holds different values; the control shows a "Mixed" placeholder. */
  mixed?: boolean;
  /** Shown but not editable here. */
  readOnly?: boolean;
  /** Controlled by something else: the control is disabled and a lock shows beside the label. Explain why with `reason`. */
  locked?: boolean;
  /** Does not apply to the selection; shows a dash. Explain why with `reason`. */
  unavailable?: boolean;
  /** Why the property is locked or unavailable. Shown in a tooltip while the row is hovered, and read with the field. */
  reason?: string;
  disabled?: boolean;
  /** A change is being applied; the control waits. */
  pending?: boolean;
  /** Short guidance shown below the field when there is no reason or error to show. */
  hint?: string;
  /** Entrance transitions for messages. Reduced motion is always honored. */
  motion?: boolean;
  /** Where values sit inside built-in controls: "end" (right, the default) or "start" (left). */
  align?: InspectorFieldAlign;
  /**
   * "outside" (the default) puts the label in its own column beside the control's box.
   * "inside" draws one box around the whole row, with the label at its start, as many design tools do.
   */
  labelPosition?: InspectorFieldLabelPosition;
  /** Class for the tooltip that shows why the property is locked or unavailable. */
  tooltipClassName?: string;
  messages?: Partial<InspectorFieldMessages>;
};

export type InspectorFieldAlign = "start" | "end";
export type InspectorFieldLabelPosition = "outside" | "inside";

/** Built-in controls drop their own box when the row draws one around the label and control. */
export const insideControl =
  "pr-3.5 border-transparent bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-transparent aria-invalid:ring-0 hover:bg-transparent data-[popup-open]:border-transparent";

export type InspectorFieldContextValue = {
  label: string;
  mixed: boolean;
  readOnly: boolean;
  locked: boolean;
  unavailable: boolean;
  disabled: boolean;
  pending: boolean;
  /** Not read-only, locked, unavailable or disabled. */
  editable: boolean;
  reason?: string;
  hint?: string;
  animated: boolean;
  messages: InspectorFieldMessages;
  align: InspectorFieldAlign;
  /** The row draws the box, with the label inside it. */
  inside: boolean;
  /** A rejected value's message from a built-in control, or null. */
  error: string | null;
  setError: (error: string | null) => void;
  /** The id of the message below the field, or undefined while there is none. */
  describedBy: string | undefined;
  labelId: string;
  controlId: string;
  messageId: string;
  rootRef: MutableRefObject<HTMLDivElement | null>;
};

export const InspectorFieldContext = createContext<InspectorFieldContextValue | null>(null);

/** State of the nearest InspectorField, for building custom parts or wiring another control. */
export function useInspectorField() {
  const context = useContext(InspectorFieldContext);
  if (!context) throw new Error("InspectorField parts must be rendered inside <InspectorField>.");
  return context;
}

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}
