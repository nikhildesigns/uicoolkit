"use client";

import { type ComponentPropsWithoutRef, type MutableRefObject, type Ref, createContext, useContext } from "react";

/** The six align actions and the two distribute actions. */
export type AlignmentAction = "left" | "center" | "right" | "top" | "middle" | "bottom" | "distribute-horizontal" | "distribute-vertical";

/** What an align action lines layers up against: the parent frame for one layer, the selection's bounds for several. */
export type AlignmentTarget = "parent" | "selection";

/** A spot in a 3×3 grid: where a layer sits in its frame on each axis. */
export type AlignmentPosition = { x: "start" | "center" | "end"; y: "start" | "center" | "end" };

/** Replaceable text, for example to translate. */
export type AlignmentControlMessages = {
  toolbar: string;
  actions: Record<AlignmentAction, string>;
  /** Shown in the tooltip of an action that needs more layers selected. */
  needs: (count: number) => string;
  grid: string;
  position: (position: AlignmentPosition) => string;
};

const words = { start: { x: "left", y: "Top" }, center: { x: "centre", y: "Middle" }, end: { x: "right", y: "Bottom" } } as const;

export const defaultMessages: AlignmentControlMessages = {
  toolbar: "Alignment",
  actions: {
    left: "Align left",
    center: "Align horizontal centres",
    right: "Align right",
    top: "Align top",
    middle: "Align vertical centres",
    bottom: "Align bottom",
    "distribute-horizontal": "Distribute horizontal spacing",
    "distribute-vertical": "Distribute vertical spacing",
  },
  needs: (count) => (count === 1 ? "Select a layer" : `Select ${count} or more layers`),
  grid: "Position in frame",
  position: ({ x, y }) => (x === "center" && y === "center" ? "Centre" : `${words[y].y} ${words[x].x}`),
};

/** How many layers each action needs. */
export const minimumFor = (action: AlignmentAction) => (action.startsWith("distribute") ? 3 : 1);

export type AlignmentControlProps = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  /** How many layers are selected. One aligns to its parent; distribute needs three or more. */
  selectionCount: number;
  /** Called with the action and what it aligns to. Your app moves the layers. */
  onAlign: (action: AlignmentAction, detail: { target: AlignmentTarget }) => void;
  /** Shortcut text shown in each action's tooltip, such as "Alt+A". Your app binds the keys. */
  shortcuts?: Partial<Record<AlignmentAction, string>>;
  disabled?: boolean;
  /** Tooltip transitions. Reduced motion is always honored. */
  motion?: boolean;
  messages?: Partial<AlignmentControlMessages>;
};

export type AlignmentControlContextValue = {
  selectionCount: number;
  align: (action: AlignmentAction) => void;
  shortcuts: Partial<Record<AlignmentAction, string>>;
  disabled: boolean;
  animated: boolean;
  messages: AlignmentControlMessages;
  /** The action that holds the toolbar's single tab stop. */
  active: AlignmentAction | null;
  setActive: (action: AlignmentAction) => void;
  rootRef: MutableRefObject<HTMLDivElement | null>;
};

export const AlignmentControlContext = createContext<AlignmentControlContextValue | null>(null);

export function useAlignmentControl() {
  const context = useContext(AlignmentControlContext);
  if (!context) throw new Error("Alignment Control parts must be used inside <AlignmentControl>.");
  return context;
}

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}
