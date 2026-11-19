const pad = (value: number) => String(value).padStart(2, "0");

/** Keeps a time inside 0 to the duration, without floating-point dust. */
export function clampTime(time: number, duration: number) {
  return Math.round(Math.min(Math.max(time, 0), duration) * 1000) / 1000;
}

/** Formats seconds as 0:01.20, adding hours when needed. */
export function formatPlaybackTime(seconds: number) {
  const hundredths = Math.floor(Math.max(seconds, 0) * 100 + 1e-6);
  const whole = Math.floor(hundredths / 100);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor(whole / 60) % 60;
  return `${hours > 0 ? `${hours}:${pad(minutes)}` : minutes}:${pad(whole % 60)}.${pad(hundredths % 100)}`;
}
