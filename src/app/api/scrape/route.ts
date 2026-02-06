import { NextResponse } from 'next/server';
import { scrapeChannelVideos, scrapeTranscripts, processNewCreator } from '@/lib/apify';

// POST /api/scrape — Trigger scraping for a channel
// This is an admin/internal endpoint for triggering the scraping pipeline
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channelHandle, action } = body;

    // Simple API key check (in production, use proper auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SCRAPE_API_KEY || 'dev-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!channelHandle) {
      return NextResponse.json({ error: 'channelHandle is required' }, { status: 400 });
    }

    switch (action) {
      case 'full': {
        // Full pipeline: get videos + transcripts
        console.log(`[ClaimVault] Starting full pipeline for ${channelHandle}`);
        const result = await processNewCreator(channelHandle);
        return NextResponse.json({
          success: true,
          videosFound: result.videos.length,
          transcriptsFetched: result.transcripts.length,
        });
      }

      case 'videos': {
        // Just get video list
        console.log(`[ClaimVault] Fetching videos for ${channelHandle}`);
        const videos = await scrapeChannelVideos(channelHandle);
        return NextResponse.json({ success: true, videos });
      }

      case 'transcripts': {
        // Get transcripts for specific video URLs
        const { videoUrls } = body;
        if (!videoUrls || !Array.isArray(videoUrls)) {
          return NextResponse.json({ error: 'videoUrls array required for transcript action' }, { status: 400 });
        }
        console.log(`[ClaimVault] Fetching transcripts for ${videoUrls.length} videos`);
        const transcripts = await scrapeTranscripts(videoUrls);
        return NextResponse.json({ success: true, transcripts });
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: full, videos, or transcripts' }, { status: 400 });
    }
  } catch (error) {
    console.error('[ClaimVault] Scraping error:', error);
    return NextResponse.json({
      error: 'Scraping failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
