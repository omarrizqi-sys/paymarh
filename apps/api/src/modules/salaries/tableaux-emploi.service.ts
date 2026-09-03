import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AlerteApi } from '@paymarh/shared-types';
import { Decimal } from 'decimal.js';
import { resoudreLigneHistorique } from '../companies/historisation.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope } from '../../common/tenancy/tenant-scope.js';
import type {
  CreerAvantageEnNatureDto,
  CreerPrimeContractuelleDto,
  CreerStatutParticulierDto,
  ModifierAvantageEnNatureDto,
  ModifierPrimeContractuelleDto,
  ModifierStatutParticulierDto,
} from './dto/tableaux-emploi.dto.js';
import { versDate } from './deductions-emploi.js';
import { ResolutionHeritageService } from './heritage/resolution-heritage.service.js';
import { HistorisationLigneTemporelleService } from './historisation-ligne-temporelle.service.js';
import { INCLUDE_COLLECTIONS_EMPLOI, mapperCollectionsEmploi } from './mappers/tableaux.mapper.js';
import { INCLUDE_EMPLOI_COMPLET, versEmploiComplet } from './mappers/emploi.mapper.js';
import { MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';
import { okEcriture } from './reponses/enveloppe-ecriture.js';
import {
  assertPasChevauchementStatuts,
  collecterAlerteStatutHorsEmploi,
  refuserChampMoisEffetEmploi,
  refuserStatutNonSaisissable,
  ValidationBloquanteTableauEmploiError,
} from './validation-tableaux-emploi.js';
import { VerrouillageOptimisteService } from './verrouillage/verrouillage-optimiste.service.js';

const MESSAGE_NEUTRE = 'Ressource introuvable.';

function parseDateNullable(valeur: string | null | undefined): Date | null {
  if (valeur === undefined) return null;
  if (valeur === null) return null;
  return versDate(valeur);
}

function relancerValidation(erreur: unknown): never {
  if (erreur instanceof ValidationBloquanteTableauEmploiError) {
    throw new BadRequestException({
      code: erreur.code,
      message: erreur.message,
      champ: erreur.champ,
    });
  }
  throw erreur;
}

@Injectable()
export class TableauxEmploiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly moisEnCours: MoisEnCoursService,
    private readonly verrouillage: VerrouillageOptimisteService,
    private readonly historisation: HistorisationLigneTemporelleService,
    private readonly heritage: ResolutionHeritageService
  ) {}

  async creerPrimeContractuelle(
    emploiId: string,
    dto: CreerPrimeContractuelleDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffetEmploi(dto);
    const emploi = await this.trouverEmploi(emploiId);

    await this.prisma.primeContractuelle.create({
      data: {
        emploiId,
        primeRef: dto.primeRef,
        moisApplication: dto.moisApplication,
      },
    });

    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId);
  }

  async modifierPrimeContractuelle(
    emploiId: string,
    ligneId: string,
    dto: ModifierPrimeContractuelleDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffetEmploi(dto);
    await this.trouverPrime(emploiId, ligneId);
    const emploi = await this.trouverEmploi(emploiId);

    const donnees: Record<string, unknown> = {};
    if (dto.primeRef !== undefined) donnees.primeRef = dto.primeRef;
    if (dto.moisApplication !== undefined) donnees.moisApplication = dto.moisApplication;

    await this.prisma.primeContractuelle.update({
      where: { id: ligneId },
      data: donnees,
    });

    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId);
  }

  async supprimerPrimeContractuelle(emploiId: string, ligneId: string, versionAttendue: number) {
    await this.trouverPrime(emploiId, ligneId);
    const emploi = await this.trouverEmploi(emploiId);

    await this.prisma.primeContractuelle.delete({ where: { id: ligneId } });
    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId);
  }

  async creerAvantageEnNature(
    emploiId: string,
    dto: CreerAvantageEnNatureDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffetEmploi(dto);
    const emploi = await this.trouverEmploi(emploiId);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);

    await this.prisma.avantageEnNature.create({
      data: {
        emploiId,
        natureRef: dto.natureRef,
        montant: new Decimal(dto.montant),
        moisApplication: dto.moisApplication,
        moisEffetDebut: moisEnCours,
        moisEffetFin: null,
      },
    });

    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId);
  }

  async modifierAvantageEnNature(
    emploiId: string,
    ligneId: string,
    dto: ModifierAvantageEnNatureDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffetEmploi(dto);
    const existant = await this.trouverAvantage(emploiId, ligneId);
    const emploi = await this.trouverEmploi(emploiId);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);

    const fusion = {
      natureRef: dto.natureRef ?? existant.natureRef,
      montant: dto.montant !== undefined ? new Decimal(dto.montant) : existant.montant,
      moisApplication: dto.moisApplication ?? existant.moisApplication,
    };

    const mode = await this.historisation.deciderModification(emploi.salarieId, moisEnCours);

    if (mode === 'ecraser') {
      await this.prisma.avantageEnNature.update({
        where: { id: ligneId },
        data: fusion,
      });
    } else {
      const moisFin = this.historisation.moisFinClotureLigneRemplacee(moisEnCours);
      await this.prisma.$transaction(async (tx) => {
        await tx.avantageEnNature.update({
          where: { id: ligneId },
          data: { moisEffetFin: moisFin },
        });
        await tx.avantageEnNature.create({
          data: {
            emploiId,
            ...fusion,
            moisEffetDebut: moisEnCours,
            moisEffetFin: null,
          },
        });
      });
    }

    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId);
  }

  async supprimerAvantageEnNature(emploiId: string, ligneId: string, versionAttendue: number) {
    await this.trouverAvantage(emploiId, ligneId);
    const emploi = await this.trouverEmploi(emploiId);

    await this.prisma.avantageEnNature.delete({ where: { id: ligneId } });
    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId);
  }

  async creerStatutParticulier(
    emploiId: string,
    dto: CreerStatutParticulierDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffetEmploi(dto);
    refuserStatutNonSaisissable(dto.statutCode);
    const emploi = await this.trouverEmploi(emploiId);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);
    const contrat = this.contratAuMois(emploi, moisEnCours);

    const dateDebut = versDate(dto.dateDebut);
    const dateFin = parseDateNullable(dto.dateFin);

    const lignes = await this.prisma.statutParticulierLigne.findMany({
      where: { emploiId },
      select: { id: true, dateDebut: true, dateFin: true },
    });

    try {
      assertPasChevauchementStatuts(lignes, { dateDebut, dateFin });
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const alertes: AlerteApi[] = [];
    const alerteIntervalle = collecterAlerteStatutHorsEmploi(
      contrat.dateDebut,
      contrat.dateFin,
      dateDebut,
      dateFin
    );
    if (alerteIntervalle !== null) alertes.push(alerteIntervalle);

    await this.prisma.statutParticulierLigne.create({
      data: {
        emploiId,
        statutCode: dto.statutCode,
        dateDebut,
        dateFin,
        origine: 'SAISIE_MANUELLE',
      },
    });

    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId, alertes);
  }

  async modifierStatutParticulier(
    emploiId: string,
    ligneId: string,
    dto: ModifierStatutParticulierDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffetEmploi(dto);
    refuserStatutNonSaisissable(dto.statutCode);
    const existant = await this.trouverStatut(emploiId, ligneId);
    this.refuserStatutPropage(existant.origine);

    const emploi = await this.trouverEmploi(emploiId);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);
    const contrat = this.contratAuMois(emploi, moisEnCours);

    const dateDebut = dto.dateDebut !== undefined ? versDate(dto.dateDebut) : existant.dateDebut;
    const dateFin = dto.dateFin !== undefined ? parseDateNullable(dto.dateFin) : existant.dateFin;

    const lignes = await this.prisma.statutParticulierLigne.findMany({
      where: { emploiId },
      select: { id: true, dateDebut: true, dateFin: true },
    });

    try {
      assertPasChevauchementStatuts(lignes, { id: ligneId, dateDebut, dateFin });
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const alertes: AlerteApi[] = [];
    const alerteIntervalle = collecterAlerteStatutHorsEmploi(
      contrat.dateDebut,
      contrat.dateFin,
      dateDebut,
      dateFin
    );
    if (alerteIntervalle !== null) alertes.push(alerteIntervalle);

    const donnees: Record<string, unknown> = { dateDebut, dateFin };
    if (dto.statutCode !== undefined) donnees.statutCode = dto.statutCode;

    await this.prisma.statutParticulierLigne.update({
      where: { id: ligneId },
      data: donnees,
    });

    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId, alertes);
  }

  async supprimerStatutParticulier(emploiId: string, ligneId: string, versionAttendue: number) {
    const existant = await this.trouverStatut(emploiId, ligneId);
    this.refuserStatutPropage(existant.origine);

    const emploi = await this.trouverEmploi(emploiId);
    await this.prisma.statutParticulierLigne.delete({ where: { id: ligneId } });
    await this.verrouillage.modifierEmploi({ id: emploiId, versionAttendue, donnees: {} });
    return this.reponseEmploi(emploi.salarieId, emploiId);
  }

  private refuserStatutPropage(origine: string): void {
    if (origine === 'PROPAGE_SOCIETE') {
      throw new ConflictException({
        code: CODES_REPONSE.STATUT_PROPAGE_LECTURE_SEULE.code,
        message: CODES_REPONSE.STATUT_PROPAGE_LECTURE_SEULE.message,
      });
    }
  }

  private contratAuMois(emploi: Awaited<ReturnType<typeof this.chargerEmploi>>, mois: string) {
    const v = resoudreLigneHistorique(emploi.contratVersions, mois);
    if (v === null) throw new Error(`Emploi ${emploi.id} sans version contrat au mois ${mois}`);
    return v;
  }

  private async reponseEmploi(salarieId: string, emploiId: string, alertes: AlerteApi[] = []) {
    const emploi = await this.chargerEmploi(emploiId);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const base = versEmploiComplet(emploi, moisEnCours);
    const collections = mapperCollectionsEmploi(emploi, moisEnCours);
    const resolutions = await this.heritage.resoudrePourEmploi(emploi, moisEnCours);
    return okEcriture({ ...base, ...collections, resolutions }, alertes);
  }

  private async chargerEmploi(id: string) {
    return this.prisma.emploi.findUniqueOrThrow({
      where: { id },
      include: { ...INCLUDE_EMPLOI_COMPLET, ...INCLUDE_COLLECTIONS_EMPLOI },
    });
  }

  private async trouverEmploi(id: string) {
    const ctx = this.tenantContext.getOrThrow();
    const emploi = await this.prisma.emploi.findFirst({
      where: {
        id,
        salarie: { company: accountScope(ctx) },
      },
      include: { ...INCLUDE_EMPLOI_COMPLET, ...INCLUDE_COLLECTIONS_EMPLOI },
    });
    if (emploi === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return emploi;
  }

  private async trouverPrime(emploiId: string, ligneId: string) {
    const ligne = await this.prisma.primeContractuelle.findFirst({
      where: { id: ligneId, emploiId },
    });
    if (ligne === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return ligne;
  }

  private async trouverAvantage(emploiId: string, ligneId: string) {
    const ligne = await this.prisma.avantageEnNature.findFirst({
      where: { id: ligneId, emploiId },
    });
    if (ligne === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return ligne;
  }

  private async trouverStatut(emploiId: string, ligneId: string) {
    const ligne = await this.prisma.statutParticulierLigne.findFirst({
      where: { id: ligneId, emploiId },
    });
    if (ligne === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return ligne;
  }
}
