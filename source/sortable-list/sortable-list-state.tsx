"use client";

import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { type DragControls } from "motion/react";

export type Key = string | number;

/** The move the list asked the app to save. Positions are zero-based. */
export type SortableListMove<T> = { item: T; from: number; to: number };

/** A move the app rejected. `cause` is whatever onOrderChange threw. */
export type SortableListFailure<T> = SortableListMove<T> & { order: Key[]; cause: unknown };

export type SortableListStatus = "idle" | "pending" | "error";

/** Button labels and screen reader announcements. Positions are one-based. Replace any of them, for example to translate. */
export type SortableListMessages = {
  handle: (label: string) => string;
  moveUp: (label: string) => string;
  moveDown: (label: string) => string;
  moved: (label: string, position: number, total: number) => string;
  restored: (label: string, position: number) => string;
};

export const defaultMessages: SortableListMessages = {
  handle: (label) => `Reorder ${label}`,
  moveUp: (label) => `Move ${label} up`,
  moveDown: (label) => `Move ${label} down`,
  moved: (label, position, total) => `${label} moved to position ${position} of ${total}.`,
  restored: (label, position) => `Couldn't save. ${label} is back at position ${position}.`,
};

export type ListContextValue<T> = {
  ids: Key[];
  byId: Map<Key, T>;
  label: (item: T) => string;
  messages: SortableListMessages;
  locked: (item: T) => boolean;
  disabled: boolean;
  animated: boolean;
  status: SortableListStatus;
  failure: SortableListFailure<T> | null;
  draggingId: Key | null;
  setLocal: (ids: Key[] | null) => void;
  startDrag: (id: Key) => void;
  endDrag: (id: Key) => void;
  move: (id: Key, to: number) => void;
  /** Whether moving this item to `to` is allowed right now. */
  canMoveTo: (id: Key, to: number) => boolean;
  canRetry: boolean;
  retry: () => void;
  dismiss: () => void;
};

export const ListContext = createContext<ListContextValue<unknown> | null>(null);

export type ItemContextValue = { id: Key; index: number; controls: DragControls; movable: boolean };

export const ItemContext = createContext<ItemContextValue | null>(null);

export function useList(part: string) {
  const context = useContext(ListContext);
  if (!context) throw new Error(`<${part}> must be used inside <SortableList>.`);
  return context;
}

export function useItem(part: string) {
  const context = useContext(ItemContext);
  if (!context) throw new Error(`<${part}> must be used inside <SortableListItem>.`);
  return context;
}

export const moveKey = (ids: Key[], from: number, to: number) => {
  const next = [...ids];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

export type SortableListProps<T> = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** The app's ordered items. The list never reorders them itself. */
  items: T[];
  /** A stable identity for each item. Never derived from position. */
  getId: (item: T) => Key;
  /** Name used in button labels and announcements, such as a task title. */
  getLabel?: (item: T) => string;
  /**
   * Called once per completed move with the new order. Save it and update `items`.
   * Return a promise to show pending; rejecting restores your order and offers retry.
   */
  onOrderChange?: (items: T[], move: SortableListMove<T>) => void | Promise<unknown>;
  /** Items that stay where they are. */
  isLocked?: (item: T) => boolean;
  disabled?: boolean;
  /** Layout and lift animation. Reduced motion is always honored. */
  motion?: boolean;
  /** Replace button labels and announcements, for example to translate them. */
  messages?: Partial<SortableListMessages>;
  children?: ReactNode;
};
