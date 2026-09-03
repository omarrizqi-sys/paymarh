import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AlerteApi } from '@paymarh/shared-types';
import { Decimal } from 'decimal.js';
import { calculerJetonConfirmation, jetonsIdentiques } from '../companies/jeton-confirmation.js';
import { resoudreLigneHistorique } from '../companies/historisation.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope, companyScope } from '../../common/tenancy/tenant-scope.js';
import { BULLETIN_PORT, type BulletinPort } from './bulletin/bulletin.port.js';
import { incrementerCompteurNumeroOrdre } from './compteurs-salarie.js';
import { versDate } from './deductions-emploi.js';
import { emploiEstOuvert } from './deductions-salarie.js';
import type {
  AffectationEmploiSaisieDto,
  ContratEmploiSaisieDto,
  CreerEmploiDto,
  ModifierAffectationEmploiDto,
  ModifierContratEmploiDto,
  ModifierRemunerationEmploiDto,
  RemunerationEmploiSaisieDto,
} from './dto/emploi.dto.js';
import { collecterAlerteReposVsGrille } from './heritage/alerte-c24.js';
import { ResolutionHeritageService } from './heritage/resolution-heritage.service.js';
import { HistorisationEmploiService } from './historisation-emploi.service.js';
import { PropagationTahfizService } from './tahfiz/propagation-tahfiz.service.js';
import {
  INCLUDE_EMPLOI_COMPLET,
  trierEmploisPourFiche,
  versEmploiComplet,
  versVersionsAffectation,
  versVersionsContrat,
  versVersionsRemuneration,
} from './mappers/emploi.mapper.js';
import { INCLUDE_COLLECTIONS_EMPLOI } from './mappers/tableaux.mapper.js';
import { moisDepuisDate, MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';
import {
  REFERENTIEL_NATIONAL_PORT,
  type ReferentielNationalPort,
} from './referentiel-national/referentiel-national.port.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';
import { okEcriture } from './reponses/enveloppe-ecriture.js';
import {
  assertDateFinApresDebut,
  collecterAlerteDureeContractuelleTotale,
  collecterAlerteSalaireSmig,
  collecterAlertesContrat,
  refuserChampMoisEffet,
  ValidationBloquanteEmploiError,
} from './validation-emploi.js';
import { VerrouillageOptimisteService } from './verrouillage/verrouillage-optimiste.service.js';

const MESSAGE_NEUTRE = 'Ressource introuvable.';

function parseDateNullable(valeur: string | null | undefined): Date | null | undefined {
  if (valeur === undefined) return undefined;
  if (valeur === null) return null;
  return versDate(valeur);
}

function relancerValidation(erreur: unknown): never {
  if (erreur instanceof ValidationBloquanteEmploiError) {
    throw new BadRequestException({
      code: erreur.code,
      message: erreur.message,
      champ: erreur.champ,
    });
  }
  throw erreur;
}

@Injectable()
export class EmploisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly moisEnCours: MoisEnCoursService,
    private readonly verrouillage: VerrouillageOptimisteService,
    private readonly historisation: HistorisationEmploiService,
    private readonly heritage: ResolutionHeritageService,
    private readonly tahfiz: PropagationTahfizService,
    @Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort,
    @Inject(REFERENTIEL_NATIONAL_PORT) private readonly referentiel: ReferentielNationalPort
  ) {}

  async creer(salarieId: string, dto: CreerEmploiDto) {
    refuserChampMoisEffet(dto);
    const salarie = await this.trouverSalarie(salarieId);
    await this.verifierEtablissement(salarie.companyId, dto.affectation.etablissementId);

    const dateDebut = versDate(dto.contrat.dateDebut);
    const dateFin = parseDateNullable(dto.contrat.dateFin ?? undefined) ?? null;

    try {
      assertDateFinApresDebut(dateDebut, dateFin);
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const contratCtx = this.contexteContratDepuisSaisie(dto.contrat, dateDebut, dateFin);
    const moisEffet = moisDepuisDate(dateDebut);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const alertes: AlerteApi[] = [
      ...collecterAlertesContrat(contratCtx),
      ...(await this.alertesRemuneration(salarieId, dto.remuneration, null)),
      ...(await this.alertesAffectation(
        salarieId,
        dto.affectation.dureeContractuelle ?? null,
        undefined
      )),
    ];
    const alerteC24 = await this.alerteC24DepuisSaisie(
      {
        remunerationVersions: [
          {
            moisEffet,
            teletravailIndemniteVersee: dto.remuneration.teletravailIndemniteVersee ?? null,
            teletravailMontant:
              dto.remuneration.teletravailMontant !== null &&
              dto.remuneration.teletravailMontant !== undefined
                ? new Decimal(dto.remuneration.teletravailMontant)
                : null,
          },
        ],
        affectationVersions: [
          {
            moisEffet,
            etablissementId: dto.affectation.etablissementId,
            dureeContractuelle:
              dto.affectation.dureeContractuelle !== null &&
              dto.affectation.dureeContractuelle !== undefined
                ? new Decimal(dto.affectation.dureeContractuelle)
                : null,
            reposHebdomadaire: dto.affectation.reposHebdomadaire ?? null,
            teletravailAutorise: dto.affectation.teletravailAutorise ?? null,
            repartitionHoraireRef: dto.affectation.repartitionHoraireRef ?? null,
            suivreJoursFeriesEtablissement: dto.affectation.suivreJoursFeriesEtablissement ?? true,
          },
        ],
        joursFeriesTravailles: [],
      },
      moisEnCours
    );
    if (alerteC24 !== null) alertes.push(alerteC24);

    const montant = new Decimal(dto.remuneration.montant);
    const dateSortieInitiale = parseDateNullable(dto.contrat.dateSortie ?? undefined) ?? null;

    const emploi = await this.prisma.$transaction(async (tx) => {
      const numeroOrdre = await incrementerCompteurNumeroOrdre(tx, salarieId);
      const cree = await tx.emploi.create({
        data: { salarieId, numeroOrdre },
      });

      await tx.emploiContratVersion.create({
        data: this.donneesContrat(dto.contrat, dateDebut, dateFin, moisEffet, cree.id),
      });
      await tx.emploiRemunerationVersion.create({
        data: this.donneesRemuneration(dto.remuneration, montant, moisEffet, cree.id),
      });
      await tx.emploiAffectationVersion.create({
        data: this.donneesAffectation(dto.affectation, moisEffet, cree.id),
      });

      await this.tahfiz.poserSurNouvelEmploi(
        tx,
        salarie.companyId,
        cree.id,
        emploiEstOuvert(dateSortieInitiale)
      );

      return cree;
    });

    const complet = await this.chargerEmploi(emploi.id);
    return okEcriture(await this.avecResolutions(complet, moisEnCours), alertes);
  }

  async lire(id: string) {
    const emploi = await this.trouverEmploi(id);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);
    return { donnees: await this.avecResolutions(emploi, moisEnCours) };
  }

  async listerVersionsContrat(id: string) {
    const emploi = await this.trouverEmploi(id);
    return { donnees: versVersionsContrat(emploi.contratVersions) };
  }

  async listerVersionsRemuneration(id: string) {
    const emploi = await this.trouverEmploi(id);
    return { donnees: versVersionsRemuneration(emploi.remunerationVersions) };
  }

  async listerVersionsAffectation(id: string) {
    const emploi = await this.trouverEmploi(id);
    return { donnees: versVersionsAffectation(emploi.affectationVersions) };
  }

  async modifierContrat(
    id: string,
    dto: ModifierContratEmploiDto,
    versionAttendue: number,
    confirmationJeton?: string
  ) {
    refuserChampMoisEffet(dto);
    const emploi = await this.trouverEmploi(id);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);
    const contratCourant = this.contratAuMois(emploi, moisEnCours);
    const dateDebut =
      dto.dateDebut !== undefined ? versDate(dto.dateDebut) : contratCourant.dateDebut;
    const dateFin =
      dto.dateFin !== undefined ? (parseDateNullable(dto.dateFin) ?? null) : contratCourant.dateFin;

    try {
      assertDateFinApresDebut(dateDebut, dateFin);
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const dateSortieAvant = contratCourant.dateSortie;
    const dateSortieApres =
      dto.dateSortie !== undefined ? (parseDateNullable(dto.dateSortie) ?? null) : dateSortieAvant;

    if (dateSortieAvant === null && dateSortieApres !== null) {
      this.exigerConfirmationSortie(id, dateSortieApres, confirmationJeton);
    }

    const contratFusionne = {
      libellePoste: dto.libellePoste ?? contratCourant.libellePoste,
      dateDebut,
      dateFin,
      typeContratCode: dto.typeContratCode ?? contratCourant.typeContratCode,
      periodeEssaiDateFin:
        dto.periodeEssaiDateFin !== undefined
          ? (parseDateNullable(dto.periodeEssaiDateFin) ?? null)
          : contratCourant.periodeEssaiDateFin,
      renouvellementEssaiDateFin:
        dto.renouvellementEssaiDateFin !== undefined
          ? (parseDateNullable(dto.renouvellementEssaiDateFin) ?? null)
          : contratCourant.renouvellementEssaiDateFin,
      statutCadre: dto.statutCadre !== undefined ? dto.statutCadre : contratCourant.statutCadre,
      coefficient: dto.coefficient !== undefined ? dto.coefficient : contratCourant.coefficient,
      position: dto.position !== undefined ? dto.position : contratCourant.position,
      indice: dto.indice !== undefined ? dto.indice : contratCourant.indice,
      dateSortie: dateSortieApres,
      motifSortieCode:
        dto.motifSortieCode !== undefined ? dto.motifSortieCode : contratCourant.motifSortieCode,
    };

    const alertes = collecterAlertesContrat({
      dateDebut: contratFusionne.dateDebut,
      dateFin: contratFusionne.dateFin,
      dateSortie: contratFusionne.dateSortie,
      periodeEssaiDateFin: contratFusionne.periodeEssaiDateFin,
      renouvellementEssaiDateFin: contratFusionne.renouvellementEssaiDateFin,
    });

    const decision = await this.historisation.deciderEcritureContrat(
      emploi.salarieId,
      this.dateDebutOriginale(emploi),
      this.moisEnCours,
      emploi.contratVersions
    );

    await this.prisma.$transaction(async (tx) => {
      if (decision.mode === 'ecraser' && decision.versionId !== undefined) {
        await tx.emploiContratVersion.update({
          where: { id: decision.versionId },
          data: {
            libellePoste: contratFusionne.libellePoste,
            dateDebut: contratFusionne.dateDebut,
            dateFin: contratFusionne.dateFin,
            typeContratCode: contratFusionne.typeContratCode,
            periodeEssaiDateFin: contratFusionne.periodeEssaiDateFin,
            renouvellementEssaiDateFin: contratFusionne.renouvellementEssaiDateFin,
            statutCadre: contratFusionne.statutCadre,
            coefficient: contratFusionne.coefficient,
            position: contratFusionne.position,
            indice: contratFusionne.indice,
            dateSortie: contratFusionne.dateSortie,
            motifSortieCode: contratFusionne.motifSortieCode,
          },
        });
      } else {
        await tx.emploiContratVersion.create({
          data: {
            emploiId: id,
            moisEffet: decision.moisEffet,
            libellePoste: contratFusionne.libellePoste,
            dateDebut: contratFusionne.dateDebut,
            dateFin: contratFusionne.dateFin,
            typeContratCode: contratFusionne.typeContratCode,
            periodeEssaiDateFin: contratFusionne.periodeEssaiDateFin,
            renouvellementEssaiDateFin: contratFusionne.renouvellementEssaiDateFin,
            statutCadre: contratFusionne.statutCadre,
            coefficient: contratFusionne.coefficient,
            position: contratFusionne.position,
            indice: contratFusionne.indice,
            dateSortie: contratFusionne.dateSortie,
            motifSortieCode: contratFusionne.motifSortieCode,
          },
        });
      }
    });

    await this.verrouillage.modifierEmploi({ id, versionAttendue, donnees: {} });

    const complet = await this.chargerEmploi(id);
    return okEcriture(await this.avecResolutions(complet, moisEnCours), alertes);
  }

  async modifierRemuneration(
    id: string,
    dto: ModifierRemunerationEmploiDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffet(dto);
    const emploi = await this.trouverEmploi(id);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);
    const courante = this.remunerationAuMois(emploi, moisEnCours);

    const montant = dto.montant !== undefined ? new Decimal(dto.montant) : courante.montant;

    const alertes = await this.alertesRemuneration(
      emploi.salarieId,
      {
        modeDeterminationSalaire: dto.modeDeterminationSalaire ?? courante.modeDeterminationSalaire,
        montant: montant.toString(),
      },
      id
    );

    const decision = await this.historisation.deciderEcritureRemuneration(
      emploi.salarieId,
      this.dateDebutOriginale(emploi),
      this.moisEnCours,
      emploi.remunerationVersions
    );

    const fusion = {
      modeDeterminationSalaire: dto.modeDeterminationSalaire ?? courante.modeDeterminationSalaire,
      montant,
      masquerNombreHeures: dto.masquerNombreHeures ?? courante.masquerNombreHeures,
      masquerTauxHoraire: dto.masquerTauxHoraire ?? courante.masquerTauxHoraire,
      bulletinTousLesMois: dto.bulletinTousLesMois ?? courante.bulletinTousLesMois,
      moisProduction: dto.moisProduction ?? courante.moisProduction,
      modePaiement: dto.modePaiement !== undefined ? dto.modePaiement : courante.modePaiement,
      compteBancaireId:
        dto.compteBancaireId !== undefined ? dto.compteBancaireId : courante.compteBancaireId,
      teletravailIndemniteVersee:
        dto.teletravailIndemniteVersee !== undefined
          ? dto.teletravailIndemniteVersee
          : courante.teletravailIndemniteVersee,
      teletravailMontant:
        dto.teletravailMontant !== undefined
          ? dto.teletravailMontant !== null
            ? new Decimal(dto.teletravailMontant)
            : null
          : courante.teletravailMontant,
    };

    await this.prisma.$transaction(async (tx) => {
      if (decision.mode === 'ecraser' && decision.versionId !== undefined) {
        await tx.emploiRemunerationVersion.update({
          where: { id: decision.versionId },
          data: fusion,
        });
      } else {
        await tx.emploiRemunerationVersion.create({
          data: { emploiId: id, moisEffet: decision.moisEffet, ...fusion },
        });
      }
    });

    await this.verrouillage.modifierEmploi({ id, versionAttendue, donnees: {} });

    const complet = await this.chargerEmploi(id);
    return okEcriture(await this.avecResolutions(complet, moisEnCours), alertes);
  }

  async modifierAffectation(
    id: string,
    dto: ModifierAffectationEmploiDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffet(dto);
    const emploi = await this.trouverEmploi(id);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(emploi.salarieId);
    const courante = this.affectationAuMois(emploi, moisEnCours);

    if (dto.etablissementId !== undefined) {
      const salarie = await this.trouverSalarie(emploi.salarieId);
      await this.verifierEtablissement(salarie.companyId, dto.etablissementId);
    }

    const dureeFusionnee =
      dto.dureeContractuelle !== undefined
        ? dto.dureeContractuelle !== null
          ? new Decimal(dto.dureeContractuelle)
          : null
        : courante.dureeContractuelle;

    const alertes = await this.alertesAffectation(
      emploi.salarieId,
      dureeFusionnee?.toString() ?? null,
      id
    );

    const decision = await this.historisation.deciderEcritureAffectation(
      emploi.salarieId,
      this.dateDebutOriginale(emploi),
      this.moisEnCours,
      emploi.affectationVersions
    );

    const fusion = {
      etablissementId: dto.etablissementId ?? courante.etablissementId,
      departementRef:
        dto.departementRef !== undefined ? dto.departementRef : courante.departementRef,
      serviceRef: dto.serviceRef !== undefined ? dto.serviceRef : courante.serviceRef,
      baseSaisieDuree: dto.baseSaisieDuree ?? courante.baseSaisieDuree,
      dureeContractuelle: dureeFusionnee,
      repartitionHoraireRef:
        dto.repartitionHoraireRef !== undefined
          ? dto.repartitionHoraireRef
          : courante.repartitionHoraireRef,
      reposHebdomadaire:
        dto.reposHebdomadaire !== undefined ? dto.reposHebdomadaire : courante.reposHebdomadaire,
      suivreJoursFeriesEtablissement:
        dto.suivreJoursFeriesEtablissement ?? courante.suivreJoursFeriesEtablissement,
      teletravailAutorise:
        dto.teletravailAutorise !== undefined
          ? dto.teletravailAutorise
          : courante.teletravailAutorise,
    };

    const alerteC24 = await this.alerteC24DepuisSaisie(
      {
        remunerationVersions: emploi.remunerationVersions,
        affectationVersions: emploi.affectationVersions.map((v) =>
          v.id === courante.id ? { ...v, ...fusion } : v
        ),
        joursFeriesTravailles: emploi.joursFeriesTravailles,
      },
      moisEnCours
    );
    if (alerteC24 !== null) alertes.push(alerteC24);

    await this.prisma.$transaction(async (tx) => {
      if (decision.mode === 'ecraser' && decision.versionId !== undefined) {
        await tx.emploiAffectationVersion.update({
          where: { id: decision.versionId },
          data: fusion,
        });
      } else {
        await tx.emploiAffectationVersion.create({
          data: { emploiId: id, moisEffet: decision.moisEffet, ...fusion },
        });
      }
    });

    await this.verrouillage.modifierEmploi({ id, versionAttendue, donnees: {} });

    const complet = await this.chargerEmploi(id);
    return okEcriture(await this.avecResolutions(complet, moisEnCours), alertes);
  }

  async supprimer(id: string, versionAttendue: number) {
    await this.trouverEmploi(id);
    const bulletins = await this.bulletins.listerBulletinsParEmploi(id);
    if (bulletins.length > 0) {
      throw new ConflictException({
        code: CODES_REPONSE.SUPPRESSION_INTERDITE.code,
        message: CODES_REPONSE.SUPPRESSION_INTERDITE.message,
      });
    }

    const { count } = await this.prisma.emploi.deleteMany({
      where: { id, version: versionAttendue },
    });
    if (count === 0) {
      const encoreLa = await this.prisma.emploi.findUnique({ where: { id } });
      if (encoreLa !== null) {
        throw new ConflictException({
          code: CODES_REPONSE.CONFLIT_VERSION.code,
          message: CODES_REPONSE.CONFLIT_VERSION.message,
        });
      }
      throw new NotFoundException(MESSAGE_NEUTRE);
    }

    return okEcriture({ id });
  }

  async listerEmploisPourFicheSalarie(salarieId: string, moisEnCours: string) {
    const emplois = await this.prisma.emploi.findMany({
      where: { salarieId },
      include: { ...INCLUDE_EMPLOI_COMPLET, ...INCLUDE_COLLECTIONS_EMPLOI },
    });
    const resolutions = await this.heritage.resoudrePourEmplois(emplois, moisEnCours);
    return trierEmploisPourFiche(
      emplois.map((e, index) => ({
        ...versEmploiComplet(e, moisEnCours),
        resolutions: resolutions[index],
      }))
    );
  }

  private async avecResolutions(
    emploi: Awaited<ReturnType<typeof this.chargerEmploi>>,
    moisEnCours: string
  ) {
    const resolutions = await this.heritage.resoudrePourEmploi(emploi, moisEnCours);
    return { ...versEmploiComplet(emploi, moisEnCours), resolutions };
  }

  private async alerteC24DepuisSaisie(
    emploi: Parameters<ResolutionHeritageService['resoudrePourEmploi']>[0],
    mois: string
  ): Promise<AlerteApi | null> {
    const resolutions = await this.heritage.resoudrePourEmploi(emploi, mois);
    return collecterAlerteReposVsGrille(
      resolutions.reposHebdomadaire?.valeur ?? null,
      resolutions.grilleHoraire?.valeur ?? null
    );
  }

  private exigerConfirmationSortie(
    emploiId: string,
    dateSortie: Date,
    confirmationJeton: string | undefined
  ): void {
    const inventaire = {
      emploiId,
      dateSortie: dateSortie.toISOString().slice(0, 10),
    };

    if (confirmationJeton === undefined || confirmationJeton.trim().length === 0) {
      throw new ConflictException({
        code: CODES_REPONSE.CONFIRMATION_REQUISE.code,
        message: CODES_REPONSE.CONFIRMATION_REQUISE.message,
        jetonConfirmation: calculerJetonConfirmation(inventaire),
      });
    }

    const attendu = calculerJetonConfirmation(inventaire);
    if (!jetonsIdentiques(attendu, confirmationJeton)) {
      throw new ConflictException({
        code: CODES_REPONSE.CONFIRMATION_OBSOLETE.code,
        message: CODES_REPONSE.CONFIRMATION_OBSOLETE.message,
      });
    }
  }

  private async alertesRemuneration(
    salarieId: string,
    saisie: Pick<RemunerationEmploiSaisieDto, 'modeDeterminationSalaire' | 'montant'>,
    exclureEmploiId: string | null
  ): Promise<AlerteApi[]> {
    void exclureEmploiId;
    const mois = await this.moisEnCours.calculerPourSalarie(salarieId);
    const alertes: AlerteApi[] = [];
    const smig = await collecterAlerteSalaireSmig(
      this.referentiel,
      mois,
      new Decimal(saisie.montant)
    );
    if (smig !== null) alertes.push(smig);
    return alertes;
  }

  private async alertesAffectation(
    salarieId: string,
    dureeContractuelle: string | null,
    exclureEmploiId: string | undefined
  ): Promise<AlerteApi[]> {
    const mois = await this.moisEnCours.calculerPourSalarie(salarieId);
    const duree =
      dureeContractuelle !== null && dureeContractuelle.length > 0
        ? new Decimal(dureeContractuelle)
        : null;
    const alerte = await collecterAlerteDureeContractuelleTotale(
      this.prisma,
      this.referentiel,
      salarieId,
      mois,
      duree,
      exclureEmploiId
    );
    return alerte !== null ? [alerte] : [];
  }

  private contexteContratDepuisSaisie(
    dto: ContratEmploiSaisieDto,
    dateDebut: Date,
    dateFin: Date | null
  ) {
    return {
      dateDebut,
      dateFin,
      dateSortie: parseDateNullable(dto.dateSortie ?? undefined) ?? null,
      periodeEssaiDateFin: parseDateNullable(dto.periodeEssaiDateFin) ?? null,
      renouvellementEssaiDateFin: parseDateNullable(dto.renouvellementEssaiDateFin) ?? null,
    };
  }

  private donneesContrat(
    dto: ContratEmploiSaisieDto,
    dateDebut: Date,
    dateFin: Date | null,
    moisEffet: string,
    emploiId: string
  ) {
    return {
      emploiId,
      moisEffet,
      libellePoste: dto.libellePoste,
      dateDebut,
      dateFin,
      typeContratCode: dto.typeContratCode,
      periodeEssaiDateFin: parseDateNullable(dto.periodeEssaiDateFin) ?? null,
      renouvellementEssaiDateFin: parseDateNullable(dto.renouvellementEssaiDateFin) ?? null,
      statutCadre: dto.statutCadre ?? null,
      coefficient: dto.coefficient ?? null,
      position: dto.position ?? null,
      indice: dto.indice ?? null,
      dateSortie: parseDateNullable(dto.dateSortie ?? undefined) ?? null,
      motifSortieCode: dto.motifSortieCode ?? null,
    };
  }

  private donneesRemuneration(
    dto: RemunerationEmploiSaisieDto,
    montant: Decimal,
    moisEffet: string,
    emploiId: string
  ) {
    return {
      emploiId,
      moisEffet,
      modeDeterminationSalaire: dto.modeDeterminationSalaire,
      montant,
      masquerNombreHeures: dto.masquerNombreHeures ?? false,
      masquerTauxHoraire: dto.masquerTauxHoraire ?? false,
      bulletinTousLesMois: dto.bulletinTousLesMois ?? true,
      moisProduction: dto.moisProduction ?? [],
      modePaiement: dto.modePaiement ?? null,
      compteBancaireId: dto.compteBancaireId ?? null,
      teletravailIndemniteVersee: dto.teletravailIndemniteVersee ?? null,
      teletravailMontant:
        dto.teletravailMontant !== null && dto.teletravailMontant !== undefined
          ? new Decimal(dto.teletravailMontant)
          : null,
    };
  }

  private donneesAffectation(dto: AffectationEmploiSaisieDto, moisEffet: string, emploiId: string) {
    return {
      emploiId,
      moisEffet,
      etablissementId: dto.etablissementId,
      departementRef: dto.departementRef ?? null,
      serviceRef: dto.serviceRef ?? null,
      baseSaisieDuree: dto.baseSaisieDuree,
      dureeContractuelle:
        dto.dureeContractuelle !== null && dto.dureeContractuelle !== undefined
          ? new Decimal(dto.dureeContractuelle)
          : null,
      repartitionHoraireRef: dto.repartitionHoraireRef ?? null,
      reposHebdomadaire: dto.reposHebdomadaire ?? null,
      suivreJoursFeriesEtablissement: dto.suivreJoursFeriesEtablissement ?? true,
      teletravailAutorise: dto.teletravailAutorise ?? null,
    };
  }

  private dateDebutOriginale(emploi: Awaited<ReturnType<typeof this.chargerEmploi>>): Date {
    const premiere = emploi.contratVersions.reduce((a, b) => (a.moisEffet <= b.moisEffet ? a : b));
    return premiere.dateDebut;
  }

  private contratAuMois(emploi: Awaited<ReturnType<typeof this.chargerEmploi>>, mois: string) {
    const v = resoudreLigneHistorique(emploi.contratVersions, mois);
    if (v === null) throw new Error(`Emploi ${emploi.id} sans version contrat au mois ${mois}`);
    return v;
  }

  private remunerationAuMois(emploi: Awaited<ReturnType<typeof this.chargerEmploi>>, mois: string) {
    const v = resoudreLigneHistorique(emploi.remunerationVersions, mois);
    if (v === null)
      throw new Error(`Emploi ${emploi.id} sans version remuneration au mois ${mois}`);
    return v;
  }

  private affectationAuMois(emploi: Awaited<ReturnType<typeof this.chargerEmploi>>, mois: string) {
    const v = resoudreLigneHistorique(emploi.affectationVersions, mois);
    if (v === null) throw new Error(`Emploi ${emploi.id} sans version affectation au mois ${mois}`);
    return v;
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

  private async trouverSalarie(id: string) {
    const { companyId, accountId } = companyScope(this.tenantContext.getOrThrow());
    const salarie = await this.prisma.salarie.findFirst({
      where: { id, companyId, company: { accountId } },
      select: { id: true, companyId: true },
    });
    if (salarie === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return salarie;
  }

  private async verifierEtablissement(companyId: string, etablissementId: string) {
    const etab = await this.prisma.etablissement.findFirst({
      where: { id: etablissementId, companyId },
      select: { id: true },
    });
    if (etab === null) throw new NotFoundException(MESSAGE_NEUTRE);
  }
}
