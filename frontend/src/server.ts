import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// BACKEND URL (Render → Frontend Web Service → Environment → BACKEND_URL)
const API_TARGET =
  process.env['BACKEND_URL'] ?? 'https://project-calendar-5yo4.onrender.com';

// (opcionális) kérés-naplózás
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// /health → a backend /health továbbítása (Node fetch, NEM patchelt)
app.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_TARGET}/health`);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e: any) {
    res.status(502).json({ error: 'Bad Gateway', detail: String(e?.message ?? e) });
  }
});

// Helper a proxy-hoz (azonos beállítások minden prefixhez)
function apiProxy() {
  return createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '', // Set-Cookie Domain → frontend host
    proxyTimeout: 30000,
    on: {
      proxyReq(_proxyReq: any, req: any) {
        console.log(`[PROXY→] ${req.method} ${req.url}  →  ${API_TARGET}${req.url}`);
      },
      proxyRes(proxyRes: any, req: any) {
        console.log(`[PROXY←] ${req.method} ${req.url}  ←  ${proxyRes.statusCode}`);
      },
      error(err: any) {
        console.error('[PROXY ERR]', err?.message ?? err);
      },
    },
  });
}

// API PROXY – FIGYELEM: sima prefix mount, regex NÉLKÜL
app.use('/auth', apiProxy());
app.use('/people', apiProxy());
app.use('/availability', apiProxy());
app.use('/tasks', apiProxy());

// statikus fájlok
app.use(
  express.static(browserDi
