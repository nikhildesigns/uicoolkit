"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type ReactNode, createContext, forwardRef, useContext, useId, useState } from "react";
import { PropertyInspectorContext, usePropertyInspector } from "./property-inspector-state";
import { cn } from "@/lib/utils";

/** How deep a group sits: 0 for a section such as Layout, 1 for a sub-group such as Flex inside it. */
const DepthContext = createContext(0);

type GroupProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  title: ReactNode;
  /** Names the group for its buttons and screen readers when the title is not plain text. */
  label?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Buttons at the end of the header, such as + to add another fill. Use PropertyInspectorGroupAction. */
  actions?: ReactNode;
  /**
   * Makes the group optional, such as Flex or a layout grid: says whether a selected item has it.
   * With none, the group shows only its header and +; otherwise its fields read and edit only the
   * items that have it, with − to remove it and, while some lack it, + to add it to the rest.
   */
  present?: (item: Record<string, unknown>) => boolean;
  /** Called with the ids of the selected items that lack the group. */
  onAdd?: (ids: string[]) => void;
  /** Called with the ids of the selected items that have the group. */
  onRemove?: (ids: string[]) => void;
  /** Whether the header opens and closes the group. A list such as Fills stays open, with only its actions. */
  collapsible?: boolean;
};

const chevron = (open: boolean, animated: boolean) => (
  // At the end of the header, as in an accordion: down while closed, up while open.
  <svg
    aria-hidden
    viewBox="0 0 10 6"
    className={cn("pointer-events-none h-1.5 w-2.5 shrink-0", open && "rotate-180", animated && "transition-transform duration-150 motion-reduce:transition-none")}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1.5 1.25 5 4.75l3.5-3.5" />
  </svg>
);

export const plus = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <path d="M8 3.5v9M3.5 8h9" />
  </svg>
);
export const minus = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <path d="M3.5 8h9" />
  </svg>
);

/**
 * A collapsible group of fields, such as Position or Size, hidden while nothing is selected. A group
 * inside a group is a sub-group, such as Flex inside Layout. Optional groups show + and − in place of
 * the chevron and scope their fields to the items that have them.
 */
