'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { getTierEmoji } from '@/lib/types';

interface CreatorCardProps {
  creator: {
    id: string;
    channelName: string;
    channelHandle: string | null;
    avatarUrl: string | null;
    subscriberCount: number;
    overallAccuracy: number;
    totalClaims: number;
    verifiedTrue: number;
    tier: string;
    rankOverall: number;
    rankChange: number;
    currentSentiment: string;
  };
  index?: number;
  showRank?: boolean;
}

export default function CreatorCard({ creator, index = 0, showRank = true }: CreatorCardProps) {
  const rankIcon = creator.rankChange > 0
    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
    : creator.rankChange < 0
    ? <TrendingDown className="w-3.5 h-3.5 text-red-400" />
    : <Minus className="w-3.5 h-3.5 text-white/30" />;

  const accuracyColor = creator.overallAccuracy >= 80
    ? 'text-emerald-400'
    : creator.overallAccuracy >= 60
    ? 'text-amber-400'
    : 'text-red-400';

  const sentimentColor = creator.currentSentiment === 'bullish'
    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
    : creator.currentSentiment === 'bearish'
    ? 'bg-red-400/10 text-red-400 border-red-400/20'
    : 'bg-gray-400/10 text-gray-400 border-gray-400/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link href={`/creators/${creator.id}`} className="block glass-card-sm p-4 hover:bg-white/[0.04] transition-all group">
        <div className="flex items-center gap-4">
          {showRank && (
            <div className="flex flex-col items-center w-8">
              <span className="text-lg font-semibold text-white/70">#{creator.rankOverall}</span>
              <span className="flex items-center gap-0.5">{rankIcon}</span>
            </div>
          )}

          <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 font-medium">
                {creator.channelName[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">{creator.channelName}</h3>
              <span className="text-sm">{getTierEmoji(creator.tier)}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
              <span>{creator.channelHandle}</span>
              <span className={`px-1.5 py-0.5 rounded border text-[10px] ${sentimentColor}`}>
                {creator.currentSentiment}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className={`text-xl font-semibold ${accuracyColor}`}>
              {creator.overallAccuracy}%
            </div>
            <div className="text-xs text-white/30">
              {creator.totalClaims} claims
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
