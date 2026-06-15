import { NextRequest, NextResponse } from 'next/server';
import { psCreateCart, psCartUrl } from '@/lib/prestashop';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    items?: { productId: number; qty: number }[];
    customerId?: number;
  };
  const items = body.items;
  if (!items?.length) return NextResponse.json({ error: 'Sin artículos' }, { status: 400 });

  const result = await psCreateCart(items, body.customerId);
  if (!result) return NextResponse.json({ cartId: null, cartUrl: psCartUrl(), itemAddUrls: [] });

  return NextResponse.json(result);
}
