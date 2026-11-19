"use client";

import { type ComponentPropsWithoutRef, type ForwardedRef, type ReactElement, type ReactNode, forwardRef, useEffect, useRef, useState } from "react";
import {
  type LayersPanelContextValue,
  type LayersPanelLayer,
  type LayersPanelProps,
  LayersPanelContext,
  type LayersPanelDrop,
  type LayersPanelPlace,
  defaultMessages,
  filterTree,
  locate,
  nextSelection,
  placeFor,
  unloadedIds,
  useLayersPanel,
  visibleOrder,
} from "./layers-panel-state";
import { cn } from "@/lib/utils";

/** How long rows stay still after the search changes, so cleared results do not slide back in. */
const settleMs = 300;
/** Distance from the tree's top or bottom edge where a drag scrolls it. */
const scrollEdge = 24;

function LayersPanelRoot<T extends LayersPanelLayer>(
  {
    layers,
    selected,
    onSelectedChange,
    onRename,
    validate,
    onMove,
    onHiddenChange,
    onLockedChange,
    actions,
    defaultCollapsed = [],
    onExpandedChange,
    onRetryChildren,
    disabled = false,
    motion = true,
    container,
    messages: messagesProp,
    className,
    children,
    ...props
  }: LayersPanelProps<T>,
  ref: ForwardedRef<HTMLElement>,
) {
  const messages = { ...defaultMessages, ...messagesProp };
  const [query, setQueryState] = useState("");
  const [settling, setSettling] = useState(false);
  const [collapsed, setCollapsed] = useState(() => new Set(defaultCollapsed));
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draggingId, setDraggingIdState] = useState<string | null>(null);
  // Mirrors the dragged id, so pointer moves that arrive before a re-render still see the drag.
  const dragging = useRef<string | null>(null);
  const setDraggingId = (id: string | null) => {
    dragging.current = id;
    setDraggingIdState(id);
  };
  const [drop, setDropState] = useState<LayersPanelDrop | null>(null);
  const dropRef = useRef<LayersPanelDrop | null>(null);
  const setDrop = (next: LayersPanelDrop | null) => {
    dropRef.current = next;
    setDropState(next);
  };
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  // Where the row was grabbed, so its lifted copy stays under the same spot of the pointer.
  const grab = useRef({ dx: 0, dy: 0 });
  const [announcement, setAnnouncement] = useState("");
  // The last plain or Cmd/Ctrl click, where a Shift click's range starts.
  const anchor = useRef<string | null>(null);
  const rowsRef = useRef(new Map<string, HTMLElement>());
  const treeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(() => setSettling(false), settleMs);
    return () => clearTimeout(timer);
  }, [settling, query]);

  // Escape cancels a drag without moving anything.
  useEffect(() => {
    if (!draggingId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setDraggingId(null);
      setDrop(null);
      setPointer(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [draggingId]);

  const trimmed = query.trim();
  const searching = trimmed !== "";
  const visible = searching ? filterTree(layers, trimmed) : layers;
  // Searching opens the ancestors of every match without changing what the person collapsed.
  const unloaded = new Set(unloadedIds(layers));
  const isOpen = (id: string) => !unloaded.has(id) && (searching || !collapsed.has(id));
  const current = new Set(selected);
  const canMove = !!onMove && !disabled && !searching;
  // A hidden or locked layer stays put, and so does everything inside it.
  const pinned = (id: string): boolean => {
    const found = locate(layers, id);
    if (!found) return true;
    if (found.layer.hidden || found.layer.locked) return true;
    return found.parent ? pinned(found.parent.id) : false;
  };
  const locked = (id: string): boolean => {
    const found = locate(layers, id);
    return !!found && (!!found.layer.locked || (!!found.parent && locked(found.parent.id)));
  };

  const moveTo = (id: string, to: LayersPanelPlace) => {
    const found = locate(layers, id);
    if (!found || !onMove) return;
    onMove({ layer: found.layer, from: { parentId: found.parent?.id ?? null, index: found.index }, to });
    const parent = to.parentId ? locate(layers, to.parentId)?.layer.name ?? null : null;
    setAnnouncement(messages.moved(found.layer.name, parent, to.index + 1));
    // A layer dropped into a collapsed frame opens it, so the moved layer stays in view.
    if (to.parentId) setCollapsed((previous) => (previous.has(to.parentId!) ? new Set([...previous].filter((value) => value !== to.parentId)) : previous));
  };

  // The lifted copy's place within the tree's frame, which does not scroll.
  const liftedAt = (clientX: number, clientY: number) => {
    const content = treeRef.current?.parentElement?.getBoundingClientRect();
    return content ? { x: clientX - grab.current.dx - content.left, y: clientY - grab.current.dy - content.top } : null;
  };

  const dropAt = (clientY: number): LayersPanelDrop | null => {
    const rows = [...rowsRef.current.entries()].map(([id, element]) => ({ id, rect: element.getBoundingClientRect() })).filter((row) => row.rect.height > 0);
    if (rows.length === 0) return null;
    const row = rows.find(({ rect }) => clientY >= rect.top && clientY < rect.bottom);
    // Past the last row, the layer goes to the end of the top level.
    if (!row) return clientY >= rows[rows.length - 1].rect.bottom && layers.length > 0 ? { id: layers[layers.length - 1].id, position: "after" } : null;
    const target = locate(layers, row.id)?.layer;
    if (!target) return null;
    const ratio = (clientY - row.rect.top) / row.rect.height;
    // Text, images, locked frames and groups still waiting for their children take no drops inside.
    if (!target.children || target.childrenStatus || locked(row.id)) return { id: row.id, position: ratio < 0.5 ? "before" : "after" };
    // Frames take drops in their middle; the lower edge of an open frame leads into it too.
    if (ratio < 0.25) return { id: row.id, position: "before" };
    if (ratio > 0.75 && !(isOpen(row.id) && target.children.length > 0)) return { id: row.id, position: "after" };
    return { id: row.id, position: "inside" };
  };

  const context: LayersPanelContextValue = {
    layers,
    visible,
    query,
    setQuery: (next) => {
      setQueryState(next);
      setSettling(true);
    },
    searching,
    // Judged on the whole tree, so a search that hides every frame does not shift the rows.
    flat: layers.every((layer) => layer.children === undefined && !layer.childrenStatus),
    rowsAnimated: motion && !searching && !settling,
    isOpen,
    toggleOpen: (id) => {
      const expanded = !isOpen(id);
      setCollapsed((previous) => {
        const next = new Set(previous);
        if (expanded) next.delete(id);
        else next.add(id);
        return next;
      });
      const found = locate(layers, id);
      if (found) onExpandedChange?.(found.layer, expanded);
    },
    selected: current,
    select: (id, details) => {
      if (disabled || !onSelectedChange) return;
      onSelectedChange(nextSelection(visibleOrder(visible, isOpen), current, anchor.current, id, details));
      if (!details.range) anchor.current = id;
    },
    renamingId,
    setRenamingId: (id) => setRenamingId(id && onRename && !disabled ? id : null),
    canRename: !!onRename && !disabled,
    // A filtered tree hides siblings, so positions would not match the real order.
    canMove,
    moveTo,
    movesFor: (id) => {
      const found = locate(layers, id);
      if (!found || pinned(id)) return {};
      const parentId = found.parent?.id ?? null;
      const outer = found.parent ? locate(layers, found.parent.id) : null;
      const previous = found.siblings[found.index - 1];
      return {
        up: found.index > 0 ? { parentId, index: found.index - 1 } : undefined,
        down: found.index < found.siblings.length - 1 ? { parentId, index: found.index + 1 } : undefined,
        out: found.parent && outer ? { parentId: outer.parent?.id ?? null, index: outer.index + 1 } : undefined,
        into: previous?.children && !previous.childrenStatus && !locked(previous.id) ? { parentId: previous.id, index: previous.children.length } : undefined,
      };
    },
    draggingId,
    drop,
    pointer,
    isMovable: (id) => canMove && !pinned(id),
    startDrag: (id, clientX, clientY) => {
      if (!canMove || pinned(id)) return;
      const row = rowsRef.current.get(id)?.getBoundingClientRect();
      grab.current = row ? { dx: clientX - row.left, dy: clientY - row.top } : { dx: 0, dy: 0 };
      setDraggingId(id);
      setDrop(null);
      setPointer(liftedAt(clientX, clientY));
    },
    dragOver: (clientX, clientY) => {
      const draggingId = dragging.current;
      if (!draggingId) return;
      setPointer(liftedAt(clientX, clientY));
      const tree = treeRef.current?.getBoundingClientRect();
      if (tree && treeRef.current) {
        if (clientY < tree.top + scrollEdge) treeRef.current.scrollTop -= 8;
        else if (clientY > tree.bottom - scrollEdge) treeRef.current.scrollTop += 8;
      }
      const next = dropAt(clientY);
      setDrop(next && placeFor(layers, draggingId, next) ? next : null);
    },
    endDrag: (commit) => {
      const id = dragging.current;
      const target = dropRef.current;
      const place = commit && id && target ? placeFor(layers, id, target) : null;
      if (place && id) moveTo(id, place);
      setDraggingId(null);
      setDrop(null);
      setPointer(null);
    },
    rowsRef,
    treeRef,
    rename: onRename as LayersPanelContextValue["rename"],
    validate,
    setHidden: onHiddenChange as LayersPanelContextValue["setHidden"],
    setLocked: onLockedChange as LayersPanelContextValue["setLocked"],
    actions: actions as LayersPanelContextValue["actions"],
    retryChildren: onRetryChildren as LayersPanelContextValue["retryChildren"],
    disabled,
    animated: motion,
    container,
    messages,
  };

  return (
    <LayersPanelContext.Provider value={context}>
      <section
        ref={ref}
        aria-label={messages.label}
        data-disabled={disabled || undefined}
        data-empty={layers.length === 0 || undefined}
        data-dragging={draggingId ? "" : undefined}
        // A column: give the panel a height and the tree scrolls inside it, so searching never resizes it.
        className={cn("flex min-h-0 flex-col gap-2 text-sm data-dragging:cursor-grabbing data-dragging:select-none", className)}
        {...props}
      >
        {children}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>
    </LayersPanelContext.Provider>
  );
}

/**
 * A design tool's layer tree: nested frames and layers with search, selection, rename,
 * moving layers within and between frames, hide and lock toggles and right-click actions. Your app owns the tree.
 */
export const LayersPanel = forwardRef(LayersPanelRoot) as <T extends LayersPanelLayer>(props: LayersPanelProps<T> & { ref?: ForwardedRef<HTMLElement> }) => ReactElement;

/** The panel's title. */
export const LayersPanelHeader = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function LayersPanelHeader({ className, children, ...props }, ref) {
  const { messages } = useLayersPanel();
  return (
    <div ref={ref} className={cn("shrink-0 pb-1", className)} {...props}>
      <span className="text-sm font-semibold">{children ?? messages.label}</span>
    </div>
  );
});

/** Filters layers by name, keeping the frames that lead to each match. Escape clears it. */
export const LayersPanelSearch = forwardRef<HTMLInputElement, Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange">>(function LayersPanelSearch(
  { className, onKeyDown, placeholder, ...props },
  ref,
) {
  const { query, setQuery, messages, disabled } = useLayersPanel();
  return (
    <div className="relative shrink-0">
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" />
      </svg>
      <input
        ref={ref}
        type="search"
        aria-label={messages.search}
        placeholder={placeholder ?? messages.search}
        autoComplete="off"
        disabled={disabled}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape" || query === "") return;
          // Stop here so an enclosing sheet or popover stays open.
          event.preventDefault();
          event.stopPropagation();
          setQuery("");
        }}
        className={cn(
          "h-8 w-full min-w-0 rounded-md border border-input bg-transparent pr-2 pl-8 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
        {...props}
      />
    </div>
  );
});

