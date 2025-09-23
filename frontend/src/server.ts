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

// (opcionális) egyszerű kérés-naplózás
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// /health → a backend /health-jének továbbítása (Node fetch, NEM patchelt)
app.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${API_TARGET}/health`);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e: any) {
    res.status(502).json({ error: 'Bad Gateway', detail: String(e?.message ?? e) });
  }
});

// API PROXY – /auth, /people, /availability, /tasks
const apiMatcher = /^\/(auth|people|availability|tasks)(\/|$)/;

app.use(
  apiMatcher,
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '', // Set-Cookie Domain → frontend domain
    proxyTimeout: 30000,
    on: {
      proxyReq(proxyReq: any, req: any) {
        console.log(`[PROXY→] ${req.method} ${req.url}  →  ${API_TARGET}${req.url}`);
      },
      proxyRes(proxyRes: any, req: any) {
        console.log(`[PROXY←] ${req.method} ${req.url}  ←  ${proxyRes.statusCode}`);
      },
      error(err: any) {
        console.error('[PROXY ERR]', err?.message ?? err);
      },
    },
  }),
);

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
