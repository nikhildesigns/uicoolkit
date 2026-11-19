"use client";

import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useId, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NotificationCard, type StackNotification } from "./notification-card";
import { NotificationTimer } from "./notification-timer";
import { notificationLayout, useCardHeights } from "./notification-layout";

export type { StackNotification } from "./notification-card";

export type NotificationStackProps = {
  items: readonly StackNotification[];
  onDismiss: (id: string) => void;
  duration?: number;
  visible?: number;
  position?: "top" | "bottom";
  defaultExpanded?: boolean;
  motion?: boolean;
  className?: string;
  cardClassName?: string;
  emptyIcon?: ReactNode;
};

export function NotificationStack({ items, onDismiss, duration = 5000, visible = 3, position = "bottom",
  defaultExpanded = false, motion = true, className, cardClassName, emptyIcon }: NotificationStackProps) {
  const [showAll, setShowAll] = useState(defaultExpanded);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [readingCards, setReadingCards] = useState(false);
  const region = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const listId = useId();
  const expanded = showAll || hover || readingCards;
  const limit = Math.max(1, Math.trunc(visible) || 1);
  const shown = showAll ? [...items] : items.slice(-limit);
  if (position === "top") shown.reverse();
  const heights = useCardHeights(list, items, shown.length);
  const layout = notificationLayout(shown, heights, expanded, position);

  function dismissCard(id: string, index: number) {
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>("li:not([aria-hidden=true]) button");
    if (buttons?.[index]?.contains(document.activeElement)) {
      (buttons[index + 1] ?? buttons[index - 1] ?? region.current)?.focus();
    }
    onDismiss(id);
  }

  function left(event: FocusEvent<HTMLElement>) {
    return !event.currentTarget.contains(event.relatedTarget);
  }

  return <section ref={region} aria-label="Notifications" tabIndex={-1}
    className={cn("flex h-80 w-full min-w-0 flex-col justify-end text-foreground [overflow-anchor:none]", className)}
    onFocusCapture={() => setFocus(true)} onBlurCapture={event => { if (left(event)) setFocus(false); }}>
    {items.map(item => <NotificationTimer key={item.id} id={item.id} duration={item.duration ?? duration}
      paused={focus || hover} onDismiss={onDismiss} />)}
    {(["polite", "assertive"] as const).map(priority => <div key={priority} aria-live={priority}
      aria-relevant="additions" aria-atomic="false" className="sr-only">
      {items.filter(item => (item.tone === "error") === (priority === "assertive")).map(item =>
        <p key={item.id}>{item.title}{item.description && `. ${item.description}`}</p>)}
    </div>)}
    {items.length === 0 && <div className="grid justify-items-center gap-2 py-6 text-sm text-muted-foreground">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-muted">{emptyIcon ?? <Bell className="size-4" />}</span>
      All caught up.
    </div>}
    <div className={cn("relative min-h-0", items.length > 0 && "flex-1")}>
      <div className={cn("pointer-events-none absolute inset-x-0 -bottom-6 z-10 flex h-[var(--notification-window-height,calc(75dvh+1.5rem))] [overflow-x:var(--notification-overflow,hidden)] [overflow-y:var(--notification-overflow,auto)] overscroll-contain pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        position === "bottom" ? "flex-col-reverse" : "flex-col")}>
        <ol ref={list} id={listId} aria-label="Notification list" onFocusCapture={() => setReadingCards(true)}
          onPointerEnter={event => { if (event.pointerType !== "touch") setHover(true); }}
          onPointerLeave={() => setHover(false)}
          onBlurCapture={event => { if (left(event)) setReadingCards(false); }}
          className={cn("pointer-events-auto relative isolate shrink-0", position === "top" && "mt-auto")} style={{ height: layout.height + 8 }}>
          <AnimatePresence initial={false}>
            {shown.map((item, index) => <NotificationCard key={item.id} item={item} offset={layout.offsets.get(item.id)!}
              layer={position === "top" ? shown.length - index : index + 1} position={position}
              depth={expanded ? 0 : position === "top" ? index : shown.length - 1 - index}
              motion={motion} className={cardClassName} dismiss={() => dismissCard(item.id, index)} />)}
          </AnimatePresence>
        </ol>
      </div>
    </div>
    {items.length > 1 && <button type="button" aria-controls={listId} aria-expanded={showAll}
      onClick={() => setShowAll(value => !value)}
      className="mx-auto mt-2 flex h-8 min-w-28 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted focus-visible:bg-muted">
      {showAll ? <>Show less <ChevronUp aria-hidden="true" className="size-3.5" /></> :
        <>Show all {items.length} <ChevronDown aria-hidden="true" className="size-3.5" /></>}
    </button>}
  </section>;
}
