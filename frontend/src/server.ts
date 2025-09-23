// frontend/src/server.ts (TELJES FÁJL)

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const browserDistFolder = join(import.meta.dirname, '../browser');
const angularApp = new AngularNodeAppEngine();

// Render → Frontend service → Environment → BACKEND_URL
const API_TARGET =
  process.env['BACKEND_URL'] ?? 'https://project-calendar-5yo4.onrender.com';

// Egyszerű kérések naplózása
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// /health → továbbítjuk a backend /health-re (gyors ellenőrzéshez)
app.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_TARGET}/health`);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e: any) {
    res.status(502).json({ error: 'Bad Gateway', detail: String(e?.message ?? e) });
  }
});

// SEGÉD: olyan proxyt ad vissza, ami VISSZATESZI a mount-olt prefixet
function mountWithPrefix(prefix: string) {
  return createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '',
    // !!! Lényeg: Express levágja a prefixet a req.url-ról, ezért itt visszatesszük.
    pathRewrite: (path) => `${prefix}${path}`,
    on: {
      proxyReq(_proxyReq, req) {
        console.log(`[PROXY→] ${req.method} ${prefix}${(req as any).url} → ${API_TARGET}${prefix}${(req as any).url}`);
      },
      proxyRes(proxyRes, req) {
        console.log(`[PROXY←] ${req.method} ${prefix}${(req as any).url} ← ${proxyRes.statusCode}`);
      },
      error(err) {
        console.error('[PROXY ERR]', err?.message ?? err);
      },
    },
  });
}

// API prefixek — mindegyik saját mount-tal
app.use('/auth',         mountWithPrefix('/auth'));
app.use('/people',       mountWithPrefix('/people'));
app.use('/availability', mountWithPrefix('/availability'));
app.use('/tasks',        mountWithPrefix('/tasks'));

// statikus fájlok a /browser-ből
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// minden más → Angular SSR
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// indítás
if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] ?? 4000);
  const host = '0.0.0.0';
  app.listen(port, host, (error?: unknown) => {
    if (error) throw error as Error;
    console.log(`SSR server listening on http://${host}:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
