'use client';

import Link from 'next/link';
import { type ValidityLean } from '@/lib/types';
import CreatorLeanBadge from './CreatorLeanBadge';

interface CreatorMiniCardProps {
  creator: {
    id: string;
    channelName: string;
    avatarUrl: string | null;
    reliabilityScore: number;
    tier: string;
  };
  lean: ValidityLean;
  claimCount: number;
}

export default function CreatorMiniCard({ creator, lean, claimCount }: CreatorMiniCardProps) {
  return (
    <Link
      href={`/creators/${creator.id}`}
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
        {creator.avatarUrl ? (
          <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-medium">
            {creator.channelName[0]}
          </div>
        )}
      </div>

      <span className="text-sm font-medium text-white truncate">{creator.channelName}</span>

      <CreatorLeanBadge lean={lean} />

      <span className="text-xs text-white/30 ml-auto flex-shrink-0">
        {claimCount} claim{claimCount !== 1 ? 's' : ''}
      </span>
    </Link>
  );
}
