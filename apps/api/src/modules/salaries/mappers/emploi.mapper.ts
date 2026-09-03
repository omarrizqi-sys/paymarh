import type { Prisma } from '../../generated/prisma/client.js';
import { declarerCleRubrique, RUBRIQUES_REMUNERATION } from '../../../common/remuneration/rubriques-remuneration.js';
import { resoudreLigneHistorique } from '../../companies/historisation.js';
import {
  convertirDureeAutreBase,
  dureePeriodeEssaiEnJours,
  formaterDate,
} from '../deductions-emploi.js';
import { emploiEstOuvert } from '../deductions-salarie.js';

declarerCleRubrique('remuneration', RUBRIQUES_REMUNERATION.REMUNERATION);
declarerCleRubrique('paiement', RUBRIQUES_REMUNERATION.PAIEMENT);

type EmploiCharge = Prisma.EmploiGetPayload<{
  include: {
    contratVersions: true;
    remunerationVersions: true;
    affectationVersions: true;
  };
}>;

type ContratVersion = EmploiCharge['contratVersions'][number];
type RemunerationVersion = EmploiCharge['remunerationVersions'][number];
type AffectationVersion = EmploiCharge['affectationVersions'][number];

function versContrat(version: ContratVersion) {
  const periodeEssaiDureeJours =
    version.periodeEssaiDateFin !== null
      ? dureePeriodeEssaiEnJours(version.dateDebut, version.periodeEssaiDateFin)
      : null;

  return {
    libellePoste: version.libellePoste,
    dateDebut: formaterDate(version.dateDebut),
    dateFin: version.dateFin !== null ? formaterDate(version.dateFin) : null,
    typeContratCode: version.typeContratCode,
    periodeEssaiDateFin:
      version.periodeEssaiDateFin !== null ? formaterDate(version.periodeEssaiDateFin) : null,
    periodeEssaiDureeJours,
    renouvellementEssaiDateFin:
      version.renouvellementEssaiDateFin !== null
        ? formaterDate(version.renouvellementEssaiDateFin)
        : null,
    statutCadre: version.statutCadre,
    coefficient: version.coefficient,
    position: version.position,
    indice: version.indice,
    dateSortie: version.dateSortie !== null ? formaterDate(version.dateSortie) : null,
    motifSortieCode: version.motifSortieCode,
    estOuvert: emploiEstOuvert(version.dateSortie),
  };
}

function versRemuneration(version: RemunerationVersion) {
  return {
    modeDeterminationSalaire: version.modeDeterminationSalaire,
    montant: version.montant.toString(),
    masquerNombreHeures: version.masquerNombreHeures,
    masquerTauxHoraire: version.masquerTauxHoraire,
    bulletinTousLesMois: version.bulletinTousLesMois,
    moisProduction: version.moisProduction,
    teletravailIndemniteVersee: version.teletravailIndemniteVersee,
    teletravailMontant:
      version.teletravailMontant !== null ? version.teletravailMontant.toString() : null,
  };
}

function versPaiement(version: RemunerationVersion) {
  return {
    modePaiement: version.modePaiement,
    compteBancaireId: version.compteBancaireId,
  };
}

function versAffectation(version: AffectationVersion) {
  const dureeContractuelle =
    version.dureeContractuelle !== null ? version.dureeContractuelle.toString() : null;
  const dureeDansAutreBase =
    version.dureeContractuelle !== null
      ? convertirDureeAutreBase(version.dureeContractuelle, version.baseSaisieDuree).toString()
      : null;

  return {
    etablissementId: version.etablissementId,
    departementRef: version.departementRef,
    serviceRef: version.serviceRef,
    baseSaisieDuree: version.baseSaisieDuree,
    dureeContractuelle,
    dureeDansAutreBase,
    repartitionHoraireRef: version.repartitionHoraireRef,
    reposHebdomadaire: version.reposHebdomadaire,
    suivreJoursFeriesEtablissement: version.suivreJoursFeriesEtablissement,
    teletravailAutorise: version.teletravailAutorise,
  };
}

function estEmploiFuturAuMois<T extends { moisEffet: string }>(
  versions: readonly T[],
  moisEnCours: string
): boolean {
  return versions.length > 0 && versions.every((v) => v.moisEffet > moisEnCours);
}

/**
 * Repli lecture seule : si aucune version n'est applicable au mois en cours parce que
 * toutes ont un mois d'effet strictement postérieur (emploi futur), on affiche la
 * première version. Sinon null → erreur (incohérence de données).
 */
function resoudrePourAffichage<T extends { moisEffet: string }>(
  versions: readonly T[],
  moisEnCours: string
): T | null {
  const auMois = resoudreLigneHistorique(versions, moisEnCours);
  if (auMois !== null) return auMois;
  if (versions.length === 0) return null;
  if (!estEmploiFuturAuMois(versions, moisEnCours)) return null;
  return versions.reduce((a, b) => (a.moisEffet <= b.moisEffet ? a : b));
}

export function versEmploiComplet(emploi: EmploiCharge, moisEnCours: string) {
  const contrat = resoudrePourAffichage(emploi.contratVersions, moisEnCours);
  const remuneration = resoudrePourAffichage(emploi.remunerationVersions, moisEnCours);
  const affectation = resoudrePourAffichage(emploi.affectationVersions, moisEnCours);

  if (contrat === null || remuneration === null || affectation === null) {
    throw new Error(`Emploi ${emploi.id} incomplet au mois ${moisEnCours}`);
  }

  return {
    id: emploi.id,
    version: emploi.version,
    numeroOrdre: emploi.numeroOrdre,
    contrat: versContrat(contrat),
    remuneration: versRemuneration(remuneration),
    paiement: versPaiement(remuneration),
    affectation: versAffectation(affectation),
  };
}

export function versVersionsContrat(versions: readonly ContratVersion[]) {
  return [...versions]
    .sort((a, b) => b.moisEffet.localeCompare(a.moisEffet))
    .map((v) => ({
      moisEffet: v.moisEffet,
      ...versContrat(v),
    }));
}

export function versVersionsRemuneration(versions: readonly RemunerationVersion[]) {
  return [...versions]
    .sort((a, b) => b.moisEffet.localeCompare(a.moisEffet))
    .map((v) => ({
      moisEffet: v.moisEffet,
      remuneration: versRemuneration(v),
      paiement: versPaiement(v),
    }));
}

export function versVersionsAffectation(versions: readonly AffectationVersion[]) {
  return [...versions]
    .sort((a, b) => b.moisEffet.localeCompare(a.moisEffet))
    .map((v) => ({
      moisEffet: v.moisEffet,
      ...versAffectation(v),
    }));
}

export function trierEmploisPourFiche<T extends { numeroOrdre: number; contrat: { dateDebut: string } }>(
  emplois: readonly T[]
): T[] {
  return [...emplois].sort((a, b) => {
    const cmp = a.contrat.dateDebut.localeCompare(b.contrat.dateDebut);
    if (cmp !== 0) return cmp;
    return a.numeroOrdre - b.numeroOrdre;
  });
}

export const INCLUDE_EMPLOI_COMPLET = {
  contratVersions: true,
  remunerationVersions: true,
  affectationVersions: true,
} as const;
