import { NextRequest, NextResponse } from 'next/server';
import { psSearchProducts, psSearchUrl } from '@/lib/prestashop';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json([]);
  const products = await psSearchProducts(q);
  // Always return the correct search URL even when API finds nothing
  return NextResponse.json({
    products,
    searchUrl: psSearchUrl(q),
  });
}
