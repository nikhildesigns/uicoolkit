import { createFullscreenProgram } from "./ember-glow-gl";
import { emberShader, uniforms } from "./ember-shader";

export function createEmberRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return;
  const setup = createFullscreenProgram(gl, emberShader, uniforms);
  if (!setup) return;
  const u = setup.uniforms;
  const pixel = document.createElement("canvas");
  pixel.width = pixel.height = 1;
  const palette = pixel.getContext("2d", { willReadFrequently: true });
  let lastColor = "";
  let lastScheme = "";

  return {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.u_res, width, height);
    },
    refreshPalette() {
      const { color, colorScheme } = getComputedStyle(canvas);
      if (color === lastColor && colorScheme === lastScheme) return false;
      lastColor = color;
      lastScheme = colorScheme;
      gl.uniform1f(u.u_dark, Number(colorScheme === "dark"));
      if (palette) {
        palette.clearRect(0, 0, 1, 1);
        palette.fillStyle = color;
        palette.fillRect(0, 0, 1, 1);
        const [r, g, b] = palette.getImageData(0, 0, 1, 1).data;
        gl.uniform3f(u.u_accent, r / 255, g / 255, b / 255);
      }
      return true;
    },
    draw(time: number, intensity: number, x: number, y: number) {
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_intensity, intensity);
      gl.uniform2f(u.u_mouse, x * canvas.width, y * canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(setup.buffer);
      gl.deleteProgram(setup.program);
    },
  };
}
