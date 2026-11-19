"use client";

import { type ComponentPropsWithoutRef, type MutableRefObject, type ReactNode, type Ref, createContext, useContext } from "react";

/** Where a group's on-demand children stand. Clear it once they have loaded. */
export type LayersPanelChildrenStatus = "unloaded" | "loading" | "failed";

/** A layer in the tree. Your app owns it; frames and groups hold their layers in `children` (an empty array still accepts drops). */
export type LayersPanelLayer = {
  id: string;
  name: string;
  children?: LayersPanelLayer[];
  /** Marks a group whose children your app loads on demand, so it shows a chevron before they exist. */
  childrenStatus?: LayersPanelChildrenStatus;
  hidden?: boolean;
  locked?: boolean;
};

/** Where a layer sits: its parent's id (null at the top level) and its zero-based position among its siblings. */
export type LayersPanelPlace = { parentId: string | null; index: number };

/** A finished move: the layer, where it was and where it goes. Positions in `to` assume the layer is already removed. */
export type LayersPanelMove<T extends LayersPanelLayer = LayersPanelLayer> = { layer: T; from: LayersPanelPlace; to: LayersPanelPlace };

/** Where a dragged layer would land: before or after a row, or inside a frame or group. */
export type LayersPanelDrop = { id: string; position: "before" | "after" | "inside" };

/** Replaceable text, for example to translate. */
export type LayersPanelMessages = {
  label: string;
  search: string;
  empty: string;
  noResults: (query: string) => string;
  nameLabel: string;
  rename: string;
  handle: (name: string) => string;
  moveUp: string;
  moveDown: string;
  moveOut: string;
  moveInto: string;
  moved: (name: string, parent: string | null, position: number) => string;
  expand: (name: string) => string;
  collapse: (name: string) => string;
  loadingChildren: string;
  childrenFailed: string;
  retry: string;
  retryChildren: (name: string) => string;
  hide: string;
  show: string;
  lock: string;
  unlock: string;
};

export const defaultMessages: LayersPanelMessages = {
  label: "Layers",
  search: "Search layers",
  empty: "No layers yet.",
  noResults: (query) => `No layers match “${query}”.`,
  nameLabel: "Layer name",
  rename: "Rename",
  handle: (name) => `Move ${name}`,
  moveUp: "Move up",
  moveDown: "Move down",
  moveOut: "Move out of frame",
  moveInto: "Move into frame above",
  moved: (name, parent, position) => `${name} moved to position ${position} ${parent ? `in ${parent}` : "at the top level"}.`,
  expand: (name) => `Expand ${name}`,
  collapse: (name) => `Collapse ${name}`,
  loadingChildren: "Loading layers…",
  childrenFailed: "Couldn't load layers.",
  retry: "Retry",
  retryChildren: (name) => `Retry loading ${name}`,
  hide: "Hide",
  show: "Show",
  lock: "Lock",
  unlock: "Unlock",
};

