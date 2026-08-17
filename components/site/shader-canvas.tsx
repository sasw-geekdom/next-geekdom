"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A WebGL flow, clipped to a brand shape by a CSS mask.
 *
 * Adapted from the SASTW bolt in the sibling `next-sasw` repo — same idea: the
 * canvas is a plain rectangle of moving colour, and a `mask: url(shape.svg)`
 * is what turns it into the mark. Nothing here knows what shape it's inside.
 *
 * Two differences from that implementation, both deliberate:
 *
 *   - Reduced motion is read with `matchMedia`, not `useReducedMotion` from
 *     `motion`. This repo has no animation library and doesn't need ~30KB of
 *     one for a single boolean.
 *   - The loop pauses when the shape scrolls off screen. On a form page the
 *     crown is a sticky rail that can sit out of view for the whole scroll,
 *     and there's no reason to keep drawing it.
 *
 * Falls back to a static SVG when WebGL is unavailable, the context is lost,
 * or the visitor prefers reduced motion — so the mark is always present, and
 * only its animation is conditional.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// Domain-warped fBm, mixed from a dark floor up to the brand colour and
// brightened toward the cursor.
const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2  u_mouse;
uniform vec3  u_color;
uniform vec3  u_accent;
uniform vec3  u_base;

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

void main(){
  vec2 uv = v_uv;
  float t = u_time * 0.12;

  // Warp the sample point by another fBm before sampling again — this is what
  // makes the flow curl instead of merely scrolling.
  vec2 q = vec2(fbm(uv * 2.4 + vec2(0.0, t)), fbm(uv * 2.4 + vec2(t, 1.0)));
  float f = fbm(uv * 2.4 + q * 1.8 + t * 0.3);

  float glow = smoothstep(0.6, 0.0, distance(uv, u_mouse));

  vec3 col = mix(u_base, u_color, smoothstep(0.15, 0.95, f));
  // Gold rides on the brightest crests, so the mark has two brand colours in
  // it rather than one being tinted lighter and darker.
  col = mix(col, u_accent, smoothstep(0.62, 0.98, f) * 0.55);
  col += u_accent * glow * 0.35;

  gl_FragColor = vec4(col, 1.0);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error("createShader failed");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? "shader compile failed");
  }
  return s;
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Subscribes to the reduced-motion preference.
 *
 * `useSyncExternalStore` rather than useState + useEffect: matchMedia IS an
 * external store, and this is the API for reading one. It also avoids the
 * setState-in-effect pattern, gets the value on the very first client render
 * instead of one frame late, and takes an explicit server snapshot — which has
 * to be `false`, because the server cannot know and rendering the static
 * fallback there would hydrate into a mismatch on every animating client.
 */
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
}

export function ShaderCanvas({
  color,
  accent,
  maskClassName,
  fallbackSrc,
  className,
  base = [0.1, 0.03, 0.03],
}: {
  /** The colour the flow mixes up to from `base`. */
  color: string;
  /** Rides the brightest crests and follows the cursor. */
  accent: string;
  maskClassName: string;
  fallbackSrc: string;
  className?: string;
  /** Dark floor the flow mixes up from. Lift it to brighten the whole shape. */
  base?: [number, number, number];
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = React.useState(false);

  const reduced = usePrefersReducedMotion();

  const mouse = React.useRef<[number, number]>([0.5, 0.55]);

  React.useEffect(() => {
    if (reduced || fallback) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let visible = true;
    let gl: WebGLRenderingContext | null = null;

    try {
      gl = (canvas.getContext("webgl") ||
        canvas.getContext(
          "experimental-webgl",
        )) as WebGLRenderingContext | null;
      if (!gl) throw new Error("no webgl");

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
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, "u_time");
      const uMouse = gl.getUniformLocation(prog, "u_mouse");
      const uColor = gl.getUniformLocation(prog, "u_color");
      const uAccent = gl.getUniformLocation(prog, "u_accent");
      const uBase = gl.getUniformLocation(prog, "u_base");

      gl.uniform3f(uBase, base[0], base[1], base[2]);
      gl.uniform3f(uColor, ...hexToRgb(color));
      gl.uniform3f(uAccent, ...hexToRgb(accent));

      const start = performance.now();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      const draw = (now: number) => {
        raf = requestAnimationFrame(draw);
        if (!visible) return; // scrolled away — hold the last frame, burn nothing

        const bw = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        const bh = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw;
          canvas.height = bh;
          gl!.viewport(0, 0, bw, bh);
        }

        gl!.uniform1f(uTime, (now - start) / 1000);
        gl!.uniform2f(uMouse, mouse.current[0], mouse.current[1]);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      };
      raf = requestAnimationFrame(draw);

      const io = new IntersectionObserver(
        ([entry]) => (visible = entry.isIntersecting),
        { rootMargin: "100px" },
      );
      io.observe(canvas);

      const onLost = (e: Event) => {
        e.preventDefault();
        setFallback(true);
      };
      canvas.addEventListener("webglcontextlost", onLost);

      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        canvas.removeEventListener("webglcontextlost", onLost);
      };
    } catch {
      setFallback(true);
      return () => cancelAnimationFrame(raf);
    }
  }, [reduced, fallback, color, accent, base]);

  function track(el: Element, clientX: number, clientY: number) {
    const r = el.getBoundingClientRect();
    mouse.current = [
      (clientX - r.left) / r.width,
      // WebGL's origin is bottom-left; the DOM's is top-left.
      1 - (clientY - r.top) / r.height,
    ];
  }

  return (
    <div className={cn("relative select-none", className)}>
      {reduced || fallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallbackSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <canvas
          ref={canvasRef}
          onMouseMove={(e) => track(e.currentTarget, e.clientX, e.clientY)}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) track(e.currentTarget, t.clientX, t.clientY);
          }}
          aria-hidden="true"
          className={cn("absolute inset-0 h-full w-full", maskClassName)}
        />
      )}
    </div>
  );
}
