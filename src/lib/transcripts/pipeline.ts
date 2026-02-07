import { fetchVideoTranscript, getRecentVideoIds } from './fetcher';
import { extractClaimsFromTranscript, type ExtractedClaim } from './extractor';
import { getAllCreators } from '@/lib/db';

export interface ExtractedClaimResult {
  creatorId: string;
  videoId: string;
  videoTitle: string;
  videoDate: string;
  claims: ExtractedClaim[];
  error?: string;
}

const DELAY_BETWEEN_CALLS_MS = 15000; // 15s between API calls for rate limiting

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract claims for a single creator by fetching their recent videos,
 * getting transcripts, and running AI claim extraction.
 * Returns a flat array of results, one per video.
 */
export async function extractClaimsForCreator(
  creatorId: string,
  channelId: string,
  limit = 3,
): Promise<ExtractedClaimResult[]> {
  const creator = getAllCreators().find((c) => c.id === creatorId);
  const channelName = creator?.channelName || creatorId;

  console.log(`[CreatorClaim] Extracting claims for ${channelName} (${channelId})...`);

  let videoIds: string[];
  try {
    videoIds = await getRecentVideoIds(channelId, limit);
  } catch (err) {
    console.error(`[CreatorClaim] Failed to fetch video IDs for ${channelName}:`, err);
    return [];
  }

  if (videoIds.length === 0) {
    console.log(`[CreatorClaim] No videos found for ${channelName}`);
    return [];
  }

  console.log(`[CreatorClaim] Found ${videoIds.length} videos for ${channelName}`);

  const results: ExtractedClaimResult[] = [];

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    console.log(`[CreatorClaim]   Processing video ${i + 1}/${videoIds.length}: ${videoId}`);

    try {
      const transcript = await fetchVideoTranscript(videoId);

      if (!transcript.text || transcript.text.trim().length < 100) {
        console.log(`[CreatorClaim]   Skipping ${videoId} — transcript too short or empty`);
        results.push({
          creatorId,
          videoId,
          videoTitle: 'Unknown',
          videoDate: new Date().toISOString().split('T')[0],
          claims: [],
          error: 'Transcript too short or unavailable',
        });
        continue;
      }

      const videoDate = new Date().toISOString().split('T')[0];
      const videoTitle = `Video ${videoId}`;

      const claims = await extractClaimsFromTranscript(
        transcript.text,
        creatorId,
        videoId,
        videoTitle,
        videoDate,
      );

      results.push({ creatorId, videoId, videoTitle, videoDate, claims });
      console.log(`[CreatorClaim]   Extracted ${claims.length} claims from ${videoId}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[CreatorClaim]   Error processing ${videoId}:`, errMsg);
      results.push({
        creatorId,
        videoId,
        videoTitle: 'Unknown',
        videoDate: new Date().toISOString().split('T')[0],
        claims: [],
        error: errMsg,
      });
    }

    // Rate limit between API calls
    if (i < videoIds.length - 1) {
      await delay(DELAY_BETWEEN_CALLS_MS);
    }
  }

  const totalClaims = results.reduce((sum, r) => sum + r.claims.length, 0);
  console.log(`[CreatorClaim] Finished ${channelName}: ${totalClaims} claims from ${results.length} videos`);

  return results;
}

/**
 * Run claim extraction for all tracked creators.
 * Returns a flat array of video results across all creators.
 */
export async function extractClaimsForAllCreators(
  videosPerCreator = 3,
): Promise<ExtractedClaimResult[]> {
  const creators = getAllCreators();
  const allResults: ExtractedClaimResult[] = [];

  console.log(`[CreatorClaim] Starting claim extraction for ${creators.length} creators...`);

  for (const creator of creators) {
    const channelId = (creator as any).youtubeChannelId;
    if (!channelId) {
      console.log(`[CreatorClaim] Skipping ${creator.channelName} — no channel ID`);
      continue;
    }

    const results = await extractClaimsForCreator(creator.id, channelId, videosPerCreator);
    allResults.push(...results);

    // Delay between creators
    await delay(DELAY_BETWEEN_CALLS_MS);
  }

  const totalClaims = allResults.reduce((sum, r) => sum + r.claims.length, 0);
  console.log(`[CreatorClaim] Extraction complete: ${totalClaims} total claims from ${allResults.length} videos`);

  return allResults;
}
