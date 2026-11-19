"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type CSSProperties, type ReactNode, createContext, forwardRef, useContext } from "react";
import { InspectorField, InspectorFieldLabel, InspectorFieldMessage, InspectorFieldValue, type InspectorFieldProps } from "@/components/ui/inspector-field";
import { usePropertyInspector } from "./property-inspector-state";
import { cn } from "@/lib/utils";

/** What every row needs to know about its property. */
export type PropertyInspectorRowOptions = {
  /** The key read from each selected item, such as "width". */
  property: string;
  /** The property's full name, such as "Rotation". Screen readers always read it. */
  label: string;
  /**
   * What a grid cell shows inside its field in place of the label: a short label such as "X" or "W",
   * or an icon, which shows the full label in a tooltip on hover. Without one, a grid cell shows the full label, or none for controls that label
   * themselves (segments, the Alignment Grid, Split Number Field).
   */
  shortLabel?: ReactNode;
  /** In a PropertyInspectorGrid: how many columns the row covers. */
  span?: number;
  /** In a PropertyInspectorGrid: how many rows the row covers, such as the Alignment Grid beside two fields. */
  rowSpan?: number;
  /**
   * Read the property part by part, such as padding's ["top", "right", "bottom", "left"]: each part
   * merges across the selection on its own, so only the parts that differ read Mixed.
   */
  parts?: readonly string[];
  /** Controlled by something else; shows a lock and disables the control. */
  locked?: boolean;
  /** Why the property is locked. */
  reason?: string;
  hint?: string;
  readOnly?: boolean;
  /** Only editable with one item selected, such as a name; unavailable for several. */
  single?: boolean;
};

/** Where a row sits: in a group's rows, or in a compact grid's cells. */
export type PropertyInspectorCell = {
  /** The row is a cell of a PropertyInspectorGrid: its label is inside the field and it takes spans. */
  grid: boolean;
  /** A grid cell with no short label: its control fills the cell and the label is for screen readers only. */
  bare: boolean;
  /** The visible label: the short label in a grid cell, otherwise the full label, with the full one always read. */
  label: ReactNode;
};

/**
 * A property bound to the selection: its value, Mixed state and actions, plus the Inspector Field
 * props for the row. A plain property's value is null while the selection differs. A property read
 * by parts holds every part, null for each part that differs (listed in `mixedParts`).
 */
export type PropertyInspectorBinding<V = unknown> = {
  value: V | null;
  mixed: boolean;
  mixedParts: string[];
  count: number;
  /** Live value while dragging or holding, for a canvas preview. Name the parts it sets. */
  preview: (value: V, changed?: string[]) => void;
  /** One finished edit for every selected item. Name the parts it sets, so the others keep their values. */
  commit: (value: V, changed?: string[]) => void;
  /** Spread onto an InspectorField: label, Mixed, locked, unavailable, disabled, label position and grid placement. */
  field: Omit<InspectorFieldProps, "children">;
  cell: PropertyInspectorCell;
};

const GridContext = createContext(false);

/** Whether the row is a cell of a PropertyInspectorGrid. */
export const useInGrid = () => useContext(GridContext);

