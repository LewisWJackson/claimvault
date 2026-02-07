'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ExternalLink, Users, CheckCircle2, XCircle, Clock,
  TrendingUp, TrendingDown, Minus, AlertCircle, Youtube
} from 'lucide-react';
import RadarChart from '@/components/RadarChart';
import TierBadge from '@/components/TierBadge';
import ClaimCard from '@/components/ClaimCard';
import { getStatusColor, getStatusLabel, getCategoryColor } from '@/lib/types';
import { getAllCreators, getClaimsByCreator, getVideosByCreator, getClaimsWithCreators } from '@/lib/db';

type FilterStatus = 'all' | 'verified_true' | 'verified_false' | 'partially_true' | 'expired' | 'unverifiable';
type FilterCategory = 'all' | 'price' | 'timeline' | 'regulatory' | 'partnership' | 'technology' | 'market';

export default function CreatorProfilePage() {
  const { id } = useParams();
  const allCreators = getAllCreators();
  const creator = allCreators.find(c => c.id === id);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');

  if (!creator) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50">Creator not found</p>
        <Link href="/creators" className="text-orange-400 text-sm mt-2 inline-block">Back to Leaderboard</Link>
      </div>
    );
  }

  const allClaims = getClaimsWithCreators({ creatorId: creator.id });
  const videos = getVideosByCreator(creator.id);

  const filteredClaims = allClaims.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  const radarData = [
    { category: 'Price', value: creator.priceAccuracy, fullMark: 100 },
    { category: 'Timeline', value: creator.timelineAccuracy, fullMark: 100 },
    { category: 'Regulatory', value: creator.regulatoryAccuracy, fullMark: 100 },
    { category: 'Partnership', value: creator.partnershipAccuracy, fullMark: 100 },
    { category: 'Technology', value: creator.technologyAccuracy, fullMark: 100 },
    { category: 'Market', value: creator.marketAccuracy, fullMark: 100 },
  ];

  const accuracyColor = creator.overallAccuracy >= 80
    ? 'text-emerald-400' : creator.overallAccuracy >= 60
    ? 'text-amber-400' : 'text-red-400';

  const sentimentColor = creator.currentSentiment === 'bullish'
    ? 'text-emerald-400' : creator.currentSentiment === 'bearish'
    ? 'text-red-400' : 'text-gray-400';

  const rankIcon = creator.rankChange > 0
    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
    : creator.rankChange < 0
    ? <TrendingDown className="w-4 h-4 text-red-400" />
    : <Minus className="w-4 h-4 text-white/30" />;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/creators" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
      </Link>

      {/* ═══ Hero Section ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8"
      >
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Avatar + Info */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/10 ring-2 ring-white/10">
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-white/50">
                    {creator.channelName[0]}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <TierBadge tier={creator.tier} size="sm" />
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{creator.channelName}</h1>
              <div className="flex items-center gap-2 mt-1 justify-center lg:justify-start">
                <span className="text-sm text-white/40">{creator.channelHandle}</span>
                <a href={creator.channelUrl} target="_blank" rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-2 justify-center lg:justify-start">
                <Users className="w-3.5 h-3.5 text-white/30" />
                <span className="text-sm text-white/50">{(creator.subscriberCount / 1000).toFixed(0)}K subscribers</span>
              </div>
            </div>

            {/* Rank */}
            <div className="flex items-center gap-3 glass-card-sm px-4 py-2">
              <span className="text-2xl font-semibold text-white">#{creator.rankOverall}</span>
              <div className="flex items-center gap-1">{rankIcon}</div>
              <span className="text-xs text-white/30">Overall Rank</span>
            </div>
          </div>

          {/* Center: Radar Chart */}
          <div className="flex flex-col items-center">
            <h3 className="text-xs text-white/40 uppercase tracking-wider mb-2">Accuracy Breakdown</h3>
            <RadarChart data={radarData} size={280} />
          </div>

          {/* Right: Key Stats */}
          <div className="space-y-3">
            {/* Accuracy headline */}
            <div className="glass-card-sm p-4 text-center accent-glow">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Overall Accuracy</div>
              <div className={`text-4xl font-bold ${accuracyColor}`}>{creator.overallAccuracy}%</div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-card-sm p-3 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-xs text-white/40">True</div>
                <div className="text-lg font-semibold text-emerald-400">{creator.verifiedTrue}</div>
              </div>
              <div className="glass-card-sm p-3 text-center">
                <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <div className="text-xs text-white/40">False</div>
                <div className="text-lg font-semibold text-red-400">{creator.verifiedFalse}</div>
              </div>
              <div className="glass-card-sm p-3 text-center">
                <AlertCircle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-xs text-white/40">Partial</div>
                <div className="text-lg font-semibold text-amber-400">{creator.partiallyTrue ?? 0}</div>
              </div>
            </div>

            {/* Current stance */}
            <div className="glass-card-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 uppercase tracking-wider">Current Stance</span>
                <span className={`text-xs font-medium ${sentimentColor}`}>{creator.currentSentiment}</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{creator.currentStance}</p>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card-sm p-3 text-center">
                <div className="text-xs text-white/30">Total Claims</div>
                <div className="text-lg font-semibold text-white">{creator.totalClaims}</div>
              </div>
              <div className="glass-card-sm p-3 text-center">
                <div className="text-xs text-white/30">Tracking Since</div>
                <div className="text-sm font-medium text-white">{new Date(creator.trackingSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Claims Section ═══ */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Claims History</h2>

          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            {(['all', 'verified_true', 'verified_false', 'partially_true', 'expired', 'unverifiable'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
                }`}>
                {s === 'all' ? 'All' : getStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'price', 'timeline', 'regulatory', 'partnership', 'technology', 'market'] as const).map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                categoryFilter === c
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/[0.03] text-white/30 border border-white/[0.05] hover:bg-white/[0.06]'
              }`}>
              {c === 'all' ? 'All Categories' : c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredClaims.length === 0 ? (
            <div className="glass-card-sm p-8 text-center text-white/30">
              No claims match your filters.
            </div>
          ) : (
            filteredClaims.map((claim, i) => (
              <ClaimCard key={claim.id} claim={claim} index={i} showCreator={false} />
            ))
          )}
        </div>
      </section>

      {/* ═══ Videos Section ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Tracked Videos ({videos.length})</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {videos.map((video, i) => (
            <motion.div key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass-card-sm p-4 hover:bg-white/[0.04] transition-all"
            >
              <h3 className="text-sm font-medium text-white/80 mb-2 line-clamp-2">{video.title}</h3>
              <div className="flex items-center justify-between text-xs text-white/30">
                <span>{new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>{(video.viewCount / 1000).toFixed(0)}K views</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  video.transcriptStatus === 'completed' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'
                }`}>
                  {video.transcriptStatus}
                </span>
                {video.claimsExtracted && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">
                    claims extracted
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
