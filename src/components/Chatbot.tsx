'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const WEBHOOK_URL =
  'https://paneln8n.transformaconia.com/webhook/031ab1e6-d64e-41f0-b03e-f5c0681a6491';

const PS_BASE = 'https://esgas.nodoflow.com/JuanCarlos';
const PS_CART_URL = `${PS_BASE}/index.php?controller=cart`;

const QUICK_REPLIES = [
  '¿Tenéis el rodamiento 6204 EE?',
  '¿Cuánto tarda un pedido?',
  'Busco soporte UCF 205',
  '¿Tenéis rodamientos inoxidables?',
];

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  ts: Date;
};

interface ProductCard {
  ref: string;
  name?: string;
  url: string;
  stock?: number;
  price?: string;
}

type CartItem = { ref: string; name: string; qty: number; price?: string };

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

function buildAddToCartUrl(card: ProductCard, qty: number): string {
  const idMatch = card.url.match(/id_product=(\d+)/);
  if (idMatch) {
    return `${PS_BASE}/index.php?controller=cart&add=1&id_product=${idMatch[1]}&qty=${qty}`;
  }
  return PS_CART_URL;
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
        <span
          key={d}
          className="block w-2 h-2 rounded-full"
          style={{
            background: '#00C2E0',
            animation: `esgas-bounce 1s ease-in-out infinite ${d}ms`,
          }}
        />
      ))}
    </div>
  );
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(
        /`(.*?)`/g,
        '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>',
      )
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#00C2E0;text-decoration:underline;text-underline-offset:2px">$1</a>',
      );
    return (
      <span key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </span>
    );
  });
}

