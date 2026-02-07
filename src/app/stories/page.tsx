import { getAllStories } from '@/lib/db';
import type { Metadata } from 'next';
import type { StoryCategory } from '@/lib/types';
import { Newspaper } from 'lucide-react';
import StoriesListClient from './StoriesListClient';

export const metadata: Metadata = {
  title: 'All Stories — CreatorClaim',
  description: 'Browse all crypto news stories tracked by CreatorClaim, filtered by category and sorted by relevance.',
};

export default function StoriesPage() {
  let stories: any[] = [];

  try {
    stories = getAllStories();
  } catch {
    // db functions may not exist yet
  }

  const catSet = new Set<StoryCategory>();
  stories.forEach(s => catSet.add(s.category));
  const categories = Array.from(catSet);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Newspaper className="w-7 h-7 text-orange-400" />
          All Stories
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {stories.length} stories tracked across the crypto creator ecosystem
        </p>
      </div>

      {stories.length > 0 ? (
        <StoriesListClient stories={stories} categories={categories} />
      ) : (
        <div className="glass-card p-12 text-center">
          <Newspaper className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Stories Yet</h2>
          <p className="text-sm text-white/40">Stories will appear here once claims are clustered into narratives.</p>
        </div>
      )}
    </div>
  );
}
