import { Tier, ValidityLean, CreatorReliability, ValidityBreakdown } from './types';

// ─── Calculate overall accuracy for a creator ───────────────────────────────
export function calculateAccuracy(verifiedTrue: number, verifiedFalse: number, partiallyTrue: number): number {
  const total = verifiedTrue + verifiedFalse + partiallyTrue;
  if (total === 0) return 0;
  // Partially true counts as 0.5
  return Math.round(((verifiedTrue + partiallyTrue * 0.5) / total) * 1000) / 10;
}

// ─── Determine tier based on accuracy percentage ────────────────────────────
export function calculateTier(accuracy: number, totalScored: number): Tier {
  if (totalScored < 5) return 'unranked';
  if (accuracy >= 90) return 'diamond';
  if (accuracy >= 75) return 'gold';
  if (accuracy >= 60) return 'silver';
  if (accuracy >= 50) return 'bronze';
  return 'unranked';
}

// ─── Calculate category-specific accuracy ───────────────────────────────────
export function calculateCategoryAccuracy(
  claims: Array<{ category: string; status: string }>
): Record<string, number> {
  const categories = ['price', 'timeline', 'regulatory', 'partnership', 'technology', 'market'];
  const result: Record<string, number> = {};

  for (const cat of categories) {
    const catClaims = claims.filter(c => c.category === cat);
    const scored = catClaims.filter(c =>
      ['verified_true', 'verified_false', 'partially_true'].includes(c.status)
    );

    if (scored.length === 0) {
      result[cat] = 0;
      continue;
    }

    const trueCount = scored.filter(c => c.status === 'verified_true').length;
    const partialCount = scored.filter(c => c.status === 'partially_true').length;
    result[cat] = Math.round(((trueCount + partialCount * 0.5) / scored.length) * 100);
  }

  return result;
}

