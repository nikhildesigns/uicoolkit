"use client";

import { Popover } from "@base-ui/react/popover";
import { Tooltip } from "@base-ui/react/tooltip";
import { type ReactNode, useRef, useSyncExternalStore } from "react";
import { inspectorFieldIcons } from "@/components/ui/inspector-field";
import { PropertyInspectorGroup, PropertyInspectorGroupAction, minus, plus } from "./property-inspector-group";
import { PropertyInspectorContext, usePropertyInspector } from "./property-inspector-state";
import { cn } from "@/lib/utils";

/** One entry of a list, for rows that depend on its values, such as Dash and Gap only on a dashed border. */
export type PropertyInspectorListEntry = {
  index: number;
  /** The entry's accessible name, such as "Fill" or "Fill 2". */
  name: string;
  /** Whether the entry is hidden on every selected item. */
  hidden: boolean;
  /** One of the entry's values, or null while it differs across the selection. */
  get: (key: string) => unknown;
};

type ListProps = {
  /** The key of each item's list, such as "fills". Rows inside an entry read the entry's keys, such as "color". */
  property: string;
  /** The list's name, such as "Fill". Names its + button and each entry. */
  label: string;
  /** Shown in the header in place of the label. */
  title?: ReactNode;
  /** A new entry, added on top when + is pressed. */
  create: () => Record<string, unknown>;
  /** The entry key that says whether it shows; hidden entries are dimmed. false leaves out the visibility button. */
  visibleKey?: string | false;
  /**
   * Rows above the entries for values every entry shares, such as a border's width. They read the
   * items themselves and show while every selected item has at least one entry.
   */
  shared?: ReactNode;
  /** Buttons in the header before +, such as a settings button for the shared values. */
  actions?: ReactNode;
  /** The rows for one entry. The first sits beside the entry's buttons; the rest take the full width below. */
  children: ReactNode | ((entry: PropertyInspectorListEntry) => ReactNode);
  className?: string;
};

const eye = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.75 8S4 3.75 8 3.75 14.25 8 14.25 8 12 12.25 8 12.25 1.75 8 1.75 8Z" />
    <circle cx="8" cy="8" r="1.75" />
  </svg>
);
const eyeOff = (
  <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.75 2.75l10.5 10.5M6.5 4a6.5 6.5 0 0 1 1.5-.25c4 0 6.25 4.25 6.25 4.25a11 11 0 0 1-1.6 2.1M10.25 11.6A5.8 5.8 0 0 1 8 12.25C4 12.25 1.75 8 1.75 8a11 11 0 0 1 2.3-2.75" />
  </svg>
);

/**
 * A list property, such as Fills, Borders or Shadows: + in the header adds an entry on top, and each
 * entry has a visibility button and − to remove it. Rows inside an entry read and edit that entry on
 * every selected item, with Mixed per value. When the items' lists differ in length, the list shows a
 * note instead, and + replaces every item's list with one new entry. Each edit is one commit.
 */
export function PropertyInspectorList({ property, label, title, create, visibleKey = "visible", shared, actions, children, className }: ListProps) {
  const inspector = usePropertyInspector();
  if (inspector.count === 0) return null;
  const lists = inspector.values(property).map((value) => (Array.isArray(value) ? value : []));
  const length = lists[0].length;
  const same = lists.every((list) => list.length === length);
  const add = () => (same ? inspector.commitList(property, { insert: 0, value: create() }) : inspector.commit(property, [create()]));
  return (
    <PropertyInspectorGroup
      title={title ?? label}
      label={label}
      collapsible={false}
      className={className}
      data-slot="list"
      actions={
        <>
          {actions}
          <PropertyInspectorGroupAction label={inspector.messages.add(label)} icon={plus} onAction={add} />
        </>
      }
    >
      {lists.every((list) => list.length > 0) && shared}
      {same ? (
        Array.from({ length }, (_, index) => (
          <ListEntry key={index} property={property} index={index} name={length > 1 ? `${label} ${index + 1}` : label} visibleKey={visibleKey}>
            {children}
          </ListEntry>
        ))
      ) : (
        <p className="py-1.5 text-xs text-muted-foreground">{inspector.messages.mixedList(label)}</p>
      )}
    </PropertyInspectorGroup>
  );
}

type EntryProps = Pick<ListProps, "property" | "children"> & { index: number; name: string; visibleKey: string | false };

function ListEntry({ property, index, name, visibleKey, children }: EntryProps) {
  const inspector = usePropertyInspector();
  const nested = inspector.nest(`${property}.${index}`);
  const visible = visibleKey ? nested.read(visibleKey) : null;
  const hidden = !!visible && !visible.mixed && visible.value === false;
  const entry: PropertyInspectorListEntry = {
    index,
    name,
    hidden,
    get: (key) => {
      const reading = nested.read(key);
      return reading.mixed ? null : (reading.value ?? null);
    },
  };
  return (
    // The buttons take the group's two icon slots beside the first row; the rows below take the full width.
    <div role="group" aria-label={name} data-hidden={hidden || undefined} className="grid grid-cols-[minmax(0,1fr)_4rem] items-start gap-y-1">
      <div className={cn("contents [&>*:not(:first-child)]:col-span-2", hidden && "[&>*]:opacity-50")}>
        <PropertyInspectorContext.Provider value={nested}>{typeof children === "function" ? children(entry) : children}</PropertyInspectorContext.Provider>
      </div>
      <div className="col-start-2 row-start-1 flex h-[var(--uicoolkit-field-height,2.5rem)] items-center">
        {visibleKey && (
          // A mixed visibility shows every entry when pressed.
          <PropertyInspectorGroupAction label={hidden ? inspector.messages.show(name) : inspector.messages.hide(name)} icon={hidden ? eyeOff : eye} onAction={() => nested.commit(visibleKey, hidden || !!visible?.mixed)} />
        )}
        <PropertyInspectorGroupAction label={inspector.messages.remove(name)} icon={minus} onAction={() => inspector.commitList(property, { remove: index })} />
      </div>
    </div>
  );
}

