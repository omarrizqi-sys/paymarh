import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { BULLETIN_PORT, EtatBulletin, type BulletinPort } from '../bulletin/bulletin.port.js';

/** Retire un mois au format AAAA-MM. */
export function moisPrecedent(mois: string): string {
  const [anneeStr, moisStr] = mois.split('-');
  let annee = Number(anneeStr);
  let numMois = Number(moisStr);

  numMois -= 1;
  if (numMois < 1) {
    numMois = 12;
    annee -= 1;
  }

  return `${annee}-${String(numMois).padStart(2, '0')}`;
}

/** Ajoute un mois au format AAAA-MM. */
export function moisSuivant(mois: string): string {
  const [anneeStr, moisStr] = mois.split('-');
  let annee = Number(anneeStr);
  let numMois = Number(moisStr);

  numMois += 1;
  if (numMois > 12) {
    numMois = 1;
    annee += 1;
  }

  return `${annee}-${String(numMois).padStart(2, '0')}`;
}

/** Extrait le mois AAAA-MM d une date civile stockee a minuit UTC. */
export function moisDepuisDate(date: Date): string {
  const annee = date.getUTCFullYear();
  const mois = date.getUTCMonth() + 1;
  return `${annee}-${String(mois).padStart(2, '0')}`;
}

/**
 * Mois calendaire courant au fuseau Africa/Casablanca (instant present).
 * Distinct de moisDepuisDate : ne pas utiliser pour des dates de calendrier stockees.
 */
export function moisCalendaireCourant(reference = new Date()): string {
  const parties = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(reference);

  const annee = parties.find((p) => p.type === 'year')?.value;
  const mois = parties.find((p) => p.type === 'month')?.value;
  if (annee === undefined || mois === undefined) {
    throw new Error('Impossible de determiner le mois calendaire courant (Africa/Casablanca).');
  }

  return `${annee}-${mois}`;
}

function comparerMois(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Calcule le mois en cours d un salarie selon la cascade a trois cas (ADR 0012).
 * Le mois en cours est au niveau salarie, jamais emploi.
 */
@Injectable()
export class MoisEnCoursService {
  constructor(
    @Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort,
    private readonly prisma: PrismaService
  ) {}

  async calculerPourSalarie(salarieId: string, referenceCalendaire = new Date()): Promise<string> {
    const bulletins = await this.bulletins.listerBulletinsParSalarie(salarieId);

    const calculeOuValide = bulletins.filter(
      (b) => b.etat === EtatBulletin.CALCULE || b.etat === EtatBulletin.VALIDE
    );
    if (calculeOuValide.length > 0) {
      const premier = calculeOuValide[0];
      if (premier === undefined) {
        return moisCalendaireCourant(referenceCalendaire);
      }
      let plusRecent = premier.mois;
      for (const bulletin of calculeOuValide) {
        if (comparerMois(bulletin.mois, plusRecent) > 0) {
          plusRecent = bulletin.mois;
        }
      }
      return plusRecent;
    }

    if (bulletins.length > 0) {
      const tousEdites = bulletins.every((b) => b.etat === EtatBulletin.EDITE);
      if (tousEdites) {
        const premier = bulletins[0];
        if (premier === undefined) {
          return moisCalendaireCourant(referenceCalendaire);
        }
        let plusRecent = premier.mois;
        for (const bulletin of bulletins) {
          if (comparerMois(bulletin.mois, plusRecent) > 0) {
            plusRecent = bulletin.mois;
          }
        }
        return moisSuivant(plusRecent);
      }
    }

    const moisEmploiActif = await this.moisDebutEmploiActifPlusAncien(salarieId);
    if (moisEmploiActif !== null) {
      return moisEmploiActif;
    }

    return moisCalendaireCourant(referenceCalendaire);
  }

  private async moisDebutEmploiActifPlusAncien(salarieId: string): Promise<string | null> {
    const emplois = await this.prisma.emploi.findMany({
      where: { salarieId },
      select: {
        contratVersions: {
          orderBy: { moisEffet: 'desc' },
          take: 1,
          select: { dateDebut: true, dateSortie: true },
        },
      },
    });

    const moisDebuts: string[] = [];
    const aujourdhui = new Date();

    for (const emploi of emplois) {
      const version = emploi.contratVersions[0];
      if (version === undefined) continue;

      const sortie = version.dateSortie;
      if (sortie !== null && sortie < aujourdhui) {
        continue;
      }

      moisDebuts.push(moisDepuisDate(version.dateDebut));
    }

    if (moisDebuts.length === 0) {
      return null;
    }

    return moisDebuts.reduce((min, m) => (comparerMois(m, min) < 0 ? m : min));
  }
}
