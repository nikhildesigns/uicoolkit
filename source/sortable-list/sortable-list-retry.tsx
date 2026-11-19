"use client";

import { moveKey, type Key } from "./sortable-list-state";

type FailedMove = { order: Key[]; from: number; to: number };

/** Reapply only the failed item's placement to current rows, retaining all other host changes. */
export function planRetry(failure: FailedMove, id: Key, current: Key[]) {
  const from = current.indexOf(id);
  if (from < 0) return null;
  const savedPosition = failure.order.indexOf(id);
  if (savedPosition < 0) return null;
  const present = new Set(current);
  const before = failure.order.slice(0, savedPosition).reverse().find(key => present.has(key));
  const after = failure.order.slice(savedPosition + 1).find(key => present.has(key));
  const down = failure.to > failure.from;
  const anchor = down ? before ?? after : after ?? before;
  if (anchor === undefined) return null;
  const insertAfter = down ? before !== undefined : after === undefined;
  // Compute the insertion slot after taking the moved row out of the current order.
  let to = current.indexOf(anchor) + (insertAfter ? 1 : 0);
  if (from < to) to--;
  if (from === to) return null;
  return { id, from, to, order: moveKey(current, from, to) };
}
