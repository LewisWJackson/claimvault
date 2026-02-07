'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import CreatorTrustCard from '@/components/CreatorTrustCard';

interface CreatorDirectoryProps {
  creators: any[];
}

const tiers = [
  { value: null, label: 'All' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
] as const;

const sortOptions = [
  { value: 'reliability' as const, label: 'Reliability' },
  { value: 'accuracy' as const, label: 'Accuracy' },
  { value: 'claims' as const, label: 'Claims' },
  { value: 'subscribers' as const, label: 'Subscribers' },
];

export default function CreatorDirectory({ creators }: CreatorDirectoryProps) {
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'reliability' | 'accuracy' | 'claims' | 'subscribers'>('reliability');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = [...creators];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.channelName.toLowerCase().includes(q));
    }

    // Tier filter
    if (tierFilter) {
      result = result.filter(c => c.tier === tierFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'reliability':
          return (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0);
        case 'accuracy':
          return (b.overallAccuracy ?? 0) - (a.overallAccuracy ?? 0);
        case 'claims':
          return (b.totalClaims ?? 0) - (a.totalClaims ?? 0);
        case 'subscribers':
          return (b.subscriberCount ?? 0) - (a.subscriberCount ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [creators, search, tierFilter, sortBy]);

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Creator Directory</h2>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Tier filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tiers.map(t => (
            <button
              key={t.label}
              onClick={() => setTierFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tierFilter === t.value
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-xs text-white/30 mr-1">Sort:</span>
        {sortOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              sortBy === opt.value
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((creator, i) => (
            <CreatorTrustCard key={creator.id} creator={creator} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">
          No creators match your filters.
        </div>
      )}
    </section>
  );
}
