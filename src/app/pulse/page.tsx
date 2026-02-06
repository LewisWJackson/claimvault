import { getMarketPulse, getAllCreators, getClaimsWithCreators } from '@/lib/db';
import { Activity, TrendingUp, TrendingDown, MinusCircle, CheckCircle2, XCircle, AlertCircle, Users } from 'lucide-react';
import ClaimCard from '@/components/ClaimCard';
import Link from 'next/link';

export default function PulsePage() {
  const pulse = getMarketPulse();
  const creators = getAllCreators();
  const recentVerified = getClaimsWithCreators()
    .filter(c => c.verificationDate)
    .sort((a, b) => new Date(b.verificationDate!).getTime() - new Date(a.verificationDate!).getTime())
    .slice(0, 8);

  const bullishCreators = creators.filter(c => c.currentSentiment === 'bullish');
  const bearishCreators = creators.filter(c => c.currentSentiment === 'bearish');
  const neutralCreators = creators.filter(c => c.currentSentiment === 'neutral');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Activity className="w-7 h-7 text-cyan-400" />
          Market Pulse
        </h1>
        <p className="text-sm text-white/40 mt-1">
          What the XRP creator community is saying right now
        </p>
      </div>

      {/* Sentiment Overview */}
      <section className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Community Sentiment</h2>

        {/* Sentiment bar */}
        <div className="h-6 rounded-full overflow-hidden flex mb-4">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center"
            style={{ width: `${pulse.bullishPercent}%` }}
          >
            <span className="text-xs font-bold text-white">{pulse.bullishPercent}%</span>
          </div>
          {pulse.neutralPercent > 0 && (
            <div
              className="bg-gradient-to-r from-gray-500 to-gray-400 flex items-center justify-center"
              style={{ width: `${pulse.neutralPercent}%` }}
            >
              <span className="text-xs font-bold text-white">{pulse.neutralPercent}%</span>
            </div>
          )}
          <div
            className="bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center"
            style={{ width: `${pulse.bearishPercent}%` }}
          >
            <span className="text-xs font-bold text-white">{pulse.bearishPercent}%</span>
          </div>
        </div>

        {/* Sentiment breakdown */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass-card-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-emerald-400">Bullish ({bullishCreators.length})</h3>
            </div>
            <div className="space-y-2">
              {bullishCreators.map(c => (
                <Link key={c.id} href={`/creators/${c.id}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                  <img src={c.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  <span className="truncate">{c.channelName}</span>
                  <span className="text-xs text-white/30 ml-auto">{c.overallAccuracy}%</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <MinusCircle className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-400">Neutral ({neutralCreators.length})</h3>
            </div>
            <div className="space-y-2">
              {neutralCreators.length === 0 ? (
                <p className="text-xs text-white/20">No neutral creators right now</p>
              ) : (
                neutralCreators.map(c => (
                  <Link key={c.id} href={`/creators/${c.id}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                    <img src={c.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                    <span className="truncate">{c.channelName}</span>
                    <span className="text-xs text-white/30 ml-auto">{c.overallAccuracy}%</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="glass-card-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-red-400">Bearish ({bearishCreators.length})</h3>
            </div>
            <div className="space-y-2">
              {bearishCreators.map(c => (
                <Link key={c.id} href={`/creators/${c.id}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                  <img src={c.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  <span className="truncate">{c.channelName}</span>
                  <span className="text-xs text-white/30 ml-auto">{c.overallAccuracy}%</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card-sm p-4 text-center">
          <Users className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{pulse.totalCreators}</div>
          <div className="text-xs text-white/40">Creators Tracked</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <Activity className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{pulse.totalClaims}</div>
          <div className="text-xs text-white/40">Total Claims</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-emerald-400">{pulse.verifiedTrue}</div>
          <div className="text-xs text-white/40">Verified True</div>
        </div>
        <div className="glass-card-sm p-4 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-400">{pulse.verifiedFalse}</div>
          <div className="text-xs text-white/40">Verified False</div>
        </div>
      </section>

      {/* Recently Verified */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Recently Verified Claims</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {recentVerified.map((claim, i) => (
            <ClaimCard key={claim.id} claim={claim} index={i} showCreator={true} />
          ))}
        </div>
      </section>

      {/* Current Stances */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Current Creator Stances</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {creators.map((creator, i) => (
            <Link key={creator.id} href={`/creators/${creator.id}`}
              className="glass-card-sm p-4 hover:bg-white/[0.04] transition-all block">
              <div className="flex items-center gap-3 mb-2">
                <img src={creator.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                <div>
                  <h3 className="text-sm font-semibold text-white">{creator.channelName}</h3>
                  <span className={`text-xs ${
                    creator.currentSentiment === 'bullish' ? 'text-emerald-400' :
                    creator.currentSentiment === 'bearish' ? 'text-red-400' : 'text-gray-400'
                  }`}>{creator.currentSentiment} &middot; {creator.overallAccuracy}% accurate</span>
                </div>
              </div>
              <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{creator.currentStance}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
