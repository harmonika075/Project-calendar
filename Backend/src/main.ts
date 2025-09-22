import './instrument'; // <-- EZ LEGYEN LEGELŐL!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({ origin: 'http://localhost:4200', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(3000);
  console.log('API running on http://localhost:3000');
}
bootstrap();
