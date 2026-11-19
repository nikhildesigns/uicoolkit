"use client";

import { useEffect, useRef } from "react";

/** Keep a clock for each queued item, including ones outside the compact view. */
export function NotificationTimer({ id, duration, paused, onDismiss }: {
  id: string; duration: number; paused: boolean; onDismiss: (id: string) => void;
}) {
  const remaining = useRef(duration);
  const dismiss = useRef(onDismiss);
  useEffect(() => { dismiss.current = onDismiss; }, [onDismiss]);
  useEffect(() => { remaining.current = duration; }, [duration]);
  useEffect(() => {
    if (paused || !Number.isFinite(duration) || duration <= 0) return;
    const start = Date.now();
    const timer = setTimeout(() => dismiss.current(id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - start));
    };
  }, [id, duration, paused]);
  return null;
}
