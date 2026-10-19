"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const QUASAR_EVENT = "orbit:quasar";

export function triggerQuasarEvent(delayMs = 0) {
  window.setTimeout(() => window.dispatchEvent(new Event(QUASAR_EVENT)), delayMs);
}

const DARKEN_END = 700;
const INFALL_START = 300;
const FORM_START = 1000;
const FORM_END = 2800;
const COLLAPSE_START = 6000;
const BURST_START = 7400;
const END = 9000;
const MAX_DIM = 0.9;
const MAX_SHAKE_PX = 14;

const COLORS = ["#ffffff", "#e8e1fd", "#d1c0fc", "#a37aff", "#844DFE"];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInCubic = (p: number) => p * p * p;
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

interface Orbiter {
  r: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
}

interface Infaller {
  angle: number;
  dist: number;
  spin: number;
  size: number;
  color: string;
  prevX: number | null;
  prevY: number | null;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

function QuasarOverlay({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKey);

    const root = document.documentElement;
    const setShake = (amp: number) => {
      if (amp < 0.2) {
        root.classList.remove("quasar-shaking");
        return [0, 0];
      }
      const x = (Math.random() * 2 - 1) * amp;
      const y = (Math.random() * 2 - 1) * amp;
      root.classList.add("quasar-shaking");
      root.style.setProperty("--quasar-shake-x", `${x}px`);
      root.style.setProperty("--quasar-shake-y", `${y}px`);
      return [x, y];
    };

    const tilt = (Math.random() - 0.5) * 0.6;
    const flatten = 0.3;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);

    const orbiters: Orbiter[] = [];
    for (let i = 0; i < 260; i++) {
      const r = 0.34 + Math.pow(Math.random(), 0.8) * 0.66;
      orbiters.push({
        r,
        angle: Math.random() * Math.PI * 2,
        speed: 0.0016 / Math.sqrt(r),
        size: Math.random() * 1.8 + 0.7,
        color: r < 0.5 ? "#ffffff" : r < 0.75 ? "#d1c0fc" : Math.random() > 0.5 ? "#a37aff" : "#844DFE",
      });
    }
    const infallers: Infaller[] = [];
    const sparks: Spark[] = [];
    let burstSpawned = false;

    let start: number | null = null;
    let last: number | null = null;
    let frame = 0;

    const project = (lx: number, ly: number, cx: number, cy: number) =>
      [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos] as const;

