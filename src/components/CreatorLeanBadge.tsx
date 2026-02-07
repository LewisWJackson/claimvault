'use client';

import { getValidityColor, getValidityLabel, type ValidityLean } from '@/lib/types';

interface CreatorLeanBadgeProps {
  lean: ValidityLean;
}

export default function CreatorLeanBadge({ lean }: CreatorLeanBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getValidityColor(lean)}`}
    >
      {getValidityLabel(lean)}
    </span>
  );
}
