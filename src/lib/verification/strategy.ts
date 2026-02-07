import type { Claim } from '@/lib/db';
import type { VerificationStrategy } from './types';

export function selectStrategy(claim: Claim): VerificationStrategy {
  const text = claim.claimText.toLowerCase();
  const category = claim.category.toLowerCase();

  // Vague opinion claims with no specifics
  if (isVagueClaim(text)) return 'unverifiable';

  // Price claims with $ targets get CoinGecko data + web search
  if (category.includes('price') || /\$\d/.test(text)) return 'price';

  // Market cap claims also benefit from price data
  if (text.includes('market cap') || text.includes('marketcap')) return 'price';

  // Everything else uses web search
  return 'web_search';
}

function isVagueClaim(text: string): boolean {
  const vaguePatterns = [
    /patience.*(?:winning|key|important)/i,
    /^(?:xrp|ripple)\s+is\s+(?:ideal|perfect|great)\s+for/i,
    /just\s+a\s+matter\s+of\s+time/i,
  ];
  return vaguePatterns.some(p => p.test(text)) && !/\$\d/.test(text) && !/\d+%/.test(text);
}
