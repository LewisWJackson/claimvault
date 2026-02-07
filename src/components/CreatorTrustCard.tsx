'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ValidityBar from '@/components/ValidityBar';
import ReliabilityBadge from '@/components/ReliabilityBadge';
import TierBadge from '@/components/TierBadge';

interface CreatorTrustCardProps {
  creator: any;
  index?: number;
}

export default function CreatorTrustCard({ creator, index = 0 }: CreatorTrustCardProps) {
  const formattedSubs = creator.subscriberCount >= 1_000_000
    ? `${(creator.subscriberCount / 1_000_000).toFixed(1)}M`
    : creator.subscriberCount >= 1_000
      ? `${Math.round(creator.subscriberCount / 1_000)}K`
      : `${creator.subscriberCount}`;

  return (
    <Link href={`/creators/${creator.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
        className="glass-card-sm p-5 hover:bg-white/[0.04] transition-all cursor-pointer h-full"
      >
        {/* Header: avatar, name, tier */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 text-lg font-medium">
                {creator.channelName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white truncate">{creator.channelName}</h3>
              <TierBadge tier={creator.tier} size="sm" />
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              {creator.channelHandle && <span>{creator.channelHandle}</span>}
              {creator.channelHandle && creator.subscriberCount > 0 && <span> &middot; </span>}
              {creator.subscriberCount > 0 && <span>{formattedSubs} subs</span>}
            </p>
          </div>
        </div>

        {/* Reliability + Accuracy */}
        <div className="flex items-center gap-4 mb-4">
          <ReliabilityBadge
            score={creator.reliabilityScore ?? 0}
            label={creator.reliabilityLabel ?? 'unknown'}
            size="md"
          />
          <div className="flex-1">
            <div className="text-xs text-white/40 mb-1">Overall Accuracy</div>
            <div className="text-2xl font-bold text-white">{creator.overallAccuracy ?? 0}%</div>
          </div>
        </div>

        {/* Validity bar */}
        {creator.validity && (
          <div className="mb-3">
            <ValidityBar
              verified={creator.validity.verified}
              mixed={creator.validity.mixed}
              speculative={creator.validity.speculative}
              size="sm"
            />
          </div>
        )}

        {/* Claim counts */}
        <div className="flex items-center gap-3 text-xs text-white/50 mb-2">
          <span className="text-emerald-400">Verified: {creator.verifiedTrue ?? 0}</span>
          <span className="text-red-400">False: {creator.verifiedFalse ?? 0}</span>
          <span className="text-amber-400">Partial: {creator.partiallyTrue ?? 0}</span>
        </div>
        <div className="text-xs text-white/30 mb-3">
          {creator.totalClaims ?? 0} claims tracked
        </div>

        {/* Stance */}
        {creator.currentSentiment && (
          <div className="text-xs">
            <span className="text-white/40">Stance: </span>
            <span className="text-white/60 capitalize">{creator.currentSentiment}</span>
            {creator.currentStance && (
              <p className="text-white/30 mt-1 line-clamp-1">&ldquo;{creator.currentStance}&rdquo;</p>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
