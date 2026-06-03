# Chatbot ESGAS

Asistente técnico-comercial embebido en la tienda PrestaShop de ESGAS.
Responde preguntas técnicas sobre productos industriales de transmisión
(rodamientos, correas, retenes, etc.), consulta stock y precio en tiempo
real desde PrestaShop, y guía la venta hacia las marcas que distribuye
ESGAS cuando el cliente pregunta por marcas que no comercializa.

## Arquitectura

```
┌──────────────┐    POST     ┌─────────────────┐    REST API   ┌──────────────┐
│  Navegador   │ ──────────► │   n8n webhook    │ ────────────► │  PrestaShop  │
│ (Next.js UI) │             │   AI Agent       │               │   (API key)  │
└──────────────┘             │   + búsqueda PS  │               └──────────────┘
                             └─────────────────┘
```

- **GitHub / Vercel (este repo)**: solo la UI. Logo, estilos, layout, animaciones.
- **n8n**: el "cerebro". AI Agent + consultas a PrestaShop + memoria de conversación.
- **PrestaShop**: única fuente de verdad para precio y stock.

## Dónde van las credenciales

| Credencial | Dónde se guarda | Por qué |
| --- | --- | --- |
| API key de PrestaShop | **n8n → Credentials → HTTP Basic Auth** | Las llamadas a la API se hacen server-to-server desde n8n. Nunca llega al navegador. |
| API key del modelo (OpenAI/Anthropic/Gemini) | **n8n → Credentials** | El AI Agent vive en n8n. |
| URL del webhook n8n | **Vercel → Env Vars** (`NEXT_PUBLIC_N8N_WEBHOOK_URL`) | Es pública (el navegador la usa). No es secreta. |
| URL de la tienda | **Vercel → Env Vars** (`NEXT_PUBLIC_PS_BASE`) | Pública. |

> **NUNCA** pongas la API key de PrestaShop en este repositorio ni en Vercel.

## Variables de entorno (Vercel)

Copia `.env.example` y configura en Vercel → Settings → Environment Variables:

- `NEXT_PUBLIC_N8N_WEBHOOK_URL` — webhook de producción de n8n
- `NEXT_PUBLIC_PS_BASE` — URL raíz de la tienda PrestaShop

## Configurar n8n

La guía completa (system prompt, nodos, credenciales, formato de respuesta)
está en [`docs/N8N_SETUP.md`](docs/N8N_SETUP.md).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # editar valores
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Deploy

Push a `main` ⇒ Vercel hace deploy automático.
