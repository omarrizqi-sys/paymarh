import { resolve } from 'node:path';
import { config as chargerEnv } from 'dotenv';
import pg from 'pg';

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

/**
 * Verifie que PostgreSQL est joignable avant d executer les tests d integration.
 * Echec explicite si la base manque — aucun test ne doit etre ignore silencieusement.
 */
export default async function globalSetup(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'PostgreSQL n\'est pas configure (DATABASE_URL manquant). Copiez .env.example en .env puis lancez : docker compose up -d'
    );
  }

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query('SELECT 1');
  } catch {
    throw new Error('PostgreSQL n\'est pas demarre. Lancez : docker compose up -d');
  } finally {
    await client.end();
  }
}
