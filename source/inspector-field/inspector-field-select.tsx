"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Select } from "@base-ui/react/select";
import { type ReactNode, useRef, useState, useSyncExternalStore } from "react";
import { InspectorFieldLock } from "./inspector-field-lock";
import { InspectorFieldValue } from "./inspector-field-parts";
import { box, insideControl, useInspectorField } from "./inspector-field-state";
import { cn } from "@/lib/utils";

const phoneQuery = "(max-width: 639px)";
const subscribe = (notify: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
/** Phones get a bottom sheet; the server renders the desktop popup, then adapts. */
const usePhone = () =>
  useSyncExternalStore(subscribe, () => typeof window.matchMedia === "function" && window.matchMedia(phoneQuery).matches, () => false);

export type InspectorFieldSelectOption = {
  value: string;
  /** Shown in the field and the list. A searchable select matches typed text against it, so keep it plain text there. */
  label: ReactNode;
  disabled?: boolean;
  /** A heading the option is listed under in a searchable select, such as "Document fonts". */
  group?: string;
};

type SelectProps = {
  /** The committed choice. The application owns it. */
  value: string;
  options: InspectorFieldSelectOption[];
  /** Called when a different option is chosen. */
  onCommit: (value: string) => void;
  className?: string;
  /** Class for the popup (or the bottom sheet on phones). */
  popupClassName?: string;
  /**
   * Class for each option. Highlighted options have data-highlighted; the chosen one data-selected.
   * Its tick has data-slot="check", so a look can mark the choice with colour instead.
   */
  itemClassName?: string;
  /** Where the popup is portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  positionMethod?: "absolute" | "fixed";
  /**
   * A search field at the top of the list that filters the options as you type, for long lists such
   * as fonts. Options with a group are listed under its heading.
   */
  searchable?: boolean;
  /** Draws an option in the list and the field, such as a font in its own face. Defaults to its label. */
  renderOption?: (option: InspectorFieldSelectOption) => ReactNode;
};

/**
 * Draws each font family option in its own face. Pass as renderOption with font family values. A
 * family that isn't installed falls back to the system sans-serif rather than the browser's serif.
 */
export const inspectorFieldFontOption = (option: InspectorFieldSelectOption) => <span style={{ fontFamily: `"${option.value}", system-ui, sans-serif` }}>{option.label}</span>;

const chevron = (
  <svg aria-hidden viewBox="0 0 10 6" className="h-1.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 1.25 5 4.75l3.5-3.5" />
  </svg>
);
const check = (
  <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);
const sheetStyle = { position: "fixed", top: "auto", bottom: 0, left: 0, right: 0, width: "100%", transform: "none" } as const;
const popupClass = (phone: boolean, animated: boolean) =>
  cn(
    "max-h-[var(--available-height)] min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none",
    phone && "max-h-[80dvh] w-full rounded-t-2xl rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
    animated &&
      (phone
        ? "transition-[transform,opacity] duration-200 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none"
        : "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none"),
  );
const itemClass = (phone: boolean) =>
  cn(
    "flex min-h-8 cursor-pointer items-center justify-between gap-3 rounded-sm px-2 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
    phone && "min-h-11",
  );

/**
 * A built-in select for the second column: a field-sized trigger and a themed list of options.
 * Keyboard and typeahead come from Base UI; on phones the list opens as a bottom sheet.
 */
export function InspectorFieldSelect(props: SelectProps) {
  const field = useInspectorField();
  if (field.unavailable) return <InspectorFieldValue />;
  return props.searchable ? <SearchSelect {...props} /> : <PlainSelect {...props} />;
}

/** With the label inside, the menu opens under the whole row rather than under the value alone. */
function useRowAnchor(trigger: { current: HTMLButtonElement | null }) {
  const field = useInspectorField();
  return field.inside
    ? () => {
        const row = field.rootRef.current;
        const button = trigger.current;
        if (!row || !button) return button;
        return {
          contextElement: row,
          getBoundingClientRect: () => {
            const box = row.getBoundingClientRect();
            const own = button.getBoundingClientRect();
            return new DOMRect(box.left, own.top, box.width, own.height);
          },
        };
      }
    : undefined;
}

function PlainSelect({ value, options, onCommit, className, popupClassName, itemClassName, container, positionMethod, renderOption }: SelectProps) {
  const field = useInspectorField();
  const phone = usePhone();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const anchor = useRowAnchor(trigger);
  // Read-only, locked, disabled or pending: the value shows, but the menu never opens.
  const blocked = !field.editable || field.pending;
  const items = options.map((option) => ({ value: option.value, label: renderOption ? renderOption(option) : option.label }));

  return (
    <Select.Root
      items={items}
      value={field.mixed ? null : value}
      onValueChange={(next) => {
        if (next !== null && (field.mixed || next !== value)) onCommit(next as string);
      }}
      disabled={field.disabled || field.locked}
      readOnly={blocked}
      open={open && !blocked}
      onOpenChange={(next) => setOpen(next && !blocked)}
    >
      <Select.Trigger
        ref={trigger}
        id={field.controlId}
        aria-describedby={field.describedBy}
        className={cn(
          box,
          "flex items-center gap-2 px-3 data-[popup-open]:border-ring data-[readonly]:cursor-default group-data-pending/inspector:animate-pulse",
          field.inside && insideControl,
          className,
        )}
      >
        <Select.Value className={cn("min-w-0 flex-1 truncate data-[placeholder]:text-muted-foreground", field.align === "start" ? "text-start" : "text-end")} placeholder={field.messages.mixed} />
        <InspectorFieldLock />
        {field.editable && (
          <Select.Icon className="shrink-0 text-muted-foreground">
            <svg aria-hidden viewBox="0 0 10 6" className="h-1.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 1.25 5 4.75l3.5-3.5" />
            </svg>
          </Select.Icon>
        )}
      </Select.Trigger>
      <Select.Portal container={container ?? undefined}>
        {phone && <Select.Backdrop className="fixed inset-0 z-50 bg-black/40" />}
        <Select.Positioner
          anchor={anchor}
          alignItemWithTrigger={false}
          sideOffset={4}
          positionMethod={positionMethod}
          className="z-50 outline-none"
          style={phone ? { position: "fixed", top: "auto", bottom: 0, left: 0, right: 0, width: "100%", transform: "none" } : undefined}
        >
          <Select.Popup
            className={cn(
              "max-h-[var(--available-height)] min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none",
              phone && "max-h-[80dvh] w-full rounded-t-2xl rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
              field.animated &&
                (phone
                  ? "transition-[transform,opacity] duration-200 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none"
                  : "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none"),
              popupClassName,
            )}
          >
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "flex min-h-8 cursor-pointer items-center justify-between gap-3 rounded-sm px-2 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    phone && "min-h-11",
                    itemClassName,
                  )}
                >
                  <Select.ItemText>{renderOption ? renderOption(option) : option.label}</Select.ItemText>
                  <Select.ItemIndicator data-slot="check">
                    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3.5 8.5 3 3 6-7" />
                    </svg>
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

type Group = { value: string; items: InspectorFieldSelectOption[] };
const plainLabel = (option: InspectorFieldSelectOption) => (typeof option.label === "string" ? option.label : option.value);

/**
 * The searchable select: the field opens a list with a search field at its top that filters as you
 * type, with options under their group headings. Keyboard comes from Base UI's Combobox; on phones
 * the list opens as a bottom sheet.
 */
function SearchSelect({ value, options, onCommit, className, popupClassName, itemClassName, container, positionMethod, renderOption }: SelectProps) {
  const field = useInspectorField();
  const phone = usePhone();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const search = useRef<HTMLInputElement | null>(null);
  const anchor = useRowAnchor(trigger);
  const blocked = !field.editable || field.pending;
  const draw = (option: InspectorFieldSelectOption) => (renderOption ? renderOption(option) : option.label);
  const selected = field.mixed ? null : (options.find((option) => option.value === value) ?? null);
  const grouped = options.some((option) => option.group);
  const groups: Group[] = [];
  for (const option of options) {
    const name = option.group ?? "";
    const group = groups.find((item) => item.value === name) ?? groups[groups.push({ value: name, items: [] }) - 1];
    group.items.push(option);
  }
  const item = (option: InspectorFieldSelectOption) => (
    <Combobox.Item key={option.value} value={option} disabled={option.disabled} className={cn(itemClass(phone), itemClassName)}>
      <span className="min-w-0 truncate">{draw(option)}</span>
      <Combobox.ItemIndicator data-slot="check">{check}</Combobox.ItemIndicator>
    </Combobox.Item>
  );

  return (
    <Combobox.Root<InspectorFieldSelectOption>
      items={grouped ? (groups as never) : options}
      value={selected}
      itemToStringLabel={plainLabel}
      isItemEqualToValue={(a, b) => a.value === b.value}
      // The first match is highlighted as you type, so Enter picks it.
      autoHighlight
      onValueChange={(next) => {
        if (next && (field.mixed || next.value !== value)) onCommit(next.value);
      }}
      disabled={field.disabled || field.locked}
      readOnly={blocked}
      open={open && !blocked}
      onOpenChange={(next) => setOpen(next && !blocked)}
    >
      <Combobox.Trigger
        ref={trigger}
        id={field.controlId}
        aria-describedby={field.describedBy}
        className={cn(
          box,
          "flex items-center gap-2 px-3 data-[popup-open]:border-ring data-[readonly]:cursor-default group-data-pending/inspector:animate-pulse",
          field.inside && insideControl,
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", field.align === "start" ? "text-start" : "text-end", !selected && "text-muted-foreground")}>
          {selected ? draw(selected) : field.messages.mixed}
        </span>
        <InspectorFieldLock />
        {field.editable && <Combobox.Icon className="shrink-0 text-muted-foreground">{chevron}</Combobox.Icon>}
      </Combobox.Trigger>
      <Combobox.Portal container={container ?? undefined}>
        {phone && <Combobox.Backdrop className="fixed inset-0 z-50 bg-black/40" />}
        <Combobox.Positioner anchor={anchor} align="start" sideOffset={4} positionMethod={positionMethod} className="z-50 outline-none" style={phone ? sheetStyle : undefined}>
          <Combobox.Popup
            // Typing searches at once on desktop; on phones the sheet takes focus, so the keyboard waits for a tap.
            initialFocus={phone ? true : search}
            className={cn(popupClass(phone, field.animated), "flex max-h-[min(24rem,var(--available-height))] flex-col overflow-hidden p-0", phone && "max-h-[80dvh] p-0", popupClassName)}>
            <div className="border-b border-border p-1">
              <Combobox.Input
                ref={search}
                placeholder={field.messages.search}
                aria-label={field.messages.search}
                className="h-8 w-full rounded-sm bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Combobox.Empty>
              <div className="px-3 py-4 text-sm text-muted-foreground">{field.messages.noResults}</div>
            </Combobox.Empty>
            <Combobox.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 empty:hidden">
              {grouped
                ? (group: Group) => (
                    <Combobox.Group key={group.value} items={group.items} className="pb-1 last:pb-0">
                      {group.value && <Combobox.GroupLabel className="px-2 pt-1.5 pb-1 text-xs text-muted-foreground select-none">{group.value}</Combobox.GroupLabel>}
                      <Combobox.Collection>{(option: InspectorFieldSelectOption) => item(option)}</Combobox.Collection>
                    </Combobox.Group>
                  )
                : (option: InspectorFieldSelectOption) => item(option)}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
