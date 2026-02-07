import type { PriceData, VerificationResult } from './types';
import type { ClaimStatus } from '@/lib/types';

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

export async function verifyWithWebSearch(
  claimText: string,
  category: string,
  statedTimeframe: string | null,
  claimDate: string,
  priceData: PriceData | null,
): Promise<VerificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  let priceContext = '';
  if (priceData) {
    priceContext = `\n\nCURRENT XRP PRICE DATA:
- Current Price: $${priceData.currentPrice}
- Market Cap: $${(priceData.marketCap / 1e9).toFixed(1)}B
- All-Time High: $${priceData.allTimeHigh} (${priceData.allTimeHighDate})
- 1-Year Change: ${priceData.percentChange1y?.toFixed(1) ?? 'N/A'}%`;
  }

  const today = new Date().toISOString().split('T')[0];

  const systemPrompt = `You are a crypto claim verification analyst for CreatorClaim. Use the web search tool to find real evidence about crypto claims, then provide a structured verification verdict. Be rigorous — require real evidence, not speculation.

Rules:
- "verified_true": Clear evidence confirms the claim happened/is happening
- "verified_false": Clear evidence contradicts the claim
- "partially_true": Some truth but overstated, understated, or mischaracterized
- "pending": Timeframe hasn't elapsed yet or insufficient evidence
- "expired": Timeframe passed without the predicted event occurring
- "unverifiable": Too subjective to verify objectively
- Price predictions: only "verified_true" if the target price was actually reached

After searching, respond with ONLY valid JSON in this format:
{
  "status": "verified_true" | "verified_false" | "partially_true" | "pending" | "expired" | "unverifiable",
  "confidence": <number 0.0-1.0>,
  "notes": "<1-3 sentence verification summary>",
  "evidence": "<key evidence sources and facts found>",
  "reasoning": "<step-by-step reasoning>"
}`;

  const userMessage = `Verify this crypto YouTuber claim by searching the web for evidence:

CLAIM: "${claimText}"
CATEGORY: ${category}
CLAIM DATE: ${claimDate}
STATED TIMEFRAME: ${statedTimeframe || 'None'}
TODAY: ${today}${priceContext}

Search the web for current information about this claim, then provide your JSON verdict.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data: AnthropicResponse = await res.json();

  // Extract text from response content blocks
  let responseText = '';
  for (const block of data.content) {
    if (block.type === 'text' && block.text) {
      responseText += block.text;
    }
  }

  return parseVerificationResponse(responseText);
}

function parseVerificationResponse(text: string): VerificationResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    const validStatuses: ClaimStatus[] = [
      'pending', 'verified_true', 'verified_false', 'partially_true', 'expired', 'unverifiable',
    ];

    return {
      status: validStatuses.includes(parsed.status) ? parsed.status : 'pending',
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
      verificationNotes: String(parsed.notes || ''),
      verificationEvidence: String(parsed.evidence || ''),
      reasoning: String(parsed.reasoning || ''),
    };
  } catch {
    return {
      status: 'pending',
      confidence: 0,
      verificationNotes: 'Automated verification could not parse results. Manual review needed.',
      verificationEvidence: '',
      reasoning: text.substring(0, 500),
    };
  }
}