    const render = (now: number) => {
      start ??= now;
      const dt = last === null ? 16 : Math.min(now - last, 50);
      last = now;
      const t = now - start;

      if (t >= END) {
        onDone();
        return;
      }

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.3;
      const diag = Math.hypot(width, height) / 2;

      let dim = MAX_DIM;
      let scale = 1;
      let spinBoost = 1;
      let jet = 0;
      let shake = 1.2;

      if (t < DARKEN_END) dim = MAX_DIM * easeOutCubic(t / DARKEN_END);
      if (t >= BURST_START) dim = MAX_DIM * (1 - easeOutCubic(clamp01((t - BURST_START - 300) / (END - BURST_START - 300))));

      if (t < FORM_START) {
        scale = 0;
        shake = 0;
      } else if (t < FORM_END) {
        scale = easeOutCubic((t - FORM_START) / (FORM_END - FORM_START));
        shake = scale * 1.2;
      } else if (t < COLLAPSE_START) {
        jet = clamp01((t - FORM_END) / 800);
      } else if (t < BURST_START) {
        const p = (t - COLLAPSE_START) / (BURST_START - COLLAPSE_START);
        scale = 1 - easeInCubic(p) * 0.96;
        spinBoost = 1 + p * 8;
        jet = 1 - p;
        shake = 1.2 + easeInCubic(p) * (MAX_SHAKE_PX - 1.2);
      } else {
        scale = 0;
        shake = MAX_SHAKE_PX * (1 - clamp01((t - BURST_START) / 500));
      }

      const intensity = clamp01((t - FORM_START) / 800);
      const R = baseRadius * scale;
      const [sx, sy] = setShake(shake);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(3, 1, 10, ${dim})`;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(sx, sy);

      if (R > 0) {
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.8);
        halo.addColorStop(0, `rgba(132, 77, 254, ${0.3 * intensity})`);
        halo.addColorStop(1, "rgba(132, 77, 254, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (jet > 0) {
        const flicker = 0.85 + Math.sin(now * 0.025) * 0.15;
        const length = baseRadius * 3.2 * jet;
        for (const dir of [1, -1]) {
          const ex = cx - sin * length * dir;
          const ey = cy + cos * length * dir;
          const grad = ctx.createLinearGradient(cx, cy, ex, ey);
          grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * jet * flicker})`);
          grad.addColorStop(0.3, `rgba(209, 192, 252, ${0.55 * jet * flicker})`);
          grad.addColorStop(1, "rgba(132, 77, 254, 0)");
          ctx.strokeStyle = grad;
          for (const [lineWidth, alpha] of [[14, 0.25], [3.5, 1]] as const) {
            ctx.globalAlpha = alpha;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

      if (t >= INFALL_START && t < COLLAPSE_START) {
        const count = Math.round(dt * 0.12 + Math.random() * 0.5);
        for (let i = 0; i < count; i++) {
          infallers.push({
            angle: Math.random() * Math.PI * 2,
            dist: diag * (0.95 + Math.random() * 0.3),
            spin: 0.0006 + Math.random() * 0.0008,
            size: Math.random() * 1.4 + 0.6,
            color: pickColor(),
            prevX: null,
            prevY: null,
          });
        }
      }

      const consumeRadius = Math.max(12, R * 0.4);
      const pull = t >= COLLAPSE_START ? 2.2 : 1;
      ctx.lineCap = "round";
      for (let i = infallers.length - 1; i >= 0; i--) {
        const f = infallers[i];
        f.dist -= dt * (0.25 + 40 / Math.max(f.dist, 20)) * pull;
        f.angle += f.spin * dt * (300 / Math.max(f.dist, 40)) * pull;
        if (f.dist < consumeRadius || t >= BURST_START) {
          infallers.splice(i, 1);
          continue;
        }
        const squash = flatten + (1 - flatten) * clamp01((f.dist - baseRadius) / (baseRadius * 2));
        const [x, y] = project(Math.cos(f.angle) * f.dist, Math.sin(f.angle) * f.dist * squash, cx, cy);
        if (f.prevX !== null && f.prevY !== null) {
          ctx.globalAlpha = 0.25 + 0.75 * clamp01(1 - f.dist / diag);
          ctx.strokeStyle = f.color;
          ctx.lineWidth = f.size;
          ctx.beginPath();
          ctx.moveTo(f.prevX, f.prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        f.prevX = x;
        f.prevY = y;
      }
      ctx.globalAlpha = 1;

      if (R > 0) {
        for (const o of orbiters) o.angle += o.speed * spinBoost * dt;

        const drawOrbiters = (front: boolean) => {
          for (const o of orbiters) {
            const sinA = Math.sin(o.angle);
            if (sinA >= 0 !== front) continue;
            const [x, y] = project(Math.cos(o.angle) * o.r * R, sinA * o.r * R * flatten, cx, cy);
            ctx.globalAlpha = intensity * (0.45 + 0.55 * ((sinA + 1) / 2));
            ctx.fillStyle = o.color;
            ctx.beginPath();
            ctx.arc(x, y, o.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        };

        drawOrbiters(false);

        const holeRadius = Math.max(3, R * 0.3);
        const hole = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeRadius);
        hole.addColorStop(0, "rgba(0, 0, 0, 1)");
        hole.addColorStop(0.74, "rgba(0, 0, 0, 1)");
        hole.addColorStop(0.86, `rgba(240, 235, 255, ${0.95 * intensity})`);
        hole.addColorStop(0.93, `rgba(163, 122, 255, ${0.55 * intensity})`);
        hole.addColorStop(1, "rgba(132, 77, 254, 0)");
        ctx.fillStyle = hole;
        ctx.beginPath();
        ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
        ctx.fill();

        drawOrbiters(true);
      }

      if (t >= BURST_START) {
        if (!burstSpawned) {
          burstSpawned = true;
          for (let i = 0; i < 160; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * 1.1;
            sparks.push({
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              size: Math.random() * 2 + 0.8,
              color: pickColor(),
            });
          }
        }

        const p = clamp01((t - BURST_START) / (END - BURST_START));
        const ringRadius = easeOutCubic(p) * diag * 1.1;
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = "rgba(209, 192, 252, 0.9)";
        ctx.lineWidth = 4 * (1 - p) + 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringRadius, ringRadius * 0.75, tilt, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vx *= 0.985;
          s.vy *= 0.985;
          s.life -= dt / 1300;
          if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = s.life;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();

      if (t >= BURST_START) {
        const flash = clamp01((t - BURST_START) / 550);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * Math.pow(1 - flash, 2)})`;
        ctx.fillRect(0, 0, width, height);
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKey);
      root.classList.remove("quasar-shaking");
      root.style.removeProperty("--quasar-shake-x");
      root.style.removeProperty("--quasar-shake-y");
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] cursor-pointer" onClick={onDone} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export function QuasarEvent() {
  const [runKey, setRunKey] = useState<number | null>(null);
  const finish = useCallback(() => setRunKey(null), []);

  useEffect(() => {
    const start = () => setRunKey((key) => key ?? Date.now());
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === "KeyQ") start();
    };
    window.addEventListener(QUASAR_EVENT, start);
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener(QUASAR_EVENT, start);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => triggerQuasarEvent()}
        className="fixed bottom-5 right-5 z-40 rounded-full border border-brand/30 bg-white/80 dark:bg-[#100e1e]/80 px-3 py-1.5 text-xs font-semibold text-brand shadow-lg backdrop-blur-md transition-colors hover:bg-brand hover:text-white cursor-pointer"
      >
        Testar quasar
      </button>
      {runKey !== null && <QuasarOverlay key={runKey} onDone={finish} />}
    </>
  );
}
