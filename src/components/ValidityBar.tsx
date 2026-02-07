'use client';

import { motion } from 'framer-motion';
import { VALIDITY_COLORS } from '@/lib/types';

interface ValidityBarProps {
  verified: number;
  mixed: number;
  speculative: number;
  verifiedCount?: number;
  mixedCount?: number;
  speculativeCount?: number;
  showLabels?: boolean;
  showCounts?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { height: 'h-2', showLabels: false, showCounts: false },
  md: { height: 'h-4', showLabels: true, showCounts: false },
  lg: { height: 'h-6', showLabels: true, showCounts: true },
};

const segments = [
  { key: 'verified' as const, color: VALIDITY_COLORS.verified, label: 'Verified' },
  { key: 'mixed' as const, color: VALIDITY_COLORS.mixed, label: 'Mixed' },
  { key: 'speculative' as const, color: VALIDITY_COLORS.speculative, label: 'Speculative' },
];

export default function ValidityBar({
  verified,
  mixed,
  speculative,
  verifiedCount,
  mixedCount,
  speculativeCount,
  showLabels,
  showCounts,
  size = 'md',
}: ValidityBarProps) {
  const config = sizeConfig[size];
  const displayLabels = showLabels ?? config.showLabels;
  const displayCounts = showCounts ?? config.showCounts;

  const values = { verified, mixed, speculative };
  const counts = {
    verified: verifiedCount,
    mixed: mixedCount,
    speculative: speculativeCount,
  };

  return (
    <div className="w-full">
      <div className={`flex w-full ${config.height} rounded-full overflow-hidden bg-white/5`}>
        {segments.map((seg, i) => {
          const pct = values[seg.key];
          if (pct <= 0) return null;
          return (
            <motion.div
              key={seg.key}
              className="relative flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: seg.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              {displayLabels && pct >= 12 && (
                <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                  {Math.round(pct)}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {displayCounts && (
        <div className="flex items-center gap-4 mt-2">
          {segments.map((seg) => {
            const count = counts[seg.key];
            if (count == null && values[seg.key] <= 0) return null;
            return (
              <div key={seg.key} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs text-white/50">
                  {seg.label}
                  {count != null && (
                    <span className="text-white/30 ml-1">({count})</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
