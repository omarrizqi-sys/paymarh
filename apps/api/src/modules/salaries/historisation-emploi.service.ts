import { Inject, Injectable } from '@nestjs/common';
import { resoudreLigneHistorique } from '../companies/historisation.js';
import { BULLETIN_PORT, EtatBulletin, type BulletinPort } from './bulletin/bulletin.port.js';
import { moisDepuisDate, type MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';

export type BlocEmploiHistorise = 'CONTRAT' | 'REMUNERATION' | 'AFFECTATION';

export interface DecisionEcritureBloc {
  readonly mode: 'ecraser' | 'versionner';
  readonly moisEffet: string;
  readonly versionId?: string;
}

function bulletinExistePourMois(
  bulletins: readonly { mois: string; etat: EtatBulletin }[],
  mois: string
): boolean {
  return bulletins.some((b) => b.mois === mois && b.etat >= EtatBulletin.CALCULE);
}

@Injectable()
export class HistorisationEmploiService {
  constructor(@Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort) {}

  async deciderEcritureContrat(
    salarieId: string,
    dateDebut: Date,
    moisEnCoursService: MoisEnCoursService,
    versions: readonly { id: string; moisEffet: string }[]
  ): Promise<DecisionEcritureBloc> {
    return this.deciderEcriture(salarieId, dateDebut, moisEnCoursService, versions);
  }

  async deciderEcritureRemuneration(
    salarieId: string,
    dateDebut: Date,
    moisEnCoursService: MoisEnCoursService,
    versions: readonly { id: string; moisEffet: string }[]
  ): Promise<DecisionEcritureBloc> {
    return this.deciderEcriture(salarieId, dateDebut, moisEnCoursService, versions);
  }

  async deciderEcritureAffectation(
    salarieId: string,
    dateDebut: Date,
    moisEnCoursService: MoisEnCoursService,
    versions: readonly { id: string; moisEffet: string }[]
  ): Promise<DecisionEcritureBloc> {
    return this.deciderEcriture(salarieId, dateDebut, moisEnCoursService, versions);
  }

  private async deciderEcriture(
    salarieId: string,
    dateDebut: Date,
    moisEnCoursService: MoisEnCoursService,
    versions: readonly { id: string; moisEffet: string }[]
  ): Promise<DecisionEcritureBloc> {
    const moisPremiere = moisDepuisDate(dateDebut);
    const moisEnCours = await moisEnCoursService.calculerPourSalarie(salarieId);

    if (versions.length === 0) {
      return { mode: 'ecraser', moisEffet: moisPremiere };
    }

    const bulletins = await this.bulletins.listerBulletinsParSalarie(salarieId);
    const moisConcerne = moisEnCours;

    if (!bulletinExistePourMois(bulletins, moisConcerne)) {
      const courante = resoudreLigneHistorique(versions, moisConcerne);
      if (courante !== null) {
        return { mode: 'ecraser', moisEffet: courante.moisEffet, versionId: courante.id };
      }
      const derniere = versions.reduce((a, b) => (a.moisEffet > b.moisEffet ? a : b));
      return { mode: 'ecraser', moisEffet: derniere.moisEffet, versionId: derniere.id };
    }

    const existanteAuMois = versions.find((v) => v.moisEffet === moisConcerne);
    if (existanteAuMois !== undefined) {
      return { mode: 'ecraser', moisEffet: moisConcerne, versionId: existanteAuMois.id };
    }

    return { mode: 'versionner', moisEffet: moisConcerne };
  }
}

export type TransactionClient = Omit<
  import('../../generated/prisma/client.js').PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;
