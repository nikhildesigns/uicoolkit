"use client";

import { Bell, CircleAlert, X } from "lucide-react";
import { motion as m, useIsPresent, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StackNotification = {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: "default" | "error";
  duration?: number;
};

export function NotificationCard({ item, offset, layer, depth, position, motion, className, dismiss }: {
  item: StackNotification; offset: number; layer: number; depth: number; position: "top" | "bottom";
  motion: boolean; className?: string; dismiss: () => void;
}) {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  const animate = motion && !reduced;
  const y = -offset;
  const scale = 1 - Math.min(depth, 4) * 0.05;
  return <m.li data-notification-id={item.id} aria-hidden={!present || undefined}
    className={cn("absolute inset-x-1 bottom-1 min-w-0 rounded-xl border border-border bg-[color-mix(in_srgb,var(--popover)_55%,var(--background))] px-3 py-3 text-popover-foreground shadow-sm", className)}
    style={{ zIndex: present ? layer : 0, pointerEvents: present ? undefined : "none",
      transformOrigin: position === "bottom" ? "center top" : "center bottom" }}
    initial={animate ? { y: y + (position === "top" ? -18 : 18), scale, opacity: 0 } : false}
    animate={{ y, scale, opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: animate ? 0.28 : 0, ease: [0.22, 0.68, 0.16, 1] }}>
    <div className="flex items-start gap-2.5">
      <span aria-hidden="true" className={cn("mt-1.5 shrink-0 text-primary [&>svg]:size-4", item.tone === "error" && "text-destructive")}>
        {item.icon ?? (item.tone === "error" ? <CircleAlert /> : <Bell />)}
      </span>
      <div className="min-w-0 flex-1 self-center">
        <p className="text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{item.title}</p>
        {item.description && <p className="pt-1 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{item.description}</p>}
      </div>
      <button type="button" aria-label={`Dismiss ${item.title}`} title="Dismiss notification"
        disabled={!present} onClick={dismiss} className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline focus-visible:outline-1">
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  </m.li>;
}
