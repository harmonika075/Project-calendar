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

// ---- API proxy a backendre ----
const API_TARGET =
  process.env['BACKEND_URL'] || 'https://project-calendar-5yo4.onrender.com';

// Egyértelmű path-szűrő, bőbeszédű loggal
const apiFilter = (path: string) =>
  path.startsWith('/auth') ||
  path.startsWith('/people') ||
  path.startsWith('/availability') ||
  path.startsWith('/tasks') ||
  path.startsWith('/health');

app.use(
  apiFilter,
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    xfwd: true,
    cookieDomainRewrite: '', // sütik domainjét átírja a frontend domainre
    logLevel: 'info',
    onProxyReq: (_proxyReq, req) => {
      // kis futásidejű nyom: mit proxizunk hova?
      console.log('[PROXY->API]', req.method, req.url, '=>', API_TARGET);
    },
  }),
);

// ---- statikus fájlok ----
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// ---- minden más: Angular render ----
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// ---- indítás ----
if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] ?? 4000);
  const host = '0.0.0.0';
  app.listen(port, host, (err?: unknown) => {
    if (err) throw err as Error;
    console.log(`SSR server listening on http://${host}:${port}`);
    console.log(`[INFO] BACKEND_URL = ${API_TARGET}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
