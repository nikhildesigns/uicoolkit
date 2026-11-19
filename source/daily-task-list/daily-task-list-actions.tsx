"use client";

import { type DailyTask, useDailyTaskListContext } from "./daily-task-list-state";
import { type ReactNode } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import { cn } from "@/lib/utils";
import { useSortableList } from "@/components/ui/sortable-list";
import { ContextMenu, ContextMenuTarget, ContextMenuButton, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";

export type RowOptions = {
  /** Extra content under each title, such as a time or tag. */
  renderMeta?: (task: DailyTask) => ReactNode;
  /** Extra menu items for each task, rendered after the built-in actions. */
  renderActions?: (task: DailyTask) => ReactNode;
  classNames?: { item?: string; row?: string; checkbox?: string; title?: string; menu?: string; menuItem?: string; menuHighlight?: string };
};

/** How long the strike line takes to cross a title before the task moves to Completed. */
export const STRIKE_MS = 320;

export function TaskCheckbox({ task, className }: { task: DailyTask; className?: string }) {
  const { toggle, busy, striking, disabled, animated, messages } = useDailyTaskListContext("DailyTaskList");
  return (
    <Checkbox.Root
      // Shown as checked while the strike plays; it reverts if the app's save fails.
      checked={task.done || striking.has(task.id)}
      onCheckedChange={() => toggle(task)}
      // A save in flight blocks another click in toggle(), without dimming the row before it moves.
      disabled={disabled}
      aria-label={task.done ? `${messages.reopen} ${task.title}` : task.title}
      aria-busy={busy.has(task.id) || undefined}
      className={cn(
        "group grid size-5 shrink-0 place-items-center rounded-[5px] border border-input bg-background shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground data-[disabled]:opacity-50",
        className,
      )}
    >
      <Checkbox.Indicator keepMounted>
        <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
          {/* The tick draws itself in when checked. */}
          <path
            d="M3.5 8.5l3 3 6-7"
            pathLength={1}
            className={cn(
              "[stroke-dasharray:1] [stroke-dashoffset:1] group-data-[checked]:[stroke-dashoffset:0]",
              animated && "transition-[stroke-dashoffset] duration-200 ease-out motion-reduce:transition-none",
            )}
          />
        </svg>
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

export function TaskMenu({ task, index, count, options, children }: { task: DailyTask; index: number; count: number; options: RowOptions; children: ReactNode }) {
  const { messages, disabled, busy, rename, reorder, remove, toggle, setRenamingId, renamingId, animated, portal } = useDailyTaskListContext("DailyTaskList");
  const { move } = useSortableList<DailyTask>();
  const blocked = disabled || busy.has(task.id);
  const item = options.classNames?.menuItem;
  return (
    <ContextMenu disabled={blocked || renamingId === task.id} motion={animated}>
      <ContextMenuTarget className={cn("flex min-w-0 flex-1 items-center gap-2.5", options.classNames?.row)}>
        {children}
        {/* Locked while its save is in flight, without dimming the row before it moves. */}
        <ContextMenuButton aria-label={messages.actions(task.title)} className={cn(busy.has(task.id) && !disabled && "disabled:opacity-100")} />
      </ContextMenuTarget>
      <ContextMenuContent container={portal} className={options.classNames?.menu} highlightClassName={options.classNames?.menuHighlight}>
        {task.done ? (
          <ContextMenuItem className={item} onClick={() => toggle(task)}>
            {messages.reopen}
          </ContextMenuItem>
        ) : (
          rename && (
            <ContextMenuItem className={item} onClick={() => setRenamingId(task.id)}>
              {messages.rename}
            </ContextMenuItem>
          )
        )}
        {reorder && (
          <>
            <ContextMenuItem className={item} disabled={index === 0} onClick={() => move(task.id, index - 1)}>
              {messages.moveUp}
            </ContextMenuItem>
            <ContextMenuItem className={item} disabled={index === count - 1} onClick={() => move(task.id, index + 1)}>
              {messages.moveDown}
            </ContextMenuItem>
          </>
        )}
        {options.renderActions?.(task)}
        <ContextMenuSeparator />
        <ContextMenuItem className={item} variant="destructive" onClick={() => remove(task)}>
          {messages.delete}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
