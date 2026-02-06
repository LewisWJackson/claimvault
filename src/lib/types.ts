export type ClaimCategory = 'price' | 'timeline' | 'regulatory' | 'partnership' | 'technology' | 'market' | 'other';

export type ClaimStatus = 'pending' | 'verified_true' | 'verified_false' | 'partially_true' | 'expired' | 'unverifiable';

export type ConfidenceLevel = 'absolute' | 'strong' | 'moderate' | 'weak' | 'speculative';

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export type Tier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'unranked';

export interface RadarData {
  category: string;
  value: number;
  fullMark: 100;
}

export interface CreatorWithStats {
  id: string;
  channelName: string;
  channelHandle: string | null;
  channelUrl: string;
  avatarUrl: string | null;
  subscriberCount: number;
  primaryNiche: string;
  overallAccuracy: number;
  totalClaims: number;
  verifiedTrue: number;
  verifiedFalse: number;
  pendingClaims: number;
  tier: Tier;
  rankOverall: number | null;
  rankChange: number;
  currentStance: string | null;
  currentSentiment: Sentiment;
  priceAccuracy: number;
  timelineAccuracy: number;
  regulatoryAccuracy: number;
  partnershipAccuracy: number;
  technologyAccuracy: number;
  marketAccuracy: number;
  trackingSince: string;
}

export interface ClaimWithCreator {
  id: string;
  claimText: string;
  category: ClaimCategory;
  status: ClaimStatus;
  confidenceLanguage: ConfidenceLevel;
  statedTimeframe: string | null;
  videoTimestampSeconds: number;
  specificityScore: number;
  createdAt: string;
  verificationDate: string | null;
  verificationNotes: string | null;
  creator: {
    id: string;
    channelName: string;
    avatarUrl: string | null;
    tier: string;
  };
  video: {
    id: string;
    title: string;
    youtubeVideoId: string;
    thumbnailUrl: string | null;
  };
}

export function getTierColor(tier: Tier | string): string {
  switch (tier) {
    case 'diamond': return 'from-cyan-400 to-blue-500';
    case 'gold': return 'from-yellow-400 to-amber-500';
    case 'silver': return 'from-gray-300 to-gray-400';
    case 'bronze': return 'from-orange-400 to-orange-600';
    default: return 'from-gray-500 to-gray-600';
  }
}

export function getTierEmoji(tier: Tier | string): string {
  switch (tier) {
    case 'diamond': return '💎';
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
    default: return '—';
  }
}

export function getStatusColor(status: ClaimStatus | string): string {
  switch (status) {
    case 'verified_true': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'verified_false': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'partially_true': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'pending': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'expired': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}

export function getStatusLabel(status: ClaimStatus | string): string {
  switch (status) {
    case 'verified_true': return 'Verified True';
    case 'verified_false': return 'Verified False';
    case 'partially_true': return 'Partially True';
    case 'pending': return 'Pending';
    case 'expired': return 'Expired';
    case 'unverifiable': return 'Unverifiable';
    default: return status;
  }
}

export function getCategoryColor(category: ClaimCategory | string): string {
  switch (category) {
    case 'price': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'timeline': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'regulatory': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'partnership': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    case 'technology': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'market': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}
