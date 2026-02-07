'use client';

import { motion } from 'framer-motion';

interface ReliabilityBadgeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md';
}

const sizeConfig = {
  sm: { dim: 40, stroke: 3, fontSize: 'text-xs', labelSize: 'text-[9px]' },
  md: { dim: 56, stroke: 4, fontSize: 'text-sm', labelSize: 'text-[10px]' },
};

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'; // emerald-500
  if (score >= 45) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

export default function ReliabilityBadge({ score, label, size = 'md' }: ReliabilityBadgeProps) {
  const config = sizeConfig[size];
  const radius = (config.dim - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

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
