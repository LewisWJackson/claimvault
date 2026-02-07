'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StoryCard from '@/components/StoryCard';
import CategoryFilter from '@/components/CategoryFilter';
import { getCategoryLabel } from '@/lib/types';
import type { Story, StoryCategory } from '@/lib/types';

interface StoryFeedProps {
  stories: Story[];
  categories: StoryCategory[];
}

export default function StoryFeed({ stories, categories }: StoryFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = selectedCategory === null
    ? stories
    : stories.filter(s => s.category === selectedCategory);

  const categoryItems = categories.map(cat => ({
    value: cat,
    label: getCategoryLabel(cat),
    count: stories.filter(s => s.category === cat).length,
  }));

  return (
    <div>
      <CategoryFilter
        categories={categoryItems}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((story, i) => (
            <StoryCard key={story.id} story={story} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-white/30 text-sm">No stories in this category yet.</p>
        </motion.div>
      )}
    </div>
  );
}
