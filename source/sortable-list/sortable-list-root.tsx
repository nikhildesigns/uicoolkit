"use client";

import { type SortableListProps, type Key, type SortableListStatus, type SortableListFailure, defaultMessages, type ListContextValue, moveKey, ListContext } from "./sortable-list-state";
import { type ForwardedRef, useState, useRef, useEffect, forwardRef } from "react";
import { useReducedMotion } from "motion/react";
import { planRetry } from "./sortable-list-retry";
import { cn } from "@/lib/utils";

export function SortableListRoot<T>(
  { items, getId, getLabel = () => "Item", onOrderChange, isLocked = () => false, disabled = false, motion = true, messages: messageOverrides, className, children, ...props }: SortableListProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  // A drag preview or a save in flight; otherwise the app's order shows.
  const [local, setLocal] = useState<Key[] | null>(null);
  const [status, setStatus] = useState<SortableListStatus>("idle");
  const [failure, setFailure] = useState<SortableListFailure<T> | null>(null);
  const [draggingId, setDraggingId] = useState<Key | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const dragFrom = useRef(-1);
  const cancelled = useRef(false);
  const attempt = useRef(0);
  const reduced = useReducedMotion();
  const messages = { ...defaultMessages, ...messageOverrides };

  const byId = new Map(items.map((item) => [getId(item), item] as const));
  const appIds = items.map(getId);
  // Keep the preview's order but follow the app's items: drop removed ones, append new ones.
  const ids = local ? [...local.filter((id) => byId.has(id)), ...appIds.filter((id) => !local.includes(id))] : appIds;

  // Re-reading the same sentence must still be announced; alternate a zero-width space.
  const announce = (text: string) => setAnnouncement((previous) => (previous === text ? `${text}​` : text));

  const commit = (order: Key[], id: Key, from: number, to: number) => {
    const item = byId.get(id) as T;
    const name = getLabel(item);
    const move = { item, from, to };
    const token = ++attempt.current;
    setFailure(null);
    announce(messages.moved(name, to + 1, order.length));
    const result = onOrderChange?.(order.flatMap((key) => (byId.has(key) ? [byId.get(key) as T] : [])), move);
    if (!(result instanceof Promise)) {
      setLocal(null);
      setStatus("idle");
      return;
    }
    setLocal(order);
    setStatus("pending");
    result.then(
      () => {
        if (token !== attempt.current) return;
        setLocal(null);
        setStatus("idle");
      },
      (cause: unknown) => {
        if (token !== attempt.current) return;
        setLocal(null);
        setStatus("error");
        setFailure({ ...move, order, cause });
        announce(messages.restored(name, from + 1));
      },
    );
  };

  // Locked items keep their positions in the app's order, so no move may shift one.
  const keepsLocked = (order: Key[]) =>
    appIds.every((key, index) => {
      const item = byId.get(key);
      return item === undefined || !isLocked(item) || order[index] === key;
    });

  const canMove = (id: Key) => {
    const item = byId.get(id);
    return item !== undefined && !disabled && status !== "pending" && !isLocked(item);
  };

  const retryPlan = failure ? planRetry(failure, getId(failure.item), appIds) : null;
  const canRetry = retryPlan !== null && canMove(retryPlan.id) && keepsLocked(retryPlan.order);

  const value: ListContextValue<T> = {
    ids,
    byId,
    label: getLabel,
    messages,
    locked: isLocked,
    disabled,
    animated: motion && !reduced,
    status,
    failure,
    draggingId,
    setLocal,
    startDrag: (id) => {
      dragFrom.current = ids.indexOf(id);
      cancelled.current = false;
      setDraggingId(id);
    },
    endDrag: (id) => {
      setDraggingId(null);
      const to = ids.indexOf(id);
      if (cancelled.current || to === dragFrom.current || to < 0 || !keepsLocked(ids)) return setLocal(null);
      commit(ids, id, dragFrom.current, to);
    },
    move: (id, to) => {
      if (value.canMoveTo(id, to)) commit(moveKey(ids, ids.indexOf(id), to), id, ids.indexOf(id), to);
    },
    canMoveTo: (id, to) => {
      const from = ids.indexOf(id);
      return canMove(id) && from >= 0 && to >= 0 && to < ids.length && to !== from && keepsLocked(moveKey(ids, from, to));
    },
    canRetry,
    retry: () => {
      if (canRetry && retryPlan) commit(retryPlan.order, retryPlan.id, retryPlan.from, retryPlan.to);
    },
    dismiss: () => {
      setFailure(null);
      setStatus("idle");
    },
  };

  // Escape cancels a pointer drag and restores the order it started from.
  useEffect(() => {
    if (draggingId === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cancelled.current = true;
      setLocal(null);
      setDraggingId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draggingId]);

  return (
    <ListContext.Provider value={value as ListContextValue<unknown>}>
      <div ref={ref} data-status={status} data-disabled={disabled ? "" : undefined} className={cn("flex flex-col gap-3", className)} {...props}>
        {children}
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </div>
    </ListContext.Provider>
  );
}

export const SortableList = forwardRef(SortableListRoot) as <T>(
  props: SortableListProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof SortableListRoot>;
