import { NextRequest, NextResponse } from 'next/server';
import { psGetCustomer } from '@/lib/prestashop';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!email.trim()) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  const customer = await psGetCustomer(email);
  if (!customer) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  return NextResponse.json(customer);
}
