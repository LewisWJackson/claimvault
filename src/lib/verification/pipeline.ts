import type { Claim } from '@/lib/db';
import type { VerificationResult } from './types';
import { selectStrategy } from './strategy';
import { getXRPPriceData } from './coingecko';
import { verifyWithWebSearch } from './openai-search';

export async function verifyClaim(claim: Claim): Promise<VerificationResult> {
  const strategy = selectStrategy(claim);

  if (strategy === 'unverifiable') {
    return {
      status: 'unverifiable',
      confidence: 0.9,
      verificationNotes: 'This claim is too subjective or vague to verify with objective evidence.',
      verificationEvidence: '',
      reasoning: 'Claim contains opinion-based language without specific verifiable assertions.',
    };
  }

  // Fetch price data for price-related claims
  let priceData = null;
  if (strategy === 'price') {
    try {
      priceData = await getXRPPriceData();
    } catch (err) {
      console.error('[CreatorClaim] CoinGecko error:', err);
    }
  }

  // Run web search verification via OpenAI
  return verifyWithWebSearch(
    claim.claimText,
    claim.category,
    claim.statedTimeframe,
    claim.createdAt,
    priceData,
  );
}

export async function verifyClaimsBatch(
  claims: Claim[],
  concurrency = 2,
): Promise<Map<string, VerificationResult>> {
  const results = new Map<string, VerificationResult>();

  for (let i = 0; i < claims.length; i += concurrency) {
    const batch = claims.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(c => verifyClaim(c)));

    settled.forEach((result, j) => {
      const claim = batch[j];
      if (result.status === 'fulfilled') {
        results.set(claim.id, result.value);
      } else {
        results.set(claim.id, {
          status: 'pending',
          confidence: 0,
          verificationNotes: `Verification failed: ${result.reason?.message || 'Unknown error'}`,
          verificationEvidence: '',
          reasoning: '',
        });
      }
    });

    // Rate limit between batches
    if (i + concurrency < claims.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}