export type LayersPanelProps<T extends LayersPanelLayer = LayersPanelLayer> = Omit<ComponentPropsWithoutRef<"section">, "onChange"> & {
  /** The top-level layers, each holding its own `children`. The panel never changes them itself. */
  layers: T[];
  /** Ids of the selected layers. Your app owns the selection. */
  selected: string[];
  /** The selection a click asks for: one layer, Cmd/Ctrl to add or remove, Shift for a range of visible layers. */
  onSelectedChange?: (ids: string[]) => void;
  /** Saves a new name. Return a rejected promise to keep editing with an error. Omit to turn renaming off. */
  onRename?: (layer: T, name: string) => void | Promise<unknown>;
  /** Rejects a name before saving. Return a message, or nothing to accept it. */
  validate?: (name: string) => string | null | undefined;
  /** Saves a finished move, within a frame or into another, once per drop or key press. `moveLayer` applies it to a tree. Omit to turn moving off. */
  onMove?: (move: LayersPanelMove<T>) => void;
  /** Shows the hide toggle and saves it. */
  onHiddenChange?: (layer: T, hidden: boolean) => void;
  /** Shows the lock toggle and saves it. */
  onLockedChange?: (layer: T, locked: boolean) => void;
  /** Extra items for a layer's right-click menu, after the built-in ones. */
  actions?: (layer: T) => ReactNode;
  /** Ids of layers whose children start collapsed. */
  defaultCollapsed?: string[];
  /** Reports each time a person opens or closes a layer. Use it to load on-demand children. */
  onExpandedChange?: (layer: T, expanded: boolean) => void;
  /** Adds Retry to a group whose `childrenStatus` is "failed". */
  onRetryChildren?: (layer: T) => void;
  disabled?: boolean;
  /** Disclosure and menu transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where menus and tooltips are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<LayersPanelMessages>;
};

type Handlers = {
  rename?: (layer: LayersPanelLayer, name: string) => void | Promise<unknown>;
  validate?: (name: string) => string | null | undefined;
  setHidden?: (layer: LayersPanelLayer, hidden: boolean) => void;
  setLocked?: (layer: LayersPanelLayer, locked: boolean) => void;
  actions?: (layer: LayersPanelLayer) => ReactNode;
  retryChildren?: (layer: LayersPanelLayer) => void;
};

export type LayersPanelContextValue = Handlers & {
  layers: LayersPanelLayer[];
  /** The tree after the search filter. */
  visible: LayersPanelLayer[];
  query: string;
  setQuery: (query: string) => void;
  searching: boolean;
  /** No layer can hold others, so rows drop the chevron column. */
  flat: boolean;
  /** Disclosures animate only when not filtering, so search results never slide in or reveal. */
  rowsAnimated: boolean;
  isOpen: (id: string) => boolean;
  toggleOpen: (id: string) => void;
  selected: Set<string>;
  select: (id: string, details: { additive: boolean; range: boolean }) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  canRename: boolean;
  canMove: boolean;
  /** Moves a layer to a place, if that is a real change. */
  moveTo: (id: string, to: LayersPanelPlace) => void;
  /** The keyboard and menu moves available for a layer right now. */
  movesFor: (id: string) => { up?: LayersPanelPlace; down?: LayersPanelPlace; out?: LayersPanelPlace; into?: LayersPanelPlace };
  draggingId: string | null;
  drop: LayersPanelDrop | null;
  /** Where the lifted copy of the dragged row sits, relative to the tree's content. */
  pointer: { x: number; y: number } | null;
  /** Whether a layer can move: not while it, or a frame it sits in, is hidden or locked. */
  isMovable: (id: string) => boolean;
  startDrag: (id: string, clientX: number, clientY: number) => void;
  dragOver: (clientX: number, clientY: number) => void;
  endDrag: (commit: boolean) => void;
  /** Each visible row registers its element, so a drag can find the row under the pointer. */
  rowsRef: MutableRefObject<Map<string, HTMLElement>>;
  treeRef: MutableRefObject<HTMLElement | null>;
  disabled: boolean;
  animated: boolean;
  container?: HTMLElement | null;
  messages: LayersPanelMessages;
};

export const LayersPanelContext = createContext<LayersPanelContextValue | null>(null);

/** State of the nearest LayersPanel, for building custom parts. */
export function useLayersPanel() {
  const context = useContext(LayersPanelContext);
  if (!context) throw new Error("LayersPanel parts must be rendered inside <LayersPanel>.");
  return context;
}

export type LayersPanelRowContextValue = { layer: LayersPanelLayer; selected: boolean; depth: number; nameId: string };

export const LayersPanelRowContext = createContext<LayersPanelRowContextValue | null>(null);

/** The layer of the nearest row, for custom row parts. */
export function useLayersPanelRow() {
  const context = useContext(LayersPanelRowContext);
  if (!context) throw new Error("Layer row parts must be rendered inside a LayersPanelTree row.");
  return context;
}

const matches = (name: string, query: string) => name.toLocaleLowerCase().includes(query.toLocaleLowerCase());

/** Layers whose name matches, plus the ancestors that lead to them. */
export function filterTree(layers: LayersPanelLayer[], query: string): LayersPanelLayer[] {
  return layers.flatMap((layer) => {
    const children = layer.children ? filterTree(layer.children, query) : [];
    if (matches(layer.name, query) || children.length > 0) return [{ ...layer, children: layer.children ? children : undefined }];
    return [];
  });
}

