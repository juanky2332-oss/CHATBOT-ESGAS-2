import { NextRequest, NextResponse } from 'next/server';
import { psCreateCart, psCartUrl } from '@/lib/prestashop';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { items?: { productId: number; qty: number }[] };
  const items = body.items;
  if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 });
  const result = await psCreateCart(items);
  // If API cart creation fails, still return the cart URL so user can go to PS
  return NextResponse.json(result ?? { cartId: null, cartUrl: psCartUrl() });
}
