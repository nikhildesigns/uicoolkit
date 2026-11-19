/** How the flame bed follows the letters, in ems and as a slope (rise per unit across). */
export const bedShape = {
  /** How steeply the roof may fall away from a letter top; lower bridges more of a curve. */
  slope: 0.8,
  /** How far a letter top reaches sideways to bridge a dip. */
  reach: 0.5,
  /** Past the ends of the word, the fire fades out over this distance. */
  fade: 0.2,
};

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Measures where flames start in each pixel column of a glyph mask. The topmost ink in a
 * column is its letter top; a roof over those tops, which may fall away from each top at
 * `slope`, bridges the curved shoulders of round letters and the gaps between letters, so
 * fire rises along the whole word instead of only from flat tops.
 *
 * Returns RGBA floats per column, with heights as texture y (0 at the bottom, 1 at the top):
 * the roof, the letter top, the flame strength (fading past the word's ends) and the lowest ink.
 */
export function flameBed(alpha: Uint8ClampedArray, width: number, height: number, em: number) {
  const top = new Float64Array(width).fill(-1);
  const bottom = new Float64Array(width).fill(-1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (alpha[(y * width + x) * 4 + 3] > 127) {
        if (top[x] < 0) top[x] = y;
        bottom[x] = y;
      }
    }
  }

  const reach = Math.max(1, Math.round(bedShape.reach * em));
  const roof = new Float64Array(width).fill(-1);
  for (let x = 0; x < width; x++) {
    let best = Infinity;
    for (let d = -reach; d <= reach; d++) {
      const at = x + d;
      if (at < 0 || at >= width || top[at] < 0) continue;
      best = Math.min(best, top[at] + bedShape.slope * Math.abs(d));
    }
    if (best !== Infinity) roof[x] = best;
  }

  // Distance to the nearest inked column, so the fire fades out past the word's ends.
  const distance = new Float64Array(width).fill(Infinity);
  for (let x = 0, last = -Infinity; x < width; x++) {
    if (top[x] >= 0) last = x;
    distance[x] = x - last;
  }
  for (let x = width - 1, next = Infinity; x >= 0; x--) {
    if (top[x] >= 0) next = x;
    distance[x] = Math.min(distance[x], next - x);
  }

  const bed = new Float32Array(width * 4);
  const toTexture = (y: number) => 1 - (y + 0.5) / height;
  for (let x = 0; x < width; x++) {
    const inked = roof[x] >= 0;
    bed[x * 4] = inked ? toTexture(roof[x]) : 0;
    bed[x * 4 + 1] = top[x] >= 0 ? toTexture(top[x]) : 0;
    bed[x * 4 + 2] = inked ? 1 - smoothstep(0, bedShape.fade * em, distance[x]) : 0;
    bed[x * 4 + 3] = bottom[x] >= 0 ? toTexture(bottom[x]) : 0;
  }
  return bed;
}
