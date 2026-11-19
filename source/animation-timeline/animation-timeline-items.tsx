"use client";

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTarget } from "@/components/ui/context-menu";
import { type TimelineEdge, type TimelineItem, itemEnd, itemStart } from "./animation-timeline-math";
import { useAnimationTimeline } from "./animation-timeline-state";
import { cn } from "@/lib/utils";

const minLabelWidth = 44;
const minDurationWidth = 96;

function EdgeHandle({ item, edge }: { item: TimelineItem; edge: TimelineEdge }) {
  const { beginDrag } = useAnimationTimeline();
  return (
    <span
      aria-hidden
      data-slot="animation-timeline-edge"
      data-edge={edge}
      // On touch, only the selected clip's edges take a press, so a tap on the clip never resizes it.
      // There they are 44px targets centered on the clip's edge.
      className={cn(
        "absolute inset-y-0 z-10 w-2 cursor-ew-resize touch-none after:absolute after:inset-y-1.5 after:w-0.5 after:rounded-full after:bg-current after:opacity-0 group-hover/item:after:opacity-50 group-data-selected/item:after:opacity-70 pointer-coarse:inset-y-auto pointer-coarse:top-1/2 pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:-translate-y-1/2 pointer-coarse:after:inset-y-3.5 pointer-coarse:not-group-data-selected/item:pointer-events-none",
        edge === "start" ? "left-0 after:left-0.5 pointer-coarse:-left-5 pointer-coarse:after:left-[1.375rem]" : "right-0 after:right-0.5 pointer-coarse:-right-5 pointer-coarse:after:right-[1.375rem]",
      )}
      onPointerDown={(event) => beginDrag(event, item, edge)}
    />
  );
}

/** One clip or keyframe, placed by its time and track. */
export function AnimationTimelineItem({ item }: { item: TimelineItem }) {
  const { tracks, selection, pixelsPerSecond, draggingIds, armedId, container, disabled, messages, instructionsId, formatTime, isEditable, menuIds, beginDrag, cancelDrag, selectForMenu, onItemKeyDown, onDuplicate, onDelete } = useAnimationTimeline();
  const index = tracks.findIndex((track) => track.id === item.trackId);
  if (index < 0) return null;
  const track = tracks[index];
  const editable = isEditable(item);
  const selected = selection.includes(item.id);
  const clip = item.kind === "clip";
  const name = item.label ?? (clip ? messages.untitledClip : messages.untitledKeyframe);
  const left = itemStart(item) * pixelsPerSecond;
  const rowTop = (index / tracks.length) * 100;
  const rowHeight = 100 / tracks.length;
  const label = clip ? messages.clip(name, track.label, formatTime(itemStart(item)), formatTime(itemEnd(item))) : messages.keyframe(name, track.label, formatTime(itemStart(item)));
  const width = clip ? Math.max(item.duration * pixelsPerSecond, 8) : 0;
  const position = clip
    ? { left, width, top: `calc(${rowTop}% + 0.25rem)`, height: `calc(${rowHeight}% - 0.5rem)` }
    : { left: `clamp(0.75rem, ${left}px, calc(100% - 0.75rem))`, top: `${rowTop + rowHeight / 2}%` };

  return (
    <ContextMenu
      disabled={disabled || !editable || (!onDuplicate && !onDelete)}
      onOpenChange={(open) => {
        if (open) cancelDrag();
      }}
    >
      <ContextMenuTarget
        role="button"
        tabIndex={editable ? 0 : -1}
        aria-label={label}
        aria-pressed={selected}
        aria-disabled={!editable || undefined}
        aria-describedby={editable ? instructionsId : undefined}
        data-timeline-item={item.kind}
        data-selected={selected ? "" : undefined}
        data-dragging={draggingIds.includes(item.id) ? "" : undefined}
        data-armed={armedId === item.id ? "" : undefined}
        className={cn(
          "group/item absolute touch-pan-x touch-pan-y select-none focus-visible:not-data-pointer-focus:ring-2 focus-visible:not-data-pointer-focus:ring-ring [-webkit-touch-callout:none] data-dragging:z-[5] data-selected:z-[4]",
          editable ? "cursor-grab data-dragging:cursor-grabbing" : "cursor-not-allowed",
          track.hidden && "opacity-40",
          !editable && !track.hidden && "opacity-60",
          clip
            ? "flex items-center justify-between gap-2 rounded-[5px] bg-foreground/25 px-2 text-xs text-foreground transition-colors hover:bg-foreground/30 data-armed:ring-2 data-armed:ring-primary data-selected:bg-primary data-selected:text-primary-foreground hover:data-selected:bg-primary motion-reduce:transition-none dark:bg-foreground/85 dark:text-background dark:hover:bg-foreground dark:data-selected:bg-primary dark:data-selected:text-primary-foreground dark:hover:data-selected:bg-primary"
            : "grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm pointer-coarse:size-11",
        )}
        style={position}
        // A click selects without the keyboard focus ring; the ring returns when focus next arrives by keyboard.
        onPointerDownCapture={(event) => {
          event.currentTarget.dataset.pointerFocus = "";
        }}
        onBlur={(event) => {
          delete event.currentTarget.dataset.pointerFocus;
        }}
        onPointerDown={(event) => beginDrag(event, item)}
        onKeyDown={(event) => onItemKeyDown(event, item)}
        onContextMenuCapture={() => selectForMenu(item)}
      >
        {clip ? (
          <>
            {width >= minLabelWidth && <span className="pointer-events-none min-w-0 truncate">{name}</span>}
            {width >= minDurationWidth && <span className="pointer-events-none shrink-0 font-mono text-[0.6875rem] tabular-nums opacity-80">{Number(item.duration.toFixed(2))}s</span>}
            {editable && <EdgeHandle item={item} edge="start" />}
            {editable && <EdgeHandle item={item} edge="end" />}
          </>
        ) : (
          <span aria-hidden className="size-2.5 rotate-45 rounded-[2px] bg-foreground/70 transition-transform group-hover/item:scale-125 group-data-armed/item:scale-125 group-data-selected/item:bg-primary group-data-selected/item:ring-2 group-data-selected/item:ring-primary/30 motion-reduce:transition-none" />
        )}
      </ContextMenuTarget>
      <ContextMenuContent container={container} positionMethod={container ? "fixed" : undefined}>
        {onDuplicate && <ContextMenuItem onClick={() => onDuplicate(menuIds(item))}>{messages.duplicate}</ContextMenuItem>}
        {onDelete && (
          <ContextMenuItem variant="destructive" onClick={() => onDelete(menuIds(item))}>
            {messages.delete}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
