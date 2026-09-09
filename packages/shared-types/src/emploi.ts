import type { Uuid } from './common';
import type { EtatLigneFiche } from './etat-ligne';
import type { ResolutionsEmploi } from './heritage';
import type { JourSemaine } from './parametrage';
import type { Permission } from './permission';

export type StatutCadre = 'CADRE' | 'NON_CADRE';

export type ModeDeterminationSalaire = 'BRUT_MENSUEL' | 'BRUT_HORAIRE' | 'NET_CIBLE';

export type ModePaiement = 'VIREMENT' | 'CHEQUE' | 'ESPECES';

export type BaseSaisieDuree = 'HEBDOMADAIRE' | 'MENSUELLE';

export type OrigineStatutParticulier = 'SAISIE_MANUELLE' | 'PROPAGE_SOCIETE';

export interface ContratEmploiFiche {
  readonly libellePoste: string;
  readonly dateDebut: string;
  readonly dateFin: string | null;
  readonly typeContratCode: string;
  readonly periodeEssaiDateFin: string | null;
  readonly periodeEssaiDureeJours: number | null;
  readonly renouvellementEssaiDateFin: string | null;
  readonly statutCadre: StatutCadre | null;
  readonly coefficient: string | null;
  readonly position: string | null;
  readonly indice: string | null;
  readonly dateSortie: string | null;
  readonly motifSortieCode: string | null;
  readonly estOuvert: boolean;
}

export interface RemunerationEmploiFiche {
  readonly modeDeterminationSalaire: ModeDeterminationSalaire;
  readonly montant: string;
  readonly masquerNombreHeures: boolean;
  readonly masquerTauxHoraire: boolean;
  readonly bulletinTousLesMois: boolean;
  readonly moisProduction: readonly number[];
  readonly teletravailIndemniteVersee: boolean | null;
  readonly teletravailMontant: string | null;
}

export interface PaiementEmploiFiche {
  readonly modePaiement: ModePaiement | null;
  readonly compteBancaireId: Uuid | null;
}

export interface AffectationEmploiFiche {
  readonly etablissementId: Uuid;
  readonly departementRef: string | null;
  readonly serviceRef: string | null;
  readonly baseSaisieDuree: BaseSaisieDuree;
  readonly dureeContractuelle: string | null;
  readonly dureeDansAutreBase: string | null;
  readonly repartitionHoraireRef: string | null;
  readonly reposHebdomadaire: JourSemaine | null;
  readonly suivreJoursFeriesEtablissement: boolean;
  readonly teletravailAutorise: boolean | null;
}

export interface PrimeContractuelleFiche {
  readonly id: Uuid;
  readonly primeRef: string;
  readonly moisApplication: readonly number[];
}

export interface AvantageEnNatureFiche {
  readonly id: Uuid;
  readonly natureRef: string;
  readonly montant: string;
  readonly moisApplication: readonly number[];
  readonly moisEffetDebut: string;
  readonly moisEffetFin: string | null;
  readonly etat: EtatLigneFiche;
}

export interface StatutParticulierFiche {
  readonly id: Uuid;
  readonly statutCode: string;
  readonly dateDebut: string;
  readonly dateFin: string | null;
  readonly origine: OrigineStatutParticulier;
  readonly etat: EtatLigneFiche;
}

/**
 * Forme d un emploi tel que GET /salaries/:id le rend (avant masquage).
 *
 * `remuneration`, `paiement`, `primesContractuelles` et `avantagesEnNature`
 * sont absents (cle retiree, jamais null) sans `salarie.remuneration.lire`.
 * `operations` n est ajoute que par la couche d enrichissement de lecture.
 * `resolutions` est ajoute par la lecture complete, pas par le mapper de base.
 */
export interface EmploiFiche {
  readonly id: Uuid;
  readonly version: number;
  readonly numeroOrdre: number;
  readonly contrat: ContratEmploiFiche;
  readonly remuneration?: RemunerationEmploiFiche;
  readonly paiement?: PaiementEmploiFiche;
  readonly affectation: AffectationEmploiFiche;
  readonly primesContractuelles?: readonly PrimeContractuelleFiche[];
  readonly avantagesEnNature?: readonly AvantageEnNatureFiche[];
  readonly statutsParticuliers?: readonly StatutParticulierFiche[];
  readonly resolutions?: ResolutionsEmploi;
  readonly operations?: readonly Permission[];
}
