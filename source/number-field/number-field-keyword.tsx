"use client";

import { Select } from "@base-ui/react/select";
import { useRef, useState, useSyncExternalStore } from "react";
import { useNumberField } from "./number-field-state";
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

/** The menu's value for a plain number. */
const fixed = "__fixed";

type KeywordMenuProps = {
  className?: string;
  /** Class for the popup (or the bottom sheet on phones). */
  popupClassName?: string;
  /** Class for each option. Highlighted options have data-highlighted; the chosen one data-selected. */
  itemClassName?: string;
  /** For narrow fields, such as a design tool's grid: Fixed shows only the arrow, leaving room for the number. Keywords still show. */
  compact?: boolean;
};

/**
 * Picks Fixed or one of the field's keywords, at the end of NumberFieldGroup; the menu opens at the field's width. It shows the current
 * mode, except for a keyword the input already spells out (Auto). Fixed keeps the shown number.
 */
export function NumberFieldKeywordMenu({ className, popupClassName, itemClassName, compact = false }: KeywordMenuProps) {
  const field = useNumberField();
  const phone = usePhone();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const blocked = field.readOnly || field.disabled;
  const options = [{ value: fixed, label: field.messages.fixed }, ...field.keywords.map((keyword) => ({ value: keyword.value, label: keyword.label }))];
  const current = field.keyword ? field.keyword.value : field.value !== null ? fixed : null;
  // A keyword without a number already reads in the input, so the trigger shows only its arrow.
  const shown =
    (field.keyword && field.display === null && field.draft === null) || (compact && current === fixed) ? null : (options.find((option) => option.value === current)?.label ?? null);

  return (
    <Select.Root
      items={options}
      value={current}
      onValueChange={(next) => {
        if (next === null || next === current) return;
        field.setKeyword(next === fixed ? null : (next as string));
      }}
      disabled={field.disabled}
      readOnly={field.readOnly}
      open={open && !blocked}
      onOpenChange={(next) => setOpen(next && !blocked)}
    >
      <Select.Trigger
        ref={trigger}
        aria-label={field.messages.mode(field.label)}
        data-slot="keyword"
        className={cn(
          "flex shrink-0 items-center gap-1.5 self-stretch text-sm",
          compact ? "pr-2 pl-0.5" : "pr-2.5 pl-1.5",
          "text-muted-foreground outline-none select-none hover:text-foreground focus-visible:text-foreground data-[popup-open]:text-foreground data-[readonly]:pointer-events-none",
          className,
        )}
      >
        {shown && <span>{shown}</span>}
        {!blocked && (
          <svg aria-hidden viewBox="0 0 10 6" className="h-1.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 1.25 5 4.75l3.5-3.5" />
          </svg>
        )}
      </Select.Trigger>
      <Select.Portal container={field.container ?? undefined}>
        {phone && <Select.Backdrop className="fixed inset-0 z-50 bg-black/40" />}
        <Select.Positioner
          // The menu opens under the whole field, at its width, not under the small trigger. A host whose
          // visible box is larger, such as a row with its label inside, marks that box data-menu-anchor.
          anchor={() => trigger.current?.closest<HTMLElement>("[data-menu-anchor]") ?? trigger.current?.closest<HTMLElement>('[data-slot="group"]') ?? trigger.current}
          alignItemWithTrigger={false}
          side="bottom"
          align="start"
          sideOffset={6}
          positionMethod="fixed"
          className="z-50 outline-none"
          style={phone ? { position: "fixed", top: "auto", bottom: 0, left: 0, right: 0, width: "100%", transform: "none" } : undefined}
        >
          <Select.Popup
            className={cn(
              // At least the field's width, wider only if an option needs it.
              "max-h-[var(--available-height)] w-max min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none",
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
                  className={cn(
                    "flex min-h-8 cursor-pointer items-center justify-between gap-3 rounded-sm px-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    phone && "min-h-11",
                    itemClassName,
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
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
