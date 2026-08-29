import type { INestApplication } from '@nestjs/common';
import { expect } from 'vitest';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { urlLocale } from './app-http.js';

export interface AppelApiOptions {
  readonly method: string;
  readonly chemin: string;
  readonly utilisateurId: string;
  readonly body?: unknown;
  readonly query?: Record<string, string | undefined>;
}

export async function appelerApi(
  app: INestApplication,
  options: AppelApiOptions
): Promise<Response> {
  const url = new URL(urlLocale(app, options.chemin));
  if (options.query) {
    for (const [cle, valeur] of Object.entries(options.query)) {
      if (valeur !== undefined) {
        url.searchParams.set(cle, valeur);
      }
    }
  }

  return fetch(url, {
    method: options.method,
    headers: {
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
      'x-paymarh-user-id': options.utilisateurId,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export async function lireJson(reponse: Response): Promise<Record<string, unknown>> {
  return (await reponse.json()) as Record<string, unknown>;
}

export function extraireDonnees<T = unknown>(corps: Record<string, unknown>): T {
  return corps.data as T;
}

export function extraireCodeErreur(corps: Record<string, unknown>): string | undefined {
  if (typeof corps.code === 'string') {
    return corps.code;
  }

  const message = corps.message;
  if (typeof message === 'object' && message !== null && 'code' in message) {
    return (message as { code: string }).code;
  }

  return undefined;
}

export async function nettoyerJournauxAudit(
  prisma: PrismaClient,
  utilisateurIds: readonly string[]
): Promise<void> {
  if (utilisateurIds.length === 0) return;
  await prisma.auditLog.deleteMany({
    where: { userId: { in: [...utilisateurIds] } },
  });
}

export async function dernierJournalAudit(
  prisma: PrismaClient,
  filtre: { readonly targetId?: string; readonly action?: string }
) {
  return prisma.auditLog.findFirst({
    where: {
      ...(filtre.targetId ? { targetId: filtre.targetId } : {}),
      ...(filtre.action ? { action: filtre.action } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export interface CorpsCreerSociete {
  readonly codeDossier: string;
  readonly raisonSociale: string;
  readonly formeJuridiqueId: string;
  readonly etatDossier: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';
  readonly moisDebutMontage: string;
  readonly moisDebutProduction: string;
  readonly etablissementPrincipal: {
    readonly nom?: string;
    readonly adresse: string;
    readonly ville: string;
  };
}

export async function creerSocieteHttp(
  app: INestApplication,
  utilisateurId: string,
  corps: CorpsCreerSociete
): Promise<string> {
  const reponse = await appelerApi(app, {
    method: 'POST',
    chemin: '/societes',
    utilisateurId,
    body: corps,
  });
  expect(reponse.status).toBe(201);
  const json = await lireJson(reponse);
  const societe = extraireDonnees<{ id: string }>(json);
  return societe.id;
}
