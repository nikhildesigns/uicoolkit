"use client";

import { useSharedHighlight, usePhoneMenu } from "./context-menu-responsive";
import { cn } from "@/lib/utils";
import { type TransitionEvent, type ComponentPropsWithoutRef, useState, forwardRef } from "react";
import { ContextMenu as Base } from "@base-ui/react/context-menu";
import { useContextMenuContext } from "./context-menu-state";

/**
 * Open motion: the popup grows from the corner it opened at, widening and lengthening
 * together while fading in. The corner follows the side and alignment Base UI picks
 * after flipping to stay on screen. The clip stops exactly at the popup's edge so the
 * growth is visible to the end, then is removed (data-revealed) so the outline and
 * shadow outside that edge show. Closing fades out.
 */
export const reveal = cn(
  "[clip-path:inset(0)] transition-[clip-path,opacity] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none",
  "data-[revealed]:[clip-path:none] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
  "data-[starting-style]:[clip-path:inset(0_100%_100%_0)]",
  "data-[side=top]:data-[starting-style]:[clip-path:inset(100%_100%_0_0)]",
  "data-[align=end]:data-[starting-style]:[clip-path:inset(0_0_100%_100%)]",
  "data-[side=top]:data-[align=end]:data-[starting-style]:[clip-path:inset(100%_0_0_100%)]",
);

/** Marks the popup revealed once its clip transition ends, which lifts the clip. */
export const markRevealed = (event: TransitionEvent<HTMLDivElement>) => {
  if (event.target === event.currentTarget && event.propertyName === "clip-path" && !event.currentTarget.hasAttribute("data-ending-style")) {
    event.currentTarget.setAttribute("data-revealed", "");
  }
};

export type ContextMenuContentProps = ComponentPropsWithoutRef<typeof Base.Popup> & {
  /** Where the popup is portalled. Defaults to document.body. */
  container?: HTMLElement | null;
  positionMethod?: "absolute" | "fixed";
  collisionPadding?: number;
  /** Styles the shared highlight that slides between items. It carries the item's data-variant. */
  highlightClassName?: string;
  /** Visible dismissal action on phones; replace for localization. */
  cancelLabel?: string;
};

export const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(function ContextMenuContent(
  { className, container, positionMethod, collisionPadding = 8, highlightClassName, cancelLabel = "Cancel", onTransitionEnd, children, ...props },
  ref,
) {
  const { animated, focusFirstRef } = useContextMenuContext("ContextMenuContent");
  const [popup, setPopup] = useState<HTMLDivElement | null>(null);
  const highlight = useSharedHighlight(popup);
  const phone = usePhoneMenu();

  return (
    <Base.Portal container={container ?? undefined}>
      {phone && <Base.Backdrop className="fixed inset-0 z-50 bg-black/40" />}
      <Base.Positioner positionMethod={positionMethod} collisionPadding={collisionPadding} className="z-50 outline-none"
        style={phone ? { position: "fixed", top: "auto", bottom: 0, left: 0, right: 0, width: "100%", transform: "none" } : undefined}>
        <Base.Popup
          onTransitionEnd={(event) => {
            onTransitionEnd?.(event);
            if (animated) markRevealed(event);
          }}
          ref={(node) => {
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
            setPopup(node);
            // A keyboard-opened menu starts on its first available action.
            if (node && (phone || focusFirstRef.current)) {
              focusFirstRef.current = false;
              requestAnimationFrame(() => phone ? node.focus() : node.querySelector<HTMLElement>('[role="menuitem"]:not([data-disabled])')?.focus());
            }
          }}
          className={cn(
            "relative min-w-48 origin-[var(--transform-origin)] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none",
            phone && "max-h-[80dvh] w-full overflow-y-auto rounded-t-2xl rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
            animated && (phone ? "transition-[transform,opacity] duration-200 ease-out data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none" : reveal),
            className,
          )}
          {...(props as ComponentPropsWithoutRef<typeof Base.Popup>)}
        >
          <span
            aria-hidden
            data-slot="highlight"
            data-variant={highlight?.variant}
            data-visible={highlight?.visible ? "" : undefined}
            className={cn(
              "pointer-events-none absolute rounded-sm bg-accent opacity-0 data-[visible]:opacity-100 data-[variant=destructive]:bg-destructive/10",
              animated && highlight?.slide && "transition-[top,height,width,opacity,background-color] duration-150 ease-out motion-reduce:transition-none",
              animated && !highlight?.slide && "transition-opacity duration-100 motion-reduce:transition-none",
              highlightClassName,
            )}
            style={highlight ? { top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height } : undefined}
          />
          {children}
          {phone && <Base.Item className="relative mt-3 flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium outline-none data-[highlighted]:bg-accent">{cancelLabel}</Base.Item>}
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
});
