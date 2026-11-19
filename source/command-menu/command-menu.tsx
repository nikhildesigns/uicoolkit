"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CommandResults } from "./command-results";
import { searchCommands, type CommandFilter, type CommandGroup, type CommandItem } from "./command-search";
export type { CommandGroup, CommandItem, CommandFilter } from "./command-search";

const phoneQuery = "(max-width: 639px)";
const phoneSnapshot = () => window.matchMedia?.(phoneQuery).matches ?? false;
const serverSnapshot = () => false;
function subscribeToWidth(notify: () => void) {
  const media = window.matchMedia?.(phoneQuery);
  media?.addEventListener("change", notify);
  return () => media?.removeEventListener("change", notify);
}

export type CommandMenuProps = {
  groups: CommandGroup[];
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  filter?: CommandFilter; loading?: boolean; initialQuery?: string;
  trigger?: ReactNode; title?: string; placeholder?: string; closeLabel?: string; emptyLabel?: string; loadingLabel?: string;
  motion?: boolean; sheet?: boolean; container?: HTMLElement | null;
  className?: string; triggerClassName?: string; optionClassName?: string;
};

export function CommandMenu({ groups, open: controlled, defaultOpen = false, onOpenChange, trigger = "Open commands",
  title = "Commands", motion = true, sheet, container, className, triggerClassName, ...options }: CommandMenuProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlled ?? localOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);
  function changeOpen(next: boolean) {
    if (controlled === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  }
  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger ref={triggerRef} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus-visible:outline focus-visible:outline-1", triggerClassName)}>
      {trigger}
    </Dialog.Trigger>
    <Dialog.Portal container={container ?? undefined}>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
      <MenuPopup {...options} groups={groups} title={title} motion={motion} sheet={sheet} className={className}
        triggerRef={triggerRef} close={() => changeOpen(false)} />
    </Dialog.Portal>
  </Dialog.Root>;
}

type PopupProps = CommandMenuProps & { title: string; motion: boolean; close: () => void; triggerRef: React.RefObject<HTMLElement | null> };

function MenuPopup({ groups, title, motion, sheet, className, triggerRef, close, filter,
  loading = false, initialQuery = "", placeholder = "Search commands…", closeLabel = "Close",
  emptyLabel = "No matching commands", loadingLabel = "Loading commands…", optionClassName }: PopupProps) {
  const input = useRef<HTMLInputElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const executed = useRef(false);
  const listId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [highlight, setHighlight] = useState<string>();
  const matches = useMemo(() => loading ? [] : searchCommands(groups, query, filter), [groups, query, filter, loading]);
  const items = matches.flatMap(group => group.items);
  const active = items.find(item => item.id === highlight) ?? items[0];
  const phone = useSyncExternalStore(subscribeToWidth, phoneSnapshot, serverSnapshot);
  const isSheet = sheet ?? phone;
  function select(item: CommandItem) {
    if (executed.current) return;
    executed.current = true;
    close();
    item.onSelect();
  }

  return <Dialog.Popup ref={popup} initialFocus={() => isSheet ? popup.current : input.current} finalFocus={triggerRef}
    className={cn("fixed z-50 flex max-h-[90dvh] flex-col overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg outline-none",
      isSheet ? "inset-x-0 bottom-0 h-[min(70dvh,32rem)] rounded-t-2xl pb-[env(safe-area-inset-bottom)]" :
        "left-1/2 top-[20dvh] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl",
      motion && "motion-safe:transition-[translate,opacity] motion-safe:duration-150 motion-safe:data-[starting-style]:opacity-0 motion-safe:data-[ending-style]:opacity-0",
      motion && isSheet && "motion-safe:data-[starting-style]:translate-y-full motion-safe:data-[ending-style]:translate-y-full", className)}>
    <Dialog.Title className="sr-only">{title}</Dialog.Title>
    <div className="flex items-center gap-2.5 border-b border-border px-3 py-1.5">
      <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <input ref={input} role="combobox" aria-label={title} aria-expanded="true" aria-autocomplete="list"
        aria-controls={listId} aria-activedescendant={active && `${listId}-${active.id}`}
        placeholder={placeholder} value={query} autoComplete="off" className={cn("h-9 min-w-0 flex-1 bg-transparent text-sm outline-none", isSheet && "text-base")}
        onChange={event => { setQuery(event.target.value); setHighlight(undefined); }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || !active) return;
          const index = items.indexOf(active);
          if (event.key === "ArrowDown") setHighlight(items[(index + 1) % items.length].id);
          else if (event.key === "ArrowUp") setHighlight(items[(index + items.length - 1) % items.length].id);
          else if (event.key === "Enter") { if (!event.repeat) select(active); }
          else return;
          event.preventDefault();
        }} />
      <Dialog.Close aria-label={closeLabel} className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted focus-visible:bg-muted">
        <X aria-hidden="true" className="size-4" />
      </Dialog.Close>
    </div>
    <CommandResults groups={matches} active={active?.id} listId={listId} loading={loading} sheet={!!isSheet} motion={motion}
      onHighlight={setHighlight} onSelect={select} optionClassName={optionClassName} emptyLabel={emptyLabel} loadingLabel={loadingLabel} listLabel={title} />
  </Dialog.Popup>;
}
