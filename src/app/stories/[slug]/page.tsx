import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare } from 'lucide-react';
import { getStoryBySlug, getAllStories } from '@/lib/db';
import { getCategoryColor, getCategoryLabel, getValidityColor, getValidityLabel, VALIDITY_COLORS } from '@/lib/types';
import type { ValidityLean, StoryCreator } from '@/lib/types';
import ValidityBar from '@/components/ValidityBar';
import CreatorMiniCard from '@/components/CreatorMiniCard';
import ClaimCard from '@/components/ClaimCard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let story: any = null;
  try {
    story = getStoryBySlug(slug);
  } catch {}

  if (!story) {
    return { title: 'Story Not Found — ClaimVault' };
  }

  return {
    title: `${story.headline} — ClaimVault`,
    description: story.summary,
  };
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let story: any = null;

  try {
    story = getStoryBySlug(slug);
  } catch {}

  if (!story) {
    notFound();
  }

  const categoryColor = getCategoryColor(story.category);

  // Group creators by lean
  const creatorsByLean: Record<ValidityLean, StoryCreator[]> = {
    verified: [],
    mixed: [],
    speculative: [],
  };

  (story.storyCreators || []).forEach((sc: StoryCreator) => {
    creatorsByLean[sc.lean]?.push(sc);
  });

  const leanSections: { lean: ValidityLean; label: string; emoji: string }[] = [
    { lean: 'verified', label: 'Verified Lean', emoji: String.fromCodePoint(0x1F4D7) },
    { lean: 'mixed', label: 'Mixed Lean', emoji: String.fromCodePoint(0x1F4D9) },
    { lean: 'speculative', label: 'Speculative Lean', emoji: String.fromCodePoint(0x1F4D5) },
  ];

  const totalCreators = story.storyCreators?.length ?? story.creatorCount ?? 0;
  const claims = story.claims || [];

  // Group claims by status for display
  const claimGroups = [
    { status: 'verified_true', label: 'Verified True', claims: claims.filter((c: any) => c.status === 'verified_true') },
    { status: 'partially_true', label: 'Partially True', claims: claims.filter((c: any) => c.status === 'partially_true') },
    { status: 'verified_false', label: 'Verified False', claims: claims.filter((c: any) => c.status === 'verified_false') },
    { status: 'pending', label: 'Pending', claims: claims.filter((c: any) => c.status === 'pending') },
    { status: 'expired', label: 'Expired', claims: claims.filter((c: any) => c.status === 'expired') },
    { status: 'unverifiable', label: 'Unverifiable', claims: claims.filter((c: any) => c.status === 'unverifiable') },
  ].filter(g => g.claims.length > 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/stories" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Stories
      </Link>

      {/* Header */}
      <section>
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border mb-4 ${categoryColor}`}>
          {getCategoryLabel(story.category)}
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
          {story.headline}
        </h1>
        <p className="text-base text-white/50 leading-relaxed">
          {story.summary}
        </p>
      </section>

      {/* Validity breakdown */}
      <section className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Validity Breakdown</h2>
        <ValidityBar
          verified={story.validity.verified}
          mixed={story.validity.mixed}
          speculative={story.validity.speculative}
          verifiedCount={story.validity.verifiedCount}
          mixedCount={story.validity.mixedCount}
          speculativeCount={story.validity.speculativeCount}
          size="lg"
        />
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{story.validity.verified}%</div>
            <div className="text-xs text-white/40">Verified</div>
            <div className="text-xs text-white/30">({story.validity.verifiedCount} claims)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{story.validity.mixed}%</div>
            <div className="text-xs text-white/40">Mixed</div>
            <div className="text-xs text-white/30">({story.validity.mixedCount} claims)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{story.validity.speculative}%</div>
            <div className="text-xs text-white/40">Speculative</div>
            <div className="text-xs text-white/30">({story.validity.speculativeCount} claims)</div>
          </div>
        </div>
      </section>

      {/* Creator coverage */}
      <section className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-white/50" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Creator Coverage ({totalCreators} creator{totalCreators !== 1 ? 's' : ''})
          </h2>
        </div>

        <div className="space-y-6">
          {leanSections.map(({ lean, label, emoji }) => {
            const creators = creatorsByLean[lean];
            if (creators.length === 0) return null;
            const leanColor = getValidityColor(lean);

            return (
              <div key={lean}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${leanColor.split(' ')[0]}`}>
                  {emoji} {label} ({creators.length})
                </h3>
                <div className="space-y-2">
                  {creators.map((sc) => (
                    <CreatorMiniCard
                      key={sc.creatorId}
                      creator={sc.creator}
                      lean={sc.lean}
                      claimCount={sc.claimCount}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* All claims */}
      {claims.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-white/50" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              All Claims ({claims.length})
            </h2>
          </div>

          <div className="space-y-6">
            {claimGroups.map((group) => (
              <div key={group.status}>
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                  {group.label} ({group.claims.length})
                </h3>
                <div className="space-y-3">
                  {group.claims.map((claim: any, i: number) => (
                    <ClaimCard key={claim.id} claim={claim} index={i} showCreator={true} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
