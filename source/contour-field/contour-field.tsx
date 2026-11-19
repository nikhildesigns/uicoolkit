"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { mountContourField } from "./contour-runtime";

export type ContourFieldProps = {
  color?: string;
  density?: number;
  still?: boolean;
  speed?: number;
  interactive?: boolean;
  className?: string;
};

export function ContourField({ color = "var(--primary, #ff5a1f)", density = 1, still = false,
  speed = 1, interactive = true, className }: ContourFieldProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<ReturnType<typeof mountContourField>>(undefined);
  useEffect(() => {
    if (!canvas.current) return;
    field.current = mountContourField(canvas.current);
    return () => { field.current?.dispose(); field.current = undefined; };
  }, []);
  useEffect(() => {
    field.current?.update({ density: Number.isFinite(density) && density > 0 ? density : 1, still, speed, interactive });
  }, [density, still, speed, interactive, color]);
  return <canvas ref={canvas} aria-hidden="true" style={{ color }}
    className={cn("pointer-events-none block size-full", className)} />;
}
