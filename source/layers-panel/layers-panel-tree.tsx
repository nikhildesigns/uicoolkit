"use client";

import { type CSSProperties, type ComponentPropsWithoutRef, type ReactNode, type Ref, forwardRef, useId, useLayoutEffect, useRef } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTarget } from "@/components/ui/context-menu";
import { LayersPanelChildrenState, flatInset, guideClass, guideStyle, inset } from "./layers-panel-children";
import { type LayersPanelLayer, LayersPanelRowContext, hasDisclosure, mergeRefs, useLayersPanel } from "./layers-panel-state";
import { cn } from "@/lib/utils";

type RenderRow = (layer: LayersPanelLayer) => ReactNode;
type LevelProps = { depth: number; renderRow: RenderRow; rowClassName?: string };

type TreeProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** What each row shows after its disclosure chevron, usually LayersPanelIcon, LayersPanelName, LayersPanelToggles and LayersPanelStatus. */
  children: RenderRow;
  /**
   * Class for every row. Rows expose data-selected, data-hidden, data-locked and data-drop ("before",
   * "after" or "inside" while a drag would land there); the drop line inside has data-slot="drop-line".
   */
  rowClassName?: string;
  /** Class for the lifted copy of a row that follows the pointer while dragging. */
  ghostClassName?: string;
};

/**
 * The layer tree. It fills the panel's remaining height and scrolls, so the panel keeps its size while
 * searching; deep nesting or long names scroll sideways instead of widening the panel.
 */
export const LayersPanelTree = forwardRef<HTMLDivElement, TreeProps>(function LayersPanelTree({ children, rowClassName, ghostClassName, className, ...props }, ref) {
  const panel = useLayersPanel();
  // With nothing to show, LayersPanelEmpty takes the tree's space and centres itself in it.
  if (panel.visible.length === 0) return null;
  return (
    // The lifted copy sits outside the scrolling area, so it never widens it or gets clipped.
    <div className="relative -mx-1 flex min-h-0 flex-1 flex-col">
      <div
        ref={mergeRefs(ref, panel.treeRef as Ref<HTMLDivElement>)}
        className={cn("min-h-0 flex-1 overflow-auto overscroll-contain px-1", className)}
        {...props}
      >
        {/* At least as wide as the panel, and as wide as its widest row. */}
        <div className="w-max min-w-full">{panel.visible.length > 0 && <Level layers={panel.visible} depth={0} renderRow={children} rowClassName={rowClassName} />}</div>
      </div>
      <DragGhost className={ghostClassName} />
    </div>
  );
});

/**
 * While dragging, a copy of the row lifts out under the pointer; the row's own place stays dimmed.
 * The copy is a snapshot of the row's markup, so it looks exactly like the row.
 */
function DragGhost({ className }: { className?: string }) {
  const panel = useLayersPanel();
  const ref = useRef<HTMLDivElement | null>(null);
  const { draggingId, pointer } = panel;
  // The pointer is measured from the tree's frame, minus where the row was grabbed.

  useLayoutEffect(() => {
    const ghost = ref.current;
    const row = draggingId ? panel.rowsRef.current.get(draggingId) : undefined;
    if (!ghost) return;
    if (!row) return void ghost.replaceChildren();
    const copy = row.cloneNode(true) as HTMLElement;
    for (const element of [copy, ...copy.querySelectorAll<HTMLElement>("[id]")]) element.removeAttribute("id");
    copy.style.width = `${row.getBoundingClientRect().width}px`;
    ghost.replaceChildren(copy);
  }, [draggingId, panel.rowsRef]);

  const style: CSSProperties | undefined = draggingId && pointer ? { transform: `translate(${pointer.x}px, ${pointer.y}px)` } : undefined;
  return (
    <div aria-hidden ref={element => { element?.setAttribute("inert", ""); }} className="pointer-events-none absolute top-0 left-0 z-30" style={style} hidden={!draggingId || !pointer}>
      <div
        ref={ref}
        className={cn(
          "scale-[1.03] rounded-md bg-background shadow-lg ring-1 ring-border",
          panel.animated && "transition-[scale,box-shadow] duration-150 ease-out starting:scale-100 starting:shadow-none motion-reduce:transition-none",
          className,
        )}
      />
    </div>
  );
}

function Level({ layers, trailing, ...level }: LevelProps & { layers: LayersPanelLayer[]; trailing?: ReactNode }) {
  return (
    <ul className="grid">
      {layers.map((layer, index) => (
        <Node key={layer.id} layer={layer} last={index === layers.length - 1 && !trailing} {...level} />
      ))}
      {trailing}
    </ul>
  );
}

function Node({ layer, last, depth, renderRow, rowClassName }: LevelProps & { layer: LayersPanelLayer; last: boolean }) {
  const panel = useLayersPanel();
  const id = useId();
  const children = layer.children ?? [];
  const open = panel.isOpen(layer.id);
  const pending = !panel.searching && (layer.childrenStatus === "loading" || layer.childrenStatus === "failed");
  const trailing = pending ? <LayersPanelChildrenState layer={layer} depth={depth + 1} /> : undefined;
  return (
    <li
      data-dragging={panel.draggingId === layer.id || undefined}
      className={cn("relative data-dragging:opacity-40", depth > 0 && guideClass(last))}
      style={depth > 0 ? guideStyle(depth) : undefined}
    >
      <Row layer={layer} depth={depth} childrenId={`${id}-children`} renderRow={renderRow} rowClassName={rowClassName} />
      {hasDisclosure(layer) && (
        <div
          id={`${id}-children`}
          aria-hidden={!open || undefined}
          ref={element => { element?.toggleAttribute("inert", !open); }}
          className={cn("grid", open ? "grid-rows-[1fr]" : "invisible grid-rows-[0fr]", panel.rowsAnimated && "transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none")}
        >
          <div className="min-h-0 overflow-hidden">
            {(children.length > 0 || trailing) && <Level layers={children} trailing={trailing} depth={depth + 1} renderRow={renderRow} rowClassName={rowClassName} />}
          </div>
        </div>
      )}
    </li>
  );
}

