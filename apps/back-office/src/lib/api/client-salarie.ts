import type { ReponseEcriture } from '@paymarh/shared-types';
import { AppelApiEchoue, entetesApi, extraireErreur, urlApi } from './client';
import { journaliserErreurServeur } from './ecrire-trace-stderr';

const HEADER_COMPANY_ID = 'x-paymarh-company-id';
const HEADER_IF_MATCH = 'if-match';

async function lireCorps(reponse: Response): Promise<unknown> {
  try {
    return await reponse.json();
  } catch {
    return null;
  }
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
  const methode = 'GET';
  const url = `${urlApi()}${chemin}`;
  try {
    const reponse = await fetch(url, {
      cache: 'no-store',
      headers: entetesSalarie(companyId),
    });
    const corps = await lireCorps(reponse);
    if (!reponse.ok) {
      throw new AppelApiEchoue(reponse.status, extraireErreur(corps, reponse.status));
    }
    return corps as { donnees: T };
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode, url });
    throw erreur;
  }
}

/** PATCH JSON vers l API salarie ({ donnees, alertes }). */
export async function appelerSalariePatch<T>(
  companyId: string,
  chemin: string,
  corps: unknown,
  ifMatch: number
): Promise<ReponseEcriture<T>> {
  const methode = 'PATCH' as const;
  const url = `${urlApi()}${chemin}`;
  try {
    const reponse = await fetch(url, {
      method: methode,
      cache: 'no-store',
      headers: entetesSalarie(companyId, ifMatch),
      body: JSON.stringify(corps),
    });
    const reponseCorps = await lireCorps(reponse);
    if (!reponse.ok) {
      throw new AppelApiEchoue(reponse.status, extraireErreur(reponseCorps, reponse.status));
    }
    return reponseCorps as ReponseEcriture<T>;
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode, url });
    throw erreur;
  }
}

/** POST JSON vers l API salarie ({ donnees, alertes }). If-Match optionnel (creation). */
export async function appelerSalariePost<T>(
  companyId: string,
  chemin: string,
  corps: unknown,
  ifMatch?: number
): Promise<ReponseEcriture<T>> {
  const methode = 'POST' as const;
  const url = `${urlApi()}${chemin}`;
  try {
    const reponse = await fetch(url, {
      method: methode,
      cache: 'no-store',
      headers: entetesSalarie(companyId, ifMatch),
      body: JSON.stringify(corps),
    });
    const reponseCorps = await lireCorps(reponse);
    if (!reponse.ok) {
      throw new AppelApiEchoue(reponse.status, extraireErreur(reponseCorps, reponse.status));
    }
    return reponseCorps as ReponseEcriture<T>;
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode, url });
    throw erreur;
  }
}

/** PUT JSON vers l API salarie ({ donnees, alertes }). */
export async function appelerSalariePut<T>(
  companyId: string,
  chemin: string,
  corps: unknown,
  ifMatch: number
): Promise<ReponseEcriture<T>> {
  const methode = 'PUT' as const;
  const url = `${urlApi()}${chemin}`;
  try {
    const reponse = await fetch(url, {
      method: methode,
      cache: 'no-store',
      headers: entetesSalarie(companyId, ifMatch),
      body: JSON.stringify(corps),
    });
    const reponseCorps = await lireCorps(reponse);
    if (!reponse.ok) {
      throw new AppelApiEchoue(reponse.status, extraireErreur(reponseCorps, reponse.status));
    }
    return reponseCorps as ReponseEcriture<T>;
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode, url });
    throw erreur;
  }
}

/** DELETE vers l API salarie ({ donnees, alertes }). */
export async function appelerSalarieDelete<T>(
  companyId: string,
  chemin: string,
  ifMatch: number
): Promise<ReponseEcriture<T>> {
  const methode = 'DELETE' as const;
  const url = `${urlApi()}${chemin}`;
  try {
    const reponse = await fetch(url, {
      method: methode,
      cache: 'no-store',
      headers: entetesSalarie(companyId, ifMatch),
    });
    const reponseCorps = await lireCorps(reponse);
    if (!reponse.ok) {
      throw new AppelApiEchoue(reponse.status, extraireErreur(reponseCorps, reponse.status));
    }
    return reponseCorps as ReponseEcriture<T>;
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode, url });
    throw erreur;
  }
}
