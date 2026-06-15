const PS_BASE = (process.env.PRESTASHOP_URL ?? 'https://b2b.esgas.es').replace(/\/$/, '');
const PS_KEY = process.env.PRESTASHOP_API_KEY ?? '';

export const PS_STORE_URL = PS_BASE;

export function psProductUrl(id: number) {
  return `${PS_BASE}/index.php?id_product=${id}&controller=product`;
}

export function psCartUrl() {
  return `${PS_BASE}/carrito?action=show`;
}

export function psHomeUrl() {
  return `${PS_BASE}/`;
}

function psAuth(): Record<string, string> {
  if (!PS_KEY) return {};
  return { Authorization: `Basic ${Buffer.from(`${PS_KEY}:`).toString('base64')}` };
}

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface PSProduct {
  id: number;
  name: string;
  reference: string;
  price: number;
  originalPrice: number;
  discountPct: number | null;
  stock: number;
  productUrl: string;
}

export interface PSCustomer {
  id: number;
  groupId: number;
  firstName: string;
  lastName: string;
  email: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

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
    if (!items.length) return 0;
    return items.reduce((sum, s) => sum + parseInt(s.quantity, 10), 0);
  } catch {
    return -1;
  }
}

async function psGetBestSpecificPrice(
  productId: number,
  basePrice: number,
  groupId?: number
): Promise<{ price: number; discountPct: number | null }> {
  try {
    const res = await fetch(
      `${PS_BASE}/api/specific_prices?filter[id_product]=[${productId}]&display=full&output_format=JSON`,
      { headers: { ...psAuth(), Accept: 'application/json' } }
    );
    if (!res.ok) return { price: basePrice, discountPct: null };
    const json = (await res.json()) as {
      specific_prices?: Array<{
        price: string;
        reduction: string;
        reduction_type: string;
        from_quantity: string;
        id_customer: string;
        id_group: string;
      }>;
    };

    const items = (json.specific_prices ?? []).filter((sp) => {
      const spCustomer = parseInt(sp.id_customer, 10);
      const spGroup = parseInt(sp.id_group ?? '0', 10);
      const fromQty = parseInt(sp.from_quantity, 10);
      if (spCustomer !== 0) return false; // skip individual customer prices
      if (fromQty > 1) return false;      // must apply from qty 1
      // Accept: applies to all groups (0) OR to the customer's specific group
      return spGroup === 0 || (groupId !== undefined && spGroup === groupId);
    });

    if (!items.length) return { price: basePrice, discountPct: null };

    // Prefer the rule matching the customer's group over the generic one
    items.sort((a, b) => {
      const aGroup = parseInt(a.id_group ?? '0', 10);
      const bGroup = parseInt(b.id_group ?? '0', 10);
      if (groupId !== undefined) {
        if (aGroup === groupId && bGroup !== groupId) return -1;
        if (bGroup === groupId && aGroup !== groupId) return 1;
      }
      // Then by highest reduction
      return parseFloat(b.reduction) - parseFloat(a.reduction);
    });

    const best = items[0];

    // Fixed price (price field > 0 means it's a fixed price, not "use base - reduction")
    const fixedPrice = parseFloat(best.price);
    if (fixedPrice > 0) {
      const pct = basePrice > 0 ? 1 - fixedPrice / basePrice : null;
      return {
        price: Math.round(fixedPrice * 100) / 100,
        discountPct: pct !== null && pct > 0 ? pct : null,
      };
    }

    if (best.reduction_type === 'percentage') {
      const pct = parseFloat(best.reduction);
      return {
        price: Math.round(basePrice * (1 - pct) * 100) / 100,
        discountPct: pct,
      };
    }

    if (best.reduction_type === 'amount') {
      const amt = parseFloat(best.reduction);
      const finalPrice = Math.max(0, Math.round((basePrice - amt) * 100) / 100);
      const pct = basePrice > 0 ? (basePrice - finalPrice) / basePrice : null;
      return { price: finalPrice, discountPct: pct && pct > 0 ? pct : null };
    }

    return { price: basePrice, discountPct: null };
  } catch {
    return { price: basePrice, discountPct: null };
  }
}

