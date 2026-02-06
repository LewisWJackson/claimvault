import { getAllCreators, getRecentClaims, getMarketPulse, getClaimsWithCreators } from '@/lib/db';
import Link from 'next/link';
import { Trophy, Zap, TrendingUp, BarChart3, Users, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import CreatorCard from '@/components/CreatorCard';
import ClaimCard from '@/components/ClaimCard';

export default function HomePage() {
  const creators = getAllCreators();
  const topCreators = creators.slice(0, 5);
  const pulse = getMarketPulse();
  const recentClaims = getClaimsWithCreators().slice(0, 6);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="text-center py-12 sm:py-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Tracking {pulse.totalCreators} XRP Creators &middot; {pulse.totalClaims} Claims Analyzed
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
          Who&apos;s Actually <span className="gradient-text">Right?</span>
        </h1>
        <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8">
          ClaimVault tracks every prediction crypto YouTubers make, verifies them against reality,
          and ranks creators by accuracy. No more guessing who to trust.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/creators"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-orange-500/20">
            <Trophy className="w-4 h-4" />
            View Leaderboard
          </Link>
          <Link href="/claims"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 font-medium text-sm hover:bg-white/[0.1] transition-all">
            <Zap className="w-4 h-4" />
            Browse Claims
          </Link>
        </div>
      </section>

      {/* Market Pulse Strip */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-orange-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Market Pulse</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="glass-card-sm p-3 text-center">
            <div className="text-xs text-white/40 mb-1">Creators</div>
            <div className="text-xl font-bold text-white">{pulse.totalCreators}</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-xs text-white/40 mb-1">Total Claims</div>
            <div className="text-xl font-bold text-white">{pulse.totalClaims}</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-xs text-emerald-400/60 mb-1">Verified True</div>
            <div className="text-xl font-bold text-emerald-400">{pulse.verifiedTrue}</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-xs text-red-400/60 mb-1">Verified False</div>
            <div className="text-xl font-bold text-red-400">{pulse.verifiedFalse}</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-xs text-blue-400/60 mb-1">Pending</div>
            <div className="text-xl font-bold text-blue-400">{pulse.pendingClaims}</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-xs text-emerald-400/60 mb-1">Bullish</div>
            <div className="text-xl font-bold text-emerald-400">{pulse.bullishPercent}%</div>
          </div>
          <div className="glass-card-sm p-3 text-center">
            <div className="text-xs text-red-400/60 mb-1">Bearish</div>
            <div className="text-xl font-bold text-red-400">{pulse.bearishPercent}%</div>
          </div>
        </div>
      </section>

      {/* Two Column: Leaderboard + Recent Claims */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Leaderboard Preview */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Top Creators</h2>
            </div>
            <Link href="/creators" className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {topCreators.map((creator, i) => (
              <CreatorCard key={creator.id} creator={creator} index={i} />
            ))}
          </div>
        </section>

        {/* Recent Claims */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Latest Claims</h2>
            </div>
            <Link href="/claims" className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {recentClaims.map((claim, i) => (
              <ClaimCard key={claim.id} claim={claim} index={i} showCreator={true} />
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <section className="glass-card p-8 text-center gradient-border">
        <Users className="w-8 h-8 text-orange-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Know an XRP Creator We Should Track?</h2>
        <p className="text-sm text-white/40 mb-5 max-w-md mx-auto">
          Submit a YouTube channel URL and our system will automatically start tracking their claims.
        </p>
        <Link href="/suggest"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all">
          Suggest a Creator
        </Link>
      </section>
    </div>
  );
}
