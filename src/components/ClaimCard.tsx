'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle, MinusCircle } from 'lucide-react';
import { getStatusColor, getStatusLabel, getCategoryColor } from '@/lib/types';

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
};

export default function ClaimCard({ claim, index = 0, showCreator = true }: ClaimCardProps) {
  const statusColor = getStatusColor(claim.status);
  const categoryColor = getCategoryColor(claim.category);

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
              <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-bold">
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

      {claim.video && (
        <div className="mt-3 flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3 text-white/30" />
          <span className="text-xs text-white/30 truncate">{claim.video.title}</span>
        </div>
      )}
    </motion.div>
  );
}
