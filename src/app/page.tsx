import { getCreatorsWithProfiles, getMarketPulse, getClaimsWithCreators } from '@/lib/db';
import { Users, Zap, CheckCircle2, Target, RefreshCw, Flag, ExternalLink, Newspaper } from 'lucide-react';
import CreatorDirectory from '@/components/CreatorDirectory';
import ClaimCard from '@/components/ClaimCard';

export default function HomePage() {
  const creators = getCreatorsWithProfiles();
  const pulse = getMarketPulse();

  // Recently verified claims (show 5 most recent with verification dates)
  const recentVerified = getClaimsWithCreators()
    .filter(c => c.verificationDate && c.status !== 'pending' && c.status !== 'unverifiable')
    .slice(0, 5);

  const accuracyPct = pulse.totalClaims > 0
    ? Math.round(((pulse.verifiedTrue + pulse.partiallyTrue * 0.5) / (pulse.verifiedTrue + pulse.verifiedFalse + pulse.partiallyTrue + pulse.expired)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
          Which XRP YouTubers Can You <span className="gradient-text">Actually Trust</span>?
        </h1>
        <p className="text-base text-white/40 max-w-2xl mx-auto">
          We track {pulse.totalClaims} claims from {pulse.totalCreators} XRP-focused creators and verify them against reality. See who&apos;s right, who&apos;s wrong, and who&apos;s just guessing.
        </p>
      </section>

      {/* Stats bar */}
      <section className="glass-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Creators Tracked</div>
              <div className="text-xl font-semibold text-white">{pulse.totalCreators}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Claims Tracked</div>
              <div className="text-xl font-semibold text-white">{pulse.totalClaims}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Platform Accuracy</div>
              <div className="text-xl font-semibold text-emerald-400">{accuracyPct}%</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Verified True</div>
              <div className="text-xl font-semibold text-cyan-400">{pulse.verifiedTrue}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification improving banner */}
      <section className="glass-card-sm p-4 flex items-start sm:items-center gap-3 border-l-2 border-orange-400/40">
        <RefreshCw className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1">
          <p className="text-sm text-white/70">
            Our AI verification is <span className="text-orange-400 font-medium">continually improving</span>. See a claim that&apos;s wrong?
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            <Flag className="w-3 h-3 inline mr-1" />
            Hit <span className="text-white/60 font-medium">&ldquo;Challenge this claim&rdquo;</span> on any claim to help improve our accuracy. Every challenge makes the system smarter.
          </p>
        </div>
      </section>

      {/* Creator Directory (client component with filters) */}
      <CreatorDirectory creators={creators} />

      {/* Confirmd cross-promo */}
      <a
        href="https://confirmd-app-production.up.railway.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="block glass-card p-5 hover:bg-white/[0.04] transition-all group border-l-2 border-cyan-400/40"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Newspaper className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-white">Confirmd</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-medium border border-cyan-500/20">NEW</span>
            </div>
            <p className="text-xs text-white/50">
              Want verified crypto news instead of hype? Confirmd separates fact from speculation across the entire industry.
            </p>
          </div>
          <ExternalLink className="w-5 h-5 text-white/20 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
        </div>
      </a>

      {/* Recently Verified Claims - proof section */}
      {recentVerified.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Recently Verified
          </h2>
          <div className="space-y-3">
            {recentVerified.map((claim, i) => (
              <ClaimCard key={claim.id} claim={claim} index={i} showCreator={true} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
