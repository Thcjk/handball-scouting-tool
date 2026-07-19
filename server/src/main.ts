import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (isProduction) {
    app.enableCors({ origin: true, credentials: true });
  } else {
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.includes(',')
        ? process.env.CORS_ORIGIN.split(',')
        : (process.env.CORS_ORIGIN ?? 'http://localhost:5173'),
      credentials: true,
    });
  }

  await app.init();

  if (isProduction) {
    const clientPath = join(__dirname, '../../client/dist');
    app.use(express.static(clientPath));
    const http = app.getHttpAdapter().getInstance();
    http.get(/^(?!\/api)(?!\/game).*/, (_req: express.Request, res: express.Response) => {
      res.sendFile(join(clientPath, 'index.html'));
    });
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Kronenchronik läuft auf Port ${port}${isProduction ? ' (Spiel + API)' : ''}`);
}

bootstrap();
