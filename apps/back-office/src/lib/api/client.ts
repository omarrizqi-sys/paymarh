import type { ApiResponse } from '@paymarh/shared-types';
import { journaliserErreurServeur } from './ecrire-trace-stderr';

const HEADER_USER_ID = 'x-paymarh-user-id';

/** URL de base de l API (cote serveur ou client). */
export function urlApi(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

/** Identifiant utilisateur de developpement (seed). */
export function identifiantUtilisateurDev(): string | undefined {
  return process.env.NEXT_PUBLIC_PAYMARH_USER_ID ?? process.env.PAYMARH_USER_ID;
}

export function entetesApi(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const userId = identifiantUtilisateurDev();
  if (userId) {
    headers[HEADER_USER_ID] = userId;
  }
  return headers;
}

export interface ErreurApi {
  readonly code: string;
  readonly message: string;
  readonly champ?: string;
}

export class AppelApiEchoue extends Error {
  constructor(
    readonly statut: number,
    readonly erreur: ErreurApi
  ) {
    super(erreur.message);
    this.name = 'AppelApiEchoue';
  }
}

async function lireCorps(reponse: Response): Promise<unknown> {
  try {
    return await reponse.json();
  } catch {
    return null;
  }
}

const MOTIF_CHAMP_INTERDIT = /^property (\S+) should not exist$/i;
const MOTIF_CHAMP_DEBUT = /^(\S+) /;

function nomChampDepuisPhraseClassValidator(phrase: string): string | undefined {
  const interdit = MOTIF_CHAMP_INTERDIT.exec(phrase);
  if (interdit?.[1] !== undefined) return interdit[1];
  const debut = MOTIF_CHAMP_DEBUT.exec(phrase);
  return debut?.[1];
}

/**
 * Lit { code, message, champ }. Si l API renvoyait encore le tableau anglais
 * de class-validator, on en extrait le premier champ et on substitue le
 * message francais deja connu — jamais la phrase anglaise.
 */
export function extraireErreur(corps: unknown, statut: number): ErreurApi {
  if (typeof corps === 'object' && corps !== null) {
    const c = corps as Record<string, unknown>;
    if (typeof c.message === 'string') {
      return {
        code: typeof c.code === 'string' ? c.code : 'ERREUR',
        message: c.message,
        champ: typeof c.champ === 'string' ? c.champ : undefined,
      };
    }
    if (Array.isArray(c.message)) {
      const phrases = c.message.filter((item): item is string => typeof item === 'string');
      const premiere = phrases[0];
      if (premiere !== undefined) {
        const interdit = MOTIF_CHAMP_INTERDIT.test(premiere);
        return {
          code: interdit ? 'CHAMP_INTERDIT' : 'CHAMP_OBLIGATOIRE',
          message: interdit
            ? 'Ce champ ne peut pas être fourni par le client.'
            : 'Ce champ est obligatoire.',
          champ: nomChampDepuisPhraseClassValidator(premiere),
        };
      }
    }
  }
  return { code: 'ERREUR', message: `L’API a répondu avec le code ${statut}.` };
}

/** Appel GET JSON vers l API avec enveloppe { data, warnings }. */
export async function appelerApiGet<T>(chemin: string): Promise<ApiResponse<T>> {
  const methode = 'GET';
  const url = `${urlApi()}${chemin}`;
  try {
    const reponse = await fetch(url, {
      cache: 'no-store',
      headers: entetesApi(),
    });
    const corps = await lireCorps(reponse);
    if (!reponse.ok) {
      throw new AppelApiEchoue(reponse.status, extraireErreur(corps, reponse.status));
    }
    return corps as ApiResponse<T>;
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode, url });
    throw erreur;
  }
}

/** Appel mutatif JSON (POST, PATCH, PUT, DELETE). */
export async function appelerApiMutation<T>(
  methode: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  chemin: string,
  corps?: unknown
): Promise<ApiResponse<T>> {
  const url = `${urlApi()}${chemin}`;
  try {
    const reponse = await fetch(url, {
      method: methode,
      cache: 'no-store',
      headers: entetesApi(),
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
    const reponseCorps = await lireCorps(reponse);
    if (!reponse.ok) {
      throw new AppelApiEchoue(reponse.status, extraireErreur(reponseCorps, reponse.status));
    }
    return reponseCorps as ApiResponse<T>;
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode, url });
    throw erreur;
  }
}
