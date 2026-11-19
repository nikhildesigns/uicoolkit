"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandGroup, CommandItem } from "./command-search";

type Props = {
  groups: CommandGroup[]; active?: string; listId: string; loading: boolean; sheet: boolean; motion: boolean;
  onHighlight: (id: string) => void; onSelect: (item: CommandItem) => void;
  optionClassName?: string; emptyLabel: string; loadingLabel: string; listLabel: string;
};

export function CommandResults({ groups, active, listId, loading, sheet, motion, onHighlight, onSelect,
  optionClassName, emptyLabel, loadingLabel, listLabel }: Props) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const node = content.current;
    if (!node || sheet || !motion || typeof ResizeObserver === "undefined") return;
    const measure = () => setHeight(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [sheet, motion]);
  useEffect(() => {
    if (active) document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, listId]);

  return <div className={cn("min-h-0 overflow-hidden", sheet && "flex-1", motion && "motion-safe:transition-[height] motion-safe:duration-150")}
    style={{ height: sheet || !motion ? undefined : height }}>
    <div ref={content} className={cn("overflow-y-auto overscroll-contain px-2 pb-2", sheet ? "max-h-full" : "max-h-[min(52dvh,24rem)]")}>
      <div id={listId} role="listbox" aria-label={listLabel} aria-busy={loading}>
        {groups.map(group => <div key={group.id} role="group" aria-label={group.label}>
          <div aria-hidden="true" className="px-2.5 pb-1 pt-3 text-xs font-medium text-muted-foreground">{group.label}</div>
          {group.items.map(item => <div key={item.id} id={`${listId}-${item.id}`} role="option"
            aria-selected={active === item.id}
            onPointerMove={event => { if (event.pointerType === "mouse") onHighlight(item.id); }}
            onMouseDown={event => event.preventDefault()} onClick={() => onSelect(item)}
            className={cn("flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground", sheet && "min-h-11", optionClassName)}>
            {item.icon && <span aria-hidden="true" className="[&>svg]:size-4">{item.icon}</span>}
            {item.label}
          </div>)}
        </div>)}
      </div>
      {!groups.length && <div role="status" className="grid min-h-28 place-content-center justify-items-center gap-2 text-center text-sm text-muted-foreground">
        {!loading && <span className="rounded-full bg-muted p-2"><SearchX aria-hidden="true" className="size-4" /></span>}
        {loading ? loadingLabel : emptyLabel}
      </div>}
    </div>
  </div>;
}
