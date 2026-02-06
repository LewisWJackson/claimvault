import { NextResponse } from 'next/server';

// In production this would write to the database and trigger the scraping pipeline
// For now, it logs the suggestion and returns success
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channelUrl, note } = body;

    if (!channelUrl) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 });
    }

    // Validate YouTube URL
    const urlPattern = /^https?:\/\/(www\.)?(youtube\.com\/(c\/|channel\/|@)|youtu\.be\/)/;
    if (!urlPattern.test(channelUrl)) {
      return NextResponse.json({ error: 'Please provide a valid YouTube channel URL' }, { status: 400 });
    }

    // In production: save to database, trigger Apify scraping
    console.log('[ClaimVault] New creator suggestion:', { channelUrl, note, timestamp: new Date().toISOString() });

    // TODO: Trigger Apify pipeline
    // const handle = extractHandle(channelUrl);
    // await processNewCreator(handle);

    return NextResponse.json({
      success: true,
      message: 'Creator suggestion received. We will review and begin tracking shortly.',
    });
  } catch (error) {
    console.error('[ClaimVault] Suggestion error:', error);
    return NextResponse.json({ error: 'Failed to process suggestion' }, { status: 500 });
  }
}
