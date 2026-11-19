"use client";

import { ContextMenu, ContextMenuButton, ContextMenuContent, ContextMenuItem, ContextMenuTarget } from "@/components/ui/context-menu";
import { InlineEdit, InlineEditEditor, InlineEditError, InlineEditInput, InlineEditPreview } from "@/components/ui/inline-edit";
import { type ComparisonSlot, type ComparisonVersion, useVersionComparison } from "./version-comparison-state";
import { cn } from "@/lib/utils";

/** A version's letter and name on the stage, with Rename, Duplicate and Delete in its menu. */
export function VersionComparisonLabel({ version, slot, align = "left" }: { version: ComparisonVersion; slot: ComparisonSlot; align?: "left" | "right" }) {
  const { container, disabled, renamingId, messages, onRename, onDuplicate, onDelete, setRenamingId } = useVersionComparison();
  const hasActions = !!(onRename || onDuplicate || onDelete);
  return (
    <ContextMenu disabled={disabled || !hasActions}>
      <ContextMenuTarget
        data-slot="version-comparison-label"
        className={cn("group/label absolute top-2 z-[1] flex max-w-[calc(100%-5rem)] min-w-0 items-center gap-1 rounded-[5px] bg-background/90 py-0.5 pr-0.5 pl-1.5 text-xs text-foreground", align === "left" ? "left-2" : "right-2")}
      >
        <span className="font-medium">{slot === "a" ? messages.versionA : messages.versionB}</span>
        {onRename ? (
          <InlineEdit label={messages.name} value={version.name} variant="ghost" editing={renamingId === version.id} disabled={disabled} className="min-w-0" validate={(name) => (name.trim() ? null : messages.name)} onEditingChange={(editing) => setRenamingId(editing ? version.id : null)} onSave={(name) => onRename(version.id, name.trim())}>
            <InlineEditPreview className="block min-h-5 max-w-full truncate px-0.5 text-xs text-foreground/70 after:hidden" />
            <InlineEditEditor className="after:hidden">
              <InlineEditInput className="h-5 w-28 px-0.5 text-xs" />
            </InlineEditEditor>
            <InlineEditError className="text-xs" />
          </InlineEdit>
        ) : (
          <span className="min-w-0 truncate text-foreground/70">{version.name}</span>
        )}
        {hasActions && <ContextMenuButton aria-label={messages.actions(version.name)} className="relative size-5 shrink-0 after:absolute after:-inset-3 [&_svg]:size-3.5" />}
      </ContextMenuTarget>
      <ContextMenuContent container={container} positionMethod={container ? "fixed" : undefined}>
        {onRename && <ContextMenuItem onClick={() => setRenamingId(version.id)}>{messages.rename}</ContextMenuItem>}
        {onDuplicate && <ContextMenuItem onClick={() => onDuplicate(version.id)}>{messages.duplicate}</ContextMenuItem>}
        {onDelete && (
          <ContextMenuItem variant="destructive" disabled={version.current} onClick={() => onDelete(version.id)}>
            {messages.delete}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
