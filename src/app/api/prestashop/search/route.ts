import { NextRequest, NextResponse } from 'next/server';
import { psSearchProducts, psHomeUrl } from '@/lib/prestashop';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const groupIdParam = req.nextUrl.searchParams.get('groupId');
  const groupId = groupIdParam ? parseInt(groupIdParam, 10) : undefined;

  if (!q.trim()) return NextResponse.json({ products: [], storeUrl: psHomeUrl() });
  const products = await psSearchProducts(q, groupId);
  return NextResponse.json({ products, storeUrl: psHomeUrl() });
}
