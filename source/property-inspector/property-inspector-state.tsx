"use client";

import { type ComponentPropsWithoutRef, createContext, useContext } from "react";

/** Anything selectable with a stable id; its properties are read by key. */
export type PropertyInspectorItem = { id: string };

/**
 * One edit, applied by the host to every selected item. `property` is a key or a path into a list,
 * such as "fills.0.color". For a property made of parts, such as padding's sides, `value` holds the
 * parts and `changed` names the ones this edit set: apply only those, so parts that differ across
 * the selection keep their own values. A list edit adds `value` as an entry at `insert`, or drops
 * the entry at `remove`, so each item keeps its other entries. `applyPropertyChange` handles all of these.
 */
export type PropertyInspectorChange = { ids: string[]; property: string; value: unknown; changed?: string[]; insert?: number; remove?: number };

/** A list edit: add an entry at an index, or remove the entry at one. */
export type PropertyInspectorListEdit = { insert: number; value: unknown } | { remove: number };

/** Replaceable text. Functions receive the selection count. */
export type PropertyInspectorMessages = {
  label: string;
  empty: string;
  mixed: string;
  multiple: (count: number) => string;
  single: string;
  /** Names an optional group's + and − buttons, given the group's name. */
  add: (group: string) => string;
  remove: (group: string) => string;
  /** Names a list entry's visibility button, given the entry's name, such as "Fill 2". */
  hide: (entry: string) => string;
  show: (entry: string) => string;
  /** Shown in a list whose entries differ across the selection, given the list's name. */
  mixedList: (list: string) => string;
};

export const defaultMessages: PropertyInspectorMessages = {
  label: "Properties",
  empty: "Select something to see its properties.",
  mixed: "Mixed",
  multiple: (count) => `${count} selected`,
  single: "Select one item to change this.",
  add: (group) => `Add ${group}`,
  remove: (group) => `Remove ${group}`,
  hide: (entry) => `Hide ${entry}`,
  show: (entry) => `Show ${entry}`,
  mixedList: (list) => `The selection has different ${list.toLowerCase()} lists. Add one to replace them all.`,
};

export type PropertyInspectorProps<T extends PropertyInspectorItem = PropertyInspectorItem> = Omit<ComponentPropsWithoutRef<"section">, "onChange"> & {
  /** The current selection. The host owns it and the values. */
  items: T[];
  /** Called once per finished edit, with every selected id. */
  onCommit: (change: PropertyInspectorChange) => void;
  /** Called with live values while a value is dragged or held, for a live canvas preview. */
  onPreview?: (change: PropertyInspectorChange) => void;
  disabled?: boolean;
  /** Group and field transitions. Reduced motion is always honored. */
  motion?: boolean;
  /** Where every row's label sits: in its own column ("outside", the default) or inside the row's box. */
  labelPosition?: "outside" | "inside";
  /** "compact" uses shorter, filled fields and body-style group titles. Set the --uicoolkit-field-* variables to fine-tune either density. */
  density?: "default" | "compact";
  /** Where pickers and menus are portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  messages?: Partial<PropertyInspectorMessages>;
};

/**
 * A property's value across the selection. A plain property is one shared value, or mixed.
 * A property read by parts holds each part's shared value, or null for a part that differs;
 * `mixedParts` names those parts and `mixed` is true when any part differs.
 */
export type PropertyReading = { value: unknown; mixed: boolean; mixedParts: string[]; count: number };

export type PropertyInspectorContextValue = {
  count: number;
  disabled: boolean;
  animated: boolean;
  labelPosition: "outside" | "inside";
  container: HTMLElement | null | undefined;
  messages: PropertyInspectorMessages;
  /** Reads a property across the selection; pass parts to merge it part by part. */
  read: (property: string, parts?: readonly string[]) => PropertyReading;
  commit: (property: string, value: unknown, changed?: string[]) => void;
  preview: (property: string, value: unknown, changed?: string[]) => void;
  /** Adds or removes one entry of a list property on every item, as one commit. */
  commitList: (property: string, edit: PropertyInspectorListEdit) => void;
  /** Each item's own value of a property, unmerged, such as each item's list of fills. */
  values: (property: string) => unknown[];
  /** The first selected item, for a single-item title. */
  first: Record<string, unknown> | undefined;
  /** The selected items this context reads and edits. */
  records: Record<string, unknown>[];
  /** The same inspector narrowed to some of its items, such as the ones that have an optional group. */
  scope: (keep: (item: Record<string, unknown>) => boolean) => PropertyInspectorContextValue;
  /** The same inspector with rows reading inside a path, such as "fills.0" for a list entry's rows. */
  nest: (path: string) => PropertyInspectorContextValue;
};

type Shared = Pick<PropertyInspectorContextValue, "disabled" | "animated" | "labelPosition" | "container" | "messages">;

/** The context for some selected items: reads merge across them and edits go to their ids. */
export function selectionContext(
  shared: Shared,
  records: Record<string, unknown>[],
  onCommit: (change: PropertyInspectorChange) => void,
  onPreview: ((change: PropertyInspectorChange) => void) | undefined,
  base = "",
): PropertyInspectorContextValue {
  const ids = records.map((item) => item.id as string);
  const path = (property: string) => (base ? `${base}.${property}` : property);
  const change = (property: string, value: unknown, changed?: string[]): PropertyInspectorChange =>
    changed ? { ids, property: path(property), value, changed } : { ids, property: path(property), value };
  return {
    ...shared,
    count: records.length,
    first: records[0],
    records,
    read: (property, parts) => readProperty(records, path(property), parts),
    commit: (property, value, changed) => onCommit(change(property, value, changed)),
    preview: (property, value, changed) => onPreview?.(change(property, value, changed)),
    commitList: (property, edit) =>
      onCommit("insert" in edit ? { ids, property: path(property), value: edit.value, insert: edit.insert } : { ids, property: path(property), value: undefined, remove: edit.remove }),
    values: (property) => records.map((item) => readPath(item, path(property))),
    scope: (keep) => selectionContext(shared, records.filter(keep), onCommit, onPreview, base),
    nest: (inner) => selectionContext(shared, records, onCommit, onPreview, path(inner)),
  };
}

/** The value at a key or a dotted path, such as "fills.0.color"; undefined where the path ends early. */
export function readPath(item: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (value === null || typeof value !== "object" ? undefined : (value as Record<string, unknown>)[key]), item);
}

