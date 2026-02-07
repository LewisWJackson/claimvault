import { NextResponse } from 'next/server';
import { getAllClaims, getClaimWithDetails } from '@/lib/db';
import { addDispute, updateDispute, getDisputesByClaim, getAllDisputes } from '@/lib/disputes';
import type { DisputeType } from '@/lib/disputes';

async function evaluateDispute(
  claimText: string,
  creatorName: string,
  videoTitle: string,
  disputeType: DisputeType,
  evidence: string,
  sourceUrl: string | null,
): Promise<{ status: 'upheld' | 'rejected' | 'under_investigation'; analysis: string; confidence: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const typeLabels: Record<DisputeType, string> = {
    never_said: 'The community member claims this was never said by the creator',
    misquoted: 'The community member claims this is a misquote or inaccurate paraphrase',
    out_of_context: 'The community member claims this was taken out of context',
    wrong_creator: 'The community member claims this was attributed to the wrong creator',
  };

  const systemPrompt = `You are the AI moderator for ClaimVault, a community-driven crypto claim tracking platform. A community member has disputed a claim. Evaluate their evidence and determine the dispute's validity.

You must respond with ONLY valid JSON:
{
  "status": "upheld" | "rejected" | "under_investigation",
  "analysis": "<2-4 sentence analysis of the dispute>",
  "confidence": <number 0.0-1.0>
}

Guidelines:
- "upheld": The dispute has strong evidence — the claim should be corrected or removed
- "rejected": The evidence doesn't support the dispute — the original claim stands
- "under_investigation": Mixed or inconclusive evidence — needs manual review
- If the user provides a video URL with timestamp, that is strong evidence
- Evaluate whether the user's description/evidence is specific and plausible
- Be fair to both the original claim and the disputer`;

  const userMessage = `DISPUTED CLAIM: "${claimText}"
ATTRIBUTED TO: ${creatorName}
FROM VIDEO: ${videoTitle}

DISPUTE TYPE: ${typeLabels[disputeType]}

COMMUNITY MEMBER'S EVIDENCE:
${evidence}

${sourceUrl ? `SOURCE URL PROVIDED: ${sourceUrl}` : 'No source URL provided.'}

Evaluate this dispute and respond with JSON only.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  let responseText = '';
  for (const block of data.content) {
    if (block.type === 'text' && block.text) responseText += block.text;
  }

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  const parsed = JSON.parse(jsonMatch[0]);

  const validStatuses = ['upheld', 'rejected', 'under_investigation'] as const;
  return {
    status: validStatuses.includes(parsed.status) ? parsed.status : 'under_investigation',
    analysis: String(parsed.analysis || ''),
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { claimId, type, evidence, sourceUrl } = body;

    if (!claimId || !type || !evidence) {
      return NextResponse.json({ error: 'claimId, type, and evidence are required' }, { status: 400 });
    }

    const validTypes: DisputeType[] = ['never_said', 'misquoted', 'out_of_context', 'wrong_creator'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid dispute type' }, { status: 400 });
    }

    if (evidence.length < 20) {
      return NextResponse.json({ error: 'Please provide more detailed evidence (at least 20 characters)' }, { status: 400 });
    }

    const claimDetails = getClaimWithDetails(claimId);
    if (!claimDetails) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Create the dispute
    const dispute = addDispute({ claimId, type, evidence, sourceUrl: sourceUrl || null });

    // Run AI evaluation
    try {
      const aiResult = await evaluateDispute(
        claimDetails.claimText,
        claimDetails.creator?.channelName || 'Unknown',
        claimDetails.video?.title || 'Unknown',
        type,
        evidence,
        sourceUrl || null,
      );

      updateDispute(dispute.id, {
        status: aiResult.status,
        aiAnalysis: aiResult.analysis,
        aiConfidence: aiResult.confidence,
      });

      return NextResponse.json({
        success: true,
        dispute: {
          id: dispute.id,
          status: aiResult.status,
          analysis: aiResult.analysis,
          confidence: aiResult.confidence,
        },
      });
    } catch (aiErr) {
      // AI failed but dispute is still recorded for manual review
      return NextResponse.json({
        success: true,
        dispute: {
          id: dispute.id,
          status: 'pending_review',
          analysis: 'Your dispute has been recorded and will be reviewed manually.',
          confidence: null,
        },
      });
    }
  } catch (error) {
    console.error('[ClaimVault] Dispute error:', error);
    return NextResponse.json(
      { error: 'Failed to process dispute', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const claimId = searchParams.get('claimId');

  if (claimId) {
    return NextResponse.json(getDisputesByClaim(claimId));
  }
  return NextResponse.json(getAllDisputes());
}
