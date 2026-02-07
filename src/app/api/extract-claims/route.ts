import { NextResponse } from 'next/server';
import {
  addClaim,
  addVideo,
  claimExists,
  getClaimCountForCreator,
  getAllCreators,
  getCreatorById,
} from '@/lib/db';
import {
  extractClaimsForCreator,
  extractClaimsForAllCreators,
  type ExtractedClaimResult,
} from '@/lib/transcripts/pipeline';

// Track recent extractions for GET status
const extractionLog: Array<{
  timestamp: string;
  creatorId: string;
  claimsAdded: number;
  claimsDeduplicated: number;
}> = [];

let isExtracting = false;

async function processExtractedResults(results: ExtractedClaimResult[]) {
  let totalAdded = 0;
  let totalDeduplicated = 0;

  for (const result of results) {
    if (result.error || result.claims.length === 0) continue;

    let resultAdded = 0;
    let resultDeduplicated = 0;

    // Add the video to the store
    addVideo({
      id: result.videoId,
      creatorId: result.creatorId,
      title: result.videoTitle,
      youtubeVideoId: result.videoId,
      publishedAt: result.videoDate,
      viewCount: 0,
      thumbnailUrl: null,
      transcriptStatus: 'completed',
      claimsExtracted: true,
      durationSeconds: 0,
    });

    for (const extracted of result.claims) {
      // Deduplication check
      if (claimExists(extracted.claimText, result.creatorId)) {
        resultDeduplicated++;
        totalDeduplicated++;
        continue;
      }

      const claimId = `claim-${result.creatorId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      addClaim({
        id: claimId,
        creatorId: result.creatorId,
        videoId: result.videoId,
        claimText: extracted.claimText,
        category: extracted.claimCategory,
        status: 'pending',
        confidenceLanguage:
          extracted.claimStrength === 'strong'
            ? 'strong'
            : extracted.claimStrength === 'weak'
              ? 'speculative'
              : 'moderate',
        statedTimeframe: extracted.statedTimeframe,
        createdAt: result.videoDate,
        verificationDate: null,
        verificationNotes: null,
        videoTimestampSeconds: extracted.timestampSeconds,
        specificityScore:
          extracted.claimStrength === 'strong' ? 8 : extracted.claimStrength === 'weak' ? 4 : 6,
      });

      resultAdded++;
      totalAdded++;
    }

    extractionLog.push({
      timestamp: new Date().toISOString(),
      creatorId: result.creatorId,
      claimsAdded: resultAdded,
      claimsDeduplicated: resultDeduplicated,
    });
  }

  return { totalAdded, totalDeduplicated };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { creatorId, mode, forceReset } = body;

  // Allow force-resetting the extraction lock
  if (forceReset) {
    isExtracting = false;
    return NextResponse.json({ success: true, message: 'Extraction lock reset' });
  }

  if (isExtracting) {
    return NextResponse.json(
      { error: 'Extraction already in progress' },
      { status: 409 },
    );
  }

  try {
    isExtracting = true;

    if (mode === 'all') {
      const results = await extractClaimsForAllCreators();
      const { totalAdded, totalDeduplicated } = await processExtractedResults(results);

      return NextResponse.json({
        success: true,
        mode: 'all',
        creatorsProcessed: new Set(results.map(r => r.creatorId)).size,
        videosProcessed: results.length,
        claimsAdded: totalAdded,
        claimsDeduplicated: totalDeduplicated,
      });
    }

    if (creatorId) {
      const creator = getCreatorById(creatorId);
      if (!creator) {
        return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
      }

      const channelId = (creator as any).youtubeChannelId;
      if (!channelId) {
        return NextResponse.json(
          { error: 'Creator has no YouTube channel ID' },
          { status: 400 },
        );
      }

      const results = await extractClaimsForCreator(creatorId, channelId);
      const { totalAdded, totalDeduplicated } = await processExtractedResults(results);

      return NextResponse.json({
        success: true,
        creatorId,
        videosProcessed: results.length,
        claimsAdded: totalAdded,
        claimsDeduplicated: totalDeduplicated,
        totalClaimsForCreator: getClaimCountForCreator(creatorId),
      });
    }

    return NextResponse.json(
      { error: 'Provide creatorId or set mode to "all"' },
      { status: 400 },
    );
  } catch (error) {
    console.error('[ClaimVault] Extraction error:', error);
    return NextResponse.json(
      {
        error: 'Extraction failed',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 },
    );
  } finally {
    isExtracting = false;
  }
}

export async function GET() {
  const allCreators = getAllCreators();
  return NextResponse.json({
    isExtracting,
    totalCreators: allCreators.length,
    creatorSummary: allCreators.map(c => ({
      id: c.id,
      name: (c as any).channelName,
      totalClaims: getClaimCountForCreator(c.id),
    })),
    recentExtractions: extractionLog.slice(-20),
  });
}
