export const uniforms = ["u_size", "u_dpr", "u_origin", "u_time", "u_inward", "u_still", "u_pointer", "u_taps", "u_idle", "u_accent"];

export const pulseShader = `#version 300 es
precision highp float;
uniform vec2 u_size;
uniform float u_dpr;
uniform vec2 u_origin;
uniform float u_time;
uniform bool u_inward;
uniform bool u_still;
uniform vec2 u_pointer;
uniform vec3 u_taps[4];
uniform vec3 u_idle;
uniform vec3 u_accent;
out vec4 outColor;

float ring(float distanceFromOrigin, float radius, float width) {
  float delta = (distanceFromOrigin - radius) / width;
  return exp(-delta * delta);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x / u_dpr, u_size.y - gl_FragCoord.y / u_dpr);
  vec2 dotCenter = (floor(p / 24.0) + 0.5) * 24.0;
  vec2 origin = u_origin * u_size;
  float d = distance(dotCenter, origin);
  float reach = length(max(origin, u_size - origin));
  float width = clamp(reach * 0.042, 12.0, 34.0);
  float wave = 0.0;
  if (u_still) {
    // Keep both rings in view on wide, tall and edge-origin surfaces.
    float span = min(u_size.x, u_size.y);
    float inner = ring(d, span * 0.23, max(8.0, span * 0.032));
    float outer = ring(d, span * 0.42, max(8.0, span * 0.032));
    wave = u_inward ? inner + 0.65 * outer : outer + 0.65 * inner;
  } else {
    for (int i = 0; i < 2; i++) {
      float age = mod(u_time + float(i) * 0.38, 4.2);
      float travel = age * reach / 2.8;
      float radius = u_inward ? reach - travel : travel;
      float fade = u_inward ? sin(3.14159 * clamp(age / 2.8, 0.0, 1.0)) : 1.0 - age / 4.2;
      wave += ring(d, radius, width) * fade * (i == 0 ? 1.0 : 0.65);
    }
    for (int i = 0; i < 4; i++) {
      float age = u_time - u_taps[i].z;
      if (age >= 0.0 && age < 2.2) {
        wave += 1.2 * ring(distance(dotCenter, u_taps[i].xy), age * 420.0, 34.0) * (1.0 - age / 2.2);
      }
    }
    if (u_pointer.x >= 0.0) wave += ring(distance(dotCenter, u_pointer), 0.0, 100.0);
  }
  float e = clamp(wave, 0.0, 1.0);
  float radius = 1.15 + 2.3 * e;
  float coverage = 1.0 - smoothstep(radius - 0.65, radius + 0.65, distance(p, dotCenter));
  float alpha = coverage * mix(0.17, 0.94, e);
  outColor = vec4(mix(u_idle, u_accent, smoothstep(0.08, 0.65, e)) * alpha, alpha);
}`;
