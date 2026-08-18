"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Two drops of pigment finding each other in water.
 *
 * The hero says "find your thinking partner… the one who breaks the problem
 * down with you, builds on your idea." So the field is TWO sources, not one:
 * they drift, their edges tendril into each other, and where they overlap the
 * colour deepens rather than muddying. That last part is the argument — the
 * overlap is more than either input.
 *
 * WHY PIGMENT AND NOT PARTICLES. Every previous attempt at WebGL on this site
 * was removed for reading as screen rather than room: panels behind the photos,
 * the chromatic image, the tilt. A particle field with connecting lines is a
 * network diagram, which is the same failure — it says software, next to a
 * sentence that says "not a tool, a person". Ink in water is a material
 * process, and that is the register that survives here.
 *
 * A SEPARATE COMPONENT FROM ShaderCanvas, deliberately. That one is built for
 * a mark: it requires a mask class and a static SVG to fall back to, and it
 * renders opaque. This has no mask, no fallback shape, and needs an alpha
 * channel so it composites onto sand instead of painting a box over it. Sharing
 * them would mean branching a component that currently does one thing.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

/*
  NO BACKTICKS ANYWHERE INSIDE THIS STRING — one would terminate the template
  literal and break the build. (It has happened here before.)
*/
const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_aspect;
uniform vec3  u_a;
uniform vec3  u_b;
uniform vec3  u_base;
uniform float u_alpha;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

/*
  One drop. The domain warp is what makes the boundary tendril instead of
  staying a circle: the sample point is displaced by a slow fBm before the
  distance is taken, so the edge frays the way pigment does in water.
*/
float drop(vec2 uv, vec2 c, float r, float t, float seed){
  vec2 w = vec2(
    fbm(uv * 2.6 + vec2(seed, seed + 3.0) + t * 0.045),
    fbm(uv * 2.6 + vec2(seed + 9.0, seed + 5.0) - t * 0.038)
  );
  float d = length((uv - c) + (w - 0.5) * 0.62);
  return smoothstep(r, r * 0.12, d);
}

