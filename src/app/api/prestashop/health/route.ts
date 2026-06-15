import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PS_BASE = (process.env.PRESTASHOP_URL ?? 'https://b2b.esgas.es').replace(/\/$/, '');
const PS_KEY = process.env.PRESTASHOP_API_KEY ?? '';

function auth() {
  return { Authorization: `Basic ${Buffer.from(`${PS_KEY}:`).toString('base64')}` };
}

async function check(url: string): Promise<'ok' | 'forbidden' | 'error'> {
  try {
    const r = await fetch(url, { headers: { ...auth(), Accept: 'application/json' } });
    if (r.status === 200) return 'ok';
    if (r.status === 401 || r.status === 403) return 'forbidden';
    return 'error';
  } catch {
    return 'error';
  }
}

export async function GET() {
  if (!PS_KEY) return NextResponse.json({ error: 'PRESTASHOP_API_KEY no configurada' }, { status: 500 });

  const [root, products, customers, specificPrices] = await Promise.all([
    check(`${PS_BASE}/api?output_format=JSON`),
    check(`${PS_BASE}/api/products?limit=1&output_format=JSON`),
    check(`${PS_BASE}/api/customers?limit=1&output_format=JSON`),
    check(`${PS_BASE}/api/specific_prices?limit=1&output_format=JSON`),
  ]);

  // Test cart creation with a minimal cart
  let cartsWrite: 'ok' | 'forbidden' | 'error' = 'error';
  try {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id_currency>1</id_currency>
    <id_lang>1</id_lang>
  </cart>
</prestashop>`;
    const r = await fetch(`${PS_BASE}/api/carts`, {
      method: 'POST',
      headers: { ...auth(), 'Content-Type': 'application/xml', Accept: 'application/json' },
      body: xml,
    });
    // 201/200 = created, 400 = permission exists but request was invalid, 404 = PS can parse but not found
    if (r.status === 201 || r.status === 200) cartsWrite = 'ok';
    else if (r.status === 400 || r.status === 404) cartsWrite = 'ok';
    else if (r.status === 401 || r.status === 403) cartsWrite = 'forbidden';
  } catch { cartsWrite = 'error'; }

  return NextResponse.json({
    base: PS_BASE,
    key_configured: !!PS_KEY,
    permissions: {
      api_root: root,
      products_read: products,
      customers_read: customers,
      specific_prices_read: specificPrices,
      carts_write: cartsWrite,
    },
    all_ok: [root, products, customers, specificPrices, cartsWrite].every((s) => s === 'ok'),
  });
}
