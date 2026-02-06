import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

// ─── Get all videos from a YouTube channel ──────────────────────────────────
export async function scrapeChannelVideos(channelHandle: string, maxResults = 50) {
  const run = await client.actor('grow_media/youtube-channel-video-scraper').call({
    channelHandle,
    maxResults,
    videoType: 'long',
    sortOrder: 'latest',
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
}

// ─── Get transcript for specific video URLs ─────────────────────────────────
export async function scrapeTranscripts(videoUrls: string[]) {
  const run = await client.actor('scrape-creators/best-youtube-transcripts-scraper').call({
    videoUrls,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
}

// ─── Full pipeline: channel URL → video list → transcripts ─────────────────
export async function processNewCreator(channelHandle: string) {
  // Step 1: Get all videos from the channel
  console.log(`[ClaimVault] Scraping videos for ${channelHandle}...`);
  const videos = await scrapeChannelVideos(channelHandle);

  // Step 2: Get transcripts for each video
  const videoUrls = videos
    .filter((v: any) => v.url || v.videoUrl)
    .map((v: any) => v.url || v.videoUrl);

  if (videoUrls.length === 0) {
    console.log(`[ClaimVault] No videos found for ${channelHandle}`);
    return { videos: [], transcripts: [] };
  }

  // Process in batches of 10 to avoid overwhelming the API
  const batchSize = 10;
  const allTranscripts: any[] = [];

  for (let i = 0; i < videoUrls.length; i += batchSize) {
    const batch = videoUrls.slice(i, i + batchSize);
    console.log(`[ClaimVault] Fetching transcripts batch ${Math.floor(i / batchSize) + 1}...`);
    const transcripts = await scrapeTranscripts(batch);
    allTranscripts.push(...transcripts);
  }

  return { videos, transcripts: allTranscripts };
}

// ─── Watch for new videos from a channel ────────────────────────────────────
export async function checkForNewVideos(channelHandle: string, lastKnownVideoId?: string) {
  const videos = await scrapeChannelVideos(channelHandle, 10);

  if (!lastKnownVideoId) return videos;

  const newVideos = [];
  for (const video of videos) {
    const videoId = (video as any).videoId || (video as any).id;
    if (videoId === lastKnownVideoId) break;
    newVideos.push(video);
  }

  return newVideos;
}
