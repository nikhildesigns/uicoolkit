"use client";

import { type MutableRefObject, createContext, useContext, type Ref, type ComponentPropsWithoutRef } from "react";

export type InlineEditStatus = "idle" | "pending" | "error";

/** Why the current draft was not saved. `cause` is whatever `onSave` threw. */
export type InlineEditFailure = { type: "invalid"; message: string } | { type: "save"; cause: unknown };

export type Session = { draft: string; base: string };

export type InlineEditContextValue = {
  variant: InlineEditVariant;
  value: string;
  label: string;
  draft: string;
  editing: boolean;
  disabled: boolean;
  animated: boolean;
  status: InlineEditStatus;
  failure: InlineEditFailure | null;
  /** The committed value changed elsewhere while this draft had unsaved edits. */
  conflict: boolean;
  errorId: string;
  inputRef: MutableRefObject<HTMLInputElement | null>;
  previewRef: MutableRefObject<HTMLButtonElement | null>;
  setDraft: (draft: string) => void;
  start: () => void;
  cancel: () => void;
  save: () => void;
  acceptLatest: () => void;
  keepDraft: () => void;
};

export const InlineEditContext = createContext<InlineEditContextValue | null>(null);

/** State and actions of the nearest InlineEdit, for building custom parts. */
export function useInlineEdit() {
  const context = useContext(InlineEditContext);
  if (!context) throw new Error("InlineEdit parts must be rendered inside <InlineEdit>.");
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

export const enter = "transition duration-200 ease-out starting:-translate-y-0.5 starting:opacity-0 motion-reduce:transition-none";

/**
 * "default" shows a bordered input with Save and Cancel. "ghost" edits on top of the text
 * itself: a line draws in under it, Enter saves, Escape cancels and leaving saves.
 */
export type InlineEditVariant = "default" | "ghost";

export type InlineEditProps = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  /** The committed value. The application owns it and updates it after a successful save. */
  value: string;
  /** Persist the draft. Return a promise to show pending; reject to keep the draft and offer retry. */
  onSave: (draft: string) => void | Promise<unknown>;
  /** Accessible name of the field, such as "Task name". */
  label: string;
  /** Return a message to reject the draft before saving. */
  validate?: (draft: string) => string | null | undefined;
  editing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onCancel?: () => void;
  disabled?: boolean;
  /** Entrance transitions for the editor and messages. Reduced motion is always honored. */
  motion?: boolean;
  variant?: InlineEditVariant;
  /**
   * Leaving the field saves a valid change and reverts an invalid one. Defaults to on for
   * the ghost variant, which has no buttons, and off otherwise.
   */
  saveOnBlur?: boolean;
};
