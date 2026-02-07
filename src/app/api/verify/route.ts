import { NextResponse } from 'next/server';
import { getAllClaims, getClaimsByStatus, updateClaimVerification } from '@/lib/db';
import { verifyClaim, verifyClaimsBatch } from '@/lib/verification/pipeline';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { claimId, mode = 'single' } = body;

    if (mode === 'single') {
      if (!claimId) {
        return NextResponse.json({ error: 'claimId is required' }, { status: 400 });
      }

      const claim = getAllClaims().find(c => c.id === claimId);
      if (!claim) {
        return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
      }

      const result = await verifyClaim(claim);

      updateClaimVerification(claimId, {
        status: result.status,
        verificationNotes: result.verificationNotes,
        verificationDate: new Date().toISOString().split('T')[0],
      });

      return NextResponse.json({
        success: true,
        claimId,
        result: {
          status: result.status,
          confidence: result.confidence,
          notes: result.verificationNotes,
          evidence: result.verificationEvidence,
          reasoning: result.reasoning,
        },
      });
    }

    if (mode === 'batch_pending') {
      const pending = getClaimsByStatus('pending');
      if (pending.length === 0) {
        return NextResponse.json({ success: true, message: 'No pending claims', processed: 0, updated: 0 });
      }

      const results = await verifyClaimsBatch(pending, 2);

      let updated = 0;
      const entries = Array.from(results.entries());
      for (const entry of entries) {
        const [id, result] = entry;
        if (result.status !== 'pending') {
          updateClaimVerification(id, {
            status: result.status,
            verificationNotes: result.verificationNotes,
            verificationDate: new Date().toISOString().split('T')[0],
          });
          updated++;
        }
      }

      const summary = Object.fromEntries(
        Array.from(results.entries()).map(([id, r]) => [id, { status: r.status, confidence: r.confidence, notes: r.verificationNotes }])
      );

      return NextResponse.json({ success: true, processed: pending.length, updated, results: summary });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    console.error('[CreatorClaim] Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
