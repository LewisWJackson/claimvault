'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import StoryCard from '@/components/StoryCard';
import CategoryFilter from '@/components/CategoryFilter';
import { getCategoryLabel } from '@/lib/types';
import type { Story, StoryCategory } from '@/lib/types';

type SortKey = 'trending' | 'newest' | 'creators' | 'claims';

interface Props {
  stories: Story[];
  categories: StoryCategory[];
}

export default function StoriesListClient({ stories, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('trending');

  const categoryItems = categories.map(cat => ({
    value: cat,
    label: getCategoryLabel(cat),
    count: stories.filter(s => s.category === cat).length,
  }));

  const filtered = useMemo(() => {
    let list = selectedCategory === null
      ? stories
      : stories.filter(s => s.category === selectedCategory);

    switch (sortBy) {
      case 'trending':
        list = [...list].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
        break;
      case 'newest':
        list = [...list].sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
        break;
      case 'creators':
        list = [...list].sort((a, b) => b.creatorCount - a.creatorCount);
        break;
      case 'claims':
        list = [...list].sort((a, b) => b.claimCount - a.claimCount);
        break;
    }
    return list;
  }, [stories, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CategoryFilter
          categories={categoryItems}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          <ArrowUpDown className="w-4 h-4 text-white/30" />
          {(['trending', 'newest', 'creators', 'claims'] as const).map(key => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === key
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
              }`}>
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((story, i) => (
            <StoryCard key={story.id} story={story} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No stories match your filters.</p>
        </div>
      )}
    </div>
  );
}