function Row({ layer, depth, childrenId, renderRow, rowClassName }: LevelProps & { layer: LayersPanelLayer; childrenId: string }) {
  const panel = useLayersPanel();
  const nameId = useId();
  const selected = panel.selected.has(layer.id);
  const hasChildren = hasDisclosure(layer);
  const open = panel.isOpen(layer.id);
  const extra = panel.actions?.(layer);
  const toggles = !!panel.setHidden || !!panel.setLocked;
  const movable = panel.isMovable(layer.id);
  const moves = movable ? panel.movesFor(layer.id) : {};
  const hasMenu = panel.canRename || movable || toggles || !!extra;
  const target = panel.drop?.id === layer.id ? panel.drop.position : null;

  const row = (
    <div
      ref={(node) => {
        if (node) panel.rowsRef.current.set(layer.id, node);
        else panel.rowsRef.current.delete(layer.id);
      }}
      data-selected={selected || undefined}
      data-hidden={layer.hidden || undefined}
      data-locked={layer.locked || undefined}
      data-drop={target ?? undefined}
      className={cn(
        // Selection is a tint of the primary colour, which stays visible in light and dark themes; hover stays grey.
        "group/row relative flex h-7 min-w-0 items-center gap-1 rounded-md pr-1 data-selected:bg-primary/10",
        !panel.draggingId && "hover:bg-accent data-selected:hover:bg-primary/15",
        // Dropping into a frame outlines it; before and after draw a line at the row's edge.
        "data-[drop=inside]:bg-primary/10 data-[drop=inside]:ring-1 data-[drop=inside]:ring-primary data-[drop=inside]:ring-inset",
        panel.disabled && "opacity-60",
        rowClassName,
      )}
      style={{ paddingLeft: panel.flat ? flatInset : inset(depth) }}
      // Clicking the icon or empty row space selects too; buttons inside handle their own clicks.
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, input")) return;
        panel.select(layer.id, { additive: event.metaKey || event.ctrlKey, range: event.shiftKey });
      }}
    >
      {(target === "before" || target === "after") && (
        <span
          aria-hidden
          data-slot="drop-line"
          className={cn("pointer-events-none absolute right-1 z-10 h-0.5 rounded-full bg-primary", target === "before" ? "-top-px" : "-bottom-px")}
          style={{ left: panel.flat ? flatInset : inset(depth) + 18 }}
        />
      )}
      {hasChildren ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={childrenId}
          aria-label={open ? panel.messages.collapse(layer.name) : panel.messages.expand(layer.name)}
          disabled={panel.searching}
          onClick={() => panel.toggleOpen(layer.id)}
          className="grid size-4 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:opacity-100"
        >
          {/* Points right while collapsed and down while open, as in a design tool's layer tree. */}
          <svg aria-hidden viewBox="0 0 10 6" className={cn("h-1.5 w-2.5", !open && "-rotate-90", panel.animated && "transition-transform duration-150 motion-reduce:transition-none")} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 1.25 5 4.75l3.5-3.5" />
          </svg>
        </button>
      ) : panel.flat ? null : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
      <LayersPanelRowContext.Provider value={{ layer, selected, depth, nameId }}>{renderRow(layer)}</LayersPanelRowContext.Provider>
    </div>
  );

  if (!hasMenu) return row;
  const { up, down, out, into } = moves;
  return (
    // Renaming takes the keyboard and pointer, so the menu stays closed meanwhile.
    <ContextMenu disabled={panel.disabled || panel.renamingId === layer.id || !!panel.draggingId} motion={panel.animated}>
      <ContextMenuTarget className="min-w-0">{row}</ContextMenuTarget>
      <ContextMenuContent container={panel.container}>
        {panel.canRename && <ContextMenuItem onClick={() => panel.setRenamingId(layer.id)}>{panel.messages.rename}</ContextMenuItem>}
        {movable && (
          <>
            <ContextMenuItem disabled={!up} onClick={() => up && panel.moveTo(layer.id, up)}>
              {panel.messages.moveUp}
            </ContextMenuItem>
            <ContextMenuItem disabled={!down} onClick={() => down && panel.moveTo(layer.id, down)}>
              {panel.messages.moveDown}
            </ContextMenuItem>
            {out && <ContextMenuItem onClick={() => panel.moveTo(layer.id, out)}>{panel.messages.moveOut}</ContextMenuItem>}
            {into && <ContextMenuItem onClick={() => panel.moveTo(layer.id, into)}>{panel.messages.moveInto}</ContextMenuItem>}
          </>
        )}
        {toggles && (
          <>
            <ContextMenuSeparator />
            {panel.setHidden && (
              <ContextMenuItem onClick={() => panel.setHidden?.(layer, !layer.hidden)}>{layer.hidden ? panel.messages.show : panel.messages.hide}</ContextMenuItem>
            )}
            {panel.setLocked && (
              <ContextMenuItem onClick={() => panel.setLocked?.(layer, !layer.locked)}>{layer.locked ? panel.messages.unlock : panel.messages.lock}</ContextMenuItem>
            )}
          </>
        )}
        {extra}
      </ContextMenuContent>
    </ContextMenu>
  );
}
