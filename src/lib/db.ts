import { creators as rawCreators, videos as rawVideos, claims as rawClaims } from '@/data/seed';
import { verifyClaim } from '@/lib/verification/pipeline';

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

// ─── Load seed data directly (already in native format) ──────────────────────

const videos: Video[] = rawVideos.map((v: any) => ({
  id: v.id,
  creatorId: v.creatorId,
  title: v.title,
  youtubeVideoId: v.youtubeVideoId || v.url?.split('watch?v=')[1] || v.id,
  publishedAt: v.publishedAt,
  viewCount: v.viewCount || 0,
  thumbnailUrl: v.thumbnailUrl || null,
  transcriptStatus: v.transcriptStatus || 'completed',
  claimsExtracted: v.claimsExtracted ?? true,
  durationSeconds: v.durationSeconds || v.duration || 0,
}));

const claims: Claim[] = rawClaims.map((c: any) => ({
  id: c.id,
  creatorId: c.creatorId,
  videoId: c.videoId,
  claimText: c.claimText,
  category: c.category || c.claimCategory || 'other',
  status: c.status,
  confidenceLanguage: c.confidenceLanguage || 'moderate',
  statedTimeframe: c.statedTimeframe || null,
  createdAt: c.createdAt || '2025-01-15',
  verificationDate: c.verificationDate || null,
  verificationNotes: c.verificationNotes || null,
  videoTimestampSeconds: c.videoTimestampSeconds || 0,
  specificityScore: c.specificityScore || 5,
}));

// ─── Compute real creator stats from actual claims ──────────────────────────

function computeCreatorStats(creatorId: string) {
  const creatorClaims = claims.filter(c => c.creatorId === creatorId);
  const total = creatorClaims.length;
  const verifiedTrue = creatorClaims.filter(c => c.status === 'verified_true').length;
  const verifiedFalse = creatorClaims.filter(c => c.status === 'verified_false').length;
  const partiallyTrue = creatorClaims.filter(c => c.status === 'partially_true').length;
  const expired = creatorClaims.filter(c => c.status === 'expired').length;
  const unverifiable = creatorClaims.filter(c => c.status === 'unverifiable').length;
  const pending = creatorClaims.filter(c => c.status === 'pending').length;

  // Accuracy: (true + 0.5 * partial) / (true + false + partial + expired)
  const scoreable = verifiedTrue + verifiedFalse + partiallyTrue + expired;
  const accuracy = scoreable > 0
    ? Math.round(((verifiedTrue + partiallyTrue * 0.5) / scoreable) * 100 * 10) / 10
    : 0;

  return { totalClaims: total, verifiedTrue, verifiedFalse, partiallyTrue, expired, unverifiable, pendingClaims: pending, overallAccuracy: accuracy };
}

const creators = rawCreators.map(c => {
  const stats = computeCreatorStats(c.id);
  return { ...c, ...stats };
});

// ─── Creator queries ──────────────────────────────────────────────────────────

export function getAllCreators() {
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

// ─── Dynamic claim/video management ─────────────────────────────────────────

export function addClaim(
  input: Omit<Claim, 'videoTimestampSeconds' | 'specificityScore'> & {
    videoTimestampSeconds?: number;
    specificityScore?: number;
  },
): Claim {
  const claim: Claim = {
    ...input,
    videoTimestampSeconds: input.videoTimestampSeconds ?? 0,
    specificityScore: input.specificityScore ?? 5,
  };
  claims.push(claim);
  recomputeCreatorStats(claim.creatorId);
  return claim;
}

export function addVideo(video: Video): Video {
  const existing = videos.find(v => v.id === video.id);
  if (existing) return existing;
  videos.push(video);
  return video;
}

export function claimExists(claimText: string, creatorId: string): boolean {
  const newWords = claimText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (newWords.length === 0) return false;

  return claims.some(c => {
    if (c.creatorId !== creatorId) return false;
    const existingWords = c.claimText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (existingWords.length === 0) return false;
    const overlap = newWords.filter(w => existingWords.includes(w)).length;
    return overlap / Math.max(newWords.length, existingWords.length) > 0.6;
  });
}

export function getClaimCountForCreator(creatorId: string): number {
  return claims.filter(c => c.creatorId === creatorId).length;
}

function recomputeCreatorStats(creatorId: string) {
  const idx = creators.findIndex(c => c.id === creatorId);
  if (idx === -1) return;
  const stats = computeCreatorStats(creatorId);
  creators[idx] = { ...creators[idx], ...stats };
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

// ─── Auto-verification on startup ─────────────────────────────────────────────

let verificationStarted = false;

async function autoVerifyPendingClaims() {
  if (verificationStarted) return;
  verificationStarted = true;

  const pending = claims.filter(c => c.status === 'pending');
  if (pending.length === 0) {
    console.log('[ClaimVault] No pending claims to verify.');
    return;
  }

  console.log(`[ClaimVault] Auto-verifying ${pending.length} pending claims in background...`);

  const concurrency = 2;
  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(c => verifyClaim(c)));

    settled.forEach((result, j) => {
      const claim = batch[j];
      if (result.status === 'fulfilled' && result.value.status !== 'pending') {
        updateClaimVerification(claim.id, {
          status: result.value.status,
          verificationNotes: result.value.verificationNotes,
          verificationDate: new Date().toISOString().split('T')[0],
        });
        console.log(`[ClaimVault] Verified ${claim.id}: ${result.value.status}`);
      } else if (result.status === 'rejected') {
        console.error(`[ClaimVault] Failed to verify ${claim.id}:`, result.reason?.message);
      }
    });

    if (i + concurrency < pending.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('[ClaimVault] Auto-verification complete.');
}

// Fire and forget — runs in background on first module load
autoVerifyPendingClaims().catch(err =>
  console.error('[ClaimVault] Auto-verification error:', err)
);

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
    verifiedTrue: claims.filter(c => c.status === 'verified_true').length,
    verifiedFalse: claims.filter(c => c.status === 'verified_false').length,
    partiallyTrue: claims.filter(c => c.status === 'partially_true').length,
    expired: claims.filter(c => c.status === 'expired').length,
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
