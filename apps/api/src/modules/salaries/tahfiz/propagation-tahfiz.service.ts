import { Inject, Injectable } from '@nestjs/common';
import { resoudreLigneHistorique } from '../../companies/historisation.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  BULLETIN_PORT,
  EtatBulletin,
  type BulletinPort,
  type MoisBulletin,
} from '../bulletin/bulletin.port.js';
import { emploiEstOuvert } from '../deductions-salarie.js';
import { ligneUtiliseeParBulletin } from '../deductions-tableaux.js';
import { CODE_STATUT_TAHFIZ, CODE_TYPE_EXONERATION_TAHFIZ } from './codes-tahfiz.js';
import {
  ajusterDatesLignePropagee,
  dateDebutDepuisMois,
  dateFinDepuisMois,
  ligneStatutVersMois,
} from './dates-exoneration.js';

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

@Injectable()
export class PropagationTahfizService {
  constructor(@Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort) {}

  /**
   * Synchronise les lignes propagees avec l exoneration societe, dans la
   * transaction d ecriture du parametrage (tout ou rien).
   */
  async synchroniserDansTransaction(
    tx: ClientEcriture,
    companyId: string,
    saisie: ExonerationSaisie,
    moisEnCoursSociete: string
  ): Promise<void> {
    const tahfiz = await tx.typeExoneration.findFirst({
      where: { code: CODE_TYPE_EXONERATION_TAHFIZ },
      select: { id: true },
    });
    if (tahfiz === null) {
      return;
    }

    const active = saisie.typeExonerationId === tahfiz.id;
    if (active) {
      const debut = saisie.exonerationDateDebut;
      if (debut === null || debut.length === 0) {
        return;
      }
      await this.poserOuMettreAJour(
        tx,
        companyId,
        dateDebutDepuisMois(debut),
        dateFinDepuisMois(saisie.exonerationDateFin)
      );
      return;
    }

    await this.retirer(tx, companyId, moisEnCoursSociete);
  }

  /** Pose une ligne sur un emploi nouvellement ouvert si TAHFIZ est actif. */
  async poserSurNouvelEmploi(
    tx: ClientEcriture,
    companyId: string,
    emploiId: string,
    emploiOuvert: boolean
  ): Promise<void> {
    if (!emploiOuvert) return;

    const tahfiz = await tx.typeExoneration.findFirst({
      where: { code: CODE_TYPE_EXONERATION_TAHFIZ },
      select: { id: true },
    });
    if (tahfiz === null) return;

    const societe = await tx.company.findFirst({
      where: { id: companyId },
      select: { moisEnCours: true },
    });
    if (societe === null) return;

    const lignes = await tx.companyParametrageHistorique.findMany({
      where: { companyId },
    });
    const applicable = resoudreLigneHistorique(lignes, societe.moisEnCours);
    if (applicable === null || applicable.typeExonerationId !== tahfiz.id) {
      return;
    }
    if (applicable.exonerationDateDebut === null) return;

    const deja = await tx.statutParticulierLigne.findFirst({
      where: {
        emploiId,
        statutCode: CODE_STATUT_TAHFIZ,
        origine: 'PROPAGE_SOCIETE',
      },
      select: { id: true },
    });
    if (deja !== null) return;

    await tx.statutParticulierLigne.create({
      data: {
        emploiId,
        statutCode: CODE_STATUT_TAHFIZ,
        dateDebut: dateDebutDepuisMois(applicable.exonerationDateDebut),
        dateFin: dateFinDepuisMois(applicable.exonerationDateFin),
        origine: 'PROPAGE_SOCIETE',
      },
    });
  }

