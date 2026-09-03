import { Inject, Injectable } from '@nestjs/common';
import { resoudreLigneHistorique } from '../../companies/historisation.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  REFERENTIEL_NATIONAL_PORT,
  type ReferentielNationalPort,
} from '../referentiel-national/referentiel-national.port.js';
import {
  assemblerResolutionsEmploi,
  type SnapshotEtablissementHeritage,
  type SnapshotSalarieHeritage,
} from './assembler-resolutions.js';
import type { ResolutionsEmploi } from './niveaux-heritage.js';

interface VersionsEmploiHeritage {
  readonly remunerationVersions: readonly {
    moisEffet: string;
    teletravailIndemniteVersee: boolean | null;
    teletravailMontant: SnapshotSalarieHeritage['teletravailMontant'];
  }[];
  readonly affectationVersions: readonly {
    moisEffet: string;
    etablissementId: string;
    dureeContractuelle: SnapshotSalarieHeritage['dureeContractuelle'];
    reposHebdomadaire: string | null;
    teletravailAutorise: boolean | null;
    repartitionHoraireRef: string | null;
    suivreJoursFeriesEtablissement: boolean;
  }[];
  readonly joursFeriesTravailles?: SnapshotSalarieHeritage['joursFeriesPropres'];
}

@Injectable()
export class ResolutionHeritageService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REFERENTIEL_NATIONAL_PORT) private readonly referentiel: ReferentielNationalPort
  ) {}

  async resoudrePourEmploi(emploi: VersionsEmploiHeritage, mois: string): Promise<ResolutionsEmploi> {
    const [resolutions] = await this.resoudrePourEmplois([emploi], mois);
    return (
      resolutions ??
      assemblerResolutionsEmploi(snapshotVide(), null, { dureeLegaleTravail: null }, mois)
    );
  }

  async resoudrePourEmplois(
    emplois: readonly VersionsEmploiHeritage[],
    mois: string
  ): Promise<ResolutionsEmploi[]> {
    const etabIds = [
      ...new Set(
        emplois.flatMap((emploi) => {
          const affectation = resoudreLigneHistorique(emploi.affectationVersions, mois);
          return affectation === null ? [] : [affectation.etablissementId];
        })
      ),
    ];

    const etablissements =
      etabIds.length === 0
        ? []
        : await this.prisma.etablissement.findMany({
            where: { id: { in: etabIds } },
            select: {
              id: true,
              nom: true,
              parametragesHistoriques: {
                include: {
                  horaireDefautLignes: true,
                  joursFeriesTravailles: true,
                },
              },
            },
          });

    const parEtab = new Map<string, SnapshotEtablissementHeritage | null>();
    for (const etab of etablissements) {
      const ligne = resoudreLigneHistorique(etab.parametragesHistoriques, mois);
      parEtab.set(etab.id, ligne === null ? null : snapshotDepuisLigne(etab.nom, ligne));
    }

    const dureeLegale = await this.referentiel.lireValeur('DUREE_LEGALE_TRAVAIL', mois);

    return emplois.map((emploi) => {
      const affectation = resoudreLigneHistorique(emploi.affectationVersions, mois);
      const remuneration = resoudreLigneHistorique(emploi.remunerationVersions, mois);
      if (affectation === null || remuneration === null) {
        return assemblerResolutionsEmploi(snapshotVide(), null, { dureeLegaleTravail: dureeLegale }, mois);
      }

      const snapshotSalarie: SnapshotSalarieHeritage = {
        dureeContractuelle: affectation.dureeContractuelle,
        reposHebdomadaire: affectation.reposHebdomadaire,
        teletravailAutorise: affectation.teletravailAutorise,
        teletravailIndemniteVersee: remuneration.teletravailIndemniteVersee,
        teletravailMontant: remuneration.teletravailMontant,
        repartitionHoraireRef: affectation.repartitionHoraireRef,
        suivreJoursFeriesEtablissement: affectation.suivreJoursFeriesEtablissement,
        joursFeriesPropres: emploi.joursFeriesTravailles ?? [],
      };

      const etab = parEtab.get(affectation.etablissementId) ?? null;
      return assemblerResolutionsEmploi(snapshotSalarie, etab, { dureeLegaleTravail: dureeLegale }, mois);
    });
  }
}

function snapshotVide(): SnapshotSalarieHeritage {
  return {
    dureeContractuelle: null,
    reposHebdomadaire: null,
    teletravailAutorise: null,
    teletravailIndemniteVersee: null,
    teletravailMontant: null,
    repartitionHoraireRef: null,
    suivreJoursFeriesEtablissement: true,
    joursFeriesPropres: [],
  };
}

function snapshotDepuisLigne(
  nom: string,
  ligne: {
    dureeHebdomadaire: SnapshotEtablissementHeritage['dureeHebdomadaire'];
    jourReposHebdomadaire: string;
    teletravailAutorise: boolean | null;
    indemniteTeletravailVersee: boolean | null;
    montantIndemniteTeletravail: SnapshotEtablissementHeritage['montantIndemniteTeletravail'];
    horaireDefautLignes: SnapshotEtablissementHeritage['horaireDefautLignes'];
    joursFeriesTravailles: readonly { jourFerieId: string }[];
  }
): SnapshotEtablissementHeritage {
  return {
    nom,
    dureeHebdomadaire: ligne.dureeHebdomadaire,
    jourReposHebdomadaire: ligne.jourReposHebdomadaire,
    teletravailAutorise: ligne.teletravailAutorise,
    indemniteTeletravailVersee: ligne.indemniteTeletravailVersee,
    montantIndemniteTeletravail: ligne.montantIndemniteTeletravail,
    horaireDefautLignes: ligne.horaireDefautLignes,
    joursFeriesTravaillesIds: ligne.joursFeriesTravailles.map((j) => j.jourFerieId),
  };
}