async function enrichProduct(
  p: { id: number; name: unknown; reference: string; price: string },
  groupId?: number
): Promise<PSProduct> {
  const basePrice = parseFloat(p.price) || 0;
  const [stock, { price, discountPct }] = await Promise.all([
    psGetStock(p.id),
    psGetBestSpecificPrice(p.id, basePrice, groupId),
  ]);
  return {
    id: p.id,
    name: extractLangValue(p.name),
    reference: p.reference,
    price,
    originalPrice: basePrice,
    discountPct,
    stock,
    productUrl: psProductUrl(p.id),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function psGetCustomer(email: string): Promise<PSCustomer | null> {
  if (!PS_KEY || !email.trim()) return null;
  try {
    const enc = encodeURIComponent(email.trim().toLowerCase());
    const res = await fetch(
      `${PS_BASE}/api/customers?filter[email]=[${enc}]&display=[id,id_default_group,firstname,lastname,email]&output_format=JSON`,
      { headers: { ...psAuth(), Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      customers?: Array<{
        id: number;
        id_default_group: string;
        firstname: string;
        lastname: string;
        email: string;
      }>;
    };
    const c = json.customers?.[0];
    if (!c) return null;
    return {
      id: c.id,
      groupId: parseInt(c.id_default_group, 10),
      firstName: c.firstname,
      lastName: c.lastname,
      email: c.email,
    };
  } catch {
    return null;
  }
}

export async function psSearchProducts(query: string, groupId?: number): Promise<PSProduct[]> {
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
      return Promise.all(raw.slice(0, 6).map((p) => enrichProduct(p, groupId)));
    } catch {
      continue;
    }
  }
  return [];
}

export function psAddToCartUrl(productId: number, qty: number = 1): string {
  // back param redirects to the cart page after PS processes the add-to-cart
  const back = encodeURIComponent('/carrito?action=show');
  return `${PS_BASE}/index.php?controller=cart&add=1&id_product=${productId}&id_product_attribute=0&qty=${qty}&action=add&back=${back}`;
}

export async function psCreateCart(
  items: { productId: number; qty: number }[],
  customerId?: number
): Promise<{ cartId: string; cartUrl: string; itemAddUrls: string[] } | null> {
  if (!PS_KEY || !items.length) return null;

  const itemAddUrls = items.map((i) => psAddToCartUrl(i.productId, i.qty));

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

    const customerXml = customerId ? `<id_customer>${customerId}</id_customer>` : '';

    // cart_rows must be inside <associations> in the PS WS API
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id_currency>1</id_currency>
    <id_lang>1</id_lang>
    ${customerXml}
    <associations>
      <cart_rows>${rows}</cart_rows>
    </associations>
  </cart>
</prestashop>`;

    const res = await fetch(`${PS_BASE}/api/carts`, {
      method: 'POST',
      headers: { ...psAuth(), 'Content-Type': 'application/xml', Accept: 'application/json' },
      body: xml,
    });
    if (!res.ok) return { cartId: '', cartUrl: psCartUrl(), itemAddUrls };

    const json = (await res.json()) as { cart?: { id: number; secure_key?: string } };
    const cartId = String(json.cart?.id ?? '');
    const secureKey = json.cart?.secure_key ?? '';
    if (!cartId) return { cartId: '', cartUrl: psCartUrl(), itemAddUrls };

    // Always use the recovery URL so PS loads this specific WS cart into the customer's browser session.
    // Without it, opening /carrito shows the session's old cart, not the one we just created.
    const cartUrl = secureKey
      ? `${PS_BASE}/index.php?controller=order&recover_cart=${cartId}&token_cart=${secureKey}`
      : psCartUrl();

    return { cartId, cartUrl, itemAddUrls };
  } catch {
    return { cartId: '', cartUrl: psCartUrl(), itemAddUrls };
  }
}
