import { Inject, Injectable } from '@nestjs/common';
import { resoudreLigneHistorique } from '../../companies/historisation.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  BULLETIN_PORT,
  EtatBulletin,
  type BulletinPort,
  type MoisBulletin,
} from '../bulletin/bulletin.port.js';
import { ligneUtiliseeParBulletin } from '../deductions-tableaux.js';
import { CODE_STATUT_TAHFIZ, CODE_TYPE_EXONERATION_TAHFIZ } from './codes-tahfiz.js';
import {
  ajusterDatesLignePropagee,
  dateFinDepuisMois,
  ligneStatutVersMois,
} from './dates-exoneration.js';
import {
  calculerLignesTahfiz,
  type LigneTahfizCalculee,
  type PeriodeTahfizSociete,
} from './periodes-tahfiz.js';

interface ExonerationSaisie {
  readonly typeExonerationId: string | null;
  readonly exonerationDateDebut: string | null;
  readonly exonerationDateFin: string | null;
}

type ClientEcriture = Pick<
  PrismaService,
  | 'statutParticulierLigne'
  | 'emploi'
  | 'typeExoneration'
  | 'companyParametrageHistorique'
  | 'company'
>;

interface LignePropagee {
  readonly id: string;
  readonly dateDebut: Date;
  readonly dateFin: Date | null;
}

@Injectable()
export class PropagationTahfizService {
  constructor(@Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort) {}

  /**
   * Synchronise les lignes propagees de tous les emplois de la societe avec
   * l exoneration saisie, dans la transaction d ecriture du parametrage.
   */
  async synchroniserDansTransaction(
    tx: ClientEcriture,
    companyId: string,
    saisie: ExonerationSaisie,
    moisEnCoursSociete: string
  ): Promise<void> {
    const tahfizId = await this.idTypeExonerationTahfiz(tx);
    if (tahfizId === null) return;

    let periode: PeriodeTahfizSociete | null = null;
    if (saisie.typeExonerationId === tahfizId) {
      const debut = saisie.exonerationDateDebut;
      if (debut === null || debut.length === 0) return;
      periode = { moisDebut: debut, moisFin: saisie.exonerationDateFin };
    }

    await this.synchroniserEmplois(tx, { salarie: { companyId } }, periode, moisEnCoursSociete);
  }

  /**
   * Synchronise un seul emploi (creation, modification du contrat) avec le
   * parametrage societe applicable au mois en cours de la societe.
   */
  async synchroniserEmploiDansTransaction(
    tx: ClientEcriture,
    companyId: string,
    emploiId: string
  ): Promise<void> {
    const tahfizId = await this.idTypeExonerationTahfiz(tx);
    if (tahfizId === null) return;

    const societe = await tx.company.findFirst({
      where: { id: companyId },
      select: { moisEnCours: true },
    });
    if (societe === null) return;

    const lignes = await tx.companyParametrageHistorique.findMany({
      where: { companyId },
    });
    const applicable = resoudreLigneHistorique(lignes, societe.moisEnCours);
    const periode: PeriodeTahfizSociete | null =
      applicable !== null &&
      applicable.typeExonerationId === tahfizId &&
      applicable.exonerationDateDebut !== null
        ? { moisDebut: applicable.exonerationDateDebut, moisFin: applicable.exonerationDateFin }
        : null;

    await this.synchroniserEmplois(
      tx,
      { id: emploiId, salarie: { companyId } },
      periode,
      societe.moisEnCours
    );
  }

