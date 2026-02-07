'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { getCategoryColor, getCategoryLabel, type Story } from '@/lib/types';
import ValidityBar from './ValidityBar';

interface StoryCardProps {
  story: Story;
  index?: number;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function StoryCard({ story, index = 0 }: StoryCardProps) {
  const categoryColor = getCategoryColor(story.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Link
        href={`/stories/${story.slug}`}
        className="block glass-card-sm p-5 hover:bg-white/[0.04] transition-all hover:shadow-lg hover:shadow-white/[0.02]"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-white leading-snug line-clamp-2 group-hover:text-white/90">
            {story.headline}
          </h3>
          <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${categoryColor}`}>
            {getCategoryLabel(story.category)}
          </span>
        </div>

        <p className="text-sm text-white/40 leading-relaxed line-clamp-2 mb-4">
          {story.summary}
        </p>

        <div className="mb-4">
          <ValidityBar
            verified={story.validity.verified}
            mixed={story.validity.mixed}
            speculative={story.validity.speculative}
            verifiedCount={story.validity.verifiedCount}
            mixedCount={story.validity.mixedCount}
            speculativeCount={story.validity.speculativeCount}
            size="md"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {story.creatorCount} creator{story.creatorCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {story.claimCount} claim{story.claimCount !== 1 ? 's' : ''}
          </span>
          <span className="ml-auto">{timeAgo(story.lastUpdatedAt)}</span>

          {story.isEchoChamber && (
            <span className="flex items-center gap-1 text-amber-400/70 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              <AlertTriangle className="w-3 h-3" />
              Echo Chamber
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
