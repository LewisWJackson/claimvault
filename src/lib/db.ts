import { creators as rawCreators, videos as rawVideos, claims as rawClaims } from '@/data/seed';

// ─── Type definitions ─────────────────────────────────────────────────────────

export type Creator = typeof rawCreators[number];

export interface Video {
  id: string;
  creatorId: string;
  title: string;
  youtubeVideoId: string;
  publishedAt: string;
  viewCount: number;
  thumbnailUrl: string | null;
  transcriptStatus: string;
  claimsExtracted: boolean;
  durationSeconds: number;
}

export interface Claim {
  id: string;
  creatorId: string;
  videoId: string;
  claimText: string;
  category: string;
  status: string;
  confidenceLanguage: string;
  statedTimeframe: string | null;
  createdAt: string;
  verificationDate: string | null;
  verificationNotes: string | null;
  videoTimestampSeconds: number;
  specificityScore: number;
}

// ─── Normalize seed data to app format ────────────────────────────────────────

const videos: Video[] = rawVideos.map((v: any) => ({
  id: v.id,
  creatorId: v.creatorId,
  title: v.title,
  youtubeVideoId: v.url?.split('watch?v=')[1] || v.id,
  publishedAt: v.publishedAt,
  viewCount: v.viewCount || 0,
  thumbnailUrl: null,
  transcriptStatus: 'completed',
  claimsExtracted: true,
  durationSeconds: v.duration || 0,
}));

const claims: Claim[] = rawClaims.map((c: any) => ({
  id: c.id,
  creatorId: c.creatorId,
  videoId: c.videoId,
  claimText: c.claimText,
  category: c.claimCategory || c.category || 'other',
  status: c.status,
  confidenceLanguage: c.claimStrength === 'strong' ? 'strong' : c.claimStrength === 'weak' ? 'speculative' : 'moderate',
  statedTimeframe: c.statedTimeframe || null,
  createdAt: c.claimDate || c.createdAt || '2025-01-15',
  verificationDate: ['verified_true', 'verified_false', 'partially_true'].includes(c.status)
    ? c.verificationDate || '2025-02-01'
    : null,
  verificationNotes: c.verificationNotes || null,
  videoTimestampSeconds: parseInt(c.sourceUrl?.match(/t=(\d+)/)?.[1] || '0', 10),
  specificityScore: c.claimStrength === 'strong' ? 8 : c.claimStrength === 'weak' ? 4 : 6,
}));

const creators = [...rawCreators];

// ─── Creator queries ──────────────────────────────────────────────────────────

export function getAllCreators(): Creator[] {
  return [...creators].sort((a, b) => (a.rankOverall ?? 99) - (b.rankOverall ?? 99));
}

export function getCreatorById(id: string): Creator | undefined {
  return creators.find(c => c.id === id);
}

export function getCreatorByHandle(handle: string): Creator | undefined {
  return creators.find(c => c.channelHandle === handle);
}

export function getTopCreators(limit = 5): Creator[] {
  return getAllCreators().slice(0, limit);
}

export function getTrendingCreators(): Creator[] {
  return [...creators]
    .sort((a, b) => Math.abs(b.rankChange) - Math.abs(a.rankChange))
    .slice(0, 4);
}

// ─── Video queries ────────────────────────────────────────────────────────────

export function getVideosByCreator(creatorId: string): Video[] {
  return videos
    .filter(v => v.creatorId === creatorId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getVideoById(id: string): Video | undefined {
  return videos.find(v => v.id === id);
}

// ─── Claim queries ────────────────────────────────────────────────────────────

export function getClaimsByCreator(creatorId: string): Claim[] {
  return claims
    .filter(c => c.creatorId === creatorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllClaims(): Claim[] {
  return [...claims].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getClaimsByStatus(status: string): Claim[] {
  return claims.filter(c => c.status === status);
}

export function getClaimsByCategory(category: string): Claim[] {
  return claims.filter(c => c.category === category);
}

export function getRecentClaims(limit = 10): Claim[] {
  return getAllClaims().slice(0, limit);
}

export function getClaimWithDetails(claimId: string) {
  const claim = claims.find(c => c.id === claimId);
  if (!claim) return null;
  const creator = creators.find(c => c.id === claim.creatorId);
  const video = videos.find(v => v.id === claim.videoId);
  return { ...claim, creator, video };
}

export function getClaimsWithCreators(filters?: { status?: string; category?: string; creatorId?: string }) {
  let filtered = [...claims];
  if (filters?.status) filtered = filtered.filter(c => c.status === filters.status);
  if (filters?.category) filtered = filtered.filter(c => c.category === filters.category);
  if (filters?.creatorId) filtered = filtered.filter(c => c.creatorId === filters.creatorId);

  return filtered
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(claim => ({
      ...claim,
      creator: creators.find(c => c.id === claim.creatorId) || {
        id: 'unknown',
        channelName: 'Unknown',
        avatarUrl: null,
        tier: 'unranked',
      },
      video: videos.find(v => v.id === claim.videoId) || {
        id: 'unknown',
        title: 'Unknown Video',
        youtubeVideoId: '',
      },
    }));
}

// ─── Claim mutations ─────────────────────────────────────────────────────────

export function updateClaimVerification(
  claimId: string,
  update: { status: string; verificationNotes: string; verificationDate: string },
): boolean {
  const idx = claims.findIndex(c => c.id === claimId);
  if (idx === -1) return false;
  claims[idx] = { ...claims[idx], ...update };
  return true;
}

// ─── Aggregate stats ──────────────────────────────────────────────────────────

export function getMarketPulse() {
  const bullish = creators.filter(c => c.currentSentiment === 'bullish').length;
  const bearish = creators.filter(c => c.currentSentiment === 'bearish').length;
  const neutral = creators.filter(c => c.currentSentiment === 'neutral').length;
  const total = creators.length;

  return {
    bullishPercent: Math.round((bullish / total) * 100),
    bearishPercent: Math.round((bearish / total) * 100),
    neutralPercent: Math.round((neutral / total) * 100),
    totalCreators: total,
    totalClaims: claims.length,
    pendingClaims: claims.filter(c => c.status === 'pending').length,
    verifiedTrue: claims.filter(c => c.status === 'verified_true').length,
    verifiedFalse: claims.filter(c => c.status === 'verified_false').length,
    recentlyVerified: claims
      .filter(c => c.verificationDate)
      .sort((a, b) => new Date(b.verificationDate!).getTime() - new Date(a.verificationDate!).getTime())
      .slice(0, 5)
      .map(claim => ({
        ...claim,
        creator: creators.find(c => c.id === claim.creatorId)!,
      })),
  };
}
