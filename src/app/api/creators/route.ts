import { NextResponse } from 'next/server';
import { getAllCreators, getCreatorById } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const creator = getCreatorById(id);
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }
    return NextResponse.json(creator);
  }

  const creators = getAllCreators();
  return NextResponse.json(creators);
}
