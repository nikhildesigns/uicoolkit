"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { mountEmberGlow } from "./ember-runtime";

export type EmberGlowProps = {
  color?: string;
  intensity?: number;
  still?: boolean;
  speed?: number;
  interactive?: boolean;
  className?: string;
};

export function EmberGlow({ color = "var(--primary, #ff5a1f)", intensity = 1, still = false,
  speed = 1, interactive = true, className }: EmberGlowProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<ReturnType<typeof mountEmberGlow>>(undefined);
  useEffect(() => {
    if (!canvas.current) return;
    glow.current = mountEmberGlow(canvas.current);
    return () => { glow.current?.dispose(); glow.current = undefined; };
  }, []);
  useEffect(() => {
    glow.current?.update({ intensity: Math.max(0, intensity), still, speed, interactive });
  }, [intensity, still, speed, interactive, color]);
  return <canvas ref={canvas} aria-hidden="true" style={{ color }}
    className={cn("pointer-events-none block size-full", className)} />;
}
