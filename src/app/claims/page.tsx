'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Search, Filter } from 'lucide-react';
import ClaimCard from '@/components/ClaimCard';
import { getClaimsWithCreators } from '@/lib/db';
import { getStatusLabel } from '@/lib/types';

type StatusFilter = 'all' | 'pending' | 'verified_true' | 'verified_false' | 'partially_true';
type CategoryFilter = 'all' | 'price' | 'timeline' | 'regulatory' | 'partnership' | 'technology' | 'market';

export default function ClaimsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');

  const allClaims = getClaimsWithCreators({
    status: statusFilter === 'all' ? undefined : statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  const filtered = search
    ? allClaims.filter(c =>
        c.claimText.toLowerCase().includes(search.toLowerCase()) ||
        c.creator.channelName.toLowerCase().includes(search.toLowerCase())
      )
    : allClaims;

  const statusCounts = {
    all: getClaimsWithCreators().length,
    pending: getClaimsWithCreators({ status: 'pending' }).length,
    verified_true: getClaimsWithCreators({ status: 'verified_true' }).length,
    verified_false: getClaimsWithCreators({ status: 'verified_false' }).length,
    partially_true: getClaimsWithCreators({ status: 'partially_true' }).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Zap className="w-7 h-7 text-purple-400" />
          Claim Feed
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Every prediction tracked, every outcome verified
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search claims or creators..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(statusCounts) as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === s
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}>
            {s === 'all' ? 'All' : getStatusLabel(s)}
            <span className="text-[10px] opacity-60">({statusCounts[s]})</span>
          </button>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'price', 'timeline', 'regulatory', 'partnership', 'technology', 'market'] as const).map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              categoryFilter === c
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/[0.03] text-white/30 border border-white/[0.05] hover:bg-white/[0.06]'
            }`}>
            {c === 'all' ? 'All Categories' : c}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-xs text-white/30">
        Showing {filtered.length} claim{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Claims Grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2 glass-card-sm p-12 text-center text-white/30">
            No claims match your filters.
          </div>
        ) : (
          filtered.map((claim, i) => (
            <ClaimCard key={claim.id} claim={claim} index={i} showCreator={true} />
          ))
        )}
      </div>
    </div>
  );
}
