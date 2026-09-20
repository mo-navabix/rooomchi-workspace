import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { Express } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

/** Mount Nest API on the existing Express app (reads `.env` via dotenv in server.ts). */
export async function attachNestApiToExpress(expressApp: Express): Promise<void> {
  const logger = new Logger('NestExpress');

  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    bodyParser: false,
  });

  nestApp.setGlobalPrefix('api');

  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  nestApp.useGlobalFilters(new AllExceptionsFilter());
  nestApp.enableCors({
    origin: true,
    credentials: true,
  });

  await nestApp.init();
  logger.log('NestJS API mounted on /api (PostgreSQL from .env)');
}
