import { getCreatorsWithProfiles, getMarketPulse, getClaimsWithCreators } from '@/lib/db';
import { Users, Zap, CheckCircle2, Target } from 'lucide-react';
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
          Which Crypto YouTubers Can You <span className="gradient-text">Actually Trust</span>?
        </h1>
        <p className="text-base text-white/40 max-w-2xl mx-auto">
          We track {pulse.totalClaims} claims from {pulse.totalCreators} creators and verify them against reality. See who&apos;s right, who&apos;s wrong, and who&apos;s just guessing.
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

      {/* Creator Directory (client component with filters) */}
      <CreatorDirectory creators={creators} />

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
