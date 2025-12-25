import { NextResponse } from 'next/server'
import Dataset from '@/lib/dataset'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim().toLowerCase() || ''

  if (!q) return NextResponse.json([])

  const matches = Dataset.filter(d => d.ticker.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
    .slice(0, 5)
    .map(d => ({ ticker: d.ticker, name: d.name }))

  return NextResponse.json(matches)
}