// ─── Weighted accuracy (recent claims matter more) ──────────────────────────
export function calculateWeightedAccuracy(
  claims: Array<{ status: string; createdAt: string | Date; specificityScore: number }>
): number {
  const scored = claims.filter(c =>
    ['verified_true', 'verified_false', 'partially_true'].includes(c.status)
  );

  if (scored.length === 0) return 0;

  const now = new Date();
  let weightedCorrect = 0;
  let totalWeight = 0;

  for (const claim of scored) {
    const age = (now.getTime() - new Date(claim.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    // Recency weight: claims from last 90 days get full weight, older ones decay
    const recencyWeight = Math.max(0.3, 1 - (age / 365));
    // Specificity weight: more specific claims count more
    const specificityWeight = claim.specificityScore / 10;
    const weight = recencyWeight * specificityWeight;

    if (claim.status === 'verified_true') weightedCorrect += weight;
    if (claim.status === 'partially_true') weightedCorrect += weight * 0.5;
    totalWeight += weight;
  }

  return Math.round((weightedCorrect / totalWeight) * 1000) / 10;
}

// ─── Validity breakdown for a set of claims ─────────────────────────────────
// Maps claim statuses into the 3-segment validity spectrum:
//   verified_true → Verified | partially_true → Mixed | verified_false/unverifiable/expired → Speculative

export function calculateValidityBreakdown(
  claims: Array<{ status: string }>
): ValidityBreakdown {
  if (claims.length === 0) {
    return { verified: 0, mixed: 0, speculative: 0, verifiedCount: 0, mixedCount: 0, speculativeCount: 0 };
  }

  const verifiedCount = claims.filter(c => c.status === 'verified_true').length;
  const mixedCount = claims.filter(c => c.status === 'partially_true').length;
  const speculativeCount = claims.filter(c =>
    ['verified_false', 'unverifiable', 'expired'].includes(c.status)
  ).length;
  const total = verifiedCount + mixedCount + speculativeCount;

  // Pending claims aren't counted in the breakdown
  if (total === 0) {
    return { verified: 0, mixed: 0, speculative: 0, verifiedCount: 0, mixedCount: 0, speculativeCount: 0 };
  }

  return {
    verified: Math.round((verifiedCount / total) * 100),
    mixed: Math.round((mixedCount / total) * 100),
    speculative: Math.round((speculativeCount / total) * 100),
    verifiedCount,
    mixedCount,
    speculativeCount,
  };
}

// ─── Determine a creator's lean for a given set of claims ────────────────────
// Returns whether the creator leans verified, mixed, or speculative

export function calculateCreatorLean(
  claims: Array<{ status: string }>
): ValidityLean {
  const breakdown = calculateValidityBreakdown(claims);
  if (breakdown.verified >= 50) return 'verified';
  if (breakdown.speculative >= 50) return 'speculative';
  return 'mixed';
}

// ─── Reliability score (0-100) based on weighted accuracy ────────────────────
// Higher = more claims verified true. Combines accuracy + volume.

export function calculateReliabilityScore(
  claims: Array<{ status: string; specificityScore?: number }>
): number {
  const scored = claims.filter(c =>
    ['verified_true', 'verified_false', 'partially_true', 'expired'].includes(c.status)
  );

  if (scored.length === 0) return 50; // neutral default

  let correct = 0;
  let total = 0;

  for (const c of scored) {
    const weight = (c.specificityScore ?? 5) / 10; // more specific claims weigh more
    if (c.status === 'verified_true') correct += weight;
    if (c.status === 'partially_true') correct += weight * 0.5;
    total += weight;
  }

  const rawScore = total > 0 ? (correct / total) * 100 : 50;

  // Volume confidence: full confidence at 20+ scored claims, reduced below
  const confidence = Math.min(1, scored.length / 20);
  // Blend toward 50 (neutral) when few scored claims
  return Math.round(rawScore * confidence + 50 * (1 - confidence));
}

// ─── Reliability label from score ────────────────────────────────────────────

export function getReliabilityFromScore(score: number): CreatorReliability {
  if (score >= 80) return 'highly_reliable';
  if (score >= 65) return 'mostly_reliable';
  if (score >= 45) return 'mixed';
  if (score >= 30) return 'mostly_speculative';
  return 'unreliable';
}

// ─── Echo chamber detection ──────────────────────────────────────────────────
// A story is an echo chamber if coverage is heavily skewed to one side

export function calculateEchoChamberScore(
  validity: ValidityBreakdown
): { isEchoChamber: boolean; echoChamberType: 'speculative_only' | 'reliable_only' | null } {
  const total = validity.verifiedCount + validity.mixedCount + validity.speculativeCount;
  if (total < 3) return { isEchoChamber: false, echoChamberType: null };

  // Echo chamber if >80% of claims are on one side
  if (validity.speculative >= 80) {
    return { isEchoChamber: true, echoChamberType: 'speculative_only' };
  }
  if (validity.verified >= 80) {
    return { isEchoChamber: true, echoChamberType: 'reliable_only' };
  }

  return { isEchoChamber: false, echoChamberType: null };
}

// ─── Trending score ──────────────────────────────────────────────────────────
// Based on recency + creator count + claim count

export function calculateTrendingScore(
  creatorCount: number,
  claimCount: number,
  firstMentionedAt: string | Date,
  lastUpdatedAt: string | Date
): number {
  const now = new Date();
  const recencyDays = (now.getTime() - new Date(lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
  const ageDays = (now.getTime() - new Date(firstMentionedAt).getTime()) / (1000 * 60 * 60 * 24);

  // Recency factor: decay over 30 days
  const recency = Math.max(0, 1 - recencyDays / 30);
  // Creator diversity factor (more creators = more trending)
  const diversity = Math.min(1, creatorCount / 8);
  // Volume factor
  const volume = Math.min(1, claimCount / 40);
  // Velocity: many claims in short time = more trending
  const velocity = ageDays > 0 ? Math.min(1, claimCount / (ageDays * 2)) : 1;

  return Math.round((recency * 0.3 + diversity * 0.3 + volume * 0.2 + velocity * 0.2) * 100);
}

// ─── Generate ranking from list of creators ─────────────────────────────────
export function rankCreators(
  creators: Array<{ id: string; overallAccuracy: number; totalClaims: number; rankOverall: number | null }>
) {
  // Sort by accuracy, then by total claims as tiebreaker
  const sorted = [...creators]
    .filter(c => c.totalClaims >= 5) // minimum 5 claims to be ranked
    .sort((a, b) => {
      if (b.overallAccuracy !== a.overallAccuracy) return b.overallAccuracy - a.overallAccuracy;
      return b.totalClaims - a.totalClaims;
    });

  return sorted.map((creator, index) => ({
    ...creator,
    newRank: index + 1,
    rankChange: creator.rankOverall ? creator.rankOverall - (index + 1) : 0,
  }));
}
