'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtext?: string;
  color?: string;
  delay?: number;
}

export default function StatCard({ label, value, icon, subtext, color = 'from-orange-500/20 to-purple-500/20', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card-sm p-4 flex flex-col items-center text-center"
    >
      {icon && <div className="mb-2 text-white/60">{icon}</div>}
      <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {value}
      </div>
      {subtext && <div className="text-xs text-white/30 mt-1">{subtext}</div>}
    </motion.div>
  );
}