/** Binds one property to the selection, for hosting any control in a row. */
export function usePropertyInspectorProperty<V = unknown>({
  property,
  label,
  shortLabel,
  span,
  rowSpan,
  parts,
  single,
  locked,
  reason,
  hint,
  readOnly,
}: PropertyInspectorRowOptions): PropertyInspectorBinding<V> {
  const inspector = usePropertyInspector();
  const grid = useContext(GridContext);
  const reading = inspector.read(property, parts);
  const unavailable = !!single && inspector.count > 1;
  // A grid cell without a short label draws no row box, so its control keeps its own box or track.
  const bare = grid && shortLabel === undefined;
  const style: CSSProperties | undefined = grid ? { gridColumn: span ? `span ${span}` : undefined, gridRow: rowSpan ? `span ${rowSpan}` : undefined } : undefined;
  return {
    value: parts ? (reading.value as V) : reading.mixed ? null : ((reading.value ?? null) as V | null),
    mixed: reading.mixed,
    mixedParts: reading.mixedParts,
    count: reading.count,
    preview: (value, changed) => inspector.preview(property, value, changed),
    commit: (value, changed) => inspector.commit(property, value, changed),
    field: {
      label,
      // A property read by parts shows Mixed in the parts that differ, not across the whole row.
      mixed: parts ? false : reading.mixed,
      locked,
      unavailable,
      reason: unavailable ? inspector.messages.single : reason,
      hint,
      readOnly,
      disabled: inspector.disabled,
      motion: inspector.animated,
      // A grid cell carries its label inside, with the value right after it.
      labelPosition: bare ? "outside" : grid ? "inside" : inspector.labelPosition,
      align: grid ? "start" : undefined,
      style,
      messages: { mixed: inspector.messages.mixed },
    },
    cell: {
      grid,
      bare,
      label:
        grid && shortLabel !== undefined ? (
          <>
            {/* As tall as the label's line and centred in it, so an icon sits on the value's centre line like a letter does. */}
            {typeof shortLabel === "string" || typeof shortLabel === "number" ? (
              <span aria-hidden className="inline-flex h-[1lh] items-center align-top">
                {shortLabel}
              </span>
            ) : (
              // An icon names nothing on its own, so hovering it shows the full label.
              <ShortLabelTip label={label} container={inspector.container} animated={inspector.animated}>
                {shortLabel}
              </ShortLabelTip>
            )}
            <span className="sr-only">{label}</span>
          </>
        ) : (
          label
        ),
    },
  };
}

type TipProps = { label: string; container: HTMLElement | null | undefined; animated: boolean; children: ReactNode };

/** An icon short label with a tooltip naming the property. Screen readers read the label beside it instead. */
function ShortLabelTip({ label, container, animated, children }: TipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={400}
        render={<span aria-hidden className="inline-flex h-[1lh] items-center align-top [&_svg]:size-3.5" />}
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal container={container ?? undefined}>
        <Tooltip.Positioner side="top" sideOffset={8} positionMethod="fixed" className="z-50">
          <Tooltip.Popup
            className={cn(
              "rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md",
              animated &&
                "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

type GridProps = ComponentPropsWithoutRef<"div"> & {
  /** How many equal columns, or any CSS grid-template-columns value. */
  columns?: number | string;
};

/**
 * The compact form for a group, as design tools lay out Position, Size and Auto layout: rows become
 * cells of a grid (three columns by default) with their labels inside the fields. Rows take `span`
 * and `rowSpan`; a group can mix a grid with plain rows.
 */
export const PropertyInspectorGrid = forwardRef<HTMLDivElement, GridProps>(function PropertyInspectorGrid({ columns = 3, className, style, ...props }, ref) {
  return (
    <GridContext.Provider value={true}>
      <div
        ref={ref}
        data-slot="grid"
        className={cn("grid items-start gap-2 [--inspector-label-width:auto]", className)}
        style={{ gridTemplateColumns: typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns, ...style }}
        {...props}
      />
    </GridContext.Provider>
  );
});

type FieldProps<V> = PropertyInspectorRowOptions & {
  /** Renders the control with the property's binding. */
  children: (binding: PropertyInspectorBinding<V>) => ReactNode;
  /** The control shows the label itself, such as a checkbox, so the row draws none. */
  ownLabel?: boolean;
  className?: string;
};

/**
 * The generic row: hosts any control with the property's value, Mixed state and preview and
 * commit, inside an Inspector Field with its label, lock, reasons and message. The built-in rows
 * are this row with a control already wired. In a grid cell without a short label, the control
 * fills the cell and its label is read but not shown.
 */
export function PropertyInspectorField<V = unknown>({ children, ownLabel = false, className, ...options }: FieldProps<V>) {
  const binding = usePropertyInspectorProperty<V>(options);
  const { bare, label } = binding.cell;
  return (
    <InspectorField className={className} {...binding.field}>
      {binding.field.unavailable ? (
        <>
          <InspectorFieldLabel>{label}</InspectorFieldLabel>
          <InspectorFieldValue />
        </>
      ) : bare ? (
        <>
          {!ownLabel && <InspectorFieldLabel className="sr-only" />}
          <div className="min-w-0 [grid-area:1/1/2/3]!">{children(binding)}</div>
        </>
      ) : (
        <>
          {!ownLabel && <InspectorFieldLabel>{label}</InspectorFieldLabel>}
          {children(binding)}
        </>
      )}
      <InspectorFieldMessage />
    </InspectorField>
  );
}
