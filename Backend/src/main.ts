import './instrument'; // <-- EZ LEGYEN LEGELŐL!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js'; // maradhat így, ha ESM/tsconfig esModuleInterop miatt ezt használod
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie-k
  app.use(cookieParser());

  // CORS: engedjük a Renderes frontendet + lokális Angular fejlesztést
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN; // pl. https://myapp-frontend.onrender.com
  app.enableCors({
    origin: FRONTEND_ORIGIN ? [FRONTEND_ORIGIN, 'http://localhost:4200'] : 'http://localhost:4200',
    credentials: true,
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