const phoneQuery = "(max-width: 639px)";
const subscribe = (notify: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
/** Phones get a bottom sheet; the server renders the desktop popover, then adapts. */
const usePhone = () => useSyncExternalStore(subscribe, () => typeof window.matchMedia === "function" && window.matchMedia(phoneQuery).matches, () => false);

type SettingsProps = {
  /** Names the settings, such as "Shadow settings"; titles the popover. */
  label: string;
  /** "row" shows a summary across the row; "icon" is a settings button for a group header. */
  variant?: "row" | "icon";
  /** What the row shows, such as "Drop shadow". */
  summary?: ReactNode;
  /** Shown before the summary, such as a colour swatch. */
  leading?: ReactNode;
  /** The rows in the popover. They read and edit the same item, or list entry, as the row. */
  children: ReactNode;
  className?: string;
};

/**
 * A row for a property with more settings than fit, such as a shadow: it shows a summary, and
 * pressing it opens the settings in a popover beside the row, or a bottom sheet on phones. Rows
 * inside edit the same selection, or list entry, as the row itself.
 */
export function PropertyInspectorSettings({ label, variant = "row", summary, leading, children, className }: SettingsProps) {
  const inspector = usePropertyInspector();
  const phone = usePhone();
  const rowRef = useRef<HTMLButtonElement | null>(null);
  const icon = variant === "icon";
  const iconTrigger = (
    <Popover.Trigger
      ref={rowRef}
      disabled={inspector.disabled}
      aria-label={label}
      className={cn(
        "grid size-8 place-items-center rounded-md text-muted-foreground outline-none [&_svg]:size-4",
        "hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50 data-[popup-open]:bg-foreground/10 data-[popup-open]:text-foreground",
        inspector.animated && "transition-colors duration-100 motion-reduce:transition-none",
        className,
      )}
    >
      {inspectorFieldIcons.settings}
    </Popover.Trigger>
  );
  return (
    // One element, so the popover's focus guards never become rows of their own.
    <div data-slot="settings" className={cn("min-w-0", !icon && className)}>
      <Popover.Root>
        {icon ? (
          <Tooltip.Root>
            <Tooltip.Trigger render={iconTrigger} />
            <Tooltip.Portal container={inspector.container ?? undefined}>
              <Tooltip.Positioner side="top" sideOffset={6} positionMethod="fixed" className="z-50">
                <Tooltip.Popup className="rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md">{label}</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <Popover.Trigger
            ref={rowRef}
            disabled={inspector.disabled}
            aria-label={label}
            className={cn(
              "flex h-[var(--uicoolkit-field-height,2.5rem)] w-full min-w-0 items-center gap-2 rounded-md border border-[color:var(--uicoolkit-field-border,var(--input))] bg-[var(--uicoolkit-field-bg,transparent)] pl-3.5 text-left text-sm shadow-[var(--uicoolkit-field-shadow,0_1px_2px_0_rgb(0_0_0/0.05))] outline-none",
              "hover:bg-foreground/5 focus-visible:border-ring disabled:opacity-50 data-[popup-open]:border-ring",
              inspector.animated && "transition-colors duration-100 motion-reduce:transition-none",
            )}
          >
            {leading}
            <span className="min-w-0 flex-1 truncate">{summary}</span>
            {/* 32px wide, so the icon lines up with the other trailing icons. */}
            <span aria-hidden className="grid w-8 shrink-0 place-items-center text-muted-foreground [&_svg]:size-4">
              {inspectorFieldIcons.settings}
            </span>
          </Popover.Trigger>
        )}
        <Popover.Portal container={inspector.container ?? undefined}>
          <Popover.Positioner
            anchor={rowRef}
            side="bottom"
            align={icon ? "end" : "start"}
            sideOffset={6}
            collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "end" }}
            positionMethod="fixed"
            className="z-50 outline-none"
            style={phone ? { position: "fixed", top: "auto", bottom: 0, left: 0, right: 0, width: "100%", transform: "none" } : undefined}
          >
            <Popover.Popup
              initialFocus={false}
              className={cn(
                "grid w-64 gap-2 rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-[0_16px_40px_-12px_rgb(0_0_0/0.45),0_4px_12px_-4px_rgb(0_0_0/0.25)] outline-none",
                phone && "w-full rounded-t-2xl rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
                inspector.animated &&
                  (phone
                    ? "transition-[transform,opacity] duration-200 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none"
                    : "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none"),
              )}
            >
              <Popover.Title className="text-xs font-medium text-foreground">{label}</Popover.Title>
              {children}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
