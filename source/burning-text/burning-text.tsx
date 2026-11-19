"use client";

import { cn } from "@/lib/utils";
import { useRef, type CSSProperties } from "react";
import styles from "./burning-text.module.css";
import { FlameCanvas } from "./flame-canvas";
import type { FlamePreset } from "./flame-shader";

export type { FlamePreset } from "./flame-shader";

/** Fixed spark layout so server and client render the same markup. */
const sparks = [
  { x: 10, size: 3, dur: 2.4, delay: 0, drift: -8 },
  { x: 22, size: 4, dur: 2.9, delay: 1.1, drift: 10 },
  { x: 35, size: 3, dur: 2.2, delay: 1.8, drift: -12 },
  { x: 48, size: 5, dur: 3.1, delay: 0.5, drift: 6 },
  { x: 60, size: 3, dur: 2.6, delay: 1.4, drift: -6 },
  { x: 72, size: 4, dur: 2.3, delay: 2.2, drift: 12 },
  { x: 85, size: 3, dur: 2.8, delay: 0.8, drift: -10 },
];

export type BurningTextProps = {
  children: string;
  /** Flame color; the whole palette derives from it. */
  color?: string;
  flame?: FlamePreset;
  sparks?: boolean;
  /** Freeze on a single frame (reduced motion always does). */
  still?: boolean;
  /** Flame animation speed multiplier; embers and glow follow it. */
  speed?: number;
  className?: string;
};

/**
 * Text that burns: WebGL flames rise from the real glyphs, the letters glow with a
 * slow rising heat gradient, and embers drift upward. The word stays real text.
 */
export function BurningText({ children, color = "#ff5b1f", flame = "campfire", sparks: showSparks = true, still = false, speed = 1, className }: BurningTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  return (
    <span
      className={cn(styles.root, className)}
      data-flame={flame}
      data-still={still || undefined}
      style={{ "--flame": color, "--burn-speed": speed, color } as CSSProperties}
    >
      <span ref={textRef} className={styles.word}>{children}</span>
      {children.trim() && <>
        <span aria-hidden className={styles.glow} />
        <FlameCanvas textRef={textRef} text={children} color={color} preset={flame} still={still} speed={speed} />
      </>}
      {showSparks && children.trim() && (
        <span aria-hidden className={styles.embers}>
          {sparks.map((spark) => (
            <span
              key={spark.x}
              className={styles.spark}
              style={
                {
                  left: `${spark.x}%`,
                  "--size": `${spark.size}px`,
                  "--dur": `${spark.dur}s`,
                  "--delay": `${spark.delay}s`,
                  "--drift": `${spark.drift}px`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}
    </span>
  );
}
