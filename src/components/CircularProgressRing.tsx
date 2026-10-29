'use client';

import React, { useEffect, useState } from 'react';

interface CircularProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  gradientColors?: [string, string];
  glowColor?: string;
  label?: string;
  subLabel?: string;
  uniqueId?: string;
}

export default function CircularProgressRing({
  percentage,
  size = 130,
  strokeWidth = 10,
  gradientColors = ['#0d9488', '#14b8a6'],
  glowColor = 'rgba(20, 184, 166, 0.35)',
  label,
  subLabel,
  uniqueId = 'progress-ring',
}: CircularProgressRingProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    // Smooth transition from 0 to target percentage on mount
    const timer = setTimeout(() => {
      setAnimatedPercent(Math.max(0, Math.min(100, percentage)));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;
  const gradientId = `circ-grad-${uniqueId}`;

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        style={{
          filter: `drop-shadow(0 4px 14px ${glowColor})`,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200/80 dark:text-slate-800/90"
        />

        {/* Foreground Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center Percentage & Info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-1">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none font-mono">
          {percentage}%
        </span>
        {label ? (
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {label}
          </span>
        ) : subLabel ? (
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
            {subLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
