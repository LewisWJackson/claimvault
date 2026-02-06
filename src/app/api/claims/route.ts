import { NextResponse } from 'next/server';
import { getClaimsWithCreators } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;
  const creatorId = searchParams.get('creatorId') || undefined;

  const claims = getClaimsWithCreators({ status, category, creatorId });
  return NextResponse.json(claims);
}
