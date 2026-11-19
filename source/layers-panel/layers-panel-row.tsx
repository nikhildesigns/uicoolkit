"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { type ComponentPropsWithoutRef, type KeyboardEvent, type MouseEvent, type ReactNode, forwardRef, useRef } from "react";
import { InlineEdit, InlineEditEditor, InlineEditError, InlineEditInput, InlineEditPreview } from "@/components/ui/inline-edit";
import { useLayersPanel, useLayersPanelRow } from "./layers-panel-state";
import { cn } from "@/lib/utils";

export type LayersPanelKind = "frame" | "group" | "text" | "image" | "shape";

const kindIcon: Record<LayersPanelKind, ReactNode> = {
  frame: <path d="M5.5 2.5v11M10.5 2.5v11M2.5 5.5h11M2.5 10.5h11" />,
  group: <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" strokeDasharray="2 2" />,
  text: <path d="M3.5 3.5h9M8 3.5v9" />,
  image: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <path d="m3 12 3.5-4 2.5 3 1.5-1.5 2.5 2.5" />
    </>
  ),
  shape: <circle cx="8" cy="8" r="5" />,
};

type IconProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  kind?: LayersPanelKind;
  /** Replace the kind's icon. */
  children?: ReactNode;
};

/** Pointer travel before a press on the handle becomes a drag, so a click does nothing. */
const dragThreshold = 3;

/**
 * The drag handle. Drag it to move the layer before or after another, or into a frame. With the
 * keyboard, Up and Down move it among its siblings, Left moves it out of its frame and Right into
 * the frame above it.
 */
function LayersPanelHandle() {
  const panel = useLayersPanel();
  const { layer } = useLayersPanelRow();
  const press = useRef<{ pointerId: number; y: number; moved: boolean } | null>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves = panel.movesFor(layer.id);
    const to = ({ ArrowUp: moves.up, ArrowDown: moves.down, ArrowLeft: moves.out, ArrowRight: moves.into } as const)[event.key as "ArrowUp"];
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    if (!to) return;
    panel.moveTo(layer.id, { parentId: to.parentId, index: to.index });
    // The row may move to another level and remount, so focus follows it to its new place.
    requestAnimationFrame(() => panel.rowsRef.current.get(layer.id)?.querySelector<HTMLButtonElement>('[data-slot="handle"]')?.focus());
  };
  return (
    <button
      type="button"
      data-slot="handle"
      aria-label={panel.messages.handle(layer.name)}
      aria-roledescription="drag handle"
      disabled={panel.disabled}
      className="absolute inset-0 grid cursor-grab touch-none place-items-center rounded-sm text-muted-foreground opacity-0 outline-none group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:bg-foreground/10 focus-visible:text-foreground active:cursor-grabbing pointer-coarse:opacity-100"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // Keeps the press from starting a text selection across the rows.
        event.preventDefault();
        // Capture keeps the drag going outside the handle; a pointer the browser no longer tracks just skips it.
        try {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        } catch {}
        press.current = { pointerId: event.pointerId, y: event.clientY, moved: false };
      }}
      onPointerMove={(event) => {
        const current = press.current;
        if (!current || current.pointerId !== event.pointerId) return;
        if (!current.moved) {
          if (Math.abs(event.clientY - current.y) < dragThreshold) return;
          current.moved = true;
          panel.startDrag(layer.id, event.clientX, event.clientY);
        }
        panel.dragOver(event.clientX, event.clientY);
      }}
      onPointerUp={() => {
        const moved = press.current?.moved;
        press.current = null;
        if (moved) panel.endDrag(true);
      }}
      onPointerCancel={() => {
        const moved = press.current?.moved;
        press.current = null;
        if (moved) panel.endDrag(false);
      }}
      onKeyDown={onKeyDown}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
        {[5.5, 10.5].flatMap((x) => [4, 8, 12].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />))}
      </svg>
    </button>
  );
}

/**
 * What kind of layer this is. While moving is on, hovering or focusing the row swaps the icon
 * for the drag handle in the same spot (always the handle on touch screens, which cannot hover).
 */
export const LayersPanelIcon = forwardRef<HTMLSpanElement, IconProps>(function LayersPanelIcon({ kind = "frame", children, className, ...props }, ref) {
  const panel = useLayersPanel();
  const { layer } = useLayersPanelRow();
  // Hidden and locked layers, and anything inside them, keep their icon and cannot be dragged.
  const canMove = panel.isMovable(layer.id);
  const icon = children ?? (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {kindIcon[kind]}
    </svg>
  );
  return (
    <span ref={ref} data-kind={kind} className={cn("relative grid size-5 shrink-0 place-items-center text-muted-foreground group-data-selected/row:text-foreground", className)} {...props}>
      <span
        aria-hidden
        className={cn(
          "grid place-items-center",
          canMove && "group-hover/row:opacity-0 group-has-[[data-slot=handle]:focus-visible]/row:opacity-0 pointer-coarse:opacity-0",
        )}
      >
        {icon}
      </span>
      {canMove && <LayersPanelHandle />}
    </span>
  );
});

/**
 * The layer's name. A click selects it (Cmd/Ctrl adds, Shift selects a range); double click or F2
 * renames it in place when renaming is on. Enter or leaving saves, Escape cancels.
 */
