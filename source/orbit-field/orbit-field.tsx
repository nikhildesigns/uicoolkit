"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useOrbitMotion } from "./use-orbit-motion";

export type OrbitNode = { ring: number; index: number; count: number };
export type OrbitRing = { radius: number; dots: number; offset?: number };
export type OrbitFieldProps = {
  rings?: number | readonly OrbitRing[];
  center?: ReactNode;
  renderNode?: (node: OrbitNode) => ReactNode;
  synchronized?: boolean;
  color?: string;
  speed?: number;
  still?: boolean;
  interactive?: boolean;
  label?: string;
  className?: string;
};

// Apply the outline to the slotted element so the browser uses its own corner radius.
const iconHalo = {
  "--orbit-icon-halo": "0 0 0 2px light-dark(#fff, rgb(255 255 255 / 0.40)), 0 0 0 3px light-dark(rgb(37 37 37 / 0.52), transparent), 0 0 7px light-dark(rgb(0 0 0 / 0.16), rgb(255 255 255 / 0.22))",
  "--orbit-svg-halo": "drop-shadow(0 0 1px white) drop-shadow(0 0 2px light-dark(rgb(37 37 37 / 0.65), rgb(255 255 255 / 0.45)))",
} as CSSProperties;

const periods = [14, 22, 32, 46, 60, 78];

export function OrbitField({ rings = 3, center, renderNode, color = "var(--primary, currentColor)",
  synchronized = false, speed = 1, still = false, interactive = true, label, className }: OrbitFieldProps) {
  const customRings = typeof rings === "number" ? undefined : rings;
  const requested = typeof rings === "number" ? rings : rings.length;
  const ringCount = Number.isFinite(requested) ? Math.max(1, Math.min(6, Math.round(requested))) : 3;
  const ref = useOrbitMotion(still, Number.isFinite(speed) ? Math.max(0, speed) : 1, interactive);
  return (
    <div ref={ref} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={cn("group/orbit relative aspect-square w-64 max-w-full", className)}>
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: ringCount }, (_, ring) => {
          const custom = customRings?.[ring];
          const autoRadius = ringCount === 1 ? 86 : 56 + 64 * ring / (ringCount - 1);
          const radius = custom && Number.isFinite(custom.radius) ? Math.max(0, custom.radius) : autoRadius;
          // Multiples of three give synchronized rings exact third-turn anchor points.
          const autoCount = (synchronized ? 3 : 5) + ring * 3;
          const count = custom && Number.isFinite(custom.dots) ? Math.max(0, Math.floor(custom.dots)) : autoCount;
          const rate = synchronized ? 360 / periods[2] : (ring % 2 ? -360 : 360) / periods[ring];
          const icons: ReactNode[] = [];
          const dots = Array.from({ length: count }, (_, index) => {
            const angle = (index * 360 / count - 90 + (custom?.offset ?? 0)) * Math.PI / 180;
            const x = Number((radius * Math.cos(angle)).toFixed(4));
            const y = Number((radius * Math.sin(angle)).toFixed(4));
            const icon = renderNode?.({ ring, index, count });
            if (icon != null && icon !== false) {
              icons.push(
                <span key={index} className="absolute grid aspect-square w-[9.5%] -translate-1/2 place-items-center"
                  style={{ left: (50 + x / 2.6) + "%", top: (50 + y / 2.6) + "%",
                    transform: `rotate(calc(var(--orbit-seconds, 0) * ${-rate}deg))` }}>
                  <span data-orbit-icon="" style={iconHalo} className={cn("grid size-full place-items-center",
                    interactive && !still && "motion-safe:group-hover/orbit:[&>:not(svg)]:shadow-(--orbit-icon-halo) motion-safe:group-hover/orbit:[&>svg]:[filter:var(--orbit-svg-halo)]")}>
                    {icon}
                  </span>
                </span>
              );
              return null;
            }
            const accented = index % 4 === ring % 4;
            return <circle key={index} data-orbit-accent={accented ? "" : undefined} cx={x} cy={y} r={accented ? 3 : 1.6}
              fill={accented ? color : "var(--muted-foreground, currentColor)"} />;
          });
          return (
            <div key={ring} className="absolute inset-0"
              style={{ transform: `rotate(calc(var(--orbit-seconds, 0) * ${rate}deg))` }}>
              <svg viewBox="-130 -130 260 260" className="size-full overflow-visible" aria-hidden="true">
                <circle r={radius} fill="none" stroke="var(--border, currentColor)" strokeWidth="0.6" />
                {dots}
              </svg>
              {icons}
            </div>
          );
        })}
        <span className="absolute left-1/2 top-1/2 grid aspect-square w-[14.5%] -translate-1/2 place-items-center">
          {center ?? <span className="aspect-square w-1/2 rounded-full" style={{ backgroundColor: color }} />}
        </span>
      </div>
    </div>
  );
}
