import { searchTicker } from '@/lib/db';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''

  if (!q) return NextResponse.json([])

  const matches = await searchTicker(q);
  return NextResponse.json(matches)
}
