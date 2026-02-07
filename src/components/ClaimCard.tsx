'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Clock, CheckCircle2, XCircle, AlertCircle, MinusCircle, HelpCircle } from 'lucide-react';
import { getStatusColor, getStatusLabel, getCategoryColor } from '@/lib/types';
import DisputeButton from './DisputeButton';

interface ClaimCardProps {
  claim: {
    id: string;
    claimText: string;
    category: string;
    status: string;
    confidenceLanguage: string;
    statedTimeframe: string | null;
    createdAt: string;
    verificationDate: string | null;
    verificationNotes: string | null;
    videoTimestampSeconds?: number;
    creator?: {
      id: string;
      channelName: string;
      avatarUrl: string | null;
      tier: string;
    };
    video?: {
      id: string;
      title: string;
      youtubeVideoId: string;
    };
  };
  index?: number;
  showCreator?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  verified_true: <CheckCircle2 className="w-4 h-4" />,
  verified_false: <XCircle className="w-4 h-4" />,
  partially_true: <AlertCircle className="w-4 h-4" />,
  pending: <Clock className="w-4 h-4" />,
  expired: <MinusCircle className="w-4 h-4" />,
  unverifiable: <HelpCircle className="w-4 h-4" />,
};

export default function ClaimCard({ claim, index = 0, showCreator = true }: ClaimCardProps) {
  const statusColor = getStatusColor(claim.status);
  const categoryColor = getCategoryColor(claim.category);
  const [showVideo, setShowVideo] = useState(false);

  const videoId = claim.video?.youtubeVideoId;
  const timestamp = claim.videoTimestampSeconds || 0;
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?start=${timestamp}&autoplay=1&rel=0`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="glass-card-sm p-4 hover:bg-white/[0.04] transition-all"
    >
      {showCreator && claim.creator && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
            {claim.creator.avatarUrl ? (
              <img src={claim.creator.avatarUrl} alt={claim.creator.channelName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-medium">
                {claim.creator.channelName[0]}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-white/70">{claim.creator.channelName}</span>
          <span className="text-xs text-white/30">
            {new Date(claim.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}

      <p className="text-sm text-white/90 leading-relaxed mb-3">&ldquo;{claim.claimText}&rdquo;</p>

      <div className="flex items-center flex-wrap gap-2">
        <span className={`status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
          {statusIcons[claim.status]}
          {getStatusLabel(claim.status)}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
          {claim.category}
        </span>
        {claim.statedTimeframe && (
          <span className="px-2.5 py-1 rounded-full text-xs text-white/40 bg-white/[0.04] border border-white/[0.06]">
            {claim.statedTimeframe}
          </span>
        )}
        <span className="px-2.5 py-1 rounded-full text-xs text-white/30 bg-white/[0.03]">
          {claim.confidenceLanguage}
        </span>
      </div>

      {claim.verificationNotes && (
        <div className="mt-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <p className="text-xs text-white/50 leading-relaxed">{claim.verificationNotes}</p>
        </div>
      )}

      <DisputeButton claimId={claim.id} />

      {/* Video source with embedded player */}
      {claim.video && videoId && (
        <div className="mt-3">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-red-400 transition-colors group"
          >
            {showVideo ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 text-red-400/60 group-hover:text-red-400" />
            )}
            <span className="truncate max-w-[300px]">{claim.video.title}</span>
            {timestamp > 0 && !showVideo && (
              <span className="text-white/20 flex-shrink-0">
                @{Math.floor(timestamp / 60)}:{(timestamp % 60).toString().padStart(2, '0')}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showVideo && embedUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-2"
              >
                <div className="relative w-full rounded-lg overflow-hidden border border-white/10"
                  style={{ paddingBottom: '56.25%' }}
                >
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={claim.video.title}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
