// ── Core types ─────────────────────────────────────────────────────────────

export type ClaimCategory = 'price' | 'timeline' | 'regulatory' | 'partnership' | 'technology' | 'market' | 'other';
export type ClaimStatus = 'pending' | 'verified_true' | 'verified_false' | 'partially_true' | 'expired' | 'unverifiable';
export type ConfidenceLevel = 'absolute' | 'strong' | 'moderate' | 'weak' | 'speculative';
export type Sentiment = 'bullish' | 'bearish' | 'neutral';
export type Tier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'unranked';

// ── Story types (Ground News model) ───────────────────────────────────────

export type ValidityLean = 'verified' | 'mixed' | 'speculative';

export type StoryCategory =
  | 'regulatory' | 'price_prediction' | 'technology' | 'partnership'
  | 'market_analysis' | 'etf' | 'stablecoin' | 'legal' | 'adoption';

export type CreatorReliability =
  | 'highly_reliable' | 'mostly_reliable' | 'mixed'
  | 'mostly_speculative' | 'unreliable';

export interface ValidityBreakdown {
  verified: number;    // percentage (0-100)
  mixed: number;       // percentage (0-100)
  speculative: number; // percentage (0-100)
  verifiedCount: number;
  mixedCount: number;
  speculativeCount: number;
}

export interface Story {
  id: string;
  slug: string;
  headline: string;
  summary: string;
  category: StoryCategory;
  validity: ValidityBreakdown;
  creatorCount: number;
  claimCount: number;
  isEchoChamber: boolean;
  echoChamberType: 'speculative_only' | 'reliable_only' | null;
  firstMentionedAt: string;
  lastUpdatedAt: string;
  trendingScore: number;
}

export interface StoryCreator {
  creatorId: string;
  lean: ValidityLean;
  claimCount: number;
  verifiedCount: number;
  mixedCount: number;
  speculativeCount: number;
  creator: {
    id: string;
    channelName: string;
    avatarUrl: string | null;
    reliabilityScore: number;
    reliabilityLabel: CreatorReliability;
    tier: Tier;
  };
}

export interface StoryDetail extends Story {
  storyCreators: StoryCreator[];
  claims: ClaimWithCreator[];
}

export interface CreatorProfile {
  id: string;
  channelName: string;
  channelHandle: string | null;
  channelUrl: string;
  avatarUrl: string | null;
  subscriberCount: number;
  description: string;
  primaryNiche: string;
  trackingSince: string;
  reliabilityScore: number;
  reliabilityLabel: CreatorReliability;
  typicalLean: ValidityLean;
  validity: ValidityBreakdown;
  totalClaims: number;
  totalStoriesCovered: number;
  tier: Tier;
  rankOverall: number | null;
  rankChange: number;
  currentSentiment: Sentiment;
  currentStance: string | null;
  priceAccuracy: number;
  timelineAccuracy: number;
  regulatoryAccuracy: number;
  partnershipAccuracy: number;
  technologyAccuracy: number;
  marketAccuracy: number;
}

// ── Existing interfaces (kept for compatibility) ──────────────────────────

export interface RadarData {
  category: string;
  value: number;
  fullMark: 100;
}

export interface ClaimWithCreator {
  id: string;
  claimText: string;
  category: ClaimCategory | string;
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

// ── Color/label helpers ───────────────────────────────────────────────────

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
    case 'unverifiable': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
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

export function getCategoryColor(category: ClaimCategory | StoryCategory | string): string {
  switch (category) {
    case 'price': case 'price_prediction': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'timeline': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'regulatory': case 'legal': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'partnership': case 'adoption': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    case 'technology': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'market': case 'market_analysis': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
    case 'etf': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'stablecoin': return 'text-teal-400 bg-teal-400/10 border-teal-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}

export function getCategoryLabel(category: StoryCategory | string): string {
  switch (category) {
    case 'regulatory': return 'Regulatory';
    case 'price_prediction': return 'Price Prediction';
    case 'technology': return 'Technology';
    case 'partnership': return 'Partnership';
    case 'market_analysis': return 'Market Analysis';
    case 'etf': return 'ETF';
    case 'stablecoin': return 'Stablecoin';
    case 'legal': return 'Legal';
    case 'adoption': return 'Adoption';
    default: return category;
  }
}

// ── Validity spectrum helpers ─────────────────────────────────────────────

export function getValidityColor(lean: ValidityLean): string {
  switch (lean) {
    case 'verified': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'mixed': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'speculative': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
  }
}

export function getValidityLabel(lean: ValidityLean): string {
  switch (lean) {
    case 'verified': return 'Verified';
    case 'mixed': return 'Mixed';
    case 'speculative': return 'Speculative';
  }
}

export function getReliabilityColor(label: CreatorReliability): string {
  switch (label) {
    case 'highly_reliable': return 'text-emerald-400';
    case 'mostly_reliable': return 'text-emerald-300';
    case 'mixed': return 'text-amber-400';
    case 'mostly_speculative': return 'text-purple-300';
    case 'unreliable': return 'text-purple-400';
  }
}

export function getReliabilityLabel(label: CreatorReliability): string {
  switch (label) {
    case 'highly_reliable': return 'Highly Reliable';
    case 'mostly_reliable': return 'Mostly Reliable';
    case 'mixed': return 'Mixed';
    case 'mostly_speculative': return 'Mostly Speculative';
    case 'unreliable': return 'Unreliable';
  }
}

export const VALIDITY_COLORS = {
  verified: '#22c55e',    // emerald-500
  mixed: '#f59e0b',       // amber-500
  speculative: '#a855f7', // purple-500
} as const;
