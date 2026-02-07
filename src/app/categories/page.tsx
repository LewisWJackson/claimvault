import { getAllStories } from '@/lib/db';
import type { Metadata } from 'next';
import type { Story, StoryCategory, ValidityBreakdown } from '@/lib/types';
import { getCategoryColor, getCategoryLabel } from '@/lib/types';
import { LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import ValidityBar from '@/components/ValidityBar';

export const metadata: Metadata = {
  title: 'Categories — CreatorClaim',
  description: 'Browse crypto news stories by category. See validity breakdowns for each topic area.',
};

const CATEGORY_ICONS: Record<string, string> = {
  regulatory: String.fromCodePoint(0x2696),
  price_prediction: String.fromCodePoint(0x1F4B0),
  technology: String.fromCodePoint(0x2699),
  partnership: String.fromCodePoint(0x1F91D),
  market_analysis: String.fromCodePoint(0x1F4CA),
  etf: String.fromCodePoint(0x1F4C8),
  stablecoin: String.fromCodePoint(0x1FA99),
  legal: String.fromCodePoint(0x1F3DB),
  adoption: String.fromCodePoint(0x1F310),
};

interface CategoryData {
  category: StoryCategory;
  storyCount: number;
  validity: ValidityBreakdown;
}

export default function CategoriesPage() {
  let stories: Story[] = [];

  try {
    stories = getAllStories();
  } catch {
    // db functions may not exist yet
  }

  // Aggregate by category
  const categoryMap = new Map<StoryCategory, Story[]>();
  stories.forEach(story => {
    const existing = categoryMap.get(story.category) || [];
    existing.push(story);
    categoryMap.set(story.category, existing);
  });

  const categoryData: CategoryData[] = Array.from(categoryMap.entries()).map(([category, catStories]) => {
    const totalClaims = catStories.reduce((sum, s) => sum + s.claimCount, 0);
    const totalVerified = catStories.reduce((sum, s) => sum + s.validity.verifiedCount, 0);
    const totalMixed = catStories.reduce((sum, s) => sum + s.validity.mixedCount, 0);
    const totalSpeculative = catStories.reduce((sum, s) => sum + s.validity.speculativeCount, 0);
    const total = totalVerified + totalMixed + totalSpeculative;

    return {
      category,
      storyCount: catStories.length,
      validity: {
        verified: total > 0 ? Math.round((totalVerified / total) * 100) : 0,
        mixed: total > 0 ? Math.round((totalMixed / total) * 100) : 0,
        speculative: total > 0 ? Math.round((totalSpeculative / total) * 100) : 0,
        verifiedCount: totalVerified,
        mixedCount: totalMixed,
        speculativeCount: totalSpeculative,
      },
    };
  }).sort((a, b) => b.storyCount - a.storyCount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <LayoutGrid className="w-7 h-7 text-purple-400" />
          Categories
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Browse stories by topic. See how validity breaks down across different areas of crypto news.
        </p>
      </div>

      {categoryData.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <LayoutGrid className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Categories Yet</h2>
          <p className="text-sm text-white/40">Categories will populate once stories are generated from claims.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryData.map((data) => {
            const colorClasses = getCategoryColor(data.category);
            const icon = CATEGORY_ICONS[data.category] || String.fromCodePoint(0x1F4CB);

            return (
              <Link
                key={data.category}
                href={`/stories?category=${data.category}`}
                className="glass-card-sm p-5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-white/90">
                      {getCategoryLabel(data.category)}
                    </h3>
                    <span className="text-xs text-white/40">
                      {data.storyCount} stor{data.storyCount === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <ValidityBar
                    verified={data.validity.verified}
                    mixed={data.validity.mixed}
                    speculative={data.validity.speculative}
                    verifiedCount={data.validity.verifiedCount}
                    mixedCount={data.validity.mixedCount}
                    speculativeCount={data.validity.speculativeCount}
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>{data.validity.verifiedCount + data.validity.mixedCount + data.validity.speculativeCount} total claims</span>
                  <span className={`px-2 py-0.5 rounded-full border ${colorClasses}`}>
                    {getCategoryLabel(data.category)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