void main(){
  // Aspect-corrected so the drops stay round in a non-square canvas.
  vec2 uv = vec2(v_uv.x * u_aspect, v_uv.y);
  float t = u_time;

  vec2 ca = vec2(0.34 * u_aspect + sin(t * 0.061) * 0.05, 0.60 + cos(t * 0.047) * 0.045);
  vec2 cb = vec2(0.68 * u_aspect + cos(t * 0.052) * 0.045, 0.42 + sin(t * 0.068) * 0.05);

  float a = drop(uv, ca, 0.62, t, 0.0);
  float b = drop(uv, cb, 0.58, t, 11.0);

  // Which pigment dominates here.
  float mixer = b / (a + b + 0.0001);
  vec3 pigment = mix(u_a, u_b, smoothstep(0.15, 0.85, mixer));

  /*
    THE OVERLAP IS THE POINT. Where both drops are present the colour deepens
    rather than averaging toward grey — two inks meeting make a denser third,
    which is the sentence above this canvas rendered as physics.
  */
  float both = a * b;
  pigment = mix(pigment, pigment * 0.78, smoothstep(0.0, 0.6, both));

  float ink = clamp(max(a, b) + both * 0.25, 0.0, 1.0);

  /*
    DENSITY DRIVES COLOUR, NOT TRANSPARENCY.

    An earlier version put the density into the alpha channel, so where pigment
    was thin the mark went see-through and the crown dissolved into the page —
    a white haze around the edges rather than a mark. Inside a mask that reads
    as a printing failure. The flow shows as the colour lifting off a dark
    floor instead, which is exactly what the crown on /account does, and the
    shape stays solid to its own edge.
  */
  vec3 col = mix(u_base, pigment, smoothstep(0.05, 0.85, ink));
  gl_FragColor = vec4(col, u_alpha);
}`;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOTION_QUERY).matches,
    // The server cannot know; rendering the reduced state there would hydrate
    // into a mismatch on every animating client.
    () => false,
  );
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
    const log = gl.getShaderInfoLog(sh);
    throw new Error(kind + " compile failed :: " + (log || "(no log)"));
  }
  return sh;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function InkField({
  className,
  maskClassName,
  colorA = "#CA3625",
  colorB = "#B4552F",
  base = [0.09, 0.028, 0.024],
  alpha = 1,
  frozenTime,
}: {
  className?: string;
  /**
   * A CSS mask class — `crown-mask` or `g-mark-mask` from globals.css.
   *
   * With one, the pigment is clipped to a brand shape: the two drops still
   * drift and meet, but what you see is the crown filling and thinning as they
   * move through it. Nothing in the shader knows about the shape, exactly as
   * with ShaderCanvas.
   *
   * The canvas must carry the SHAPE'S OWN ASPECT when a mask is set — the mask
   * is `contain`, so a mismatched box letterboxes the mark inside it.
   */
  maskClassName?: string;
  /** The two pigments. Both live in the hero's rust family — no gold here. */
  colorA?: string;
  colorB?: string;
  /**
   * The floor the pigment lifts off — the same role `base` plays in
   * ShaderCanvas. Dark by default, so a masked mark reads as solid.
   */
  base?: [number, number, number];
  /** Overall opacity of the whole field. 1 inside a mask. */
  alpha?: number;
  /**
   * Render ONE frame, at this second on the shader's clock, and stop.
   *
   * For the share-card generator, which screenshots this component through a
   * headless browser (scripts/og.mjs). Two things follow from freezing the
   * clock, and both are the point:
   *
   * A still is reproducible. Sampling a live animation means `npm run og`
   * writes seven different PNGs every run and every run is a binary diff
   * against a file nobody changed. Naming the second makes the output a pure
   * function of the input.
   *
   * A still is also not an animation, so `prefers-reduced-motion` stops
   * applying — the whole reason that check exists is movement. Left in, it
   * would return null on any machine with the OS setting on and silently
   * generate seven cards with a hole where the crown goes.
   */
  frozenTime?: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = React.useState(false);
  const reduced = usePrefersReducedMotion();

  const still = frozenTime !== undefined;

  React.useEffect(() => {
    if ((reduced && !still) || failed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let visible = true;
    let gl: WebGLRenderingContext | null = null;

    try {
      // `alpha: true` and a matching blend func — this composites onto sand
      // rather than painting its own ground.
      gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
      }) as WebGLRenderingContext | null;
      if (!gl) throw new Error("no webgl");

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const prog = gl.createProgram();
      if (!prog) throw new Error("createProgram failed");
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) ?? "link failed");
      }
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, "u_time");
      const uAspect = gl.getUniformLocation(prog, "u_aspect");
      gl.uniform3fv(gl.getUniformLocation(prog, "u_a"), rgb(colorA));
      gl.uniform3fv(gl.getUniformLocation(prog, "u_b"), rgb(colorB));
      gl.uniform3fv(gl.getUniformLocation(prog, "u_base"), base);
      gl.uniform1f(gl.getUniformLocation(prog, "u_alpha"), alpha);

      const resize = () => {
        if (!gl) return;
        // Capped at 2x — this is a soft field, and a 3x buffer on a retina
        // display costs fill rate for detail nothing here resolves.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
        gl.uniform1f(uAspect, canvas.clientWidth / Math.max(1, canvas.clientHeight));
      };

      const start = performance.now();
      const frame = () => {
        if (!gl || !visible) return;
        resize();
        gl.uniform1f(uTime, (performance.now() - start) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        raf = requestAnimationFrame(frame);
      };

      /*
        One frame, then nothing — no rAF, and no IntersectionObserver either.
        The observer's job is to stop burning frames off screen, and there are
        no further frames to stop. Leaving it attached would also mean the
        screenshotter races a callback that may not have fired yet.
      */
      if (still) {
        resize();
        gl.uniform1f(uTime, frozenTime);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return;
      }

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
        if (!visible) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      });
      io.observe(canvas);

      const onLost = (e: Event) => {
        e.preventDefault();
        cancelAnimationFrame(raf);
        setFailed(true);
      };
      canvas.addEventListener("webglcontextlost", onLost);

      /*
        NO `loseContext()` HERE, and that is not an oversight — it was, and it
        cost an hour.

        React StrictMode double-invokes effects in development: run, clean up,
        run again. Releasing the context in cleanup means the second run calls
        getContext() on the SAME canvas and is handed back the dead one, where
        every shader compile fails with an EMPTY info log. "vertex compile
        failed :: (no log)" on a shader that compiles perfectly in isolation is
        the signature of exactly this.

        ShaderCanvas omits it for the same reason. The context is collected with
        the canvas.
      */
      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        canvas.removeEventListener("webglcontextlost", onLost);
      };
    } catch {
      setFailed(true);
    }
  }, [reduced, still, frozenTime, failed, colorA, colorB, base, alpha]);

  // No static fallback shape: unlike the brand marks, this carries no
  // information. If it cannot run, the hero is simply the hero.
  if ((reduced && !still) || failed) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("block h-full w-full", maskClassName, className)}
    />
  );
}
