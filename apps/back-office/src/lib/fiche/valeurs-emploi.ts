import type {
  AffectationEmploiFiche,
  ContratEmploiFiche,
  EmploiFiche,
  JourSemaine,
  ModeDeterminationSalaire,
  PaiementEmploiFiche,
  RemunerationEmploiFiche,
  StatutCadre,
} from '@paymarh/shared-types';

export function chaineOuNull(valeur: string): string | null {
  return valeur === '' ? null : valeur;
}

export function selectDepuisBooleanNullable(valeur: boolean | null): string {
  if (valeur === null) {
    return '';
  }
  return valeur ? 'true' : 'false';
}

export function booleanNullableDepuisSelect(valeur: string): boolean | null {
  if (valeur === '') {
    return null;
  }
  return valeur === 'true';
}

export function statutCadreDepuisSelect(valeur: string): StatutCadre | null {
  if (valeur === '') {
    return null;
  }
  return valeur as StatutCadre;
}

export interface ValeursContratEmploi {
  readonly libellePoste: string;
  readonly dateDebut: string;
  readonly dateFin: string;
  readonly typeContratCode: string;
  readonly periodeEssaiDateFin: string;
  readonly renouvellementEssaiDateFin: string;
  readonly statutCadre: string;
  readonly coefficient: string;
  readonly position: string;
  readonly indice: string;
  readonly dateSortie: string;
  readonly motifSortieCode: string;
}

export function valeursContratDepuisEmploi(contrat: ContratEmploiFiche): ValeursContratEmploi {
  return {
    libellePoste: contrat.libellePoste,
    dateDebut: contrat.dateDebut,
    dateFin: contrat.dateFin ?? '',
    typeContratCode: contrat.typeContratCode,
    periodeEssaiDateFin: contrat.periodeEssaiDateFin ?? '',
    renouvellementEssaiDateFin: contrat.renouvellementEssaiDateFin ?? '',
    statutCadre: contrat.statutCadre ?? '',
    coefficient: contrat.coefficient ?? '',
    position: contrat.position ?? '',
    indice: contrat.indice ?? '',
    dateSortie: contrat.dateSortie ?? '',
    motifSortieCode: contrat.motifSortieCode ?? '',
  };
}

export interface ValeursAffectationEmploi {
  readonly etablissementId: string;
  readonly departementRef: string;
  readonly serviceRef: string;
  readonly baseSaisieDuree: AffectationEmploiFiche['baseSaisieDuree'];
  readonly dureeContractuelle: string;
  readonly repartitionHoraireRef: string;
  readonly reposHebdomadaire: string;
  readonly suivreJoursFeriesEtablissement: boolean;
  readonly teletravailAutorise: string;
}

export function valeursAffectationDepuisEmploi(
  affectation: AffectationEmploiFiche
): ValeursAffectationEmploi {
  return {
    etablissementId: affectation.etablissementId,
    departementRef: affectation.departementRef ?? '',
    serviceRef: affectation.serviceRef ?? '',
    baseSaisieDuree: affectation.baseSaisieDuree,
    dureeContractuelle: affectation.dureeContractuelle ?? '',
    repartitionHoraireRef: affectation.repartitionHoraireRef ?? '',
    reposHebdomadaire: affectation.reposHebdomadaire ?? '',
    suivreJoursFeriesEtablissement: affectation.suivreJoursFeriesEtablissement,
    teletravailAutorise: selectDepuisBooleanNullable(affectation.teletravailAutorise),
  };
}

export interface ValeursRemunerationEmploi {
  readonly modeDeterminationSalaire: ModeDeterminationSalaire;
  readonly montant: string;
  readonly masquerNombreHeures: boolean;
  readonly masquerTauxHoraire: boolean;
  readonly bulletinTousLesMois: boolean;
  readonly moisProduction: readonly number[];
  readonly teletravailIndemniteVersee: string;
  readonly teletravailMontant: string;
  readonly modePaiement: string;
  readonly compteBancaireId: string;
}

export function valeursRemunerationDepuisEmploi(
  remuneration: RemunerationEmploiFiche,
  paiement: PaiementEmploiFiche
): ValeursRemunerationEmploi {
  return {
    modeDeterminationSalaire: remuneration.modeDeterminationSalaire,
    montant: remuneration.montant,
    masquerNombreHeures: remuneration.masquerNombreHeures,
    masquerTauxHoraire: remuneration.masquerTauxHoraire,
    bulletinTousLesMois: remuneration.bulletinTousLesMois,
    moisProduction: remuneration.moisProduction,
    teletravailIndemniteVersee: selectDepuisBooleanNullable(
      remuneration.teletravailIndemniteVersee
    ),
    teletravailMontant: remuneration.teletravailMontant ?? '',
    modePaiement: paiement.modePaiement ?? '',
    compteBancaireId: paiement.compteBancaireId ?? '',
  };
}

export function remplacerEmploiDansListe(
  emplois: readonly EmploiFiche[],
  emploiMisAJour: EmploiFiche
): EmploiFiche[] {
  return emplois.map((emploi) => (emploi.id === emploiMisAJour.id ? emploiMisAJour : emploi));
}

export const JOURS_SEMAINE: readonly JourSemaine[] = [
  'LUNDI',
  'MARDI',
  'MERCREDI',
  'JEUDI',
  'VENDREDI',
  'SAMEDI',
  'DIMANCHE',
];
