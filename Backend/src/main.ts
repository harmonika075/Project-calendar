import './instrument'; // <-- marad legelöl
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import * as cookieParser from 'cookie-parser'; // ha a default import működik nálad, az is ok
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie-k
  app.use(cookieParser());

  // Reverse proxy (Render/Cloudflare) mögött futunk
  app.set('trust proxy', 1);

  // CORS – allowlistelt originek
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? ''; // pl. https://project-calendar-fr.onrender.com
  const DEV_ORIGIN = 'http://localhost:4200';
  const allowList = new Set<string>([DEV_ORIGIN]);
  if (FRONTEND_ORIGIN) allowList.add(FRONTEND_ORIGIN);

  app.enableCors({
    origin: (origin, cb) => {
      // SSR/health/curl esetén nincs origin -> engedjük
      if (!origin) return cb(null, true);
      if (allowList.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // Globális validáció
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Render által adott port és host
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';
  await app.listen(port, host);
  console.log(`API running on http://${host}:${port}`);
}

bootstrap();
