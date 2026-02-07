import { execFile } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface TranscriptResult {
  text: string;
  segments: TranscriptSegment[];
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;#39;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const segmentRegex = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  const segments: TranscriptSegment[] = [];
  let match;

  while ((match = segmentRegex.exec(xml)) !== null) {
    const text = decodeHtmlEntities(match[3]);
    if (text) {
      segments.push({
        offset: parseFloat(match[1]),
        duration: parseFloat(match[2]),
        text,
      });
    }
  }

  return segments;
}

function runYtDlp(videoId: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '--write-auto-sub',
      '--sub-lang', 'en',
      '--skip-download',
      '--sub-format', 'srv1',
      '--no-warnings',
      '--quiet',
      '-o', outputPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    execFile('yt-dlp', args, { timeout: 30000 }, (error) => {
      if (error) {
        reject(new Error(`yt-dlp failed for ${videoId}: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Fetch the transcript for a YouTube video using yt-dlp.
 * Returns the full transcript text and individual segments with timestamps.
 */
export async function fetchVideoTranscript(youtubeVideoId: string): Promise<TranscriptResult> {
  const basePath = join(tmpdir(), `claimvault_${youtubeVideoId}_${Date.now()}`);
  const subPath = `${basePath}.en.srv1`;

  try {
    await runYtDlp(youtubeVideoId, basePath);

    const xml = await readFile(subPath, 'utf-8');
    const segments = parseTranscriptXml(xml);
    const text = segments.map((s) => s.text).join(' ');

    return { text, segments };
  } finally {
    // Clean up temp file
    try { await unlink(subPath); } catch {}
  }
}

/**
 * Get recent video IDs for a YouTube channel by parsing its RSS feed.
 */
export async function getRecentVideoIds(channelId: string, limit = 5): Promise<string[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch RSS feed for channel ${channelId}: ${res.status}`);
  }

  const xml = await res.text();

  const videoIdRegex = /<yt:videoId>([^<]+)<\/yt:videoId>/g;
  const videoIds: string[] = [];
  let match;

  while ((match = videoIdRegex.exec(xml)) !== null) {
    videoIds.push(match[1]);
    if (videoIds.length >= limit) break;
  }

  return videoIds;
}
