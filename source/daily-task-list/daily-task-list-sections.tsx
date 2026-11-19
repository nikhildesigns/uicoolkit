"use client";

import { type DailyTask, useDailyTaskListContext } from "./daily-task-list-state";
import { type RowOptions, TaskMenu, TaskCheckbox } from "./daily-task-list-actions";
import { SortableList, SortableListContent, SortableListItem, SortableListHandle, SortableListError } from "@/components/ui/sortable-list";
import { cn } from "@/lib/utils";
import { TaskTitle } from "./daily-task-list-title";
import { type ComponentPropsWithoutRef, forwardRef, useState, useId } from "react";

/**
 * The rows of one section. Active and completed tasks share this exact row: handle,
 * checkbox, title with optional meta and the actions button. Rows carry a layout id so
 * a completed task slides from one section into the other.
 */
export function TaskRows({ section, tasks, options }: { section: "active" | "completed"; tasks: DailyTask[]; options: RowOptions }) {
  const { reorder, disabled, busy, striking, animated } = useDailyTaskListContext("DailyTaskList");
  return (
    <SortableList
      items={tasks}
      getId={(task) => task.id}
      getLabel={(task) => task.title}
      isLocked={(task) => busy.has(task.id) || striking.has(task.id)}
      onOrderChange={reorder && ((next, move) => reorder(next, move, section))}
      disabled={disabled || !reorder}
      motion={animated}
      className="gap-2"
    >
      <SortableListContent>
        {(task: DailyTask, index: number) => (
          <SortableListItem
            {...(animated ? { layoutId: `daily-task-${task.id}`, transition: { layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } } : {})}
            className={cn("gap-1 py-2 pl-1 pr-1.5", options.classNames?.item)}
          >
            <SortableListHandle className={cn((busy.has(task.id) || striking.has(task.id)) && !disabled && "aria-disabled:opacity-100")} />
            <TaskMenu task={task} index={index} count={tasks.length} options={options}>
              <TaskCheckbox task={task} className={options.classNames?.checkbox} />
              <span className="flex min-w-0 flex-1 flex-col">
                <TaskTitle task={task} options={options} />
                {options.renderMeta && <span className="truncate px-1 text-xs text-muted-foreground">{options.renderMeta(task)}</span>}
              </span>
            </TaskMenu>
          </SortableListItem>
        )}
      </SortableListContent>
      <SortableListError />
    </SortableList>
  );
}

export type DailyTaskListActiveProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & RowOptions;

/** Active tasks: complete, rename, reorder by handle or menu, and delete. */
export const DailyTaskListActive = forwardRef<HTMLDivElement, DailyTaskListActiveProps>(function DailyTaskListActive(
  { renderMeta, renderActions, classNames, className, ...props },
  ref,
) {
  const { active } = useDailyTaskListContext("DailyTaskListActive");
  if (active.length === 0) return null;
  return (
    <div ref={ref} className={className} {...props}>
      <TaskRows section="active" tasks={active} options={{ renderMeta, renderActions, classNames }} />
    </div>
  );
});

export type DailyTaskListCompletedProps = Omit<ComponentPropsWithoutRef<"section">, "children"> &
  RowOptions & {
    /** Start collapsed. Defaults to open. */
    defaultCollapsed?: boolean;
  };

/** Completed tasks in their own collapsible section, with the same rows: reorder among themselves, reopen or delete. */
export const DailyTaskListCompleted = forwardRef<HTMLElement, DailyTaskListCompletedProps>(function DailyTaskListCompleted(
  { renderMeta, renderActions, classNames, defaultCollapsed = false, className, ...props },
  ref,
) {
  const { completed, messages, animated } = useDailyTaskListContext("DailyTaskListCompleted");
  const [open, setOpen] = useState(!defaultCollapsed);
  const regionId = useId();
  if (completed.length === 0) return null;
  return (
    <section ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 self-start rounded-md px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:bg-foreground/10 focus-visible:text-foreground"
      >
        <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={cn("size-3.5", open && "rotate-90", animated && "transition-transform duration-200 motion-reduce:transition-none")}>
          <path d="M6 4l4 4-4 4" />
        </svg>
        {messages.completed(completed.length)}
      </button>
      <div id={regionId} hidden={!open}>
        <TaskRows section="completed" tasks={completed} options={{ renderMeta, renderActions, classNames }} />
      </div>
    </section>
  );
});
