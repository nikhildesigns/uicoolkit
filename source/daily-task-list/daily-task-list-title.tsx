"use client";

import { type ReactNode } from "react";
import { useDailyTaskListContext, type DailyTask } from "./daily-task-list-state";
import { cn } from "@/lib/utils";
import { type RowOptions } from "./daily-task-list-actions";
import { InlineEdit, InlineEditPreview, InlineEditEditor, InlineEditInput, InlineEditError } from "@/components/ui/inline-edit";

/** A line across the title: drawn in while a task is being completed, and shown on completed tasks. */
export function Struck({ on, children }: { on: boolean; children: ReactNode }) {
  const { animated } = useDailyTaskListContext("DailyTaskList");
  return (
    <span
      className={cn(
        "relative inline-block max-w-full truncate align-bottom before:pointer-events-none before:absolute before:inset-x-0 before:top-1/2 before:h-px before:origin-left before:bg-current",
        on ? "text-muted-foreground before:scale-x-100" : "before:scale-x-0",
        animated && "transition-colors before:transition-transform before:duration-300 before:ease-out motion-reduce:transition-none motion-reduce:before:transition-none",
      )}
    >
      {children}
    </span>
  );
}

// One line of text in a 24px box, so a row's padding is the same above and below its content.
export const titleBox = "min-h-6 h-6";

export function TaskTitle({ task, options }: { task: DailyTask; options: RowOptions }) {
  const { rename, renamingId, setRenamingId, validate, disabled, animated, busy, striking, messages } = useDailyTaskListContext("DailyTaskList");
  if (!rename || task.done) {
    return (
      <span className={cn("flex min-w-0 items-center px-1", titleBox, options.classNames?.title)}>
        <Struck on={task.done}>{task.title}</Struck>
      </span>
    );
  }
  return (
    <InlineEdit
      label={messages.titleLabel}
      value={task.title}
      onSave={(title) => rename(task, title)}
      validate={validate}
      editing={renamingId === task.id}
      onEditingChange={(editing) => setRenamingId(editing ? task.id : null)}
      disabled={disabled || busy.has(task.id)}
      motion={animated}
      // Ghost: edit on top of the title with no buttons; Enter or leaving saves, Escape cancels.
      variant="ghost"
      className="min-w-0 flex-1"
    >
      {/* Not faded while busy: the strike already shows a completion in progress. */}
      <InlineEditPreview className={cn("w-full disabled:opacity-100", titleBox, options.classNames?.title)}>
        {(title) => <Struck on={striking.has(task.id)}>{title}</Struck>}
      </InlineEditPreview>
      <InlineEditEditor>
        <InlineEditInput className={cn(titleBox, options.classNames?.title)} />
      </InlineEditEditor>
      <InlineEditError className="px-1 text-xs" />
    </InlineEdit>
  );
}
