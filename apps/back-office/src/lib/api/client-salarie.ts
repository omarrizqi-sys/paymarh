import type { ReponseEcriture } from '@paymarh/shared-types';
import { AppelApiEchoue, entetesApi, urlApi } from './client.js';

const HEADER_COMPANY_ID = 'x-paymarh-company-id';
const HEADER_IF_MATCH = 'if-match';

async function lireCorps(reponse: Response): Promise<unknown> {
  try {
    return await reponse.json();
  } catch {
    return null;
  }
}

function extraireErreur(
  corps: unknown,
  statut: number
): { code: string; message: string; champ?: string } {
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

/** En-tetes pour les appels fiche salarie : societe courante via l URL. */
export function entetesSalarie(companyId: string, ifMatch?: number): HeadersInit {
  const headers = { ...(entetesApi() as Record<string, string>) };
  headers[HEADER_COMPANY_ID] = companyId;
  if (ifMatch !== undefined) {
    headers[HEADER_IF_MATCH] = String(ifMatch);
  }
  return headers;
}

/** GET JSON vers l API salarie ({ donnees }). */
export async function appelerSalarieGet<T>(
  companyId: string,
  chemin: string
): Promise<{ donnees: T }> {
  const reponse = await fetch(`${urlApi()}${chemin}`, {
    cache: 'no-store',
    headers: entetesSalarie(companyId),
  });
  const corps = await lireCorps(reponse);
  if (!reponse.ok) {
    throw new AppelApiEchoue(reponse.status, extraireErreur(corps, reponse.status));
  }
  return corps as { donnees: T };
}

/** PATCH JSON vers l API salarie ({ donnees, alertes }). */
export async function appelerSalariePatch<T>(
  companyId: string,
  chemin: string,
  corps: unknown,
  ifMatch: number
): Promise<ReponseEcriture<T>> {
  const reponse = await fetch(`${urlApi()}${chemin}`, {
    method: 'PATCH',
    cache: 'no-store',
    headers: entetesSalarie(companyId, ifMatch),
    body: JSON.stringify(corps),
  });
  const reponseCorps = await lireCorps(reponse);
  if (!reponse.ok) {
    throw new AppelApiEchoue(reponse.status, extraireErreur(reponseCorps, reponse.status));
  }
  return reponseCorps as ReponseEcriture<T>;
}
