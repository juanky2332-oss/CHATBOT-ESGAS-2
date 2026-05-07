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
  return (
    <main className="min-h-screen relative overflow-x-hidden" style={{ background: '#050B18', color: 'white' }}>

      {/* Background glow blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            top: '-10%', left: '-10%',
            width: '60vw', height: '60vw',
            background: 'radial-gradient(circle, rgba(0,86,214,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-10%', right: '-10%',
            width: '60vw', height: '60vw',
            background: 'radial-gradient(circle, rgba(0,153,204,0.14) 0%, transparent 70%)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0099CC, #0056D6)' }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
              <path d="M12 2a2 2 0 0 1 2 2 2 2 0 0 1-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2M7 14a5 5 0 0 0 10 0m-9 6v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2z" />
            </svg>
          </div>
          <span className="font-extrabold text-white text-xl tracking-tight">ESGAS</span>
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded-md"
            style={{ color: '#00C2E0', background: 'rgba(0,194,224,0.1)' }}
          >
            AI
          </span>
        </div>

        <a
          href="https://esgas.es"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm transition-all duration-200 px-4 py-2 rounded-xl"
          style={{
            color: 'rgba(148,163,184,1)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onMouseEnter={() => {}}
        >
          esgas.es →
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-8 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        {/* Left: copy */}
        <div className="space-y-6">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm"
            style={{
              color: '#00C2E0',
              background: 'rgba(0,194,224,0.08)',
              border: '1px solid rgba(0,194,224,0.25)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-green-400"
              style={{ animation: 'esgas-pulse 2s ease-in-out infinite' }}
            />
            Especialista NTN/SNR · Disponible 24/7
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Tu experto en{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #00C2E0, #0099FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              rodamientos
            </span>{' '}
            y transmisión
          </h1>

          <p className="text-lg leading-relaxed" style={{ color: 'rgba(148,163,184,1)' }}>
            Equivalencias exactas, selección técnica y diagnóstico de fallos para más de{' '}
            <strong className="text-white">15.000 referencias</strong> NTN/SNR en segundos.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined')
                  window.dispatchEvent(new CustomEvent('open-chat'));
              }}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl text-white transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #0099CC, #0056D6)',
                boxShadow: '0 4px 20px rgba(0,100,200,0.35)',
              }}
            >
              Consultar ahora
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            <a
              href="https://esgas.es"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200"
              style={{
                color: 'rgba(203,213,225,1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Ver catálogo
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 pt-2">
            {['GPT-4o', 'NTN / SNR', '15.000+ refs.', 'ISO estándar'].map((badge) => (
              <span
                key={badge}
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  color: 'rgba(148,163,184,1)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Right: robot */}
        <div className="flex justify-center lg:justify-end">
          <LeanRobot />
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 transition-all duration-300 cursor-default group"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,153,204,0.07)';
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(0,153,204,0.35)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.08)';
              }}
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(100,116,139,1)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 text-center text-xs py-6 px-6"
        style={{
          color: 'rgba(71,85,105,1)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        © {new Date().getFullYear()} ESGAS · Rodamientos y transmisión de potencia NTN/SNR · Asistente IA disponible 24/7
      </footer>

      <Chatbot />
    </main>
  );
}
