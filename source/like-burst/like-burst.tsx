"use client";

import { Heart } from "lucide-react";
import {
  forwardRef, useEffect, useId, useRef, useState, useSyncExternalStore,
  type ButtonHTMLAttributes, type ComponentType, type SVGProps,
} from "react";
import { cn } from "@/lib/utils";

const preference = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => window.matchMedia?.(preference).matches ?? false;
const serverReducedMotion = () => true;
function subscribeToMotionPreference(notify: () => void) {
  const query = window.matchMedia?.(preference);
  query?.addEventListener("change", notify);
  return () => query?.removeEventListener("change", notify);
}

const digits = Array.from("0123456789");
const formatter = new Intl.NumberFormat("en-US");

function RollingCount({ text, animate, duration }: { text: string; animate: boolean; duration: number }) {
  if (!animate) return <span aria-hidden="true" className="tabular-nums">{text}</span>;
  return <span aria-hidden="true" className="inline-flex items-baseline tabular-nums">
    {Array.from(text, (char, index) => {
      const place = text.length - index;
      if (!digits.includes(char)) return <span key={place}>{char}</span>;
      return <span key={place} className="relative inline-block h-[1em] overflow-hidden leading-none">
        <span className="invisible">0</span>
        <span className="absolute inset-x-0 top-0 flex flex-col transition-transform ease-out motion-reduce:transition-none"
          style={{ transform: `translateY(-${char}em)`, transitionDuration: `${duration}ms` }}>
          {digits.map(digit => <span key={digit} className="h-[1em]">{digit}</span>)}
        </span>
      </span>;
    })}
  </span>;
}

export type LikeBurstProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-pressed"> & {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  count?: number;
  label?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  particles?: number | false;
  motion?: boolean;
  duration?: number;
};

export const LikeBurst = forwardRef<HTMLButtonElement, LikeBurstProps>(function LikeBurst({
  pressed: controlled, defaultPressed = false, onPressedChange, count, label = "Like", icon: Icon = Heart,
  particles = 8, motion = true, duration = 500, className, type = "button", onClick,
  "aria-describedby": describedBy, ...props
}, ref) {
  const [local, setLocal] = useState(defaultPressed);
  const pressed = controlled ?? local;
  const reduced = useSyncExternalStore(subscribeToMotionPreference, prefersReducedMotion, serverReducedMotion);
  const animate = motion && !reduced && duration > 0;
  const previous = useRef(pressed);
  const icon = useRef<HTMLSpanElement>(null);
  const dots = useRef<HTMLSpanElement>(null);
  const countId = useId();
  const countText = count === undefined ? undefined : formatter.format(count);
  const dotCount = particles && Number.isFinite(particles) ? Math.min(64, Math.max(0, Math.floor(particles))) : 0;

  useEffect(() => {
    const justPressed = pressed && !previous.current;
    previous.current = pressed;
    if (!justPressed || !animate || !icon.current?.animate) return;
    const pop = icon.current.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.35)", offset: 0.4 }, { transform: "scale(1)" }],
      { duration: duration * 0.75, easing: "ease-out" },
    );
    const animations = Array.from(dots.current?.children ?? [], (dot, i) => {
      const angle = i * 2 * Math.PI / dotCount;
      return dot.animate([
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${Math.cos(angle) * 20}px, ${Math.sin(angle) * 20}px) scale(0)`, opacity: 0 },
      ], { duration, easing: "cubic-bezier(.22,1,.36,1)" });
    });
    return () => { pop.cancel(); animations.forEach(animation => animation.cancel()); };
  }, [pressed, animate, dotCount, duration]);

  return <button type={type} ref={ref} aria-label={label} {...props} aria-pressed={pressed}
    aria-describedby={[describedBy, countText !== undefined && countId].filter(Boolean).join(" ") || undefined}
    className={cn("relative inline-flex h-11 min-w-11 items-center justify-center gap-2.5 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 disabled:opacity-50", countText === undefined && "w-11 px-0", className)}
    onClick={event => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (controlled === undefined) setLocal(!pressed);
      onPressedChange?.(!pressed);
    }}>
    <span aria-hidden="true" className={cn("relative grid size-5 place-items-center text-muted-foreground", pressed && "text-[var(--like-burst-accent,var(--primary))]")}>
      {animate && pressed && dotCount > 0 && <span ref={dots} className="pointer-events-none absolute inset-0">
        {Array.from({ length: dotCount }, (_, i) =>
          <span key={i} className="absolute left-1/2 top-1/2 -ml-0.5 -mt-0.5 size-1 rounded-full bg-current opacity-0" />)}
      </span>}
      <span ref={icon}><Icon className="size-5" fill={pressed ? "currentColor" : "none"} /></span>
    </span>
    {countText !== undefined && <>
      <RollingCount text={countText} animate={animate} duration={duration} />
      <span id={countId} className="sr-only">{countText}</span>
    </>}
  </button>;
});