export const LayersPanelName = forwardRef<HTMLButtonElement, { className?: string }>(function LayersPanelName({ className }, ref) {
  const panel = useLayersPanel();
  const { layer, selected, nameId } = useLayersPanelRow();
  const text = cn("text-[13px] text-muted-foreground group-data-selected/row:text-foreground group-data-hidden/row:opacity-50", className);
  const select = (event: MouseEvent) => {
    event.preventDefault();
    panel.select(layer.id, { additive: event.metaKey || event.ctrlKey, range: event.shiftKey });
  };
  if (!panel.canRename)
    return (
      <button ref={ref} id={nameId} type="button" aria-pressed={selected} disabled={panel.disabled} onClick={select} className={cn("h-6 min-w-0 flex-1 truncate rounded-sm px-1 text-left outline-none focus-visible:bg-foreground/10", text)}>
        {layer.name}
      </button>
    );
  return (
    <InlineEdit
      label={panel.messages.nameLabel}
      value={layer.name}
      onSave={(name) => panel.rename?.(layer, name)}
      validate={panel.validate}
      editing={panel.renamingId === layer.id}
      onEditingChange={(editing) => panel.setRenamingId(editing ? layer.id : null)}
      disabled={panel.disabled}
      motion={panel.animated}
      variant="ghost"
      className="min-w-0 flex-1"
    >
      <InlineEditPreview
        ref={ref}
        id={nameId}
        aria-pressed={selected}
        className={cn("h-6 min-h-6 w-full truncate after:hidden", text)}
        // One click selects, as in a design tool's layer list; renaming takes a double click or F2.
        onClick={select}
        onDoubleClick={() => panel.setRenamingId(layer.id)}
        onKeyDown={(event) => {
          if (event.key !== "F2") return;
          event.preventDefault();
          panel.setRenamingId(layer.id);
        }}
      />
      <InlineEditEditor className="after:hidden">
        <InlineEditInput className={cn("h-6 text-[13px]", className)} />
      </InlineEditEditor>
      <InlineEditError className="px-1 text-xs" />
    </InlineEdit>
  );
});

const toggleButton =
  "hidden size-6 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:grid focus-visible:bg-foreground/10 focus-visible:text-foreground group-hover/row:grid group-focus-within/row:grid data-active:grid pointer-coarse:group-data-selected/row:grid disabled:opacity-50";

/** Hide and lock toggles, shown while the row is hovered or focused and always while active. */
export function LayersPanelToggles({ className }: { className?: string }) {
  const panel = useLayersPanel();
  const { layer } = useLayersPanelRow();
  if (!panel.setHidden && !panel.setLocked) return null;
  return (
    <span className={cn("flex shrink-0 items-center", className)}>
      {panel.setHidden && (
        <button
          type="button"
          aria-pressed={!!layer.hidden}
          aria-label={`${layer.hidden ? panel.messages.show : panel.messages.hide} ${layer.name}`}
          data-active={layer.hidden || undefined}
          disabled={panel.disabled}
          onClick={() => panel.setHidden?.(layer, !layer.hidden)}
          className={toggleButton}
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            {layer.hidden ? (
              <path d="M2.5 8s2-3.75 5.5-3.75S13.5 8 13.5 8s-2 3.75-5.5 3.75S2.5 8 2.5 8ZM3 13 13 3" />
            ) : (
              <>
                <path d="M2.5 8s2-3.75 5.5-3.75S13.5 8 13.5 8s-2 3.75-5.5 3.75S2.5 8 2.5 8Z" />
                <circle cx="8" cy="8" r="1.75" />
              </>
            )}
          </svg>
        </button>
      )}
      {panel.setLocked && (
        <button
          type="button"
          aria-pressed={!!layer.locked}
          aria-label={`${layer.locked ? panel.messages.unlock : panel.messages.lock} ${layer.name}`}
          data-active={layer.locked || undefined}
          disabled={panel.disabled}
          onClick={() => panel.setLocked?.(layer, !layer.locked)}
          className={toggleButton}
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
            <path d={layer.locked ? "M5.5 7V5a2.5 2.5 0 0 1 5 0v2" : "M5.5 7V5a2.5 2.5 0 0 1 4.9-.7"} />
          </svg>
        </button>
      )}
    </span>
  );
}

export type LayersPanelTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneColor: Record<LayersPanelTone, string> = {
  neutral: "text-muted-foreground",
  info: "text-sky-600 dark:text-sky-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

const toneIcon: Record<LayersPanelTone, ReactNode> = {
  neutral: <circle cx="8" cy="8" r="5.5" strokeDasharray="2.2 2.2" />,
  info: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5.25V8l1.75 1.25" />
    </>
  ),
  success: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m5.75 8.1 1.5 1.5 3-3.1" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2.75 13.75 13H2.25Z" />
      <path d="M8 6.75v2.5M8 11.25h.01" />
    </>
  ),
  danger: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m6.25 6.25 3.5 3.5m0-3.5-3.5 3.5" />
    </>
  ),
};

type StatusProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** The status's full name, such as "In review". Shown in a tooltip on hover and read by screen readers. */
  label: string;
  tone?: LayersPanelTone;
  /** Replace the tone's icon. */
  children?: ReactNode;
  tooltipClassName?: string;
};

/** A layer's status as an icon at the row's far right, named in a tooltip, matching Screen Frame's status. */
export const LayersPanelStatus = forwardRef<HTMLSpanElement, StatusProps>(function LayersPanelStatus(
  { label, tone = "neutral", children, className, tooltipClassName, ...props },
  ref,
) {
  const panel = useLayersPanel();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<span ref={ref} role="img" aria-label={label} data-tone={tone} className={cn("inline-flex size-6 shrink-0 items-center justify-center", toneColor[tone], className)} {...props} />}
      >
        {children ?? (
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            {toneIcon[tone]}
          </svg>
        )}
      </Tooltip.Trigger>
      <Tooltip.Portal container={panel.container ?? undefined}>
        <Tooltip.Positioner side="top" sideOffset={6} className="z-50">
          <Tooltip.Popup
            className={cn(
              "rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md",
              panel.animated &&
                "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none",
              tooltipClassName,
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
