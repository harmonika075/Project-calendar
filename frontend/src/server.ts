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
 * API proxy a backendre. A Render (frontend Web Service) Environment-ben
 * állítsd a BACKEND_URL-t a backend Primary URL-jére.
 * Ha nincs, a megadott alapértékre esik vissza.
 */
const API_TARGET =
  process.env['BACKEND_URL'] ?? 'https://project-calendar-5yo4.onrender.com';

/**
 * 1) PROXY – ez legyen ELŐTT a statikus kiszolgálásnak és az Angular handlernek
 */
app.use(
  ['/auth', '/people', '/availability', '/tasks', '/health'],
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '', // Set-Cookie domain átírása a frontend domainre
  }),
);

/**
 * 2) Statikus fájlok a /browser alól
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * 3) Minden más kérés: Angular render (SSR)
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
