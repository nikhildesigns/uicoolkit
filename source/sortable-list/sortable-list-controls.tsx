"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useList, useItem, type SortableListFailure, type ListContextValue } from "./sortable-list-state";
import { cn } from "@/lib/utils";

export const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:size-4";

/**
 * Drag handle. Press and drag to reorder; Up and Down arrows also move the row.
 * Unavailable moves use aria-disabled so focus stays put when a row reaches an end.
 */
export const SortableListHandle = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function SortableListHandle(
  { className, children, onPointerDown, onKeyDown, ...props },
  ref,
) {
  const { label, messages, byId, startDrag, move, canMoveTo, ids } = useList("SortableListHandle");
  const { id, index, controls, movable } = useItem("SortableListHandle");
  // Positions this row can reach. None (for example the only item) makes the handle unavailable.
  const reachable = ids.map((_, position) => position).filter((position) => canMoveTo(id, position));
  const available = movable && reachable.length > 0;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={messages.handle(label(byId.get(id)))}
      aria-disabled={!available || undefined}
      aria-roledescription="drag handle"
      className={cn(iconButton, "cursor-grab touch-none active:cursor-grabbing", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!available || event.defaultPrevented || event.button !== 0) return;
        startDrag(id);
        controls.start(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!available || event.defaultPrevented) return;
        // Home and End go to the furthest position the row can reach, skipping locked slots at the ends.
        const to =
          event.key === "ArrowUp" ? index - 1 : event.key === "ArrowDown" ? index + 1 : event.key === "Home" ? reachable[0] : event.key === "End" ? reachable.at(-1) : undefined;
        if (to === undefined || !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        if (canMoveTo(id, to)) move(id, to);
      }}
      {...props}
    >
      {children ?? (
        <svg aria-hidden viewBox="0 0 16 16" fill="currentColor">
          {[4, 8, 12].flatMap((y) => [6, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" />))}
        </svg>
      )}
    </button>
  );
});

export const MoveButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button"> & { direction: -1 | 1 }>(function MoveButton(
  { direction, className, children, onClick, ...props },
  ref,
) {
  const { label, messages, byId, move, canMoveTo } = useList(direction < 0 ? "SortableListMoveUp" : "SortableListMoveDown");
  const { id, index } = useItem(direction < 0 ? "SortableListMoveUp" : "SortableListMoveDown");
  const target = index + direction;
  const available = canMoveTo(id, target);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={(direction < 0 ? messages.moveUp : messages.moveDown)(label(byId.get(id)))}
      aria-disabled={!available || undefined}
      className={cn(iconButton, className)}
      onClick={(event) => {
        onClick?.(event);
        if (available && !event.defaultPrevented) move(id, target);
      }}
      {...props}
    >
      {children ?? (
        <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d={direction < 0 ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4"} />
        </svg>
      )}
    </button>
  );
});

export const SortableListMoveUp = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function SortableListMoveUp(props, ref) {
  return <MoveButton ref={ref} direction={-1} {...props} />;
});

export const SortableListMoveDown = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function SortableListMoveDown(props, ref) {
  return <MoveButton ref={ref} direction={1} {...props} />;
});

/** Shown only when there are no items. */
export const SortableListEmpty = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function SortableListEmpty({ className, ...props }, ref) {
  const { ids } = useList("SortableListEmpty");
  if (ids.length > 0) return null;
  return <div ref={ref} className={cn("rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground", className)} {...props} />;
});

export type SortableListErrorProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children?: ReactNode | ((failure: SortableListFailure<unknown>) => ReactNode);
  retryLabel?: string;
};

/**
 * Shown after the app rejects a move. The order is already restored; Retry saves the move again.
 * A red tint mixed with the background, so it stays opaque over any surface.
 */
export const SortableListError = forwardRef<HTMLDivElement, SortableListErrorProps>(function SortableListError(
  { className, children, retryLabel = "Retry", ...props },
  ref,
) {
  const { failure, retry, canRetry } = useList("SortableListError");
  if (!failure) return null;
  return (
    <div ref={ref} role="alert" className={cn("flex items-center justify-between gap-3 rounded-md border border-[color-mix(in_oklab,var(--destructive)_30%,var(--background))] bg-[color-mix(in_oklab,var(--destructive)_12%,var(--background))] px-3 py-2 text-sm text-destructive", className)} {...props}>
      <span>{typeof children === "function" ? children(failure) : (children ?? "Couldn't save the new order.")}</span>
      <button type="button" aria-disabled={!canRetry || undefined} onClick={retry} className="shrink-0 rounded-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:decoration-2 aria-disabled:opacity-50">
        {retryLabel}
      </button>
    </div>
  );
});

/** State and actions of the nearest SortableList, for building your own parts. */
export function useSortableList<T = unknown>() {
  const { ids, byId, status, failure, move, retry, dismiss } = useList("useSortableList") as ListContextValue<T>;
  return { items: ids.map((id) => byId.get(id) as T), status, failure, move, retry, dismiss };
}
