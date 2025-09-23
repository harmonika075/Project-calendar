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

// Biztonságos alapbeállítások
app.set('trust proxy', 1);
app.disable('x-powered-by');

// BACKEND címe (Render → Frontend Web Service → Environment → BACKEND_URL)
const API_TARGET =
  process.env['BACKEND_URL'] ?? 'https://project-calendar-5yo4.onrender.com';

/**
 * 0) (OPCIONÁLIS) Kérések naplózása – hiba kereséshez nagyon hasznos.
 *    Ha sok a log, ezt a blokkot kommentezd ki.
 */
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

/**
 * 1) Külön /health handler – a backend /health-re továbbítjuk (header másolás NÉLKÜL)
 */
app.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_TARGET}/health`);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e: any) {
    res.status(502).json({ error: 'Bad Gateway', detail: String(e?.message ?? e) });
  }
});

/**
 * 2) OPTIONS (preflight) egységes kezelése – 204-gyel válaszolunk,
 *    így az esetleges böngészői előellenőrzés nem akad meg.
 */
app.options('*', (_req, res) => res.sendStatus(204));

/**
 * 3) API PROXY – EZ LEGYEN A STATIKUS ÉS AZ ANGULAR HANDLER ELŐTT!
 *    Regex-szel fogjuk a /auth, /people, /availability, /tasks prefixeket.
 */
const apiMatcher = /^\/(auth|people|availability|tasks)(\/|$)/;

app.use(
  apiMatcher,
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '', // Set-Cookie Domain → frontend domain
    proxyTimeout: 30000,
    onProxyReq(proxyReq, req) {
      console.log(`[PROXY→] ${req.method} ${req.url}  →  ${API_TARGET}${req.url}`);
    },
    onProxyRes(proxyRes, req) {
      console.log(`[PROXY←] ${req.method} ${req.url}  ←  ${proxyRes.statusCode}`);
    },
  }),
);

/**
 * 4) Statikus fájlok a /browser alól
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * 5) Minden más kérés: Angular SSR
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Indítás – Render kompatibilis bind (PORT + 0.0.0.0)
 */
if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] ?? 4000);
  const host = '0.0.0.0';
  app.listen(port, host, (error?: unknown) => {
    if (error) throw error as Error;
    console.log(`SSR server listening on http://${host}:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
