"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactElement, type RefObject, forwardRef, useRef } from "react";
import { type AlignmentControlMessages, type AlignmentPosition, defaultMessages } from "./alignment-control-state";
import { cn } from "@/lib/utils";

const axis = ["start", "center", "end"] as const;
const cells = axis.flatMap((y) => axis.map((x) => ({ x, y })));
const same = (a: AlignmentPosition | null, b: AlignmentPosition) => !!a && a.x === b.x && a.y === b.y;

export type AlignmentGridProps = Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> & {
  /** Where the layer sits in its frame; null when it is between positions or a selection differs. */
  value: AlignmentPosition | null;
  /** Called with the position picked. Your app moves the layer. */
  onValueChange: (position: AlignmentPosition) => void;
  disabled?: boolean;
  /** Name each cell in a tooltip on hover, such as "Top left". On by default. */
  tooltips?: boolean;
  /** Tooltip entrance transitions. Reduced motion is always honored. */
  motion?: boolean;
  tooltipClassName?: string;
  /** Class for each cell and for the mark inside it. */
  cellClassName?: string;
  markClassName?: string;
  messages?: Partial<Pick<AlignmentControlMessages, "grid" | "position">>;
};

/**
 * Nine positions for a layer in its frame, as one radio group: arrow keys move across and down,
 * and the current position holds the tab stop.
 */
export const AlignmentGrid = forwardRef<HTMLDivElement, AlignmentGridProps>(function AlignmentGrid(
  { value, onValueChange, disabled = false, tooltips = true, motion = true, tooltipClassName, cellClassName, markClassName, messages: messagesProp, className, onKeyDown, ...props },
  ref,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  const root = useRef<HTMLDivElement | null>(null);
  // With no position, the centre takes the tab stop.
  const focusable = value ?? { x: "center", y: "center" };
  return (
    <div
      ref={(node) => {
        root.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role="radiogroup"
      aria-label={messages.grid}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      data-mixed={value === null || undefined}
      className={cn(
        "grid size-[calc(var(--uicoolkit-field-height,2.5rem)*2-0.5rem)] shrink-0 grid-cols-3 grid-rows-3 rounded-md border border-input bg-muted p-0.5 dark:bg-input/40 data-disabled:opacity-50",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        const from = (event.target as HTMLElement).dataset;
        if (!from.x || !from.y) return;
        const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
        if (!step) return;
        event.preventDefault();
        const x = axis[Math.min(2, Math.max(0, axis.indexOf(from.x as AlignmentPosition["x"]) + step[0]))];
        const y = axis[Math.min(2, Math.max(0, axis.indexOf(from.y as AlignmentPosition["y"]) + step[1]))];
        onValueChange({ x, y });
        event.currentTarget.querySelector<HTMLElement>(`[data-x="${x}"][data-y="${y}"]`)?.focus();
      }}
      {...props}
    >
      <Tooltip.Provider delay={400}>
        {cells.map((cell) => {
          const button = (
            <button
              key={`${cell.y}-${cell.x}`}
              type="button"
              role="radio"
              data-x={cell.x}
              data-y={cell.y}
              aria-checked={same(value, cell)}
              aria-label={messages.position(cell)}
              disabled={disabled}
              tabIndex={same(focusable, cell) ? 0 : -1}
              onClick={() => onValueChange(cell)}
              className={cn(
                "group/cell grid place-items-center rounded-sm outline-none focus-visible:bg-foreground/10 disabled:cursor-not-allowed",
                cellClassName,
              )}
            >
              {/* A dot for each spot; the current one becomes the layer, and hovering previews it. */}
              <span
                aria-hidden
                className={cn(
                  "size-1 rounded-full bg-muted-foreground/50 transition-all duration-150 motion-reduce:transition-none",
                  "group-enabled/cell:group-hover/cell:size-2 group-enabled/cell:group-hover/cell:rounded-[2px] group-enabled/cell:group-hover/cell:bg-muted-foreground",
                  "group-aria-checked/cell:size-2.5 group-aria-checked/cell:rounded-[3px] group-aria-checked/cell:bg-foreground",
                  markClassName,
                )}
              />
            </button>
          );
          // A cell's name on hover, as with the toolbar's buttons; disabled cells skip it.
          return tooltips && !disabled ? (
            <CellTip key={`${cell.y}-${cell.x}`} label={messages.position(cell)} container={root} motion={motion} className={tooltipClassName}>
              {button}
            </CellTip>
          ) : (
            button
          );
        })}
      </Tooltip.Provider>
    </div>
  );
});

type CellTipProps = { label: string; container: RefObject<HTMLDivElement | null>; motion: boolean; className?: string; children: ReactElement };

/** A cell's name on hover, portalled into the grid so it keeps the grid's theme. */
function CellTip({ label, container, motion, className, children }: CellTipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal container={container}>
        <Tooltip.Positioner side="top" sideOffset={6} positionMethod="fixed" className="z-50">
          <Tooltip.Popup
            className={cn(
              "rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md",
              motion &&
                "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
              className,
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
