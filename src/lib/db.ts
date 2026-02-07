import { creators as rawCreators, videos as rawVideos, claims as rawClaims } from '@/data/seed';
import { stories as rawStories, claimStoryMap } from '@/data/stories';
import {
  calculateValidityBreakdown,
  calculateCreatorLean,
  calculateReliabilityScore,
  getReliabilityFromScore,
  calculateEchoChamberScore,
  calculateTrendingScore,
  calculateCategoryAccuracy,
} from '@/lib/scoring';
import type {
  Story,
  StoryDetail,
  StoryCreator,
  CreatorProfile,
  ValidityBreakdown,
  ValidityLean,
  CreatorReliability,
  ClaimWithCreator,
  StoryCategory,
} from '@/lib/types';

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

// ─── Build claim lookup for fast access ─────────────────────────────────────

const claimsById = new Map<string, Claim>();
for (const c of claims) claimsById.set(c.id, c);

// ─── Compute story data at module load time ─────────────────────────────────

interface ComputedStory extends Story {
  _claimIds: string[];
}

const computedStories: ComputedStory[] = rawStories.map(raw => {
  // Resolve claims belonging to this story
  const storyClaims = raw.claimIds
    .map(id => claimsById.get(id))
    .filter((c): c is Claim => c != null);

  // Validity breakdown
  const validity = calculateValidityBreakdown(storyClaims);

  // Unique creators in this story
  const creatorIds = Array.from(new Set(storyClaims.map(c => c.creatorId)));

  // Echo chamber detection
  const echo = calculateEchoChamberScore(validity);

  // Date range
  const dates = storyClaims.map(c => new Date(c.createdAt).getTime());
  const firstMentionedAt = dates.length > 0
    ? new Date(Math.min(...dates)).toISOString()
    : new Date().toISOString();
  const lastUpdatedAt = dates.length > 0
    ? new Date(Math.max(...dates)).toISOString()
    : new Date().toISOString();

  // Trending score
  const trendingScore = calculateTrendingScore(
    creatorIds.length,
    storyClaims.length,
    firstMentionedAt,
    lastUpdatedAt,
  );

  return {
    id: raw.id,
    slug: raw.slug,
    headline: raw.headline,
    summary: raw.summary,
    category: raw.category as StoryCategory,
    validity,
    creatorCount: creatorIds.length,
    claimCount: storyClaims.length,
    isEchoChamber: echo.isEchoChamber,
    echoChamberType: echo.echoChamberType,
    firstMentionedAt,
    lastUpdatedAt,
    trendingScore,
    _claimIds: raw.claimIds,
  };
});

// Index: stories each creator appears in
const creatorStoryIndex = new Map<string, string[]>();
for (const story of computedStories) {
  const storyClaims = story._claimIds
    .map(id => claimsById.get(id))
    .filter((c): c is Claim => c != null);
  const creatorIds = Array.from(new Set(storyClaims.map(c => c.creatorId)));
  for (const cid of creatorIds) {
    const list = creatorStoryIndex.get(cid) || [];
    list.push(story.id);
    creatorStoryIndex.set(cid, list);
  }
}

// ─── Helper: strip internal fields from ComputedStory to Story ──────────────

function toStory(cs: ComputedStory): Story {
  const { _claimIds, ...story } = cs;
  return story;
}

// ─── Helper: build StoryCreator[] for a story ───────────────────────────────

function buildStoryCreators(story: ComputedStory): StoryCreator[] {
  const storyClaims = story._claimIds
    .map(id => claimsById.get(id))
    .filter((c): c is Claim => c != null);

  // Group claims by creator
  const byCreator = new Map<string, Claim[]>();
  for (const c of storyClaims) {
    const list = byCreator.get(c.creatorId) || [];
    list.push(c);
    byCreator.set(c.creatorId, list);
  }

  const result: StoryCreator[] = [];
  const entries = Array.from(byCreator.entries());
  for (const [creatorId, creatorClaims] of entries) {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) continue;

    const lean = calculateCreatorLean(creatorClaims);
    const verifiedCount = creatorClaims.filter((c: Claim) => c.status === 'verified_true').length;
    const mixedCount = creatorClaims.filter((c: Claim) => c.status === 'partially_true').length;
    const speculativeCount = creatorClaims.filter((c: Claim) =>
      ['verified_false', 'unverifiable', 'expired'].includes(c.status)
    ).length;

    // Get creator-level reliability
    const allCreatorClaims = claims.filter(c => c.creatorId === creatorId);
    const reliabilityScore = calculateReliabilityScore(allCreatorClaims);
    const reliabilityLabel = getReliabilityFromScore(reliabilityScore);

    result.push({
      creatorId,
      lean,
      claimCount: creatorClaims.length,
      verifiedCount,
      mixedCount,
      speculativeCount,
      creator: {
        id: creator.id,
        channelName: creator.channelName,
        avatarUrl: creator.avatarUrl,
        reliabilityScore,
        reliabilityLabel,
        tier: creator.tier as any,
      },
    });
  }

  return result;
}

