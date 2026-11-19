"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useDailyTaskListContext } from "./daily-task-list-state";
import { cn } from "@/lib/utils";

/** Shown when there are no active tasks: “Nothing planned yet”, or “All done” once everything is complete. Children replace the message. */
export const DailyTaskListEmpty = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function DailyTaskListEmpty(
  { className, children, ...props },
  ref,
) {
  const { active, completed, messages } = useDailyTaskListContext("DailyTaskListEmpty");
  if (active.length > 0) return null;
  return (
    <div ref={ref} className={cn("rounded-md border border-dashed border-border p-6 text-center text-muted-foreground", className)} {...props}>
      {children ?? (completed.length > 0 ? messages.allDone : messages.empty)}
    </div>
  );
});

/** Undo after a delete, and Retry after a failed action. Your app's data is never shown as changed when a save failed. */
export const DailyTaskListFeedback = forwardRef<HTMLDivElement, Omit<ComponentPropsWithoutRef<"div">, "children">>(function DailyTaskListFeedback(
  { className, ...props },
  ref,
) {
  const { failure, deleted, messages, restore, dismiss, busy } = useDailyTaskListContext("DailyTaskListFeedback");
  const restoring = deleted ? busy.has(deleted.id) : false;
  return (
    <div ref={ref} role="status" aria-live="polite" className={cn("empty:hidden", className)} {...props}>
      {(failure || deleted) && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
            failure
              ? "border-[color-mix(in_oklab,var(--destructive)_30%,var(--background))] bg-[color-mix(in_oklab,var(--destructive)_12%,var(--background))] text-destructive"
              : "border-border bg-muted text-foreground",
          )}
        >
          <span>{failure ? messages.failed(failure.action, failure.title) : deleted && messages.deleted(deleted.title)}</span>
          <span className="flex shrink-0 items-center gap-3">
            {failure ? (
              <button type="button" onClick={failure.retry} className="font-medium underline underline-offset-4">
                {messages.retry}
              </button>
            ) : (
              <button type="button" onClick={restore} aria-disabled={restoring || undefined} className="font-medium underline underline-offset-4 aria-disabled:opacity-50">
                {messages.undo}
              </button>
            )}
            <button type="button" onClick={dismiss} aria-label={messages.dismiss} className="text-muted-foreground hover:text-foreground">
              <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="size-3.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </span>
        </div>
      )}
    </div>
  );
});

/** State of the nearest DailyTaskList, for building your own parts. */
export function useDailyTaskList() {
  const { active, completed, busy, failure, deleted, toggle, remove, restore, dismiss } = useDailyTaskListContext("useDailyTaskList");
  return { active, completed, busy, failure, deleted, toggle, remove, restore, dismiss };
}
