import { NextRequest, NextResponse } from 'next/server';
import { psSearchProducts, psHomeUrl } from '@/lib/prestashop';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json({ products: [], storeUrl: psHomeUrl() });
  const products = await psSearchProducts(q);
  return NextResponse.json({ products, storeUrl: psHomeUrl() });
}
