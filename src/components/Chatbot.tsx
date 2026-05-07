'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const WEBHOOK_URL =
  'https://paneln8n.transformaconia.com/webhook/031ab1e6-d64e-41f0-b03e-f5c0681a6491';

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  ts: Date;
};

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
      );
    return (
      <span key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </span>
    );
  });
}

/* ── Mini robot SVG (idéntico al LeanRobot, mismo viewBox/formas) ── */
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

      {/* Body */}
      <rect x="75" y="80" width="50" height="30" rx="10" fill="#CBD5E1" />

      {/* Arms */}
      <path d="M50 70 Q30 70 35 110" stroke="url(#fabGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M150 70 Q170 70 165 110" stroke="url(#fabGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />

      {/* Head */}
      <rect x="45" y="5" width="110" height="90" rx="45" fill="url(#fabGrad)" />
      <rect x="55" y="20" width="90" height="50" rx="22" fill="#0F172A" />

      {/* Eyes (pulsing cyan) */}
      <g style={{ animation: 'blinkEyesOnly 4s infinite', transformOrigin: 'center 45px' }}>
        <circle cx="82" cy="45" r="9" className="fab-eye-l" />
        <circle cx="118" cy="45" r="9" className="fab-eye-r" />
        <circle cx="85" cy="42" r="3" fill="white" fillOpacity="0.82" />
        <circle cx="121" cy="42" r="3" fill="white" fillOpacity="0.82" />
      </g>

      {/* Smile */}
      <path d="M90 60 Q100 66 110 60" fill="none" stroke="#00D1FF" strokeWidth="2" strokeLinecap="round" opacity="0.65" />

      {/* Antenna */}
      <line x1="100" y1="5" x2="100" y2="-8" stroke="#94A3B8" strokeWidth="4" />
      <circle cx="100" cy="-8" r="5" className="fab-antenna" />

      {/* Hands */}
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
      content: 'Soy tu asistente de ESGAS. ¿En qué puedo ayudarte?',
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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
      {/* ──────────────────────────────────────────
          CHAT PANEL
      ────────────────────────────────────────── */}
      <div
        style={{
          width: 'min(420px, calc(100vw - 24px))',
          height: 'min(580px, calc(100dvh - 210px))',
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
            {/* Avatar */}
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

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm tracking-tight">Asistente ESGAS</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  style={{ animation: 'esgas-pulse 2.5s ease-in-out infinite' }}
                />
                <span className="text-[11px]" style={{ color: 'rgba(148,163,184,0.85)' }}>
                  Disponible · Responde al instante
                </span>
              </div>
            </div>

            {/* Minimizar — chevron down */}
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
            {messages.map((msg) => (
              <div
                key={msg.id}
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
                      <path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2M7 14a5 5 0 0 0 10 0m-9 6v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2z" />
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
                    {renderContent(msg.content)}
                  </div>
                  <span className="text-[10px] px-1" style={{ color: 'rgba(71,85,105,0.9)' }}>
                    {fmt(msg.ts)}
                  </span>
                </div>
              </div>
            ))}

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
                ((e.target as HTMLInputElement).style.border =
                  '1px solid rgba(0,100,200,0.45)')
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.border =
                  '1px solid rgba(255,255,255,0.07)')
              }
              disabled={isTyping}
              autoComplete="off"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0047C8, #0092C2)',
                boxShadow: input.trim()
                  ? '0 4px 18px rgba(0,80,200,0.45)'
                  : 'none',
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

      {/* ──────────────────────────────────────────
          MINI ROBOT FAB  (idéntico al LeanRobot)
      ────────────────────────────────────────── */}
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

          {/* CTA bar — igual al LeanRobot, oculta cuando el chat está abierto */}
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
            onMouseEnter={(e) =>
              ((e.target as HTMLAnchorElement).style.color = '#00D1FF')
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLAnchorElement).style.color = 'rgba(71,85,105,0.9)')
            }
          >
            Flownexion
          </a>
        </div>
      </div>
    </div>
  );
}
