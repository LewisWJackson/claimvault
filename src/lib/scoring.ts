import { Tier } from './types';

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
