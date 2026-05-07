'use client';

import Chatbot from '@/components/Chatbot';
import LeanRobot from '@/components/LeanRobot';

const features = [
  {
    emoji: '⚙️',
    title: 'Equivalencias Exactas',
    desc: 'Convierte cualquier referencia SKF, FAG, NSK, TIMKEN o KOYO a su equivalente NTN/SNR al instante.',
  },
  {
    emoji: '🔍',
    title: 'Diagnóstico de Fallos',
    desc: 'Analiza síntomas, ruidos y temperaturas para determinar la causa raíz del fallo en tu rodamiento.',
  },
  {
    emoji: '📐',
    title: 'Dimensiones Técnicas',
    desc: 'Obtén bore, diámetro exterior, ancho y cargas de más de 15.000 referencias ISO en segundos.',
  },
  {
    emoji: '🎯',
    title: 'Selección por Aplicación',
    desc: 'Encuentra el rodamiento óptimo según carga, velocidad, temperatura y condiciones de trabajo.',
  },
];

export default function Home() {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent('open-chat'));
  };

  return (
    <main className="esgas-main min-h-screen relative overflow-x-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="esgas-blob-left absolute rounded-full" />
        <div className="esgas-blob-right absolute rounded-full" />
        <div className="esgas-grid absolute inset-0 opacity-[0.03]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="esgas-logo-icon w-9 h-9 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
              <path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2M7 14a5 5 0 0 0 10 0m-9 6v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2z" />
            </svg>
          </div>
          <span className="font-extrabold text-white text-xl tracking-tight">ESGAS</span>
          <span className="esgas-badge text-sm font-semibold px-2 py-0.5 rounded-md">AI</span>
        </div>

        <a
          href="https://esgas.es"
          target="_blank"
          rel="noopener noreferrer"
          className="esgas-nav-link text-sm px-4 py-2 rounded-xl transition-all duration-200"
        >
          esgas.es →
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-8 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="esgas-tag inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 esgas-pulse-dot" />
            Especialista NTN/SNR · Disponible 24/7
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
            Tu experto en{' '}
            <span className="esgas-gradient-text">rodamientos</span>{' '}
            y transmisión
          </h1>

          <p className="text-lg leading-relaxed text-slate-400">
            Equivalencias exactas, selección técnica y diagnóstico de fallos para más de{' '}
            <strong className="text-white">15.000 referencias</strong> NTN/SNR en segundos.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openChat}
              className="esgas-cta-btn inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl text-white transition-all duration-300"
            >
              Consultar ahora
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <a
              href="https://esgas.es"
              target="_blank"
              rel="noopener noreferrer"
              className="esgas-outline-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-slate-300 transition-all duration-200"
            >
              Ver catálogo
            </a>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {['GPT-4o', 'NTN / SNR', '15.000+ refs.', 'ISO estándar'].map((b) => (
              <span key={b} className="esgas-chip text-xs font-medium px-3 py-1 rounded-full text-slate-400">
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <LeanRobot />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="esgas-card rounded-2xl p-6 transition-all duration-300">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="esgas-footer relative z-10 text-center text-xs py-6 px-6 text-slate-600">
        © {new Date().getFullYear()} ESGAS · Rodamientos y transmisión de potencia NTN/SNR · Asistente IA 24/7
      </footer>

      <Chatbot />
    </main>
  );
}
