const PS_BASE = (process.env.PRESTASHOP_URL ?? 'https://esgas.nodoflow.com/JuanCarlos').replace(/\/$/, '');
const PS_KEY = process.env.PRESTASHOP_API_KEY ?? '';

export const PS_STORE_BASE = PS_BASE;

export function psSearchUrl(ref: string) {
  return `${PS_BASE}/index.php?controller=search&s=${encodeURIComponent(ref)}`;
}

export function psProductUrl(id: number) {
  return `${PS_BASE}/index.php?id_product=${id}&controller=product`;
}

export function psCartUrl() {
  return `${PS_BASE}/index.php?controller=order`;
}

function psAuth(): Record<string, string> {
  if (!PS_KEY) return {};
  return { Authorization: `Basic ${Buffer.from(`${PS_KEY}:`).toString('base64')}` };
}

export interface PSProduct {
  id: number;
  name: string;
  reference: string;
  price: number;
  stock: number;
  productUrl: string;
  searchUrl: string;
}

function extractLangValue(field: unknown): string {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return (field as { value?: string }[])[0]?.value ?? '';
  if (typeof field === 'object' && field !== null)
    return Object.values(field as Record<string, string>)[0] ?? '';
  return '';
}

async function psGetStock(productId: number): Promise<number> {
  try {
    const res = await fetch(
      `${PS_BASE}/api/stock_availables?filter[id_product]=${productId}&display=[quantity]&output_format=JSON`,
      { headers: { ...psAuth(), Accept: 'application/json' } }
    );
    if (!res.ok) return -1;
    const json = (await res.json()) as { stock_availables?: { quantity: string }[] };
    const items = json.stock_availables ?? [];
    return items.length ? parseInt(items[0].quantity, 10) : 0;
  } catch {
    return -1;
  }
}

async function enrichProduct(p: {
  id: number;
  name: unknown;
  reference: string;
  price: string;
}): Promise<PSProduct> {
  const stock = await psGetStock(p.id);
  return {
    id: p.id,
    name: extractLangValue(p.name),
    reference: p.reference,
    price: parseFloat(p.price) || 0,
    stock,
    productUrl: psProductUrl(p.id),
    searchUrl: psSearchUrl(p.reference),
  };
}

export async function psSearchProducts(query: string): Promise<PSProduct[]> {
  if (!PS_KEY || !query.trim()) return [];
  const enc = encodeURIComponent(query.trim());

  for (const filter of [
    `filter[reference]=[%25${enc}%25]`,
    `filter[name]=[%25${enc}%25]`,
  ]) {
    try {
      const res = await fetch(
        `${PS_BASE}/api/products?display=[id,name,reference,price]&${filter}&output_format=JSON`,
        { headers: { ...psAuth(), Accept: 'application/json' } }
      );
      if (!res.ok) continue;
      const json = (await res.json()) as {
        products?: { id: number; name: unknown; reference: string; price: string }[];
      };
      const raw = json.products ?? [];
      if (!raw.length) continue;
      return Promise.all(raw.slice(0, 6).map(enrichProduct));
    } catch {
      continue;
    }
  }
  return [];
}

export async function psCreateCart(
  items: { productId: number; qty: number }[]
): Promise<{ cartId: string; cartUrl: string } | null> {
  if (!PS_KEY || !items.length) return null;
  try {
    const rows = items
      .map(
        (i) => `<cart_row>
        <id_product>${i.productId}</id_product>
        <id_product_attribute>0</id_product_attribute>
        <id_address_delivery>0</id_address_delivery>
        <quantity>${i.qty}</quantity>
      </cart_row>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id_currency>1</id_currency>
    <id_lang>1</id_lang>
    <cart_rows>${rows}</cart_rows>
  </cart>
</prestashop>`;

    const res = await fetch(`${PS_BASE}/api/carts`, {
      method: 'POST',
      headers: { ...psAuth(), 'Content-Type': 'application/xml', Accept: 'application/json' },
      body: xml,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { cart?: { id: number } };
    const cartId = String(json.cart?.id ?? '');
    if (!cartId) return null;
    return { cartId, cartUrl: psCartUrl() };
  } catch {
    return null;
  }
}
