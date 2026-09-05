import type { ReponseEcriture } from '@paymarh/shared-types';
import { appelerSalarieGet, appelerSalariePatch } from './client-salarie';
import type {
  FicheSalarieAvecOperations,
  ListeSalariesDonnees,
  ListerSalariesParams,
} from './salaries-types';

export type {
  FicheSalarie,
  FicheSalarieAvecOperations,
  LigneListeSalarie,
  ListeSalariesDonnees,
  ListerSalariesParams,
} from './salaries-types.js';

function construireQueryListe(params: ListerSalariesParams): string {
  const query = new URLSearchParams();
  if (params.recherche !== undefined && params.recherche.length > 0) {
    query.set('recherche', params.recherche);
  }
  if (params.curseur !== undefined) {
    query.set('curseur', params.curseur);
  }
  if (params.etat !== undefined) {
    query.set('etat', params.etat);
  }
  if (params.etablissementId !== undefined) {
    query.set('etablissementId', params.etablissementId);
  }
  if (params.limite !== undefined) {
    query.set('limite', String(params.limite));
  }
  const chaine = query.toString();
  return chaine.length > 0 ? `?${chaine}` : '';
}

export async function listerSalaries(
  companyId: string,
  params: ListerSalariesParams = {}
): Promise<{ donnees: ListeSalariesDonnees }> {
  return appelerSalarieGet<ListeSalariesDonnees>(
    companyId,
    `/salaries${construireQueryListe(params)}`
  );
}

export async function lireSalarie(
  companyId: string,
  salarieId: string
): Promise<{ donnees: FicheSalarieAvecOperations }> {
  return appelerSalarieGet<FicheSalarieAvecOperations>(companyId, `/salaries/${salarieId}`);
}

export async function modifierIdentiteSalarie(
  companyId: string,
  salarieId: string,
  version: number,
  corps: {
    nom?: string;
    prenom?: string;
    sexe?: 'HOMME' | 'FEMME';
    dateNaissance?: string;
    villeNaissance?: string | null;
    paysNaissanceId?: string | null;
    nationaliteId?: string | null;
    situationFamilialeCode?: string | null;
  }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(companyId, `/salaries/${salarieId}/identite`, corps, version);
}

export async function modifierIdentifiantsLegauxSalarie(
  companyId: string,
  salarieId: string,
  version: number,
  corps: {
    matricule?: string;
    numeroPiece?: string | null;
    numeroCnss?: string | null;
    numeroCimr?: string | null;
  }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(
    companyId,
    `/salaries/${salarieId}/identifiants-legaux`,
    corps,
    version
  );
}

export async function modifierCoordonneesSalarie(
  companyId: string,
  salarieId: string,
  version: number,
  corps: {
    adresse?: string | null;
    complementAdresse?: string | null;
    ville?: string | null;
    codePostal?: string | null;
    paysId?: string | null;
    telephonePersonnel?: string | null;
    telephoneProfessionnel?: string | null;
    emailPersonnel?: string | null;
    emailProfessionnel?: string | null;
    urgencePrenom?: string | null;
    urgenceNom?: string | null;
    urgenceTelephone?: string | null;
    urgenceEmail?: string | null;
  }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(companyId, `/salaries/${salarieId}/coordonnees`, corps, version);
}

export async function modifierDatesSalarie(
  companyId: string,
  salarieId: string,
  version: number,
  corps: { dateEntree?: string; dateAnciennete?: string }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(companyId, `/salaries/${salarieId}/dates`, corps, version);
}
