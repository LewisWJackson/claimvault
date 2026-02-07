'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface ReliabilityBadgeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { dim: 40, stroke: 3, fontSize: 'text-xs', labelSize: 'text-[9px]', showGlow: false },
  md: { dim: 56, stroke: 4, fontSize: 'text-sm', labelSize: 'text-[10px]', showGlow: false },
  lg: { dim: 140, stroke: 6, fontSize: 'text-4xl', labelSize: 'text-sm', showGlow: true },
};

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 45) return '#f59e0b';
  return '#ef4444';
}

function getScoreGlow(score: number): string {
  if (score >= 70) return 'rgba(34,197,94,0.4)';
  if (score >= 45) return 'rgba(245,158,11,0.4)';
  return 'rgba(239,68,68,0.4)';
}

function CountUpNumber({ target, duration = 1.5, className }: { target: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span className={className}>{display}</span>;
}

export default function ReliabilityBadge({ score, label, size = 'md' }: ReliabilityBadgeProps) {
  const config = sizeConfig[size];
  const radius = (config.dim - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const glowColor = getScoreGlow(score);

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative"
          style={{
            width: config.dim,
            height: config.dim,
            filter: `drop-shadow(0 0 20px ${glowColor})`,
          }}
        >
          {/* Outer rotating dashed ring */}
          <svg
            width={config.dim}
            height={config.dim}
            className="absolute inset-0 game-ring-rotate"
            style={{ opacity: 0.3 }}
          >
            <circle
              cx={config.dim / 2}
              cy={config.dim / 2}
              r={radius + 4}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4 8"
              opacity={0.5}
            />
          </svg>

          {/* Background ring */}
          <svg width={config.dim} height={config.dim} className="-rotate-90">
            <circle
              cx={config.dim / 2}
              cy={config.dim / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={config.stroke}
            />
            {/* Score ring */}
            <motion.circle
              cx={config.dim / 2}
              cy={config.dim / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={config.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            />
            {/* Inner glow ring */}
            <motion.circle
              cx={config.dim / 2}
              cy={config.dim / 2}
              r={radius - 8}
              fill="none"
              stroke={color}
              strokeWidth={1}
              opacity={0.2}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className={`font-bold ${config.fontSize} game-score-glow`} style={{ color }}>
                <CountUpNumber target={score} duration={1.8} />
              </div>
            </motion.div>
            <motion.span
              className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              TRUST
            </motion.span>
          </div>
        </div>

        {/* Label below */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <span className={`${config.labelSize} font-semibold`} style={{ color }}>
            {label}
          </span>
        </motion.div>
      </div>
    );
  }

  // sm / md — original compact badge
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: config.dim, height: config.dim }}>
        <svg width={config.dim} height={config.dim} className="-rotate-90">
          <circle
            cx={config.dim / 2}
            cy={config.dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={config.stroke}
          />
          <motion.circle
            cx={config.dim / 2}
            cy={config.dim / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-semibold text-white ${config.fontSize}`}>{score}</span>
        </div>
      </div>
      <span className={`${config.labelSize} text-white/40 text-center leading-tight`}>{label}</span>
    </div>
  );
}
