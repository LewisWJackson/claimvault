import clsx from 'clsx';

interface TierBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig: Record<string, { label: string; emoji: string; classes: string }> = {
  diamond: { label: 'Diamond', emoji: '💎', classes: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20' },
  gold: { label: 'Gold', emoji: '🥇', classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  silver: { label: 'Silver', emoji: '🥈', classes: 'bg-gray-300/10 text-gray-300 border-gray-300/20' },
  bronze: { label: 'Bronze', emoji: '🥉', classes: 'bg-orange-400/10 text-orange-400 border-orange-400/20' },
  unranked: { label: 'Unranked', emoji: '—', classes: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export default function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const config = tierConfig[tier] || tierConfig.unranked;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full font-medium border',
      config.classes,
      sizeClasses[size]
    )}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