type EmptyProps = ComponentPropsWithoutRef<"div"> & {
  /** Replace the icon above the text. */
  icon?: ReactNode;
};

/**
 * Shown when there are no layers, or when a search matches none: an icon with the text centred
 * below it, in the middle of the space the tree would fill.
 */
export const LayersPanelEmpty = forwardRef<HTMLDivElement, EmptyProps>(function LayersPanelEmpty({ icon, className, children, ...props }, ref) {
  const { layers, visible, query, messages } = useLayersPanel();
  if (layers.length > 0 && visible.length > 0) return null;
  const empty = layers.length === 0;
  return (
    <div
      ref={ref}
      role="status"
      className={cn("flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5 px-4 py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    >
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-muted [&_svg]:size-5">
        {icon ??
          (empty ? (
            // Stacked layers: there is nothing here yet.
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="m10 3 7 3.75-7 3.75-7-3.75Z" />
              <path d="m3 10.25 7 3.75 7-3.75M3 13.75l7 3.75 7-3.75" />
            </svg>
          ) : (
            // A magnifier: the search found nothing.
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <circle cx="9" cy="9" r="5.5" />
              <path d="m13.25 13.25 3.75 3.75" />
            </svg>
          ))}
      </span>
      <p className="max-w-52 text-balance">{children ?? (empty ? messages.empty : messages.noResults(query.trim()))}</p>
    </div>
  );
});
