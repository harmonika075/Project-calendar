// frontend/src/server.ts  (TELJES TARTALOM)

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

// ---> Render env-ből jön (Frontend service → Environment → BACKEND_URL)
const API_TARGET =
  process.env['BACKEND_URL'] ?? 'https://project-calendar-5yo4.onrender.com';

// Egyszerű napló, hogy biztosan lássuk mit proxizunk
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Health továbbítása a backendre (ellenőrzéshez)
app.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_TARGET}/health`);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e: any) {
    res.status(502).json({ error: 'Bad Gateway', detail: String(e?.message ?? e) });
  }
});

// *** LÉNYEG ***: semmilyen pathRewrite NINCS — a /auth MEGMARAD!
const apiProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  cookieDomainRewrite: '',
  // védőkorlát: kifejezetten NO-OP, nehogy bármi levágja a prefixet
  pathRewrite: (path) => path,
});

// API-proxy mountok — mindegyik prefix külön, EGYSZERŰEN
app.use('/auth', apiProxy);
app.use('/people', apiProxy);
app.use('/availability', apiProxy);
app.use('/tasks', apiProxy);

// statikus fájlok
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
