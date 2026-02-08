import { getAllCreators, getCreatorProfile } from '@/lib/db';
import { getReliabilityLabel } from '@/lib/types';
import Link from 'next/link';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight, Target, Zap, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import ValidityBar from '@/components/ValidityBar';

export const metadata = {
  title: 'Leaderboard — CreatorClaim',
  description: 'See which crypto YouTubers are most accurate. Ranked by verified claim accuracy.',
};

function RankChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-emerald-400">
        <TrendingUp className="w-3 h-3" />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-red-400">
        <TrendingDown className="w-3 h-3" />
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-white/20">
      <Minus className="w-3 h-3" />
    </span>
  );
}

function getRankStyle(rank: number) {
  if (rank === 1) return 'from-yellow-400/20 to-yellow-600/5 border-yellow-400/30';
  if (rank === 2) return 'from-gray-300/15 to-gray-400/5 border-gray-300/25';
  if (rank === 3) return 'from-orange-400/15 to-orange-500/5 border-orange-400/25';
  return 'from-white/[0.03] to-transparent border-white/[0.06]';
}

function getRankBadge(rank: number) {
  if (rank === 1) return { text: '1st', color: 'text-yellow-400', bg: 'bg-yellow-400/15', border: 'border-yellow-400/30' };
  if (rank === 2) return { text: '2nd', color: 'text-gray-300', bg: 'bg-gray-300/15', border: 'border-gray-300/30' };
  if (rank === 3) return { text: '3rd', color: 'text-orange-400', bg: 'bg-orange-400/15', border: 'border-orange-400/30' };
  return { text: `${rank}th`, color: 'text-white/50', bg: 'bg-white/[0.04]', border: 'border-white/[0.06]' };
}

export default function LeaderboardPage() {
  const creators = getAllCreators();

  const ranked = creators
    .map(c => {
      const profile = getCreatorProfile(c.id);
      return { ...c, profile };
    })
    .filter(c => c.profile && c.totalClaims >= 5)
    .sort((a, b) => (a.rankOverall ?? 99) - (b.rankOverall ?? 99));

  const totalClaims = ranked.reduce((sum, c) => sum + c.totalClaims, 0);
  const avgAccuracy = ranked.length > 0
    ? Math.round(ranked.reduce((sum, c) => sum + c.overallAccuracy, 0) / ranked.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Creator <span className="gradient-text">Leaderboard</span>
          </h1>
        </div>
        <p className="text-base text-white/40 max-w-xl mx-auto">
          XRP crypto YouTubers ranked by claim accuracy. Who gets it right, and who&apos;s just guessing?
        </p>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-white">{ranked.length}</div>
          <div className="text-xs text-white/40 mt-0.5">Ranked Creators</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalClaims}</div>
          <div className="text-xs text-white/40 mt-0.5">Claims Tracked</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <div className="text-2xl font-bold text-white">{avgAccuracy}%</div>
          <div className="text-xs text-white/40 mt-0.5">Avg Accuracy</div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="space-y-3">
        {ranked.map((creator, i) => {
          const rank = creator.rankOverall ?? i + 1;
          const rankBadge = getRankBadge(rank);
          const profile = creator.profile!;
          const scoreable = profile.validity.verifiedCount + profile.validity.mixedCount + profile.validity.speculativeCount;

          return (
            <Link
              key={creator.id}
              href={`/creators/${creator.id}`}
              className={`block rounded-xl bg-gradient-to-r ${getRankStyle(rank)} border p-4 sm:p-5 hover:bg-white/[0.04] transition-all group`}
            >
              <div className="flex items-center gap-4">
                {/* Rank badge */}
                <div className={`w-12 h-12 rounded-xl ${rankBadge.bg} border ${rankBadge.border} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-lg font-bold ${rankBadge.color}`}>{rank}</span>
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50 text-sm font-medium">
                        {creator.channelName[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold truncate">{creator.channelName}</span>
                      <TierBadge tier={creator.tier} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/30">{creator.subscriberCount?.toLocaleString()} subs</span>
                      <RankChange change={creator.rankChange} />
                    </div>
                  </div>
                </div>

                {/* Stats columns */}
                <div className="hidden sm:flex items-center gap-6">
                  {/* Accuracy */}
                  <div className="text-center w-20">
                    <div className={`text-lg font-bold ${
                      creator.overallAccuracy >= 75 ? 'text-emerald-400' :
                      creator.overallAccuracy >= 60 ? 'text-yellow-400' :
                      creator.overallAccuracy >= 45 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {creator.overallAccuracy}%
                    </div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">Accuracy</div>
                  </div>

                  {/* Claim counts */}
                  <div className="flex items-center gap-3 w-36">
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white/60">{profile.validity.verifiedCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-white/60">{profile.validity.mixedCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-white/60">{profile.validity.speculativeCount}</span>
                    </div>
                  </div>

                  {/* Validity bar */}
                  <div className="w-32">
                    <ValidityBar
                      verified={profile.validity.verified}
                      mixed={profile.validity.mixed}
                      speculative={profile.validity.speculative}
                      verifiedCount={profile.validity.verifiedCount}
                      mixedCount={profile.validity.mixedCount}
                      speculativeCount={profile.validity.speculativeCount}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
              </div>

              {/* Mobile: stats row */}
              <div className="sm:hidden mt-3 flex items-center gap-4">
                <div className={`text-sm font-bold ${
                  creator.overallAccuracy >= 75 ? 'text-emerald-400' :
                  creator.overallAccuracy >= 60 ? 'text-yellow-400' :
                  creator.overallAccuracy >= 45 ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {creator.overallAccuracy}% accuracy
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>{creator.totalClaims} claims</span>
                </div>
                <div className="flex-1">
                  <ValidityBar
                    verified={profile.validity.verified}
                    mixed={profile.validity.mixed}
                    speculative={profile.validity.speculative}
                    verifiedCount={profile.validity.verifiedCount}
                    mixedCount={profile.validity.mixedCount}
                    speculativeCount={profile.validity.speculativeCount}
                    size="sm"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center py-6">
        <p className="text-xs text-white/30">
          Rankings based on verified claim accuracy. Minimum 5 scored claims to qualify.
          <br />
          Accuracy = (verified true + 0.5 &times; partially true) &divide; total scored claims
        </p>
      </div>
    </div>
  );
}
