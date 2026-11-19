"use client";

import { type DailyTask, type DailyTaskListProps, defaultMessages, type Failure, type DailyTaskAction, type Result, type ContextValue, Context } from "./daily-task-list-state";
import { type ForwardedRef, useState, forwardRef } from "react";
import { STRIKE_MS } from "./daily-task-list-actions";
import { cn } from "@/lib/utils";
import { LayoutGroup } from "motion/react";

export function DailyTaskListRoot<T extends DailyTask>(
  {
    tasks,
    onCreate,
    onRename,
    onToggle,
    onReorder,
    onDelete,
    onRestore,
    validateTitle,
    disabled = false,
    motion = true,
    messages: overrides,
    portalContainer,
    className,
    children,
    ...props
  }: DailyTaskListProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const messages = { ...defaultMessages, ...overrides };
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<DailyTask | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [striking, setStriking] = useState<Set<string>>(() => new Set());

  const mark = (id: string, on: boolean) =>
    setBusy((previous) => {
      const next = new Set(previous);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const strike = (id: string, on: boolean) =>
    setStriking((previous) => {
      const next = new Set(previous);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  /** Runs a host callback for one task, marking it busy while a returned promise is pending. */
  const run = (task: DailyTask, action: DailyTaskAction, call: () => Result, done?: () => void, failed?: () => void) => {
    setFailure(null);
    const retry = () => run(task, action, call, done, failed);
    const result = call();
    if (!(result instanceof Promise)) return done?.();
    mark(task.id, true);
    result.then(
      () => {
        mark(task.id, false);
        done?.();
      },
      () => {
        mark(task.id, false);
        failed?.();
        setFailure({ action, title: task.title, retry });
      },
    );
  };

  /** Completing first strikes the title, then saves; a failed save retracts the strike. */
  const toggle = (task: DailyTask) => {
    if (!onToggle || striking.has(task.id) || busy.has(task.id)) return;
    const save = () =>
      run(task, task.done ? "reopen" : "complete", () => onToggle(task as T, !task.done), () => strike(task.id, false), () => strike(task.id, false));
    if (task.done || !motion) return save();
    strike(task.id, true);
    window.setTimeout(save, STRIKE_MS);
  };

  const value: ContextValue = {
    active: tasks.filter((task) => !task.done),
    completed: tasks.filter((task) => task.done),
    messages,
    disabled,
    animated: motion,
    portal: portalContainer,
    busy,
    striking,
    renamingId,
    setRenamingId,
    deleted,
    failure,
    validate: (title) => (validateTitle ? (validateTitle(title) ?? null) : title.trim() ? null : messages.required),
    create: onCreate,
    rename: onRename as ContextValue["rename"],
    reorder: onReorder as ContextValue["reorder"],
    toggle,
    remove: (task) =>
      onDelete &&
      run(task, "delete", () => onDelete(task as T), () => {
        setRenamingId(null);
        setDeleted(task);
      }),
    restore: () => deleted && onRestore && run(deleted, "restore", () => onRestore(deleted as T), () => setDeleted(null)),
    dismiss: () => {
      setFailure(null);
      setDeleted(null);
    },
  };

  return (
    <Context.Provider value={value}>
      <div ref={ref} data-disabled={disabled ? "" : undefined} className={cn("flex flex-col gap-4 text-sm", className)} {...props}>
        {/* One layout group, so a completed task slides into Completed and the rows around it close up together. */}
        <LayoutGroup>{children}</LayoutGroup>
      </div>
    </Context.Provider>
  );
}

/** A day's tasks with capture, editing, ordering, completion and recovery wired together. Compose the parts you need. */
export const DailyTaskList = forwardRef(DailyTaskListRoot) as <T extends DailyTask>(
  props: DailyTaskListProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof DailyTaskListRoot>;
