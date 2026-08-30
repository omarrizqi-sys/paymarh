import type { ApiResponse } from '@paymarh/shared-types';

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

function extraireErreur(corps: unknown, statut: number): ErreurApi {
  if (typeof corps === 'object' && corps !== null) {
    const c = corps as Record<string, unknown>;
    if (typeof c.message === 'string') {
      return {
        code: typeof c.code === 'string' ? c.code : 'ERREUR',
        message: c.message,
        champ: typeof c.champ === 'string' ? c.champ : undefined,
      };
    }
  }
  return { code: 'ERREUR', message: `L'API a repondu avec le code ${statut}.` };
}

/** Appel GET JSON vers l API avec enveloppe { data, warnings }. */
export async function appelerApiGet<T>(chemin: string): Promise<ApiResponse<T>> {
  const reponse = await fetch(`${urlApi()}${chemin}`, {
    cache: 'no-store',
    headers: entetesApi(),
  });
  const corps = await lireCorps(reponse);
  if (!reponse.ok) {
    throw new AppelApiEchoue(reponse.status, extraireErreur(corps, reponse.status));
  }
  return corps as ApiResponse<T>;
}

/** Appel mutatif JSON (POST, PATCH, PUT, DELETE). */
export async function appelerApiMutation<T>(
  methode: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  chemin: string,
  corps?: unknown
): Promise<ApiResponse<T>> {
  const reponse = await fetch(`${urlApi()}${chemin}`, {
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
}
