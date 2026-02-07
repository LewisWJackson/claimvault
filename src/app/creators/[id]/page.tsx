'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Youtube, ChevronDown, ChevronUp,
  LayoutGrid, List, Layers,
} from 'lucide-react';
import RadarChart from '@/components/RadarChart';
import TierBadge from '@/components/TierBadge';
import ClaimCard from '@/components/ClaimCard';
import StoryCard from '@/components/StoryCard';
import ReliabilityBadge from '@/components/ReliabilityBadge';
import ValidityBar from '@/components/ValidityBar';
import {
  getReliabilityLabel,
  type ClaimStatus, type CreatorReliability,
} from '@/lib/types';
import {
  getAllCreators, getClaimsWithCreators, getVideosByCreator,
  getCreatorProfile, getStoriesForCreator,
} from '@/lib/db';

type FilterCategory = 'all' | 'price' | 'timeline' | 'regulatory' | 'partnership' | 'technology' | 'market';
type ViewMode = 'status' | 'category' | 'chronological';

const STATUS_GROUPS: { status: ClaimStatus; label: string; headerColor: string }[] = [
  { status: 'verified_true', label: 'Verified True', headerColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { status: 'verified_false', label: 'Verified False', headerColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { status: 'partially_true', label: 'Partially True', headerColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { status: 'expired', label: 'Expired', headerColor: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { status: 'unverifiable', label: 'Unverifiable', headerColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { status: 'pending', label: 'Pending', headerColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
];

const CATEGORY_GROUPS = [
  { key: 'price', label: 'Price Predictions', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { key: 'timeline', label: 'Timeline Predictions', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { key: 'regulatory', label: 'Regulatory Analysis', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'partnership', label: 'Partnership Claims', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { key: 'technology', label: 'Technology Analysis', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'market', label: 'Market Analysis', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
];

function getVerdictColor(label: CreatorReliability): string {
  switch (label) {
    case 'highly_reliable':
    case 'mostly_reliable':
      return 'text-emerald-400';
    case 'mixed':
      return 'text-amber-400';
    case 'mostly_speculative':
      return 'text-purple-400';
    case 'unreliable':
      return 'text-red-400';
  }
}

export default function CreatorProfilePage() {
  const { id } = useParams();
  const allCreators = getAllCreators();
  const creator = allCreators.find(c => c.id === id);
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('status');
  const [videosExpanded, setVideosExpanded] = useState(false);

  if (!creator) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50">Creator not found</p>
        <Link href="/" className="text-orange-400 text-sm mt-2 inline-block">Back to Creators</Link>
      </div>
    );
  }

  const profile = getCreatorProfile(creator.id);
  const allClaims = getClaimsWithCreators({ creatorId: creator.id });
  const videos = getVideosByCreator(creator.id);
  const stories = getStoriesForCreator(creator.id);

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50">Profile data unavailable</p>
        <Link href="/" className="text-orange-400 text-sm mt-2 inline-block">Back to Creators</Link>
      </div>
    );
  }

  const filteredClaims = allClaims.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  // Radar chart data
  const radarData = [
    { category: 'Price', value: profile.priceAccuracy, fullMark: 100 },
    { category: 'Timeline', value: profile.timelineAccuracy, fullMark: 100 },
    { category: 'Regulatory', value: profile.regulatoryAccuracy, fullMark: 100 },
    { category: 'Partnership', value: profile.partnershipAccuracy, fullMark: 100 },
    { category: 'Technology', value: profile.technologyAccuracy, fullMark: 100 },
    { category: 'Market', value: profile.marketAccuracy, fullMark: 100 },
  ];

  // Trust verdict data
  const categories = [
    { name: 'price predictions', score: profile.priceAccuracy },
    { name: 'timeline predictions', score: profile.timelineAccuracy },
    { name: 'regulatory analysis', score: profile.regulatoryAccuracy },
    { name: 'partnership claims', score: profile.partnershipAccuracy },
    { name: 'technology analysis', score: profile.technologyAccuracy },
    { name: 'market analysis', score: profile.marketAccuracy },
  ].filter(c => c.score > 0).sort((a, b) => b.score - a.score);

  const bestCategory = categories[0];
  const worstCategory = categories[categories.length - 1];

  // Accuracy from profile
  const scoreable = profile.validity.verifiedCount + profile.validity.mixedCount + profile.validity.speculativeCount;
  const accuracyPct = scoreable > 0
    ? Math.round((profile.validity.verifiedCount / scoreable) * 1000) / 10
    : 0;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Creators
      </Link>

      {/* ═══ Section 1: Trust Hero ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8"
      >
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          {/* Left: Avatar + Info */}
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/10 ring-2 ring-white/10">
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-white/50">
                    {creator.channelName[0]}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{creator.channelName}</h1>
                <TierBadge tier={creator.tier} size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-white/40">{creator.channelHandle}</span>
                <span className="text-white/20">|</span>
                <span className="text-sm text-white/40 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {(creator.subscriberCount / 1000).toFixed(0)}K subs
                </span>
                <span className="text-white/20">|</span>
                <a href={creator.channelUrl} target="_blank" rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Center: Reliability Badge */}
          <div className="flex flex-col items-center justify-center">
            <ReliabilityBadge
              score={profile.reliabilityScore}
              label={getReliabilityLabel(profile.reliabilityLabel)}
              size="md"
            />
          </div>

          {/* Right: Validity Bar + Stats */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-wider mb-2">Claim Validity</h3>
              <ValidityBar
                verified={profile.validity.verified}
                mixed={profile.validity.mixed}
                speculative={profile.validity.speculative}
                verifiedCount={profile.validity.verifiedCount}
                mixedCount={profile.validity.mixedCount}
                speculativeCount={profile.validity.speculativeCount}
                size="lg"
                showCounts
                showLabels
              />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/50">
                Accuracy: <span className="text-white font-semibold">{creator.overallAccuracy}%</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="text-white/50">
                Claims: <span className="text-white font-semibold">{profile.totalClaims}</span>
              </span>
              {profile.rankOverall && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-white/50">
                    Rank: <span className="text-white font-semibold">#{profile.rankOverall}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Section 2: Trust Verdict ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Trust Verdict</h2>
        <p className="text-xl sm:text-2xl font-semibold mb-2">
          <span className="text-white">{profile.channelName} is </span>
          <span className={getVerdictColor(profile.reliabilityLabel)}>
            {getReliabilityLabel(profile.reliabilityLabel)}
          </span>
        </p>
        {categories.length >= 2 && bestCategory && worstCategory ? (
          <p className="text-sm text-white/60 leading-relaxed">
            {accuracyPct}% of their verifiable claims checked out.
            They&apos;re strongest on {bestCategory.name} ({bestCategory.score}%)
            and weakest on {worstCategory.name} ({worstCategory.score}%).
          </p>
        ) : (
          <p className="text-sm text-white/60 leading-relaxed">
            {accuracyPct}% of their verifiable claims checked out.
          </p>
        )}
      </motion.section>

      {/* ═══ Section 3: Claim Verification ═══ */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Claim Verification</h2>

          {/* View toggle */}
          <div className="flex items-center gap-1 glass-card-sm p-1 rounded-lg">
            <button
              onClick={() => setViewMode('status')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'status'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              By Status
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'category'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              By Category
            </button>
            <button
              onClick={() => setViewMode('chronological')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'chronological'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Chronological
            </button>
          </div>
        </div>

        {/* Category filter pills */}
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

        {/* Claims display */}
        <AnimatePresence mode="wait">
          {viewMode === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {STATUS_GROUPS.map(group => {
                const groupClaims = filteredClaims.filter(c => c.status === group.status);
                if (groupClaims.length === 0) return null;
                return (
                  <div key={group.status}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border mb-3 ${group.headerColor}`}>
                      {group.label}
                      <span className="text-xs opacity-70">({groupClaims.length})</span>
                    </div>
                    <div className="space-y-3">
                      {groupClaims.map((claim, i) => (
                        <ClaimCard key={claim.id} claim={claim} index={i} showCreator={false} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredClaims.length === 0 && (
                <div className="glass-card-sm p-8 text-center text-white/30">
                  No claims match your filters.
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {CATEGORY_GROUPS.map(group => {
                const groupClaims = filteredClaims.filter(c => c.category === group.key);
                if (groupClaims.length === 0) return null;
                return (
                  <div key={group.key}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border mb-3 ${group.color}`}>
                      {group.label}
                      <span className="text-xs opacity-70">({groupClaims.length})</span>
                    </div>
                    <div className="space-y-3">
                      {groupClaims.map((claim, i) => (
                        <ClaimCard key={claim.id} claim={claim} index={i} showCreator={false} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredClaims.length === 0 && (
                <div className="glass-card-sm p-8 text-center text-white/30">
                  No claims match your filters.
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'chronological' && (
            <motion.div
              key="chronological"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredClaims.length === 0 ? (
                <div className="glass-card-sm p-8 text-center text-white/30">
                  No claims match your filters.
                </div>
              ) : (
                filteredClaims.map((claim, i) => (
                  <ClaimCard key={claim.id} claim={claim} index={i} showCreator={false} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ═══ Section 4: Accuracy Breakdown ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Accuracy Breakdown</h2>
        <div className="flex justify-center">
          <RadarChart data={radarData} size={320} />
        </div>
      </motion.section>

      {/* ═══ Section 5: Stories Covered ═══ */}
      {stories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Stories Covered ({stories.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stories.slice(0, 6).map((story, i) => (
              <StoryCard key={story.id} story={story} index={i} />
            ))}
          </div>
          {stories.length > 6 && (
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                View all {stories.length} stories
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ═══ Section 6: Tracked Videos (Collapsible) ═══ */}
      <section>
        <button
          onClick={() => setVideosExpanded(!videosExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-white hover:text-white/80 transition-colors mb-4"
        >
          Tracked Videos ({videos.length})
          {videosExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </button>

        <AnimatePresence>
          {videosExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
