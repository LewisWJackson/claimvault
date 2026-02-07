export interface ExtractedClaim {
  claimText: string;
  claimCategory: string;
  claimStrength: 'strong' | 'medium' | 'weak';
  statedTimeframe: string | null;
  timestampSeconds: number;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

/**
 * Use Claude to extract verifiable claims from a video transcript.
 */
export async function extractClaimsFromTranscript(
  transcript: string,
  creatorId: string,
  videoId: string,
  videoTitle: string,
  videoDate: string,
): Promise<ExtractedClaim[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  // Truncate transcripts to stay within rate limits (~20k chars ≈ ~5k tokens)
  const maxChars = 20000;
  const truncatedTranscript = transcript.length > maxChars
    ? transcript.substring(0, maxChars) + '\n[TRANSCRIPT TRUNCATED]'
    : transcript;

  const systemPrompt = `You are a crypto claim extraction analyst for ClaimVault, a platform that tracks the accuracy of XRP YouTube creators' predictions and claims.

Analyze the transcript and extract specific, verifiable claims. Focus on:
- Price predictions (specific price targets or ranges)
- Partnership claims (named companies/institutions)
- Regulatory predictions (ETF approvals, SEC actions, legal outcomes)
- Technology claims (specific tech upgrades, adoption metrics)
- Market predictions (market cap targets, altseason timing, dominance shifts)
- Technical analysis claims (specific chart patterns, breakout predictions with timeframes)

Rules:
- Only extract claims that are specific enough to verify later
- Skip vague opinions like "I think crypto is good" or "XRP has potential"
- Each claim should be a self-contained statement that someone could fact-check
- Estimate the timestamp in seconds where the claim was made (approximate is fine)
- Classify claim strength:
  - "strong": Creator states it with high conviction ("will happen", "guaranteed", definite language)
  - "medium": Creator expresses moderate confidence ("likely", "probably", "I believe")
  - "weak": Creator is speculative ("could", "might", "possible")

Respond with ONLY a valid JSON array of claims:
[
  {
    "claimText": "<the specific claim as stated>",
    "claimCategory": "<category>",
    "claimStrength": "strong" | "medium" | "weak",
    "statedTimeframe": "<timeframe if mentioned, e.g. 'by end of 2025', 'within 6 months'>" | null,
    "timestampSeconds": <approximate seconds into video>
  }
]

Valid categories: "price_prediction", "regulatory", "partnership", "technology", "market_prediction", "technical_analysis", "etf_approval", "partnership_adoption", "market_analysis"

If no verifiable claims are found, return an empty array: []`;

  const userMessage = `Extract verifiable claims from this XRP YouTube video transcript.

VIDEO TITLE: ${videoTitle}
CREATOR: ${creatorId}
DATE: ${videoDate}

TRANSCRIPT:
${truncatedTranscript}

Extract all specific, verifiable claims as a JSON array.`;

  const body = JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Retry with backoff for rate limit (429) errors
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    if (res.status === 429) {
      const waitSec = Math.pow(2, attempt + 1) * 15; // 30s, 60s, 120s
      console.log(`[ClaimVault] Rate limited, waiting ${waitSec}s before retry ${attempt + 1}/3...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    const errText = res ? await res.text() : 'No response';
    throw new Error(`Anthropic API error (${res?.status}): ${errText}`);
  }

  const data: AnthropicResponse = await res.json();

  let responseText = '';
  for (const block of data.content) {
    if (block.type === 'text' && block.text) responseText += block.text;
  }

  return parseClaimsResponse(responseText);
}

function parseClaimsResponse(text: string): ExtractedClaim[] {
  try {
    // Find the JSON array in the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    const validCategories = [
      'price_prediction', 'regulatory', 'partnership', 'technology',
      'market_prediction', 'technical_analysis', 'etf_approval',
      'partnership_adoption', 'market_analysis',
    ];
    const validStrengths = ['strong', 'medium', 'weak'] as const;

    return parsed
      .filter((c: any) => c.claimText && typeof c.claimText === 'string')
      .map((c: any) => ({
        claimText: String(c.claimText),
        claimCategory: validCategories.includes(c.claimCategory) ? c.claimCategory : 'market_analysis',
        claimStrength: validStrengths.includes(c.claimStrength) ? c.claimStrength : 'medium',
        statedTimeframe: c.statedTimeframe ? String(c.statedTimeframe) : null,
        timestampSeconds: Math.max(0, Math.round(Number(c.timestampSeconds) || 0)),
      }));
  } catch {
    console.error('[ClaimVault] Failed to parse claims from AI response');
    return [];
  }
}
