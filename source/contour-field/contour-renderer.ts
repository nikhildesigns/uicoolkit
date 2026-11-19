import { createFullscreenProgram } from "./contour-field-gl";
import { contourShader, uniforms } from "./contour-shader";

export function createContourRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return;
  const setup = createFullscreenProgram(gl, contourShader, uniforms);
  if (!setup) return;
  const u = setup.uniforms;
  const pixel = document.createElement("canvas");
  pixel.width = pixel.height = 1;
  const palette = pixel.getContext("2d", { willReadFrequently: true });
  let lastColor = "";
  let lastForeground = "";
  const uploadColor = (location: WebGLUniformLocation | null, color: string) => {
    if (!palette) return;
    palette.clearRect(0, 0, 1, 1);
    palette.fillStyle = color;
    palette.fillRect(0, 0, 1, 1);
    const [r, g, b] = palette.getImageData(0, 0, 1, 1).data;
    gl.uniform3f(location, r / 255, g / 255, b / 255);
  };

  return {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.u_res, width, height);
      gl.uniform1f(u.u_dpr, dpr);
    },
    refreshPalette() {
      const accent = getComputedStyle(canvas).color;
      const foreground = getComputedStyle(canvas.parentElement!).color;
      if (accent === lastColor && foreground === lastForeground) return false;
      lastColor = accent;
      lastForeground = foreground;
      uploadColor(u.u_accent, accent);
      uploadColor(u.u_fg, foreground);
      return true;
    },
    draw(time: number, density: number, x: number, y: number) {
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_density, density);
      gl.uniform2f(u.u_mouse, x * canvas.width, y * canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(setup.buffer);
      gl.deleteProgram(setup.program);
    },
  };
}
