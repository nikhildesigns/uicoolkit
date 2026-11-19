"use client";

import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import { motion as animated, useReducedMotion } from "motion/react";
import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonStatus = "idle" | "loading" | "success" | "error";
const defaultLabels = { idle: "Save changes", loading: "Saving…", success: "Saved", error: "Try again" };
const defaultIcons = {
  idle: null, loading: <LoaderCircle />, success: <Check />, error: <AlertCircle />,
};
const states = Object.keys(defaultLabels) as ButtonStatus[];

export type StatefulButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  action?: () => Promise<unknown>;
  status?: ButtonStatus;
  defaultStatus?: ButtonStatus;
  labels?: Partial<Record<ButtonStatus, ReactNode>>;
  icons?: Partial<Record<ButtonStatus, ReactNode>>;
  announcements?: Partial<Record<"success" | "error", string>>;
  widthMode?: "stable" | "animated";
  motion?: boolean;
  duration?: number;
  resetAfter?: number | false;
};

export const StatefulButton = forwardRef<HTMLButtonElement, StatefulButtonProps>(function StatefulButton({
  action, status: controlled, defaultStatus = "idle", labels, icons, announcements,
  widthMode = "stable", motion = true, duration = 200, resetAfter = 1800,
  disabled, className, onClick, type = "button", ...props
}, ref) {
  const [local, setLocal] = useState<ButtonStatus>(defaultStatus);
  const status = controlled ?? local;
  const pending = useRef(false);
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);
  const reduced = useReducedMotion();
  const animate = motion && !reduced && duration > 0;
  const visibleLabel = useRef<HTMLSpanElement>(null);
  const [labelWidth, setLabelWidth] = useState<number>();
  useEffect(() => {
    const node = visibleLabel.current;
    if (widthMode !== "animated" || !node || typeof ResizeObserver === "undefined") return;
    const measure = () => setLabelWidth(node.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [status, widthMode]);

  const busy = status === "loading";
  const label = labels?.[status] ?? defaultLabels[status];
  const message = (status === "success" || status === "error")
    ? announcements?.[status] ?? (typeof label === "string" ? label : defaultLabels[status])
    : "";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(reset.current);
    };
  }, []);

  function content(state: ButtonStatus) {
    const icon = icons && state in icons ? icons[state] : defaultIcons[state];
    return <>
      {icon && <span aria-hidden="true" className={cn("inline-flex [&>svg]:size-4", state === "loading" && animate && "motion-safe:animate-spin")}
        style={{ animationDuration: `${duration * 4}ms` }}>{icon}</span>}
      {labels?.[state] ?? defaultLabels[state]}
    </>;
  }

  return <>
    <button {...props} ref={ref} type={type} disabled={disabled} data-state={status}
      aria-busy={busy} aria-disabled={busy || disabled || props["aria-disabled"]}
      className={cn("inline-grid h-11 place-items-center overflow-hidden rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.3),inset_0_-2px_0_rgb(0_0_0/0.2),0_1px_2px_rgb(0_0_0/0.3)] hover:brightness-95 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 disabled:opacity-50", className)}
      onClick={async event => {
        if (busy || pending.current || props["aria-disabled"] === true || props["aria-disabled"] === "true") {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented || !action) return;
        pending.current = true;
        clearTimeout(reset.current);
        setLocal("loading");
        try {
          await action();
          if (mounted.current) {
            setLocal("success");
            if (resetAfter !== false) reset.current = setTimeout(() => setLocal("idle"), resetAfter);
          }
        } catch {
          if (mounted.current) setLocal("error");
        } finally {
          pending.current = false;
        }
      }}>
      <animated.span initial={false} animate={{ width: widthMode === "animated" && animate && labelWidth !== undefined ? labelWidth : "auto" }}
        transition={{ duration: animate ? duration / 1000 : 0 }} className="inline-grid place-items-center">
        {states.map(state => {
          const active = state === status;
          if (!active && widthMode === "animated") return null;
          return <animated.span key={state} ref={active ? visibleLabel : undefined} aria-hidden={!active || undefined}
            className="col-start-1 row-start-1 inline-flex w-max items-center justify-center gap-2 whitespace-nowrap"
            style={{ visibility: active ? "visible" : "hidden" }}
            initial={false} animate={{ opacity: active ? 1 : 0, y: active ? 0 : 3 }}
            transition={{ duration: animate ? duration / 1000 : 0 }}>
            {content(state)}
          </animated.span>;
        })}
      </animated.span>
    </button>
    <span role="status" aria-atomic="true" className="sr-only">{message}</span>
  </>;
});