  /**
   * Rend les lignes propagees de chaque emploi egales au calcul : creation des
   * manquantes, mise a jour des dates (sans retracter en deca d un bulletin),
   * retrait des lignes sans objet (suppression, ou cloture si un bulletin les
   * couvre). Ecritures en lot : une creation, une suppression, une cloture,
   * une mise a jour par couple de dates.
   */
  private async synchroniserEmplois(
    tx: ClientEcriture,
    filtre: Prisma.EmploiWhereInput,
    periode: PeriodeTahfizSociete | null,
    moisEnCoursSociete: string
  ): Promise<void> {
    const emplois = await tx.emploi.findMany({
      where: filtre,
      select: {
        id: true,
        salarieId: true,
        contratVersions: {
          select: { moisEffet: true, typeContratCode: true, dateDebut: true, dateSortie: true },
        },
        statutsParticuliers: {
          where: { statutCode: CODE_STATUT_TAHFIZ, origine: 'PROPAGE_SOCIETE' },
          select: { id: true, dateDebut: true, dateFin: true },
        },
      },
    });

    const salariesAvecLignes = [
      ...new Set(emplois.filter((e) => e.statutsParticuliers.length > 0).map((e) => e.salarieId)),
    ];
    const bulletinsParSalarie = await this.chargerBulletinsParSalaries(salariesAvecLignes);
    const dateCloture = dateFinDepuisMois(moisEnCoursSociete);

    const aCreer: { emploiId: string; dateDebut: Date; dateFin: Date | null }[] = [];
    const aMettreAJour = new Map<
      string,
      { ids: string[]; dateDebut: Date; dateFin: Date | null }
    >();
    const aSupprimer: string[] = [];
    const aClore: string[] = [];

    for (const emploi of emplois) {
      const voulues = calculerLignesTahfiz(emploi.contratVersions, periode);
      const bulletins = bulletinsParSalarie[emploi.salarieId] ?? [];
      const restantes: LignePropagee[] = [...emploi.statutsParticuliers].sort(
        (a, b) => a.dateDebut.getTime() - b.dateDebut.getTime()
      );

      for (const voulue of voulues) {
        const index = restantes.findIndex((ligne) => chevauche(ligne, voulue));
        const ligne = index === -1 ? undefined : restantes.splice(index, 1)[0];
        if (ligne === undefined) {
          aCreer.push({ emploiId: emploi.id, ...voulue });
          continue;
        }

        const bornes = moisBulletinsCouvrant(bulletins, ligne);
        const ajustees = ajusterDatesLignePropagee({
          dateDebutDesiree: voulue.dateDebut,
          dateFinDesiree: voulue.dateFin,
          moisPremierBulletin: bornes.premier,
          moisDernierBulletin: bornes.dernier,
        });
        if (memesDates(ligne, ajustees)) continue;

        const cle = `${ajustees.dateDebut.toISOString()}|${ajustees.dateFin?.toISOString() ?? ''}`;
        const groupe = aMettreAJour.get(cle);
        if (groupe !== undefined) {
          groupe.ids.push(ligne.id);
        } else {
          aMettreAJour.set(cle, { ids: [ligne.id], ...ajustees });
        }
      }

      for (const ligne of restantes) {
        if (!ligneUtiliseeParBulletin(bulletins, ligneStatutVersMois(ligne))) {
          aSupprimer.push(ligne.id);
        } else if (
          dateCloture !== null &&
          (ligne.dateFin === null || ligne.dateFin.getTime() > dateCloture.getTime())
        ) {
          aClore.push(ligne.id);
        }
      }
    }

    if (aSupprimer.length > 0) {
      await tx.statutParticulierLigne.deleteMany({ where: { id: { in: aSupprimer } } });
    }
    if (aClore.length > 0) {
      await tx.statutParticulierLigne.updateMany({
        where: { id: { in: aClore } },
        data: { dateFin: dateCloture },
      });
    }
    for (const groupe of aMettreAJour.values()) {
      await tx.statutParticulierLigne.updateMany({
        where: { id: { in: groupe.ids } },
        data: { dateDebut: groupe.dateDebut, dateFin: groupe.dateFin },
      });
    }
    if (aCreer.length > 0) {
      await tx.statutParticulierLigne.createMany({
        data: aCreer.map((ligne) => ({
          ...ligne,
          statutCode: CODE_STATUT_TAHFIZ,
          origine: 'PROPAGE_SOCIETE' as const,
        })),
      });
    }
  }

  private async idTypeExonerationTahfiz(tx: ClientEcriture): Promise<string | null> {
    const tahfiz = await tx.typeExoneration.findFirst({
      where: { code: CODE_TYPE_EXONERATION_TAHFIZ },
      select: { id: true },
    });
    return tahfiz?.id ?? null;
  }

  private async chargerBulletinsParSalaries(
    salarieIds: readonly string[]
  ): Promise<Readonly<Record<string, readonly MoisBulletin[]>>> {
    if (salarieIds.length === 0) {
      return {};
    }
    return this.bulletins.listerBulletinsParSalaries(salarieIds);
  }
}

function chevauche(ligne: LignePropagee, voulue: LigneTahfizCalculee): boolean {
  const finLigne = ligne.dateFin?.getTime() ?? Number.POSITIVE_INFINITY;
  const finVoulue = voulue.dateFin?.getTime() ?? Number.POSITIVE_INFINITY;
  return ligne.dateDebut.getTime() <= finVoulue && voulue.dateDebut.getTime() <= finLigne;
}

function memesDates(ligne: LignePropagee, dates: LigneTahfizCalculee): boolean {
  return (
    ligne.dateDebut.getTime() === dates.dateDebut.getTime() &&
    (ligne.dateFin?.getTime() ?? null) === (dates.dateFin?.getTime() ?? null)
  );
}

function moisBulletinsCouvrant(
  bulletins: readonly MoisBulletin[],
  ligne: { dateDebut: Date; dateFin: Date | null }
): { premier: string | undefined; dernier: string | undefined } {
  const couverture = ligneStatutVersMois(ligne);
  const mois = bulletins
    .filter((b) => b.etat >= EtatBulletin.CALCULE)
    .map((b) => b.mois)
    .filter((m) => {
      if (m < couverture.moisEffetDebut) return false;
      if (couverture.moisEffetFin !== null && m > couverture.moisEffetFin) return false;
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
  return { premier: mois[0], dernier: mois[mois.length - 1] };
}
