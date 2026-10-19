"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  pulseSpeed: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

interface DiskParticle {
  r: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
}

interface Quasar {
  x: number;
  y: number;
  radius: number;
  tilt: number;
  flatten: number;
  start: number;
  particles: DiskParticle[];
}

const QUASAR_APPEAR_MS = 1800;
const QUASAR_SPIN_MS = 4500;
const QUASAR_COLLAPSE_MS = 1400;
const QUASAR_BURST_MS = 1300;
const QUASAR_FIRST_DELAY_MS: [number, number] = [30_000, 60_000];
const QUASAR_INTERVAL_MS: [number, number] = [90_000, 180_000];

const randomBetween = ([min, max]: [number, number]) => min + Math.random() * (max - min);
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInCubic = (p: number) => p * p * p;

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener("resize", handleResize);

    const starColors = ["#ffffff", "#e8e1fd", "#d1c0fc", "#f5f3ff", "#844DFE"];
    let stars: Star[] = [];
    const meteors: Meteor[] = [];

    const initStars = () => {
      const starCount = Math.min(Math.floor((width * height) / 12000), 90);
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.6 + 0.4,
          alpha: Math.random() * 0.6 + 0.15,
          speed: Math.random() * 0.04 + 0.01,
          pulseSpeed: Math.random() * 0.015 + 0.005,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }
    };

    initStars();

    // Occasional meteor generator
    let lastMeteorTime = 0;
    const spawnMeteor = (now: number) => {
      if (now - lastMeteorTime > 3000 && Math.random() > 0.4) {
        lastMeteorTime = now;
        meteors.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * (height * 0.4),
          length: Math.random() * 70 + 40,
          speed: Math.random() * 6 + 8,
          opacity: 0.9,
          angle: (Math.PI / 4) + (Math.random() * 0.1 - 0.05),
        });
      }
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let quasar: Quasar | null = null;
    let nextQuasarAt: number | null = null;
    let lastFrameTime: number | null = null;

    const spawnQuasar = (now: number) => {
      const radius = Math.min(Math.min(width, height) * 0.08, 38 + Math.random() * 24);
      const particles: DiskParticle[] = [];
      for (let i = 0; i < 70; i++) {
        const r = 0.3 + Math.random() * 0.7;
        particles.push({
          r,
          angle: Math.random() * Math.PI * 2,
          speed: 0.0022 / Math.sqrt(r),
          size: Math.random() * 1.2 + 0.5,
          color: r < 0.5 ? "#ffffff" : r < 0.75 ? "#d1c0fc" : Math.random() > 0.5 ? "#a37aff" : "#844DFE",
        });
      }
      quasar = {
        x: width * (0.15 + Math.random() * 0.7),
        y: height * (0.15 + Math.random() * 0.6),
        radius,
        tilt: Math.random() * Math.PI,
        flatten: 0.28 + Math.random() * 0.15,
        start: now,
        particles,
      };
    };

    const renderQuasar = (q: Quasar, now: number, dt: number) => {
      const t = now - q.start;
      const collapseStart = QUASAR_APPEAR_MS + QUASAR_SPIN_MS;
      const burstStart = collapseStart + QUASAR_COLLAPSE_MS;

      if (t >= burstStart) {
        const p = (t - burstStart) / QUASAR_BURST_MS;
        if (p >= 1) return false;

        ctx.save();
        const flashRadius = q.radius * (0.6 + p * 1.2);
        const flash = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, flashRadius);
        flash.addColorStop(0, `rgba(255, 255, 255, ${0.9 * Math.pow(1 - p, 2)})`);
        flash.addColorStop(0.4, `rgba(163, 122, 255, ${0.45 * Math.pow(1 - p, 2)})`);
        flash.addColorStop(1, "rgba(132, 77, 254, 0)");
        ctx.fillStyle = flash;
        ctx.beginPath();
        ctx.arc(q.x, q.y, flashRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = "rgba(209, 192, 252, 0.8)";
        ctx.lineWidth = 1.5 * (1 - p) + 0.3;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y, q.radius * (0.2 + easeOutCubic(p) * 3), q.radius * (0.2 + easeOutCubic(p) * 3) * q.flatten * 1.6, q.tilt, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return true;
      }

      let scale = 1;
      let intensity = 1;
      let spinBoost = 1;
      let jet = 0;

      if (t < QUASAR_APPEAR_MS) {
        const p = t / QUASAR_APPEAR_MS;
        scale = easeOutCubic(p);
        intensity = p;
      } else if (t < collapseStart) {
        jet = Math.min(1, (t - QUASAR_APPEAR_MS) / 1000);
      } else {
        const p = (t - collapseStart) / QUASAR_COLLAPSE_MS;
        scale = 1 - easeInCubic(p) * 0.95;
        spinBoost = 1 + p * 7;
        jet = 1 - p;
      }

      const cos = Math.cos(q.tilt);
      const sin = Math.sin(q.tilt);
      const R = q.radius * scale;

      ctx.save();

      const halo = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, R * 1.4);
      halo.addColorStop(0, `rgba(132, 77, 254, ${0.18 * intensity})`);
      halo.addColorStop(1, "rgba(132, 77, 254, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(q.x, q.y, R * 1.4, 0, Math.PI * 2);
      ctx.fill();

      if (jet > 0) {
        const flicker = 0.85 + Math.sin(now * 0.02) * 0.15;
        const length = q.radius * 2.4 * jet;
        const dx = -sin;
        const dy = cos;
        for (const dir of [1, -1]) {
          const ex = q.x + dx * length * dir;
          const ey = q.y + dy * length * dir;
          const grad = ctx.createLinearGradient(q.x, q.y, ex, ey);
          grad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * jet * flicker})`);
          grad.addColorStop(0.35, `rgba(209, 192, 252, ${0.5 * jet * flicker})`);
          grad.addColorStop(1, "rgba(132, 77, 254, 0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }

      for (const particle of q.particles) {
        particle.angle += particle.speed * spinBoost * dt;
        const lx = Math.cos(particle.angle) * particle.r * R;
        const ly = Math.sin(particle.angle) * particle.r * R * q.flatten;
        const depth = 0.45 + 0.55 * ((Math.sin(particle.angle) + 1) / 2);
        ctx.globalAlpha = intensity * depth * 0.9;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(q.x + lx * cos - ly * sin, q.y + lx * sin + ly * cos, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      const coreRadius = Math.max(2, R * 0.35);
      const core = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, coreRadius);
      core.addColorStop(0, `rgba(255, 255, 255, ${0.95 * intensity})`);
      core.addColorStop(0.4, `rgba(232, 225, 253, ${0.6 * intensity})`);
      core.addColorStop(1, "rgba(132, 77, 254, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(q.x, q.y, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return true;
    };

    let tick = 0;
    const render = (now: number) => {
      tick++;
      const dt = lastFrameTime === null ? 16 : Math.min(now - lastFrameTime, 50);
      lastFrameTime = now;
      ctx.clearRect(0, 0, width, height);

      // Render Stars
      for (const star of stars) {
        star.alpha += Math.sin(tick * star.pulseSpeed) * 0.006;
        const clampedAlpha = Math.max(0.12, Math.min(0.8, star.alpha));

        ctx.save();
        ctx.fillStyle = star.color;
        ctx.globalAlpha = clampedAlpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow for larger stars
        if (star.size > 1.3) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = star.color;
          ctx.fill();
        }
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        if (nextQuasarAt === null) nextQuasarAt = now + randomBetween(QUASAR_FIRST_DELAY_MS);
        if (!quasar && now >= nextQuasarAt) spawnQuasar(now);
        if (quasar && !renderQuasar(quasar, now, dt)) {
          quasar = null;
          nextQuasarAt = now + randomBetween(QUASAR_INTERVAL_MS);
        }
      }

      // Check for meteors
      spawnMeteor(now);

      // Render Meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= 0.015;

        if (m.opacity <= 0 || m.x > width || m.y > height) {
          meteors.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = m.opacity;
        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, "rgba(132, 77, 254, 0)");
        grad.addColorStop(0.7, "rgba(163, 122, 255, 0.5)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.95)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle, moderate Nebula Ambient Glows */}
      <div className="absolute -top-40 left-1/3 w-[550px] h-[550px] rounded-full bg-brand/[0.06] dark:bg-brand/[0.08] blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] rounded-full bg-brand/[0.04] dark:bg-brand/[0.06] blur-[140px] pointer-events-none" />

      {/* Grid Pattern overlay with radial fade */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] bg-[linear-gradient(to_right,#844DFE_1px,transparent_1px),linear-gradient(to_bottom,#844DFE_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)] pointer-events-none"
      />

      {/* Twinkling Star Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
