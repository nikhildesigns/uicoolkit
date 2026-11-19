"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { mountPulseGrid } from "./pulse-runtime";

const origins = {
  center: [0.5, 0.5], top: [0.5, 0], bottom: [0.5, 1],
  left: [0, 0.5], right: [1, 0.5], corner: [0, 0],
} as const;
export type PulseOriginName = keyof typeof origins;
export type PulseGridProps = {
  origin?: PulseOriginName | readonly [number, number];
  flow?: "outward" | "inward";
  color?: string;
  interactive?: boolean;
  still?: boolean;
  speed?: number;
  className?: string;
};

export function PulseGrid({ origin = "center", flow = "outward", interactive = true, still = false,
  speed = 1, color = "var(--primary, currentColor)", className }: PulseGridProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const grid = useRef<ReturnType<typeof mountPulseGrid>>(undefined);
  const [x, y] = typeof origin === "string" ? origins[origin] : origin;
  useEffect(() => {
    if (!canvas.current) return;
    grid.current = mountPulseGrid(canvas.current);
    return () => { grid.current?.dispose(); grid.current = undefined; };
  }, []);
  useEffect(() => {
    grid.current?.update({ origin: [x, y], inward: flow === "inward", interactive, still, speed });
  }, [x, y, flow, interactive, still, speed, color]);
  return <canvas aria-hidden="true" ref={canvas} className={cn("pointer-events-none block size-full", className)} style={{ color }} />;
}
