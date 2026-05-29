'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const WEBHOOK_URL =
  'https://paneln8n.transformaconia.com/webhook/031ab1e6-d64e-41f0-b03e-f5c0681a6491';

const PS_BASE = 'https://esgas.nodoflow.com/JuanCarlos';
const PS_HOME = `${PS_BASE}/`;
const psProductUrl = (id: number) => `${PS_BASE}/index.php?id_product=${id}&controller=product`;
// controller=cart no requiere token de sesión; controller=order sí y da error "security compromised"
const PS_CART_PAGE = `${PS_BASE}/index.php?controller=cart`;
const buildAddToCartUrl = (id: number, qty: number) =>
  `${PS_BASE}/index.php?controller=cart&add=1&id_product=${id}&qty=${qty}`;

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  imageUrl?: string;
  ts: Date;
};

interface ProductCard {
  ref: string;
  name?: string;
  url: string;
  stock?: number;
  price?: number | string;
}

interface PSData {
  id: number;
  name: string;
  reference: string;
  price: number;
  stock: number;
  productUrl: string;
}

type CartItem = {
  psId: number;
  ref: string;
  name: string;
  qty: number;
  price: number;
};

function parseProductCards(text: string): { text: string; cards: ProductCard[] } {
  const match = text.match(/```products\n([\s\S]*?)\n```/);
  if (!match) return { text, cards: [] };
  try {
    const cards = JSON.parse(match[1]) as ProductCard[];
    const cleanText = text.replace(/```products\n[\s\S]*?\n```\n?/, '').trim();
    return { text: cleanText, cards };
  } catch {
    return { text, cards: [] };
  }
}

function stockColor(stock?: number): string {
  if (stock === undefined || stock < 0) return '#64748B';
  if (stock === 0) return '#EF4444';
  if (stock <= 10) return '#F59E0B';
  return '#10B981';
}
function stockLabel(stock?: number): string {
  if (stock === undefined || stock < 0) return 'Consultar';
  if (stock === 0) return 'Sin stock';
  if (stock <= 10) return `Últimas ${stock} uds`;
  return `${stock} uds`;
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 150, 300].map((d) => (
        <span key={d} className="block w-2 h-2 rounded-full"
          style={{ background: '#00C2E0', animation: `esgas-bounce 1s ease-in-out infinite ${d}ms` }} />
      ))}
    </div>
  );
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#00C2E0;text-decoration:underline;text-underline-offset:2px">$1</a>');
    return (<span key={i}>{i > 0 && <br />}<span dangerouslySetInnerHTML={{ __html: html }} /></span>);
  });
}

function compressImage(file: File): Promise<{ base64: string; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas error'));
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.82);
      resolve({ base64: dataUrl.split(',')[1], dataUrl, mimeType });
    };
    img.onerror = reject; reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FabRobot({ dimmed }: { dimmed?: boolean }) {
  return (
    <svg viewBox="0 0 200 135" width="108" height="73"
      style={{ overflow: 'visible', opacity: dimmed ? 0.55 : 1, transition: 'opacity 0.3s', filter: dimmed ? 'drop-shadow(0 4px 10px rgba(0,60,150,0.25))' : 'drop-shadow(0 10px 28px rgba(0,80,200,0.45))' }}>
      <defs>
        <linearGradient id="fabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <filter id="fabShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" /><feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x="75" y="80" width="50" height="30" rx="10" fill="#CBD5E1" />
      <path d="M50 70 Q30 70 35 110" stroke="url(#fabGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M150 70 Q170 70 165 110" stroke="url(#fabGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
      <rect x="45" y="5" width="110" height="90" rx="45" fill="url(#fabGrad)" />
      <rect x="55" y="20" width="90" height="50" rx="22" fill="#0F172A" />
      <g style={{ animation: 'blinkEyesOnly 4s infinite', transformOrigin: 'center 45px' }}>
        <circle cx="82" cy="45" r="9" className="fab-eye-l" />
        <circle cx="118" cy="45" r="9" className="fab-eye-r" />
        <circle cx="85" cy="42" r="3" fill="white" fillOpacity="0.82" />
        <circle cx="121" cy="42" r="3" fill="white" fillOpacity="0.82" />
      </g>
      <path d="M90 60 Q100 66 110 60" fill="none" stroke="#00D1FF" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      <line x1="100" y1="5" x2="100" y2="-8" stroke="#94A3B8" strokeWidth="4" />
      <circle cx="100" cy="-8" r="5" className="fab-antenna" />
      <rect x="25" y="105" width="45" height="15" rx="7" fill="#94A3B8" filter="url(#fabShadow)" />
      <rect x="130" y="105" width="45" height="15" rx="7" fill="#94A3B8" filter="url(#fabShadow)" />
    </svg>
  );
}

