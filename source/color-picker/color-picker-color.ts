/** A colour as your app stores it: a six-digit hex such as "#ff5b1f", and opacity from 0 to 1. */
export type ColorValue = { hex: string; alpha: number };

/** Hue in degrees (0–360); saturation and value (brightness) from 0 to 1. The picker works in this space. */
export type Hsv = { h: number; s: number; v: number };
export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Reads "#rgb", "#rrggbb" or the same without "#". Returns null for anything else. */
export function parseHex(text: string): string | null {
  const raw = text.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) return `#${[...raw].map((digit) => digit + digit).join("")}`;
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

export function hexToRgb(hex: string): Rgb {
  const value = parseHex(hex) ?? "#000000";
  return { r: parseInt(value.slice(1, 3), 16), g: parseInt(value.slice(3, 5), 16), b: parseInt(value.slice(5, 7), 16) };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const [red, green, blue] = [r / 255, g / 255, b / 255];
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);
  let h = 0;
  if (delta) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max ? delta / max : 0, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - chroma;
  const [red, green, blue] =
    h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return { r: (red + m) * 255, g: (green + m) * 255, b: (blue + m) * 255 };
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [red, green, blue] = [r / 255, g / 255, b / 255];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const delta = max - min;
  const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  return { h: rgbToHsv({ r, g, b }).h, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const v = l + chroma / 2;
  return hsvToRgb({ h, s: v ? chroma / v : 0, v });
}

export const hsvToHex = (hsv: Hsv) => rgbToHex(hsvToRgb(hsv));
export const hexToHsv = (hex: string) => rgbToHsv(hexToRgb(hex));

/** Whether two colours are the same to the nearest whole channel and percent of opacity. */
export const sameColor = (a: ColorValue | null, b: ColorValue | null) =>
  a === b || (!!a && !!b && parseHex(a.hex) === parseHex(b.hex) && Math.round(a.alpha * 100) === Math.round(b.alpha * 100));

/** Black or white, whichever reads better on the colour, for marks drawn over it. */
export function contrastOn(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
}

export { clamp };
