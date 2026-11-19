export const uniforms = ["u_res", "u_time", "u_mouse", "u_accent", "u_dark", "u_intensity"];

export const emberShader = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;
uniform float u_dark;
uniform float u_intensity;
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
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.07;
  vec2 m = u_mouse.x < 0.0 ? vec2(0.0) : (u_mouse - 0.5 * u_res) / u_res.y;

  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.3 + 2.0 * q + vec2(1.7, 9.2) + t * 1.4 + m * 0.35), fbm(p * 1.3 + 2.0 * q + vec2(8.3, 2.8)));
  float f = fbm(p * 1.3 + 2.4 * r);

  vec3 amber = mix(u_accent, vec3(1.0, 0.78, 0.42), 0.55);
  vec3 col = mix(u_accent, amber, smoothstep(0.4, 1.0, length(q)));
  float glow = smoothstep(0.22, 0.72, f);
  float horizon = 1.0 - smoothstep(0.0, 0.9, length((uv - vec2(0.5, 0.2)) * vec2(0.85, 1.9)));
  float alpha = glow * horizon * mix(0.55, 0.8, u_dark);
  alpha += (hash(gl_FragCoord.xy + fract(u_time * 7.0) * 91.0) - 0.5) * 0.05 * horizon;
  alpha = clamp(alpha * u_intensity, 0.0, 1.0);
  outColor = vec4(col * alpha, alpha);
}
`;