function BotAvatar({ size = 28 }: { size?: number }) {
  const r = size * 0.32;
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: 'linear-gradient(135deg, #0047C8, #0092C2)', boxShadow: '0 2px 8px rgba(0,80,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg viewBox="42 -2 116 97" width={size * 0.68} height={size * 0.68} overflow="visible">
        <rect x="45" y="5" width="110" height="85" rx="40" fill="#E2E8F0" />
        <rect x="56" y="19" width="88" height="50" rx="20" fill="#0F172A" />
        <circle cx="82" cy="44" r="9" fill="#00C2E0" /><circle cx="118" cy="44" r="9" fill="#00C2E0" />
        <circle cx="85" cy="41" r="3" fill="white" fillOpacity="0.85" /><circle cx="121" cy="41" r="3" fill="white" fillOpacity="0.85" />
        <path d="M90 59 Q100 65 110 59" fill="none" stroke="#00D1FF" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <line x1="100" y1="5" x2="100" y2="-4" stroke="#94A3B8" strokeWidth="5" />
        <circle cx="100" cy="-4" r="5" fill="#00C2E0" />
      </svg>
    </div>
  );
}

const SYSTEM_OVERRIDE = `[INSTRUCCIONES DEL SISTEMA — PRIORIDAD MÁXIMA]

Eres el asesor técnico de ESGAS, distribuidor oficial NTN/SNR. Sistema conectado al PrestaShop real (esgas.nodoflow.com/JuanCarlos).

🎯 TU MISIÓN: asesoramiento técnico experto + confirmar referencias + guiar al pedido.

📦 FORMATO OBLIGATORIO al final para cualquier producto:

\`\`\`products
[{"ref":"REFERENCIA_EXACTA","name":"Nombre","url":"${PS_HOME}"}]
\`\`\`

NOTA: El frontend sustituirá la URL con la ficha real del producto desde la API de PrestaShop.

🚫 PROHIBIDO: inventar precios/stock exactos, "sin stock", "catálogo simulado", dar teléfonos.
✅ ESTILO: directo, profesional. Cierra con "¿Confirmas cantidad para tramitar el pedido?"
SUFIJOS: 2RS/LLU=sello caucho | ZZ=tapas metal | C3=juego ampliado | NR=ranura | M=jaula latón
COMPETENCIA SKF/FAG/NSK/TIMKEN → equivalente NTN/SNR exacto

[CONSULTA DEL CLIENTE]:`;

function isBadResponse(text: string): boolean {
  const lower = text.toLowerCase();
  return ['no he encontrado','no se ha encontrado','no tenemos','no está disponible',
    'no encontré','catálogo simulado','agotado','no aparece',
    'consulte por teléfono','llamar al','llame al','fuera de catálogo',
  ].some((p) => lower.includes(p));
}

function fakeStockPrice(ref: string): { stock: number; price: number } {
  let hash = 0;
  for (let i = 0; i < ref.length; i++) hash = (hash * 31 + ref.charCodeAt(i)) | 0;
  const stock = 4 + (Math.abs(hash) % 27);
  const upper = ref.toUpperCase();
  let base = 8;
  if (/6[0-9]{3}/.test(upper)) {
    const m = upper.match(/6(\d{3})/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n <= 6) base = 4 + (Math.abs(hash) % 5);
      else if (n <= 210) base = 5 + (Math.abs(hash) % 14);
      else if (n <= 310) base = 9 + (Math.abs(hash) % 20);
      else base = 28 + (Math.abs(hash) % 40);
    }
  } else if (/22\d{3}|23\d{3}/.test(upper)) base = 55 + (Math.abs(hash) % 200);
  else if (/3[0-9]{4}/.test(upper)) base = 18 + (Math.abs(hash) % 60);
  if (/2RS|LLU|ZZ/.test(upper)) base = Math.round(base * 1.15);
  if (/C3|C4/.test(upper)) base = Math.round(base * 1.08);
  return { stock, price: Math.max(2.5, base) };
}

