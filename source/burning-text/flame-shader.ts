export const flameUniforms = ["u_mask", "u_bed", "u_res", "u_time", "u_color", "u_dark", "u_reach", "u_sway", "u_rate", "u_profile", "u_em"];

/** Presets for how tall, wild and fast the flames are. */
export const flamePresets = {
  candle: { reach: 0.085, sway: 0.012, rate: 0.52, profile: -1 },
  campfire: { reach: 0.21, sway: 0.05, rate: 1.05, profile: 0 },
  blaze: { reach: 0.40, sway: 0.085, rate: 1.38, profile: 1 },
} as const;

export type FlamePreset = keyof typeof flamePresets;

/**
 * Flames rising from a glyph mask. `u_bed` holds, per column, a roof over the letter tops
 * (see flame-bed.ts), the letter top and the flame strength. Flames rise from the roof with
 * noise-driven sway that grows with height; below the roof, down to the letters, the bed
 * burns too, so fire fills curved shoulders and the dips between letters.
 */
export const flameShader = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_mask;
uniform sampler2D u_bed;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_color;
uniform float u_dark;
uniform float u_reach;
uniform float u_sway;
uniform float u_rate;
uniform float u_profile;
uniform float u_em;
out vec4 outColor;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time * u_rate;

  // Flow field scrolling upward: sways and stretches the flames.
  vec2 flow = vec2(uv.x * aspect * 2.4, uv.y * 2.0 - t * 1.25);
  float n1 = fbm(flow);
  float n2 = fbm(flow * 2.3 + vec2(3.7, -t * 1.1));
  float reach = u_reach * (0.55 + 0.9 * n1);

  // Sway grows with height above the roof, so the base stays on the letters.
  float rise = clamp((uv.y - texture(u_bed, vec2(uv.x, 0.5)).r) / reach, 0.0, 1.0);
  float shift = ((n1 - 0.5) + (n2 - 0.5) * 0.7) * u_sway * rise * 1.6;
  vec3 bed = texture(u_bed, vec2(uv.x - shift, 0.5)).rgb;
  // Candle has only a few low flickers on the actual letter tops.
  if (u_profile < 0.0) {
    bed.b *= 1.0 - smoothstep(0.06, 0.16, (bed.r - bed.g) / u_em);
    bed.r = max(bed.g, bed.r - 0.16 * u_em);
    bed.b *= mix(0.42, 1.0, smoothstep(0.26, 0.70, n2));
  }
  float above = uv.y - bed.r;
  // Tongues rise tallest straight off the letters and stay lower over the gaps between them.
  reach *= mix(0.78, 1.15, bed.b);

  // Run one heat field through the upper strokes and into the air above them.
  // Only the lower part of the word returns to solid ink.
  float ink = texture(u_mask, uv).a;
  float root = max(bed.g, bed.r - 0.14 * u_em);
  float belowTop = max(root - uv.y, 0.0) / u_em;
  float licks = smoothstep(0.26, 0.74, fbm(vec2(uv.x * aspect * 7.0, uv.y * 3.0 - t * 2.2)));
  float inside = 1.0 - smoothstep(0.01, 0.13 + 0.13 * licks, belowTop);
  float crown = 1.0 - smoothstep(0.06, 0.23, max(-above, 0.0) / u_em);
  float heat = pow(max(1.0 - max(above, 0.0) / reach, 0.0), 0.9);
  heat *= bed.b * crown * inside;
  float fire = heat * mix(0.48, 1.16, licks);

  if (u_profile < 0.0) {
    fire *= 0.84;
  } else if (u_profile > 0.0) {
    // Follow each column from its lowest ink. The glyph mask keeps the
    // counters open while hot streaks climb the strokes into the plume.
    vec4 column = texture(u_bed, vec2(uv.x, 0.5));
    float height = max(column.g - column.a, 1.0 / u_res.y);
    float fromBase = clamp((uv.y - column.a) / height, 0.0, 1.0);
    float streak = fbm(vec2(uv.x * aspect * 10.0 + 1.3 * n2, uv.y * 4.0 - t * 2.5));
    float ignition = mix(0.52, 1.38, smoothstep(0.24, 0.74, streak));
    fire = max(fire * 1.18, ink * ignition * mix(1.10, 0.92, fromBase));
  }

  vec3 coal = u_color * mix(0.63, 0.88, u_dark);
  float warmth = smoothstep(0.0, 0.55, u_color.r - u_color.b);
  vec3 incandescent = mix(vec3(0.88, 0.95, 1.0), vec3(1.0, 0.79, 0.42), warmth);
  vec3 ember = mix(u_color, incandescent, 0.55);
  vec3 flame = mix(u_color, ember, smoothstep(0.46, 0.88, fire));
  flame = mix(flame, mix(incandescent, vec3(1.0), 0.6), 0.5 * smoothstep(0.84, 1.12, fire));
  vec3 body = mix(coal, mix(u_color, ember, 0.45 * u_dark), 0.28 + 0.65 * licks);
  body = mix(body, incandescent, 0.12 * u_dark * smoothstep(0.10, 0.30, belowTop));
  body = mix(body, flame, inside * crown);
  // At a hot root the same color covers both sides of the glyph silhouette.
  float plume = smoothstep(0.18, 0.80, fire) * (1.0 - smoothstep(0.85, 1.0, uv.y));
  outColor = vec4(mix(body * ink, flame, plume), ink + (1.0 - ink) * plume);
}
`;
