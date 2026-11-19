import { flameBed } from "./flame-bed";
import { flamePresets, flameShader, flameUniforms, type FlamePreset } from "./flame-shader";
import { createFullscreenProgram } from "./burning-text-gl";

export function createFlameRenderer(canvas: HTMLCanvasElement, word: HTMLElement) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true });
  const mask = document.createElement("canvas");
  const ctx = mask.getContext("2d", { willReadFrequently: true });
  if (!gl || !ctx) return;
  const setup = createFullscreenProgram(gl, flameShader, flameUniforms);
  if (!setup) return;
  const u = setup.uniforms;

  const texture = (unit: number, uniform: string) => {
    const handle = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, handle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u[uniform], unit);
    return handle;
  };

  const glyphs = texture(0, "u_mask");
  const bed = texture(1, "u_bed");
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  let geometry = "";
  let palette = "";

  return {
    update(forceMask: boolean, preset: FlamePreset) {
      const style = getComputedStyle(word);
      const box = canvas.getBoundingClientRect();
      const letters = word.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const text = word.textContent ?? "";
      const x = letters.left - box.left;
      const y = letters.top - box.top;
      const key = JSON.stringify([text, font, style.letterSpacing, style.direction, box.width, box.height, x, y, letters.height, dpr]);
      const maskChanged = forceMask || key !== geometry;
      if (maskChanged) {
        geometry = key;
        canvas.width = mask.width = Math.max(1, Math.round(box.width * dpr));
        canvas.height = mask.height = Math.max(1, Math.round(box.height * dpr));
        gl.viewport(0, 0, mask.width, mask.height);
        gl.uniform2f(u.u_res, mask.width, mask.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = font;
        ctx.direction = style.direction === "rtl" ? "rtl" : "ltr";
        ctx.textAlign = "left";
        ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
        const metrics = ctx.measureText(text);
        const baseline = y + (letters.height + metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
        ctx.fillStyle = "#fff";
        ctx.fillText(text, x, baseline);
        gl.activeTexture(gl.TEXTURE0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
        const em = parseFloat(style.fontSize) * dpr;
        const pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;
        gl.activeTexture(gl.TEXTURE1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, mask.width, 1, 0, gl.RGBA, gl.FLOAT, flameBed(pixels, mask.width, mask.height, em));
        gl.uniform1f(u.u_em, em / mask.height);
      }
      const { color, colorScheme } = getComputedStyle(canvas);
      const paletteKey = JSON.stringify([color, colorScheme, preset]);
      if (paletteKey === palette) return maskChanged;
      palette = paletteKey;
      // Canvas resolves CSS colors, including wide-gamut theme tokens, to sRGB bytes.
      ctx.resetTransform();
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      gl.uniform3f(u.u_color, r / 255, g / 255, b / 255);
      gl.uniform1f(u.u_dark, colorScheme === "dark" ? 1 : 0);
      const { reach, sway, rate, profile } = flamePresets[preset];
      gl.uniform1f(u.u_reach, reach);
      gl.uniform1f(u.u_sway, sway);
      gl.uniform1f(u.u_rate, rate);
      gl.uniform1f(u.u_profile, profile);
      return true;
    },
    draw(time: number) {
      gl.uniform1f(u.u_time, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(glyphs);
      gl.deleteTexture(bed);
      gl.deleteBuffer(setup.buffer);
      gl.deleteProgram(setup.program);
    },
  };
}
