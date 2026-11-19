"use client";

import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";

export type NumberTickerProps = {
  value: number;
  locale?: string;
  format?: Intl.NumberFormatOptions;
  motion?: boolean;
  duration?: number;
  className?: string;
};

export function NumberTicker({ value, locale = "en-US", format, motion = true, duration = 600,
  className }: NumberTickerProps) {
  const formatter = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
  const digits = useMemo(() => {
    const decimal = new Intl.NumberFormat(locale, { numberingSystem: formatter.resolvedOptions().numberingSystem });
    return Array.from({ length: 10 }, (_, i) => decimal.format(i));
  }, [locale, formatter]);
  const parts = formatter.formatToParts(value);
  const text = parts.map(part => part.value).join("");
  // Integer columns keep their place from the units digit, even when a new group appears.
  let integerPlaces = parts.reduce((count, part) => count + (part.type === "integer" ? Array.from(part.value).length : 0), 0);
  return (
    <span className={cn("inline-block whitespace-nowrap tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      <bdi aria-hidden="true">
        {parts.flatMap((part, index) => {
          if (part.type !== "integer" && part.type !== "fraction") {
            return <Fragment key={`${part.type}-${index}`}>{part.value}</Fragment>;
          }
          return Array.from(part.value, (char, position) => {
            const key = part.type === "integer" ? `place-${--integerPlaces}` : `fraction-${position}`;
            const digit = digits.indexOf(char);
            if (digit < 0) return <Fragment key={key}>{char}</Fragment>;
            return (
              <span key={key} className="relative inline-grid align-baseline leading-none">
                <span className="invisible">{digits[0]}</span>
                <span className="absolute inset-0 overflow-hidden">
                  <span className={cn("flex flex-col",
                    motion && "transition-transform ease-out motion-reduce:transition-none")}
                    style={{ transform: `translateY(-${digit}em)`, transitionDuration: motion ? `${Math.max(0, duration)}ms` : "0ms" }}>
                    {digits.map(glyph => <span key={glyph} className="block h-[1em] leading-none">{glyph}</span>)}
                  </span>
                </span>
              </span>
            );
          });
        })}
      </bdi>
    </span>
  );
}
