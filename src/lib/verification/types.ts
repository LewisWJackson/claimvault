import type { ClaimStatus } from '@/lib/types';

export interface PriceData {
  currentPrice: number;
  currency: string;
  priceAtClaimDate: number | null;
  percentChange1y: number | null;
  allTimeHigh: number;
  allTimeHighDate: string;
  marketCap: number;
}

export interface VerificationResult {
  status: ClaimStatus;
  confidence: number;
  verificationNotes: string;
  verificationEvidence: string;
  reasoning: string;
}

export type VerificationStrategy = 'price' | 'web_search' | 'unverifiable';