function FabRobot({ dimmed }: { dimmed?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 135"
      width="108"
      height="73"
      style={{
        overflow: 'visible',
        opacity: dimmed ? 0.55 : 1,
        transition: 'opacity 0.3s',
        filter: dimmed
          ? 'drop-shadow(0 4px 10px rgba(0,60,150,0.25))'
          : 'drop-shadow(0 10px 28px rgba(0,80,200,0.45))',
      }}
    >
      <defs>
        <linearGradient id="fabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <filter id="fabShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
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

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'bot',
      content: '¡Hola! Soy el asesor técnico de ESGAS\n¿en qué puedo ayudarte?',
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [addedRefs, setAddedRefs] = useState<Set<string>>(new Set());

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

  const userHasSpoken = messages.some((m) => m.role === 'user');
  const cartCount = cartItems.reduce((acc, i) => acc + i.qty, 0);

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

  const getQty = (ref: string) => qtys[ref] ?? 1;

  const setQty = (ref: string, val: number) => {
    setQtys((prev) => ({ ...prev, [ref]: Math.max(1, val) }));
  };

  const handleAddToCart = (card: ProductCard, buyNow: boolean) => {
    const qty = getQty(card.ref);
    setCartItems((prev) => {
      const existing = prev.find((i) => i.ref === card.ref);
      if (existing) {
        return prev.map((i) => i.ref === card.ref ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ref: card.ref, name: card.name ?? card.ref, qty, price: card.price }];
    });
    setAddedRefs((prev) => new Set(prev).add(card.ref));
    const url = buildAddToCartUrl(card, qty);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (buyNow) {
      setTimeout(() => window.open(PS_CART_URL, '_blank', 'noopener,noreferrer'), 300);
    }
  };

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || isTyping) return;

      setMessages((p) => [
        ...p,
        { id: `u${Date.now()}`, role: 'user', content: t, ts: new Date() },
      ]);
      setInput('');
      setIsTyping(true);

      try {
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: t, sessionId }),
        });
        const data = await res.json();
        const reply =
          data.response ?? data.output ?? data.text ?? 'Lo siento, no pude procesar la solicitud.';
        setMessages((p) => [
          ...p,
          { id: `b${Date.now()}`, role: 'bot', content: reply, ts: new Date() },
        ]);
        if (!isOpen) setHasNew(true);
      } catch {
        setMessages((p) => [
          ...p,
          {
            id: `e${Date.now()}`,
            role: 'bot',
            content: 'Error de conexión. Por favor, inténtalo de nuevo.',
            ts: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sessionId, isOpen],
  );

  const fmt = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const toggleOpen = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    setHasNew(false);
    if (opening) {
      setShowTooltip(false);
      localStorage.setItem('esgas-tooltip-seen', '1');
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[999999] flex flex-col items-end"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', gap: '10px' }}
    >
      {/* ── CHAT PANEL ── */}
      <div
        style={{
          width: 'min(420px, calc(100vw - 24px))',
          height: 'min(620px, calc(100dvh - 210px))',
          transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(12px)',
          pointerEvents: isOpen ? 'all' : 'none',
        }}
      >
        <div
          className="w-full h-full flex flex-col rounded-3xl overflow-hidden"
          style={{
            background: '#09131F',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{
              background: 'linear-gradient(160deg, #07101E 0%, #0C1D38 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0047C8, #0092C2)',
                boxShadow: '0 4px 14px rgba(0,80,200,0.45)',
              }}
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
                <path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2M7 14a5 5 0 0 0 10 0m-9 6v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm tracking-tight">Asistente ESGAS</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  style={{ animation: 'esgas-pulse 2.5s ease-in-out infinite' }}
                />
                <span className="text-[11px]" style={{ color: 'rgba(148,163,184,0.85)' }}>
                  Disponible · PrestaShop en tiempo real
                </span>
              </div>
            </div>

            {/* Cart badge */}
            {cartCount > 0 && (
              <a
                href={PS_CART_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34D399',
                  textDecoration: 'none',
                }}
              >
                <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.8 6H20l-1.68 8.39c-.16.8-.85 1.36-1.67 1.36H8.68c-.83 0-1.53-.58-1.67-1.39L5.8 6z"/>
                </svg>
                <span className="text-[11px] font-bold">{cartCount}</span>
              </a>
            )}

            <button
              onClick={toggleOpen}
              className="flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)')
              }
              aria-label="Minimizar chat"
            >
              <svg
                viewBox="0 0 24 24"
                width={17}
                height={17}
                fill="none"
                stroke="rgba(148,163,184,1)"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.map((msg, msgIdx) => {
              const { text: cleanText, cards } = msg.role === 'bot'
                ? parseProductCards(msg.content)
                : { text: msg.content, cards: [] };

              return (
                <div key={msg.id}>
                  <div
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'bot' && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #0047C8, #0092C2)',
                          boxShadow: '0 2px 8px rgba(0,80,200,0.3)',
                        }}
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="white">
                          <path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2" />
                        </svg>
                      </div>
                    )}

                    <div
                      className={`flex flex-col gap-1 max-w-[80%] ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                        }`}
                        style={
                          msg.role === 'user'
                            ? {
                                background: 'linear-gradient(135deg, #0047C8, #0078B8)',
                                color: 'white',
                                boxShadow: '0 4px 16px rgba(0,80,200,0.28)',
                              }
                            : {
                                background: '#101D30',
                                color: '#CDD6E3',
                                border: '1px solid rgba(255,255,255,0.07)',
                              }
                        }
                      >
                        {renderContent(cleanText)}
                      </div>
                      <span className="text-[10px] px-1" style={{ color: 'rgba(71,85,105,0.9)' }}>
                        {fmt(msg.ts)}
                      </span>
                    </div>
                  </div>

                  {/* Product cards */}
                  {cards.length > 0 && (
                    <div className="mt-2 ml-9 flex flex-col gap-3">
                      {cards.map((card, ci) => {
                        const qty = getQty(card.ref);
                        const alreadyAdded = addedRefs.has(card.ref);
                        const hasProductId = card.url.includes('id_product=');

                        return (
                          <div
                            key={ci}
                            className="rounded-2xl overflow-hidden"
                            style={{
                              background: '#0D1B2E',
                              border: '1px solid rgba(0,150,220,0.25)',
                            }}
                          >
                            {/* Product info header */}
                            <div className="px-3 pt-3 pb-2">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="min-w-0 flex-1">
                                  <p className="text-white font-bold text-xs leading-tight">
                                    {card.name ?? card.ref}
                                  </p>
                                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>
                                    Ref: {card.ref}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: stockColor(card.stock) }}
                                  />
                                  <span
                                    className="text-[10px] font-medium"
                                    style={{ color: stockColor(card.stock) }}
                                  >
                                    {stockLabel(card.stock)}
                                  </span>
                                </div>
                              </div>

                              {/* Price row */}
                              {card.price && card.price !== 'Consultar' && (
                                <div className="flex items-baseline gap-1.5 mb-2">
                                  <span
                                    className="text-base font-extrabold"
                                    style={{ color: '#00C2E0' }}
                                  >
                                    {card.price}
                                  </span>
                                  <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
                                    / ud · IVA no incluido
                                  </span>
                                </div>
                              )}

                              {/* Qty selector */}
                              {hasProductId && (card.stock === undefined || card.stock !== 0) && (
                                <div className="flex items-center gap-2 mb-2.5">
                                  <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.7)' }}>
                                    Cantidad:
                                  </span>
                                  <div
                                    className="flex items-center rounded-lg overflow-hidden"
                                    style={{ border: '1px solid rgba(0,150,220,0.2)' }}
                                  >
                                    <button
                                      onClick={() => setQty(card.ref, qty - 1)}
                                      className="w-7 h-6 flex items-center justify-center text-sm font-bold transition-colors"
                                      style={{ background: 'rgba(0,100,200,0.15)', color: '#60A5FA' }}
                                    >
                                      −
                                    </button>
                                    <span
                                      className="w-8 text-center text-xs font-semibold"
                                      style={{ color: 'white' }}
                                    >
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => setQty(card.ref, qty + 1)}
                                      className="w-7 h-6 flex items-center justify-center text-sm font-bold transition-colors"
                                      style={{ background: 'rgba(0,100,200,0.15)', color: '#60A5FA' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                  {card.price && card.price !== 'Consultar' && qty > 1 && (
                                    <span className="text-[10px] font-semibold" style={{ color: '#34D399' }}>
                                      Total: {(parseFloat(card.price.replace('€','').replace(',','.')) * qty).toFixed(2)}€
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div
                              className="px-3 pb-3 flex flex-col gap-1.5"
                            >
                              {hasProductId && (card.stock === undefined || card.stock !== 0) ? (
                                <>
                                  {/* Añadir y seguir comprando */}
                                  <button
                                    onClick={() => handleAddToCart(card, false)}
                                    className="w-full text-center text-[11px] font-bold py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                                    style={{
                                      background: alreadyAdded
                                        ? 'rgba(16,185,129,0.2)'
                                        : 'linear-gradient(135deg, rgba(0,71,200,0.35), rgba(0,100,180,0.35))',
                                      color: alreadyAdded ? '#34D399' : '#93C5FD',
                                      border: alreadyAdded
                                        ? '1px solid rgba(16,185,129,0.4)'
                                        : '1px solid rgba(0,100,200,0.35)',
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                                      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.8 6H20l-1.68 8.39c-.16.8-.85 1.36-1.67 1.36H8.68c-.83 0-1.53-.58-1.67-1.39L5.8 6z"/>
                                    </svg>
                                    {alreadyAdded ? '✓ Añadido · Añadir más' : 'Añadir al carrito y seguir comprando'}
                                  </button>

                                  {/* Añadir y pagar */}
                                  <button
                                    onClick={() => handleAddToCart(card, true)}
                                    className="w-full text-center text-[11px] font-bold py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                                    style={{
                                      background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.25))',
                                      color: '#34D399',
                                      border: '1px solid rgba(16,185,129,0.35)',
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                                      <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                                    </svg>
                                    Añadir al carrito y pagar
                                  </button>
                                </>
                              ) : (
                                /* Sin stock o sin ID → solo "Ver producto" */
                                <a
                                  href={card.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full text-center text-[11px] font-semibold py-2 rounded-xl transition-all duration-200"
                                  style={{
                                    background: 'rgba(0,100,200,0.18)',
                                    color: '#60A5FA',
                                    border: '1px solid rgba(0,100,200,0.25)',
                                    textDecoration: 'none',
                                  }}
                                >
                                  {card.stock === 0 ? '❌ Sin stock · Ver producto' : 'Consultar disponibilidad'}
                                </a>
                              )}

                              {/* Ver ficha técnica */}
                              <a
                                href={card.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-center text-[10px] py-1.5 rounded-xl transition-all duration-200"
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  color: 'rgba(148,163,184,0.6)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  textDecoration: 'none',
                                }}
                              >
                                Ver ficha técnica en tienda →
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick replies after initial bot message */}
                  {msg.id === 'init' && !userHasSpoken && msgIdx === 0 && (
                    <div className="mt-3 ml-9 flex flex-wrap gap-2">
                      {QUICK_REPLIES.map((qr) => (
                        <button
                          key={qr}
                          onClick={() => send(qr)}
                          className="text-[11px] font-medium px-3 py-1.5 rounded-xl transition-all duration-200"
                          style={{
                            background: 'rgba(0,80,180,0.15)',
                            color: '#93C5FD',
                            border: '1px solid rgba(0,100,200,0.22)',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,80,180,0.28)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,80,180,0.15)';
                          }}
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0047C8, #0092C2)' }}
                >
                  <svg viewBox="0 0 24 24" width={13} height={13} fill="white">
                    <path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2" />
                  </svg>
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm"
                  style={{
                    background: '#101D30',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Cart summary bar ── */}
          {cartCount > 0 && (
            <div
              className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
              style={{
                background: 'rgba(16,185,129,0.08)',
                borderTop: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" width={14} height={14} fill="#34D399">
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.8 6H20l-1.68 8.39c-.16.8-.85 1.36-1.67 1.36H8.68c-.83 0-1.53-.58-1.67-1.39L5.8 6z"/>
                </svg>
                <span className="text-[11px] font-semibold" style={{ color: '#34D399' }}>
                  {cartCount} artículo{cartCount !== 1 ? 's' : ''} en tu carrito
                </span>
              </div>
              <a
                href={PS_CART_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold flex items-center gap-1"
                style={{ color: '#34D399', textDecoration: 'none' }}
              >
                Tramitar pedido →
              </a>
            </div>
          )}

          {/* ── Input ── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2.5 items-center px-4 py-3.5 flex-shrink-0"
            style={{
              background: '#06101C',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta…"
              className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none transition-all min-w-0"
              style={{
                background: '#101D30',
                color: '#CDD6E3',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.border = '1px solid rgba(0,100,200,0.45)')
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.border = '1px solid rgba(255,255,255,0.07)')
              }
              disabled={isTyping}
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0047C8, #0092C2)',
                boxShadow: input.trim() ? '0 4px 18px rgba(0,80,200,0.45)' : 'none',
              }}
              aria-label="Enviar mensaje"
            >
              <svg viewBox="0 0 24 24" width={17} height={17} fill="white">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ── MINI ROBOT FAB ── */}
      <div className="relative flex flex-col items-center">

        {/* Tooltip burbuja */}
        {showTooltip && !isOpen && (
          <div
            className="absolute right-0 pointer-events-none select-none"
            style={{
              bottom: 'calc(100% + 10px)',
              animation: 'esgas-fadein 0.4s ease forwards',
            }}
          >
            <div
              className="text-xs font-semibold text-white px-4 py-2.5 rounded-2xl rounded-br-sm whitespace-nowrap relative"
              style={{
                background: 'linear-gradient(135deg, #003D99, #0078C8)',
                boxShadow: '0 8px 24px rgba(0,80,200,0.4)',
              }}
            >
              ¿Tienes alguna duda?
              <span
                className="absolute -bottom-[7px] right-5 w-3.5 h-3.5 rotate-45 rounded-sm"
                style={{ background: '#0078C8' }}
              />
            </div>
          </div>
        )}

        {/* Notificación mensaje nuevo */}
        {hasNew && !isOpen && (
          <span
            className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: '#EF4444', border: '2px solid #050B18' }}
          >
            1
          </span>
        )}

        {/* Robot + CTA bar */}
        <div
          className="cursor-pointer flex flex-col items-center"
          onClick={toggleOpen}
          style={{
            animation: isOpen ? 'none' : 'leanFloat 3.5s ease-in-out infinite',
          }}
        >
          <FabRobot dimmed={isOpen} />

          <div
            className="text-white rounded-2xl font-extrabold text-[11px] tracking-wide relative z-10 text-center uppercase border border-white/20 transition-all duration-300"
            style={{
              background: 'linear-gradient(to right, #00D1FF, #0070FF)',
              boxShadow: '0 8px 20px rgba(0,209,255,0.38)',
              marginTop: '-14px',
              padding: '10px 20px',
              opacity: isOpen ? 0 : 1,
              transform: isOpen ? 'scaleY(0.7) translateY(-4px)' : 'scaleY(1)',
              pointerEvents: isOpen ? 'none' : 'auto',
            }}
          >
            ¿ALGUNA DUDA? PINCHA AQUÍ
          </div>
        </div>

        {/* Powered by Flownexion */}
        <div className="mt-2 text-[9px] font-medium tracking-wide" style={{ color: 'rgba(71,85,105,0.9)' }}>
          powered by{' '}
          <a
            href="https://flownexion.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors duration-200"
            style={{ color: 'rgba(71,85,105,0.9)' }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = '#00D1FF')}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = 'rgba(71,85,105,0.9)')}
          >
            Flownexion
          </a>
        </div>
      </div>
    </div>
  );
}
