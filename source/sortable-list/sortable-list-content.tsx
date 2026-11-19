"use client";

import { type ComponentPropsWithoutRef, type ReactNode, type ForwardedRef, forwardRef } from "react";
import { useList, type ListContextValue, type Key, ItemContext, useItem } from "./sortable-list-state";
import { Reorder, useDragControls } from "motion/react";
import { cn } from "@/lib/utils";

export type SortableListContentProps = Omit<ComponentPropsWithoutRef<"ul">, "children" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  /** Renders each item; wrap the result in SortableListItem. */
  children: (item: never, index: number) => ReactNode;
};

export function SortableListContentInner<T>(
  { className, children, ...props }: Omit<SortableListContentProps, "children"> & { children: (item: T, index: number) => ReactNode },
  ref: ForwardedRef<HTMLUListElement>,
) {
  const { ids, byId, setLocal, draggingId, status } = useList("SortableListContent") as ListContextValue<T>;
  if (ids.length === 0) return null;
  return (
    <Reorder.Group
      ref={ref}
      as="ul"
      axis="y"
      values={ids}
      // Every drag step only previews; the drop decides whether the order changes.
      onReorder={(next) => draggingId !== null && setLocal(next)}
      aria-busy={status === "pending" || undefined}
      className={cn("flex flex-col gap-2", className)}
      // DOM drag handlers are omitted from the props type, so the rest are safe to pass to Motion.
      {...(props as object)}
    >
      {ids.map((id, index) => (
        <ItemSlot key={id} id={id} index={index}>
          {children(byId.get(id) as T, index)}
        </ItemSlot>
      ))}
    </Reorder.Group>
  );
}

/** The ordered list. Pass a render function that returns a SortableListItem. */
export const SortableListContent = forwardRef(SortableListContentInner) as <T>(
  props: Omit<SortableListContentProps, "children"> & { children: (item: T, index: number) => ReactNode; ref?: ForwardedRef<HTMLUListElement> },
) => ReturnType<typeof SortableListContentInner>;

export function ItemSlot({ id, index, children }: { id: Key; index: number; children: ReactNode }) {
  const { byId, locked, disabled, status } = useList("SortableListItem");
  const controls = useDragControls();
  const item = byId.get(id);
  const movable = item !== undefined && !disabled && status !== "pending" && !locked(item);
  return <ItemContext.Provider value={{ id, index, controls, movable }}>{children}</ItemContext.Provider>;
}

export type SortableListItemProps = Omit<ComponentPropsWithoutRef<"li">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">;

/** One row. Dragging starts only from its SortableListHandle, so the rest of the row stays clickable and scrollable. */
export const SortableListItem = forwardRef<HTMLLIElement, SortableListItemProps>(function SortableListItem({ className, ...props }, ref) {
  const { animated, draggingId, endDrag, locked, byId } = useList("SortableListItem");
  const { id, controls } = useItem("SortableListItem");
  const item = byId.get(id);
  return (
    <Reorder.Item
      ref={ref}
      value={id}
      dragListener={false}
      dragControls={controls}
      // Motion's own Space-to-grab keyboard mode is replaced by the move buttons and handle arrows.
      tabIndex={-1}
      transition={animated ? undefined : { duration: 0 }}
      onDragEnd={() => endDrag(id)}
      data-dragging={draggingId === id ? "" : undefined}
      data-locked={item !== undefined && locked(item) ? "" : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm outline-none transition-shadow data-[dragging]:shadow-lg data-[dragging]:ring-2 data-[dragging]:ring-ring/20",
        className,
      )}
      {...(props as object)}
    />
  );
});
