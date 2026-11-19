"use client";

import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";

/** The fields the block reads. Your task type can carry anything else. */
export type DailyTask = { id: string; title: string; done: boolean };

export type Result = void | Promise<unknown>;

export type DailyTaskAction = "create" | "complete" | "reopen" | "delete" | "restore";

/** Labels and announcements. Replace any of them, for example to translate. */
export type DailyTaskListMessages = {
  placeholder: string;
  add: string;
  /** Accessible name of each task's title field. */
  titleLabel: string;
  required: string;
  progress: (done: number, total: number) => string;
  completed: (count: number) => string;
  empty: string;
  allDone: string;
  rename: string;
  moveUp: string;
  moveDown: string;
  delete: string;
  reopen: string;
  actions: (title: string) => string;
  deleted: (title: string) => string;
  undo: string;
  failed: (action: DailyTaskAction, title: string) => string;
  retry: string;
  dismiss: string;
};

export const defaultMessages: DailyTaskListMessages = {
  placeholder: "Add a task",
  add: "Add",
  titleLabel: "Task title",
  required: "Enter a task name.",
  progress: (done, total) => `${done} of ${total} done`,
  completed: (count) => `Completed (${count})`,
  empty: "Nothing planned yet.",
  allDone: "All done for today.",
  rename: "Rename",
  moveUp: "Move up",
  moveDown: "Move down",
  delete: "Delete",
  reopen: "Reopen",
  actions: (title) => `Actions for ${title}`,
  deleted: (title) => `Deleted “${title}”.`,
  undo: "Undo",
  failed: (action, title) =>
    ({
      create: `Couldn't add “${title}”.`,
      complete: `Couldn't complete “${title}”.`,
      reopen: `Couldn't reopen “${title}”.`,
      delete: `Couldn't delete “${title}”.`,
      restore: `Couldn't restore “${title}”.`,
    })[action],
  retry: "Retry",
  dismiss: "Dismiss",
};

export type Failure = { action: DailyTaskAction; title: string; retry: () => void };

export type ContextValue = {
  active: DailyTask[];
  completed: DailyTask[];
  messages: DailyTaskListMessages;
  disabled: boolean;
  animated: boolean;
  portal: HTMLElement | null | undefined;
  busy: Set<string>;
  /** Tasks whose strike line is playing before their completion is saved. */
  striking: Set<string>;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  deleted: DailyTask | null;
  failure: Failure | null;
  validate: (title: string) => string | null;
  create?: (title: string) => Result;
  rename?: (task: DailyTask, title: string) => Result;
  reorder?: (ordered: DailyTask[], move: { item: DailyTask; from: number; to: number }, section: "active" | "completed") => Result;
  toggle: (task: DailyTask) => void;
  remove: (task: DailyTask) => void;
  restore: () => void;
  dismiss: () => void;
};

export const Context = createContext<ContextValue | null>(null);

export function useDailyTaskListContext(part: string) {
  const context = useContext(Context);
  if (!context) throw new Error(`<${part}> must be used inside <DailyTaskList>.`);
  return context;
}

export type DailyTaskListProps<T extends DailyTask> = Omit<ComponentPropsWithoutRef<"div">, "children" | "onToggle"> & {
  /** All of the day's tasks in your order. Active and completed tasks are shown in separate sections. */
  tasks: T[];
  /** Each callback may return a promise: the block shows it as saving, and a rejection keeps your data unchanged with Retry. */
  onCreate?: (title: string) => Result;
  onRename?: (task: T, title: string) => Result;
  onToggle?: (task: T, done: boolean) => Result;
  /** Called once per completed move with the new order of that section's tasks. Active and completed tasks are ordered separately. */
  onReorder?: (ordered: T[], move: { item: T; from: number; to: number }, section: "active" | "completed") => Result;
  onDelete?: (task: T) => Result;
  /** Restores a deleted task when the person presses Undo. */
  onRestore?: (task: T) => Result;
  /** Return a message to reject a title. Defaults to requiring a non-empty title. */
  validateTitle?: (title: string) => string | null | undefined;
  disabled?: boolean;
  /** Animation in every part. Turning it off never removes an action. Reduced motion is always honored. */
  motion?: boolean;
  messages?: Partial<DailyTaskListMessages>;
  /** Where task menus are portalled. Defaults to document.body. */
  portalContainer?: HTMLElement | null;
  children?: ReactNode;
};
