import type { HealthResponse } from '@paymarh/shared-types';

/**
 * Etat de la liaison entre le back-office et l API.
 *
 * `verification` est l etat initial : on n affiche jamais "hors ligne" avant
 * d avoir reellement essaye, ce qui eviterait un clignotement inutile.
 */
export type EtatApi = 'verification' | 'en-ligne' | 'hors-ligne';

export interface ResultatSante {
  readonly etat: EtatApi;
  readonly reponse: HealthResponse | null;
  readonly message: string;
}

/**
 * URL de base de l API.
 *
 * Lue depuis NEXT_PUBLIC_API_URL. Le prefixe NEXT_PUBLIC_ est impose par
 * Next.js pour qu une variable soit visible cote navigateur.
 */
export function urlApi(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

/**
 * Traduit une reponse HTTP en etat affichable.
 *
 * Fonction PURE, volontairement separee de l appel reseau : c est elle qui
 * porte la logique, et c est donc elle qui est testee (health.spec.ts).
 */
export function interpreterReponse(statut: number, corps: unknown): ResultatSante {
  if (statut !== 200) {
    return {
      etat: 'hors-ligne',
      reponse: null,
      message: `L'API a repondu avec le code ${statut}.`,
    };
  }

  if (!estHealthResponse(corps)) {
    return {
      etat: 'hors-ligne',
      reponse: null,
      message: "L'API a repondu, mais dans un format inattendu.",
    };
  }

  return {
    etat: 'en-ligne',
    reponse: corps,
    message: `API v${corps.version} joignable.`,
  };
}

/** Verifie que le corps recu a bien la forme attendue avant de s y fier. */
export function estHealthResponse(valeur: unknown): valeur is HealthResponse {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }

  const candidat = valeur as Record<string, unknown>;

  return (
    candidat.status === 'ok' &&
    typeof candidat.timestamp === 'string' &&
    typeof candidat.version === 'string'
  );
}

/**
 * Interroge `GET /health`.
 *
 * Rappel du principe "API d abord" : le front se contente de LIRE. Il ne
 * calcule rien, ne deduit rien, il affiche ce que l API lui repond.
 */
export async function recupererSante(): Promise<ResultatSante> {
  try {
    const reponse = await fetch(`${urlApi()}/health`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    const corps: unknown = await reponse.json().catch(() => null);

    return interpreterReponse(reponse.status, corps);
  } catch {
    return {
      etat: 'hors-ligne',
      reponse: null,
      message: `Impossible de joindre l'API sur ${urlApi()}. Est-elle demarree (pnpm dev:api) ?`,
    };
  }
}
