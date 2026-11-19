export const uniforms = ["u_res", "u_time", "u_dpr", "u_mouse", "u_fg", "u_accent", "u_density"];

export const contourShader = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dpr;
uniform vec2 u_mouse;
uniform vec3 u_fg;
uniform vec3 u_accent;
uniform float u_density;
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
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.03;
  float f = fbm(p * 1.2 + vec2(t, -t * 0.6)) + 0.3 * fbm(p * 2.4 - vec2(t * 0.8, t));
  float near = 0.0;
  if (u_mouse.x >= 0.0) {
    vec2 m = (u_mouse - 0.5 * u_res) / u_res.y;
    near = exp(-dot(p - m, p - m) / 0.018);
    f += 0.16 * near;
  }

  float v = f * 13.0 * u_density;
  float dl = min(fract(v), 1.0 - fract(v));
  float line = 1.0 - smoothstep(0.0, max(fwidth(v) * 1.1 * u_dpr, 0.00001), dl);
  float major = mod(floor(v + 0.5), 5.0) < 0.5 ? 1.0 : 0.0;
  float accent = max(major * 0.85, smoothstep(0.1, 0.6, near));

  float alpha = line * mix(0.1, 0.5, accent);
  vec3 col = mix(u_fg, u_accent, accent);
  outColor = vec4(col * alpha, alpha);
}
`;
