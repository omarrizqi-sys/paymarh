import { resolve } from 'node:path';
import { config as chargerEnv } from 'dotenv';
import { prisma } from './support/prisma-test.js';

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

export default async function globalTeardown(): Promise<void> {
  await prisma.$disconnect();
}
