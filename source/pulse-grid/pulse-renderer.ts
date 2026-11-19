import { createFullscreenProgram } from "./pulse-grid-gl";
import { pulseShader, uniforms } from "./pulse-shader";

export type GridOptions = {
  origin: readonly [number, number];
  inward: boolean;
  still: boolean;
  interactive: boolean;
  speed: number;
};

export function createPulseRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return;
  const setup = createFullscreenProgram(gl, pulseShader, uniforms);
  if (!setup) return;
  const u = setup.uniforms;
  const pixel = document.createElement("canvas");
  pixel.width = pixel.height = 1;
  const palette = pixel.getContext("2d", { willReadFrequently: true });
  let lastPalette = "";
  return {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.u_size, width / dpr, height / dpr);
      gl.uniform1f(u.u_dpr, dpr);
    },
    refreshPalette() {
      const idle = getComputedStyle(canvas.parentElement!).color;
      const accent = getComputedStyle(canvas).color;
      const key = idle + "/" + accent;
      if (!palette || key === lastPalette) return false;
      lastPalette = key;
      const upload = (location: WebGLUniformLocation | null, color: string) => {
        palette.clearRect(0, 0, 1, 1);
        palette.fillStyle = color;
        palette.fillRect(0, 0, 1, 1);
        const [r, g, b] = palette.getImageData(0, 0, 1, 1).data;
        gl.uniform3f(location, r / 255, g / 255, b / 255);
      };
      upload(u.u_idle, idle);
      upload(u.u_accent, accent);
      return true;
    },
    draw(options: GridOptions, still: boolean, time: number, pointer: readonly [number, number], taps: Float32Array) {
      gl.uniform2f(u.u_origin, ...options.origin);
      gl.uniform1i(u.u_inward, Number(options.inward));
      gl.uniform1i(u.u_still, Number(still));
      gl.uniform1f(u.u_time, time);
      gl.uniform2f(u.u_pointer, ...pointer);
      gl.uniform3fv(u.u_taps, taps);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(setup.buffer);
      gl.deleteProgram(setup.program);
    },
  };
}
