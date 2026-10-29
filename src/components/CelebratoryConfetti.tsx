'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

const CONFETTI_COLORS = [
  '#f59e0b', // Amber/Gold
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#e11d48', // Rose
  '#ffd700', // Metallic Gold
];

export default function CelebratoryConfetti({
  durationMs = 4500,
  particleCount = 130,
}: {
  durationMs?: number;
  particleCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isCancelled = false;

    // Handle Resize
    const updateSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Generate Particles
    const particles: Particle[] = [];
    const width = canvas.width;
    const height = canvas.height;

    for (let i = 0; i < particleCount; i++) {
      // Launch from both bottom left & right corners toward center-top
      const launchFromLeft = i % 2 === 0;
      const originX = launchFromLeft ? width * 0.15 : width * 0.85;
      const originY = height * 0.75;

      const angle = launchFromLeft
        ? -Math.PI / 4 + (Math.random() - 0.5) * 0.5
        : (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.5;

      const speed = 14 + Math.random() * 18;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        size: 7 + Math.random() * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'star' : 'circle',
        opacity: 1,
        wobble: 0,
        wobbleSpeed: 0.05 + Math.random() * 0.08,
      });
    }

    const startTime = performance.now();

    const drawStar = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const render = (now: number) => {
      if (isCancelled) return;
      const elapsed = now - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allDone = true;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Apply physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // Gravity
        p.vx *= 0.985; // Drag
        p.vy *= 0.985;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        // Fade out toward end of duration
        if (elapsed > durationMs - 1200) {
          const fadeProgress = (elapsed - (durationMs - 1200)) / 1200;
          p.opacity = Math.max(0, 1 - fadeProgress);
        }

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          allDone = false;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.cos(p.wobble), 1);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size / 1.5, p.size / 3);
        }

        ctx.restore();
      }

      if (elapsed < durationMs && !allDone) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [durationMs, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
