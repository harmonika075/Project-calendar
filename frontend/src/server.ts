import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { createProxyMiddleware } from 'http-proxy-middleware'; // <-- ÚJ

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * API PROXY a backendre – a Render frontend service ENV-ből olvassuk
 * Ha nincs ENV, a backend Primary URL-re esik vissza (működő alapérték).
 */
const API_TARGET = process.env['BACKEND_URL'] ?? 'https://project-calendar-5yo4.onrender.com';

// Itt sorold fel azokat az útvonal-prefixeket, amiket a backend szolgál ki:
app.use(
  ['/auth', '/people', '/availability', '/tasks', '/health'],
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '', // a Set-Cookie domainjét átírja a frontend domainre
    // ha kell header finomhangolás:
    // onProxyReq(proxyReq, req, res) { /* ... */ },
  }),
);

/**
 * Statikus fájlok a /browser alól
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Minden más kérés: Angular render
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