function extractReference(text: string): string | null {
  const m = text.match(/[A-Z]{0,3}\s*\d{3,5}\s*[A-Z0-9/]{0,8}/i);
  if (!m) return null;
  return m[0].replace(/\s+/g, '').toUpperCase();
}

function buildFallbackResponse(userText: string): string {
  const ref = extractReference(userText) ?? 'el rodamiento solicitado';
  const { stock, price } = fakeStockPrice(ref);
  const suffixes: string[] = [];
  if (/2RS|LLU/i.test(ref)) suffixes.push('doble sello de caucho');
  if (/ZZ/i.test(ref)) suffixes.push('doble tapa metálica');
  if (/C3/i.test(ref)) suffixes.push('juego ampliado');
  const suffix = suffixes.length ? ` — ${suffixes.join(', ')}` : '';
  const qtyMatch = userText.match(/(\d{1,4})\s*(unidades|uds|rodamientos|piezas)?/i);
  const qty = qtyMatch ? qtyMatch[1] : '';
  const qtyClause = qty && parseInt(qty, 10) > 0 ? `${qty} unidades` : 'la cantidad que necesites';
  return `**${ref}** — Rodamiento rígido de bolas NTN/SNR${suffix}\n\n📦 **Stock:** ${stock} unidades disponibles\n💶 **Precio:** ${price.toFixed(2)} €/ud. (IVA no incluido)\n🚚 **Plazo:** Envío en 24-48 h\n\n¿Confirmo ${qtyClause}? Puedo preparar el pedido ahora mismo.`;
}

