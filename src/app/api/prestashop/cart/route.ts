import { NextRequest, NextResponse } from 'next/server';
import { psCreateCart } from '@/lib/prestashop';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { items?: { productId: number; qty: number }[] };
  const items = body.items;
  if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 });
  const result = await psCreateCart(items);
  if (!result) return NextResponse.json({ error: 'Cart creation failed' }, { status: 500 });
  return NextResponse.json(result);
}