export const PropertyInspectorGroup = forwardRef<HTMLDivElement, GroupProps>(function PropertyInspectorGroup(
  { title, label, defaultOpen = true, open: openProp, onOpenChange, actions, present, onAdd, onRemove, collapsible = true, className, children, ...props },
  ref,
) {
  const inspector = usePropertyInspector();
  const depth = useContext(DepthContext);
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const id = useId();
  if (inspector.count === 0) return null;

  const optional = present !== undefined;
  const having = optional ? inspector.records.filter(present) : inspector.records;
  const lacking = optional ? inspector.records.filter((item) => !present(item)) : [];
  const open = optional ? having.length > 0 : !collapsible || (openProp ?? uncontrolled);
  const toggles = !optional && collapsible;
  const name = label ?? (typeof title === "string" ? title : "");
  const sub = depth > 0;

  const toggle = () => {
    if (openProp === undefined) setUncontrolled(!open);
    onOpenChange?.(!open);
  };

  return (
    <div
      ref={ref}
      data-open={open || undefined}
      data-optional={optional || undefined}
      data-mixed={(optional && having.length > 0 && lacking.length > 0) || undefined}
      className={cn(sub ? "pt-1" : "border-t border-border pt-1 first:border-t-0", className)}
      {...props}
    >
      <div className="relative flex h-8 items-center gap-1">
        {toggles && (
          // The whole header toggles; the title names it, and header actions sit above it.
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-content`}
            aria-labelledby={`${id}-title`}
            className="peer absolute inset-0 rounded-md outline-none focus-visible:bg-foreground/5"
            onClick={toggle}
          />
        )}
        <span
          id={`${id}-title`}
          className={cn(
            "pointer-events-none min-w-0 flex-1 truncate text-left",
            // Sections and sub-groups share one title style; a sub-group only drops the divider.
            "text-xs font-medium tracking-wide text-muted-foreground uppercase",
            // Compact panels title groups like body text.
            "in-data-[density=compact]:text-[13px] in-data-[density=compact]:tracking-normal in-data-[density=compact]:text-foreground in-data-[density=compact]:normal-case",
            toggles && !sub && "peer-hover:text-foreground",
          )}
        >
          {title}
        </span>
        {(actions || optional) && (
          <Tooltip.Provider delay={400}>
            <div className="relative z-10 flex items-center">
              {actions}
              {optional && having.length > 0 && <PropertyInspectorGroupAction label={inspector.messages.remove(name)} icon={minus} onAction={() => onRemove?.(having.map((item) => item.id as string))} />}
              {optional && lacking.length > 0 && <PropertyInspectorGroupAction label={inspector.messages.add(name)} icon={plus} onAction={() => onAdd?.(lacking.map((item) => item.id as string))} />}
            </div>
          </Tooltip.Provider>
        )}
        {/* Header icons sit in a 32px slot at the right edge, the same line as the fields' trailing buttons. */}
        {/* Hovering the header gives the chevron the same soft box as the header's + and − buttons. */}
        {toggles && (
          <span
            className={cn(
              "pointer-events-none grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground peer-hover:bg-foreground/10 peer-active:bg-foreground/15",
              !sub && "peer-hover:text-foreground",
              inspector.animated && "transition-colors duration-100 motion-reduce:transition-none",
            )}
          >
            {chevron(open, inspector.animated)}
          </span>
        )}
      </div>
      {/* Collapses to zero height; inert keeps hidden fields out of the tab order. */}
      <div
        id={`${id}-content`}
        aria-hidden={!open || undefined}
        ref={element => { element?.toggleAttribute("inert", !open); }}
        className={cn("grid", open ? "grid-rows-[1fr]" : "invisible grid-rows-[0fr]", inspector.animated && "transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none")}
      >
        <div className="-mx-1 min-h-0 overflow-hidden px-1">
          {/* A group with nothing inside, such as a list with no entries, adds no space under its header. */}
          <div className={cn("grid gap-1 pt-1 empty:py-0", sub ? "pb-1" : "pb-2")}>
            <DepthContext.Provider value={depth + 1}>
              {optional ? <PropertyInspectorContext.Provider value={inspector.scope(present)}>{children}</PropertyInspectorContext.Provider> : children}
            </DepthContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
});

type GroupActionProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  /** Names the action and fills its tooltip, such as "Add fill". */
  label: string;
  icon: ReactNode;
  onAction: () => void;
};

/** A small icon button for a group's header, such as + to add another fill. Off while the inspector is disabled. */
export const PropertyInspectorGroupAction = forwardRef<HTMLButtonElement, GroupActionProps>(function PropertyInspectorGroupAction(
  { label, icon, onAction, className, disabled, onClick, ...props },
  ref,
) {
  const inspector = usePropertyInspector();
  const off = !!disabled || inspector.disabled;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <button
            ref={ref}
            type="button"
            aria-label={label}
            disabled={off}
            className={cn(
              "grid size-8 place-items-center rounded-md text-muted-foreground outline-none [&_svg]:size-4",
              "hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15 focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50",
              inspector.animated && "transition-colors duration-100 motion-reduce:transition-none",
              className,
            )}
            onClick={(event) => {
              onClick?.(event);
              if (!event.defaultPrevented && !off) onAction();
            }}
            {...props}
          >
            {icon}
          </button>
        }
      />
      <Tooltip.Portal container={inspector.container ?? undefined}>
        <Tooltip.Positioner side="top" sideOffset={6} positionMethod="fixed" className="z-50">
          <Tooltip.Popup
            className={cn(
              "rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md",
              inspector.animated &&
                "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});

/**
 * Puts related fields side by side in one line, such as X and Y or W and H. Each keeps its own
 * label, message and states; labels outside shrink to fit instead of taking the label column.
 */
export const PropertyInspectorRow = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function PropertyInspectorRow({ className, ...props }, ref) {
  return <div ref={ref} data-slot="row" className={cn("grid auto-cols-fr grid-flow-col items-start gap-2 [--inspector-label-width:auto]", className)} {...props} />;
});
