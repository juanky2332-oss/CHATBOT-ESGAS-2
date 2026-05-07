'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const WEBHOOK_URL =
  'https://paneln8n.transformaconia.com/webhook/031ab1e6-d64e-41f0-b03e-f5c0681a6491';

const QUICK_REPLIES = [
  '¿Qué rodamiento necesito?',
  'Equivalencia SKF → NTN',
  'Diagnóstico de averías',
  'Dimensiones de un rodamiento',
];

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  ts: Date;
};

function BotIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="white">
      <path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2M7 14a5 5 0 0 0 10 0m-9 6v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2z" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="block w-2 h-2 rounded-full bg-[#00C2E0]"
          style={{ animation: `esgas-bounce 1s ease-in-out infinite ${d}ms` }}
        />
      ))}
    </div>
  );
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>');
    return (
      <span key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </span>
    );
  });
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'bot',
      content:
        '¡Hola! Soy el asistente técnico de **ESGAS**, especializado en rodamientos y transmisión de potencia **NTN/SNR**.\n\nPuedo ayudarte con equivalencias exactas, selección por aplicación, dimensiones ISO y diagnóstico de fallos.\n\n¿En qué puedo ayudarte?',
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

  // Tooltip: aparece a los 3s si el usuario nunca ha abierto el chat
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('esgas-tooltip-seen')) return;
    const t = setTimeout(() => setShowTooltip(true), 3000);
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

  const clearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'bot',
        content:
          '¡Hola! Soy el asistente técnico de **ESGAS**, especializado en rodamientos y transmisión de potencia **NTN/SNR**.\n\n¿En qué puedo ayudarte?',
        ts: new Date(),
      },
    ]);
  };

  const fmt = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const showQuickReplies = messages.length === 1 && !isTyping;

  return (
    <div
      className="fixed bottom-6 right-6 z-[999999]"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* ── Chat Panel ── */}
      <div
        className="absolute bottom-[76px] right-0"
        style={{
          width: 'min(430px, calc(100vw - 24px))',
          height: 'min(620px, calc(100dvh - 110px))',
          transition: 'opacity 0.35s, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(20px)',
          pointerEvents: isOpen ? 'all' : 'none',
        }}
      >
        <div
          className="w-full h-full rounded-3xl overflow-hidden flex flex-col border border-white/10"
          style={{
            background: '#0A1628',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #003D99 0%, #0062CC 60%, #0099CC 100%)',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <BotIcon size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Asistente Técnico ESGAS</p>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 bg-green-400 rounded-full"
                  style={{ animation: 'esgas-pulse 2s ease-in-out infinite' }}
                />
                <span className="text-white/75 text-[11px]">En línea · NTN/SNR Expert</span>
              </div>
            </div>

            <button
              onClick={clearChat}
              title="Nueva conversación"
              className="text-white/50 hover:text-white/90 transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white/90 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Cerrar chat"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'bot' && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    style={{
                      background: 'linear-gradient(135deg, #0099CC, #0056D6)',
                      boxShadow: '0 4px 12px rgba(0,153,204,0.3)',
                    }}
                  >
                    <BotIcon size={14} />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-0.5 max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                    }`}
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, #0099CC, #0056D6)',
                            color: 'white',
                            boxShadow: '0 4px 16px rgba(0,153,204,0.35)',
                          }
                        : {
                            background: '#131F35',
                            color: '#E2E8F0',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }
                    }
                  >
                    {renderContent(msg.content)}
                  </div>
                  <span className="text-slate-600 text-[10px] px-1">{fmt(msg.ts)}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0099CC, #0056D6)' }}
                >
                  <BotIcon size={14} />
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm"
                  style={{ background: '#131F35', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Replies */}
          {showQuickReplies && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
              {QUICK_REPLIES.map((r) => (
                <button
                  key={r}
                  onClick={() => send(r)}
                  className="text-xs rounded-full px-3 py-1.5 transition-all duration-200"
                  style={{
                    color: '#00C2E0',
                    border: '1px solid rgba(0,194,224,0.3)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,194,224,0.7)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,194,224,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,194,224,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2.5 items-center p-3 flex-shrink-0"
            style={{
              background: '#07101E',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Consulta sobre rodamientos..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all min-w-0"
              style={{
                background: '#131F35',
                color: '#E2E8F0',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.border = '1px solid rgba(0,153,204,0.5)')
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.border = '1px solid rgba(255,255,255,0.1)')
              }
              disabled={isTyping}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #0099CC, #0056D6)',
              }}
              onMouseEnter={(e) => {
                if (!input.trim() || isTyping) return;
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 4px 16px rgba(0,153,204,0.5)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              }}
              aria-label="Enviar"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ── Mini Robot FAB ── */}
      <div className="relative flex flex-col items-center">

        {/* Tooltip speech bubble */}
        {showTooltip && !isOpen && (
          <div
            className="absolute bottom-[88px] right-0 pointer-events-none select-none"
            style={{ animation: 'esgas-fadein 0.4s ease forwards' }}
          >
            <div
              className="relative text-xs font-semibold text-white px-4 py-2.5 rounded-2xl rounded-br-sm whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #003D99, #0078C8)',
                boxShadow: '0 8px 24px rgba(0,80,200,0.45)',
              }}
            >
              ¿Tienes alguna duda? 💬
              {/* Arrow */}
              <span
                className="absolute -bottom-[7px] right-5 w-3.5 h-3.5 rotate-45 rounded-sm"
                style={{ background: '#0078C8' }}
              />
            </div>
          </div>
        )}

        {/* New-message badge */}
        {hasNew && !isOpen && (
          <span
            className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: '#EF4444', border: '2px solid #050B18' }}
          >
            1
          </span>
        )}

        {/* The button */}
        <button
          onClick={() => {
            const opening = !isOpen;
            setIsOpen(opening);
            setHasNew(false);
            if (opening) {
              setShowTooltip(false);
              localStorage.setItem('esgas-tooltip-seen', '1');
            }
          }}
          aria-label={isOpen ? 'Cerrar asistente ESGAS' : 'Abrir asistente ESGAS'}
          className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center overflow-visible"
          style={{
            background: isOpen
              ? 'linear-gradient(135deg, #1E2D4A, #0F1F38)'
              : 'linear-gradient(135deg, #003D99, #0078C8)',
            boxShadow: isOpen
              ? '0 4px 16px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,80,200,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'background 0.3s, box-shadow 0.3s',
            animation: isOpen ? 'none' : 'leanFloat 3.5s ease-in-out infinite',
          }}
        >
          {isOpen ? (
            /* Close X */
            <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            /* Mini robot SVG — misma identidad visual que LeanRobot */
            <svg
              viewBox="0 0 60 72"
              width="52"
              height="62"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="fabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
                <filter id="fabShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
                  <feOffset dx="0" dy="1.5" result="o" />
                  <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Antenna */}
              <line x1="30" y1="3" x2="30" y2="-6" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="30" cy="-8" r="4" className="fab-antenna" />

              {/* Head */}
              <rect x="3" y="3" width="54" height="50" rx="22" fill="url(#fabGrad)" />
              {/* Face screen */}
              <rect x="9" y="14" width="42" height="28" rx="11" fill="#0A1628" />

              {/* Eyes */}
              <circle cx="21" cy="28" r="6.5" className="fab-eye-l" />
              <circle cx="39" cy="28" r="6.5" className="fab-eye-r" />
              {/* Eye highlights */}
              <circle cx="23" cy="26" r="2.2" fill="white" fillOpacity="0.85" />
              <circle cx="41" cy="26" r="2.2" fill="white" fillOpacity="0.85" />

              {/* Blink group */}
              <g style={{ animation: 'blinkEyesOnly 4s infinite', transformOrigin: '30px 28px' }}>
                <circle cx="21" cy="28" r="6.5" fill="#0A1628" fillOpacity="0" />
                <circle cx="39" cy="28" r="6.5" fill="#0A1628" fillOpacity="0" />
              </g>

              {/* Smile */}
              <path d="M20 36 Q30 42 40 36" fill="none" stroke="#00D1FF" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />

              {/* Body stub */}
              <rect x="17" y="53" width="26" height="16" rx="8" fill="#94A3B8" filter="url(#fabShadow)" />
              {/* Arms stubs */}
              <rect x="0" y="52" width="14" height="10" rx="5" fill="#CBD5E1" filter="url(#fabShadow)" />
              <rect x="46" y="52" width="14" height="10" rx="5" fill="#CBD5E1" filter="url(#fabShadow)" />
            </svg>
          )}
        </button>

        {/* "powered by" subtle label */}
        {!isOpen && (
          <span className="mt-1.5 text-[9px] text-slate-600 font-medium tracking-wide select-none">
            ESGAS AI
          </span>
        )}
      </div>

    </div>
  );
}
