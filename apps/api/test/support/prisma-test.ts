import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as chargerEnv } from 'dotenv';
import { PrismaClient } from '../../src/generated/prisma/client.js';

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '..', '.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL manquant pour les tests d integration. Lancez : docker compose up -d'
  );
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
