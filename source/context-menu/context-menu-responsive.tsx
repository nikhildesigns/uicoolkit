"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

const query = "(max-width: 639px)";
const phoneSnapshot = () => typeof window.matchMedia === "function" && window.matchMedia(query).matches;
const serverSnapshot = () => false;
const subscribe = (notify: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

/** Keeps SSR deterministic, then adapts the open menu to the current viewport. */
export function usePhoneMenu() {
  return useSyncExternalStore(subscribe, phoneSnapshot, serverSnapshot);
}

export type Highlight = { top: number; left: number; width: number; height: number; variant?: string; visible: boolean; slide: boolean };

/**
 * One highlight for the whole menu. It follows Base UI's data-highlighted item, sliding across
 * separators and groups instead of each item lighting up on its own.
 */
export function useSharedHighlight(popup: HTMLElement | null) {
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  useEffect(() => {
    if (!popup) return;
    const update = () => {
      const item = popup.querySelector<HTMLElement>('[role="menuitem"][data-highlighted]');
      setHighlight((previous) =>
        item
          ? {
              top: item.offsetTop,
              left: item.offsetLeft,
              width: item.offsetWidth,
              height: item.offsetHeight,
              variant: item.dataset.variant,
              visible: true,
              // Slide only from one item to another; the first highlight appears in place.
              slide: !!previous?.visible,
            }
          : previous && { ...previous, visible: false },
      );
    };
    const observer = new MutationObserver(update);
    observer.observe(popup, { subtree: true, attributes: true, attributeFilter: ["data-highlighted"] });
    update();
    return () => observer.disconnect();
  }, [popup]);
  return highlight;
}
