import type {
  BaseSaisieDuree,
  EmploiFiche,
  JourSemaine,
  ModeDeterminationSalaire,
  ModePaiement,
  ReponseEcriture,
  StatutCadre,
} from '@paymarh/shared-types';
import { appelerSalarieDelete, appelerSalarieGet, appelerSalariePatch } from './client-salarie';

export async function modifierContratEmploi(
  companyId: string,
  emploiId: string,
  version: number,
  corps: {
    libellePoste?: string;
    dateDebut?: string;
    dateFin?: string | null;
    typeContratCode?: string;
    periodeEssaiDateFin?: string | null;
    renouvellementEssaiDateFin?: string | null;
    statutCadre?: StatutCadre | null;
    coefficient?: string | null;
    position?: string | null;
    indice?: string | null;
    dateSortie?: string | null;
    motifSortieCode?: string | null;
  }
): Promise<ReponseEcriture<EmploiFiche>> {
  return appelerSalariePatch<EmploiFiche>(
    companyId,
    `/emplois/${emploiId}/contrat`,
    corps,
    version
  );
}

export async function modifierRemunerationEmploi(
  companyId: string,
  emploiId: string,
  version: number,
  corps: {
    modeDeterminationSalaire?: ModeDeterminationSalaire;
    montant?: string;
    masquerNombreHeures?: boolean;
    masquerTauxHoraire?: boolean;
    bulletinTousLesMois?: boolean;
    moisProduction?: number[];
    modePaiement?: ModePaiement | null;
    compteBancaireId?: string | null;
    teletravailIndemniteVersee?: boolean | null;
    teletravailMontant?: string | null;
  }
): Promise<ReponseEcriture<EmploiFiche>> {
  return appelerSalariePatch<EmploiFiche>(
    companyId,
    `/emplois/${emploiId}/remuneration`,
    corps,
    version
  );
}

export async function modifierAffectationEmploi(
  companyId: string,
  emploiId: string,
  version: number,
  corps: {
    etablissementId?: string;
    departementRef?: string | null;
    serviceRef?: string | null;
    baseSaisieDuree?: BaseSaisieDuree;
    dureeContractuelle?: string | null;
    repartitionHoraireRef?: string | null;
    reposHebdomadaire?: JourSemaine | null;
    suivreJoursFeriesEtablissement?: boolean;
    teletravailAutorise?: boolean | null;
  }
): Promise<ReponseEcriture<EmploiFiche>> {
  return appelerSalariePatch<EmploiFiche>(
    companyId,
    `/emplois/${emploiId}/affectation-temps-de-travail`,
    corps,
    version
  );
}

export interface ImpactSuppressionEmploi {
  readonly message: string;
  readonly jetonConfirmation: string;
}

export interface ImpactSuppressionLigneEmploi {
  readonly emploiId: string;
  readonly ligneId: string;
  readonly mode: 'supprimer' | 'inactiver';
  readonly message: string;
  readonly jetonConfirmation: string;
}

export async function impactSuppressionEmploi(
  companyId: string,
  emploiId: string
): Promise<{ donnees: ImpactSuppressionEmploi }> {
  return appelerSalarieGet<ImpactSuppressionEmploi>(
    companyId,
    `/emplois/${emploiId}/impact-suppression`
  );
}

export async function supprimerEmploi(
  companyId: string,
  emploiId: string,
  version: number,
  confirmationJeton: string
): Promise<ReponseEcriture<{ readonly id: string }>> {
  const query = new URLSearchParams({ confirmationJeton });
  return appelerSalarieDelete(companyId, `/emplois/${emploiId}?${query.toString()}`, version);
}

export async function impactSuppressionAvantageEnNature(
  companyId: string,
  emploiId: string,
  ligneId: string
): Promise<{ donnees: ImpactSuppressionLigneEmploi }> {
  return appelerSalarieGet<ImpactSuppressionLigneEmploi>(
    companyId,
    `/emplois/${emploiId}/avantages-en-nature/${ligneId}/impact-suppression`
  );
}

export async function supprimerAvantageEnNature(
  companyId: string,
  emploiId: string,
  ligneId: string,
  version: number,
  confirmationJeton: string
): Promise<ReponseEcriture<EmploiFiche>> {
  const query = new URLSearchParams({ confirmationJeton });
  return appelerSalarieDelete(
    companyId,
    `/emplois/${emploiId}/avantages-en-nature/${ligneId}?${query.toString()}`,
    version
  );
}

export async function impactSuppressionStatutParticulier(
  companyId: string,
  emploiId: string,
  ligneId: string
): Promise<{ donnees: ImpactSuppressionLigneEmploi }> {
  return appelerSalarieGet<ImpactSuppressionLigneEmploi>(
    companyId,
    `/emplois/${emploiId}/statuts-particuliers/${ligneId}/impact-suppression`
  );
}

export async function supprimerStatutParticulier(
  companyId: string,
  emploiId: string,
  ligneId: string,
  version: number,
  confirmationJeton: string
): Promise<ReponseEcriture<EmploiFiche>> {
  const query = new URLSearchParams({ confirmationJeton });
  return appelerSalarieDelete(
    companyId,
    `/emplois/${emploiId}/statuts-particuliers/${ligneId}?${query.toString()}`,
    version
  );
}
