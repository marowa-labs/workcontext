"use client";

import React, { useRef, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  angle: number;
  color: string;
  baseColor: string;
  unravelColor: string;
  opacity: number;
  threadWeight: number;
}

export interface LineStitchProps {
  /** Text to render as stitched thread */
  text?: string;
  /** Font family for text sampling */
  fontFamily?: string;
  /** Font size (px) for text sampling */
  fontSize?: number;
  /** Stitch density — controls sampling grid size (smaller = denser) */
  stitchDensity?: number;
  /** Width of each thread segment */
  threadWeight?: number;
  /** Base thread color (CSS color) */
  baseColor?: string;
  /** Color when particles unravel under cursor */
  unravelColor?: string;
  /** Background color (CSS color) */
  backgroundColor?: string;
  /** Spring force pulling particles back (0-1) */
  springForce?: number;
  /** Damping to slow particles (0-1) */
  damping?: number;
  /** Repel force from cursor */
  repelForce?: number;
  /** Random jitter amount */
  jitter?: number;
  /** Cursor influence radius (px) */
  cursorRadius?: number;
  /** Intro scatter distance (multiplier) */
  introScatter?: number;
  /** Intro animation duration (ms) */
  introDuration?: number;
  className?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse a CSS color to {r, g, b} */
function parseColor(color: string): { r: number; g: number; b: number } {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.fillStyle = color;
  const hex = ctx.fillStyle;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Interpolate between two RGB colors */
function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): string {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}

/** Sample text pixels on an offscreen canvas */
function sampleText(
  text: string,
  fontFamily: string,
  fontSize: number,
  density: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number }[] {
  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d")!;
  offscreen.width = canvasWidth;
  offscreen.height = canvasHeight;

  // Measure and center text
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;
  const offsetX = (canvasWidth - textWidth) / 2;
  const offsetY = (canvasHeight - textHeight) / 2 + textHeight * 0.8;

  ctx.fillStyle = "white";
  ctx.fillText(text, offsetX, offsetY);

  // Sample pixels
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const points: { x: number; y: number }[] = [];

  for (let y = 0; y < canvasHeight; y += density) {
    for (let x = 0; x < canvasWidth; x += density) {
      const i = (y * canvasWidth + x) * 4;
      if (imageData.data[i + 3] > 128) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

// ─── Component ──────────────────────────────────────────────────────────────

const LineStitch: React.FC<LineStitchProps> = ({
  text = "WORKCONTEXT",
  fontFamily = "Inter, system-ui, sans-serif",
  fontSize = 120,
  stitchDensity = 5,
  threadWeight = 2,
  baseColor = "#3b82f6",
  unravelColor = "#f59e0b",
  backgroundColor = "transparent",
  springForce = 0.03,
  damping = 0.92,
  repelForce = 8,
  jitter = 0.5,
  cursorRadius = 120,
  introScatter = 40,
  introDuration = 2000,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isIntroRef = useRef<boolean>(true);

  // Initialize particles
  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const points = sampleText(
      text,
      fontFamily,
      fontSize,
      stitchDensity,
      rect.width,
      rect.height
    );

    const base = parseColor(baseColor);
    const unravel = parseColor(unravelColor);

    particlesRef.current = points.map((p) => {
      // Scatter position for intro
      const angle = Math.random() * Math.PI * 2;
      const dist = (Math.random() * introScatter + 10) * (rect.width / 800);

      return {
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist,
        originX: p.x,
        originY: p.y,
        vx: 0,
        vy: 0,
        width: stitchDensity * 0.9,
        height: threadWeight,
        angle: Math.random() * 0.4 - 0.2,
        color: baseColor,
        baseColor: `rgb(${base.r},${base.g},${base.b})`,
        unravelColor: `rgb(${unravel.r},${unravel.g},${unravel.b})`,
        opacity: 1,
        threadWeight,
      };
    });

    startTimeRef.current = performance.now();
    isIntroRef.current = true;
  }, [
    text,
    fontFamily,
    fontSize,
    stitchDensity,
    threadWeight,
    baseColor,
    unravelColor,
    introScatter,
  ]);

  // Animation loop
  useEffect(() => {
    initParticles();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Animation
    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const now = performance.now();
      const elapsed = now - startTimeRef.current;

      // Intro progress (0 → 1)
      const introProgress = Math.min(elapsed / introDuration, 1);
      if (introProgress >= 1) isIntroRef.current = false;

      ctx.clearRect(0, 0, rect.width, rect.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const base = parseColor(baseColor);
      const unravel = parseColor(unravelColor);

      particlesRef.current.forEach((p) => {
        // ─── Intro scatter animation ──────────────────────────
        if (isIntroRef.current) {
          const ease = 1 - Math.pow(1 - introProgress, 3); // ease-out cubic
          const scatterX = (Math.random() - 0.5) * 200 * (1 - ease);
          const scatterY = (Math.random() - 0.5) * 200 * (1 - ease);
          p.x = p.originX + (p.x - p.originX) * (1 - ease * 0.3) + scatterX;
          p.y = p.originY + (p.y - p.originY) * (1 - ease * 0.3) + scatterY;
        } else {
          // ─── Physics: spring back to origin ─────────────────
          const dx = p.originX - p.x;
          const dy = p.originY - p.y;
          p.vx += dx * springForce;
          p.vy += dy * springForce;

          // ─── Cursor interaction: repel + unravel ────────────
          const distToCursor = Math.sqrt(
            (p.x - mx) ** 2 + (p.y - my) ** 2
          );

          if (distToCursor < cursorRadius) {
            const force = (1 - distToCursor / cursorRadius) * repelForce;
            const angle = Math.atan2(p.y - my, p.x - mx);
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;

            // Add some upward drift for unravel effect
            p.vy -= force * 0.3;

            // Color shift
            const t = 1 - distToCursor / cursorRadius;
            p.color = lerpColor(base, unravel, t);
            p.opacity = 0.6 + t * 0.4;

            // Slight rotation
            p.angle += (Math.random() - 0.5) * 0.2 * t;
          } else {
            // Reset color
            p.color = `rgb(${base.r},${base.g},${base.b})`;
            p.opacity = 1;
            p.angle *= 0.95; // ease rotation back
          }

          // ─── Jitter ────────────────────────────────────────
          p.vx += (Math.random() - 0.5) * jitter;
          p.vy += (Math.random() - 0.5) * jitter;

          // ─── Damping ───────────────────────────────────────
          p.vx *= damping;
          p.vy *= damping;

          // ─── Move ──────────────────────────────────────────
          p.x += p.vx;
          p.y += p.vy;
        }

        // ─── Draw thread segment ─────────────────────────────
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(
          -p.width / 2,
          -p.height / 2,
          p.width,
          p.height
        );
        ctx.restore();
      });

      // ─── Draw connecting threads between nearby particles ──
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesRef.current.length; i += 3) {
        const p = particlesRef.current[i];
        const p2 = particlesRef.current[i + 1];
        if (!p2) continue;
        const dist = Math.sqrt(
          (p.originX - p2.originX) ** 2 + (p.originY - p2.originY) ** 2
        );
        if (dist < stitchDensity * 4) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    initParticles,
    springForce,
    damping,
    repelForce,
    jitter,
    cursorRadius,
    baseColor,
    unravelColor,
    introDuration,
    stitchDensity,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ backgroundColor }}
    />
  );
};

export default LineStitch;