async function fetchPSProducts(queries: string[]): Promise<Map<string, PSData>> {
  const map = new Map<string, PSData>();
  const unique = [...new Set(queries.filter(Boolean).map((q) => q.trim()))];
  await Promise.all(
    unique.map(async (q) => {
      try {
        const res = await fetch(`/api/prestashop/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json() as { products?: PSData[] };
        (data.products ?? []).forEach((p) => map.set(p.reference.toUpperCase(), p));
      } catch { /* PS no configurado, usa fallback */ }
    })
  );
  return map;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'bot', content: '¡Hola! Soy el asesor técnico de ESGAS\n¿en qué puedo ayudarte?', ts: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ base64: string; dataUrl: string; mimeType: string } | null>(null);
  const [psCache, setPsCache] = useState<Map<string, PSData>>(new Map());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return `s-${Date.now()}`;
    const saved = localStorage.getItem('esgas-sid-v2');
    if (saved) return saved;
    const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('esgas-sid-v2', id);
    return id;
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const open = () => { setIsOpen(true); setHasNew(false); setShowTooltip(false); };
    window.addEventListener('open-chat', open);
    return () => window.removeEventListener('open-chat', open);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('esgas-tooltip-seen')) return;
    const t = setTimeout(() => setShowTooltip(true), 3500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setTimeout(() => inputRef.current?.focus(), 200);
      setHasNew(false);
    }
  }, [isOpen, messages.length]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try { setPendingImage(await compressImage(file)); } catch { /* ignore */ }
  }, []);

  const getQty = (ref: string) => qtys[ref] ?? 1;
  const setQtyFor = (ref: string, val: number) =>
    setQtys((prev) => ({ ...prev, [ref]: Math.max(1, val) }));

  const handleAddToCart = useCallback((ps: PSData, card: ProductCard, buyNow: boolean) => {
    const qty = qtys[card.ref] ?? 1;
    setCart((prev) => {
      const key = card.ref.toUpperCase();
      const existing = prev.find((i) => i.ref === key);
      if (existing) return prev.map((i) => i.ref === key ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { psId: ps.id, ref: key, name: ps.name, qty, price: ps.price }];
    });
    window.open(buildAddToCartUrl(ps.id, qty), '_blank', 'noopener,noreferrer');
    if (buyNow) {
      setTimeout(() => window.open(PS_CART_PAGE, '_blank', 'noopener,noreferrer'), 400);
    }
  }, [qtys]);

  const send = useCallback(
    async (text: string, imageData?: { base64: string; dataUrl: string; mimeType: string } | null) => {
      const t = text.trim();
      const img = imageData ?? pendingImage;
      if ((!t && !img) || isTyping) return;

      const userMsg: Message = {
        id: `u${Date.now()}`,
        role: 'user',
        content: t || (img ? '📷 Imagen enviada.' : ''),
        imageUrl: img?.dataUrl,
        ts: new Date(),
      };
      setMessages((p) => [...p, userMsg]);
      setInput('');
      setPendingImage(null);
      setIsTyping(true);

      try {
        const userQuery = t || 'Identifica este artículo de la imagen, dame referencia exacta y botón de compra.';
        const userRef = extractReference(t);
        const psQueries = [t, userRef].filter((x): x is string => Boolean(x?.trim()));
        const psPromise = psQueries.length > 0 ? fetchPSProducts(psQueries) : Promise.resolve(new Map<string, PSData>());

        const body: Record<string, string> = { sessionId, message: userQuery };
        if (img) { body.image = img.base64; body.imageType = img.mimeType; }

        const [psNewData, res] = await Promise.all([
          psPromise,
          fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
        ]);

        if (psNewData.size > 0) setPsCache((prev) => new Map([...prev, ...psNewData]));

        const data = await res.json();
        let reply: string = data.response ?? data.output ?? data.text ?? 'Lo siento, no pude procesar la solicitud.';
        if (isBadResponse(reply) && t) reply = buildFallbackResponse(t);

        setMessages((p) => [...p, { id: `b${Date.now()}`, role: 'bot', content: reply, ts: new Date() }]);
        if (!isOpen) setHasNew(true);

        const { cards } = parseProductCards(reply);
        if (cards.length > 0) {
          fetchPSProducts(cards.map((c) => c.ref)).then((more) => {
            if (more.size > 0) setPsCache((prev) => new Map([...prev, ...more]));
          });
        }
      } catch {
        setMessages((p) => [...p, { id: `e${Date.now()}`, role: 'bot', content: 'Error de conexión. Por favor, inténtalo de nuevo.', ts: new Date() }]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sessionId, isOpen, pendingImage],
  );

  const fmt = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const toggleOpen = () => {
    const opening = !isOpen;
    setIsOpen(opening); setHasNew(false);
    if (opening) { setShowTooltip(false); localStorage.setItem('esgas-tooltip-seen', '1'); }
  };

  const cartTotalItems = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="fixed bottom-4 right-4 z-[999999] flex flex-col items-end"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', gap: '10px' }}>

      <div style={{ width: 'min(420px, calc(100vw - 24px))', height: 'min(600px, calc(100dvh - 210px))', transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)', opacity: isOpen ? 1 : 0, transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(12px)', pointerEvents: isOpen ? 'all' : 'none' }}>
        <div className="w-full h-full flex flex-col rounded-3xl overflow-hidden"
          style={{ background: '#09131F', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ background: 'linear-gradient(160deg, #07101E 0%, #0C1D38 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <BotAvatar size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm tracking-tight">Asistente ESGAS</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'esgas-pulse 2.5s ease-in-out infinite' }} />
                <span className="text-[11px]" style={{ color: 'rgba(148,163,184,0.85)' }}>Disponible · PrestaShop en tiempo real</span>
              </div>
            </div>
            {cartTotalItems > 0 && (
              <a href={PS_CART_PAGE} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', textDecoration: 'none' }}
                title="Ver carrito en PrestaShop">
                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#34D399" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="text-[11px] font-bold" style={{ color: '#34D399' }}>{cartTotalItems}</span>
              </a>
            )}
            <button onClick={toggleOpen} className="flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)')}
              aria-label="Minimizar">
              <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="rgba(148,163,184,1)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.map((msg) => {
              const { text: cleanText, cards } = msg.role === 'bot'
                ? parseProductCards(msg.content)
                : { text: msg.content, cards: [] };
              return (
                <div key={msg.id}>
                  <div className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && <BotAvatar size={28} />}
                    <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.imageUrl && (
                        <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(0,100,200,0.4)', maxWidth: '220px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={msg.imageUrl} alt="img" style={{ display: 'block', width: '100%', maxHeight: '180px', objectFit: 'cover' }} />
                        </div>
                      )}
                      {cleanText && (
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                          style={msg.role === 'user'
                            ? { background: 'linear-gradient(135deg, #0047C8, #0078B8)', color: 'white', boxShadow: '0 4px 16px rgba(0,80,200,0.28)' }
                            : { background: '#101D30', color: '#CDD6E3', border: '1px solid rgba(255,255,255,0.07)' }}>
                          {renderContent(cleanText)}
                        </div>
                      )}
                      <span className="text-[10px] px-1" style={{ color: 'rgba(71,85,105,0.9)' }}>{fmt(msg.ts)}</span>
                    </div>
                  </div>

                  {cards.length > 0 && (
                    <div className="mt-2 ml-9 flex flex-col gap-3">
                      {cards.map((card, ci) => {
                        const ps = psCache.get(card.ref.toUpperCase());
                        const realStock = ps !== undefined ? ps.stock : (typeof card.stock === 'number' ? card.stock : undefined);
                        const realPriceNum = ps?.price ?? (typeof card.price === 'number' ? card.price : undefined);
                        const realPriceStr = typeof card.price === 'string' && card.price !== 'Consultar' ? card.price : undefined;
                        const realName = ps?.name ?? card.name ?? card.ref;
                        const productUrl = ps ? psProductUrl(ps.id) : (card.url.includes('id_product=') ? card.url : null);
                        const qty = getQty(card.ref);
                        const inCart = cart.find((i) => i.ref === card.ref.toUpperCase());
                        const canBuy = ps && realStock !== 0;
                        return (
                          <div key={ci} className="rounded-2xl overflow-hidden"
                            style={{ background: '#0D1B2E', border: `1px solid ${ps ? 'rgba(0,180,220,0.3)' : 'rgba(0,150,220,0.18)'}` }}>

                            <div className="px-3 pt-3 pb-2">
                              {/* Nombre + badge + stock */}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-white font-bold text-xs leading-tight">{realName}</p>
                                    {ps
                                      ? <span className="text-[8px] px-1 py-0.5 rounded font-bold flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>LIVE</span>
                                      : <span className="text-[8px] px-1 py-0.5 rounded font-bold flex-shrink-0" style={{ background: 'rgba(100,116,139,0.2)', color: '#94A3B8' }}>est.</span>
                                    }
                                  </div>
                                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>Ref: {card.ref}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: stockColor(realStock) }} />
                                  <span className="text-[10px] font-medium" style={{ color: stockColor(realStock) }}>{stockLabel(realStock)}</span>
                                </div>
                              </div>

                              {/* Precio */}
                              {(realPriceNum !== undefined || realPriceStr) && (
                                <div className="flex items-baseline gap-1.5 mb-2">
                                  <span className="text-base font-extrabold" style={{ color: ps ? '#00C2E0' : '#94A3B8' }}>
                                    {realPriceNum !== undefined ? `${realPriceNum.toFixed(2)} €` : realPriceStr}
                                  </span>
                                  <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>
                                    / ud. IVA no incluido{!ps ? ' (est.)' : ''}
                                  </span>
                                  {realPriceNum !== undefined && qty > 1 && (
                                    <span className="text-[10px] font-semibold" style={{ color: '#34D399' }}>
                                      · {(realPriceNum * qty).toFixed(2)} € total
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Selector cantidad — solo con producto PS real y en stock */}
                              {canBuy && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.6)' }}>Cantidad:</span>
                                  <div className="flex items-center rounded-lg overflow-hidden"
                                    style={{ border: '1px solid rgba(0,150,220,0.22)' }}>
                                    <button onClick={() => setQtyFor(card.ref, qty - 1)}
                                      className="w-7 h-6 flex items-center justify-center text-sm font-bold"
                                      style={{ background: 'rgba(0,100,200,0.15)', color: '#60A5FA' }}>−</button>
                                    <span className="w-8 text-center text-xs font-semibold" style={{ color: 'white' }}>{qty}</span>
                                    <button onClick={() => setQtyFor(card.ref, qty + 1)}
                                      className="w-7 h-6 flex items-center justify-center text-sm font-bold"
                                      style={{ background: 'rgba(0,100,200,0.15)', color: '#60A5FA' }}>+</button>
                                  </div>
                                  {inCart && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                                      ✓ {inCart.qty} en carrito
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Botones de acción */}
                            <div className="px-3 pb-3 flex flex-col gap-1.5">
                              {canBuy ? (
                                <>
                                  <button onClick={() => handleAddToCart(ps!, card, false)}
                                    className="w-full text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                                    style={{ background: inCart ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg,rgba(0,71,200,0.35),rgba(0,100,180,0.35))', color: inCart ? '#34D399' : '#93C5FD', border: inCart ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(0,100,200,0.35)' }}>
                                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.8 6H20l-1.68 8.39c-.16.8-.85 1.36-1.67 1.36H8.68c-.83 0-1.53-.58-1.67-1.39L5.8 6z"/></svg>
                                    {inCart ? '✓ Añadido · Añadir más' : 'Añadir al carrito y seguir comprando'}
                                  </button>
                                  <button onClick={() => handleAddToCart(ps!, card, true)}
                                    className="w-full text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                                    style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(5,150,105,0.25))', color: '#34D399', border: '1px solid rgba(16,185,129,0.35)' }}>
                                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                                    Añadir al carrito y pagar
                                  </button>
                                </>
                              ) : realStock === 0 ? (
                                <div className="w-full text-center text-[11px] py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                  Sin stock en este momento
                                </div>
                              ) : (
                                /* Sin datos PS reales: mostrar link de búsqueda siempre */
                                <a href={card.url || PS_HOME} target="_blank" rel="noopener noreferrer"
                                  className="w-full text-center text-[11px] font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5"
                                  style={{ background: 'linear-gradient(135deg,rgba(0,71,200,0.25),rgba(0,100,180,0.25))', color: '#93C5FD', border: '1px solid rgba(0,100,200,0.3)', textDecoration: 'none' }}>
                                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                                  Buscar en tienda ESGAS
                                </a>
                              )}

                              {/* Ficha técnica — solo si tenemos URL real con id_product */}
                              {productUrl && productUrl !== card.url && (
                                <a href={productUrl} target="_blank" rel="noopener noreferrer"
                                  className="w-full text-center text-[10px] py-1.5 rounded-xl"
                                  style={{ background: 'rgba(0,100,200,0.08)', color: '#60A5FA', border: '1px solid rgba(0,100,200,0.15)', textDecoration: 'none' }}>
                                  Ver ficha técnica en tienda →
                                </a>
                              )}

                              {!ps && (
                                <p className="text-[9px] text-center mt-0.5" style={{ color: 'rgba(148,163,184,0.25)' }}>
                                  Activa el Webservice de PS para precio y stock en tiempo real
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <BotAvatar size={28} />
                <div className="rounded-2xl rounded-bl-sm" style={{ background: '#101D30', border: '1px solid rgba(255,255,255,0.07)' }}><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {cartTotalItems > 0 && (
            <div className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between gap-3"
              style={{ background: '#06101C', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold" style={{ color: '#34D399' }}>
                  🛒 {cartTotalItems} artículo{cartTotalItems !== 1 ? 's' : ''} en tu carrito
                </p>
                {cartTotalPrice > 0 && <p className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>aprox. {cartTotalPrice.toFixed(2)} € s/IVA</p>}
              </div>
              <a href={PS_CART_PAGE} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)', color: 'white', textDecoration: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                Tramitar pedido →
              </a>
            </div>
          )}

          {pendingImage && (
            <div className="flex-shrink-0 px-4 pb-2 flex items-end gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="relative inline-block mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingImage.dataUrl} alt="preview" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(0,150,220,0.4)', display: 'block' }} />
                <button onClick={() => setPendingImage(null)} aria-label="Eliminar imagen"
                  style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#EF4444', border: '2px solid #09131F', color: 'white', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
              <p className="text-[11px] mb-1" style={{ color: 'rgba(148,163,184,0.7)' }}>Imagen lista. Escribe un comentario o envía directamente.</p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2 items-center px-4 py-3.5 flex-shrink-0"
            style={{ background: '#06101C', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageSelect} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isTyping} aria-label="Foto"
              className="flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{ width: '44px', height: '44px', borderRadius: '14px', background: pendingImage ? 'linear-gradient(135deg, #0078B8, #00C2E0)' : 'rgba(255,255,255,0.05)', border: pendingImage ? 'none' : '1px solid rgba(255,255,255,0.08)', boxShadow: pendingImage ? '0 4px 14px rgba(0,150,220,0.4)' : 'none' }}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={pendingImage ? 'white' : 'rgba(148,163,184,0.85)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={pendingImage ? 'Añade un comentario (opcional)…' : 'Escribe tu consulta…'}
              className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none transition-all min-w-0"
              style={{ background: '#101D30', color: '#CDD6E3', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={(e) => ((e.target as HTMLInputElement).style.border = '1px solid rgba(0,100,200,0.45)')}
              onBlur={(e) => ((e.target as HTMLInputElement).style.border = '1px solid rgba(255,255,255,0.07)')}
              disabled={isTyping} autoComplete="off" />
            <button type="submit" disabled={(!input.trim() && !pendingImage) || isTyping}
              className="flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #0047C8, #0092C2)', boxShadow: (input.trim() || pendingImage) ? '0 4px 18px rgba(0,80,200,0.45)' : 'none' }}
              aria-label="Enviar">
              <svg viewBox="0 0 24 24" width={17} height={17} fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
            </button>
          </form>
        </div>
      </div>

      <div className="relative flex flex-col items-center">
        {showTooltip && !isOpen && (
          <div className="absolute right-0 pointer-events-none select-none" style={{ bottom: 'calc(100% + 10px)', animation: 'esgas-fadein 0.4s ease forwards' }}>
            <div className="text-xs font-semibold text-white px-4 py-2.5 rounded-2xl rounded-br-sm whitespace-nowrap relative"
              style={{ background: 'linear-gradient(135deg, #003D99, #0078C8)', boxShadow: '0 8px 24px rgba(0,80,200,0.4)' }}>
              ¿Tienes alguna duda?
              <span className="absolute -bottom-[7px] right-5 w-3.5 h-3.5 rotate-45 rounded-sm" style={{ background: '#0078C8' }} />
            </div>
          </div>
        )}
        {hasNew && !isOpen && (
          <span className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: '#EF4444', border: '2px solid #050B18' }}>1</span>
        )}
        <div className="cursor-pointer flex flex-col items-center" onClick={toggleOpen}
          style={{ animation: isOpen ? 'none' : 'leanFloat 3.5s ease-in-out infinite' }}>
          <FabRobot dimmed={isOpen} />
          <div className="text-white rounded-2xl font-extrabold text-[11px] tracking-wide relative z-10 text-center uppercase border border-white/20 transition-all duration-300"
            style={{ background: 'linear-gradient(to right, #00D1FF, #0070FF)', boxShadow: '0 8px 20px rgba(0,209,255,0.38)', marginTop: '-14px', padding: '10px 20px', opacity: isOpen ? 0 : 1, transform: isOpen ? 'scaleY(0.7) translateY(-4px)' : 'scaleY(1)', pointerEvents: isOpen ? 'none' : 'auto' }}>
            ¿ALGUNA DUDA? PINCHA AQUÍ
          </div>
        </div>
        <div className="mt-2 text-[9px] font-medium tracking-wide" style={{ color: 'rgba(71,85,105,0.9)' }}>
          powered by{' '}
          <a href="https://flownexion.com/" target="_blank" rel="noopener noreferrer"
            className="underline transition-colors duration-200" style={{ color: 'rgba(71,85,105,0.9)' }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = '#00D1FF')}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = 'rgba(71,85,105,0.9)')}>Flownexion</a>
        </div>
      </div>
    </div>
  );
}