// ─── Helper: build ClaimWithCreator[] for a story ───────────────────────────

function buildStoryClaimsWithCreators(story: ComputedStory): ClaimWithCreator[] {
  return story._claimIds
    .map(id => claimsById.get(id))
    .filter((c): c is Claim => c != null)
    .map(claim => {
      const creator = creators.find(cr => cr.id === claim.creatorId);
      const video = videos.find(v => v.id === claim.videoId);
      return {
        id: claim.id,
        claimText: claim.claimText,
        category: claim.category,
        status: claim.status as any,
        confidenceLanguage: claim.confidenceLanguage as any,
        statedTimeframe: claim.statedTimeframe,
        videoTimestampSeconds: claim.videoTimestampSeconds,
        specificityScore: claim.specificityScore,
        createdAt: claim.createdAt,
        verificationDate: claim.verificationDate,
        verificationNotes: claim.verificationNotes,
        creator: {
          id: creator?.id || 'unknown',
          channelName: creator?.channelName || 'Unknown',
          avatarUrl: creator?.avatarUrl || null,
          tier: creator?.tier || 'unranked',
        },
        video: {
          id: video?.id || 'unknown',
          title: video?.title || 'Unknown Video',
          youtubeVideoId: video?.youtubeVideoId || '',
          thumbnailUrl: video?.thumbnailUrl || null,
        },
      };
    });
}

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

// All claims are pre-verified in seed data — no auto-verification needed on startup.

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

// ─── Story queries ──────────────────────────────────────────────────────────

export function getAllStories(): Story[] {
  return computedStories
    .map(toStory)
    .sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getStoryBySlug(slug: string): StoryDetail | null {
  const story = computedStories.find(s => s.slug === slug);
  if (!story) return null;

  return {
    ...toStory(story),
    storyCreators: buildStoryCreators(story),
    claims: buildStoryClaimsWithCreators(story),
  };
}

export function getTrendingStories(limit = 10): Story[] {
  return getAllStories().slice(0, limit);
}

export function getStoriesByCategory(category: string): Story[] {
  return computedStories
    .filter(s => s.category === category)
    .map(toStory)
    .sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getEchoChamberStories(): Story[] {
  return computedStories
    .filter(s => s.isEchoChamber)
    .map(toStory)
    .sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getStoriesForCreator(creatorId: string): Story[] {
  const storyIds = creatorStoryIndex.get(creatorId) || [];
  return storyIds
    .map(id => computedStories.find(s => s.id === id))
    .filter((s): s is ComputedStory => s != null)
    .map(toStory)
    .sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getStoryCount(): number {
  return computedStories.length;
}

// ─── Creator profile queries ────────────────────────────────────────────────

export function getCreatorsWithProfiles() {
  return creators.map(c => {
    const profile = getCreatorProfile(c.id);
    return {
      ...c,
      ...profile,
    };
  }).filter(c => c !== null);
}

export function getCreatorProfile(id: string): CreatorProfile | null {
  const creator = creators.find(c => c.id === id);
  if (!creator) return null;

  const creatorClaims = claims.filter(c => c.creatorId === id);
  const reliabilityScore = calculateReliabilityScore(creatorClaims);
  const reliabilityLabel = getReliabilityFromScore(reliabilityScore);
  const typicalLean = calculateCreatorLean(creatorClaims);
  const validity = calculateValidityBreakdown(creatorClaims);
  const totalStoriesCovered = (creatorStoryIndex.get(id) || []).length;

  // Category-specific accuracy
  const catAccuracy = calculateCategoryAccuracy(creatorClaims);

  return {
    id: creator.id,
    channelName: creator.channelName,
    channelHandle: creator.channelHandle || null,
    channelUrl: creator.channelUrl,
    avatarUrl: creator.avatarUrl,
    subscriberCount: creator.subscriberCount,
    description: creator.description,
    primaryNiche: creator.primaryNiche,
    trackingSince: creator.trackingSince,
    reliabilityScore,
    reliabilityLabel,
    typicalLean,
    validity,
    totalClaims: creatorClaims.length,
    totalStoriesCovered,
    tier: creator.tier as any,
    rankOverall: creator.rankOverall ?? null,
    rankChange: creator.rankChange,
    currentSentiment: creator.currentSentiment as any,
    currentStance: creator.currentStance || null,
    priceAccuracy: catAccuracy['price'] ?? 0,
    timelineAccuracy: catAccuracy['timeline'] ?? 0,
    regulatoryAccuracy: catAccuracy['regulatory'] ?? 0,
    partnershipAccuracy: catAccuracy['partnership'] ?? 0,
    technologyAccuracy: catAccuracy['technology'] ?? 0,
    marketAccuracy: catAccuracy['market'] ?? 0,
  };
}
