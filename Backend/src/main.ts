// backend/src/main.ts
import './instrument'; // <-- EZ LEGYEN LEGELŐL!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTPS proxy mögött fut (Render) -> a Secure cookie-hoz kell
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Cookie-k olvasásához
  app.use(cookieParser());

  // CORS – pontos ORIGINEK + credentials
  const allowedOrigins = [
    'https://project-calendar-fr.onrender.com', // PROD frontend (Render)
    'http://localhost:4200',                    // DEV frontend (ha használsz)
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Globális validáció
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Render által biztosított port és host
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';
  await app.listen(port, host);
  console.log(`API running on http://${host}:${port}`);
}

bootstrap();