/** Whether a layer has a chevron: it holds layers now, or your app loads them on demand. */
export const hasDisclosure = (layer: LayersPanelLayer) => (layer.children?.length ?? 0) > 0 || !!layer.childrenStatus;

/** Ids of groups whose children have not been requested yet. They stay closed. */
export const unloadedIds = (layers: LayersPanelLayer[]): string[] =>
  layers.flatMap((layer) => [...(layer.childrenStatus === "unloaded" ? [layer.id] : []), ...unloadedIds(layer.children ?? [])]);

/** Ids in the order they show, skipping the children of collapsed layers. */
export const visibleOrder = (layers: LayersPanelLayer[], isOpen: (id: string) => boolean): string[] =>
  layers.flatMap((layer) => [layer.id, ...(layer.children && isOpen(layer.id) ? visibleOrder(layer.children, isOpen) : [])]);

/** The new selection for a click, given the visible order and the last plain or Cmd/Ctrl click. */
export function nextSelection(order: string[], current: Set<string>, anchor: string | null, id: string, { additive, range }: { additive: boolean; range: boolean }) {
  if (range && anchor && order.includes(anchor)) {
    const [from, to] = [order.indexOf(anchor), order.indexOf(id)].sort((a, b) => a - b);
    return [...new Set([...current, ...order.slice(from, to + 1)])];
  }
  if (additive) return current.has(id) ? [...current].filter((value) => value !== id) : [...current, id];
  return [id];
}

type Located<T> = { layer: T; parent: T | null; siblings: T[]; index: number };

/** Finds a layer anywhere in the tree, with its parent and siblings. */
export function locate<T extends LayersPanelLayer>(layers: T[], id: string, parent: T | null = null): Located<T> | null {
  for (const [index, layer] of layers.entries()) {
    if (layer.id === id) return { layer, parent, siblings: layers, index };
    const found = layer.children && locate(layer.children as T[], id, layer);
    if (found) return found;
  }
  return null;
}

/** Whether `id` is `ancestorId` or sits somewhere inside it. */
export function isWithin(layers: LayersPanelLayer[], id: string, ancestorId: string): boolean {
  const ancestor = locate(layers, ancestorId);
  return !!ancestor && (ancestorId === id || !!locate(ancestor.layer.children ?? [], id));
}

/** Applies a move to a tree and returns the new tree, leaving the original untouched. */
export function moveLayer<T extends LayersPanelLayer>(layers: T[], move: { layer: { id: string }; to: LayersPanelPlace }): T[] {
  const found = locate(layers, move.layer.id);
  if (!found) return layers;
  const without = (items: T[]): T[] =>
    items.filter((item) => item.id !== move.layer.id).map((item) => (item.children ? { ...item, children: without(item.children as T[]) } : item));
  const insert = (items: T[], parentId: string | null): T[] => {
    const next = parentId === move.to.parentId ? [...items.slice(0, move.to.index), found.layer, ...items.slice(move.to.index)] : items;
    return next.map((item) => (item.children ? { ...item, children: insert(item.children as T[], item.id) } : item));
  };
  return insert(without(layers), null);
}

/** Where a drop would put a layer, or null when it would not change anything or would nest it inside itself. */
export function placeFor(layers: LayersPanelLayer[], dragId: string, drop: LayersPanelDrop): LayersPanelPlace | null {
  const source = locate(layers, dragId);
  const target = locate(layers, drop.id);
  if (!source || !target || isWithin(layers, drop.id, dragId)) return null;
  if (drop.position === "inside") {
    if (!target.layer.children || target.layer.childrenStatus) return null;
    const to = { parentId: target.layer.id, index: 0 };
    return source.parent?.id === to.parentId && source.index === 0 ? null : to;
  }
  const parentId = target.parent?.id ?? null;
  let index = target.index + (drop.position === "after" ? 1 : 0);
  // Positions count siblings after the dragged layer is removed.
  if ((source.parent?.id ?? null) === parentId && source.index < index) index -= 1;
  if ((source.parent?.id ?? null) === parentId && source.index === index) return null;
  return { parentId, index };
}

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}
