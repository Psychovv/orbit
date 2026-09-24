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
    let meteors: Meteor[] = [];

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
      if (now - lastMeteorTime > 6000 && Math.random() > 0.4) {
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

    let tick = 0;
    const render = (now: number) => {
      tick++;
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
      <div className="absolute -top-40 left-1/3 w-[550px] h-[550px] rounded-full bg-[#844DFE]/[0.06] dark:bg-[#844DFE]/[0.08] blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] rounded-full bg-[#844DFE]/[0.04] dark:bg-[#844DFE]/[0.06] blur-[140px] pointer-events-none" />

      {/* Grid Pattern overlay with radial fade */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] bg-[linear-gradient(to_right,#844DFE_1px,transparent_1px),linear-gradient(to_bottom,#844DFE_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)] pointer-events-none"
      />

      {/* Twinkling Star Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
