import type { ReponseEcriture } from '@paymarh/shared-types';
import {
  appelerSalarieDelete,
  appelerSalarieGet,
  appelerSalariePatch,
  appelerSalariePost,
  appelerSalariePut,
} from './client-salarie';
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
} from './salaries-types';

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

export interface CorpsPersonneACharge {
  lienParenteCode: string;
  prenom: string;
  nom: string;
  sexe: 'HOMME' | 'FEMME';
  dateNaissance: string;
  aCharge: boolean;
  situationHandicap?: boolean;
}

export interface CorpsModifierPersonneACharge {
  lienParenteCode?: string;
  prenom?: string;
  nom?: string;
  sexe?: 'HOMME' | 'FEMME';
  dateNaissance?: string;
  aCharge?: boolean;
  situationHandicap?: boolean;
}

export interface ImpactSuppressionLigneTableau {
  readonly message: string;
  readonly jetonConfirmation: string;
}

export async function creerPersonneACharge(
  companyId: string,
  salarieId: string,
  version: number,
  corps: CorpsPersonneACharge
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePost(companyId, `/salaries/${salarieId}/personnes-a-charge`, corps, version);
}

export async function modifierPersonneACharge(
  companyId: string,
  salarieId: string,
  ligneId: string,
  version: number,
  corps: CorpsModifierPersonneACharge
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(
    companyId,
    `/salaries/${salarieId}/personnes-a-charge/${ligneId}`,
    corps,
    version
  );
}

export async function impactSuppressionPersonneACharge(
  companyId: string,
  salarieId: string,
  ligneId: string
): Promise<{ donnees: ImpactSuppressionLigneTableau }> {
  return appelerSalarieGet<ImpactSuppressionLigneTableau>(
    companyId,
    `/salaries/${salarieId}/personnes-a-charge/${ligneId}/impact-suppression`
  );
}

export async function supprimerPersonneACharge(
  companyId: string,
  salarieId: string,
  ligneId: string,
  version: number,
  confirmationJeton: string
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  const query = new URLSearchParams({ confirmationJeton });
  return appelerSalarieDelete(
    companyId,
    `/salaries/${salarieId}/personnes-a-charge/${ligneId}?${query.toString()}`,
    version
  );
}

export async function remplacerComptesBancaires(
  companyId: string,
  salarieId: string,
  version: number,
  corps: { comptes: unknown[] }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePut(companyId, `/salaries/${salarieId}/comptes-bancaires`, corps, version);
}
