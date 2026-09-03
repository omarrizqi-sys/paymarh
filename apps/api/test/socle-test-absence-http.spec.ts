import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { urlLocale } from './support/app-http.js';

describe('SocleTestModule — absence en production AppModule seul', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /socle-test/salaries/:id repond 404 quand SocleTestModule nest pas charge', async () => {
    const reponse = await fetch(
      urlLocale(app, '/socle-test/salaries/00000000-0000-4000-8000-000000000099')
    );
    expect(reponse.status).toBe(404);
  });
});
