'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowLeft, Users, Youtube, ChevronDown, ChevronUp,
  LayoutGrid, List, Layers, Shield, Crosshair, Zap,
  Target, TrendingUp, Award, Activity,
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

const STATUS_GROUPS: { status: ClaimStatus; label: string; headerColor: string; icon: string }[] = [
  { status: 'verified_true', label: 'VERIFIED TRUE', headerColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✅' },
  { status: 'verified_false', label: 'VERIFIED FALSE', headerColor: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' },
  { status: 'partially_true', label: 'PARTIALLY TRUE', headerColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '⚠️' },
  { status: 'expired', label: 'EXPIRED', headerColor: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '⏰' },
  { status: 'unverifiable', label: 'UNVERIFIABLE', headerColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '🔮' },
  { status: 'pending', label: 'PENDING', headerColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '⏳' },
];

const CATEGORY_GROUPS = [
  { key: 'price', label: 'Price Predictions', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { key: 'timeline', label: 'Timeline Predictions', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { key: 'regulatory', label: 'Regulatory Analysis', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'partnership', label: 'Partnership Claims', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { key: 'technology', label: 'Technology Analysis', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'market', label: 'Market Analysis', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
];

// ── Animated number counter ────────────────────────────────────────────────
function CountUp({ target, duration = 1.2, suffix = '', prefix = '', decimals = 0 }: {
  target: number; duration?: number; suffix?: string; prefix?: string; decimals?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration, decimals]);

  return <span ref={ref}>{prefix}{decimals > 0 ? value.toFixed(decimals) : value}{suffix}</span>;
}

// ── RPG stat bar ───────────────────────────────────────────────────────────
function StatBar({ label, value, maxValue = 100, color, delay = 0, icon }: {
  label: string; value: number; maxValue?: number; color: string; delay?: number;
  icon: React.ReactNode;
}) {
  const pct = Math.min((value / maxValue) * 100, 100);

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <span className="text-white/30">{icon}</span>
        <span className="text-xs text-white/50 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden relative">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="absolute inset-0 stat-bar-flash" />
        </motion.div>
      </div>
      <motion.span
        className="text-sm font-bold tabular-nums w-12 text-right"
        style={{ color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.8 }}
      >
        {value > 0 ? <CountUp target={value} duration={1} suffix="%" /> : '—'}
      </motion.span>
    </motion.div>
  );
}

// ── Typewriter text ────────────────────────────────────────────────────────
function TypewriterText({ text, delay = 0, speed = 25 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="animate-pulse text-orange-400">|</span>
      )}
    </span>
  );
}

// ── Stat HUD item ──────────────────────────────────────────────────────────
function HudStat({ label, value, suffix = '', color = 'text-white', delay = 0, icon }: {
  label: string; value: number; suffix?: string; color?: string; delay?: number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 200 }}
    >
      <div className="text-white/30">{icon}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>
        <CountUp target={value} duration={1.5} suffix={suffix} />
      </div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-white/30">{label}</div>
    </motion.div>
  );
}

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

  const radarData = [
    { category: 'Price', value: profile.priceAccuracy, fullMark: 100 },
    { category: 'Technical', value: profile.technicalAccuracy, fullMark: 100 },
    { category: 'Regulatory', value: profile.regulatoryAccuracy, fullMark: 100 },
    { category: 'Partnership', value: profile.partnershipAccuracy, fullMark: 100 },
    { category: 'Technology', value: profile.technologyAccuracy, fullMark: 100 },
    { category: 'Market', value: profile.marketAccuracy, fullMark: 100 },
  ];

  const categories = [
    { name: 'Price', key: 'price', score: profile.priceAccuracy, color: '#f97316' },
    { name: 'Technical', key: 'technical', score: profile.technicalAccuracy, color: '#a855f7' },
    { name: 'Regulatory', key: 'regulatory', score: profile.regulatoryAccuracy, color: '#3b82f6' },
    { name: 'Partners', key: 'partnership', score: profile.partnershipAccuracy, color: '#06b6d4' },
    { name: 'Tech', key: 'technology', score: profile.technologyAccuracy, color: '#22c55e' },
    { name: 'Market', key: 'market', score: profile.marketAccuracy, color: '#ec4899' },
  ];

  const validCategories = categories.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
  const bestCategory = validCategories[0];
  const worstCategory = validCategories[validCategories.length - 1];

  const scoreable = profile.validity.verifiedCount + profile.validity.mixedCount + profile.validity.speculativeCount;
  const accuracyPct = scoreable > 0
    ? Math.round((profile.validity.verifiedCount / scoreable) * 1000) / 10
    : 0;

  // Verdict text
  const reliabilityText = getReliabilityLabel(profile.reliabilityLabel);
  const verdictSentence = validCategories.length >= 2 && bestCategory && worstCategory
    ? `${accuracyPct}% of verifiable claims checked out. Strongest on ${bestCategory.name.toLowerCase()} (${bestCategory.score}%), weakest on ${worstCategory.name.toLowerCase()} (${worstCategory.score}%).`
    : `${accuracyPct}% of their verifiable claims checked out.`;

  return (
    <div className="space-y-6 pb-10">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Creators
      </Link>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: CHARACTER CARD — The Hero Stats HUD
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="game-card p-6 sm:p-8 relative game-scan-line"
      >
        {/* Top label */}
        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Shield className="w-4 h-4 text-orange-400/60" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            CREATOR PROFILE
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          {/* Left: Avatar + Identity */}
          <motion.div
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Avatar with glow border */}
            <div className="relative flex-shrink-0">
              <motion.div
                className="w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-white/10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4, type: 'spring' }}
                style={{
                  boxShadow: `0 0 30px ${profile.reliabilityScore >= 70 ? 'rgba(34,197,94,0.2)' : profile.reliabilityScore >= 45 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}
              >
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-white/50 bg-white/10">
                    {creator.channelName[0]}
                  </div>
                )}
              </motion.div>
              {/* Tier badge overlay */}
              <motion.div
                className="absolute -bottom-1 -right-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
              >
                <TierBadge tier={creator.tier} size="sm" />
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {creator.channelName}
              </motion.h1>
              <motion.div
                className="flex items-center gap-2 mt-1.5 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span className="text-sm text-white/40">{creator.channelHandle}</span>
                <span className="text-white/20">|</span>
                <span className="text-sm text-white/40 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {(creator.subscriberCount / 1000).toFixed(0)}K
                </span>
                <span className="text-white/20">|</span>
                <a href={creator.channelUrl} target="_blank" rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </motion.div>

              {/* Stance / Sentiment tag */}
              {profile.currentStance && (
                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    profile.currentSentiment === 'bullish'
                      ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                      : profile.currentSentiment === 'bearish'
                        ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                        : 'bg-gray-400/10 text-gray-400 border border-gray-400/20'
                  }`}>
                    {profile.currentSentiment === 'bullish' ? '📈' : profile.currentSentiment === 'bearish' ? '📉' : '➡️'}{' '}
                    {profile.currentStance}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Center: Big Trust Score */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, type: 'spring', stiffness: 150 }}
          >
            <ReliabilityBadge
              score={profile.reliabilityScore}
              label={getReliabilityLabel(profile.reliabilityLabel)}
              size="lg"
            />
          </motion.div>

          {/* Right: Quick Stats HUD */}
          <div className="grid grid-cols-2 gap-4">
            <HudStat
              label="Accuracy"
              value={accuracyPct}
              suffix="%"
              color="text-emerald-400"
              delay={0.6}
              icon={<Crosshair className="w-4 h-4" />}
            />
            <HudStat
              label="Claims"
              value={profile.totalClaims}
              color="text-orange-400"
              delay={0.7}
              icon={<Zap className="w-4 h-4" />}
            />
            <HudStat
              label="Stories"
              value={profile.totalStoriesCovered}
              color="text-purple-400"
              delay={0.8}
              icon={<Activity className="w-4 h-4" />}
            />
            {profile.rankOverall && (
              <HudStat
                label="Rank"
                value={profile.rankOverall}
                suffix=""
                color="text-cyan-400"
                delay={0.9}
                icon={<Award className="w-4 h-4" />}
              />
            )}
          </div>
        </div>

        {/* Validity bar at bottom of card */}
        <motion.div
          className="mt-6 pt-6 border-t border-white/[0.06]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">CLAIM VALIDITY BREAKDOWN</span>
          </div>
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
        </motion.div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: TRUST VERDICT — Game Dialogue Box
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="game-card p-6 relative"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            TRUST ASSESSMENT
          </span>
        </div>

        <p className="text-xl sm:text-2xl font-semibold mb-3">
          <span className="text-white">{profile.channelName} is </span>
          <motion.span
            className={`${getVerdictColor(profile.reliabilityLabel)} inline-block`}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, type: 'spring' }}
          >
            {reliabilityText}
          </motion.span>
        </p>

        <p className="text-sm text-white/50 leading-relaxed font-mono">
          <TypewriterText text={verdictSentence} delay={1.5} speed={20} />
        </p>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: SKILL TREE — RPG Stat Bars
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="game-card p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-orange-400/60" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            SKILL BREAKDOWN
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Left: Stat bars */}
          <div className="space-y-4">
            {categories.map((cat, i) => (
              <StatBar
                key={cat.key}
                label={cat.name}
                value={cat.score}
                color={cat.color}
                delay={1.3 + i * 0.12}
                icon={
                  cat.key === 'price' ? <TrendingUp className="w-3.5 h-3.5" /> :
                  cat.key === 'timeline' ? <Activity className="w-3.5 h-3.5" /> :
                  cat.key === 'regulatory' ? <Shield className="w-3.5 h-3.5" /> :
                  cat.key === 'partnership' ? <Users className="w-3.5 h-3.5" /> :
                  cat.key === 'technology' ? <Zap className="w-3.5 h-3.5" /> :
                  <Target className="w-3.5 h-3.5" />
                }
              />
            ))}
          </div>

          {/* Right: Radar chart */}
          <motion.div
            className="game-card-section p-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.5 }}
          >
            <RadarChart data={radarData} size={260} />
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4: CLAIM LOG — Verification Evidence
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-orange-400/60" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              CLAIM LOG
            </span>
            <span className="text-xs text-white/20 ml-1">({allClaims.length} entries)</span>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 game-card-section p-1 rounded-lg">
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
              Timeline
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
              {STATUS_GROUPS.map((group, gi) => {
                const groupClaims = filteredClaims.filter(c => c.status === group.status);
                if (groupClaims.length === 0) return null;
                return (
                  <motion.div
                    key={group.status}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.08 }}
                  >
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border mb-3 ${group.headerColor} tracking-wider`}>
                      <span>{group.icon}</span>
                      {group.label}
                      <span className="text-xs opacity-60 font-mono">×{groupClaims.length}</span>
                    </div>
                    <div className="space-y-3">
                      {groupClaims.map((claim, i) => (
                        <motion.div
                          key={claim.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gi * 0.08 + i * 0.03 }}
                        >
                          <ClaimCard claim={claim} index={i} showCreator={false} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
              {filteredClaims.length === 0 && (
                <div className="game-card-section p-8 text-center text-white/30">
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
              {CATEGORY_GROUPS.map((group, gi) => {
                const groupClaims = filteredClaims.filter(c => c.category === group.key);
                if (groupClaims.length === 0) return null;
                return (
                  <motion.div
                    key={group.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.08 }}
                  >
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border mb-3 ${group.color} tracking-wider`}>
                      {group.label}
                      <span className="text-xs opacity-60 font-mono">×{groupClaims.length}</span>
                    </div>
                    <div className="space-y-3">
                      {groupClaims.map((claim, i) => (
                        <motion.div
                          key={claim.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gi * 0.08 + i * 0.03 }}
                        >
                          <ClaimCard claim={claim} index={i} showCreator={false} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
              {filteredClaims.length === 0 && (
                <div className="game-card-section p-8 text-center text-white/30">
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
                <div className="game-card-section p-8 text-center text-white/30">
                  No claims match your filters.
                </div>
              ) : (
                filteredClaims.map((claim, i) => (
                  <motion.div
                    key={claim.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <ClaimCard claim={claim} index={i} showCreator={false} />
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5: STORIES — Mission Log
          ═══════════════════════════════════════════════════════════════════════ */}
      {stories.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-orange-400/60" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              STORIES COVERED
            </span>
            <span className="text-xs text-white/20">({stories.length})</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stories.slice(0, 6).map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9 + i * 0.08 }}
              >
                <StoryCard story={story} index={i} />
              </motion.div>
            ))}
          </div>
          {stories.length > 6 && (
            <div className="mt-4 text-center">
              <Link href="/stories" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                View all {stories.length} stories
              </Link>
            </div>
          )}
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 6: VIDEOS — Archive (Collapsed)
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0 }}
      >
        <button
          onClick={() => setVideosExpanded(!videosExpanded)}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mb-4"
        >
          <Youtube className="w-4 h-4 text-orange-400/40" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
            VIDEO ARCHIVE
          </span>
          <span className="text-xs text-white/20">({videos.length})</span>
          <div className="flex-1 h-px bg-white/5 mx-2" />
          {videosExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
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
                    className="game-card-section p-4 hover:bg-white/[0.04] transition-all"
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
      </motion.section>
    </div>
  );
}
