import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LanguagesModule } from './languages.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(LanguagesModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const raw = process.env.PORT ?? '8080';
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT가 올바른 포트가 아닙니다: ${raw}`);
  }
  await app.listen(port);
}

void bootstrap();
