import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'ESGAS AI — Asistente de Rodamientos NTN/SNR',
  description:
    'Asistente técnico inteligente de ESGAS especializado en rodamientos y transmisión de potencia NTN/SNR. Equivalencias exactas, selección técnica y diagnóstico de fallos.',
  keywords: [
    'rodamientos NTN', 'rodamientos SNR', 'equivalencias rodamientos',
    'ESGAS', 'transmisión de potencia', 'chatbot técnico', 'rodamientos SKF',
    'rodamientos FAG', 'asistente IA',
  ],
  authors: [{ name: 'ESGAS' }],
  openGraph: {
    title: 'ESGAS AI — Asistente de Rodamientos NTN/SNR',
    description:
      'Consulta equivalencias, dimensiones y selección técnica de rodamientos NTN/SNR con IA.',
    type: 'website',
    locale: 'es_ES',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={jakarta.className}>{children}</body>
    </html>
  );
}