  private async poserOuMettreAJour(
    tx: ClientEcriture,
    companyId: string,
    dateDebut: Date,
    dateFin: Date | null
  ): Promise<void> {
    const existantes = await tx.statutParticulierLigne.findMany({
      where: {
        statutCode: CODE_STATUT_TAHFIZ,
        origine: 'PROPAGE_SOCIETE',
        emploi: { salarie: { companyId } },
      },
      select: {
        id: true,
        emploiId: true,
        dateDebut: true,
        dateFin: true,
        emploi: { select: { salarieId: true } },
      },
    });

    if (existantes.length > 0) {
      const salarieIds = [...new Set(existantes.map((l) => l.emploi.salarieId))];
      const bulletinsParSalarie = await this.chargerBulletinsParSalaries(salarieIds);

      const groupes = new Map<string, { ids: string[]; dateDebut: Date; dateFin: Date | null }>();
      for (const ligne of existantes) {
        const bulletins = bulletinsParSalarie[ligne.emploi.salarieId] ?? [];
        const bornes = moisBulletinsCouvrant(bulletins, ligne);
        const ajustees = ajusterDatesLignePropagee({
          dateDebutDesiree: dateDebut,
          dateFinDesiree: dateFin,
          moisPremierBulletin: bornes.premier,
          moisDernierBulletin: bornes.dernier,
        });
        const cle = `${ajustees.dateDebut.toISOString()}|${ajustees.dateFin?.toISOString() ?? ''}`;
        const groupe = groupes.get(cle);
        if (groupe !== undefined) {
          groupe.ids.push(ligne.id);
        } else {
          groupes.set(cle, {
            ids: [ligne.id],
            dateDebut: ajustees.dateDebut,
            dateFin: ajustees.dateFin,
          });
        }
      }

      for (const groupe of groupes.values()) {
        await tx.statutParticulierLigne.updateMany({
          where: { id: { in: groupe.ids } },
          data: { dateDebut: groupe.dateDebut, dateFin: groupe.dateFin },
        });
      }
    }

    const emploisDejaCouverts = new Set(existantes.map((l) => l.emploiId));
    const ouverts = await this.listerEmploisOuverts(tx, companyId);
    const aCreer = ouverts.filter((emploi) => !emploisDejaCouverts.has(emploi.id));

    if (aCreer.length === 0) return;

    await tx.statutParticulierLigne.createMany({
      data: aCreer.map((emploi) => ({
        emploiId: emploi.id,
        statutCode: CODE_STATUT_TAHFIZ,
        dateDebut,
        dateFin,
        origine: 'PROPAGE_SOCIETE' as const,
      })),
    });
  }

  private async retirer(
    tx: ClientEcriture,
    companyId: string,
    moisEnCoursSociete: string
  ): Promise<void> {
    const lignes = await tx.statutParticulierLigne.findMany({
      where: {
        statutCode: CODE_STATUT_TAHFIZ,
        origine: 'PROPAGE_SOCIETE',
        emploi: { salarie: { companyId } },
      },
      select: {
        id: true,
        dateDebut: true,
        dateFin: true,
        emploi: { select: { salarieId: true } },
      },
    });

    if (lignes.length === 0) return;

    const salarieIds = [...new Set(lignes.map((l) => l.emploi.salarieId))];
    const bulletinsParSalarie = await this.chargerBulletinsParSalaries(salarieIds);

    const aSupprimer: string[] = [];
    const aInactiver: string[] = [];

    for (const ligne of lignes) {
      const bulletins = bulletinsParSalarie[ligne.emploi.salarieId] ?? [];
      if (ligneUtiliseeParBulletin(bulletins, ligneStatutVersMois(ligne))) {
        aInactiver.push(ligne.id);
      } else {
        aSupprimer.push(ligne.id);
      }
    }

    if (aSupprimer.length > 0) {
      await tx.statutParticulierLigne.deleteMany({ where: { id: { in: aSupprimer } } });
    }

    if (aInactiver.length > 0) {
      await tx.statutParticulierLigne.updateMany({
        where: { id: { in: aInactiver } },
        data: { dateFin: dateFinDepuisMois(moisEnCoursSociete) },
      });
    }
  }

  private async chargerBulletinsParSalaries(
    salarieIds: readonly string[]
  ): Promise<Readonly<Record<string, readonly MoisBulletin[]>>> {
    if (salarieIds.length === 0) {
      return {};
    }
    return this.bulletins.listerBulletinsParSalaries(salarieIds);
  }

  private async listerEmploisOuverts(
    tx: ClientEcriture,
    companyId: string
  ): Promise<readonly { id: string }[]> {
    const emplois = await tx.emploi.findMany({
      where: { salarie: { companyId } },
      select: {
        id: true,
        contratVersions: {
          orderBy: { moisEffet: 'desc' },
          take: 1,
          select: { dateSortie: true },
        },
      },
    });

    return emplois.filter((emploi) => {
      const contrat = emploi.contratVersions[0];
      return contrat !== undefined && emploiEstOuvert(contrat.dateSortie);
    });
  }
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
