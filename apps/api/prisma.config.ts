import { resolve } from 'node:path';
import { config as chargerEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// ---------------------------------------------------------------------------
// PaymaRH - Configuration de la CLI Prisma (schema, migrations, seed).
//
// Depuis Prisma 7, l URL de connexion ne vit plus dans schema.prisma : elle
// est declaree ici. Ce fichier ne concerne QUE les commandes de la CLI
// (migrate, generate, seed, studio) ; le client applicatif, lui, recoit sa
// connexion via l adaptateur pg (voir src/prisma/prisma.service.ts).
// ---------------------------------------------------------------------------

// Le monorepo n a qu UN SEUL fichier .env, a la racine du depot, afin que la
// base de donnees soit decrite au meme endroit pour Docker, l API et le front.
// Les commandes Prisma s executant depuis apps/api, on remonte de deux crans.
chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
