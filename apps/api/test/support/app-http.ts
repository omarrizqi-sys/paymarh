import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { AppModule } from '../../src/app.module.js';

export async function creerAppHttp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  await app.init();
  return app;
}

export function urlLocale(app: INestApplication, chemin: string): string {
  const adresse = app.getHttpServer().address() as AddressInfo;
  const port = typeof adresse === 'object' ? adresse.port : adresse;
  return `http://127.0.0.1:${port}${chemin}`;
}