/** A copy of the value with the value at a path replaced by update(current), copying each object or list on the way. */
function updatePath(value: unknown, keys: string[], update: (current: unknown) => unknown): unknown {
  if (keys.length === 0) return update(value);
  const [key, ...rest] = keys;
  const current = value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
  if (Array.isArray(current)) {
    const next = [...current];
    next[Number(key)] = updatePath(current[Number(key)], rest, update);
    return next;
  }
  return { ...current, [key]: updatePath(current?.[key], rest, update) };
}

export const PropertyInspectorContext = createContext<PropertyInspectorContextValue | null>(null);

/** Selection state and actions of the nearest PropertyInspector, for building custom fields. */
export function usePropertyInspector() {
  const context = useContext(PropertyInspectorContext);
  if (!context) throw new Error("PropertyInspector parts must be rendered inside <PropertyInspector>.");
  return context;
}

/** Equal values, comparing plain objects and arrays by their contents, such as { x, y } positions or colours. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

/** Reads one property, or each of its parts, across a selection's records. */
export function readProperty(records: Record<string, unknown>[], property: string, parts?: readonly string[]): PropertyReading {
  const values = records.map((item) => readPath(item, property));
  if (!parts) {
    const mixed = values.some((value) => !sameValue(value, values[0]));
    return { value: mixed ? undefined : values[0], mixed, mixedParts: [], count: values.length };
  }
  const merged: Record<string, unknown> = {};
  const mixedParts: string[] = [];
  for (const part of parts) {
    const partValues = values.map((value) => (value as Record<string, unknown> | undefined)?.[part]);
    const differs = partValues.some((value) => !sameValue(value, partValues[0]));
    merged[part] = differs ? null : (partValues[0] ?? null);
    if (differs) mixedParts.push(part);
  }
  return { value: merged, mixed: mixedParts.length > 0, mixedParts, count: values.length };
}

/**
 * The item after a change, if it is one of the change's ids. The property may be a path into a
 * list, such as "fills.0.color". A change with `changed` sets only those parts of the property, so
 * each item keeps its other parts; `insert` and `remove` add or drop one list entry.
 */
export function applyPropertyChange<T extends PropertyInspectorItem>(item: T, change: PropertyInspectorChange): T {
  if (!change.ids.includes(item.id)) return item;
  return updatePath(item, change.property.split("."), (current) => {
    if (change.insert !== undefined) {
      const list = Array.isArray(current) ? [...current] : [];
      list.splice(change.insert, 0, change.value);
      return list;
    }
    if (change.remove !== undefined) return Array.isArray(current) ? current.filter((_, index) => index !== change.remove) : current;
    if (!change.changed) return change.value;
    const next = { ...(current as Record<string, unknown> | undefined) };
    for (const part of change.changed) next[part] = (change.value as Record<string, unknown>)[part];
    return next;
  }) as T;
}
