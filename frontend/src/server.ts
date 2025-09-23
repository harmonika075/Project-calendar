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

/**
 * A backend URL-je: Render (frontend Web Service) → Environment → BACKEND_URL
 * Ha nincs beállítva, a backend Primary URL-re esik vissza.
 */
const API_TARGET =
  process.env['BACKEND_URL'] ?? 'https://project-calendar-5yo4.onrender.com';

/**
 * 0) Egyszerű log (segít diagnosztikában). Bánthatatlan, de ha zavar, törölhető.
 */
// app.use((req, _res, next) => {
//   console.log('[REQ]', req.method, req.url);
//   next();
// });

/**
 * 1) Külön, biztos /health handler – közvetlenül a backend /health-re küldjük.
 *    Így garantáltan működik a frontend URL-en is: /health
 */
app.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_TARGET}/health`);
    const text = await r.text();
    // Továbbítjuk a státuszt és a headereket is
    for (const [k, v] of r.headers) res.setHeader(k, v);
    res.status(r.status).send(text);
  } catch (e: any) {
    res.status(502).json({ error: 'Bad Gateway', detail: String(e?.message ?? e) });
  }
});

/**
 * 2) API PROXY a backendre (minden más API útvonal)
 *    ELSŐNEK kell lennie a statikus/SSR előtt!
 */
app.use(
  ['/auth', '/people', '/availability', '/tasks'],
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '', // Set-Cookie domain átírva a frontend domainre
  }),
);

/**
 * 3) Statikus fájlok a /browser alól
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * 4) Minden más kérés: Angular render (SSR)
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

/**
 * Request handler az Angular CLI-nak (build/prerender)
 */
export const reqHandler = createNodeRequestHandler(app);
