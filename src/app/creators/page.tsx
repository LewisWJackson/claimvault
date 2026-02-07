'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Filter, ArrowUpDown } from 'lucide-react';
import CreatorCard from '@/components/CreatorCard';
import TierBadge from '@/components/TierBadge';
import RadarChart from '@/components/RadarChart';
import Link from 'next/link';
import { getAllCreators } from '@/lib/db';

type SortKey = 'accuracy' | 'claims' | 'rank' | 'subscribers';

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortKey>('rank');
  const allCreators = getAllCreators();

  const sorted = [...allCreators].sort((a, b) => {
    switch (sortBy) {
      case 'accuracy': return b.overallAccuracy - a.overallAccuracy;
      case 'claims': return b.totalClaims - a.totalClaims;
      case 'subscribers': return b.subscriberCount - a.subscriberCount;
      default: return (a.rankOverall ?? 99) - (b.rankOverall ?? 99);
    }
  });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            Leaderboard
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Ranked by prediction accuracy across {allCreators.length} tracked XRP creators
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-white/30" />
          {(['rank', 'accuracy', 'claims', 'subscribers'] as const).map(key => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === key
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
              }`}>
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid md:grid-cols-3 gap-4">
        {top3.map((creator, i) => {
          const radarData = [
            { category: 'Price', value: creator.priceAccuracy, fullMark: 100 },
            { category: 'Timeline', value: creator.timelineAccuracy, fullMark: 100 },
            { category: 'Regulatory', value: creator.regulatoryAccuracy, fullMark: 100 },
            { category: 'Partner', value: creator.partnershipAccuracy, fullMark: 100 },
            { category: 'Tech', value: creator.technologyAccuracy, fullMark: 100 },
            { category: 'Market', value: creator.marketAccuracy, fullMark: 100 },
          ];

          const accuracyColor = creator.overallAccuracy >= 80
            ? 'text-emerald-400' : creator.overallAccuracy >= 60
            ? 'text-amber-400' : 'text-red-400';

          return (
            <motion.div key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link href={`/creators/${creator.id}`}
                className="block glass-card p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
              >
                {/* Rank badge */}
                <div className="absolute top-4 right-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-lg ${
                    i === 0 ? 'bg-amber-400/20 text-amber-400' :
                    i === 1 ? 'bg-gray-300/20 text-gray-300' :
                    'bg-orange-400/20 text-orange-400'
                  }`}>
                    #{i + 1}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-white/50">
                        {creator.channelName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{creator.channelName}</h3>
                    <div className="flex items-center gap-2">
                      <TierBadge tier={creator.tier} size="sm" />
                    </div>
                  </div>
                </div>

                <RadarChart data={radarData} size={200} />

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <div className="text-xs text-white/40">Accuracy</div>
                    <div className={`text-2xl font-semibold ${accuracyColor}`}>{creator.overallAccuracy}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40">Claims</div>
                    <div className="text-lg font-semibold text-white/70">{creator.totalClaims}</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Remaining Rankings */}
      <div className="space-y-2">
        {rest.map((creator, i) => (
          <CreatorCard key={creator.id} creator={creator} index={i} showRank={true} />
        ))}
      </div>
    </div>
  );
}
