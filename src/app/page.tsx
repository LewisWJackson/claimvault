import { getAllStories, getStoryCount, getMarketPulse, getAllCreators } from '@/lib/db';
import { Newspaper, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import StoryFeed from '@/components/StoryFeed';
import type { StoryCategory } from '@/lib/types';

export default function HomePage() {
  let stories: any[] = [];
  let storyCount = 0;
  let categories: StoryCategory[] = [];

  try {
    stories = getAllStories();
    storyCount = getStoryCount?.() ?? stories.length;
    const catSet = new Set<StoryCategory>();
    stories.forEach(s => catSet.add(s.category));
    categories = Array.from(catSet);
  } catch {
    // db functions may not exist yet
  }

  const pulse = getMarketPulse();
  const creatorCount = pulse.totalCreators;
  const totalClaims = pulse.totalClaims;

  // Calculate overall verified %
  const verifiedPct = totalClaims > 0
    ? Math.round((pulse.verifiedTrue / totalClaims) * 100)
    : 0;

  // Sort by trending score descending
  const sortedStories = [...stories].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
          Crypto News Through the Lens of <span className="gradient-text">Truth</span>
        </h1>
        <p className="text-base text-white/40 max-w-2xl mx-auto">
          See what&apos;s verified vs speculative across creators. Every story, every claim, every prediction — tracked and scored.
        </p>
      </section>

      {/* Stats bar */}
      <section className="glass-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Stories</div>
              <div className="text-xl font-semibold text-white">{storyCount || sortedStories.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Creators Tracked</div>
              <div className="text-xl font-semibold text-white">{creatorCount}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Verified</div>
              <div className="text-xl font-semibold text-emerald-400">{verifiedPct}%</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-white/40">Total Claims</div>
              <div className="text-xl font-semibold text-white">{totalClaims}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Story feed with client-side category filter */}
      {sortedStories.length > 0 ? (
        <StoryFeed stories={sortedStories} categories={categories} />
      ) : (
        <section className="glass-card p-12 text-center">
          <Newspaper className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Stories Coming Soon</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            We&apos;re analyzing {totalClaims} claims from {creatorCount} creators to cluster them into stories.
            Check back shortly.
          </p>
        </section>
      )}
    </div>
  );
}
